// frontend/src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaMapMarkerAlt, FaUser, FaBuilding, FaShoppingCart, FaLock } from 'react-icons/fa';
import { localCartHelper } from '../helpers/addToCart';
import { formatIVABreakdown } from '../helpers/taxCalculator';
import displayINRCurrency from '../helpers/displayCurrency';
import SimpleLocationSelector from '../components/location/SimpleLocationSelector';
import BancardPayButton from '../components/BancardPayButton';
import SummaryApi from '../common';

const Checkout = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state?.user?.user);
    const isLoggedIn = !!user;
    
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [needsInvoice, setNeedsInvoice] = useState(false);
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    
    const [formData, setFormData] = useState({
        // Para consumidor final
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        // Para factura
        razonSocial: '',
        ruc: '',
        // Ubicación
        direccion: ''
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
            setFormData(prev => ({
                ...prev,
                nombre: user.name?.split(' ')[0] || '',
                apellido: user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                telefono: user.phone || ''
            }));
            
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
                    direccion: result.data.address || ''
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
    
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
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
            direccion: locationData.address || ''
        }));
        setShowLocationSelector(false);
        toast.success('Ubicación guardada correctamente');
    };

    // Validar formulario
    const validateForm = () => {
        if (needsInvoice) {
            if (!formData.razonSocial.trim() || !formData.ruc.trim()) {
                toast.error('Razón social y RUC son obligatorios para factura');
                return false;
            }
        } else {
            if (!formData.nombre.trim() || !formData.apellido.trim()) {
                toast.error('Nombre y apellido son obligatorios');
                return false;
            }
        }
        
        if (!formData.email.trim() || !formData.telefono.trim()) {
            toast.error('Email y teléfono son obligatorios');
            return false;
        }
        
        if (!selectedLocation) {
            toast.error('Selecciona una ubicación de entrega');
            return false;
        }
        
        return true;
    };

    // Preparar datos para Bancard
    const prepareBancardData = () => {
        const customerName = needsInvoice 
            ? formData.razonSocial 
            : `${formData.nombre} ${formData.apellido}`;
            
        return {
            name: customerName,
            email: formData.email,
            phone: formData.telefono,
            address: selectedLocation?.address || formData.direccion,
            // Datos adicionales para factura
            ...(needsInvoice && {
                razonSocial: formData.razonSocial,
                ruc: formData.ruc,
                needsInvoice: true
            })
        };
    };

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="container mx-auto px-4 py-8">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/carrito" 
                            className="flex items-center gap-2 text-gray-600 hover:text-[#2A3190] transition-colors"
                        >
                            <FaArrowLeft />
                            <span>Volver al carrito</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-[#2A3190] flex items-center gap-3">
                            <FaShoppingCart className="text-[#2A3190]" />
                            Finalizar Compra
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Columna Izquierda - Resumen de Productos */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A3190] mb-6 flex items-center gap-2">
                                <FaShoppingCart />
                                Resumen de tu Pedido
                            </h2>
                            
                            {/* Lista de productos */}
                            <div className="space-y-4 mb-6">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center border">
                                            <img 
                                                src={item.productId.productImage[0]} 
                                                alt={item.productId.productName}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 line-clamp-2">
                                                {item.productId.productName}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Cantidad: {item.quantity}
                                            </p>
                                            <p className="text-lg font-semibold text-[#2A3190]">
                                                {displayINRCurrency(item.productId.sellingPrice * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Desglose de IVA */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <h3 className="font-semibold text-[#2A3190] mb-3">💰 Desglose de Precios</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Subtotal ({totalQuantity} productos):</span>
                                            <span className="font-medium">{ivaBreakdown.subtotalFormatted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">IVA (10%):</span>
                                            <span className="font-medium">{ivaBreakdown.ivaFormatted}</span>
                                        </div>
                                        <div className="border-t border-blue-200 pt-2">
                                            <div className="flex justify-between">
                                                <span className="text-lg font-bold text-[#2A3190]">Total Final:</span>
                                                <span className="text-xl font-bold text-[#2A3190]">{ivaBreakdown.totalFormatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha - Datos y Pago */}
                    <div className="flex-1 lg:max-w-md">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            
                            {/* Tipo de Factura */}
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-[#2A3190] mb-4">📋 Tipo de Comprobante</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="invoiceType" 
                                            value={false}
                                            checked={!needsInvoice}
                                            onChange={() => setNeedsInvoice(false)}
                                            className="text-[#2A3190]"
                                        />
                                        <FaUser className="text-gray-500" />
                                        <div>
                                            <span className="font-medium">Consumidor Final</span>
                                            <p className="text-sm text-gray-500">Compra personal (sin factura)</p>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="invoiceType" 
                                            value={true}
                                            checked={needsInvoice}
                                            onChange={() => setNeedsInvoice(true)}
                                            className="text-[#2A3190]"
                                        />
                                        <FaBuilding className="text-gray-500" />
                                        <div>
                                            <span className="font-medium">Factura</span>
                                            <p className="text-sm text-gray-500">Para empresa o autónomo</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Datos del Cliente */}
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-[#2A3190] mb-4">
                                    {needsInvoice ? '🏢 Datos de Facturación' : '👤 Datos Personales'}
                                </h3>
                                
                                <div className="space-y-4">
                                    {needsInvoice ? (
                                        <>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                                    Razón Social *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="razonSocial"
                                                    value={formData.razonSocial}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                                    placeholder="Nombre de la empresa"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                                    RUC *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="ruc"
                                                    value={formData.ruc}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                                    placeholder="12345678-9"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                                        Nombre *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="nombre"
                                                        value={formData.nombre}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                                        placeholder="Tu nombre"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                                        Apellido *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="apellido"
                                                        value={formData.apellido}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                                        placeholder="Tu apellido"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">
                                            Teléfono *
                                        </label>
                                        <input
                                            type="tel"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                                            placeholder="+595 XXX XXXXXX"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-[#2A3190] mb-4 flex items-center gap-2">
                                    <FaMapMarkerAlt />
                                    Ubicación de Entrega
                                </h3>
                                
                                {selectedLocation ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                        <div className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-green-800 font-medium">Ubicación seleccionada</p>
                                                <p className="text-green-700 text-sm">{selectedLocation.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                        <p className="text-yellow-800 text-sm">⚠️ Selecciona una ubicación en el mapa</p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={() => setShowLocationSelector(!showLocationSelector)}
                                    className="w-full bg-[#2A3190] text-white py-2 rounded-lg hover:bg-[#1e236b] transition-colors"
                                >
                                    {selectedLocation ? 'Cambiar ubicación' : 'Seleccionar ubicación'}
                                </button>
                                
                                {showLocationSelector && (
                                    <div className="mt-4">
                                        <SimpleLocationSelector
                                            initialLocation={selectedLocation}
                                            onLocationSave={handleLocationSave}
                                            isUserLoggedIn={isLoggedIn}
                                            title="Ubicación de Entrega"
                                            onClose={() => setShowLocationSelector(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Método de Pago */}
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-[#2A3190] mb-4 flex items-center gap-2">
                                    <FaLock />
                                    Método de Pago
                                </h3>
                                
                                <button
                                    onClick={() => {
                                        if (validateForm()) {
                                            setShowPayment(!showPayment);
                                        }
                                    }}
                                    className="w-full bg-[#2A3190] text-white py-3 rounded-lg hover:bg-[#1e236b] transition-colors mb-4"
                                >
                                    {showPayment ? 'Ocultar opciones de pago' : 'Mostrar opciones de pago'}
                                </button>
                                
                                {showPayment && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <BancardPayButton
                                            cartItems={cartItems}
                                            totalAmount={totalPrice}
                                            customerData={prepareBancardData()}
                                            onPaymentStart={() => console.log('Iniciando pago desde checkout')}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                            disabled={!validateForm()}
                                        />
                                    </div>
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