// frontend/src/pages/Checkout.js - VERSIÓN CORREGIDA PARA CARRITO
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomerDataForm from '../components/checkout/CustomerDataForm';
import DeliveryLocationSelector from '../components/checkout/DeliveryLocationSelector';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import OrderSummary from '../components/checkout/OrderSummary';
import { FaShoppingCart, FaUser, FaMapMarkerAlt, FaCreditCard, FaCheck } from 'react-icons/fa';
import SummaryApi from '../common';
import BancardPayButton from '../components/BancardPayButton';

const Checkout = () => {
    const user = useSelector(state => state?.user?.user);

    // ✅ FUNCIÓN DEBUG PARA CHECKOUT
    const debugCheckoutCarrito = () => {
        console.log('🔍 === DEBUG CHECKOUT CARRITO ===');
        console.log('localStorage completo:', { ...localStorage });
        
        const cartItems = localStorage.getItem('cartItems');
        const addToCart = localStorage.getItem('addToCart');
        const cart = localStorage.getItem('cart');
        
        console.log('cartItems raw:', cartItems);
        console.log('addToCart raw:', addToCart);
        console.log('cart raw:', cart);
        
        if (cartItems) {
            try {
                const parsed = JSON.parse(cartItems);
                console.log('cartItems parsed:', parsed);
            } catch (e) {
                console.error('Error parseando cartItems:', e);
            }
        }
        
        if (addToCart) {
            try {
                const parsed = JSON.parse(addToCart);
                console.log('addToCart parsed:', parsed);
            } catch (e) {
                console.error('Error parseando addToCart:', e);
            }
        }
        
        if (cart) {
            try {
                const parsed = JSON.parse(cart);
                console.log('cart parsed:', parsed);
            } catch (e) {
                console.error('Error parseando cart:', e);
            }
        }
        
        console.log('🔄 Estado actual del checkout:', {
            cartItems: currentCartItems,
            cartLength: currentCartItems?.length || 0
        });
    };
    
    // ✅ CORREGIR SELECTOR DEL CARRITO - PROBAR DIFERENTES RUTAS
    const cartItems = useSelector(state => {
        console.log('🔍 Estado completo de Redux:', state);
        console.log('🛒 Estado del carrito desde selector:', state?.cart);
        
        // Probar diferentes posibles ubicaciones del carrito en el estado
        return state?.cart?.items || 
               state?.cart?.cartItems || 
               state?.cart || 
               state?.product?.cartProduct || 
               [];
    });
    
    const navigate = useNavigate();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [expandedPaymentMethod, setExpandedPaymentMethod] = useState(null);
    const [cartLoading, setCartLoading] = useState(true);
    
    // Estados del checkout
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    
    const [deliveryLocation, setDeliveryLocation] = useState({
        lat: null,
        lng: null,
        address: '',
        googleMapsUrl: ''
    });
    
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

    // ✅ VERIFICAR CARRITO AL CARGAR Y OBTENER DESDE LOCALSTORAGE SI ES NECESARIO
    useEffect(() => {
    console.log('🔄 === INICIALIZANDO CHECKOUT ===');
    
    // Solo setear cartLoading a false después de un momento
    const timer = setTimeout(() => {
        console.log('✅ Checkout inicializado - verificando carrito con getCartItems()');
        setCartLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
}, []);

    // Cargar datos del usuario si está logueado
    useEffect(() => {
        if (user) {
            console.log('👤 Cargando datos del usuario:', user);
            setCustomerData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address?.street || ''
            });
        }
    }, [user]);

    // ✅ FUNCIÓN MEJORADA PARA OBTENER ITEMS DEL CARRITO
    const getCartItems = () => {
    console.log('🛒 === OBTENIENDO ITEMS DEL CARRITO EN CHECKOUT ===');
    
    // ✅ USAR LA MISMA LÓGICA QUE Cart.js
    try {
        // ✅ 1. VERIFICAR MÚLTIPLES FUENTES DE DATOS (igual que Cart.js)
        const possibleKeys = ['cartItems', 'addToCart', 'cart'];
        
        for (const key of possibleKeys) {
            const rawData = localStorage.getItem(key);
            console.log(`🔍 Verificando localStorage[${key}]:`, rawData);
            
            if (rawData && rawData !== 'undefined' && rawData !== 'null') {
                try {
                    const parsed = JSON.parse(rawData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`✅ Carrito encontrado en ${key}:`, parsed);
                        
                        // ✅ VALIDAR PRODUCTOS (igual que Cart.js)
                        const validProducts = parsed.filter(item => {
                            const isValid = item && 
                                           item.productId && 
                                           item.productId.productName && 
                                           item.productId.sellingPrice && 
                                           item.quantity > 0;
                            
                            if (!isValid) {
                                console.warn('❌ Producto inválido en checkout:', item);
                            }
                            
                            return isValid;
                        });
                        
                        console.log(`✅ Productos válidos en checkout: ${validProducts.length} de ${parsed.length}`);
                        
                        if (validProducts.length > 0) {
                            return validProducts;
                        }
                    }
                } catch (e) {
                    console.warn(`⚠️ Error parseando ${key}:`, e);
                }
            }
        }
        
        console.log('📋 No se encontraron productos válidos en localStorage');
        return [];
        
    } catch (error) {
        console.error('❌ Error obteniendo carrito en checkout:', error);
        return [];
    }
};

    // Calcular totales del carrito
   const calculateTotals = () => {
    const items = getCartItems();
    console.log('🧮 Calculando totales para items en checkout:', items);
    
    const subtotal = items.reduce((total, item) => {
        // ✅ USAR LA ESTRUCTURA CORRECTA: item.productId.sellingPrice (igual que Cart.js)
        const price = item.productId?.sellingPrice || item.sellingPrice || item.price || 0;
        const quantity = item.quantity || 1;
        console.log(`💰 Item: ${item.productId?.productName || 'Sin nombre'} - Precio: ${price} x ${quantity}`);
        return total + (price * quantity);
    }, 0);
    
    const taxRate = 0.1; // 10% IVA
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    console.log('💰 Totales calculados en checkout:', { subtotal, taxAmount, total });
    
    return {
        subtotal: Math.round(subtotal),
        taxAmount: Math.round(taxAmount),
        total: Math.round(total)
    };
};

    const totals = calculateTotals();
    const currentCartItems = getCartItems();

    // Validaciones por step
    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!customerData.name.trim()) {
                    toast.error('Por favor completa tu nombre');
                    return false;
                }
                if (!customerData.email.trim()) {
                    toast.error('Por favor completa tu email');
                    return false;
                }
                if (!customerData.phone.trim()) {
                    toast.error('Por favor completa tu teléfono');
                    return false;
                }
                return true;
                
            case 2:
                if (!deliveryLocation.lat || !deliveryLocation.lng) {
                    toast.error('Por favor selecciona tu ubicación de entrega');
                    return false;
                }
                if (!deliveryLocation.address.trim()) {
                    toast.error('Dirección de entrega requerida');
                    return false;
                }
                return true;
                
            case 3:
                if (!selectedPaymentMethod) {
                    toast.error('Por favor selecciona un método de pago');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setExpandedPaymentMethod(null);
        }
    };

    // ✅ FUNCIÓN PRINCIPAL PARA CREAR PEDIDO (SIN PRESUPUESTOS)
    const createOrder = async () => {
        try {
            setLoading(true);
            console.log('📦 === CREANDO PEDIDO UNIFICADO ===');
            
            const items = getCartItems();
            if (!items || items.length === 0) {
                throw new Error('No hay items en el carrito');
            }
            
            // Preparar datos del pedido
            const orderData = {
                customer_info: {
                    name: customerData.name.trim(),
                    email: customerData.email.trim(),
                    phone: customerData.phone.trim(),
                    address: customerData.address.trim()
                },
                delivery_location: {
                    lat: deliveryLocation.lat,
                    lng: deliveryLocation.lng,
                    address: deliveryLocation.address,
                    googleMapsUrl: deliveryLocation.googleMapsUrl
                },
                items: items.map(item => {
    // ✅ USAR LA ESTRUCTURA CORRECTA: item.productId (igual que Cart.js)
    const product = item.productId || item;
    const unitPrice = product.sellingPrice || product.price || item.unitPrice || 0;
    const quantity = parseInt(item.quantity) || 1;
    
    console.log(`📦 Preparando item para pedido: ${product.productName} - ${unitPrice} x ${quantity}`);
    
                return {
                        product_id: product._id || product.id,
                        name: product.productName || product.name || 'Producto',
                        quantity: quantity,
                        unit_price: unitPrice,
                        total_price: quantity * unitPrice,
                        category: product.category || '',
                        brand: product.brandName || product.brand || '',
                        image_url: product.productImage?.[0] || product.image || ''
                    };
                }),
                payment_method: selectedPaymentMethod,
                subtotal: totals.subtotal,
                tax_amount: totals.taxAmount,
                total_amount: totals.total,
                session_id: `checkout_${Date.now()}`,
                user_agent: navigator.userAgent,
                device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            };

            console.log('📤 Datos del pedido:', orderData);

            // Crear pedido en el backend
            const response = await fetch(`${SummaryApi.baseURL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            console.log('📥 Respuesta del servidor:', result);

            if (result.success) {
                console.log('✅ Pedido creado exitosamente:', result.data.order_id);
                
                // Limpiar carrito después de crear el pedido exitosamente
                localStorage.removeItem('cart');
                
                toast.success('✅ Pedido creado exitosamente!');
                
                // Redirigir según el método de pago
                if (selectedPaymentMethod === 'bank_transfer') {
                    navigate(`/instrucciones-transferencia/${result.data.order_id}`);
                } else if (selectedPaymentMethod === 'bancard') {
                    // El pago Bancard se maneja en el BancardPaymentForm
                    return result.data;
                }
                
                return result.data;
            } else {
                console.error('❌ Error del servidor:', result);
                toast.error(result.message || 'Error al crear pedido');
                return null;
            }
        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            toast.error('Error de conexión al crear pedido');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCustomer = (newCustomerData) => {
        setCustomerData(newCustomerData);
    };

    const handleLocationSelect = (locationData) => {
        setDeliveryLocation(locationData);
        console.log('📍 Ubicación seleccionada:', locationData);
    };

    const handlePaymentMethodSelect = (method) => {
        setSelectedPaymentMethod(method);
        console.log('💳 Método de pago seleccionado:', method);
    };

    const steps = [
        { number: 1, title: 'Datos del Cliente', icon: FaUser, completed: currentStep > 1 },
        { number: 2, title: 'Ubicación de Entrega', icon: FaMapMarkerAlt, completed: currentStep > 2 },
        { number: 3, title: 'Método de Pago', icon: FaCreditCard, completed: currentStep > 3 },
        { number: 4, title: 'Confirmación', icon: FaCheck, completed: false }
    ];

    // ✅ MOSTRAR LOADING MIENTRAS SE VERIFICA EL CARRITO
    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando carrito...</p>
                </div>
            </div>
        );
    }

    // ✅ VERIFICACIÓN FINAL DEL CARRITO
    if (!cartLoading && (!currentCartItems || currentCartItems.length === 0)) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <FaShoppingCart className="text-6xl text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">No se encontraron productos</h2>
                <p className="text-gray-500 mb-6">
                    Si acabas de agregar productos al carrito, intenta recargar la página
                </p>
                
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            console.log('🔄 Recargando datos manualmente...');
                            const items = getCartItems();
                            console.log('Items encontrados:', items);
                            if (items.length > 0) {
                                window.location.reload();
                            }
                        }}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors mr-3"
                    >
                        🔄 Recargar Carrito
                    </button>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors"
                    >
                        Continuar Comprando
                    </button>
                </div>
                
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 text-xs text-gray-400">
                        <p>Debug: cartLoading={cartLoading ? 'true' : 'false'}</p>
                        <p>Debug: currentCartItems.length={currentCartItems?.length || 0}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* 🔍 BOTÓN TEMPORAL PARA DEBUG CHECKOUT - REMOVER DESPUÉS */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                        <h3 className="text-red-800 font-semibold mb-2">🔍 Debug Mode - Development Only</h3>
                        <div className="space-y-2">
                            <button 
                                onClick={debugCheckoutCarrito}
                                className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600"
                            >
                                🔍 Debug Carrito Checkout
                            </button>
                            <div className="text-sm text-red-700 mt-2">
                                Items actuales: {currentCartItems?.length || 0} | 
                                Cart Loading: {cartLoading ? 'Sí' : 'No'} |
                                Current Step: {currentStep}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#2A3190] mb-2">Finalizar Compra</h1>
                    <p className="text-gray-600">
                        Completa los datos para procesar tu pedido ({currentCartItems.length} productos)
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <div className="flex items-center space-x-4 md:space-x-8 overflow-x-auto pb-4">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.number;
                                const isCompleted = step.completed;
                                
                                return (
                                    <div key={step.number} className="flex items-center">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                            isActive 
                                                ? 'border-[#2A3190] bg-[#2A3190] text-white' 
                                                : isCompleted 
                                                ? 'border-green-500 bg-green-500 text-white'
                                                : 'border-gray-300 bg-white text-gray-400'
                                        }`}>
                                            {isCompleted ? <FaCheck className="text-sm" /> : <Icon className="text-sm" />}
                                        </div>
                                        <div className={`ml-2 text-sm font-medium ${
                                            isActive ? 'text-[#2A3190]' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            <span className="hidden md:inline">{step.title}</span>
                                            <span className="md:hidden">{step.number}</span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`w-8 h-0.5 mx-4 ${
                                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-2">
                        
                        {/* Step 1: Customer Data */}
                        {currentStep === 1 && (
                            <CustomerDataForm
                                customerData={customerData}
                                onUpdateCustomer={handleUpdateCustomer}
                                isLoggedIn={!!user}
                                user={user}
                            />
                        )}

                        {/* Step 2: Delivery Location */}
                        {currentStep === 2 && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                                        <FaMapMarkerAlt className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Ubicación de Entrega</h2>
                                        <p className="text-gray-600 text-sm">Selecciona dónde quieres recibir tu pedido</p>
                                    </div>
                                </div>
                                
                                <DeliveryLocationSelector
                                    onLocationSelect={handleLocationSelect}
                                    initialLocation={deliveryLocation}
                                />
                            </div>
                        )}

                        {/* Step 3: Payment Method */}
                        {currentStep === 3 && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                                        <FaCreditCard className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Método de Pago</h2>
                                        <p className="text-gray-600 text-sm">Elige cómo quieres pagar tu pedido</p>
                                    </div>
                                </div>
                                
                                <PaymentMethodSelector
                                    selectedMethod={selectedPaymentMethod}
                                    onMethodSelect={handlePaymentMethodSelect}
                                    expandedMethod={expandedPaymentMethod}
                                    setExpandedMethod={setExpandedPaymentMethod}
                                    isLoggedIn={!!user}
                                    checkoutData={{
                                        customer_info: customerData,
                                        delivery_location: deliveryLocation,
                                        items: currentCartItems
                                    }}
                                    cartTotal={totals.total}
                                    onCreateOrder={createOrder}
                                />
                            </div>
                        )}

                        {/* Step 4: Payment Form (for Bancard) */}
                        {currentStep === 4 && selectedPaymentMethod === 'bancard' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                                        <FaCreditCard className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Pago con Tarjeta</h2>
                                        <p className="text-gray-600 text-sm">Procesa tu pago de forma segura</p>
                                    </div>
                                </div>
                                
                                <BancardPayButton
                                    orderData={{
                                        customer_info: customerData,
                                        delivery_location: deliveryLocation,
                                        items: currentCartItems,
                                        total_amount: totals.total
                                    }}
                                    onCreateOrder={createOrder}
                                />
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            
                            {currentStep < 3 && (
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-[#2A3190] text-white rounded-lg hover:bg-[#1e236b] transition-colors"
                                >
                                    Siguiente
                                </button>
                            )}
                            
                            {currentStep === 3 && selectedPaymentMethod === 'bancard' && (
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    className="px-6 py-3 bg-[#2A3190] text-white rounded-lg hover:bg-[#1e236b] transition-colors"
                                >
                                    Proceder al Pago
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <OrderSummary
                                items={currentCartItems}
                                totals={totals}
                                customerData={customerData}
                                deliveryLocation={deliveryLocation}
                                selectedPaymentMethod={selectedPaymentMethod}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;