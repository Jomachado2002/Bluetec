// frontend/src/components/checkout/DeliveryLocationSelector.js
import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch, FaCurrentLocation, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DeliveryLocationSelector = ({ onLocationSelect, initialLocation, customerData }) => {
    const [location, setLocation] = useState(initialLocation || { lat: null, lng: null });
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const autocompleteRef = useRef(null);

    // Paraguay center coordinates
    const paraguayCenter = { lat: -25.2637, lng: -57.5759 };

    // Inicializar Google Maps
    useEffect(() => {
        if (!window.google) {
            loadGoogleMaps();
        } else {
            initializeMap();
        }
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

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&language=es&region=PY`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setMapLoaded(true);
            initializeMap();
        };
        script.onerror = () => {
            toast.error('Error al cargar Google Maps');
        };
        document.head.appendChild(script);
    };

    const initializeMap = () => {
        if (!mapRef.current || !window.google) return;

        const mapOptions = {
            zoom: location.lat ? 16 : 11,
            center: location.lat ? location : paraguayCenter,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Crear marcador
        markerRef.current = new window.google.maps.Marker({
            position: location.lat ? location : paraguayCenter,
            map: mapInstanceRef.current,
            draggable: true,
            title: 'Ubicación de entrega'
        });

        // Si ya hay ubicación inicial, mostrar marcador
        if (location.lat) {
            markerRef.current.setPosition(location);
            reverseGeocode(location);
        } else {
            markerRef.current.setVisible(false);
        }

        // Listener para click en el mapa
        mapInstanceRef.current.addListener('click', (event) => {
            const newLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            updateLocationAndMarker(newLocation);
        });

        // Listener para arrastrar marcador
        markerRef.current.addListener('dragend', (event) => {
            const newLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            updateLocationAndMarker(newLocation);
        });

        // Inicializar autocompletado
        initializeAutocomplete();
    };

    const initializeAutocomplete = () => {
        if (!window.google || !window.google.maps.places) return;

        const input = document.getElementById('location-search');
        if (!input) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'PY' },
            fields: ['place_id', 'geometry', 'name', 'formatted_address'],
            types: ['establishment', 'geocode']
        });

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            
            if (!place.geometry || !place.geometry.location) {
                toast.error('No se pudo encontrar la ubicación');
                return;
            }

            const newLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };

            updateLocationAndMarker(newLocation);
            setAddress(place.formatted_address || place.name || '');
            setSearchQuery(place.formatted_address || place.name || '');
        });
    };

    const updateLocationAndMarker = (newLocation) => {
        setLocation(newLocation);
        
        if (markerRef.current) {
            markerRef.current.setPosition(newLocation);
            markerRef.current.setVisible(true);
        }

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newLocation);
            mapInstanceRef.current.setZoom(16);
        }

        reverseGeocode(newLocation);
    };

    const updateMapLocation = (newLocation) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newLocation);
            mapInstanceRef.current.setZoom(16);
        }

        if (markerRef.current) {
            markerRef.current.setPosition(newLocation);
            markerRef.current.setVisible(true);
        }
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
                        setSearchQuery(foundAddress);
                        
                        // Llamar callback con ubicación completa
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
                updateLocationAndMarker(newLocation);
                setLoading(false);
                toast.success('Ubicación actual obtenida');
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

    const searchLocation = async (query) => {
        if (!query.trim() || !window.google) return;

        setLoading(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            
            geocoder.geocode(
                { 
                    address: query,
                    componentRestrictions: { country: 'PY' }
                },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const result = results[0];
                        const newLocation = {
                            lat: result.geometry.location.lat(),
                            lng: result.geometry.location.lng()
                        };
                        updateLocationAndMarker(newLocation);
                        setAddress(result.formatted_address);
                        toast.success('Ubicación encontrada');
                    } else {
                        toast.error('No se encontró la ubicación');
                    }
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error('Error buscando ubicación:', error);
            toast.error('Error al buscar ubicación');
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        searchLocation(searchQuery);
    };

    const isLocationSelected = location.lat && location.lng;

    return (
        <div className="space-y-4">
            {/* Buscador de ubicación */}
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Buscar ubicación de entrega
                </label>
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            id="location-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] focus:border-transparent"
                            placeholder="Buscar dirección, lugar o punto de referencia..."
                        />
                    </div>
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Usar mi ubicación actual"
                    >
                        <FaCurrentLocation />
                        <span className="hidden sm:inline">Mi ubicación</span>
                    </button>
                </form>
            </div>

            {/* Mapa */}
            <div className="relative">
                <div
                    ref={mapRef}
                    className="w-full h-80 rounded-lg border border-gray-300 bg-gray-100"
                    style={{ minHeight: '320px' }}
                />
                
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin w-6 h-6 border-2 border-[#2A3190] border-t-transparent rounded-full"></div>
                            <span className="text-gray-600">Buscando ubicación...</span>
                        </div>
                    </div>
                )}

                {!mapLoaded && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-gray-600">Cargando mapa...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Información de la ubicación seleccionada */}
            {isLocationSelected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-600 text-lg mt-1" />
                        <div className="flex-1">
                            <p className="text-green-800 font-medium text-sm">✓ Ubicación seleccionada</p>
                            <p className="text-green-700 text-sm mt-1">{address}</p>
                            <div className="mt-2 text-xs text-green-600">
                                <p>Coordenadas: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm hover:underline"
                        >
                            Ver en Google Maps →
                        </a>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FaExclamationCircle className="text-yellow-600 text-lg mt-1" />
                        <div>
                            <p className="text-yellow-800 font-medium text-sm">Selecciona una ubicación</p>
                            <p className="text-yellow-700 text-sm mt-1">
                                Haz clic en el mapa, busca una dirección o usa tu ubicación actual
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 font-medium text-sm mb-2">💡 Instrucciones:</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Busca tu dirección en el campo de búsqueda</li>
                    <li>• Haz clic en el mapa para seleccionar una ubicación exacta</li>
                    <li>• Arrastra el marcador rojo para ajustar la posición</li>
                    <li>• Usa "Mi ubicación" para obtener tu posición actual</li>
                </ul>
            </div>
        </div>
    );
};

export default DeliveryLocationSelector;