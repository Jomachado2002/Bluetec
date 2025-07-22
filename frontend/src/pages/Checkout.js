import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaMapMarkerAlt, FaCreditCard, FaQrcode, FaLock, FaCheckCircle, FaPlus, FaMinus } from 'react-icons/fa';
import { localCartHelper } from '../helpers/addToCart';
import { formatIVABreakdown } from '../helpers/taxCalculator';
import displayINRCurrency from '../helpers/displayCurrency';
import SimpleLocationSelector from '../components/location/SimpleLocationSelector';
import BancardPayButton from '../components/BancardPayButton';
import SummaryApi from '../common';

// Paleta de colores principal
const COLORS = {
  primary: '#1a237e',       // Azul oscuro principal
  primaryLight: '#303f9f',  // Azul más claro para hover
  secondary: '#ffab00',     // Amarillo/accent
  light: '#f5f5f7',         // Fondo claro
  dark: '#121212',          // Texto oscuro
  gray: '#757575',          // Texto gris
  success: '#4caf50',       // Éxito/verde
  error: '#f44336',         // Error/rojo
  white: '#ffffff'          // Blanco
};

// Componente de tarjetas guardadas con nuevo diseño
const SavedCardsSection = ({ user, totalAmount, customerData, cartItems, onPaymentSuccess, onPaymentError }) => {
    const [registeredCards, setRegisteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [loadingCards, setLoadingCards] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        const fetchUserCards = async () => {
            if (!user?.bancardUserId) {
                setLoadingCards(false);
                return;
            }

            try {
                const url = `${process.env.REACT_APP_BACKEND_URL}/api/bancard/tarjetas/${user.bancardUserId}`;
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data?.cards) {
                        setRegisteredCards(result.data.cards);
                    }
                }
            } catch (error) {
                console.error('Error cargando tarjetas:', error);
            } finally {
                setLoadingCards(false);
            }
        };

        fetchUserCards();
    }, [user?.bancardUserId]);

    const handlePayWithSavedCard = async () => {
        if (!selectedCard) {
            toast.error('Selecciona una tarjeta');
            return;
        }

        setProcessingPayment(true);
        try {
            const paymentData = {
                amount: totalAmount.toFixed(2),
                currency: 'PYG',
                alias_token: selectedCard.alias_token,
                number_of_payments: 1,
                description: `Compra BlueTec - ${cartItems.length} productos`,
                customer_info: customerData,
                items: cartItems.map(product => ({
                    product_id: product.productId._id,
                    name: product.productId.productName,
                    quantity: product.quantity,
                    unitPrice: product.productId.sellingPrice,
                    unit_price: product.productId.sellingPrice,
                    total: product.quantity * product.productId.sellingPrice,
                    category: product.productId.category,
                    brand: product.productId.brandName
                })),
                user_type: 'REGISTERED',
                payment_method: 'saved_card',
                user_bancard_id: user.bancardUserId
            };

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bancard/pago-con-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                if (result.requires3DS) {
                    toast.info('🔐 Verificación 3DS requerida');
                    if (result.data?.iframe_url) {
                        window.open(result.data.iframe_url, '_blank', 'width=800,height=600');
                    }
                } else {
                    const responseData = result.data?.operation || result.data?.confirmation || result.data;
                    const isApproved = (responseData?.response === 'S' && responseData?.response_code === '00') || 
                                    result.data?.transaction_approved === true;

                    if (isApproved) {
                        toast.success('✅ Pago procesado exitosamente');
                        setTimeout(() => {
                            window.location.href = '/pago-exitoso?shop_process_id=' + (result.data.shop_process_id || Date.now());
                        }, 1500);
                    } else {
                        toast.error(`Pago rechazado: ${responseData?.response_description || 'Error desconocido'}`);
                    }
                }
            } else {
                toast.error(result.message || 'Error en el pago');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión al procesar el pago');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loadingCards) {
        return (
            <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a237e] mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando tarjetas guardadas...</p>
            </div>
        );
    }

    if (registeredCards.length === 0) {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="font-medium text-blue-800 mb-4 flex items-center gap-2 text-lg">
                <FaCreditCard className="text-blue-600" />
                Tus tarjetas guardadas
            </h3>
            
            <div className="space-y-3">
                {registeredCards.map((card, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedCard(card)}
                        className={`w-full p-4 rounded-lg border transition-all text-left 
                            ${selectedCard === card 
                                ? 'border-blue-500 bg-blue-100 shadow-sm' 
                                : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">
                                    {card.card_brand || 'Tarjeta'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {card.card_masked_number || '**** **** **** ****'}
                                </p>
                            </div>
                            {selectedCard === card && (
                                <FaCheckCircle className="text-blue-600 text-lg" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
            
            {selectedCard && (
                <button
                    onClick={handlePayWithSavedCard}
                    disabled={processingPayment}
                    className={`w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 
                        flex items-center justify-center gap-2 transition-colors hover:bg-blue-700`}
                >
                    {processingPayment ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Procesando...
                        </>
                    ) : (
                        <>
                            <FaLock />
                            Pagar con tarjeta seleccionada ({displayINRCurrency(totalAmount)})
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

const Checkout = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state?.user?.user);
    const isLoggedIn = !!user;
    
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        const loadCartData = () => {
            try {
                const items = localCartHelper.getCart();
                const validItems = items.filter(item => 
                    item && item.productId && 
                    typeof item.productId === 'object' &&
                    item.productId.productImage &&
                    Array.isArray(item.productId.productImage) &&
                    item.productId.productImage.length > 0
                );
                
                if (validItems.length === 0) {
                    toast.error('No hay productos válidos en el carrito');
                    navigate('/carrito');
                    return;
                }
                
                setCartItems(validItems);
            } catch (error) {
                console.error('Error cargando carrito:', error);
                toast.error('Error al cargar el carrito');
                navigate('/carrito');
            } finally {
                setLoading(false);
            }
        };

        loadCartData();
    }, [navigate]);

    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: ''
            });
            loadUserLocation();
        }
    }, [isLoggedIn, user]);

    const loadUserLocation = async () => {
        if (!isLoggedIn) return;
        
        try {
            const response = await fetch(SummaryApi.location.getUserLocation.url, {
                method: 'GET',
                credentials: 'include'
            });
            
            const result = await response.json();
            if (result.success && result.data && result.data.lat && result.data.lng) {
                setSelectedLocation({
                    lat: result.data.lat,
                    lng: result.data.lng,
                    address: result.data.address
                });
                setFormData(prev => ({
                    ...prev,
                    address: result.data.address || ''
                }));
            }
        } catch (error) {
            console.warn('Error cargando ubicación:', error);
        }
    };

    const totalPrice = cartItems.reduce((total, item) => 
        total + (item.quantity * item.productId.sellingPrice), 0
    );
    
    const ivaBreakdown = formatIVABreakdown(totalPrice);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationSave = (locationData) => {
        setSelectedLocation(locationData);
        setFormData(prev => ({
            ...prev,
            address: locationData.address || ''
        }));
        setShowLocationSelector(false);
        setCurrentStep(2);
        toast.success('Ubicación guardada correctamente');
    };

    const canProceedToPayment = () => {
        return selectedLocation && (
            isLoggedIn || 
            (formData.name.trim() && formData.phone.trim())
        );
    };

    const prepareBancardData = () => ({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: selectedLocation?.address || formData.address
    });

    const handlePaymentSuccess = (paymentData) => {
        console.log('Pago exitoso desde checkout:', paymentData);
        toast.success('Redirigiendo al procesamiento de pago...');
    };

    const handlePaymentError = (error) => {
        console.error('Error en pago desde checkout:', error);
        toast.error('Error al procesar el pago. Intenta nuevamente.');
    };

    const applyCoupon = () => {
        if (!couponCode.trim()) {
            toast.error('Ingresa un código promocional');
            return;
        }
        // Aquí iría la lógica para validar el cupón con el backend
        setCouponApplied(true);
        toast.success('Cupón aplicado correctamente');
    };

    const removeCoupon = () => {
        setCouponApplied(false);
        setCouponCode('');
        toast.info('Cupón removido');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1a237e] mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <Link 
                        to="/carrito" 
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-800 transition-colors"
                    >
                        <FaArrowLeft />
                        <span className="font-medium">Volver al carrito</span>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">¿Necesitas ayuda?</span>
                        <a href="/contacto" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Contacta con soporte
                        </a>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Columna izquierda - Pasos del checkout */}
                    <div className="flex-1">
                        {/* Indicador de pasos */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Finalizar compra</h1>
                                <div className="hidden md:flex items-center gap-4">
                                    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-800' : 'text-gray-400'}`}>
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {currentStep > 1 ? <FaCheckCircle /> : '1'}
                                        </div>
                                        <span className="font-medium">Envío</span>
                                    </div>
                                    
                                    <div className="w-16 h-px bg-gray-300"></div>
                                    
                                    <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-800' : 'text-gray-400'}`}>
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            2
                                        </div>
                                        <span className="font-medium">Pago</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile steps indicator */}
                            <div className="md:hidden bg-blue-50 rounded-lg p-3 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-medium ${currentStep === 1 ? 'text-blue-800' : 'text-gray-600'}`}>
                                        Paso 1: Envío
                                    </span>
                                    <span className={`text-sm font-medium ${currentStep === 2 ? 'text-blue-800' : 'text-gray-600'}`}>
                                        Paso 2: Pago
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: currentStep === 1 ? '50%' : '100%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Paso 1: Dirección */}
                        <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 transition-all ${currentStep === 1 ? 'block' : 'hidden'}`}>
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Información de envío</h2>
                            
                            {!isLoggedIn && (
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Ej: Juan Pérez"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Ej: 0981123456"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ej: juan@email.com"
                                        />
                                    </div>
                                </div>
                            )}

                            {isLoggedIn && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FaCheckCircle className="text-blue-600 text-lg" />
                                        <span className="font-medium text-blue-800">Datos de tu cuenta</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Nombre: </span>
                                            <span className="font-medium">{formData.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email: </span>
                                            <span className="font-medium">{formData.email}</span>
                                        </div>
                                        {formData.phone && (
                                            <div>
                                                <span className="text-gray-600">Teléfono: </span>
                                                <span className="font-medium">{formData.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Selección de ubicación */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-800 mb-3">Dirección de entrega</h3>
                                
                                {selectedLocation ? (
                                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                                        <div className="flex items-start gap-3">
                                            <FaMapMarkerAlt className="text-blue-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">Dirección seleccionada</p>
                                                <p className="text-gray-600 mt-1">{selectedLocation.address}</p>
                                                <button
                                                    onClick={() => setShowLocationSelector(true)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                                                >
                                                    Cambiar dirección
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowLocationSelector(true)}
                                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all"
                                    >
                                        <div className="text-center">
                                            <FaMapMarkerAlt className="text-3xl text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-700 font-medium">Seleccionar ubicación en el mapa</p>
                                            <p className="text-sm text-gray-500 mt-1">Haz clic para abrir el mapa</p>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {showLocationSelector && (
                                <div className="mt-6">
                                    <SimpleLocationSelector
                                        initialLocation={selectedLocation}
                                        onLocationSave={handleLocationSave}
                                        isUserLoggedIn={isLoggedIn}
                                        title="Seleccionar Dirección de Entrega"
                                        onClose={() => setShowLocationSelector(false)}
                                    />
                                </div>
                            )}

                            {/* Botón para continuar */}
                            {selectedLocation && canProceedToPayment() && (
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-medium mt-4"
                                >
                                    Continuar al pago
                                </button>
                            )}
                        </div>

                        {/* Paso 2: Pago */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Método de pago</h2>
                                
                                {!showPaymentOptions ? (
                                    <button
                                        onClick={() => setShowPaymentOptions(true)}
                                        className="w-full bg-blue-800 text-white py-4 rounded-lg hover:bg-blue-900 transition-colors font-medium flex items-center justify-center gap-3"
                                    >
                                        <FaLock className="text-lg" />
                                        Seleccionar método de pago
                                    </button>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg">
                                            <FaLock className="text-blue-600 text-lg" />
                                            <span className="font-medium text-blue-800">Pago 100% seguro con Bancard</span>
                                        </div>

                                        {/* Tarjetas guardadas para usuarios logueados */}
                                        {isLoggedIn && (
                                            <SavedCardsSection 
                                                user={user}
                                                totalAmount={totalPrice}
                                                customerData={prepareBancardData()}
                                                cartItems={cartItems}
                                                onPaymentSuccess={handlePaymentSuccess}
                                                onPaymentError={handlePaymentError}
                                            />
                                        )}
                                        
                                        {/* Separador si hay tarjetas guardadas */}
                                        {isLoggedIn && (
                                            <div className="flex items-center gap-4 my-4">
                                                <hr className="flex-1 border-gray-300" />
                                                <span className="text-gray-500 text-sm">o pagar con nueva tarjeta</span>
                                                <hr className="flex-1 border-gray-300" />
                                            </div>
                                        )}
                                        
                                        {/* Métodos de pago disponibles */}
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                            <h3 className="font-medium text-blue-800 mb-3">💳 Métodos de pago disponibles</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <FaCreditCard className="text-blue-600 text-xl mb-2" />
                                                    <span className="text-xs text-center">Tarjeta de crédito</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <FaCreditCard className="text-blue-600 text-xl mb-2" />
                                                    <span className="text-xs text-center">Tarjeta de débito</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <FaQrcode className="text-blue-600 text-xl mb-2" />
                                                    <span className="text-xs text-center">Billeteras digitales</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200">
                                                    <FaQrcode className="text-blue-600 text-xl mb-2" />
                                                    <span className="text-xs text-center">Código QR</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón de pago Bancard */}
                                        <BancardPayButton
                                            cartItems={cartItems}
                                            totalAmount={totalPrice}
                                            customerData={prepareBancardData()}
                                            onPaymentStart={() => console.log('Iniciando pago desde checkout')}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                            disabled={!canProceedToPayment()}
                                            className="w-full bg-blue-800 hover:bg-blue-900"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Resumen del pedido */}
                    <div className="w-full lg:w-96">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                            {/* Encabezado */}
                            <div className="bg-blue-800 text-white p-4 rounded-t-xl">
                                <h3 className="text-lg font-bold">Resumen del pedido</h3>
                            </div>
                            
                            {/* Lista de productos */}
                            <div className="p-4 border-b border-gray-200 max-h-72 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img 
                                                src={item.productId.productImage[0]} 
                                                alt={item.productId.productName}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {item.productId.productName}
                                            </p>
                                            <div className="flex justify-between items-center mt-1">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        className="text-gray-500 hover:text-blue-600 p-1"
                                                        onClick={() => {
                                                            const newItems = [...cartItems];
                                                            const index = newItems.findIndex(i => i._id === item._id);
                                                            if (index !== -1 && newItems[index].quantity > 1) {
                                                                newItems[index].quantity -= 1;
                                                                localCartHelper.updateCart(newItems);
                                                                setCartItems(newItems);
                                                            }
                                                        }}
                                                    >
                                                        <FaMinus className="text-xs" />
                                                    </button>
                                                    <span className="text-sm text-gray-700">{item.quantity}</span>
                                                    <button 
                                                        className="text-gray-500 hover:text-blue-600 p-1"
                                                        onClick={() => {
                                                            const newItems = [...cartItems];
                                                            const index = newItems.findIndex(i => i._id === item._id);
                                                            if (index !== -1) {
                                                                newItems[index].quantity += 1;
                                                                localCartHelper.updateCart(newItems);
                                                                setCartItems(newItems);
                                                            }
                                                        }}
                                                    >
                                                        <FaPlus className="text-xs" />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {displayINRCurrency(item.productId.sellingPrice * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Cupón promocional */}
                            <div className="p-4 border-b border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">¿Tienes un código promocional?</h4>
                                {couponApplied ? (
                                    <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3">
                                        <span className="text-green-700 text-sm font-medium">{couponCode}</span>
                                        <button 
                                            onClick={removeCoupon}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Ingresa el código"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button 
                                            onClick={applyCoupon}
                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Resumen de precios */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{ivaBreakdown.subtotalFormatted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IVA (10%)</span>
                                        <span className="font-medium">{ivaBreakdown.ivaFormatted}</span>
                                    </div>
                                    {couponApplied && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento</span>
                                            <span>- {displayINRCurrency(totalPrice * 0.1)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Envío</span>
                                        <span className="text-green-600 font-medium">A calcular</span>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-200 mt-4 pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{ivaBreakdown.totalFormatted}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Seguridad */}
                            <div className="bg-gray-50 p-4 rounded-b-xl border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FaLock className="text-blue-600" />
                                    <span>Compra 100% segura. Tus datos están protegidos.</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Información adicional */}
                        <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                            <h4 className="font-medium text-gray-800 mb-2">Políticas de compra</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Envíos en 24-48 horas hábiles</li>
                                <li>• Devoluciones dentro de los 15 días</li>
                                <li>• Garantía en todos los productos</li>
                                <li>• Soporte técnico 24/7</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;