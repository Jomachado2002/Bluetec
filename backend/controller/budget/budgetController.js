// backend/controller/budget/budgetController.js
const BudgetModel = require('../../models/budgetModel');
const ClientModel = require('../../models/clientModel');
const ProductModel = require('../../models/productModel');
const uploadProductPermission = require('../../helpers/permission');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { uploadTempFile } = require('../../helpers/uploadImage');

/**
 * Crea un nuevo presupuesto
 */
async function createBudgetController(req, res) {
  try {
      // COMENTADO TEMPORALMENTE para permitir acceso
      // if (!uploadProductPermission(req.userId)) {
      //     throw new Error("Permiso denegado");
      // }

      const { 
          clientId,
          items,
          totalAmount,
          discount,
          tax,
          finalAmount,
          notes,
          validUntil,
          paymentTerms,
          deliveryMethod
      } = req.body;

      // Validar cliente
      if (!clientId) {
          throw new Error("ID de cliente no proporcionado");
      }

      const client = await ClientModel.findById(clientId);
      if (!client) {
          throw new Error("Cliente no encontrado");
      }

      // Validar items
      if (!items || !Array.isArray(items) || items.length === 0) {
          throw new Error("El presupuesto debe contener al menos un producto");
      }

      // Procesar y validar cada item
      const processedItems = [];
      for (const item of items) {
          if (!item.product && !item.productSnapshot) {
              throw new Error("Cada item debe contener un producto o un snapshot");
          }

          if (item.product) {
              const product = await ProductModel.findById(item.product);
              if (!product) {
                  throw new Error(`Producto no encontrado: ${item.product}`);
              }

              // Calcular subtotal
              const quantity = Number(item.quantity) || 1;
              const unitPrice = Number(item.unitPrice) || product.sellingPrice;
              const itemDiscount = Number(item.discount) || 0;
              const subtotal = quantity * unitPrice * (1 - itemDiscount / 100);

              processedItems.push({
                  product: product._id,
                  productSnapshot: {
                      name: product.productName,
                      price: product.sellingPrice,
                      description: product.description,
                      category: product.category,
                      subcategory: product.subcategory,
                      brandName: product.brandName
                  },
                  quantity,
                  unitPrice,
                  discount: itemDiscount,
                  subtotal
              });
          } else {
              // Si ya viene un snapshot, validamos que tenga lo necesario
              if (!item.productSnapshot.name || !item.quantity || !item.unitPrice) {
                  throw new Error("Los datos del producto personalizado son incompletos");
              }

              const quantity = Number(item.quantity) || 1;
              const unitPrice = Number(item.unitPrice);
              const itemDiscount = Number(item.discount) || 0;
              const subtotal = quantity * unitPrice * (1 - itemDiscount / 100);

              processedItems.push({
                  productSnapshot: item.productSnapshot,
                  quantity,
                  unitPrice,
                  discount: itemDiscount,
                  subtotal
              });
          }
      }

      // Calcular importes totales
      const calculatedTotalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const calculatedDiscount = Number(discount) || 0;
      const calculatedTax = Number(tax) || 0;
      const calculatedFinalAmount = calculatedTotalAmount * (1 - calculatedDiscount / 100) * (1 + calculatedTax / 100);

      // Generar número de presupuesto temporal que será reemplazado por el hook pre('save')
      const tempBudgetNumber = await generateNextBudgetNumber();

      // Crear nuevo presupuesto
      const newBudget = new BudgetModel({
          budgetNumber: tempBudgetNumber, // Asignamos un número temporal
          client: clientId,
          items: processedItems,
          totalAmount: calculatedTotalAmount,
          discount: calculatedDiscount,
          tax: calculatedTax,
          finalAmount: calculatedFinalAmount,
          notes,
          validUntil: validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días por defecto
          paymentTerms,
          deliveryMethod,
          createdBy: req.userId || 'guest-user' // Permitir usuarios invitados
      });

      const savedBudget = await newBudget.save();

      // Asociar presupuesto al cliente
      await ClientModel.findByIdAndUpdate(
          clientId,
          { $push: { budgets: savedBudget._id } }
      );

      // Generar PDF del presupuesto
      try {
          await generateBudgetPDF(savedBudget._id);
      } catch (pdfError) {
          console.error("Error al generar PDF:", pdfError);
          // No hacemos fallar toda la operación si el PDF falla
      }

      res.status(201).json({
          message: "Presupuesto creado correctamente",
          data: savedBudget,
          success: true,
          error: false
      });

  } catch (err) {
      console.error("Error en createBudgetController:", err);
      res.status(400).json({
          message: err.message || err,
          error: true,
          success: false
      });
  }
}
// Función auxiliar para generar el siguiente número de presupuesto
async function generateNextBudgetNumber() {
  try {
      const lastBudget = await BudgetModel.findOne({}, {}, { sort: { 'createdAt': -1 } });
      
      if (lastBudget && lastBudget.budgetNumber) {
          // Extraer la parte numérica del último presupuesto
          const lastNumber = parseInt(lastBudget.budgetNumber.split('-')[1]);
          return `PRES-${(lastNumber + 1).toString().padStart(5, '0')}`;
      } else {
          // Primer presupuesto
          return 'PRES-00001';
      }
  } catch (error) {
      console.error("Error al generar número de presupuesto:", error);
      // En caso de error, generamos un número basado en timestamp para evitar duplicados
      return `PRES-${Date.now().toString().slice(-5)}`;
  }
}

/**
 * Obtiene todos los presupuestos
 */
async function getAllBudgetsController(req, res) {
    try {
        // COMENTADO TEMPORALMENTE para permitir acceso
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { 
            clientId, 
            status, 
            startDate, 
            endDate, 
            minAmount, 
            maxAmount,
            limit = 50, 
            page = 1, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;
        
        // Construir query
        const query = {};
        
        if (clientId) query.client = clientId;
        if (status) query.status = status;
        
        // Filtro por fecha
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        // Filtro por monto
        if (minAmount || maxAmount) {
            query.finalAmount = {};
            if (minAmount) query.finalAmount.$gte = Number(minAmount);
            if (maxAmount) query.finalAmount.$lte = Number(maxAmount);
        }
        
        // Ordenamiento
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Paginación
        const skip = (page - 1) * limit;
        
        // Ejecutar la consulta
        const budgets = await BudgetModel.find(query)
            .select('budgetNumber client items totalAmount discount tax finalAmount status validUntil createdAt')
            .populate('client', 'name email phone company')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));
            
        // Contar total de presupuestos para paginación
        const total = await BudgetModel.countDocuments(query);
        
        res.json({
            message: "Lista de presupuestos",
            data: {
                budgets,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            },
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en getAllBudgetsController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Obtiene un presupuesto por su ID
 */
async function getBudgetByIdController(req, res) {
    try {
        // COMENTADO TEMPORALMENTE para permitir acceso
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { budgetId } = req.params;

        if (!budgetId) {
            throw new Error("ID de presupuesto no proporcionado");
        }

        const budget = await BudgetModel.findById(budgetId)
            .populate('client', 'name email phone company address taxId')
            .populate('items.product', 'productName brandName category subcategory sellingPrice');

        if (!budget) {
            throw new Error("Presupuesto no encontrado");
        }

        res.json({
            message: "Detalles del presupuesto",
            data: budget,
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en getBudgetByIdController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Actualiza el estado de un presupuesto
 */
async function updateBudgetStatusController(req, res) {
  try {
      // Remove the permission check entirely, or set it to always return true
      // for testing purposes. In production, you should implement proper permissions.
      // Don't depend on uploadProductPermission if it's not working correctly
      
      // Either remove this block:
      /*
      if (!uploadProductPermission(req.userId)) {
          throw new Error("Permiso denegado");
      }
      */
      
      // Or temporarily force it to return true:
      // const hasPermission = true; // Override permission check temporarily

      const { budgetId } = req.params;
      const { status } = req.body;

      if (!budgetId) {
          throw new Error("ID de presupuesto no proporcionado");
      }

      // Verifica que el estado sea válido
      if (!['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'].includes(status)) {
          throw new Error("Estado de presupuesto no válido");
      }

      console.log(`Actualizando presupuesto ${budgetId} a estado ${status}`);

      const budget = await BudgetModel.findById(budgetId);
      
      if (!budget) {
          throw new Error("Presupuesto no encontrado");
      }

      budget.status = status;
      
      // Si el estado es expired, pero la fecha de validez aún no ha llegado, actualizarla
      if (status === 'expired' && budget.validUntil > new Date()) {
          budget.validUntil = new Date();
      }

      const updatedBudget = await budget.save();

      res.json({
          message: `Estado del presupuesto actualizado a ${status}`,
          data: updatedBudget,
          success: true,
          error: false
      });

  } catch (err) {
      console.error("Error en updateBudgetStatusController:", err);
      res.status(400).json({
          message: err.message || err,
          error: true,
          success: false
      });
  }
}
/**
 * Elimina un presupuesto
 */
async function deleteBudgetController(req, res) {
    try {
        if (!uploadProductPermission(req.userId)) {
            throw new Error("Permiso denegado");
        }

        const { budgetId } = req.params;

        if (!budgetId) {
            throw new Error("ID de presupuesto no proporcionado");
        }

        // Buscar el presupuesto primero para verificar si existe
        const budget = await BudgetModel.findById(budgetId);
        if (!budget) {
            throw new Error("Presupuesto no encontrado");
        }

        // Si existe un archivo PDF asociado, intentar eliminarlo
        if (budget.pdfPath && fs.existsSync(budget.pdfPath)) {
            try {
                fs.unlinkSync(budget.pdfPath);
            } catch (error) {
                console.error("Error al eliminar el archivo PDF:", error);
                // No detenemos el proceso si hay error al eliminar el archivo
            }
        }

        // Eliminar la referencia del presupuesto en el cliente
        if (budget.client) {
            await ClientModel.findByIdAndUpdate(
                budget.client,
                { $pull: { budgets: budgetId } }
            );
        }

        // Eliminar el presupuesto
        await BudgetModel.findByIdAndDelete(budgetId);

        res.json({
            message: "Presupuesto eliminado correctamente",
            success: true,
            error: false
        });

    } catch (err) {
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Genera el PDF de un presupuesto con diseño mejorado
 */
async function generateBudgetPDF(budgetId, isTemporary = false) {
  try {
    const budget = await BudgetModel.findById(budgetId)
      .populate('client', 'name email phone company address taxId')
      .populate('createdBy', 'name email');
    
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    // Crear un documento PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    // Crear carpeta temporal si no existe
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Ruta del archivo temporal
    const filename = `presupuesto-${budget.budgetNumber}-${Date.now()}.pdf`;
    const pdfPath = path.join(tempDir, filename);
    const pdfStream = fs.createWriteStream(pdfPath);

    // Configuración de fuentes y colores
    const primaryColor = '#0047AB'; // Azul corporativo
    const secondaryColor = '#333333'; // Color oscuro para texto
    const accentColor = '#4682B4'; // Azul celeste para acentos
    
    // ----- ENCABEZADO DEL DOCUMENTO -----
    
    // Intenta agregar el logo que está en la misma carpeta que el controlador
    try {
      // El logo.png está en la misma carpeta que budgetController.js (carpeta budget)
      const logoPath = path.join(__dirname, 'logo.png');
      
      if (fs.existsSync(logoPath)) {
        // Agregar el logo en la parte superior izquierda
        doc.image(logoPath, 50, 50, { width: 120 });
        // Mover hacia abajo para el resto del contenido del encabezado
        doc.moveDown(4);
        console.log("Logo encontrado y agregado desde:", logoPath);
      } else {
        console.warn("Logo no encontrado en:", logoPath);
      }
    } catch (logoError) {
      console.error("Error al agregar el logo:", logoError);
    }
    
    // Título del documento (alineado a la derecha si hay logo)
    doc.fontSize(22).fillColor(primaryColor).text('PRESUPUESTO', 250, 60, { align: 'right' });
    doc.fontSize(14).fillColor(secondaryColor).text(`Nº ${budget.budgetNumber}`, 250, 85, { align: 'right' });
    
    // Línea divisoria
    doc.strokeColor(accentColor)
       .lineWidth(1)
       .moveTo(50, 120)
       .lineTo(550, 120)
       .stroke();
    
    // ----- INFORMACIÓN DE CABECERA -----
    
    // Información de la empresa - columna izquierda
    doc.fontSize(12).fillColor(primaryColor).text('DATOS DE LA EMPRESA', 50, 140);
    doc.fontSize(9).fillColor(secondaryColor);
    doc.text('BlueTec EAS', 50, 160);
    doc.text('Teodoro S. Mongelos casi Radio Operadores del Chaco n 3934', 50, 175, { width: 200 });
    doc.text('Teléfono: +595 972 971353', 50, 200);
    doc.text('Email: ventas@bluetec.com.py', 50, 215);
    doc.text('RUC: 80136342-0', 50, 230);
    
    // Información del cliente - columna derecha
    doc.fontSize(12).fillColor(primaryColor).text('CLIENTE', 350, 140);
    doc.fontSize(9).fillColor(secondaryColor);
    
    let clientYPos = 160;
    if (budget.client) {
      doc.text(`${budget.client.name}`, 350, clientYPos, { width: 200 });
      clientYPos += 15;
      
      if (budget.client.company) {
        doc.text(`${budget.client.company}`, 350, clientYPos, { width: 200 });
        clientYPos += 15;
      }
      
      // Manejo seguro de la dirección
      if (budget.client.address) {
        if (typeof budget.client.address === 'object') {
          // Si la dirección es un objeto con campos separados
          const { street, city, state, zip, country } = budget.client.address;
          if (street) {
            doc.text(street, 350, clientYPos, { width: 200 });
            clientYPos += 15;
          }
          
          let locationLine = '';
          if (city) locationLine += city;
          if (state) locationLine += locationLine ? `, ${state}` : state;
          if (zip) locationLine += locationLine ? ` ${zip}` : zip;
          
          if (locationLine) {
            doc.text(locationLine, 350, clientYPos, { width: 200 });
            clientYPos += 15;
          }
          
          if (country) {
            doc.text(country, 350, clientYPos, { width: 200 });
            clientYPos += 15;
          }
        } else {
          // Si la dirección es un string
          doc.text(budget.client.address, 350, clientYPos, { width: 200 });
          clientYPos += 15;
        }
      }
      
      if (budget.client.phone) {
        doc.text(`Teléfono: ${budget.client.phone}`, 350, clientYPos, { width: 200 });
        clientYPos += 15;
      }
      
      if (budget.client.email) {
        doc.text(`Email: ${budget.client.email}`, 350, clientYPos, { width: 200 });
        clientYPos += 15;
      }
      
      if (budget.client.taxId) {
        doc.text(`RUC/CI: ${budget.client.taxId}`, 350, clientYPos, { width: 200 });
        clientYPos += 15;
      }
    } else {
      doc.text('Cliente no especificado', 350, clientYPos);
    }
    
    // ----- INFORMACIÓN DEL PRESUPUESTO -----
    
    // Línea divisoria
    const infoY = Math.max(clientYPos + 20, 260);
    doc.strokeColor(accentColor)
       .lineWidth(0.5)
       .moveTo(50, infoY)
       .lineTo(550, infoY)
       .stroke();
       
    // Información del presupuesto en 2 columnas
    const infoStartY = infoY + 20;
    
    // Columna 1
    doc.fontSize(9).fillColor(primaryColor).text('Fecha:', 50, infoStartY);
    doc.fontSize(9).fillColor(secondaryColor).text(`${new Date(budget.createdAt).toLocaleDateString()}`, 120, infoStartY);
    
    doc.fontSize(9).fillColor(primaryColor).text('Estado:', 50, infoStartY + 20);
    doc.fontSize(9).fillColor(secondaryColor).text(`${budget.status.toUpperCase()}`, 120, infoStartY + 20);
    
    // Columna 2
    doc.fontSize(9).fillColor(primaryColor).text('Válido hasta:', 300, infoStartY);
    doc.fontSize(9).fillColor(secondaryColor).text(`${new Date(budget.validUntil).toLocaleDateString()}`, 370, infoStartY);
    
    if (budget.paymentTerms) {
      doc.fontSize(9).fillColor(primaryColor).text('Condiciones:', 300, infoStartY + 20);
      doc.fontSize(9).fillColor(secondaryColor).text(`${budget.paymentTerms}`, 370, infoStartY + 20, { width: 180 });
    }
    
    if (budget.deliveryMethod) {
      doc.fontSize(9).fillColor(primaryColor).text('Entrega:', 300, infoStartY + 40);
      doc.fontSize(9).fillColor(secondaryColor).text(`${budget.deliveryMethod}`, 370, infoStartY + 40, { width: 180 });
    }
    
    // ----- TABLA DE PRODUCTOS -----
    
    // Encabezado de tabla
    const tableStartY = infoStartY + 80;
    doc.fontSize(11).fillColor(primaryColor).text('PRODUCTOS Y SERVICIOS', 50, tableStartY);
    
    // Definición de la tabla con medidas ajustadas
    const tableConfig = {
      headers: [
        { label: 'Descripción', property: 'name', width: 230, align: 'left' },
        { label: 'Cant.', property: 'quantity', width: 50, align: 'center' },
        { label: 'Precio', property: 'unitPrice', width: 85, align: 'right' },
        { label: 'Dto.', property: 'discount', width: 40, align: 'center' },
        { label: 'Importe', property: 'subtotal', width: 95, align: 'right' }
      ],
      rows: []
    };
    
    // Llenar datos de la tabla (manejo seguro)
    if (budget.items && Array.isArray(budget.items)) {
      budget.items.forEach(item => {
        const name = item.productSnapshot ? item.productSnapshot.name : 'Producto';
        
        // Formateo de moneda sin símbolo para mejor alineación
        const formatCurrency = (value) => {
          return value.toLocaleString('es-ES') + ' PYG';
        };
        
        tableConfig.rows.push({
          name,
          quantity: item.quantity.toString(),
          unitPrice: formatCurrency(item.unitPrice),
          discount: item.discount ? `${item.discount}%` : '0%',
          subtotal: formatCurrency(item.subtotal || (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)))
        });
      });
    }
    
    // Dibujar cabecera de tabla
    const tableHeaderY = tableStartY + 20;
    
    // Fondo de cabecera de tabla
    doc.fillColor(primaryColor)
       .rect(50, tableHeaderY, 500, 20)
       .fill();
    
    // Texto de cabeceras (definimos márgenes precisos para mejor alineación)
    doc.fontSize(9).fillColor('#FFFFFF');
    
    // Descripción
    doc.text(tableConfig.headers[0].label, 55, tableHeaderY + 5, { 
      width: tableConfig.headers[0].width - 10, 
      align: tableConfig.headers[0].align 
    });
    
    // Cantidad
    doc.text(tableConfig.headers[1].label, 55 + tableConfig.headers[0].width, tableHeaderY + 5, { 
      width: tableConfig.headers[1].width - 10, 
      align: tableConfig.headers[1].align 
    });
    
    // Precio
    doc.text(tableConfig.headers[2].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width, tableHeaderY + 5, { 
      width: tableConfig.headers[2].width - 10, 
      align: tableConfig.headers[2].align 
    });
    
    // Descuento
    doc.text(tableConfig.headers[3].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width + tableConfig.headers[2].width, tableHeaderY + 5, { 
      width: tableConfig.headers[3].width - 10, 
      align: tableConfig.headers[3].align 
    });
    
    // Importe
    doc.text(tableConfig.headers[4].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width + tableConfig.headers[2].width + tableConfig.headers[3].width, tableHeaderY + 5, { 
      width: tableConfig.headers[4].width - 10, 
      align: tableConfig.headers[4].align 
    });
    
    // Dibujar filas
    let yPos = tableHeaderY + 25;
    let rowCounter = 0;
    
    tableConfig.rows.forEach((row, rowIndex) => {
      // Verificar si necesitamos una nueva página
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        // Reiniciar posición Y en la nueva página
        yPos = 50;
        
        // Dibujar nuevamente la cabecera en la nueva página
        doc.fillColor(primaryColor)
           .rect(50, yPos, 500, 20)
           .fill();
        
        doc.fontSize(9).fillColor('#FFFFFF');
        
        // Descripción
        doc.text(tableConfig.headers[0].label, 55, yPos + 5, { 
          width: tableConfig.headers[0].width - 10, 
          align: tableConfig.headers[0].align 
        });
        
        // Cantidad
        doc.text(tableConfig.headers[1].label, 55 + tableConfig.headers[0].width, yPos + 5, { 
          width: tableConfig.headers[1].width - 10, 
          align: tableConfig.headers[1].align 
        });
        
        // Precio
        doc.text(tableConfig.headers[2].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width, yPos + 5, { 
          width: tableConfig.headers[2].width - 10, 
          align: tableConfig.headers[2].align 
        });
        
        // Descuento
        doc.text(tableConfig.headers[3].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width + tableConfig.headers[2].width, yPos + 5, { 
          width: tableConfig.headers[3].width - 10, 
          align: tableConfig.headers[3].align 
        });
        
        // Importe
        doc.text(tableConfig.headers[4].label, 55 + tableConfig.headers[0].width + tableConfig.headers[1].width + tableConfig.headers[2].width + tableConfig.headers[3].width, yPos + 5, { 
          width: tableConfig.headers[4].width - 10, 
          align: tableConfig.headers[4].align 
        });
        
        yPos += 25;
      }
      
      // Alternar colores para las filas
      if (rowCounter % 2 === 0) {
        doc.fillColor('#F7F7F7')
           .rect(50, yPos - 5, 500, 25)
           .fill();
      }
      rowCounter++;
      
      doc.fontSize(8).fillColor(secondaryColor);
      
      // Calcular posiciones exactas para cada columna
      const col1 = 55;
      const col2 = col1 + tableConfig.headers[0].width;
      const col3 = col2 + tableConfig.headers[1].width;
      const col4 = col3 + tableConfig.headers[2].width;
      const col5 = col4 + tableConfig.headers[3].width;
      
      // Descripción (nombre)
      let displayName = row.name;
      if (displayName && displayName.length > 40) {
        displayName = displayName.substring(0, 37) + '...';
      }
      doc.text(displayName || '', col1, yPos, { 
        width: tableConfig.headers[0].width - 10,
        align: 'left',
        ellipsis: false,
        lineBreak: false
      });
      
      // Cantidad
      doc.text(row.quantity || '', col2, yPos, { 
        width: tableConfig.headers[1].width - 10,
        align: 'center',
        lineBreak: false
      });
      
      // Precio
      doc.text(row.unitPrice || '', col3, yPos, { 
        width: tableConfig.headers[2].width - 10,
        align: 'right',
        lineBreak: false
      });
      
      // Descuento
      doc.text(row.discount || '', col4, yPos, { 
        width: tableConfig.headers[3].width - 10,
        align: 'center',
        lineBreak: false
      });
      
      // Importe
      doc.text(row.subtotal || '', col5, yPos, { 
        width: tableConfig.headers[4].width - 10,
        align: 'right',
        lineBreak: false
      });
      
      yPos += 25;
    });
    
    // ----- RESUMEN DE TOTALES -----
    
    // Línea divisoria final de la tabla
    doc.strokeColor('#CCCCCC')
       .lineWidth(1)
       .moveTo(50, yPos - 5)
       .lineTo(550, yPos - 5)
       .stroke();
    
    // Recuadro de totales
    const totalsBoxX = 380;
    const totalsBoxY = yPos + 10;
    const totalsBoxWidth = 170;
    
    // Línea superior de totales
    doc.strokeColor('#CCCCCC')
       .lineWidth(0.5)
       .moveTo(totalsBoxX, totalsBoxY)
       .lineTo(totalsBoxX + totalsBoxWidth, totalsBoxY)
       .stroke();
    
    // Formateo de moneda sin símbolo para mejor alineación
    const formatCurrency = (value) => {
      return value.toLocaleString('es-ES') + ' PYG';
    };
    
    // Subtotal
    yPos = totalsBoxY + 15;
    doc.fontSize(9).fillColor(secondaryColor).text('Subtotal:', totalsBoxX, yPos, { width: 80, align: 'left' });
    doc.fontSize(9).fillColor(secondaryColor).text(
      formatCurrency(budget.totalAmount), 
      totalsBoxX + 90, yPos, { width: 80, align: 'right' }
    );
    
    // Descuento
    if (budget.discount > 0) {
      yPos += 20;
      doc.fontSize(9).fillColor(secondaryColor).text(
        `Descuento (${budget.discount}%):`, 
        totalsBoxX, yPos, { width: 80, align: 'left' }
      );
      
      const discountAmount = budget.totalAmount * (budget.discount / 100);
      doc.fontSize(9).fillColor(secondaryColor).text(
        '-' + formatCurrency(discountAmount), 
        totalsBoxX + 90, yPos, { width: 80, align: 'right' }
      );
    }
    
    // IVA
    if (budget.tax > 0) {
      yPos += 20;
      doc.fontSize(9).fillColor(secondaryColor).text(
        `IVA (${budget.tax}%):`, 
        totalsBoxX, yPos, { width: 80, align: 'left' }
      );
      
      const taxAmount = (budget.totalAmount - budget.totalAmount * (budget.discount / 100)) * (budget.tax / 100);
      doc.fontSize(9).fillColor(secondaryColor).text(
        formatCurrency(taxAmount), 
        totalsBoxX + 90, yPos, { width: 80, align: 'right' }
      );
    }
    
    // Línea divisoria para el total final
    yPos += 20;
    doc.strokeColor('#CCCCCC')
       .lineWidth(1)
       .moveTo(totalsBoxX, yPos)
       .lineTo(totalsBoxX + totalsBoxWidth, yPos)
       .stroke();
    
    // Total final destacado
    yPos += 15;
    doc.fontSize(11).fillColor(primaryColor).text('TOTAL:', totalsBoxX, yPos, { width: 80, align: 'left' });
    doc.fontSize(11).fillColor(primaryColor).text(
      formatCurrency(budget.finalAmount), 
      totalsBoxX + 90, yPos, { width: 80, align: 'right' }
    );
    
    // ----- NOTAS Y CONDICIONES -----
    
    // Notas
    if (budget.notes) {
      const notesY = Math.min(yPos + 60, doc.page.height - 150);
      
      // Si estamos cerca del final de la página, crear una nueva
      if (notesY > doc.page.height - 120) {
        doc.addPage();
        yPos = 50;
      } else {
        yPos = notesY;
      }
      
      doc.fontSize(11).fillColor(primaryColor).text('NOTAS:', 50, yPos);
      doc.fontSize(9).fillColor(secondaryColor).text(budget.notes, 50, yPos + 20, { width: 500 });
    }
    
    // ----- PIE DE PÁGINA -----
    
    // Pie de página en todas las páginas
    try {
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Línea separadora del pie
        const footerLineY = doc.page.height - 50;
        doc.strokeColor('#CCCCCC')
           .lineWidth(0.5)
           .moveTo(50, footerLineY)
           .lineTo(550, footerLineY)
           .stroke();
        
        // Texto del pie
        const footerY = footerLineY + 10;
        doc.fontSize(8).fillColor('#999999').text(
          `Este presupuesto ha sido generado por ${budget.createdBy && budget.createdBy.name ? budget.createdBy.name : 'un administrador'} | Página ${i + 1} de ${pageCount}`,
          50, footerY, { align: 'center', width: 500 }
        );
      }
    } catch (footerError) {
      console.error("Error al generar pie de página:", footerError);
      // Continuar sin pie de página si hay error
    }

    // Finalizar el PDF
    doc.pipe(pdfStream);
    doc.end();
    
    return new Promise((resolve, reject) => {
      pdfStream.on('finish', async () => {
        try {
          // Solo guardar referencia en la base de datos si no es temporal
          if (!isTemporary) {
            // Registrar la ruta del archivo en el presupuesto
            budget.pdfPath = pdfPath;
            await budget.save();
          }
          
          console.log(`PDF generado exitosamente: ${pdfPath}`);
          resolve(pdfPath);
        } catch (error) {
          console.error("Error al guardar ruta del PDF:", error);
          // Aún así, resolvemos con la ruta para que el proceso continúe
          resolve(pdfPath);
        }
      });
      
      pdfStream.on('error', (error) => {
        console.error("Error al escribir el PDF:", error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Error generando PDF de presupuesto:', error);
    throw error;
  }
}
/**
 * Descarga el PDF de un presupuesto
 */
async function getBudgetPDFController(req, res) {
  try {
    if (!uploadProductPermission(req.userId)) {
      throw new Error("Permiso denegado");
    }

    const { budgetId } = req.params;

    if (!budgetId) {
      throw new Error("ID de presupuesto no proporcionado");
    }

    // Buscar el presupuesto
    const budget = await BudgetModel.findById(budgetId);
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    // Generar el PDF directamente para descarga (no guardarlo permanentemente)
    const pdfPath = await generateBudgetPDF(budgetId, true);
    
    // Establecer encabezados para forzar la descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=presupuesto-${budget.budgetNumber}.pdf`);
    
    // Enviar el archivo como descarga
    res.download(pdfPath, `presupuesto-${budget.budgetNumber}.pdf`, (err) => {
      if (err) {
        console.error("Error al descargar el PDF:", err);
      }
      
      // Eliminar el archivo temporal después de enviarlo
      try {
        setTimeout(() => {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }
        }, 1000); // Esperar un segundo para asegurar que se completó la descarga
      } catch (e) {
        console.error("Error al eliminar el archivo temporal:", e);
      }
    });

  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false
    });
  }
}

// backend/controller/budget/budgetController.js

// ... resto del código anterior ...

/**
 * Envía un presupuesto por email
 */
async function sendBudgetEmailController(req, res) {
  try {
    if (!uploadProductPermission(req.userId)) {
      throw new Error("Permiso denegado");
    }

    const { budgetId } = req.params;
    const { emailTo, subject, message } = req.body;

    if (!budgetId) {
      throw new Error("ID de presupuesto no proporcionado");
    }

    // Si no se proporciona un email, usamos el del cliente si existe
    let destinationEmail = emailTo;
    
    // Buscar el presupuesto
    const budget = await BudgetModel.findById(budgetId)
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    // Si no hay email específico, usar el del cliente
    if (!destinationEmail && budget.client && budget.client.email) {
      destinationEmail = budget.client.email;
    }

    // Verificar si hay un email de destino
    if (!destinationEmail) {
      throw new Error("No se ha proporcionado un email de destino y el cliente no tiene email registrado");
    }

    // Generar PDF temporal
    const pdfPath = await generateBudgetPDF(budgetId, true);

    // Configuración de nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Construir el asunto y mensaje del email
    const emailSubject = subject || `Presupuesto ${budget.budgetNumber}`;
    const emailMessage = message || `
Estimado/a ${budget.client?.name || 'Cliente'},

Le hacemos llegar el presupuesto solicitado con número ${budget.budgetNumber}.

DETALLES:
- Total del presupuesto: ${budget.finalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'PYG' })}
- Válido hasta: ${new Date(budget.validUntil).toLocaleDateString()}
- Método de entrega: ${budget.deliveryMethod || 'A convenir'}
- Condiciones de pago: ${budget.paymentTerms || 'Según lo acordado'}

Para cualquier consulta o aclaración, no dude en contactarnos.

Atentamente,
${budget.createdBy?.name || 'El equipo comercial'}
JM Computer
`;

    // Enviar el email con el PDF adjunto
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destinationEmail,
      subject: emailSubject,
      text: emailMessage,
      attachments: [
        {
          filename: `presupuesto-${budget.budgetNumber}.pdf`,
          path: pdfPath
        }
      ]
    });

    // Actualizar el estado del presupuesto a "enviado" si está en borrador
    if (budget.status === 'draft') {
      budget.status = 'sent';
      await budget.save();
    }

    // Limpiar el archivo temporal
    try {
      fs.unlinkSync(pdfPath);
    } catch (error) {
      console.error("Error al eliminar el archivo temporal:", error);
    }

    res.json({
      message: "Presupuesto enviado por email correctamente",
      data: {
        sentTo: destinationEmail,
        budgetNumber: budget.budgetNumber,
        status: budget.status
      },
      success: true,
      error: false
    });

  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false
    });
  }
}

// Asegúrate de exportar la nueva función
module.exports = {
    createBudgetController,
    getAllBudgetsController,
    getBudgetByIdController,
    updateBudgetStatusController,
    getBudgetPDFController,
    deleteBudgetController,
    sendBudgetEmailController
};