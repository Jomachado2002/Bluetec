// frontend/src/pages/OrderConfirmation.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaShoppingBag, FaCalendarAlt, FaCreditCard, FaWhatsapp, FaArrowLeft } from 'react-icons/fa';
import displayINRCurrency from '../helpers/displayCurrency';
import SummaryApi from '../common';
import BancardPayButton from '../components/BancardPayButton';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const user = useSelector(state => state?.user?.user);
    const isLoggedIn = !!user;
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar datos del pedido
    useEffect(() => {
    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${SummaryApi.orders.getById.url}/${orderId}`, {
                method: SummaryApi.orders.getById.method,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                setOrder(result.data);
            } else {
                toast.error(result.message || 'Error al cargar el pedido');
                navigate('/');
            }
        } catch (error) {
            console.error('Error al cargar pedido:', error);
            toast.error('Error de conexión');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    if (orderId) {
        fetchOrderDetails();
    }
}, [orderId, navigate]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${SummaryApi.orders.getById.url}/${orderId}`, {
                method: SummaryApi.orders.getById.method,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                setOrder(result.data);
            } else {
                toast.error(result.message || 'Error al cargar el pedido');
                navigate('/');
            }
        } catch (error) {
            console.error('Error al cargar pedido:', error);
            toast.error('Error de conexión');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Preparar items para Bancard (si es necesario)
    const prepareBancardItems = () => {
        if (!order?.items) return [];
        
        return order.items.map(item => ({
            _id: item._id,
            name: item.name,
            productId: { _id: item.product_id },
            quantity: item.quantity,
            unitPrice: item.unit_price,
            unit_price: item.unit_price,
            total: item.total_price
        }));
    };

    // Manejar pago con Bancard
    const handleBancardPayment = () => {
        toast.info('Iniciando proceso de pago con Bancard...');
    };

    const handleBancardSuccess = (paymentData) => {
        toast.success('Redirigiendo a Bancard para completar el pago...');
    };

    const handleBancardError = (error) => {
        toast.error('Error al procesar el pago. Intenta nuevamente.');
    };

    // Generar mensaje de WhatsApp
    const sendToWhatsApp = () => {
        if (!order) return;

        let message = `*CONSULTA SOBRE PEDIDO - BlueTec*\n\n`;
        message += `📋 *Número de Pedido:* ${order.order_id}\n`;
        message += `📅 *Fecha:* ${new Date(order.createdAt).toLocaleDateString('es-PY')}\n`;
        message += `💰 *Total:* ${displayINRCurrency(order.total_amount)}\n`;
        message += `💳 *Método:* ${order.payment_method === 'bank_transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}\n\n`;
        message += `Hola, tengo una consulta sobre mi pedido. Gracias.`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/+595984133733?text=${encodedMessage}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedido no encontrado</h2>
                    <p className="text-gray-600 mb-6">No se pudo encontrar la información del pedido</p>
                    <Link
                        to="/"
                        className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                
                {/* Header de confirmación */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-4xl text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 mb-2">¡Pedido Confirmado!</h1>
                    <p className="text-gray-600 text-lg">Tu pedido ha sido recibido exitosamente</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Información principal del pedido */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Información básica del pedido */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A3190] mb-4">Información del Pedido</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <FaShoppingBag className="text-sm" />
                                        <span className="text-sm font-medium">Número de Pedido</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#2A3190]">{order.order_id}</p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <FaCalendarAlt className="text-sm" />
                                        <span className="text-sm font-medium">Fecha</span>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">
                                        {new Date(order.createdAt).toLocaleDateString('es-PY', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <FaCreditCard className="text-sm" />
                                        <span className="text-sm font-medium">Método de Pago</span>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">
                                        {order.payment_method === 'bancard' && 'Tarjeta de Crédito/Débito'}
                                        {order.payment_method === 'bank_transfer' && 'Transferencia Bancaria'}
                                        {order.payment_method === 'quote' && 'Presupuesto'}
                                    </p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <span className="text-sm font-medium">Estado del Pago</span>
                                    </div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        order.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.payment_status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {order.payment_status === 'completed' && 'Completado'}
                                        {order.payment_status === 'pending' && 'Pendiente'}
                                        {order.payment_status === 'approved' && 'Aprobado'}
                                        {order.payment_status === 'rejected' && 'Rechazado'}
                                    </span>
                                </div>
                            </div>

                            {/* Acciones según método de pago */}
                            <div className="space-y-4">
                                {/* Para pagos con Bancard */}
                                {order.payment_method === 'bancard' && order.payment_status === 'pending' && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Completar Pago</h4>
                                        <BancardPayButton
                                            cartItems={prepareBancardItems()}
                                            totalAmount={order.total_amount}
                                            customerData={order.customer_info}
                                            onPaymentStart={handleBancardPayment}
                                            onPaymentSuccess={handleBancardSuccess}
                                            onPaymentError={handleBancardError}
                                            orderId={order.order_id}
                                        />
                                    </div>
                                )}

                                {/* Para transferencias bancarias */}
                                {order.payment_method === 'bank_transfer' && (
                                    <div>
                                        <Link
                                            to={`/instrucciones-transferencia/${order.order_id}`}
                                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            Ver Instrucciones de Transferencia
                                        </Link>
                                    </div>
                                )}

                                {/* Botón de WhatsApp */}
                                <button
                                    onClick={sendToWhatsApp}
                                    className="w-full bg-[#25D366] text-white py-3 rounded-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <FaWhatsapp className="text-lg" />
                                    Consultar por WhatsApp
                                </button>

                                {/* Ir al perfil (solo si está logueado) */}
                                {isLoggedIn && (
                                    <Link
                                        to="/mi-perfil"
                                        className="w-full bg-[#2A3190] text-white py-3 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center justify-center gap-2 font-medium"
                                    >
                                        Ver Mis Pedidos
                                    </Link>
                                )}

                                {/* Volver al inicio */}
                                <Link
                                    to="/"
                                    className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <FaArrowLeft />
                                    Volver al Inicio
                                </Link>
                            </div>

                            {/* Información adicional */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Próximos Pasos</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {order.payment_method === 'bancard' && order.payment_status === 'pending' && (
                                        <>
                                            <p>• Completa el pago con Bancard</p>
                                            <p>• Recibirás confirmación por email</p>
                                            <p>• Nos contactaremos para coordinar entrega</p>
                                        </>
                                    )}
                                    
                                    {order.payment_method === 'bancard' && order.payment_status === 'completed' && (
                                        <>
                                            <p>• ✅ Pago completado exitosamente</p>
                                            <p>• Nos contactaremos para coordinar entrega</p>
                                            <p>• Tiempo de entrega: 24-48 horas</p>
                                        </>
                                    )}
                                    
                                    {order.payment_method === 'bank_transfer' && (
                                        <>
                                            <p>• Realiza la transferencia bancaria</p>
                                            <p>• Sube el comprobante</p>
                                            <p>• Esperaremos verificación (24 hrs)</p>
                                            <p>• Te contactaremos para entrega</p>
                                        </>
                                    )}
                                    
                                    {order.payment_method === 'quote' && (
                                        <>
                                            <p>• Presupuesto generado</p>
                                            <p>• Válido por 5 días hábiles</p>
                                            <p>• Contacta para realizar pedido</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información de contacto */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">¿Necesitas ayuda?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">WhatsApp</h4>
                            <p className="text-blue-700 text-sm">+595 984 133733</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Email</h4>
                            <p className="text-green-700 text-sm">ventas@bluetec.com.py</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-2">Horarios</h4>
                            <p className="text-purple-700 text-sm">Lun - Vie: 8:00 - 18:00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
                       