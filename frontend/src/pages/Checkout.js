// frontend/src/pages/Checkout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCheckout from '../hooks/useCheckout';
import CustomerDataForm from '../components/checkout/CustomerDataForm';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import DeliveryLocationSelector from '../components/checkout/DeliveryLocationSelector';
import displayINRCurrency from '../helpers/displayCurrency';
import { FaArrowLeft, FaArrowRight, FaShoppingCart, FaSpinner } from 'react-icons/fa';

const Checkout = () => {
    const navigate = useNavigate();
    const {
        currentStep,
        loading,
        cartItems,
        checkoutData,
        isLoggedIn,
        user,
        goToNextStep,
        updateCustomerInfo,
        updateDeliveryLocation,
        updateCheckoutData,
        validateCurrentStep,
        isCheckoutComplete,
        calculateTotals,
        createOrder,
        resetCheckout
    } = useCheckout();

    // Verificar si hay productos en el carrito
    useEffect(() => {
    console.log('🏪 CHECKOUT - cartItems recibidos:', cartItems.length, cartItems);
    if (cartItems.length === 0) {
        toast.error('Tu carrito está vacío');
        navigate('/carrito');
    }
}, [cartItems, navigate]);;

    // Calcular totales
    const totals = calculateTotals();

   const handleLocationSave = (locationData) => {
    console.log('🗺️ GUARDANDO UBICACIÓN:', locationData);
    
    // Si no hay address, crear uno con las coordenadas
    const address = locationData.address || `Ubicación: ${locationData.lat}, ${locationData.lng}`;
    
    updateDeliveryLocation({
        lat: locationData.lat,
        lng: locationData.lng,
        address: address,
        googleMapsUrl: locationData.googleMapsUrl || `https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`
    });
    
    toast.success('Ubicación guardada correctamente');
};
    // Manejar finalización del pedido
    const handleFinishOrder = async () => {
        if (!validateCurrentStep()) {
            return;
        }

        const orderResult = await createOrder();
        if (orderResult) {
            // La navegación se maneja dentro de createOrder
            resetCheckout();
        }
    };

    // Renderizar contenido según el paso actual
     const renderStepContent = () => {
         if (currentStep === 1) {
            return (
                <div className="space-y-6">
                    {/* Datos del Cliente */}
                    <CustomerDataForm
                        customerData={checkoutData.customer_info}
                        onUpdateCustomer={updateCustomerInfo}
                        isLoggedIn={isLoggedIn}
                        user={user}
                    />
                    
                    {/* Ubicación de Entrega - Horizontal completo */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                                <FaShoppingCart className="text-white text-sm md:text-base" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">Ubicación de Entrega</h2>
                                <p className="text-gray-600 text-xs md:text-sm">Selecciona dónde quieres recibir tu pedido</p>
                            </div>
                        </div>
                        
                        <DeliveryLocationSelector
                            onLocationSelect={handleLocationSave}
                            initialLocation={checkoutData.delivery_location.lat ? {
                                lat: checkoutData.delivery_location.lat,
                                lng: checkoutData.delivery_location.lng
                            } : null}
                        />
                        
                        {checkoutData.delivery_location.address && (
                            <div className="mt-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-800 font-medium text-sm">✓ Ubicación seleccionada:</p>
                                <p className="text-green-700 text-sm">{checkoutData.delivery_location.address}</p>
                            </div>
                        )}
                    </div>

                    {/* Botones móviles - Solo visibles en móvil */}
                    <div className="block lg:hidden space-y-4">
                        {/* Método de Pago compacto para móvil */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-4">Método de Pago:</h4>
                            <PaymentMethodSelector
                                selectedMethod={checkoutData.payment_method}
                                onMethodSelect={(method) => updateCheckoutData('payment_method', method)}
                                isLoggedIn={isLoggedIn}
                                isCompact={true}
                            />
                        </div>

                        {/* Resumen rápido para móvil */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3">Resumen del Pedido</h4>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span>Productos ({totals.itemsCount}):</span>
                                    <span>{displayINRCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA (10%):</span>
                                    <span>{displayINRCurrency(totals.taxAmount)}</span>
                                </div>
                                <div className="border-t pt-2">
                                    <div className="flex justify-between text-lg font-bold text-[#2A3190]">
                                        <span>Total:</span>
                                        <span>{displayINRCurrency(totals.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botones de navegación para móvil */}
                        <div className="space-y-3">
                            {currentStep === 1 ? (
                                <button
                                    onClick={goToNextStep}
                                    disabled={!validateCurrentStep()}
                                    className="w-full bg-[#2A3190] text-white py-4 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                                >
                                    Continuar al Pago
                                    <FaArrowRight />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaArrowLeft />
                                        Volver
                                    </button>
                                    <button
                                        onClick={handleFinishOrder}
                                        disabled={loading || !isCheckoutComplete()}
                                        className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <FaShoppingCart />
                                                Finalizar Pedido
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // Paso 2: Confirmación
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <FaShoppingCart className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Confirmación del Pedido</h2>
                        <p className="text-gray-600 text-sm">Revisa toda la información antes de finalizar</p>
                    </div>
                </div>

                {/* Resumen de datos del cliente */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Datos del Cliente</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Nombre:</strong> {checkoutData.customer_info.name}</p>
                        <p><strong>Email:</strong> {checkoutData.customer_info.email}</p>
                        <p><strong>Teléfono:</strong> {checkoutData.customer_info.phone}</p>
                        {checkoutData.customer_info.address && (
                            <p><strong>Dirección:</strong> {
                                typeof checkoutData.customer_info.address === 'string' 
                                    ? checkoutData.customer_info.address 
                                    : typeof checkoutData.customer_info.address === 'object' 
                                        ? Object.values(checkoutData.customer_info.address).filter(Boolean).join(', ')
                                        : String(checkoutData.customer_info.address)
                            }</p>
                        )}
                    </div>
                </div>

                {/* Resumen de ubicación */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ubicación de Entrega</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p>{checkoutData.delivery_location.address}</p>
                        <a 
                            href={checkoutData.delivery_location.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2A3190] hover:underline text-sm"
                        >
                            Ver en Google Maps
                        </a>
                    </div>
                </div>

                {/* Resumen de productos */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Productos ({totals.itemsCount})</h3>
                    <div className="space-y-3">
                        {cartItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={item.productId.productImage[0]} 
                                        alt={item.productId.productName}
                                        className="w-12 h-12 object-contain bg-white rounded border"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{item.productId.productName}</p>
                                        <p className="text-gray-600 text-sm">Cantidad: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        {displayINRCurrency(item.quantity * item.productId.sellingPrice)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

               
                {/* Resumen de totales */}
                <div className="border-t pt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{displayINRCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IVA (10%):</span>
                            <span>{displayINRCurrency(totals.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-[#2A3190] border-t pt-2">
                            <span>Total:</span>
                            <span>{displayINRCurrency(totals.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Si no hay productos, mostrar mensaje
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Carrito vacío</h2>
                    <p className="text-gray-600 mb-6">No hay productos para procesar</p>
                    <button
                        onClick={() => navigate('/carrito')}
                        className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors"
                    >
                        Volver al carrito
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2A3190]">Finalizar Compra</h1>
                        <p className="text-gray-600">Completa tu pedido en unos simples pasos</p>
                    </div>
                    
                    <button
                        onClick={() => navigate('/carrito')}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors"
                    >
                        <FaArrowLeft />
                        Volver al carrito
                    </button>
                </div>

                

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    
                    {/* Contenido principal */}
                    <div className="lg:col-span-3">
                        {renderStepContent()}
                    </div>

                    {/* Resumen lateral */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h3>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span>Productos ({totals.itemsCount}):</span>
                                    <span>{displayINRCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA (10%):</span>
                                    <span>{displayINRCurrency(totals.taxAmount)}</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-bold text-[#2A3190]">
                                        <span>Total:</span>
                                        <span>{displayINRCurrency(totals.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Productos resumidos */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Productos:</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="truncate mr-2">
                                                {item.productId.productName} x{item.quantity}
                                            </span>
                                            <span className="font-medium">
                                                {displayINRCurrency(item.quantity * item.productId.sellingPrice)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Método de Pago */}
                            {currentStep === 1 ? (
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-4">Método de Pago:</h4>
                                    <PaymentMethodSelector
                                        selectedMethod={checkoutData.payment_method}
                                        onMethodSelect={(method) => updateCheckoutData('payment_method', method)}
                                        isLoggedIn={isLoggedIn}
                                        isCompact={true}
                                    />
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Método de Pago</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p>
                                            {checkoutData.payment_method === 'bancard' && 'Tarjeta de Crédito/Débito (Bancard)'}
                                            {checkoutData.payment_method === 'bank_transfer' && 'Transferencia Bancaria'}
                                            {checkoutData.payment_method === 'quote' && 'Presupuesto'}
                                        </p>
                                    </div>
                                </div>
                            )}
                             

                            {/* Botones de navegación */}
                            <div className="space-y-3">
                                {currentStep === 1 ? (
                                <button
                                    onClick={goToNextStep}
                                    disabled={!validateCurrentStep()}
                                    className="w-full bg-[#2A3190] text-white py-3 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar al Pago
                                    <FaArrowRight />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => navigate(-1)}    
                                        className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaArrowLeft />
                                        Volver
                                    </button>
                                    <button
                                        onClick={handleFinishOrder}
                                        disabled={loading || !isCheckoutComplete()}
                                        className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <FaShoppingCart />
                                                Finalizar Pedido
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;