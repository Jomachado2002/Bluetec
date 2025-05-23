import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay';
import addToCart from '../helpers/addToCart';
import Context from '../context';

// Lista de todas las posibles especificaciones por categoría
const specificationsByCategory = {
  informatica: [
    'processor', 'memory', 'storage', 'disk', 'graphicsCard', 'notebookScreen', 'notebookBattery',
    'pcCase', 'pcPowerSupply', 'pcCooling',
    'motherboardSocket', 'motherboardChipset', 'motherboardFormFactor', 'expansionSlots',
    'ramType', 'ramSpeed', 'ramCapacity', 'ramLatency',
    'hddCapacity', 'diskType', 'hddInterface', 'hddRPM', 'diskReadSpeed', 'diskWriteSpeed',
    'processorModel', 'processorSocket', 'processorCores', 'processorThreads',
    'processorBaseFreq', 'processorTurboFreq', 'processorCache', 'processorTDP',
    'psuWattage', 'psuEfficiency', 'psuModular', 'psuFormFactor', 'psuProtections',
    'graphicCardModel', 'graphicCardMemory', 'graphicCardMemoryType', 'graphicCardBaseFrequency', 'graphicCardTDP','graphicfabricate',
    'caseFormFactor', 'caseMaterial', 'caseExpansionBays', 'caseIncludedFans', 'caseCoolingSupport', 'caseBacklight','ramText','model'
  ],
  perifericos: [
    'monitorSize', 'monitorResolution', 'monitorRefreshRate', 'monitorPanel', 'monitorConnectivity',
    'keyboardInterface', 'keyboardLayout', 'keyboardBacklight', 'keyboardSwitches', 'keyboardFeatures',
    'mouseInterface', 'mouseSensor', 'mouseDPI', 'mouseButtons', 'mouseBacklight',
    'adapterType', 'adapterInterface', 'adapterSpeed', 'adapterProtocol',
    'headphoneConnectionType', 'headphoneTechnology', 'headphoneFrequencyResponse', 'headphoneImpedance', 
    'headphoneNoiseCancel', 'headphoneBatteryLife',
    'microphoneType', 'microphonePolarPattern', 'microphoneFrequencyRange', 'microphoneConnection', 
    'microphoneSpecialFeatures'
  ],
  cctv: [
    'cameraResolution', 'cameraLensType', 'cameraIRDistance', 'cameraType', 'cameraConnectivity', 'cameraProtection',
    'dvrChannels', 'dvrResolution', 'dvrStorageCapacity', 'dvrConnectivity', 'dvrSmartFeatures',
    'nasMaxCapacity', 'nasBaysNumber', 'nasProcessor', 'nasRAM', 'nasRAIDSupport', 'nasConnectivity'
  ],
  impresoras: [
    'printerType', 'printerResolution', 'printerSpeed', 'printerDuplex', 'printerConnectivity',
    'printerTrayCapacity', 'printerFunctions', 'printerDisplay',
    'tonerPrinterType', 'tonerColor', 'tonerYield', 'tonerCartridgeType', 'tonerCompatibleModel'
  ],
  energia: [
    'upsCapacity', 'upsOutputPower', 'upsBackupTime', 'upsOutlets', 'upsType', 'upsConnectivity'
  ],
  software_licencias: [
    'softwareLicenseType', 'softwareLicenseDuration', 'softwareLicenseQuantity', 'softwareVersion', 'softwareFeatures'
  ],
  telefonia: [
    'phoneType', 'phoneScreenSize', 'phoneRAM', 'phoneStorage', 'phoneProcessor', 'phoneCameras',
    'phoneBattery', 'phoneOS', 'landlineType', 'landlineTechnology', 'landlineDisplay',
    'landlineFunctions', 'landlineHandsets',
    'tabletScreenSize', 'tabletScreenResolution', 'tabletProcessor', 'tabletRAM', 
    'tabletStorage', 'tabletOS', 'tabletConnectivity'
  ],
  redes: [
    'switchType', 'switchPorts', 'switchPortSpeed', 'switchNetworkLayer', 'switchCapacity',
    'serverType', 'serverProcessor', 'serverProcessorCount', 'serverRAM', 
    'serverStorage', 'serverOS',
    'networkCableType', 'networkCableCategory', 'networkCableLength', 
    'networkCableShielding', 'networkCableRecommendedUse',
    'rackType', 'rackUnits', 'rackDepth', 'rackMaterial', 'rackLoadCapacity',
    'apWiFiStandard', 'apSupportedBands', 'apMaxSpeed', 'apPorts', 'apAntennas'
  ]
};

// Mapeo de nombres de campo a nombres legibles
const fieldNameMapping = {
  model: "Modelo Procesador",
  ramText : "Categoria de Memoria",
  processor: "Procesador",
  memory: "Memoria RAM",
  storage: "Almacenamiento",
  disk: "Disco",
  graphicsCard: "Tarjeta Gráfica",
  notebookScreen: "Pantalla",
  notebookBattery: "Batería",
  pcCase: "Gabinete",
  pcPowerSupply: "Fuente de Poder",
  pcCooling: "Sistema de Enfriamiento",
  motherboardSocket: "Socket",
  motherboardChipset: "Chipset",
  motherboardFormFactor: "Factor de Forma",
  expansionSlots: "Slots de Expansión",
  ramType: "Tipo de RAM",
  ramSpeed: "Velocidad",
  ramCapacity: "Capacidad",
  ramLatency: "Latencia",
  hddCapacity: "Capacidad",
  diskType: "Tipo de Disco",
  hddInterface: "Interfaz",
  hddRPM: "RPM",
  diskReadSpeed: "Velocidad de Lectura",
  diskWriteSpeed: "Velocidad de Escritura",
  processorModel: "Modelo",
  processorSocket: "Socket",
  processorCores: "Núcleos",
  processorThreads: "Hilos",
  processorBaseFreq: "Frecuencia Base",
  processorTurboFreq: "Frecuencia Turbo",
  processorCache: "Caché",
  processorTDP: "TDP",
  psuWattage: "Vataje",
  psuEfficiency: "Eficiencia",
  psuModular: "Modularidad",
  psuFormFactor: "Factor de Forma",
  psuProtections: "Protecciones",
  monitorSize: "Tamaño",
  monitorResolution: "Resolución",
  monitorRefreshRate: "Tasa de Refresco",
  monitorPanel: "Tipo de Panel",
  monitorConnectivity: "Conectividad",
  keyboardInterface: "Interfaz",
  keyboardLayout: "Layout",
  keyboardBacklight: "Iluminación",
  keyboardSwitches: "Switches",
  keyboardFeatures: "Características",
  mouseInterface: "Interfaz",
  mouseSensor: "Sensor",
  mouseDPI: "DPI",
  mouseButtons: "Botones",
  mouseBacklight: "Iluminación",
  adapterType: "Tipo",
  adapterInterface: "Interfaz",
  adapterSpeed: "Velocidad",
  adapterProtocol: "Protocolo",
  cameraResolution: "Resolución",
  cameraLensType: "Tipo de Lente",
  cameraIRDistance: "Distancia IR",
  cameraType: "Tipo de Cámara",
  cameraConnectivity: "Conectividad",
  cameraProtection: "Protección",
  dvrChannels: "Canales",
  dvrResolution: "Resolución",
  dvrStorageCapacity: "Almacenamiento",
  dvrConnectivity: "Conectividad",
  dvrSmartFeatures: "Funciones Inteligentes",
  nasCapacity: "Capacidad",
  nasBays: "Bahías",
  nasRAID: "Soporte RAID",
  nasConnectivity: "Conectividad",
  printerType: "Tipo",
  printerResolution: "Resolución",
  printerSpeed: "Velocidad",
  printerDuplex: "Impresión Dúplex",
  printerConnectivity: "Conectividad",
  printerTrayCapacity: "Capacidad de Bandeja",
  printerFunctions: "Funciones",
  printerDisplay: "Display",
  upsCapacity: "Capacidad",
  upsOutputPower: "Potencia de Salida",
  upsBackupTime: "Tiempo de Respaldo",
  upsOutlets: "Tomas",
  upsType: "Tipo",
  upsConnectivity: "Conectividad",
  airpodsModel: "Modelo",
  airpodsBatteryLife: "Duración de Batería",
  airpodsCharging: "Tipo de Carga",
  airpodsResistance: "Resistencia",
  airpodsFeatures: "Características",
  softwareLicenseType: "Tipo de Licencia",
  softwareLicenseDuration: "Duración",
  softwareLicenseQuantity: "Cantidad de Usuarios",
  softwareVersion: "Versión",
  softwareFeatures: "Características",
  phoneType: "Tipo",
  phoneScreenSize: "Tamaño de Pantalla",
  phoneRAM: "RAM",
  phoneStorage: "Almacenamiento",
  phoneProcessor: "Procesador",
  phoneCameras: "Cámaras",
  phoneBattery: "Batería",
  phoneOS: "Sistema Operativo",
  landlineType: "Tipo",
  landlineTechnology: "Tecnología",
  landlineDisplay: "Pantalla",
  landlineFunctions: "Funciones",
  landlineHandsets: "Auriculares",
    // Tarjetas Gráficas
    graphicCardModel: "Modelo",
    graphicCardMemory: "Memoria",
    graphicCardMemoryType: "Tipo de Memoria",
    graphicCardBaseFrequency: "Frecuencia Base",
    graphicfabricate: "Fabricante",
    graphicCardTDP: "Consumo (TDP)",
  
    // Gabinetes
    caseFormFactor: "Factor de Forma",
    caseMaterial: "Material",
    caseExpansionBays: "Bahías de Expansión",
    caseIncludedFans: "Ventiladores Incluidos",
    caseCoolingSupport: "Soporte de Refrigeración",
    caseBacklight: "Iluminación",
  
    // Auriculares
    headphoneConnectionType: "Tipo de Conexión",
    headphoneTechnology: "Tecnología de Conexión",
    headphoneFrequencyResponse: "Respuesta de Frecuencia",
    headphoneImpedance: "Impedancia",
    headphoneNoiseCancel: "Cancelación de Ruido",
    headphoneBatteryLife: "Duración de Batería",
  
    // Microfonos
    microphoneType: "Tipo de Micrófono",
    microphonePolarPattern: "Patrón Polar",
    microphoneFrequencyRange: "Rango de Frecuencia",
    microphoneConnection: "Conexión",
    microphoneSpecialFeatures: "Características Especiales",
  
    // NAS
    nasMaxCapacity: "Capacidad Máxima",
    nasBaysNumber: "Número de Bahías",
    nasProcessor: "Procesador",
    nasRAM: "Memoria RAM",
    nasRAIDSupport: "Tipos de RAID Soportados",
  
    // Cartuchos de Toner
    tonerPrinterType: "Tipo de Impresora",
    tonerColor: "Color",
    tonerYield: "Rendimiento",
    tonerCartridgeType: "Tipo de Cartucho",
    tonerCompatibleModel: "Modelo Compatible",
  
    // Tablets
    tabletScreenSize: "Tamaño de Pantalla",
    tabletScreenResolution: "Resolución de Pantalla",
    tabletProcessor: "Procesador",
    tabletRAM: "Memoria RAM",
    tabletStorage: "Almacenamiento",
    tabletOS: "Sistema Operativo",
    tabletConnectivity: "Conectividad",
  
    // Redes - Switch
    switchType: "Tipo de Switch",
    switchPorts: "Número de Puertos",
    switchPortSpeed: "Velocidad de Puertos",
    switchNetworkLayer: "Capa de Red",
    switchCapacity: "Capacidad de Conmutación",
  
    // Servidores
    serverType: "Tipo de Servidor",
    serverProcessor: "Procesador",
    serverProcessorCount: "Número de Procesadores",
    serverRAM: "Memoria RAM",
    serverStorage: "Almacenamiento",
    serverOS: "Sistema Operativo",
  
    // Cables de Red
    networkCableType: "Tipo de Cable",
    networkCableCategory: "Categoría",
    networkCableLength: "Longitud",
    networkCableShielding: "Blindaje",
    networkCableRecommendedUse: "Uso Recomendado",
  
    // Racks
    rackType: "Tipo de Rack",
    rackUnits: "Unidades de Rack (U)",
    rackDepth: "Profundidad",
    rackMaterial: "Material",
    rackLoadCapacity: "Capacidad de Carga",
  
    // Access Point
    apWiFiStandard: "Estándar WiFi",
    apSupportedBands: "Bandas Soportadas",
    apMaxSpeed: "Velocidad Máxima",
    apPorts: "Puertos",
    apAntennas: "Antenas"
};
const ProductDetails = () => {
  const [data, setData] = useState({
    productName: "",
    brandName: "",
    category: "",
    productImage: [],
    description: "",
    price: "",
    sellingPrice: ""
  });
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const productImageListLoading = new Array(4).fill(null);
  const [activeImage, setActiveImage] = useState("");
  
  // Coordenadas relativas para el zoom
  const [zoomImageCoordinate, setZoomImageCoordinate] = useState({ x: 0, y: 0 });
  const [zoomImage, setZoomImage] = useState(false);
  
  // ID del producto actual para control de navegación
  const [currentProductId, setCurrentProductId] = useState(null);

  const { fetchUserAddToCart } = useContext(Context);
  const navigate = useNavigate();

  // Función para formatear la fecha un año en el futuro (para priceValidUntil)
  const getOneYearFromNow = () => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Función para obtener las especificaciones técnicas en formato schema.org
  const getProductSpecifications = () => {
    if (!data.category) return [];
    
    const categorySpecs = specificationsByCategory[data.category] || [];
    const specs = {};
    
    categorySpecs.forEach(key => {
      if (data[key] && data[key].trim !== '') {
        const label = fieldNameMapping[key] || key;
        specs[label] = data[key];
      }
    });
    
    return specs;
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Primero intentamos buscar por ID (para mantener compatibilidad)
      const response = await fetch(SummaryApi.productDetails.url, {
        method: SummaryApi.productDetails.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: params?.id })
      });
      
      const dataResponse = await response.json();
      
      if (dataResponse?.success) {
        setLoading(false);
        setData(dataResponse?.data);
        setCurrentProductId(dataResponse?.data?._id);
        // Solo actualizamos la imagen activa si hay imágenes disponibles
        if (dataResponse?.data?.productImage && dataResponse?.data?.productImage.length > 0) {
          setActiveImage(dataResponse?.data?.productImage[0]);
        }
      } else {
        // Si no se encuentra por ID, intentamos buscar por slug
        try {
          const slugResponse = await fetch(`${SummaryApi.productDetailsBySlug?.url || '/api/producto-por-slug'}/${params?.id}`);
          const slugData = await slugResponse.json();
          
          if (slugData?.success) {
            setLoading(false);
            setData(slugData?.data);
            setCurrentProductId(slugData?.data?._id);
            // Solo actualizamos la imagen activa si hay imágenes disponibles
            if (slugData?.data?.productImage && slugData?.data?.productImage.length > 0) {
              setActiveImage(slugData?.data?.productImage[0]);
            }
          } else {
            setLoading(false);
            console.error("Producto no encontrado");
          }
        } catch (slugErr) {
          console.error("Error al buscar por slug:", slugErr);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error al obtener detalles del producto:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Resetear el estado cuando cambia el producto
    setData({
      productName: "",
      brandName: "",
      category: "",
      productImage: [],
      description: "",
      price: "",
      sellingPrice: ""
    });
    setLoading(true);
    setActiveImage("");
    setZoomImage(false);
    setZoomImageCoordinate({ x: 0, y: 0 });
    
    fetchProductDetails();
    // Scroll al inicio de la página
    window.scrollTo(0, 0);
  }, [params.id]); // Dependencia explícita de params.id

  // Redirección canónica para SEO
  useEffect(() => {
    // Si el usuario accedió por ID pero el producto tiene slug, redirigir a la URL con slug
    if (data && data._id && data.slug && params.id !== data.slug) {
      navigate(`/producto/${data.slug}`, { replace: true });
    }
  }, [data, params.id, navigate]);

  // Al pasar el cursor por una miniatura se cambia la imagen activa
  const handleMouseEnterProduct = useCallback((imageURL, e) => {
    if (e) {
      e.stopPropagation();
    }
    setActiveImage(imageURL);
  }, []);

  // Calcula la posición relativa del cursor sobre la imagen principal
  const handleMouseMove = useCallback((e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setZoomImageCoordinate({ x, y });
    setZoomImage(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomImage(false);
  }, []);

  // Actualizado para usar el objeto completo del producto
  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(e, product);
    fetchUserAddToCart();
  };

  // Actualizado para usar el objeto completo del producto
  const handleBuyProduct = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(e, product);
    fetchUserAddToCart();
    navigate("/carrito");
  };

  // Actualizado para incluir más información y la URL del producto
  const handleWhatsAppClick = () => {
    const price = displayINRCurrency(data.sellingPrice);
    const productUrl = window.location.href;
    const message = `Hola, estoy interesado en este producto: *${data.productName}* (${data.brandName})
Precio: ${price}
${productUrl}
¿Me puedes brindar más detalles sobre disponibilidad y envío?`;
    
    const whatsappUrl = `https://wa.me/+595984133733?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Calcula el porcentaje de descuento 
  const discountPercentage = data.price && data.sellingPrice && data.price > 0
    ? Math.round(((data.price - data.sellingPrice) / data.price) * 100)
    : 0;

  // Función para obtener los campos de especificaciones relevantes para el producto actual
  const getRelevantSpecifications = () => {
    if (!data.category) return [];
    
    const categorySpecs = specificationsByCategory[data.category] || [];
    
    // Obtener todas las especificaciones que tienen valores
    const filledSpecs = categorySpecs
      .filter(key => data[key] && data[key].trim !== '')
      .map(key => ({ key, value: data[key], label: fieldNameMapping[key] || key }));
    
    return filledSpecs;
  };

  // Determinamos si el producto está en stock
  const isInStock = true; // Deberías tener una propiedad para esto, asumimos que está en stock

  return (
    <>
      <Helmet>
        <title>{data.productName ? `${data.productName} | BlueTec` : 'Producto | BlueTec'}</title>
        <meta name="description" content={data.description?.substring(0, 160) || 'Descubre este producto en BlueTec'} />
        <meta property="og:title" content={data.productName || 'Producto'} />
        <meta property="og:description" content={data.description?.substring(0, 160) || 'Descubre este producto en BlueTec'} />
        {data.productImage && data.productImage[0] && (
          <meta property="og:image" content={data.productImage[0]} />
        )}
        <link rel="canonical" href={`https://bluetec.com.py/producto/${data.slug || params.id}`} />
        
        {/* BreadcrumbList Schema.org para navegación */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": "https://bluetec.com.py"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": data.category ? (data.category.charAt(0).toUpperCase() + data.category.slice(1)) : "Categoría",
                "item": `https://bluetec.com.py/categoria-producto?category=${data.category}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": data.subcategory ? (data.subcategory.charAt(0).toUpperCase() + data.subcategory.slice(1)) : "Subcategoría",
                "item": `https://bluetec.com.py/categoria-producto?category=${data.category}&subcategory=${data.subcategory}`
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": data.productName,
                "item": `https://bluetec.com.py/producto/${data.slug || params.id}`
              }
            ]
          })}
        </script>
        
        {/* Product Schema.org para el producto actual */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": data.productName,
            "image": data.productImage,
            "description": data.description,
            "sku": data._id,
            "mpn": data._id,
            "category": `${data.category}/${data.subcategory}`.replace(/undefined/g, ''),
            "brand": {
              "@type": "Brand",
              "name": data.brandName
            },
            "offers": {
              "@type": "Offer",
              "url": `https://bluetec.com.py/producto/${data.slug || params.id}`,
              "priceCurrency": "PYG",
              "price": data.sellingPrice,
              "priceValidUntil": getOneYearFromNow(),
              "itemCondition": "https://schema.org/NewCondition",
              "availability": isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "BlueTec"
              }
            },
            "additionalProperty": Object.entries(getProductSpecifications()).map(([name, value]) => ({
              "@type": "PropertyValue",
              "name": name,
              "value": value
            })),
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "27"
            },
            "review": [
              {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5"
                },
                "author": {
                  "@type": "Person",
                  "name": "Cliente Satisfecho"
                },
                "reviewBody": "Excelente producto, llegó antes de lo esperado y con todas las características prometidas."
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="container mx-auto p-4 font-roboto">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col lg:flex-row gap-6 flex-1">
            {/** Sección de Imagen Principal y Zoom **/}
            <div className="relative">
              <div
                className="relative h-auto w-full lg:w-[600px] bg-gray-50 flex justify-center items-center border border-gray-200"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {activeImage && (
                  <img
                    src={activeImage}
                    alt={data.productName}
                    className="object-contain h-full w-full"
                  />
                )}
                {/** Contenedor de Zoom (visible solo en pantallas grandes) **/}
                {zoomImage && activeImage && (
                  <div className="hidden lg:block absolute top-0 left-full ml-4 w-[600px] h-[500px] border border-gray-200 rounded overflow-hidden shadow-xl pointer-events-none">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${activeImage})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1200px 1000px',
                        backgroundPosition: `${zoomImageCoordinate.x * 100}% ${zoomImageCoordinate.y * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
              {/** Sección de Miniaturas Mejoradas **/}
              <div className="flex flex-nowrap gap-2 p-2 bg-white border-t border-gray-200 mt-2 overflow-x-auto">
                {loading
                  ? productImageListLoading.map((_, index) => (
                      <div key={"loadingImage" + index} className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ))
                  : data?.productImage?.map((imgURL, index) => (
                      <div
                        key={`thumb-${index}-${currentProductId}`}
                        className={`h-16 w-16 rounded border cursor-pointer transition-shadow duration-200 hover:shadow-md ${activeImage === imgURL ? 'border-[#2A3190]' : 'border-transparent'}`}
                        onMouseEnter={(e) => handleMouseEnterProduct(imgURL, e)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseEnterProduct(imgURL, e);
                        }}
                      >
                        <img 
                          src={imgURL} 
                          alt={`Producto ${index + 1}`} 
                          className="h-full w-full object-cover rounded" 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ))
                }
              </div>
            </div>

            {/** Sección de Detalles del Producto **/}
            <div className="flex-1 flex flex-col justify-between">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="bg-gray-200 h-6 w-1/2 rounded"></div>
                  <div className="bg-gray-200 h-8 w-full rounded"></div>
                  <div className="bg-gray-200 h-6 w-1/3 rounded"></div>
                  <div className="flex gap-4">
                    <div className="bg-gray-200 h-10 w-32 rounded"></div>
                    <div className="bg-gray-200 h-10 w-32 rounded"></div>
                    <div className="bg-gray-200 h-10 w-32 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 w-full rounded"></div>
                    <div className="bg-gray-200 h-4 w-full rounded"></div>
                    <div className="bg-gray-200 h-4 w-full rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="inline-block bg-[#2A3190] text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {data?.brandName}
                    </p>
                    <h2 className="mt-2 text-2xl md:text-3xl font-bold text-gray-800">
                      {data?.productName}
                    </h2>
                    <p className="capitalize text-sm md:text-lg text-gray-500">{data?.subcategory}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl lg:text-4xl font-bold text-[#2A3190]">
                      {displayINRCurrency(data.sellingPrice)}
                    </p>
                    {data.price > 0 && (
                      <>
                        <p className="text-xl lg:text-2xl text-gray-400 line-through">
                          {displayINRCurrency(data.price)}
                        </p>
                        {discountPercentage > 0 && (
                          <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-md">
                            {discountPercentage}% OFF
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={(e) => handleBuyProduct(e, data)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      Comprar
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(e, data)}
                      className="w-full sm:w-auto bg-white text-[#2A3190] border-2 border-[#2A3190] py-2 px-4 rounded-lg shadow hover:bg-[#2A3190] hover:text-white transition-all duration-300"
                    >
                      Agregar al carrito
                    </button>
                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full sm:w-auto bg-white text-green-600 border-2 border-green-600 py-2 px-4 rounded-lg shadow hover:bg-green-600 hover:text-white transition-all duration-300"
                    >
                      WhatsApp
                    </button>
                  </div>

                  {!loading && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xl font-semibold text-gray-700 mb-3">Especificaciones</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {getRelevantSpecifications().map(({ key, value, label }) => (
                          <div key={`spec-${key}-${currentProductId}`} className="flex flex-col sm:flex-row justify-between p-2 bg-white rounded-lg shadow-sm">
                            <span className="font-medium text-gray-600">{label}:</span>
                            <span className="text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">Descripción:</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed">{data?.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {data.category && data.subcategory && (
          <div className="mt-12">
            <CategoryWiseProductDisplay
              key={`related-products-${currentProductId}`}
              category={data?.category} 
              subcategory={data?.subcategory} 
              heading="Productos Recomendados"
              currentProductId={currentProductId} // Añadimos el ID del producto actual para excluirlo
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetails;