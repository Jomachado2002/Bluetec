// frontend/src/hooks/useCheckout.js - HOOK PARA GESTIÓN DE CHECKOUT
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import { localCartHelper } from '../helpers/addToCart';

const useCheckout = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state?.user?.user);
    const isLoggedIn = !!user;

    // ✅ ESTADO DEL CHECKOUT
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState(() => {
    console.log('🚀 Inicializando cartItems en useCheckout');
    const items = localCartHelper.getCart();
    const validItems = items.filter(item => 
        item.productId && 
        typeof item.productId === 'object' &&
        item.productId.productName &&
        (item.productId.sellingPrice !== undefined && item.productId.sellingPrice !== null)
    );
    console.log('✅ Items iniciales válidos:', validItems.length);
    return validItems;
});
    const [checkoutData, setCheckoutData] = useState({
        customer_info: {
            name: '',
            email: '',
            phone: '',
            address: ''
        },
        delivery_location: {
            lat: null,
            lng: null,
            address: ''
        },
        payment_method: '',
        order_notes: ''
    });

    // ✅ CARGAR DATOS INICIALES
    useEffect(() => {
        loadCartItems();
        if (isLoggedIn && user) {
            setCheckoutData(prev => ({
                ...prev,
                customer_info: {
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || ''
                }
            }));
        }
    }, [isLoggedIn, user]);

    // ✅ CARGAR ITEMS DEL CARRITO
   const loadCartItems = () => {
    const items = localCartHelper.getCart();
    console.log('🔍 useCheckout - Items del localStorage:', items.length, items);
    
    const validItems = items.filter(item => 
        item.productId && 
        typeof item.productId === 'object' &&
        item.productId.productName &&
        (item.productId.sellingPrice !== undefined && item.productId.sellingPrice !== null)
    );
    
    console.log('✅ useCheckout - Items válidos después filtro:', validItems.length, validItems);
    setCartItems(validItems);
};

    // ✅ CALCULAR TOTALES
    const calculateTotals = () => {
        const subtotal = cartItems.reduce((sum, item) => 
            sum + (item.quantity * item.productId.sellingPrice), 0
        );
        const taxAmount = subtotal * 0.1; // 10% IVA
        const totalAmount = subtotal + taxAmount;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            itemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        };
    };

    // ✅ ACTUALIZAR DATOS DEL CHECKOUT
    const updateCheckoutData = (field, value) => {
        setCheckoutData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // ✅ ACTUALIZAR INFORMACIÓN DEL CLIENTE
    const updateCustomerInfo = (customerData) => {
        setCheckoutData(prev => ({
            ...prev,
            customer_info: {
                ...prev.customer_info,
                ...customerData
            }
        }));
    };

    // ✅ ACTUALIZAR UBICACIÓN DE ENTREGA
    const updateDeliveryLocation = (locationData, callback) => {
    setCheckoutData(prev => {
        const newData = {
            ...prev,
            delivery_location: {
                lat: locationData.lat,
                lng: locationData.lng,
                address: locationData.address,
                googleMapsUrl: locationData.googleMapsUrl || `https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`
            }
        };
        
        console.log('📍 Estado actualizado:', newData.delivery_location);
        
        // Ejecutar callback después de actualizar
        if (callback) setTimeout(callback, 0);
        
        return newData;
    });
};

    // ✅ VALIDAR PASO ACTUAL
    const validateCurrentStep = () => {
    switch (currentStep) {
       case 1: // Datos del cliente
    const customerInfo = checkoutData?.customer_info || {};
    const { name = '', email = '', phone = '' } = customerInfo;
    
    console.log('👤 VALIDANDO PASO 1:', {
        customerInfo,
        name: `"${name}"`,
        email: `"${email}"`,
        phone: `"${phone}"`,
        nameValid: !!name.trim(),
        emailValid: !!(email.trim() && /\S+@\S+\.\S+/.test(email)),
        phoneValid: !!phone.trim()
    });
    
    if (!name.trim()) {
        console.log('❌ Falta nombre');
        return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        console.log('❌ Falta email válido');
        return false;
    }
    if (!phone.trim()) {
        console.log('❌ Falta teléfono');
        return false;
    }
    console.log('✅ Paso 1 válido');
    return true;
            
        // Resto igual pero SIN toast.error

        case 2: // Ubicación de entrega
    const deliveryLocation = checkoutData?.delivery_location || {};
    const { lat, lng, address = '' } = deliveryLocation;
    
    console.log('🗺️ VALIDANDO UBICACIÓN:', {
        deliveryLocation,
        lat,
        lng,
        address,
        hasLatLng: !!(lat && lng),
        hasAddress: !!address.trim(),
        passesValidation: !!(lat && lng && address.trim())
    });
    
    if (!lat || !lng) {
        console.log('❌ Falta lat/lng');
        return false;
    }
    if (!address.trim()) {
        console.log('❌ Falta address');
        return false;
    }
    console.log('✅ Validación ubicación OK');
    return true;
    

        case 3: // Método de pago
            if (!checkoutData?.payment_method) {
                return false;
            }
            return true;

        default:
            return true;
    }
};

    // ✅ AVANZAR AL SIGUIENTE PASO
    const nextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    // ✅ RETROCEDER AL PASO ANTERIOR
    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // ✅ IR A PASO ESPECÍFICO
    const goToStep = (step) => {
        if (step < currentStep || validateCurrentStep()) {
            setCurrentStep(step);
        }
    };

    // ✅ PREPARAR ITEMS PARA EL PEDIDO
    const prepareOrderItems = () => {
        return cartItems.map(item => ({
            product_id: item.productId._id,
            name: item.productId.productName,
            quantity: item.quantity,
            unit_price: item.productId.sellingPrice,
            total_price: item.quantity * item.productId.sellingPrice,
            category: item.productId.category || '',
            brand: item.productId.brandName || '',
            image_url: item.productId.productImage?.[0] || ''
        }));
    };

    // ✅ CREAR PEDIDO
    const createOrder = async () => {
        if (!validateCurrentStep()) return null;

        setLoading(true);
        try {
            const totals = calculateTotals();
            const orderData = {
    customer_info: checkoutData.customer_info,
    delivery_location: checkoutData.delivery_location,
    items: prepareOrderItems(),
    payment_method: checkoutData.payment_method,
    order_notes: checkoutData.order_notes || '',
    device_type: window.innerWidth < 768 ? 'mobile' : 
                window.innerWidth < 1024 ? 'tablet' : 'desktop'
};

            console.log('📦 Creando pedido:', orderData);

            const response = await fetch(SummaryApi.orders.create.url, {
                method: SummaryApi.orders.create.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            const result = await response.json();
            console.log('📋 Backend response:', result);

            if (result.success) {
                console.log('✅ Pedido creado exitosamente:', result.data);
                
                // Limpiar carrito
                localCartHelper.clearCart();
                
                // Navegar según el método de pago
                if (result.data.next_step === 'bank_transfer_instructions') {
                    navigate(`/instrucciones-transferencia/${result.data.order.order_id}`);
                } else if (result.data.next_step === 'bancard_payment') {
                    // Mantener funcionalidad Bancard existente
                    navigate(`/confirmacion-pedido/${result.data.order.order_id}`);
                } else {
                    navigate(`/confirmacion-pedido/${result.data.order.order_id}`);
                }
                
                toast.success('Pedido creado exitosamente');
                return result.data;
            } else {
                toast.error(result.message || 'Error al crear pedido');
                return null;
            }
        } catch (error) {
    console.error('❌ Error completo:', {
        message: error.message,
        stack: error.stack,
        url: SummaryApi.orders.create.url,
        method: SummaryApi.orders.create.method
    });
    toast.error('Error de conexión al crear pedido');
    return null;
        } finally {
            setLoading(false);
        }
    };

    // ✅ OBTENER PEDIDO POR ID
    const getOrderById = async (orderId) => {
        if (!orderId) return null;

        setLoading(true);
        try {
            const response = await fetch(`${SummaryApi.orders.getById.url}/${orderId}`, {
                method: SummaryApi.orders.getById.method,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                toast.error(result.message || 'Error al obtener pedido');
                return null;
            }
        } catch (error) {
            console.error('❌ Error obteniendo pedido:', error);
            toast.error('Error de conexión al obtener pedido');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // ✅ REINICIAR CHECKOUT
    const resetCheckout = () => {
        setCurrentStep(1);
        setCheckoutData({
            customer_info: {
                name: isLoggedIn ? user?.name || '' : '',
                email: isLoggedIn ? user?.email || '' : '',
                phone: isLoggedIn ? user?.phone || '' : '',
                address: isLoggedIn ? user?.address || '' : ''
            },
            delivery_location: {
                lat: null,
                lng: null,
                address: ''
            },
            payment_method: '',
            order_notes: ''
        });
        loadCartItems();
    };

    // ✅ VERIFICAR SI EL CHECKOUT ESTÁ COMPLETO
    const isCheckoutComplete = () => {
        return currentStep === 4 && validateCurrentStep();
    };

    // ✅ OBTENER PROGRESO DEL CHECKOUT
    const getProgress = () => {
        return (currentStep / 4) * 100;
    };

    // ✅ OBTENER PASOS DISPONIBLES
    const getSteps = () => {
        return [
            { step: 1, title: 'Datos del Cliente', completed: currentStep > 1 },
            { step: 2, title: 'Ubicación de Entrega', completed: currentStep > 2 },
            { step: 3, title: 'Método de Pago', completed: currentStep > 3 },
            { step: 4, title: 'Confirmación', completed: currentStep > 4 }
        ];
    };

    return {
        // Estado
        currentStep,
        loading,
        cartItems,
        checkoutData,
        isLoggedIn,
        user,
        
        // Funciones de navegación
        nextStep,
        prevStep,
        goToStep,
        
        // Funciones de actualización
        updateCheckoutData,
        updateCustomerInfo,
        updateDeliveryLocation,
        
        // Funciones de validación
        validateCurrentStep,
        isCheckoutComplete,
        
        // Funciones de cálculo
        calculateTotals,
        
        // Funciones de pedido
        createOrder,
        getOrderById,
        
        // Funciones de utilidad
        resetCheckout,
        getProgress,
        getSteps,
        prepareOrderItems,
        loadCartItems
    };
};

export default useCheckout;