// frontend/src/pages/OrderConfirmation.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BancardPayButton from '../components/BancardPayButton';
import displayINRCurrency from '../helpers/displayCurrency';
import SummaryApi from '../common';
import { 
    FaCheckCircle, 
    FaMapMarkerAlt, 
    FaUser, 
    FaPhone, 
    FaEnvelope,
    FaCreditCard,
    FaUniversity,
    FaFileInvoice,
    FaSpinner,
    FaArrowLeft
} from 'react-icons/fa';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Cargar datos del pedido
    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            
            const response = await fetch(`${SummaryApi.orders.getById.url}/${orderId}`, {
                method: SummaryApi.orders.getById.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                setOrder(result.data);
                console.log('📦 Order loaded:', result.data);
            } else {
                toast.error('No se pudo cargar el pedido');
                navigate('/');
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Error al cargar el pedido');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Preparar datos para Bancard
    const prepareBancardData = () => {
        if (!order) return null;

        return {
            // Información del cliente
            name: order.customer_info.name,
            email: order.customer_info.email,
            phone: order.customer_info.phone,
            address: order.delivery_location?.address || order.customer_info.address || ''
        };
    };

    // Preparar items del carrito para Bancard
    const prepareCartItems = () => {
        if (!order?.items) return [];

        return order.items.map(item => ({
            productId: {
                _id: item.product_id,
                productName: item.name,
                sellingPrice: item.unit_price,
                productImage: [item.image || '/placeholder-product.png'],
                category: item.category || '',
                brandName: item.brand || ''
            },
            quantity: item.quantity,
            unitPrice: item.unit_price
        }));
    };

    // Manejar inicio de pago
    const handlePaymentStart = () => {
        setPaymentLoading(true);
        console.log('🔄 Iniciando proceso de pago...');
    };

    // Manejar éxito del pago
    const handlePaymentSuccess = (paymentData) => {
        console.log('✅ Pago exitoso:', paymentData);
        setPaymentLoading(false);
        
        toast.success('¡Pago realizado exitosamente!');
        
        // Redirigir a página de éxito
        setTimeout(() => {
            navigate('/pago-exitoso', { 
                state: { 
                    orderId,
                    paymentData,
                    orderData: order
                }
            });
        }, 1500);
    };

    // Manejar error del pago
    const handlePaymentError = (error) => {
        console.error('❌ Error en el pago:', error);
        setPaymentLoading(false);
        
        toast.error(`Error en el pago: ${error.message}`);
    };

    // Obtener nombre del método de pago
    const getPaymentMethodName = (method) => {
        switch (method) {
            case 'bancard':
                return 'Tarjeta de Crédito/Débito (Bancard)';
            case 'bank_transfer':
                return 'Transferencia Bancaria';
            case 'quote':
                return 'Presupuesto';
            default:
                return method;
        }
    };

    // Obtener icono del método de pago
    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'bancard':
                return FaCreditCard;
            case 'bank_transfer':
                return FaUniversity;
            case 'quote':
                return FaFileInvoice;
            default:
                return FaCreditCard;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-[#2A3190] mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Cargando información del pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedido no encontrado</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    const cartItems = prepareCartItems();
    const customerData = prepareBancardData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-white text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#2A3190] mb-2">¡Pedido Confirmado!</h1>
                    <p className="text-gray-600">Tu pedido #{order.order_number} ha sido creado exitosamente</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Información del pedido */}
                    <div className="space-y-6">
                        
                        {/* Datos del cliente */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <FaUser className="text-[#2A3190] text-lg" />
                                <h3 className="text-lg font-semibold text-gray-900">Datos del Cliente</h3>
                            </div>
                            <div className="space-y-2 text-gray-700">
                                <div className="flex items-center gap-2">
                                    <FaUser className="text-gray-400 text-sm" />
                                    <span>{order.customer_info.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaEnvelope className="text-gray-400 text-sm" />
                                    <span>{order.customer_info.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-gray-400 text-sm" />
                                    <span>{order.customer_info.phone}</span>
                                </div>
                                {order.customer_info.address && (
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="text-gray-400 text-sm mt-1" />
                                        <span className="text-sm">{order.customer_info.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ubicación de entrega */}
                        {order.delivery_location && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <FaMapMarkerAlt className="text-[#2A3190] text-lg" />
                                    <h3 className="text-lg font-semibold text-gray-900">Ubicación de Entrega</h3>
                                </div>
                                <p className="text-gray-700 mb-3">{order.delivery_location.address}</p>
                                {order.delivery_location.google_maps_url && (
                                    <a 
                                        href={order.delivery_location.google_maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#2A3190] hover:underline text-sm font-medium"
                                    >
                                        Ver en Google Maps →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Productos */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Productos ({order.items.length})
                            </h3>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={item.image || '/placeholder-product.png'} 
                                                alt={item.name}
                                                className="w-12 h-12 object-contain bg-gray-50 rounded border"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {displayINRCurrency(item.quantity * item.unit_price)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {displayINRCurrency(item.unit_price)} c/u
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resumen y pago */}
                    <div className="space-y-6">
                        
                        {/* Resumen del pedido */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">{displayINRCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">IVA (10%):</span>
                                    <span className="font-medium">{displayINRCurrency(order.tax_amount)}</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-bold text-[#2A3190]">
                                        <span>Total:</span>
                                        <span>{displayINRCurrency(order.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Información del método de pago */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    {React.createElement(getPaymentMethodIcon(order.payment_method), {
                                        className: "text-[#2A3190] text-lg"
                                    })}
                                    <span className="font-medium text-gray-900">
                                        {getPaymentMethodName(order.payment_method)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Estado: <span className="font-medium">{order.status}</span>
                                </p>
                            </div>

                            {/* Formulario de pago Bancard - Solo si el método es Bancard */}
                            {order.payment_method === 'bancard' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-800 mb-2">Completar Pago</h4>
                                        <p className="text-blue-700 text-sm">
                                            El formulario de pago se está cargando automáticamente
                                        </p>
                                    </div>
                                    
                                    <BancardPayButton
                                        cartItems={cartItems}
                                        totalAmount={order.total_amount}
                                        customerData={customerData}
                                        onPaymentStart={handlePaymentStart}
                                        onPaymentSuccess={handlePaymentSuccess}
                                        onPaymentError={handlePaymentError}
                                        disabled={paymentLoading}
                                        skipForm={true}
                                        autoLoad={true}
                                    />
                                </div>
                            )}

                            {/* Transferencia Bancaria */}
                            {order.payment_method === 'bank_transfer' && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800 mb-2">Transferencia Bancaria</h4>
                                        <p className="text-green-700 text-sm mb-3">
                                            Para completar tu pedido, realiza la transferencia y sube el comprobante
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={() => navigate(`/instrucciones-transferencia/${orderId}`)}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <FaUniversity />
                                        Ver Instrucciones de Transferencia
                                    </button>
                                </div>
                            )}

                            {/* Presupuesto */}
                            {order.payment_method === 'quote' && (
                                <div className="space-y-4">
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <h4 className="font-medium text-purple-800 mb-2">Presupuesto Generado</h4>
                                        <p className="text-purple-700 text-sm">
                                            Tu presupuesto ha sido generado. Puedes descargarlo o recibirlo por WhatsApp
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                                            <FaFileInvoice />
                                            Descargar PDF
                                        </button>
                                        <button className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                                            💬
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón de volver */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors"
                    >
                        <FaArrowLeft />
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;