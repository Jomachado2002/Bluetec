import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import productCategory from '../helpers/productCategory';
import VerticalCard from '../components/VerticalCard';
import SummaryApi from '../common';
import SpecificationAccordion from '../components/SpecificationAccordion';


const CategoryProduct = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const urlSearch = new URLSearchParams(location.search);
    const selectedCategory = urlSearch.get("category") || "";
    const selectedSubcategory = urlSearch.get("subcategory") || "";

    const [filterCategoryList, setFilterCategoryList] = useState(selectedCategory ? [selectedCategory] : []);
    const [filterSubcategoryList, setFilterSubcategoryList] = useState(selectedSubcategory ? [selectedSubcategory] : []);
    const [filterBrands, setFilterBrands] = useState([]);
    const [specFilters, setSpecFilters] = useState({});
    const [availableFilters, setAvailableFilters] = useState({
        brands: [],
        specifications: {}
    });
    const [sortBy, setSortBy] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchBrand, setSearchBrand] = useState('');
    const [searchSpecification, setSearchSpecification] = useState('');

    // Mapeo de etiquetas para especificaciones
    const getSpecificationLabel = (specKey) => {
        const labels = {
            // Notebooks
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
            landlineHandsets: "Auriculares"
        };
        return labels[specKey] || specKey;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(SummaryApi.filterProduct.url, {
                method: SummaryApi.filterProduct.method,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    category: filterCategoryList,
                    subcategory: filterSubcategoryList,
                    brandName: filterBrands,
                    specifications: specFilters
                })
            });

            const dataResponse = await response.json();
            if (dataResponse.success) {
                setData(dataResponse.data || []);
                setAvailableFilters({
                    brands: dataResponse.filters.brands || [],
                    specifications: dataResponse.filters.specifications || {}
                });
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setFilterCategoryList(selectedCategory ? [selectedCategory] : []);
        setFilterSubcategoryList(selectedSubcategory ? [selectedSubcategory] : []);
        setSpecFilters({});
        setFilterBrands([]);
    }, [selectedCategory, selectedSubcategory]);

    useEffect(() => {
        fetchData();
    }, [filterCategoryList, filterSubcategoryList, filterBrands, specFilters]);

    const handleSelectCategory = (e) => {
        const category = e.target.value;
        navigate(`/categoria-producto?category=${category}`);
    };

    const handleSelectSubcategory = (subcategory) => {
        navigate(`/categoria-producto?category=${selectedCategory}&subcategory=${subcategory}`);
    };

    const handleSpecFilterChange = (type, value) => {
        setSpecFilters(prev => ({
            ...prev,
            [type]: prev[type]
                ? prev[type].includes(value)
                    ? prev[type].filter(item => item !== value)
                    : [...prev[type], value]
                : [value]
        }));
    };

    const handleOnChangeSortBy = (e) => {
        const { value } = e.target;
        setSortBy(value);

        setData(prev => [...prev].sort((a, b) => {
            const priceA = Number(a.sellingPrice) || 0;
            const priceB = Number(b.sellingPrice) || 0;
            return value === 'asc' ? priceA - priceB : priceB - priceA;
        }));
    };

    // Toggle para expandir/contraer categorías
    const toggleCategory = (categoryValue) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryValue]: !prev[categoryValue]
        }));
    };

    // Filtro de marcas con búsqueda
    const filteredBrands = useMemo(() => {
        return availableFilters.brands.filter(brand => 
            brand.toLowerCase().includes(searchBrand.toLowerCase())
        );
    }, [availableFilters.brands, searchBrand]);

    // Renderizado de especificaciones con filtro de búsqueda
    const renderSpecificationFilters = (isMobile = false) => {
        const specKeys = Object.keys(availableFilters.specifications);
        if (specKeys.length === 0) return null;

        return (
            <div className="mb-6">
                <div className="flex justify-between items-center border-b pb-1">
                    <h3 className={`text-base uppercase font-medium ${isMobile ? 'text-green-600' : 'text-slate-500'}`}>
                        Especificaciones
                    </h3>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Buscar especificación..." 
                    className="w-full p-2 border rounded my-2"
                    value={searchSpecification}
                    onChange={(e) => setSearchSpecification(e.target.value)}
                />

                {specKeys
                    .filter(specKey => 
                        specKey.toLowerCase().includes(searchSpecification.toLowerCase())
                    )
                    .map(specKey => (
                        <SpecificationAccordion
                            key={specKey}
                            title={getSpecificationLabel(specKey)}
                            options={availableFilters.specifications[specKey] || []}
                            selectedValues={specFilters[specKey] || []}
                            onChange={(value) => handleSpecFilterChange(specKey, value)}
                            isMobile={isMobile}
                        />
                    ))
                }
            </div>
        );
    };

    const renderFilters = (isMobile = false) => (
        <div className="space-y-6">
            {/* Ordenar por */}
            <div className="border-b pb-4">
                <h3 className={`text-lg font-semibold mb-3 ${isMobile ? 'text-green-700' : 'text-slate-800'}`}>
                    Ordenar por
                </h3>
                <div className="space-y-2">
                    {[
                        { label: 'Precio - Bajo a Alto', value: 'asc' },
                        { label: 'Precio - Alto a Bajo', value: 'dsc' }
                    ].map((option) => (
                        <label 
                            key={option.value} 
                            className="flex items-center space-x-2 cursor-pointer group"
                        >
                            <input
                                type='radio'
                                name='sortBy'
                                checked={sortBy === option.value}
                                onChange={handleOnChangeSortBy}
                                value={option.value}
                                className="form-radio text-green-600 focus:ring-green-500"
                            />
                            <span className="text-gray-700 group-hover:text-green-600">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
    
            {/* Categorías */}
            <div className="border-b pb-4">
                <h3 className={`text-lg font-semibold mb-3 ${isMobile ? 'text-green-700' : 'text-slate-800'}`}>
                    Categorías
                </h3>
                <div className="space-y-3">
                    {productCategory.map((category) => (
                        <div key={category.value} className="group">
                            <div 
                                className="flex justify-between items-center cursor-pointer hover:bg-green-50 p-2 rounded-md"
                                onClick={() => toggleCategory(category.value)}
                            >
                                <div className="flex items-center space-x-2">
                                    <input
                                        type='checkbox'
                                        name="category"
                                        checked={filterCategoryList.includes(category.value)}
                                        value={category.value}
                                        onChange={handleSelectCategory}
                                        onClick={(e) => e.stopPropagation()}
                                        className="form-checkbox text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-green-600">
                                        {category.label}
                                    </span>
                                </div>
                                {category.subcategories && (
                                    <span className="text-gray-400">
                                        {expandedCategories[category.value] ? '▼' : '►'}
                                    </span>
                                )}
                            </div>
    
                            {category.subcategories && expandedCategories[category.value] && (
                                <div className="pl-6 mt-2 space-y-2">
                                    {category.subcategories.map((subcat) => (
                                        <div 
                                            key={subcat.value}
                                            className="flex items-center space-x-2 hover:bg-green-50 p-2 rounded-md"
                                        >
                                            <input
                                                type='checkbox'
                                                name="subcategory"
                                                checked={filterSubcategoryList.includes(subcat.value)}
                                                value={subcat.value}
                                                onChange={() => handleSelectSubcategory(subcat.value)}
                                                className="form-checkbox text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-gray-600">
                                                {subcat.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
    
            {/* Marcas */}
            {availableFilters.brands && availableFilters.brands.length > 0 && (
                <div className="border-b pb-4">
                    <h3 className={`text-lg font-semibold mb-3 ${isMobile ? 'text-green-700' : 'text-slate-800'}`}>
                        Marcas
                    </h3>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Buscar marca..." 
                            className="w-full p-2 border rounded mb-2 focus:ring-green-500 focus:border-green-500"
                            value={searchBrand}
                            onChange={(e) => setSearchBrand(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {filteredBrands.map((brand) => (
                                <label 
                                    key={brand} 
                                    className="flex items-center space-x-2 hover:bg-green-50 p-2 rounded-md cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filterBrands.includes(brand)}
                                        onChange={(e) => {
                                            const newBrands = e.target.checked
                                                ? [...filterBrands, brand]
                                                : filterBrands.filter(b => b !== brand);
                                            setFilterBrands(newBrands);
                                        }}
                                        className="form-checkbox text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-gray-700">{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
             {/* Especificaciones */}
        {renderSpecificationFilters(isMobile)}
        </div>
    );

    return (
        <div className='container mx-auto p-4'>
            {/* Desktop version */}
            <div className='hidden lg:grid lg:grid-cols-[250px,1fr] lg:gap-4'>
                {/* Left side (filters) */}
                <div className='bg-white p-4 rounded-lg shadow min-h-[calc(100vh-120px)] overflow-y-auto'>
                    {renderFilters()}
                </div>

                {/* Right side (products) */}
                <div className='px-4'>
                    <p className='font-medium text-slate-800 text-lg mb-4'>
                        Resultados de la búsqueda: {data.length}
                    </p>
                    <div className='min-h-[calc(100vh-120px)] overflow-y-auto'>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <p>Cargando...</p>
                            </div>
                        ) : data.length > 0 ? (
                            <VerticalCard data={data} loading={loading} />
                        ) : (
                            <div className="flex justify-center items-center h-64">
                                <p>No se encontraron productos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile version */}
            <div className="lg:hidden">
                <button
                    className="w-full text-center bg-green-600 text-white p-3 rounded-lg mb-4 hover:bg-green-700 transition-colors duration-300"
                    onClick={() => setIsFiltersVisible(prev => !prev)}
                >
                    {isFiltersVisible ? "Ocultar filtros" : "Mostrar filtros"}
                </button>

                {isFiltersVisible && (
                    <div className="bg-white p-4 rounded-lg shadow mb-4">
                        {renderFilters(true)}
                    </div>
                )}

                {/* Mobile Products */}
                <div className="px-4">
                    <p className='font-medium text-slate-800 text-lg mb-4'>
                        Resultados de la búsqueda: {data.length}
                    </p>
                    <div className='flex flex-wrap justify-center gap-4'>
                        {loading ? (
                            <div className="flex justify-center items-center w-full py-8">
                                <p>Cargando...</p>
                            </div>
                        ) : data.length > 0 ? (
                            <VerticalCard data={data} loading={loading} />
                        ) : (
                            <div className="flex justify-center items-center w-full py-8">
                                <p>No se encontraron productos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryProduct;