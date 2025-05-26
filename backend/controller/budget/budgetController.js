// backend/controller/budget/budgetController.js - VERSIÓN MEJORADA

const BudgetModel = require('../../models/budgetModel');
const ClientModel = require('../../models/clientModel');
const ProductModel = require('../../models/productModel');
const uploadProductPermission = require('../../helpers/permission');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

/**
 * Crea un nuevo presupuesto con soporte para múltiples monedas
 */
async function createBudgetController(req, res) {
  try {
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
          deliveryMethod,
          currency = 'PYG',
          exchangeRate = 7300
      } = req.body;

      console.log('Creando presupuesto con datos:', { clientId, currency, itemsCount: items?.length });

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

      // GENERAR NÚMERO DE PRESUPUESTO MANUALMENTE
      console.log('Generando número de presupuesto...');
      let budgetNumber;
      try {
          const lastBudget = await BudgetModel.findOne(
              { budgetNumber: { $regex: /^PRES-\d+$/ } },
              { budgetNumber: 1 },
              { sort: { createdAt: -1 } }
          );
          
          let nextNumber = 1;
          
          if (lastBudget && lastBudget.budgetNumber) {
              console.log('Último presupuesto encontrado:', lastBudget.budgetNumber);
              const match = lastBudget.budgetNumber.match(/PRES-(\d+)/);
              if (match && match[1]) {
                  nextNumber = parseInt(match[1]) + 1;
              }
          }
          
          budgetNumber = `PRES-${nextNumber.toString().padStart(5, '0')}`;
          console.log('Número generado:', budgetNumber);
      } catch (error) {
          console.error('Error generando número:', error);
          budgetNumber = `PRES-${Date.now().toString().slice(-5)}`;
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

              const quantity = Number(item.quantity) || 1;
              let unitPrice = Number(item.unitPrice) || product.sellingPrice;
              
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

      const createdByUserId = req.userId && req.userId.startsWith('guest-') ? '000000000000000000000000' : req.userId;

      // Crear nuevo presupuesto CON budgetNumber ya asignado
      const newBudget = new BudgetModel({
          budgetNumber, // ← ASIGNAR EL NÚMERO GENERADO MANUALMENTE
          client: clientId,
          items: processedItems,
          totalAmount: calculatedTotalAmount,
          discount: calculatedDiscount,
          tax: calculatedTax,
          finalAmount: calculatedFinalAmount,
          currency,
          exchangeRate,
          notes,
          validUntil: validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          paymentTerms,
          deliveryMethod,
          createdBy: createdByUserId
      });

      console.log('Guardando presupuesto con budgetNumber:', budgetNumber);
      const savedBudget = await newBudget.save();
      console.log('Presupuesto guardado exitosamente');

      // Asociar presupuesto al cliente
      await ClientModel.findByIdAndUpdate(
          clientId,
          { $push: { budgets: savedBudget._id } }
      );

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

/**
 * Genera el PDF de un presupuesto con logo mejorado y diseño original conservado
 */
/**
 * Genera el PDF de un presupuesto con logo mejorado y diseño original conservado
 */
async function generateBudgetPDF(budgetId, isTemporary = false) {
  try {
    const budget = await BudgetModel.findById(budgetId)
      .populate('client', 'name email phone company address taxId')
      .populate('createdBy', 'name email');
    
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Configuración de colores (manteniendo tu esquema original)
    const primaryColor = '#1565C0';
    const secondaryColor = '#333333';
    const accentColor = '#42A5F5';
    const lightGray = '#F5F5F5';
    
    // Función para formatear moneda (tu versión original)
    const formatCurrency = (value) => {
      if (budget.currency === 'USD') {
        return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        return `${value.toLocaleString('es-ES')} Gs.`;
      }
    };
    
    // ----- ENCABEZADO (tu diseño original mejorado) -----
    
    // Logo mejorado - SOLUCIONADO
    try {
      const possibleLogoPaths = [
        path.join(__dirname, 'logo.jpeg'),
        path.join(__dirname, 'logo.jpg'),
        path.join(__dirname, 'logo.png'),
        path.join(__dirname, '../../assets/logo.jpeg'),
        path.join(__dirname, '../../assets/logo.png'),
        path.join(__dirname, '../../public/logo.jpeg'),
        path.join(__dirname, '../../public/logo.png')
      ];
      
      let logoPath = null;
      for (const logoPathCandidate of possibleLogoPaths) {
        if (fs.existsSync(logoPathCandidate)) {
          logoPath = logoPathCandidate;
          break;
        }
      }
      
      if (logoPath) {
        doc.image(logoPath, 40, 40, { 
          width: 80, 
          height: 50,
          fit: [80, 50],
          align: 'center',
          valign: 'center'
        });
        console.log("Logo agregado desde:", logoPath);
      } else {
        // Logo placeholder más profesional
        doc.fillColor(primaryColor)
           .roundedRect(40, 40, 80, 50, 5)
           .fill();
        doc.fontSize(14)
           .fillColor('white')
           .text('BlueTec', 50, 55);
        doc.fontSize(10)
           .text('EAS', 50, 70);
        console.warn("Logo no encontrado, usando placeholder mejorado");
      }
    } catch (logoError) {
      console.error("Error al agregar el logo:", logoError);
      // Fallback mejorado
      doc.fillColor(primaryColor)
         .roundedRect(40, 40, 80, 50, 5)
         .fill();
      doc.fontSize(14)
         .fillColor('white')
         .text('BlueTec', 50, 55);
      doc.fontSize(10)
         .text('EAS', 50, 70);
    }
    
    // Información de la empresa (exactamente como la tenías)
    doc.fontSize(10).fillColor(secondaryColor);
    doc.text('Paseo Dylan, Piso 2 Avda. Mcal Lopez', 130, 45);
    doc.text('Tel: +595 972 971353 | ventas@bluetec.com.py', 130, 60);
    doc.text('RUC: 80136342-0', 130, 75);
    
    // Título del documento (tu estilo original)
    doc.fontSize(24).fillColor(primaryColor).text('PRESUPUESTO', 350, 40, { align: 'right' });
    doc.fontSize(16).fillColor(secondaryColor).text(`Nº ${budget.budgetNumber}`, 350, 70, { align: 'right' });
    
    // Moneda (sin cambios)
    const currencyLabel = budget.currency === 'USD' ? 'Dolares Americanos (USD)' : 'Guaranies Paraguayos (PYG)';
    doc.fontSize(11).fillColor(accentColor).text(currencyLabel, 350, 90, { align: 'right' });
    
    // Línea divisoria (tu estilo)
    doc.strokeColor(primaryColor)
       .lineWidth(3)
       .moveTo(40, 120)
       .lineTo(555, 120)
       .stroke();
    
    // ----- INFORMACIÓN PRINCIPAL (exactamente tu diseño) -----
    
    // Cliente (lado izquierdo)
    doc.fontSize(14).fillColor(primaryColor).text('CLIENTE', 40, 140);
    
    let clientY = 160;
    if (budget.client) {
      doc.fontSize(12).fillColor(secondaryColor);
      doc.text(budget.client.name, 40, clientY);
      clientY += 18;
      
      if (budget.client.company) {
        doc.text(budget.client.company, 40, clientY);
        clientY += 18;
      }
      
      if (budget.client.address) {
        if (typeof budget.client.address === 'object') {
          const { street, city, state, zip, country } = budget.client.address;
          if (street) {
            doc.text(street, 40, clientY, { width: 250 });
            clientY += 15;
          }
          if (city || state || zip) {
            let location = [city, state, zip].filter(Boolean).join(', ');
            if (location) {
              doc.text(location, 40, clientY);
              clientY += 15;
            }
          }
          if (country) {
            doc.text(country, 40, clientY);
            clientY += 15;
          }
        } else {
          doc.text(budget.client.address, 40, clientY, { width: 250 });
          clientY += 15;
        }
      }
      
      if (budget.client.taxId) {
        doc.text(`RUC: ${budget.client.taxId}`, 40, clientY);
        clientY += 15;
      }
      
      if (budget.client.phone) {
        doc.text(`Tel: ${budget.client.phone}`, 40, clientY);
        clientY += 15;
      }
      
      if (budget.client.email) {
        doc.text(`Email: ${budget.client.email}`, 40, clientY);
        clientY += 15;
      }
    }
    
    // Detalles del presupuesto (lado derecho, tu estilo)
    doc.fontSize(14).fillColor(primaryColor).text('DETALLES', 350, 140);
    
    doc.fontSize(11).fillColor(secondaryColor);
    doc.text(`Fecha: ${new Date(budget.createdAt).toLocaleDateString('es-ES')}`, 350, 160);
    doc.text(`Valido hasta: ${new Date(budget.validUntil).toLocaleDateString('es-ES')}`, 350, 180);
    
    const statusLabels = {
      'draft': 'Borrador', 'sent': 'Enviado', 'accepted': 'Aceptado',
      'rejected': 'Rechazado', 'expired': 'Expirado', 'converted': 'Convertido'
    };
    doc.text(`Estado: ${statusLabels[budget.status] || budget.status}`, 350, 200);
    
    if (budget.paymentTerms) {
      doc.text(`Pago: ${budget.paymentTerms}`, 350, 220, { width: 200 });
    }
    
    if (budget.deliveryMethod) {
      doc.text(`Entrega: ${budget.deliveryMethod}`, 350, 240, { width: 200 });
    }
    
    // ----- TABLA DE PRODUCTOS (tu diseño exacto pero con nombres mejorados) -----
    
    const tableY = Math.max(clientY + 30, 280);
    
    doc.fontSize(16).fillColor(primaryColor).text('PRODUCTOS Y SERVICIOS', 40, tableY);
    
    const headerY = tableY + 30;
    const rowHeight = 35;
    
    // Configuración de columnas (tu layout original)
    const cols = {
      desc: { x: 40, width: 220 },
      qty: { x: 260, width: 50 },
      price: { x: 310, width: 90 },
      disc: { x: 400, width: 50 },
      total: { x: 450, width: 105 }
    };
    
    // Cabecera de tabla (tu estilo)
    doc.fillColor(primaryColor).rect(40, headerY, 515, 25).fill();
    
    doc.fontSize(10).fillColor('white');
    doc.text('DESCRIPCION', cols.desc.x + 5, headerY + 8, { width: cols.desc.width - 10 });
    doc.text('CANT.', cols.qty.x, headerY + 8, { width: cols.qty.width, align: 'center' });
    doc.text('PRECIO UNIT.', cols.price.x, headerY + 8, { width: cols.price.width, align: 'center' });
    doc.text('DTO.', cols.disc.x, headerY + 8, { width: cols.disc.width, align: 'center' });
    doc.text('IMPORTE', cols.total.x, headerY + 8, { width: cols.total.width, align: 'center' });
    
    // Filas de productos
    let rowY = headerY + 30;
    let rowIndex = 0;
    
    if (budget.items && Array.isArray(budget.items)) {
      budget.items.forEach((item) => {
        // Verificar nueva página
        if (rowY > 680) {
          doc.addPage();
          rowY = 80;
          
          // Repetir cabecera
          doc.fillColor(primaryColor).rect(40, rowY, 515, 25).fill();
          doc.fontSize(10).fillColor('white');
          doc.text('DESCRIPCION', cols.desc.x + 5, rowY + 8, { width: cols.desc.width - 10 });
          doc.text('CANT.', cols.qty.x, rowY + 8, { width: cols.qty.width, align: 'center' });
          doc.text('PRECIO UNIT.', cols.price.x, rowY + 8, { width: cols.price.width, align: 'center' });
          doc.text('DTO.', cols.disc.x, rowY + 8, { width: cols.disc.width, align: 'center' });
          doc.text('IMPORTE', cols.total.x, rowY + 8, { width: cols.total.width, align: 'center' });
          
          rowY += 30;
          
          // Agregar pie a la página anterior
          addFooterToCurrentPage();
        }
        
        // Fondo alternado (tu estilo)
        if (rowIndex % 2 === 0) {
          doc.fillColor(lightGray).rect(40, rowY - 5, 515, rowHeight).fill();
        }
        
        doc.fontSize(9).fillColor(secondaryColor);
        
        // DESCRIPCIÓN MEJORADA - ESTO ES LO QUE ARREGLA LOS NOMBRES
        const productName = item.productSnapshot?.name || 'Producto';
        const brandName = item.productSnapshot?.brandName;
        
        let description = productName;
        if (brandName && brandName.trim() !== '' && brandName !== productName) {
          description += `\n${brandName}`;
        }
        
        doc.text(description, cols.desc.x + 5, rowY + 5, { 
          width: cols.desc.width - 10,
          lineGap: 2
        });
        
        // Cantidad
        doc.text(item.quantity.toString(), cols.qty.x, rowY + 10, { 
          width: cols.qty.width, 
          align: 'center' 
        });
        
        // Precio unitario
        doc.text(formatCurrency(item.unitPrice), cols.price.x, rowY + 10, { 
          width: cols.price.width, 
          align: 'right' 
        });
        
        // Descuento
        doc.text(item.discount ? `${item.discount}%` : '0%', cols.disc.x, rowY + 10, { 
          width: cols.disc.width, 
          align: 'center' 
        });
        
        // Subtotal
        const subtotal = item.subtotal || (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100));
        doc.text(formatCurrency(subtotal), cols.total.x, rowY + 10, { 
          width: cols.total.width, 
          align: 'right' 
        });
        
        rowY += rowHeight;
        rowIndex++;
      });
    }
    
    // ----- TOTALES (tu diseño exacto) -----
    
    rowY += 20;
    
    const totalsX = 350;
    const totalsWidth = 205;
    
    doc.fillColor(lightGray).rect(totalsX, rowY, totalsWidth, 100).fill();
    doc.strokeColor(primaryColor).rect(totalsX, rowY, totalsWidth, 100).stroke();
    
    let totalY = rowY + 15;
    
    // Subtotal
    doc.fontSize(11).fillColor(secondaryColor);
    doc.text('Subtotal:', totalsX + 10, totalY);
    doc.text(formatCurrency(budget.totalAmount), totalsX + 110, totalY, { width: 85, align: 'right' });
    
    // Descuento
    if (budget.discount > 0) {
      totalY += 20;
      doc.text(`Descuento (${budget.discount}%):`, totalsX + 10, totalY);
      const discountAmount = budget.totalAmount * (budget.discount / 100);
      doc.fillColor('#D32F2F').text(`-${formatCurrency(discountAmount)}`, totalsX + 110, totalY, { width: 85, align: 'right' });
      doc.fillColor(secondaryColor);
    }
    
    // IVA
    if (budget.tax > 0) {
      totalY += 20;
      doc.text(`IVA (${budget.tax}%):`, totalsX + 10, totalY);
      const taxAmount = (budget.totalAmount - budget.totalAmount * (budget.discount / 100)) * (budget.tax / 100);
      doc.text(`+${formatCurrency(taxAmount)}`, totalsX + 110, totalY, { width: 85, align: 'right' });
    }
    
    // Total final
    totalY += 25;
    doc.strokeColor(primaryColor).lineWidth(2)
       .moveTo(totalsX + 10, totalY)
       .lineTo(totalsX + totalsWidth - 10, totalY)
       .stroke();
    
    totalY += 15;
    doc.fontSize(16).fillColor(primaryColor);
    doc.text('TOTAL:', totalsX + 10, totalY);
    doc.text(formatCurrency(budget.finalAmount), totalsX + 110, totalY, { width: 85, align: 'right' });
    
    // ----- NOTAS (tu estilo) -----
    
    if (budget.notes && budget.notes.trim() !== '') {
      if (currentY > 630) {
        addFooterToCurrentPage();
        doc.addPage();
        currentY = 80;
      }
      
      doc.fontSize(14).fillColor(primaryColor).text('NOTAS Y CONDICIONES:', 40, currentY);
      doc.fontSize(10).fillColor(secondaryColor).text(budget.notes, 40, currentY + 25, { 
        width: 515, 
        align: 'justify' 
      });
      
      addFooterToCurrentPage();
    }
    
    // ----- PIE DE PÁGINA (corregido para evitar páginas extra) -----
    
    const addFooterToCurrentPage = () => {
      const footerY = doc.page.height - 50;
      doc.strokeColor('#E0E0E0').lineWidth(1)
         .moveTo(40, footerY)
         .lineTo(555, footerY)
         .stroke();
      
      doc.fontSize(8).fillColor('#666666');
      doc.text(
        `BlueTec EAS - Presupuesto valido hasta el ${new Date(budget.validUntil).toLocaleDateString('es-ES')}`,
        40, footerY + 10, { align: 'center', width: 515 }
      );
      
      doc.text(
        'ventas@bluetec.com.py | +595 972 971353',
        40, footerY + 25, { align: 'center', width: 515 }
      );
    };
    
    // Agregar pie solo a la página actual
    addFooterToCurrentPage();

    doc.end();
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log(`PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);
        resolve(pdfBuffer);
      });
      
      doc.on('error', (error) => {
        console.error("Error al generar el PDF:", error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Error generando PDF de presupuesto:', error);
    throw error;
  }
}
// Resto de funciones (getAllBudgetsController, getBudgetByIdController, etc.)
async function getAllBudgetsController(req, res) {
    try {
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
        
        const query = {};
        
        if (clientId) query.client = clientId;
        if (status) query.status = status;
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        if (minAmount || maxAmount) {
            query.finalAmount = {};
            if (minAmount) query.finalAmount.$gte = Number(minAmount);
            if (maxAmount) query.finalAmount.$lte = Number(maxAmount);
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        const budgets = await BudgetModel.find(query)
            .select('budgetNumber client items totalAmount discount tax finalAmount currency status validUntil createdAt')
            .populate('client', 'name email phone company')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));
            
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

async function getBudgetByIdController(req, res) {
    try {
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

async function updateBudgetStatusController(req, res) {
  try {
      const { budgetId } = req.params;
      const { status } = req.body;

      if (!budgetId) {
          throw new Error("ID de presupuesto no proporcionado");
      }

      if (!['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'].includes(status)) {
          throw new Error("Estado de presupuesto no válido");
      }

      console.log(`Actualizando presupuesto ${budgetId} a estado ${status}`);

      const budget = await BudgetModel.findById(budgetId);
      
      if (!budget) {
          throw new Error("Presupuesto no encontrado");
      }

      budget.status = status;
      
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

async function deleteBudgetController(req, res) {
    try {
        const { budgetId } = req.params;

        if (!budgetId) {
            throw new Error("ID de presupuesto no proporcionado");
        }

        const budget = await BudgetModel.findById(budgetId);
        if (!budget) {
            throw new Error("Presupuesto no encontrado");
        }

        if (budget.client) {
            await ClientModel.findByIdAndUpdate(
                budget.client,
                { $pull: { budgets: budgetId } }
            );
        }

        await BudgetModel.findByIdAndDelete(budgetId);

        res.json({
            message: "Presupuesto eliminado correctamente",
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en deleteBudgetController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

async function getBudgetPDFController(req, res) {
  try {
    const { budgetId } = req.params;

    if (!budgetId) {
      throw new Error("ID de presupuesto no proporcionado");
    }

    const budget = await BudgetModel.findById(budgetId);
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    const pdfBuffer = await generateBudgetPDF(budgetId, true);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=presupuesto-${budget.budgetNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Error en getBudgetPDFController:", err);
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false
    });
  }
}

async function sendBudgetEmailController(req, res) {
  try {
    const { budgetId } = req.params;
    const { emailTo, subject, message } = req.body;

    if (!budgetId) {
      throw new Error("ID de presupuesto no proporcionado");
    }

    let destinationEmail = emailTo;
    
    const budget = await BudgetModel.findById(budgetId)
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    if (!destinationEmail && budget.client && budget.client.email) {
      destinationEmail = budget.client.email;
    }

    if (!destinationEmail) {
      throw new Error("No se ha proporcionado un email de destino y el cliente no tiene email registrado");
    }

    const pdfBuffer = await generateBudgetPDF(budgetId, true);

    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const currencySymbol = budget.currency === 'USD' ? '$' : 'Gs.';

    const emailSubject = subject || `Presupuesto ${budget.budgetNumber}`;
    const emailMessage = message || `
Estimado/a ${budget.client?.name || 'Cliente'},

Le hacemos llegar el presupuesto solicitado con número ${budget.budgetNumber}.

DETALLES:
- Total del presupuesto: ${currencySymbol} ${budget.finalAmount.toLocaleString()}
- Moneda: ${budget.currency === 'USD' ? 'Dólares Americanos' : 'Guaraníes'}
- Válido hasta: ${new Date(budget.validUntil).toLocaleDateString()}
- Método de entrega: ${budget.deliveryMethod || 'A convenir'}
- Condiciones de pago: ${budget.paymentTerms || 'Según lo acordado'}

Para cualquier consulta o aclaración, no dude en contactarnos.

Atentamente,
El equipo comercial
BlueTec EAS
`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destinationEmail,
      subject: emailSubject,
      text: emailMessage,
      attachments: [
        {
          filename: `presupuesto-${budget.budgetNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    if (budget.status === 'draft') {
      budget.status = 'sent';
      await budget.save();
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
    console.error("Error en sendBudgetEmailController:", err);
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false
    });
  }
}

module.exports = {
    createBudgetController,
    getAllBudgetsController,
    getBudgetByIdController,
    updateBudgetStatusController,
    getBudgetPDFController,
    deleteBudgetController,
    sendBudgetEmailController
};