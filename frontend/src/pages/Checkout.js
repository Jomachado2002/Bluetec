// frontend/src/pages/Checkout.js - DISEÑO NUEVO ESTILO MERCADOLIBRE
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaMapMarkerAlt, FaCreditCard, FaQrcode, FaLock, FaCheckCircle } from 'react-icons/fa';
import { localCartHelper } from '../helpers/addToCart';
import { formatIVABreakdown } from '../helpers/taxCalculator';
import displayINRCurrency from '../helpers/displayCurrency';
import SimpleLocationSelector from '../components/location/SimpleLocationSelector';
import BancardPayButton from '../components/BancardPayButton';
import SummaryApi from '../common';


// ✅ COMPONENTE PARA TARJETAS GUARDADAS
const SavedCardsSection = ({ user, totalAmount, customerData, cartItems, onPaymentSuccess, onPaymentError }) => {
    const [registeredCards, setRegisteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [loadingCards, setLoadingCards] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Cargar tarjetas guardadas
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

    // Pagar con tarjeta guardada
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2A3190] mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando tarjetas guardadas...</p>
            </div>
        );
    }

    if (registeredCards.length === 0) {
        return null; // No mostrar nada si no hay tarjetas
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <FaCreditCard className="text-green-600" />
                Tus tarjetas guardadas
            </h3>
            
            <div className="space-y-2">
                {registeredCards.map((card, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedCard(card)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            selectedCard === card 
                                ? 'border-green-500 bg-green-100' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
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
                                <FaCheckCircle className="text-green-500" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
            
            {selectedCard && (
                <button
                    onClick={handlePayWithSavedCard}
                    disabled={processingPayment}
                    className="w-full mt-3 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
    const [currentStep, setCurrentStep] = useState(1); // 1: Envío, 2: Pago
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    // Cargar datos del carrito
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

    // Auto-completar datos del usuario si está logueado
    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: ''
            });
            
            // Cargar ubicación guardada si existe
            loadUserLocation();
        }
    }, [isLoggedIn, user]);

    // Cargar ubicación del usuario
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

    // Calcular totales
    const totalPrice = cartItems.reduce((total, item) => 
        total + (item.quantity * item.productId.sellingPrice), 0
    );
    
    const ivaBreakdown = formatIVABreakdown(totalPrice);

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejar selección de ubicación
    const handleLocationSave = (locationData) => {
        setSelectedLocation(locationData);
        setFormData(prev => ({
            ...prev,
            address: locationData.address || ''
        }));
        setShowLocationSelector(false);
        setCurrentStep(2); // Ir al paso de pago
        toast.success('Ubicación guardada correctamente');
    };

    // Validar datos mínimos
    const canProceedToPayment = () => {
        return selectedLocation && (
            isLoggedIn || // Si está logueado, con ubicación es suficiente
            (formData.name.trim() && formData.phone.trim()) // Si es invitado, necesita datos básicos
        );
    };

    // Preparar datos para Bancard
    const prepareBancardData = () => ({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: selectedLocation?.address || formData.address
    });

    // Manejar éxito del pago
    const handlePaymentSuccess = (paymentData) => {
        console.log('Pago exitoso desde checkout:', paymentData);
        toast.success('Redirigiendo al procesamiento de pago...');
    };

    const handlePaymentError = (error) => {
        console.error('Error en pago desde checkout:', error);
        toast.error('Error al procesar el pago. Intenta nuevamente.');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2A3190] mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                
                {/* Header con breadcrumb */}
                <div className="flex items-center gap-4 mb-6">
                    <Link 
                        to="/carrito" 
                        className="flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Volver</span>
                    </Link>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {currentStep > 1 ? <FaCheckCircle /> : '1'}
                        </div>
                        <span className={`font-medium ${currentStep >= 1 ? 'text-orange-500' : 'text-gray-500'}`}>Envío</span>
                        
                        <div className="w-16 h-px bg-gray-300"></div>
                        
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            2
                        </div>
                        <span className={`font-medium ${currentStep >= 2 ? 'text-orange-500' : 'text-gray-500'}`}>Pago</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Columna Principal */}
                    <div className="flex-1">
                        
                        {/* STEP 1: Dirección */}
                        {/* STEP 1: Dirección - SIEMPRE VISIBLE */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Dirección</h2>
                        
                        {!isLoggedIn && (
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Nombre completo *"
                                    />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Teléfono *"
                                    />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Email (opcional)"
                                />
                            </div>
                        )}

                        {/* Mostrar datos del usuario logueado */}
                        {isLoggedIn && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaCheckCircle className="text-green-600" />
                                    <span className="font-medium text-green-800">Datos de usuario</span>
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
                        
                        {selectedLocation ? (
                            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 mb-4">
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="text-orange-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">Mi Dirección</p>
                                        <p className="text-gray-600 text-sm mt-1">{selectedLocation.address}</p>
                                        <button
                                            onClick={() => setShowLocationSelector(true)}
                                            className="text-orange-500 text-sm hover:text-orange-600 mt-2"
                                        >
                                            Cambiar dirección
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLocationSelector(true)}
                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 hover:bg-orange-50 transition-all"
                            >
                                <div className="text-center">
                                    <FaMapMarkerAlt className="text-2xl text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 font-medium">Seleccionar ubicación en el mapa</p>
                                    <p className="text-sm text-gray-500">Haz clic para abrir el mapa</p>
                                </div>
                            </button>
                        )}
                        
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

                        {/* Botón para continuar al pago */}
                        {selectedLocation && canProceedToPayment() && currentStep === 1 && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                                >
                                    Continuar al pago
                                </button>
                            </div>
                        )}
                    </div>

                        {/* STEP 2: Método de pago */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Método de pago</h2>
                                
                                {!showPaymentOptions ? (
                                    <button
                                        onClick={() => setShowPaymentOptions(true)}
                                        className="w-full bg-[#2A3190] text-white py-4 rounded-lg hover:bg-[#1e236b] transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <FaLock />
                                        Pagar con Bancard
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <FaLock className="text-green-600" />
                                            <span className="font-medium text-green-800">Pago 100% seguro con Bancard</span>
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
                                            <div className="flex items-center gap-4 my-6">
                                                <hr className="flex-1 border-gray-300" />
                                                <span className="text-gray-500 text-sm">o pagar con nueva tarjeta</span>
                                                <hr className="flex-1 border-gray-300" />
                                            </div>
                                        )}
                                        
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <h3 className="font-medium text-blue-800 mb-2">💳 Métodos de pago disponibles:</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                                                <div className="flex items-center gap-2">
                                                    <FaCreditCard className="text-blue-600" />
                                                    <span>Tarjeta de crédito</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaCreditCard className="text-blue-600" />
                                                    <span>Tarjeta de débito</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaQrcode className="text-blue-600" />
                                                    <span>Billeteras digitales</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaQrcode className="text-blue-600" />
                                                    <span>Código QR</span>
                                                </div>
                                            </div>
                                        </div>

                                        <BancardPayButton
                                            cartItems={cartItems}
                                            totalAmount={totalPrice}
                                            customerData={prepareBancardData()}
                                            onPaymentStart={() => console.log('Iniciando pago desde checkout')}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                            disabled={!canProceedToPayment()}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Resumen */}
                    <div className="w-full lg:w-96">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-orange-500 mb-4">Resumen</h3>
                            
                            {/* Lista de productos compacta */}
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                                                <span className="text-xs text-gray-500">Cant: {item.quantity}</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {displayINRCurrency(item.productId.sellingPrice * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">{ivaBreakdown.subtotalFormatted}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Envío</span>
                                    <span className="text-green-600 font-medium">A calcular</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">{ivaBreakdown.totalFormatted}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Código promocional */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 mb-3">¿Tenés un código promocional?</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ingresá el código"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
                                        Añadir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;