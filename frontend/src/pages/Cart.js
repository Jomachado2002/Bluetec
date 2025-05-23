import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Context from '../context';
import displayINRCurrency from '../helpers/displayCurrency';
import { MdDelete, MdShoppingCart, MdPictureAsPdf, MdDownload, MdWhatsapp } from "react-icons/md";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from '../helpers/logo.png';
import { toast } from 'react-toastify';
import { localCartHelper } from '../helpers/addToCart';

const Cart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const context = useContext(Context);

    // Función simplificada para cargar datos directamente desde localStorage
    const fetchData = () => {
        try {
            setLoading(true);
            
            // Obtener items directamente del localStorage
            const cartItems = localCartHelper.getCart();
            console.log("Datos de carrito cargados:", cartItems);
            
            // Ya no es necesario hacer peticiones adicionales
            setData(cartItems);
            
        } catch (error) {
            console.error('Error al cargar productos del carrito:', error);
            toast.error('Error al cargar el carrito');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData();
    }, []);

    // Función para verificar que un producto tiene datos válidos
    const isValidProduct = (product) => {
        return product && product.productId && 
               typeof product.productId === 'object' &&
               product.productId.productImage &&
               Array.isArray(product.productId.productImage) &&
               product.productId.productImage.length > 0;
    };

    // Aumentar cantidad de producto
    const increaseQty = (id, qty) => {
        try {
            if (localCartHelper.updateQuantity(id, qty + 1)) {
                fetchData();
                toast.success('Cantidad actualizada');
            }
        } catch (error) {
            console.error('Error al aumentar cantidad:', error);
            toast.error('Error al actualizar cantidad');
        }
    };

    // Disminuir cantidad de producto
    const decreaseQty = (id, qty) => {
        if (qty < 2) return;
        
        try {
            if (localCartHelper.updateQuantity(id, qty - 1)) {
                fetchData();
                toast.success('Cantidad actualizada');
            }
        } catch (error) {
            console.error('Error al disminuir cantidad:', error);
            toast.error('Error al actualizar cantidad');
        }
    };

    // Eliminar producto del carrito
    const deleteCartProduct = (id) => {
        try {
            localCartHelper.removeItem(id);
            fetchData();
            
            // Actualizar contador global del carrito
            if (context.fetchUserAddToCart) {
                context.fetchUserAddToCart();
            }
            
            toast.success('Producto eliminado del carrito');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error('Error al eliminar producto');
        }
    };

    // Limpiar todo el carrito
    const clearCart = () => {
        try {
            localCartHelper.clearCart();
            fetchData();
            
            // Actualizar contador global del carrito
            if (context.fetchUserAddToCart) {
                context.fetchUserAddToCart();
            }
            
            toast.success('Carrito limpiado correctamente');
        } catch (error) {
            console.error('Error al limpiar el carrito:', error);
            toast.error('Error al limpiar el carrito');
        }
    };

    // Calcular cantidad total de productos
    const totalQty = data.reduce((previousValue, currentValue) => 
        previousValue + currentValue.quantity, 0);
    
    // Calcular precio total - adaptado para el nuevo formato con validación
    const totalPrice = data.reduce((prev, curr) => {
        if (curr?.productId?.sellingPrice) {
            return prev + (curr.quantity * curr.productId.sellingPrice);
        }
        return prev;
    }, 0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Generar PDF mejorado
    const generatePDF = () => {
        if (!customerData.name) {
            toast.error("Por favor ingrese el nombre del cliente");
            return;
        }
    
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Colores corporativos de BlueTec
        const primaryColor = [42, 49, 144]; // Azul BlueTec #2A3190
        const secondaryColor = [0, 0, 0]; // Negro
        
        // Agregar logo
        const imgWidth = 30;
        const imgHeight = 15;
        doc.addImage(logo, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Agregar encabezado
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("PRESUPUESTO", pageWidth - 10, 20, { align: "right" });
        
        // Línea divisoria
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(10, 30, pageWidth - 10, 30);
        
        // Agregar información de la empresa
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont("helvetica", "normal");
        doc.text([
            "BlueTec",
            "Tel: +595 984 133733",
            "Email: ventas@bluetec.com.py",
            "Web: www.bluetec.com.py"
        ], pageWidth - 10, 40, { align: "right" });
        
        // Número de presupuesto y fecha
        const presupuestoNo = `PRE-${Math.floor(100000 + Math.random() * 900000)}`;
        const currentDate = new Date().toLocaleDateString('es-PY', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("N° PRESUPUESTO:", 10, 45);
        doc.text("FECHA:", 10, 52);
        doc.text("VALIDEZ:", 10, 59);
        
        doc.setFont("helvetica", "normal");
        doc.text(presupuestoNo, 50, 45);
        doc.text(currentDate, 50, 52);
        doc.text("5 días hábiles", 50, 59);
        
        // Información del cliente
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DATOS DEL CLIENTE", 10, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("NOMBRE:", 10, 80);
        
        if (customerData.phone) {
            doc.text("TELÉFONO:", 10, 87);
        }
        
        if (customerData.email) {
            doc.text("EMAIL:", 10, customerData.phone ? 94 : 87);
        }
        
        doc.setFont("helvetica", "normal");
        doc.text(customerData.name, 50, 80);
        
        if (customerData.phone) {
            doc.text(customerData.phone, 50, 87);
        }
        
        if (customerData.email) {
            doc.text(customerData.email, 50, customerData.phone ? 94 : 87);
        }
        
        // Encabezado de productos
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DETALLE DE PRODUCTOS", 10, customerData.email ? 105 : (customerData.phone ? 98 : 91));
        
        // Tabla de productos
        const tableColumn = ["#", "Descripción", "Cant.", "Precio Unitario", "Subtotal"];
        const tableRows = [];
        
        // Filtrar productos válidos para el PDF
        const validProducts = data.filter(isValidProduct);
        
        validProducts.forEach((product, index) => {
            const subtotal = product.quantity * product.productId.sellingPrice;
            tableRows.push([
                (index + 1).toString(),
                product.productId.productName,
                product.quantity.toString(),
                displayINRCurrency(product.productId.sellingPrice),
                displayINRCurrency(subtotal),
            ]);
        });
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: customerData.email ? 110 : (customerData.phone ? 103 : 96),
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });
        
        // Resumen del presupuesto
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Recuadro para totales
        doc.setFillColor(248, 248, 248);
        doc.rect(pageWidth - 90, finalY - 5, 80, 30, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL GUARANÍES:", pageWidth - 85, finalY + 5);
        doc.text("TOTAL USD (referencial):", pageWidth - 85, finalY + 15);
        
        const totalInUSD = totalPrice / 7850;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(displayINRCurrency(totalPrice), pageWidth - 10, finalY + 5, { align: "right" });
        doc.text(`$${totalInUSD.toFixed(2)}`, pageWidth - 10, finalY + 15, { align: "right" });
        
        // Información adicional
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(10, finalY + 30, pageWidth - 10, finalY + 30);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        
        const infoText = [
            "• Forma de Pago: A convenir",
            "• Tiempo de entrega: 48 horas hábiles",
            "• Garantía según políticas del fabricante",
            "• Precios válidos por 5 días hábiles"
        ];
        
        infoText.forEach((text, index) => {
            doc.text(text, 10, finalY + 40 + (index * 7));
        });
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Este presupuesto no constituye una factura. Para realizar el pedido, contáctenos al WhatsApp +595 984 133733.", pageWidth/2, pageHeight - 15, { align: "center" });
        doc.text("BlueTec - Tecnología Profesional", pageWidth/2, pageHeight - 10, { align: "center" });
        
        // Numeración de páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10);
        }
    
        // Guardar el PDF
        doc.save(`Presupuesto-BlueTec-${presupuestoNo}.pdf`);
        toast.success("Presupuesto generado exitosamente");
    };

    // Función para enviar presupuesto por WhatsApp
    const sendToWhatsApp = () => {
        if (!customerData.name) {
            toast.error("Por favor ingrese el nombre del cliente");
            return;
        }

        const validProducts = data.filter(isValidProduct);
        
        if (validProducts.length === 0) {
            toast.error("No hay productos válidos en el carrito");
            return;
        }

        // Construir el mensaje de WhatsApp
        let message = `*SOLICITUD DE PRESUPUESTO - BlueTec*\n\n`;
        message += `*Cliente:* ${customerData.name}\n`;
        
        if (customerData.phone) {
            message += `*Teléfono:* ${customerData.phone}\n`;
        }
        
        if (customerData.email) {
            message += `*Email:* ${customerData.email}\n`;
        }
        
        message += `\n*Productos solicitados:*\n`;
        
        validProducts.forEach((product, index) => {
            message += `${index + 1}. ${product.productId.productName} (${product.quantity} unid.) - ${displayINRCurrency(product.productId.sellingPrice * product.quantity)}\n`;
        });
        
        message += `\n*Total:* ${displayINRCurrency(totalPrice)}\n`;
        message += `\nSolicito confirmación de disponibilidad y coordinación para el pago. Gracias.`;
        
        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);
        
        // Abrir WhatsApp con el mensaje
        window.open(`https://wa.me/+595984133733?text=${encodedMessage}`, '_blank');
        toast.success("Redirigiendo a WhatsApp...");
    };

    const toggleCustomerForm = () => {
        setShowCustomerForm(!showCustomerForm);
    };

    const validProducts = data.filter(isValidProduct);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Botones para debug - solo visibles en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => console.log("Carrito actual:", localCartHelper.getCart())} 
                                className="px-3 py-1 bg-gray-200 rounded text-sm">
                            Debug: Ver carrito en consola
                        </button>
                        <button onClick={clearCart} 
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                            Limpiar carrito
                        </button>
                    </div>
                )}
                
                {/* Encabezado del carrito */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2A3190] flex items-center gap-3 mb-4 sm:mb-0">
                        <div className="w-2 h-8 bg-[#2A3190] rounded-full"></div>
                        Mi Carrito
                    </h1>
                    
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors">
                            <FaArrowLeft className="text-sm" />
                            <span>Seguir comprando</span>
                        </Link>
                        
                        <div className="text-sm bg-[#2A3190] text-white px-4 py-1.5 rounded-full shadow-md">
                            {totalQty} {totalQty === 1 ? 'producto' : 'productos'}
                        </div>
                    </div>
                </div>

                {/* Carrito vacío */}
                {validProducts.length === 0 && !loading && (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto border border-gray-100">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MdShoppingCart className="text-5xl text-[#2A3190]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#2A3190] mb-3">Tu carrito está vacío</h2>
                        <p className="text-gray-600 mb-8">Parece que no has agregado productos a tu carrito todavía.</p>
                        <Link 
                            to="/"
                            className="inline-block bg-[#2A3190] text-white px-8 py-3 rounded-lg hover:bg-[#1e236b] transition duration-300 shadow-md"
                        >
                            Explorar Productos
                        </Link>
                    </div>
                )}

                {/* Contenido del carrito */}
                {validProducts.length > 0 && (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Lista de productos */}
                        <div className="flex-grow">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#2A3190]">Productos seleccionados</h2>
                                    
                                    {validProducts.length > 1 && (
                                        <button 
                                            onClick={clearCart}
                                            className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors text-sm bg-red-50 px-3 py-1 rounded-full"
                                        >
                                            <FaTrash className="text-xs" />
                                            <span>Vaciar carrito</span>
                                        </button>
                                    )}
                                </div>
                                
                                {loading ? (
                                    <div className="animate-pulse space-y-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="bg-gray-200 w-24 h-24 rounded-lg"></div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {validProducts.map((product) => (
                                            <div key={product._id} className="py-4 first:pt-0 last:pb-0">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    {/* Imagen */}
                                                    <div className="w-full sm:w-36 h-36 bg-blue-50 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                                                        <img 
                                                            src={product.productId.productImage[0]} 
                                                            alt={product.productId.productName} 
                                                            className="w-full h-full object-contain" 
                                                        />
                                                    </div>

                                                    {/* Información */}
                                                    <div className="flex-1 flex flex-col">
                                                        <div className="flex-grow">
                                                            <Link 
                                                                to={`/producto/${product.productId.slug || product.productId._id}`} 
                                                                className="text-lg font-semibold text-gray-900 hover:text-[#2A3190] transition-colors line-clamp-2"
                                                            >
                                                                {product.productId.productName}
                                                            </Link>
                                                            <p className="text-sm text-gray-500 mt-1">{product.productId.category}</p>
                                                        </div>
                                                        
                                                        <div className="mt-auto flex flex-wrap justify-between items-end gap-4">
                                                            <div>
                                                                <p className="text-sm text-gray-500">Precio unitario</p>
                                                                <p className="text-lg font-medium text-[#2A3190]">
                                                                    {displayINRCurrency(product.productId.sellingPrice)}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                                    <button 
                                                                        onClick={() => decreaseQty(product._id, product.quantity)} 
                                                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="w-10 h-8 flex items-center justify-center text-gray-800 font-medium">
                                                                        {product.quantity}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => increaseQty(product._id, product.quantity)}
                                                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                                
                                                                <button 
                                                                    onClick={() => deleteCartProduct(product._id)}
                                                                    className="text-red-500 hover:text-red-600 transition-colors p-2"
                                                                    title="Eliminar"
                                                                >
                                                                    <MdDelete className="text-xl" />
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="ml-auto text-right">
                                                                <p className="text-sm text-gray-500">Subtotal</p>
                                                                <p className="text-lg font-bold text-[#2A3190]">
                                                                    {displayINRCurrency(product.productId.sellingPrice * product.quantity)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                
                        {/* Resumen */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 border-l-4 border-[#2A3190] border-t border-r border-b border-gray-100">
                                <h2 className="text-xl font-bold text-[#2A3190] mb-6">
                                    Resumen del Pedido
                                </h2>
                
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Cantidad de productos</span>
                                        <span className="font-medium text-gray-900">{totalQty}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium text-gray-900">{displayINRCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between py-3 bg-blue-50 px-3 rounded-lg">
                                        <span className="text-lg font-medium text-[#2A3190]">Total</span>
                                        <span className="text-xl font-bold text-[#2A3190]">{displayINRCurrency(totalPrice)}</span>
                                    </div>
                                </div>

                                {/* Información del cliente para presupuesto */}
                                <div className="mt-8">
                                    <button 
                                        onClick={toggleCustomerForm}
                                        className="w-full text-center bg-[#2A3190] text-white py-3 rounded-lg hover:bg-[#1e236b] transition-all duration-300 shadow-md flex items-center justify-center gap-2 mb-4"
                                    >
                                        <MdPictureAsPdf className="text-xl" />
                                        <span>{showCustomerForm ? 'Ocultar formulario' : 'Solicitar presupuesto'}</span>
                                    </button>

                                    {showCustomerForm && (
                                        <div className="space-y-3 bg-blue-50 p-5 rounded-lg mt-4 mb-4 border border-blue-100">
                                            <h3 className="font-semibold text-[#2A3190]">Datos para el presupuesto</h3>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                                    Nombre del cliente *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={customerData.name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent text-sm"
                                                    placeholder="Nombre completo"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                                    Teléfono (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={customerData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent text-sm"
                                                    placeholder="Número de contacto"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                                    Email (opcional)
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={customerData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent text-sm"
                                                    placeholder="Correo electrónico"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3 mt-2">
                                                <button
                                                    onClick={generatePDF}
                                                    className="bg-[#2A3190] text-white py-2.5 rounded-lg hover:bg-[#1e236b] transition-all duration-300 flex items-center justify-center gap-1.5 text-sm shadow-md"
                                                >
                                                    <MdDownload className="text-lg" />
                                                    <span>Descargar PDF</span>
                                                </button>
                                                
                                                <button
  onClick={sendToWhatsApp}
  className="bg-[#25D366] text-white py-2.5 rounded-lg hover:bg-[#128C7E] transition-all duration-300 flex items-center justify-center gap-1.5 text-sm shadow-md"
>
  <MdWhatsapp className="text-lg" />
  <span>Enviar WhatsApp</span>
</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                
                                <Link
                                    to="/"
                                    className="mt-6 block text-center py-2.5 text-gray-600 hover:text-[#2A3190] transition-colors border border-gray-200 rounded-lg hover:border-[#2A3190]"
                                >
                                    Continuar comprando
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;