// frontend/src/hooks/useCheckout.js
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Context from '../context';
import SummaryApi from '../common';

const useCheckout = () => {
    const navigate = useNavigate();
    const { fetchUserAddToCart, cartProductCount, fetchUserDetails } = useContext(Context);

    // Estados principales
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Datos del checkout
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
            address: '',
            googleMapsUrl: ''
        },
        payment_method: '',
        notes: ''
    });

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            
            // Cargar carrito
            await loadCartItems();
            
            // Cargar datos del usuario si está logueado
            await loadUserData();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Error al cargar datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    const loadCartItems = async () => {
        try {
            const response = await fetch(SummaryApi.addToCartProductView.url, {
                method: SummaryApi.addToCartProductView.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('🛒 Cart items loaded:', result.data);
                setCartItems(result.data || []);
            } else {
                console.warn('No cart items found');
                setCartItems([]);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
        }
    };

    const loadUserData = async () => {
        try {
            const userDetails = await fetchUserDetails();
            
            if (userDetails && userDetails._id) {
                setUser(userDetails);
                setIsLoggedIn(true);
                
                // Pre-llenar datos del cliente
                setCheckoutData(prev => ({
                    ...prev,
                    customer_info: {
                        name: userDetails.name || '',
                        email: userDetails.email || '',
                        phone: userDetails.phone || '',
                        address: userDetails.address || prev.customer_info.address
                    }
                }));
                
                console.log('👤 User data loaded:', userDetails);
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setIsLoggedIn(false);
            setUser(null);
        }
    };

    // Funciones de navegación
    const goToNextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const goToPreviousStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const goToStep = (step) => {
        if (step >= 1 && step <= 4) {
            setCurrentStep(step);
        }
    };

    // Funciones de actualización de datos
    const updateCustomerInfo = (customerInfo) => {
        setCheckoutData(prev => ({
            ...prev,
            customer_info: { ...prev.customer_info, ...customerInfo }
        }));
    };

    const updateDeliveryLocation = (locationData) => {
        setCheckoutData(prev => ({
            ...prev,
            delivery_location: { ...prev.delivery_location, ...locationData }
        }));
    };

    const updateCheckoutData = (field, value) => {
        setCheckoutData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validaciones
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            default:
                return true;
        }
    };

    const validateStep1 = () => {
        const { customer_info, delivery_location, payment_method } = checkoutData;
        
        // Validar datos del cliente
        if (!customer_info.name?.trim()) {
            toast.error('El nombre es requerido');
            return false;
        }
        
        if (!customer_info.email?.trim()) {
            toast.error('El email es requerido');
            return false;
        }
        
        if (!/\S+@\S+\.\S+/.test(customer_info.email)) {
            toast.error('El email no es válido');
            return false;
        }
        
        if (!customer_info.phone?.trim()) {
            toast.error('El teléfono es requerido');
            return false;
        }
        
        // Validar ubicación de entrega
        if (!delivery_location.lat || !delivery_location.lng) {
            toast.error('Debe seleccionar una ubicación de entrega');
            return false;
        }
        
        // Validar método de pago
        if (!payment_method) {
            toast.error('Debe seleccionar un método de pago');
            return false;
        }
        
        return true;
    };

    const validateStep2 = () => {
        // El paso 2 es solo confirmación, pero podemos agregar validaciones adicionales
        return true;
    };

    const validateStep3 = () => {
        // Validaciones para el paso de pago
        return true;
    };

    // Función para verificar si el checkout está completo
    const isCheckoutComplete = () => {
        return validateStep1() && cartItems.length > 0;
    };

    // Calcular totales
    const calculateTotals = () => {
        const subtotal = cartItems.reduce((total, item) => {
            const price = item.productId?.sellingPrice || 0;
            return total + (price * item.quantity);
        }, 0);
        
        const taxRate = 0.1; // 10% IVA
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;
        const itemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        return {
            subtotal,
            taxAmount,
            totalAmount,
            itemsCount,
            taxRate
        };
    };

    // Crear pedido
    const createOrder = async () => {
        if (!validateStep1()) {
            return false;
        }

        setLoading(true);
        
        try {
            const totals = calculateTotals();
            
            // Preparar datos del pedido
            const orderData = {
                customer_info: checkoutData.customer_info,
                delivery_location: checkoutData.delivery_location,
                payment_method: checkoutData.payment_method,
                items: cartItems.map(item => ({
                    product_id: item.productId._id,
                    name: item.productId.productName,
                    quantity: item.quantity,
                    unit_price: item.productId.sellingPrice,
                    total: item.quantity * item.productId.sellingPrice,
                    image: item.productId.productImage?.[0] || '',
                    category: item.productId.category || '',
                    brand: item.productId.brandName || ''
                })),
                subtotal: totals.subtotal,
                tax_amount: totals.taxAmount,
                total_amount: totals.totalAmount,
                notes: checkoutData.notes || '',
                // Datos adicionales
                user_type: isLoggedIn ? 'registered' : 'guest',
                source: 'web',
                device_info: {
                    user_agent: navigator.userAgent,
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport: `${window.innerWidth}x${window.innerHeight}`
                }
            };

            console.log('📦 Creating order with data:', orderData);

            const response = await fetch(SummaryApi.orders.create.url, {
                method: SummaryApi.orders.create.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Order created successfully:', result.data);
                
                // Limpiar carrito
                await clearCart();
                
                // Navegar según el método de pago
                navigateAfterOrder(result.data);
                
                toast.success('¡Pedido creado exitosamente!');
                return result.data;
            } else {
                throw new Error(result.message || 'Error al crear el pedido');
            }
            
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error(`Error al crear el pedido: ${error.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Navegar después de crear el pedido
    const navigateAfterOrder = (orderData) => {
        const { payment_method, _id: orderId } = orderData;
        
        // Para todos los métodos de pago, ir a la confirmación
        // El iframe de Bancard se cargará automáticamente si es el método seleccionado
        navigate(`/confirmacion-pedido/${orderId}`, {
            state: { orderData }
        });
    };

    // Limpiar carrito después del pedido
    const clearCart = async () => {
        try {
            // Limpiar cada item del carrito
            for (const item of cartItems) {
                await fetch(SummaryApi.deleteCartProduct.url, {
                    method: SummaryApi.deleteCartProduct.method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: item._id })
                });
            }
            
            // Actualizar el contexto
            fetchUserAddToCart();
            
            console.log('🧹 Cart cleared successfully');
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    // Reset checkout data
    const resetCheckout = () => {
        setCurrentStep(1);
        setCheckoutData({
            customer_info: {
                name: '',
                email: '',
                phone: '',
                address: ''
            },
            delivery_location: {
                lat: null,
                lng: null,
                address: '',
                googleMapsUrl: ''
            },
            payment_method: '',
            notes: ''
        });
        setCartItems([]);
    };

    // Return del hook
    return {
        // Estado
        currentStep,
        loading,
        cartItems,
        checkoutData,
        user,
        isLoggedIn,
        
        // Funciones de navegación
        goToNextStep,
        goToPreviousStep,
        goToStep,
        
        // Funciones de actualización
        updateCustomerInfo,
        updateDeliveryLocation,
        updateCheckoutData,
        
        // Funciones de validación
        validateCurrentStep,
        isCheckoutComplete,
        
        // Funciones de cálculo
        calculateTotals,
        
        // Funciones de procesamiento
        createOrder,
        resetCheckout,
        
        // Funciones de recarga
        loadCartItems,
        loadUserData
    };
};

export default useCheckout;