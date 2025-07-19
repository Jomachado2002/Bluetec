// frontend/src/components/checkout/DeliveryLocationSelector.js
import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaLocationArrow, FaExclamationCircle, FaCheckCircle, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DeliveryLocationSelector = ({ onLocationSelect, initialLocation }) => {
    const [location, setLocation] = useState(initialLocation || { lat: null, lng: null });
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Paraguay center coordinates
    const paraguayCenter = { lat: -25.2637, lng: -57.5759 };

    // Inicializar Google Maps
    useEffect(() => {
        loadGoogleMaps();
    }, []);

    // Actualizar ubicación cuando cambie el prop inicial
    useEffect(() => {
        if (initialLocation && initialLocation.lat && initialLocation.lng) {
            setLocation(initialLocation);
            if (mapInstanceRef.current) {
                updateMapLocation(initialLocation);
            }
        }
    }, [initialLocation]);

    const loadGoogleMaps = () => {
        if (window.google) {
            initializeMap();
            return;
        }

        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            toast.error('API Key de Google Maps no configurado');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=PY`;
        script.async = true;
        script.defer = true;
        script.onload = () => initializeMap();
        script.onerror = () => toast.error('Error al cargar Google Maps');
        document.head.appendChild(script);
    };

    const initializeMap = () => {
        if (!mapRef.current || !window.google) return;

        // Configuración del mapa estilo Uber/Bolt
        const mapOptions = {
            zoom: location.lat ? 16 : 12,
            center: location.lat ? location : paraguayCenter,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'simplified' }]
                }
            ]
        };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Crear marcador personalizado estilo Uber (pin rojo grande)
        if (location.lat) {
            createUberStyleMarker(location);
            reverseGeocode(location);
        }

        // Listener para click en el mapa
        mapInstanceRef.current.addListener('click', (event) => {
            const newLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            handleLocationSelect(newLocation);
        });

        // Configurar autocompletado
        setupAutocomplete();
    };

    const createUberStyleMarker = (newLocation) => {
        // Remover marcador anterior
        if (markerRef.current) {
            markerRef.current.setMap(null);
        }

        // Crear marcador personalizado más grande y visible
        markerRef.current = new window.google.maps.Marker({
            position: newLocation,
            map: mapInstanceRef.current,
            draggable: true,
            title: 'Ubicación de entrega',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#FF0000"/>
                        <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
                        <circle cx="20" cy="20" r="4" fill="#FF0000"/>
                    </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 50),
                anchor: new window.google.maps.Point(20, 50)
            }
        });

        // Listener para arrastrar marcador
        markerRef.current.addListener('dragend', (event) => {
            const draggedLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            handleLocationSelect(draggedLocation);
        });
    };

    const updateMapLocation = (newLocation) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newLocation);
            mapInstanceRef.current.setZoom(16);
        }

        if (markerRef.current) {
            markerRef.current.setPosition(newLocation);
        } else {
            createUberStyleMarker(newLocation);
        }
    };

    const handleLocationSelect = (newLocation) => {
        setLocation(newLocation);
        createUberStyleMarker(newLocation);
        
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newLocation);
        }

        reverseGeocode(newLocation);
        toast.success('📍 Ubicación seleccionada');
    };

    const reverseGeocode = async (coords) => {
        if (!window.google || !coords.lat || !coords.lng) return;

        setLoading(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            
            geocoder.geocode(
                { location: coords },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const foundAddress = results[0].formatted_address;
                        setAddress(foundAddress);
                        
                        // Notificar al componente padre
                        onLocationSelect({
                            lat: coords.lat,
                            lng: coords.lng,
                            address: foundAddress,
                            googleMapsUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                        });
                    } else {
                        const fallbackAddress = `Ubicación: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
                        setAddress(fallbackAddress);
                        
                        onLocationSelect({
                            lat: coords.lat,
                            lng: coords.lng,
                            address: fallbackAddress,
                            googleMapsUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                        });
                    }
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error('Error en reverse geocoding:', error);
            setLoading(false);
        }
    };

    const setupAutocomplete = () => {
        if (!searchInputRef.current || !window.google?.maps?.places) return;

        const autocomplete = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
                componentRestrictions: { country: 'PY' },
                fields: ['geometry', 'formatted_address', 'name'],
                types: ['establishment', 'geocode']
            }
        );

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (!place.geometry) {
                toast.error('No se encontró la ubicación');
                return;
            }

            const newLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };

            handleLocationSelect(newLocation);
            setSearchQuery(place.formatted_address || place.name || '');
        });
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Tu navegador no soporta geolocalización');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                handleLocationSelect(newLocation);
                
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setZoom(17);
                }
                
                setLoading(false);
                toast.success('🎯 Ubicación actual obtenida');
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                toast.error('No se pudo obtener tu ubicación actual');
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 600000
            }
        );
    };

    const isLocationSelected = location.lat && location.lng;

    // Determinar altura del mapa según el dispositivo
    const getMapHeight = () => {
        if (window.innerWidth < 768) return '70vh';  // 70% de la altura de pantalla en móvil
        if (window.innerWidth < 1024) return '400px'; // Tablet
        return '500px'; // Desktop
    };

    return (
        <div className="space-y-4">
            {/* Buscador y botón de ubicación actual */}
             <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-3 text-gray-400 z-10" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent text-sm md:text-base"
                        placeholder="Buscar dirección, lugar o punto de referencia..."
                    />
                </div>
                
                <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px] text-sm md:text-base"
                >
                    <FaLocationArrow className={loading ? 'animate-spin' : ''} />
                    <span>Mi ubicación</span>
                </button>
            </div>
            
            {/* Mapa responsive */}
            <div className="relative rounded-lg overflow-hidden border border-gray-300">
                <div
                    ref={mapRef}
                    className="w-full bg-gray-100"
                    style={{ height: getMapHeight() }}
                />
                
                {/* Indicador de carga */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
                            <div className="animate-spin w-6 h-6 border-2 border-[#2A3190] border-t-transparent rounded-full"></div>
                            <span className="text-gray-700 font-medium">Cargando...</span>
                        </div>
                    </div>
                )}

                {/* Instrucciones flotantes */}
                 {!isLocationSelected && (
                    <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-auto md:max-w-sm z-10">
                        <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 border border-gray-200">
                            <div className="flex items-start gap-2 md:gap-3">
                                <div className="bg-red-100 p-1.5 md:p-2 rounded-full flex-shrink-0">
                                    <FaMapMarkerAlt className="text-red-600 text-xs md:text-sm" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-sm">¿Cómo marcar tu ubicación?</p>
                                    <div className="text-xs md:text-xs text-gray-700 space-y-1">
                                        <p>🔍 <strong>Busca</strong> un lugar arriba</p>
                                        <p>📍 <strong>Toca el mapa</strong> para marcar</p>
                                        <p>🔴 <strong>Arrastra</strong> el pin rojo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Estado de la ubicación */}
            {isLocationSelected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-600 text-lg mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-green-800 font-semibold text-sm mb-1">✓ Ubicación confirmada</p>
                            <p className="text-green-700 text-sm break-words">{address}</p>
                            <div className="mt-2 text-xs text-green-600">
                                Coordenadas: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FaExclamationCircle className="text-amber-600 text-lg mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-amber-800 font-semibold text-sm mb-1">Selecciona tu ubicación</p>
                            <p className="text-amber-700 text-sm">
                                Busca una dirección, usa tu GPS o haz clic directamente en el mapa
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryLocationSelector;