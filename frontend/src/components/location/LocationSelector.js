import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaCrosshairs, FaSearch, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

// ✅ COMPONENTE SOLUCIONADO DEFINITIVAMENTE
const LocationSelector = ({ 
  onLocationSelect, 
  initialLocation = null, 
  height = '400px',
  title = "Seleccionar Ubicación",
  showAddressSearch = true,
  className = ""
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ✅ PRIMER EFECTO: MARCAR COMO MONTADO
  useLayoutEffect(() => {
    console.log('🏗️ Componente montado, mapRef:', !!mapRef.current);
    setMounted(true);
  }, []);

  // ✅ SEGUNDO EFECTO: CARGAR SCRIPT
  useEffect(() => {
    console.log('🗺️ Verificando Google Maps...');
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps ya disponible');
      setScriptLoaded(true);
      return;
    }

    console.log('📡 Cargando Google Maps script...');
    const script = document.createElement('script');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB5NpKMLOyu8Im64eL-fczt64DJuLw6rs4';
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script cargado');
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('❌ Error cargando script:', error);
      setError('Error cargando Google Maps');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  // ✅ TERCER EFECTO: CREAR MAPA CUANDO TODO ESTÉ LISTO
  useEffect(() => {
    if (!mounted || !scriptLoaded) {
      console.log('⏳ Esperando mount:', mounted, 'script:', scriptLoaded);
      return;
    }

    console.log('🚀 Intentando crear mapa...');
    console.log('mapRef.current:', mapRef.current);
    
    // ✅ DELAY PARA ASEGURAR QUE EL DOM ESTÉ COMPLETAMENTE RENDERIZADO
    const timeout = setTimeout(() => {
      createMap();
    }, 500);

    return () => clearTimeout(timeout);
  }, [mounted, scriptLoaded]);

  const createMap = () => {
    try {
      console.log('🗺️ createMap iniciado');
      console.log('window.google:', !!window.google);
      console.log('mapRef.current:', mapRef.current);
      
      if (!window.google || !window.google.maps) {
        console.error('❌ Google Maps no disponible');
        setError('Google Maps no disponible');
        setIsLoading(false);
        return;
      }

      if (!mapRef.current) {
        console.error('❌ mapRef.current es null');
        setError('Contenedor del mapa no encontrado');
        setIsLoading(false);
        return;
      }

      console.log('✅ Todas las condiciones cumplidas, creando mapa...');

      const center = initialLocation || { lat: -25.2637, lng: -57.5759 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: initialLocation ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      console.log('✅ Mapa creado exitosamente');

      // ✅ CREAR MARCADOR INICIAL
      if (initialLocation && initialLocation.lat && initialLocation.lng) {
        const markerInstance = new window.google.maps.Marker({
          position: initialLocation,
          map: mapInstance,
          draggable: true,
          title: 'Tu ubicación'
        });
        setMarker(markerInstance);
        setSelectedLocation(initialLocation);
      }

      // ✅ EVENTOS
      mapInstance.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('📍 Click en mapa:', { lat, lng });
        updateLocation({ lat, lng }, mapInstance);
      });

      setMap(mapInstance);
      setIsLoading(false);
      setError(null);
      
      console.log('🎉 Mapa completamente inicializado');

    } catch (error) {
      console.error('❌ Error en createMap:', error);
      setError('Error creando mapa: ' + error.message);
      setIsLoading(false);
    }
  };

  const updateLocation = (location, mapInstance) => {
    try {
      if (marker) {
        marker.setMap(null);
      }

      const newMarker = new window.google.maps.Marker({
        position: location,
        map: mapInstance,
        draggable: true,
        title: 'Tu ubicación seleccionada'
      });

      newMarker.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateLocation({ lat, lng }, mapInstance);
      });

      setMarker(newMarker);

      const locationData = {
        lat: location.lat,
        lng: location.lng,
        googleMapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        timestamp: new Date().toISOString()
      };

      setSelectedLocation(locationData);

      // Geocoding
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const formattedAddress = results[0].formatted_address;
            setAddress(formattedAddress);
            
            const updatedLocation = {
              ...locationData,
              address: formattedAddress
            };
            
            setSelectedLocation(updatedLocation);
            
            if (onLocationSelect) {
              onLocationSelect(updatedLocation);
            }
          }
        });
      }

      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

    } catch (error) {
      console.error('❌ Error actualizando ubicación:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(16);
          updateLocation({ lat, lng }, map);
          toast.success('Ubicación actual obtenida');
        }
      },
      (error) => {
        console.error('Error geolocalización:', error);
        toast.error('No se pudo obtener la ubicación');
      }
    );
  };

  const searchAddress = (searchQuery) => {
    if (!searchQuery.trim() || !map) return;
    
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          map.setCenter({ lat, lng });
          map.setZoom(16);
          updateLocation({ lat, lng }, map);
          toast.success('Dirección encontrada');
        } else {
          toast.error('No se encontró la dirección');
        }
      });
    }
  };

  // ✅ FUNCIÓN MANUAL PARA DEBUG
  const debugMapRef = () => {
    console.log('🔍 DEBUG INFO:');
    console.log('mounted:', mounted);
    console.log('scriptLoaded:', scriptLoaded);
    console.log('mapRef.current:', mapRef.current);
    console.log('window.google:', !!window.google);
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    
    if (mapRef.current) {
      console.log('mapRef dimensions:', {
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
        display: window.getComputedStyle(mapRef.current).display
      });
    }
  };

  const forceCreateMap = () => {
    console.log('🔧 Forzando creación del mapa...');
    debugMapRef();
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      createMap();
    }, 100);
  };

  // ✅ MOSTRAR ERROR
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg border border-red-200 p-6 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-3">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2">Error cargando Google Maps</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={forceCreateMap}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Reintentar
            </button>
            <button 
              onClick={debugMapRef}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2"
            >
              Debug
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ MOSTRAR LOADING
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Cargando mapa...</p>
          <p className="text-sm text-gray-500 mb-4">
            {!scriptLoaded ? 'Cargando Google Maps...' : 'Preparando interfaz...'}
          </p>
          
          <div className="space-y-2">
            {scriptLoaded && (
              <>
                <button 
                  onClick={forceCreateMap}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm mr-2"
                >
                  Forzar Carga
                </button>
                <button 
                  onClick={debugMapRef}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm"
                >
                  Ver Debug
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título */}
      {title && (
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}

      {/* Buscador */}
      {showAddressSearch && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar dirección... ej: Palma 753, Asunción"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchAddress(e.target.value);
              }
            }}
          />
          <button
            onClick={getCurrentLocation}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            title="Mi ubicación"
          >
            <FaCrosshairs />
          </button>
        </div>
      )}

      {/* ✅ CONTENEDOR DEL MAPA CON ID ÚNICO */}
      <div className="relative">
        <div 
          ref={mapRef} 
          id="google-map-container"
          style={{ 
            height, 
            width: '100%',
            minHeight: height,
            backgroundColor: '#f0f0f0'
          }}
          className="rounded-lg border border-gray-300 shadow-sm"
        />
        
        {/* Debug info */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          Map: {map ? '✅' : '❌'} | Ref: {mapRef.current ? '✅' : '❌'}
        </div>
        
        {/* Info de ubicación */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 border">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-green-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">Ubicación seleccionada</h4>
                <p className="text-sm text-gray-600">
                  {address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-blue-800 text-sm">
          💡 Haz clic en el mapa para seleccionar una ubicación o arrastra el marcador
        </p>
      </div>

      {/* ✅ BOTÓN DE DEBUG SIEMPRE VISIBLE */}
      <div className="text-center">
        <button 
          onClick={debugMapRef}
          className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
        >
          Debug Info
        </button>
      </div>
    </div>
  );
};

// ✅ COMPONENTE PARA PERFIL DE USUARIO (sin cambios)
const UserLocationSection = ({ user, onUpdateLocation }) => {
  const [userLocation, setUserLocation] = useState(user?.location || null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (location) => {
    console.log('📍 Ubicación seleccionada:', location);
    setUserLocation(location);
  };

  const handleSaveLocation = async () => {
    if (!userLocation) {
      toast.error('Por favor selecciona una ubicación');
      return;
    }

    setLoading(true);
    try {
      await onUpdateLocation(userLocation);
      setIsEditing(false);
      toast.success('✅ Ubicación guardada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar ubicación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.location) {
      setUserLocation(user.location);
    }
  }, [user]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-600" />
          Mi Ubicación Principal
        </h2>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {userLocation ? 'Cambiar Ubicación' : 'Agregar Ubicación'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSaveLocation}
              disabled={loading || !userLocation}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <FaTimes />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <LocationSelector
          onLocationSelect={handleLocationSelect}
          initialLocation={userLocation}
          height="500px"
          title=""
        />
      ) : userLocation ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">📍 Ubicación registrada</h3>
          <p className="text-green-700 text-sm mb-2">
            {userLocation.address || 'Dirección no disponible'}
          </p>
          <p className="text-green-600 text-xs mb-3">
            Coordenadas: {userLocation.lat?.toFixed(6)}, {userLocation.lng?.toFixed(6)}
          </p>
          {userLocation.googleMapsUrl && (
            <a
              href={userLocation.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Ver en Google Maps →
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin ubicación registrada</h3>
          <p className="text-gray-500 mb-4">
            Agrega tu ubicación principal para facilitar las entregas
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
export { UserLocationSection };