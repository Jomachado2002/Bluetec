import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaSave, FaSearch, FaLocationArrow, FaTimes, FaCrosshairs, FaMapPin } from 'react-icons/fa';
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

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      const center = selectedLocation || { lat: -25.2637, lng: -57.5759 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: selectedLocation ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy'
      });

      setupAutocomplete();
      mapInstance.addListener('click', handleMapClick);
      
      if (selectedLocation) {
        createMarker(selectedLocation, mapInstance);
        reverseGeocode(selectedLocation);
      }

      setMap(mapInstance);
    } catch (error) {
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

        if (map) {
          map.setCenter(location);
          map.setZoom(16);
        }
        
        setSearchValue(place.formatted_address || place.name || '');
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
      title: 'Tu ubicación - Arrastra para ajustar',
      animation: window.google.maps.Animation.DROP,
    });

    newMarker.addListener('dragend', (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(newLocation);
      reverseGeocode(newLocation);
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
          map.setZoom(17);
        }
        
        setSelectedLocation(location);
        createMarker(location);
        reverseGeocode(location);
        setGettingLocation(false);
        toast.success('🎯 Ubicación actual obtenida y marcada');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('No se pudo obtener la ubicación');
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
      const payload = {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address,
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
        
        if (onLocationSave) {
          onLocationSave({
            ...result.data,
            address: address || result.data.address
          });
        }
      } else {
        toast.error(result.message || 'Error al guardar ubicación');
      }
    } catch (error) {
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-5xl mx-auto overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <FaMapMarkerAlt className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-blue-100 text-sm">Busca y marca tu ubicación exacta</p>
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

      <div className="flex">
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🔍 Buscar ubicación
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ej: Shopping del Sol, Asunción"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Busca un lugar para navegar hasta ahí, luego haz clic en el mapa para marcar
            </p>
          </div>

          <div className="p-6 border-b border-gray-200">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white rounded-xl transition-all border-2 border-dashed border-blue-300 hover:border-blue-500 disabled:opacity-50"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                {gettingLocation ? (
                  <FaSpinner className="animate-spin text-blue-600" />
                ) : (
                  <FaLocationArrow className="text-blue-600" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {gettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                </div>
                <div className="text-sm text-gray-600">Detectar automáticamente con GPS</div>
              </div>
            </button>
          </div>

          {selectedLocation && (
            <div className="flex-1 p-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaCheckCircle className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Ubicación marcada</h4>
                    {address && (
                      <p className="text-green-800 text-sm mb-3">{address}</p>
                    )}
                    <div className="text-xs text-green-600 font-mono">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                    
                    <button
                      onClick={handleSaveLocation}
                      disabled={saving}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Confirmar ubicación
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedLocation && (
            <div className="flex-1 p-6">
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <FaCrosshairs className="text-3xl text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Cómo marcar tu ubicación?</h3>
                <div className="text-sm text-gray-600 space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Busca un lugar en el buscador</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>O usa tu ubicación actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Haz clic en el mapa donde quieras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>Confirma la ubicación</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <div 
            ref={mapRef}
            className="w-full"
            style={{ height: '500px' }}
          />
          
          {!selectedLocation && (
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mx-auto max-w-md">
                <div className="text-center">
                  <FaMapPin className="text-2xl text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 mb-1">Haz clic en el mapa</p>
                  <p className="text-sm text-gray-600">para marcar tu ubicación exacta</p>
                </div>
              </div>
            </div>
          )}

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
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt className="text-red-500" />
            <span>Marcador rojo = Tu ubicación</span>
          </div>
          <div className="flex items-center gap-1">
            <FaCrosshairs className="text-blue-500" />
            <span>Puedes arrastrar el marcador</span>
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