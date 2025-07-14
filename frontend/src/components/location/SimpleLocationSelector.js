// frontend/src/components/location/SimpleLocationSelector.js - ESTILO GOOGLE MAPS
import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaSave, FaSearch, FaLocationArrow, FaTimes, FaHistory, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../../common';

const SimpleLocationSelector = ({ 
  initialLocation = null, 
  onLocationSave,
  isUserLoggedIn = false,
  title = "Seleccionar Ubicación",
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
  const [savedLocations, setSavedLocations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ✅ CARGAR GOOGLE MAPS SCRIPT
  useEffect(() => {
    console.log('🔍 Iniciando carga de Google Maps...');
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps ya está disponible');
      setGoogleMapsLoaded(true);
      setIsLoading(false);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ REACT_APP_GOOGLE_MAPS_API_KEY no está configurado');
      setIsLoading(false);
      toast.error('API Key de Google Maps no configurado');
      return;
    }

    console.log('📍 Cargando script de Google Maps...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Google Maps cargado exitosamente');
      setGoogleMapsLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = (error) => {
      console.error('❌ Error cargando Google Maps:', error);
      setIsLoading(false);
      toast.error('Error cargando Google Maps');
    };
    
    document.head.appendChild(script);

    return () => {
      if (marker) marker.setMap(null);
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
      }
    };
  }, []);

  // ✅ CARGAR HISTORIAL DE UBICACIONES
  useEffect(() => {
    if (isUserLoggedIn && googleMapsLoaded) {
      loadLocationHistory();
    }
  }, [isUserLoggedIn, googleMapsLoaded]);

  // ✅ INICIALIZAR MAPA DESPUÉS DE QUE SE RENDERICE
  useEffect(() => {
    if (googleMapsLoaded && mapRef.current && !map) {
      console.log('🗺️ Inicializando mapa después del renderizado...');
      initializeMap();
    }
  }, [googleMapsLoaded, map]);

  // ✅ CARGAR HISTORIAL DE UBICACIONES
  const loadLocationHistory = async () => {
    if (!isUserLoggedIn) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(SummaryApi.location.getUserLocation.url, {
        method: 'GET',
        credentials: 'include'
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        // Crear array con la ubicación actual del usuario
        const userLocation = result.data;
        if (userLocation.lat && userLocation.lng) {
          setSavedLocations([{
            id: 'current',
            lat: userLocation.lat,
            lng: userLocation.lng,
            address: userLocation.address || 'Ubicación guardada',
            timestamp: userLocation.timestamp,
            isCurrent: true
          }]);
        }
      }
    } catch (error) {
      console.warn('Error cargando historial:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ INICIALIZAR MAPA ESTILO GOOGLE MAPS
  const initializeMap = () => {
    console.log('🗺️ === INICIALIZANDO MAPA ===');
    
    if (!mapRef.current) {
      console.log('❌ mapRef.current no disponible');
      return;
    }

    try {
      console.log('📍 Creando instancia del mapa...');
      const center = selectedLocation || { lat: -25.2637, lng: -57.5759 };
      
      // ✅ MAPA ESTILO GOOGLE MAPS CLÁSICO
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: selectedLocation ? 16 : 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy', // Más fluido como Google Maps
        styles: [] // Sin estilos personalizados, como Google Maps original
      });

      console.log('✅ Instancia del mapa creada');

      // ✅ CONFIGURAR AUTOCOMPLETADO
      setupAutocomplete();

      // ✅ LISTENERS DEL MAPA
      mapInstance.addListener('click', handleMapClick);
      
      // ✅ CREAR MARCADOR INICIAL SI HAY UBICACIÓN
      if (selectedLocation) {
        createGoogleMarker(selectedLocation, mapInstance);
        reverseGeocode(selectedLocation);
      }

      setMap(mapInstance);
      console.log('✅ Mapa inicializado exitosamente');
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      toast.error('Error inicializando el mapa: ' + error.message);
    }
  };

  // ✅ CONFIGURAR AUTOCOMPLETADO SIMPLE (SOLO NAVEGAR, NO MARCAR)
  const setupAutocomplete = () => {
    if (!searchInputRef.current || !window.google?.maps?.places) {
      console.warn('⚠️ No se puede configurar autocompletado');
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'py' },
          fields: ['geometry', 'formatted_address', 'name'],
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

        // ✅ SOLO NAVEGAR AL LUGAR, NO CREAR MARCADOR
        if (map) {
          map.setCenter(location);
          map.setZoom(16);
        }
        
        // ✅ LIMPIAR CUALQUIER MARCADOR EXISTENTE
        if (marker) {
          marker.setMap(null);
          setMarker(null);
        }
        
        // ✅ LIMPIAR UBICACIÓN SELECCIONADA
        setSelectedLocation(null);
        setAddress('');
        
        setSearchValue(place.formatted_address || place.name || '');
        toast.info('📍 Navegar a: ' + (place.formatted_address || place.name) + ' - Haz clic en el mapa para marcar tu ubicación');
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.warn('Error configurando autocompletado:', error);
    }
  };

  // ✅ CREAR MARCADOR ESTILO GOOGLE MAPS (ROJO CLÁSICO)
  const createGoogleMarker = (location, mapInstance = map) => {
    if (marker) marker.setMap(null);
    
    // ✅ MARCADOR ROJO CLÁSICO DE GOOGLE MAPS
    const newMarker = new window.google.maps.Marker({
      position: location,
      map: mapInstance,
      draggable: true,
      title: 'Ubicación seleccionada',
      animation: window.google.maps.Animation.DROP,
      // Usar el marcador por defecto de Google (rojo)
    });

    // ✅ LISTENER PARA ARRASTRAR
    newMarker.addListener('dragend', (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      reverseGeocode(newLocation);
      toast.info('📍 Ubicación actualizada');
    });

    setMarker(newMarker);
  };

  // ✅ MANEJAR CLICK EN MAPA (CREAR MARCADOR DONDE SE HACE CLICK)
  const handleMapClick = (event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setSelectedLocation(location);
    createGoogleMarker(location);
    reverseGeocode(location);
    toast.success('📍 Ubicación marcada');
  };

  // ✅ GEOCODIFICACIÓN INVERSA
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

  // ✅ OBTENER UBICACIÓN ACTUAL
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
          map.setZoom(17);
        }
        
        setSelectedLocation(location);
        createGoogleMarker(location);
        reverseGeocode(location);
        setGettingLocation(false);
        toast.success('🎯 Ubicación actual obtenida');
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'No se pudo obtener la ubicación';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
        toast.error(errorMessage);
      }
    );
  };

  // ✅ IR A UBICACIÓN DEL HISTORIAL
  const goToSavedLocation = (location) => {
    if (map) {
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(16);
    }
    
    setSelectedLocation({ lat: location.lat, lng: location.lng });
    createGoogleMarker({ lat: location.lat, lng: location.lng });
    setAddress(location.address);
    setShowHistory(false);
    toast.success('📍 Ubicación cargada desde historial');
  };

  // ✅ LIMPIAR BÚSQUEDA
  const clearSearch = () => {
    setSearchValue('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  // ✅ GUARDAR UBICACIÓN
  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('❌ Marca una ubicación en el mapa primero');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        ...(isUserLoggedIn ? {} : { 
          session_id: Date.now(),
          guest_id: `guest-${Date.now()}`
        })
      };

      const response = await fetch(isUserLoggedIn ? SummaryApi.location.saveUserLocation.url : SummaryApi.location.saveGuestLocation.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Ubicación guardada exitosamente');
        
        // Actualizar historial
        if (isUserLoggedIn) {
          loadLocationHistory();
        }
        
        if (onLocationSave) {
          onLocationSave(result.data);
        }
      } else {
        toast.error(result.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // ✅ LOADING
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Cargando mapa</h3>
            <p className="text-gray-600">Preparando Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-5xl mx-auto overflow-hidden">
      
      {/* ✅ HEADER ESTILO GOOGLE */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-red-500 text-xl" />
            <h2 className="text-xl font-medium text-gray-900">{title}</h2>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        
        {/* ✅ PANEL LATERAL */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          
          {/* ✅ BUSCADOR */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar en el mapa"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* ✅ BOTÓN UBICACIÓN ACTUAL */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              {gettingLocation ? (
                <FaSpinner className="animate-spin text-blue-500" />
              ) : (
                <FaLocationArrow className="text-blue-500" />
              )}
              <div>
                <div className="font-medium text-gray-900">Tu ubicación</div>
                <div className="text-sm text-gray-500">Usar GPS</div>
              </div>
            </button>
          </div>

          {/* ✅ HISTORIAL DE UBICACIONES */}
          {isUserLoggedIn && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  <FaHistory />
                  <span className="font-medium">Ubicaciones guardadas</span>
                </button>
              </div>
              
              {showHistory && (
                <div className="max-h-60 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-4 text-center">
                      <FaSpinner className="animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Cargando historial...</p>
                    </div>
                  ) : savedLocations.length > 0 ? (
                    savedLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => goToSavedLocation(location)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {location.isCurrent ? '📍 Ubicación actual' : location.address}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(location.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No hay ubicaciones guardadas</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ✅ INFORMACIÓN DE UBICACIÓN SELECCIONADA */}
          {selectedLocation && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 mb-1">Ubicación seleccionada</div>
                  {address && (
                    <div className="text-sm text-gray-700 mb-2">{address}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ MAPA */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef}
            className="w-full h-96"
            style={{ height: '600px' }}
          />
          
          {/* ✅ BOTÓN GUARDAR ESTILO GOOGLE MAPS */}
          {selectedLocation && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-medium transition-all transform hover:scale-105 disabled:transform-none"
              >
                {saving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSave />
                )}
                {saving ? 'Guardando...' : 'Guardar ubicación'}
              </button>
            </div>
          )}
          
          {/* ✅ INSTRUCCIONES MEJORADAS */}
          {!selectedLocation && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FaMapMarkerAlt className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">¿Cómo marcar tu ubicación?</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• 🔍 <strong>Busca</strong> un lugar para navegar hasta ahí</p>
                    <p>• 🖱️ <strong>Haz clic</strong> en el mapa donde quieras marcar</p>
                    <p>• 🔴 <strong>Aparecerá</strong> el marcador rojo</p>
                    <p>• 💾 <strong>Guarda</strong> con el botón rojo</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleLocationSelector;