import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaSave, FaSearch, FaLocationArrow, FaTimes, FaCrosshairs, FaMapPin, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../../common';

const SimpleLocationSelector = ({ 
  initialLocation = null, 
  onLocationSave,
  isUserLoggedIn = false,
  title = "Seleccionar Ubicación de Entrega",
  onClose
}) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [googleMapsShareUrl, setGoogleMapsShareUrl] = useState('');

  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      setIsLoading(false);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setIsLoading(false);
      toast.error('API Key de Google Maps no configurado');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      setGoogleMapsLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setIsLoading(false);
      toast.error('Error cargando Google Maps');
    };
    
    document.head.appendChild(script);

    return () => {
      if (marker) marker.setMap(null);
    };
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [googleMapsLoaded, map]);

  // ✅ GENERAR URL DE GOOGLE MAPS COMPARTIBLE
  const generateGoogleMapsShareUrl = (lat, lng) => {
    // Formato de URL compartible de Google Maps
    return `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${lat},${lng}&z=18&t=m`;
  };

  // ✅ GENERAR URL ALTERNATIVA SI NO FUNCIONA LA PRIMERA
  const generateAlternativeGoogleMapsUrl = (lat, lng) => {
    return `https://www.google.com/maps/place/${lat},${lng}/@${lat},${lng},17z`;
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      const center = selectedLocation || { lat: -25.2637, lng: -57.5759 }; // Asunción por defecto
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: selectedLocation ? 17 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setupAutocomplete();
      mapInstance.addListener('click', handleMapClick);
      
      if (selectedLocation) {
        createMarker(selectedLocation, mapInstance);
        reverseGeocode(selectedLocation);
        // Generar URL de Google Maps al inicializar
        const shareUrl = generateGoogleMapsShareUrl(selectedLocation.lat, selectedLocation.lng);
        setGoogleMapsShareUrl(shareUrl);
      }

      setMap(mapInstance);
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      toast.error('Error inicializando el mapa');
    }
  };

  const setupAutocomplete = () => {
    if (!searchInputRef.current || !window.google?.maps?.places) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'py' },
          fields: ['geometry', 'formatted_address', 'name', 'place_id'],
          types: ['establishment', 'geocode']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          toast.error('No se encontraron detalles para esta dirección');
          return;
        }

        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        if (map) {
          map.setCenter(location);
          map.setZoom(17);
        }
        
        setSearchValue(place.formatted_address || place.name || '');
        setAddress(place.formatted_address || place.name || '');
        
        // ✅ NO marcar automáticamente, solo centrar el mapa
        toast.info('📍 Ubicación encontrada. Haz clic en el mapa para marcar tu ubicación exacta');
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.warn('Error configurando autocompletado:', error);
    }
  };

  const createMarker = (location, mapInstance = map) => {
    if (marker) marker.setMap(null);
    
    const newMarker = new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      draggable: true,
      title: 'Tu ubicación de entrega - Arrastra para ajustar',
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    newMarker.addListener('dragend', (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      reverseGeocode(newLocation);
      
      // ✅ Generar nueva URL de Google Maps
      const shareUrl = generateGoogleMapsShareUrl(newLocation.lat, newLocation.lng);
      setGoogleMapsShareUrl(shareUrl);
      
      toast.success('📍 Ubicación actualizada');
    });

    setMarker(newMarker);
  };

  const handleMapClick = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setSelectedLocation(location);
    createMarker(location);
    reverseGeocode(location);
    
    // ✅ Generar URL de Google Maps al hacer clic
    const shareUrl = generateGoogleMapsShareUrl(location.lat, location.lng);
    setGoogleMapsShareUrl(shareUrl);
    
    toast.success('📍 Ubicación marcada correctamente');
  };

  const reverseGeocode = async (location) => {
    try {
      const response = await fetch(SummaryApi.location.reverseGeocode.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: location.lat, lng: location.lng })
      });

      const result = await response.json();
      if (result.success) {
        setAddress(result.data.formatted_address);
      }
    } catch (error) {
      console.warn('Error obteniendo dirección:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('❌ Geolocalización no soportada en este navegador');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (map) {
          map.setCenter(location);
          map.setZoom(18);
        }
        
        setSelectedLocation(location);
        createMarker(location);
        reverseGeocode(location);
        
        // ✅ Generar URL de Google Maps para ubicación actual
        const shareUrl = generateGoogleMapsShareUrl(location.lat, location.lng);
        setGoogleMapsShareUrl(shareUrl);
        
        setGettingLocation(false);
        toast.success('🎯 Ubicación actual obtenida y marcada');
      },
      (error) => {
        setGettingLocation(false);
        console.error('Error de geolocalización:', error);
        toast.error('No se pudo obtener la ubicación actual');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const clearSearch = () => {
    setSearchValue('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('❌ Marca una ubicación en el mapa primero');
      return;
    }

    setSaving(true);
    try {
      // ✅ PAYLOAD MEJORADO CON URL DE GOOGLE MAPS
      const payload = {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address,
        google_maps_url: googleMapsShareUrl,
        google_maps_alternative_url: generateAlternativeGoogleMapsUrl(selectedLocation.lat, selectedLocation.lng),
        coordinates_string: `${selectedLocation.lat},${selectedLocation.lng}`,
        save_address: true,
        ...(isUserLoggedIn ? {} : { 
          session_id: Date.now(),
          guest_id: `guest-${Date.now()}`
        })
      };

      console.log('🗺️ Guardando ubicación con datos completos:', payload);

      const response = await fetch(isUserLoggedIn ? SummaryApi.location.saveUserLocation.url : SummaryApi.location.saveGuestLocation.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Ubicación guardada exitosamente');
        
        if (onLocationSave) {
          // ✅ ENVIAR DATOS COMPLETOS INCLUYENDO URL DE GOOGLE MAPS
          onLocationSave({
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address: address || result.data.address,
            google_maps_url: googleMapsShareUrl,
            google_maps_alternative_url: generateAlternativeGoogleMapsUrl(selectedLocation.lat, selectedLocation.lng),
            coordinates_string: `${selectedLocation.lat},${selectedLocation.lng}`,
            timestamp: new Date().toISOString(),
            ...result.data
          });
        }
        
        // ✅ Cerrar el modal después de guardar
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        toast.error(result.message || 'Error al guardar ubicación');
      }
    } catch (error) {
      console.error('Error guardando ubicación:', error);
      toast.error('Error de conexión al guardar ubicación');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando mapa</h3>
            <p className="text-gray-600">Preparando Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-6xl mx-auto overflow-hidden">
      {/* ✅ HEADER SIMPLIFICADO */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <FaMapMarkerAlt className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-blue-100 text-sm">Busca y marca tu ubicación exacta para el envío</p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* ✅ BUSCADOR EN LA PARTE SUPERIOR */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar dirección, lugar o negocio... Ej: Shopping del Sol, Asunción"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            {searchValue && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center gap-2"
            title="Usar mi ubicación actual"
          >
            {gettingLocation ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaLocationArrow />
            )}
            Mi ubicación
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-3 text-center">
          💡 Busca un lugar para navegar hasta ahí, luego <strong>haz clic en el mapa</strong> para marcar tu ubicación exacta de entrega
        </p>
      </div>

      <div className="relative">
        {/* ✅ MAPA A PANTALLA COMPLETA */}
        <div 
          ref={mapRef}
          className="w-full h-96"
        />
        
        {/* ✅ OVERLAY DE INSTRUCCIONES SI NO HAY UBICACIÓN */}
        {!selectedLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mx-auto max-w-md">
              <div className="text-center">
                <FaMapPin className="text-2xl text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 mb-1">Haz clic en el mapa</p>
                <p className="text-sm text-gray-600">para marcar tu ubicación de entrega</p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ BOTÓN DE MI UBICACIÓN EN EL MAPA */}
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 disabled:bg-gray-100 shadow-lg border border-gray-200 p-3 rounded-full transition-all disabled:cursor-not-allowed"
          title="Centrar en mi ubicación"
        >
          {gettingLocation ? (
            <FaSpinner className="animate-spin text-blue-600" />
          ) : (
            <FaLocationArrow className="text-blue-600" />
          )}
        </button>
      </div>

      {/* ✅ INFORMACIÓN DE UBICACIÓN SELECCIONADA */}
      {selectedLocation && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">📍 Ubicación de entrega confirmada</h4>
              {address && (
                <p className="text-green-800 mb-3 font-medium">{address}</p>
              )}
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="text-xs text-green-600 font-mono bg-green-100 px-3 py-1 rounded-full">
                  📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
                {googleMapsShareUrl && (
                  <a
                    href={googleMapsShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <FaExternalLinkAlt />
                    Ver en Google Maps
                  </a>
                )}
              </div>
              
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Guardando ubicación...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Confirmar ubicación de entrega
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FOOTER INFORMATIVO */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt className="text-blue-500" />
            <span>Marcador azul = Tu ubicación</span>
          </div>
          <div className="flex items-center gap-1">
            <FaCrosshairs className="text-green-500" />
            <span>Arrastra el marcador para ajustar</span>
          </div>
          <div className="flex items-center gap-1">
            <FaCheckCircle className="text-green-500" />
            <span>Confirma para guardar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLocationSelector;