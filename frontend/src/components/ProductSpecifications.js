import React from 'react';

const ProductSpecifications = ({ 
  subcategory, 
  data, 
  handleOnChange 
}) => {
  // Definimos un mapeo de especificaciones por subcategoría
  const specificationsMap = {
    // Informática
    notebooks: [
      { 
        label: "Procesador", 
        name: "processor", 
        placeholder: "Ingresa el procesador" 
      },
      { 
        label: "Memoria RAM", 
        name: "memory", 
        placeholder: "Ingresa la cantidad de memoria RAM" 
      },
      { 
        label: "Almacenamiento", 
        name: "storage", 
        placeholder: "Ingresa el tipo y capacidad de almacenamiento" 
      },
      { 
        label: "Disco", 
        name: "disk", 
        placeholder: "Ingresa el tipo de disco (SSD/HDD)" 
      },
      { 
        label: "Tarjeta Gráfica", 
        name: "graphicsCard", 
        placeholder: "Ingresa la tarjeta gráfica (opcional)" 
      },
      { 
        label: "Pantalla", 
        name: "notebookScreen", 
        placeholder: "Ingresa el tamaño y resolución de pantalla" 
      },
      { 
        label: "Batería", 
        name: "notebookBattery", 
        placeholder: "Ingresa la capacidad de la batería" 
      }
    ],
    computadoras_ensambladas: [
      { 
        label: "Procesador", 
        name: "processor", 
        placeholder: "Ingresa el procesador" 
      },
      { 
        label: "Memoria RAM", 
        name: "memory", 
        placeholder: "Ingresa la cantidad de memoria RAM" 
      },
      { 
        label: "Almacenamiento", 
        name: "storage", 
        placeholder: "Ingresa el tipo y capacidad de almacenamiento" 
      },
      { 
        label: "Tarjeta Gráfica", 
        name: "graphicsCard", 
        placeholder: "Ingresa la tarjeta gráfica" 
      },
      { 
        label: "Gabinete", 
        name: "pcCase", 
        placeholder: "Ingresa el tipo de gabinete" 
      },
      { 
        label: "Fuente de Poder", 
        name: "pcPowerSupply", 
        placeholder: "Ingresa la fuente de poder" 
      },
      { 
        label: "Sistema de Enfriamiento", 
        name: "pcCooling", 
        placeholder: "Ingresa el sistema de enfriamiento" 
      }
    ],
    placas_madre: [
      { 
        label: "Socket", 
        name: "motherboardSocket", 
        placeholder: "Ingresa el tipo de socket" 
      },
      { 
        label: "Chipset", 
        name: "motherboardChipset", 
        placeholder: "Ingresa el chipset" 
      },
      { 
        label: "Factor de Forma", 
        name: "motherboardFormFactor", 
        placeholder: "Ingresa el factor de forma (ATX, mATX, etc.)" 
      },
      { 
        label: "Soporte de RAM", 
        name: "ramType", 
        placeholder: "Ingresa el tipo de RAM soportada" 
      },
      { 
        label: "Slots de Expansión", 
        name: "expansionSlots", 
        placeholder: "Ingresa los slots de expansión disponibles" 
      }
    ],
    procesador: [
      {
        label: "Modelo",
        name: "modelo",
        placeholder: "Ingresa el modelo Series 11,12,13"
    },
      {
          label: "Socket",
          name: "processorSocket",
          placeholder: "Ingresa el tipo de socket (Ej: LGA1200, AM4)"
      },
      {
          label: "Núcleos",
          name: "processorCores",
          placeholder: "Ingresa el número de núcleos (Ej: 6, 8)"
      },
      {
          label: "Hilos",
          name: "processorThreads",
          placeholder: "Ingresa el número de hilos (Ej: 12, 16)"
      },
      {
          label: "Frecuencia Base",
          name: "processorBaseFreq",
          placeholder: "Ingresa la frecuencia base (Ej: 3.6 GHz)"
      },
      {
          label: "Frecuencia Turbo",
          name: "processorTurboFreq",
          placeholder: "Ingresa la frecuencia turbo (Ej: 4.9 GHz)"
      },
      {
          label: "Caché",
          name: "processorCache",
          placeholder: "Ingresa la cantidad de caché (Ej: 12 MB)"
      },
      {
          label: "TDP",
          name: "processorTDP",
          placeholder: "Ingresa el TDP (Ej: 65W, 95W)"
      },
      {
          label: "Gr�ficos Integrados",
          name: "processorIntegratedGraphics",
          placeholder: "Indica si tiene gráficos integrados (Ej: Sí/No)"
      },
      {
          label: "Tecnología de Fabricación",
          name: "processorManufacturingTech",
          placeholder: "Ingresa la tecnología de fabricación (Ej: 7nm, 14nm)"
      }
  ],
  tarjeta_grafica: [
    {
      label: "Modelo",
      name: "graphicCardModel",
      placeholder: "Ingresa el modelo de la tarjeta gráfica (Ej: RTX 3080, RX 6800 XT)"
    },
    {
      label: "Memoria",
      name: "graphicCardMemory",
      placeholder: "Ingresa la cantidad de memoria gráfica (Ej: 8 GB, 12 GB)"
    },
    {
      label: "Tipo de Memoria",
      name: "graphicCardMemoryType",
      placeholder: "Ingresa el tipo de memoria (Ej: GDDR6, GDDR6X)"
    },
    {
      label: "Fabricante",
      name: "graphicfabricate",  // Aquí estaba el problema, debe coincidir con el modelo
      placeholder: "Ingresa el fabricante (NVIDIA, AMD, Intel)"
    },
    {
      label: "Frecuencia Base",
      name: "graphicCardBaseFrequency",
      placeholder: "Ingresa la frecuencia base de GPU (Ej: 1.5 GHz)"
    },
    {
      label: "Consumo (TDP)",
      name: "graphicCardTDP",
      placeholder: "Ingresa el consumo eléctrico (Ej: 320W, 250W)"
    }
  ],  
  gabinetes: [
    {
      label: "Factor de Forma",
      name: "caseFormFactor",
      placeholder: "Ingresa el factor de forma (ATX, mATX, ITX)"
    },
    {
      label: "Material",
      name: "caseMaterial",
      placeholder: "Ingresa el material principal (Acero, Aluminio)"
    },
    {
      label: "Bahías de Expansión",
      name: "caseExpansionBays",
      placeholder: "Ingresa el número de bahías (Ej: 2x 3.5, 3x 2.5)"
    },
    {
      label: "Ventiladores Incluidos",
      name: "caseIncludedFans",
      placeholder: "Ingresa número y tipo de ventiladores"
    },
    {
      label: "Soporte de Refrigeración",
      name: "caseCoolingSupport",
      placeholder: "Ingresa opciones de refrigeración líquida"
    },
    {
      label: "Iluminación",
      name: "caseBacklight",
      placeholder: "Ingresa el tipo de iluminación (RGB, LED)"
    }
  ],
  // Periféricos
  auriculares: [
    { 
      label: "Tipo de Conexión", 
      name: "headphoneConnectionType", 
      placeholder: "Ingresa el tipo de conexión (Alámbrico, Inalámbrico)" 
    },
    { 
      label: "Tecnología de Conexión", 
      name: "headphoneTechnology", 
      placeholder: "Ingresa la tecnología (Bluetooth, Jack 3.5mm)" 
    },
    { 
      label: "Respuesta de Frecuencia", 
      name: "headphoneFrequencyResponse", 
      placeholder: "Ingresa la respuesta de frecuencia" 
    },
    { 
      label: "Impedancia", 
      name: "headphoneImpedance", 
      placeholder: "Ingresa la impedancia" 
    },
    { 
      label: "Tipo de Cancelación de Ruido", 
      name: "headphoneNoiseCancel", 
      placeholder: "Ingresa el tipo de cancelación de ruido" 
    },
    { 
      label: "Duración de Batería", 
      name: "headphoneBatteryLife", 
      placeholder: "Ingresa la duración de batería" 
    }
  ],
  microfonos: [
    { 
      label: "Tipo de Micrófono", 
      name: "microphoneType", 
      placeholder: "Ingresa el tipo de micrófono (Condensador, Dinámico)" 
    },
    { 
      label: "Patrón Polar", 
      name: "microphonePolarPattern", 
      placeholder: "Ingresa el patrón polar (Cardioide, Omnidireccional)" 
    },
    { 
      label: "Rango de Frecuencia", 
      name: "microphoneFrequencyRange", 
      placeholder: "Ingresa el rango de frecuencia" 
    },
    { 
      label: "Conexión", 
      name: "microphoneConnection", 
      placeholder: "Ingresa el tipo de conexión (USB, XLR, Jack)" 
    },
    { 
      label: "Características Especiales", 
      name: "microphoneSpecialFeatures", 
      placeholder: "Ingresa características especiales" 
    }
  ],
  // CCTV
  nas: [
    { 
      label: "Capacidad Máxima", 
      name: "nasMaxCapacity", 
      placeholder: "Ingresa la capacidad máxima de almacenamiento" 
    },
    { 
      label: "Número de Bahías", 
      name: "nasBaysNumber", 
      placeholder: "Ingresa el número de bahías" 
    },
    { 
      label: "Procesador", 
      name: "nasProcessor", 
      placeholder: "Ingresa el modelo de procesador" 
    },
    { 
      label: "Memoria RAM", 
      name: "nasRAM", 
      placeholder: "Ingresa la cantidad de memoria RAM" 
    },
    { 
      label: "Tipos de RAID Soportados", 
      name: "nasRAIDSupport", 
      placeholder: "Ingresa los niveles de RAID soportados" 
    },
    { 
      label: "Conectividad", 
      name: "nasConnectivity", 
      placeholder: "Ingresa las opciones de conectividad" 
    }
  ],
  // Impresoras
  cartuchostoner: [
    { 
      label: "Tipo de Impresora", 
      name: "tonerPrinterType", 
      placeholder: "Ingresa el tipo de impresora compatible" 
    },
    { 
      label: "Color", 
      name: "tonerColor", 
      placeholder: "Ingresa el color del tóner (Negro, Color)" 
    },
    { 
      label: "Rendimiento", 
      name: "tonerYield", 
      placeholder: "Ingresa el rendimiento de páginas" 
    },
    { 
      label: "Tipo de Cartucho", 
      name: "tonerCartridgeType", 
      placeholder: "Ingresa el tipo de cartucho (Original, Compatible)" 
    },
    { 
      label: "Modelo Compatible", 
      name: "tonerCompatibleModel", 
      placeholder: "Ingresa los modelos de impresora compatibles" 
    }
  ],
  // Telefonía
  tablets: [
    { 
      label: "Tamaño de Pantalla", 
      name: "tabletScreenSize", 
      placeholder: "Ingresa el tamaño de pantalla" 
    },
    { 
      label: "Resolución de Pantalla", 
      name: "tabletScreenResolution", 
      placeholder: "Ingresa la resolución de pantalla" 
    },
    { 
      label: "Procesador", 
      name: "tabletProcessor", 
      placeholder: "Ingresa el modelo de procesador" 
    },
    { 
      label: "Memoria RAM", 
      name: "tabletRAM", 
      placeholder: "Ingresa la cantidad de memoria RAM" 
    },
    { 
      label: "Almacenamiento", 
      name: "tabletStorage", 
      placeholder: "Ingresa la capacidad de almacenamiento" 
    },
    { 
      label: "Sistema Operativo", 
      name: "tabletOS", 
      placeholder: "Ingresa el sistema operativo" 
    },
    { 
      label: "Conectividad", 
      name: "tabletConnectivity", 
      placeholder: "Ingresa las opciones de conectividad" 
    }
  ],
  // Redes
  switch: [
    { 
      label: "Tipo de Switch", 
      name: "switchType", 
      placeholder: "Ingresa el tipo de switch (Administrable, No administrable)" 
    },
    { 
      label: "Número de Puertos", 
      name: "switchPorts", 
      placeholder: "Ingresa el número de puertos" 
    },
    { 
      label: "Velocidad de Puertos", 
      name: "switchPortSpeed", 
      placeholder: "Ingresa la velocidad de los puertos (Ej: 10/100/1000 Mbps)" 
    },
    { 
      label: "Capa de Red", 
      name: "switchNetworkLayer", 
      placeholder: "Ingresa la capa de red (Capa 2, Capa 3)" 
    },
    { 
      label: "Capacidad de Conmutación", 
      name: "switchCapacity", 
      placeholder: "Ingresa la capacidad de conmutación" 
    }
  ],
  servidores: [
    { 
      label: "Tipo de Servidor", 
      name: "serverType", 
      placeholder: "Ingresa el tipo de servidor (Torre, Rack, Blade)" 
    },
    { 
      label: "Procesador", 
      name: "serverProcessor", 
      placeholder: "Ingresa el modelo de procesador" 
    },
    { 
      label: "Número de Procesadores", 
      name: "serverProcessorCount", 
      placeholder: "Ingresa el número de procesadores" 
    },
    { 
      label: "Memoria RAM", 
      name: "serverRAM", 
      placeholder: "Ingresa la cantidad de memoria RAM" 
    },
    { 
      label: "Almacenamiento", 
      name: "serverStorage", 
      placeholder: "Ingresa el tipo y capacidad de almacenamiento" 
    },
    { 
      label: "Sistema Operativo", 
      name: "serverOS", 
      placeholder: "Ingresa el sistema operativo del servidor" 
    }
  ],
  cablesred: [
    { 
      label: "Tipo de Cable", 
      name: "networkCableType", 
      placeholder: "Ingresa el tipo de cable (UTP, STP, Fibra Óptica)" 
    },
    { 
      label: "Categoría", 
      name: "networkCableCategory", 
      placeholder: "Ingresa la categoría (Cat5e, Cat6, Cat6a)" 
    },
    { 
      label: "Longitud", 
      name: "networkCableLength", 
      placeholder: "Ingresa la longitud del cable" 
    },
    { 
      label: "Blindaje", 
      name: "networkCableShielding", 
      placeholder: "Ingresa el tipo de blindaje" 
    },
    { 
      label: "Uso Recomendado", 
      name: "networkCableRecommendedUse", 
      placeholder: "Ingresa el uso recomendado" 
    }
  ],
  racks: [
    { 
      label: "Tipo de Rack", 
      name: "rackType", 
      placeholder: "Ingresa el tipo de rack (Pared, Piso, Abierto, Cerrado)" 
    },
    { 
      label: "Unidades de Rack (U)", 
      name: "rackUnits", 
      placeholder: "Ingresa el número de unidades de rack" 
    },
    { 
      label: "Profundidad", 
      name: "rackDepth", 
      placeholder: "Ingresa la profundidad del rack" 
    },
    { 
      label: "Material", 
      name: "rackMaterial", 
      placeholder: "Ingresa el material principal" 
    },
    { 
      label: "Capacidad de Carga", 
      name: "rackLoadCapacity", 
      placeholder: "Ingresa la capacidad de carga máxima" 
    }
  ],
  ap: [
    { 
      label: "Estándar WiFi", 
      name: "apWiFiStandard", 
      placeholder: "Ingresa el estándar WiFi (802.11ac, WiFi 6)" 
    },
    { 
      label: "Bandas Soportadas", 
      name: "apSupportedBands", 
      placeholder: "Ingresa las bandas soportadas (2.4 GHz, 5 GHz)" 
    },
    { 
      label: "Velocidad Máxima", 
      name: "apMaxSpeed", 
      placeholder: "Ingresa la velocidad máxima" 
    },
    { 
      label: "Puertos", 
      name: "apPorts", 
      placeholder: "Ingresa los puertos disponibles" 
    },
    { 
      label: "Antenas", 
      name: "apAntennas", 
      placeholder: "Ingresa detalles de las antenas" 
    }
  ],
    memorias_ram: [
      { 
        label: "Memoria ram NB/PC", 
        name: "ramText", 
        placeholder: "Memoria Ram PC/NB?" 
      },
      { 
        label: "Tipo de RAM", 
        name: "ramType", 
        placeholder: "Ingresa el tipo de RAM (DDR4, DDR5, etc.)" 
      },
      { 
        label: "Velocidad", 
        name: "ramSpeed", 
        placeholder: "Ingresa la velocidad en MHz" 
      },
      { 
        label: "Capacidad", 
        name: "ramCapacity", 
        placeholder: "Ingresa la capacidad en GB" 
      },
      { 
        label: "Latencia", 
        name: "ramLatency", 
        placeholder: "Ingresa la latencia (CL)" 
      }
    ],
    discos_duros: [
      { 
        label: "Capacidad", 
        name: "hddCapacity", 
        placeholder: "Ingresa la capacidad de almacenamiento" 
      },
      { 
        label: "Tipo", 
        name: "diskType", 
        placeholder: "Ingresa el tipo de disco (SSD/HDD/NVMe)" 
      },
      { 
        label: "Interfaz", 
        name: "hddInterface", 
        placeholder: "Ingresa el tipo de interfaz (SATA/NVMe/etc.)" 
      },
      { 
        label: "RPM (para HDD)", 
        name: "hddRPM", 
        placeholder: "Ingresa las RPM (solo para discos HDD)" 
      },
      { 
        label: "Velocidad de Lectura", 
        name: "diskReadSpeed", 
        placeholder: "Ingresa la velocidad de lectura" 
      },
      { 
        label: "Velocidad de Escritura", 
        name: "diskWriteSpeed", 
        placeholder: "Ingresa la velocidad de escritura" 
      }
    ],
    // Periféricos
    monitores: [
      { 
        label: "Tamaño", 
        name: "monitorSize", 
        placeholder: "Ingresa el tamaño en pulgadas" 
      },
      { 
        label: "Resolución", 
        name: "monitorResolution", 
        placeholder: "Ingresa la resolución (Full HD, 4K, etc.)" 
      },
      { 
        label: "Tasa de Refresco", 
        name: "monitorRefreshRate", 
        placeholder: "Ingresa la tasa de refresco en Hz" 
      },
      { 
        label: "Tipo de Panel", 
        name: "monitorPanel", 
        placeholder: "Ingresa el tipo de panel (IPS, VA, TN, etc.)" 
      },
      { 
        label: "Conectividad", 
        name: "monitorConnectivity", 
        placeholder: "Ingresa los tipos de conexiones" 
      }
    ],
    teclados: [
      { 
        label: "Interfaz", 
        name: "keyboardInterface", 
        placeholder: "Ingresa el tipo de interfaz (USB, Inalámbrico)" 
      },
      { 
        label: "Layout", 
        name: "keyboardLayout", 
        placeholder: "Ingresa el layout (Español, Inglés, etc.)" 
      },
      { 
        label: "Iluminación", 
        name: "keyboardBacklight", 
        placeholder: "Ingresa el tipo de iluminación" 
      },
      { 
        label: "Tipo de Switches", 
        name: "keyboardSwitches", 
        placeholder: "Ingresa el tipo de switches" 
      },
      { 
        label: "Características Adicionales", 
        name: "keyboardFeatures", 
        placeholder: "Ingresa características adicionales" 
      }
    ],
    mouses: [
      { 
        label: "Interfaz", 
        name: "mouseInterface", 
        placeholder: "Ingresa el tipo de interfaz (USB, Inalámbrico)" 
      },
      { 
        label: "Sensor", 
        name: "mouseSensor", 
        placeholder: "Ingresa el tipo de sensor (Óptico, Láser)" 
      },
      { 
        label: "DPI", 
        name: "mouseDPI", 
        placeholder: "Ingresa la resolución en DPI" 
      },
      { 
        label: "Número de Botones", 
        name: "mouseButtons", 
        placeholder: "Ingresa el número de botones" 
      },
      { 
        label: "Iluminación", 
        name: "mouseBacklight", 
        placeholder: "Ingresa el tipo de iluminación" 
      }
    ],
    adaptadores: [
      { 
        label: "Tipo de Adaptador", 
        name: "adapterType", 
        placeholder: "Ingresa el tipo de adaptador" 
      },
      { 
        label: "Interfaz", 
        name: "adapterInterface", 
        placeholder: "Ingresa la interfaz (USB, PCI, etc.)" 
      },
      { 
        label: "Velocidad", 
        name: "adapterSpeed", 
        placeholder: "Ingresa la velocidad de transferencia" 
      },
      { 
        label: "Protocolo", 
        name: "adapterProtocol", 
        placeholder: "Ingresa el protocolo (WiFi, Bluetooth, etc.)" 
      }
    ],
    // CCTV
    camaras_seguridad: [
      { 
        label: "Resolución", 
        name: "cameraResolution", 
        placeholder: "Ingresa la resolución" 
      },
      { 
        label: "Tipo de Lente", 
        name: "cameraLensType", 
        placeholder: "Ingresa el tipo de lente" 
      },
      { 
        label: "Distancia IR", 
        name: "cameraIRDistance", 
        placeholder: "Ingresa la distancia de visión nocturna" 
      },
      { 
        label: "Tipo de Cámara", 
        name: "cameraType", 
        placeholder: "Ingresa el tipo de cámara (Domo, Bullet, etc.)" 
      },
      { 
        label: "Conectividad", 
        name: "cameraConnectivity", 
        placeholder: "Ingresa el tipo de conectividad (IP, Analógica)" 
      },
      { 
        label: "Grado de Protección", 
        name: "cameraProtection", 
        placeholder: "Ingresa el grado de protección (IP66, etc.)" 
      }
    ],
    dvr: [
      { 
        label: "Número de Canales", 
        name: "dvrChannels", 
        placeholder: "Ingresa el número de canales" 
      },
      { 
        label: "Resolución Máxima", 
        name: "dvrResolution", 
        placeholder: "Ingresa la resolución máxima soportada" 
      },
      { 
        label: "Capacidad de Almacenamiento", 
        name: "dvrStorageCapacity", 
        placeholder: "Ingresa la capacidad de almacenamiento" 
      },
      { 
        label: "Conectividad", 
        name: "dvrConnectivity", 
        placeholder: "Ingresa las opciones de conectividad" 
      },
      { 
        label: "Características Inteligentes", 
        name: "dvrSmartFeatures", 
        placeholder: "Ingresa características inteligentes" 
      }
    ],
    nas: [
      { 
        label: "Capacidad", 
        name: "nasCapacity", 
        placeholder: "Ingresa la capacidad total" 
      },
      { 
        label: "Cantidad de Bahías", 
        name: "nasBays", 
        placeholder: "Ingresa la cantidad de bahías" 
      },
      { 
        label: "Soporte RAID", 
        name: "nasRAID", 
        placeholder: "Ingresa los niveles RAID soportados" 
      },
      { 
        label: "Procesador", 
        name: "processor", 
        placeholder: "Ingresa el procesador del NAS" 
      },
      { 
        label: "Memoria RAM", 
        name: "memory", 
        placeholder: "Ingresa la memoria RAM del NAS" 
      },
      { 
        label: "Conectividad", 
        name: "nasConnectivity", 
        placeholder: "Ingresa las opciones de conectividad" 
      }
    ],
    // Impresoras
    impresoras_laser: [
      { 
        label: "Tipo", 
        name: "printerType", 
        placeholder: "Ingresa el tipo de impresora" 
      },
      { 
        label: "Resolución", 
        name: "printerResolution", 
        placeholder: "Ingresa la resolución" 
      },
      { 
        label: "Velocidad", 
        name: "printerSpeed", 
        placeholder: "Ingresa la velocidad de impresión" 
      },
      { 
        label: "Impresión Dúplex", 
        name: "printerDuplex", 
        placeholder: "¿Cuenta con impresión dúplex?" 
      },
      { 
        label: "Conectividad", 
        name: "printerConnectivity", 
        placeholder: "Ingresa las opciones de conectividad" 
      },
      { 
        label: "Capacidad de Bandeja", 
        name: "printerTrayCapacity", 
        placeholder: "Ingresa la capacidad de la bandeja" 
      }
    ],
    impresoras_multifuncion: [
      { 
        label: "Tipo", 
        name: "printerType", 
        placeholder: "Ingresa el tipo de impresora" 
      },
      { 
        label: "Funciones", 
        name: "printerFunctions", 
        placeholder: "Ingresa las funciones (impresión, escaneo, etc.)" 
      },
      { 
        label: "Resolución", 
        name: "printerResolution", 
        placeholder: "Ingresa la resolución" 
      },
      { 
        label: "Velocidad", 
        name: "printerSpeed", 
        placeholder: "Ingresa la velocidad de impresión" 
      },
      { 
        label: "Impresión Dúplex", 
        name: "printerDuplex", 
        placeholder: "¿Cuenta con impresión dúplex?" 
      },
      { 
        label: "Conectividad", 
        name: "printerConnectivity", 
        placeholder: "Ingresa las opciones de conectividad" 
      },
      { 
        label: "Display", 
        name: "printerDisplay", 
        placeholder: "Ingresa el tipo de display" 
      }
    ],
    // Accesorios
    fuentes_alimentacion: [
      { 
        label: "Vataje", 
        name: "psuWattage", 
        placeholder: "Ingresa el vataje" 
      },
      { 
        label: "Eficiencia", 
        name: "psuEfficiency", 
        placeholder: "Ingresa la certificación de eficiencia" 
      },
      { 
        label: "Modular", 
        name: "psuModular", 
        placeholder: "Ingresa si es modular, semi-modular o no-modular" 
      },
      { 
        label: "Factor de Forma", 
        name: "psuFormFactor", 
        placeholder: "Ingresa el factor de forma (ATX, SFX, etc.)" 
      },
      { 
        label: "Protecciones", 
        name: "psuProtections", 
        placeholder: "Ingresa las protecciones que ofrece" 
      }
    ],
    ups: [
      { 
        label: "Capacidad", 
        name: "upsCapacity", 
        placeholder: "Ingresa la capacidad en VA" 
      },
      { 
        label: "Potencia de Salida", 
        name: "upsOutputPower", 
        placeholder: "Ingresa la potencia de salida en W" 
      },
      { 
        label: "Tiempo de Respaldo", 
        name: "upsBackupTime", 
        placeholder: "Ingresa el tiempo de respaldo promedio" 
      },
      { 
        label: "Número de Tomas", 
        name: "upsOutlets", 
        placeholder: "Ingresa el número de tomas" 
      },
      { 
        label: "Tipo de UPS", 
        name: "upsType", 
        placeholder: "Ingresa el tipo de UPS (En línea, Interactivo, etc.)" 
      },
      { 
        label: "Conectividad", 
        name: "upsConnectivity", 
        placeholder: "Ingresa las opciones de conectividad" 
      }
    ],
    airpods: [
      { 
        label: "Modelo", 
        name: "airpodsModel", 
        placeholder: "Ingresa el modelo" 
      },
      { 
        label: "Duración de Batería", 
        name: "airpodsBatteryLife", 
        placeholder: "Ingresa la duración de la batería" 
      },
      { 
        label: "Tipo de Carga", 
        name: "airpodsCharging", 
        placeholder: "Ingresa el tipo de carga" 
      },
      { 
        label: "Resistencia", 
        name: "airpodsResistance", 
        placeholder: "Ingresa el nivel de resistencia (agua, polvo)" 
      },
      { 
        label: "Características Adicionales", 
        name: "airpodsFeatures", 
        placeholder: "Ingresa características adicionales" 
      }
    ],
    // Software y Licencias
    licencias: [
      { 
        label: "Tipo de Licencia", 
        name: "softwareLicenseType", 
        placeholder: "Ingresa el tipo de licencia" 
      },
      { 
        label: "Duración", 
        name: "softwareLicenseDuration", 
        placeholder: "Ingresa la duración de la licencia" 
      },
      { 
        label: "Cantidad de Usuarios", 
        name: "softwareLicenseQuantity", 
        placeholder: "Ingresa la cantidad de usuarios permitidos" 
      },
      { 
        label: "Versión", 
        name: "softwareVersion", 
        placeholder: "Ingresa la versión del software" 
      },
      { 
        label: "Características", 
        name: "softwareFeatures", 
        placeholder: "Ingresa las características principales" 
      }
    ],
    // Telefonía
    telefonos_moviles: [
      { 
        label: "Color ", 
        name: "phoneType", 
        placeholder: "Ingresa el color del teléfono" 
      },
      { 
        label: "Tamaño de Pantalla", 
        name: "phoneScreenSize", 
        placeholder: "Ingresa el tamaño de pantalla" 
      },
      { 
        label: "Sistema Operativo", 
        name: "operatingSystem", 
        placeholder: "Ingresa el sistema operativo" 
      },
      { 
        label: "Memoria RAM", 
        name: "phoneRAM", 
        placeholder: "Ingresa la memoria RAM" 
      },
      { 
        label: "Almacenamiento", 
        name: "phoneStorage", 
        placeholder: "Ingresa la capacidad de almacenamiento" 
      },
      { 
        label: "Procesador", 
        name: "phoneProcessor", 
        placeholder: "Ingresa el procesador" 
      },
      { 
        label: "Cámaras", 
        name: "phoneCameras", 
        placeholder: "Ingresa especificaciones de cámara" 
      },
      { 
        label: "Batería", 
        name: "phoneBattery", 
        placeholder: "Ingresa la capacidad de batería" 
      },
      { 
        label: "Sistema Operativo", 
        name: "phoneOS", 
        placeholder: "Ingresa el sistema operativo y versión" 
      }
    ],
    telefonos_fijos: [
      { 
        label: "Tipo", 
        name: "landlineType", 
        placeholder: "Ingresa el tipo de teléfono" 
      },
      { 
        label: "Tecnología", 
        name: "landlineTechnology", 
        placeholder: "Ingresa la tecnología (Digital, IP, etc.)" 
      },
      { 
        label: "Pantalla", 
        name: "landlineDisplay", 
        placeholder: "Ingresa el tipo de pantalla" 
      },
      { 
        label: "Funciones", 
        name: "landlineFunctions", 
        placeholder: "Ingresa las funciones principales" 
      },
    
    ]
  };

  // Obtener las especificaciones para la subcategoría actual
  const specifications = specificationsMap[subcategory] || [];

  // Si no hay especificaciones para esta subcategoría, no renderizar nada
  if (specifications.length === 0) return null;

  return (
    <>
      {specifications.map((spec) => (
        <React.Fragment key={spec.name}>
          <label htmlFor={spec.name} className="mt-3">{spec.label}:</label>
          <input
            type="text"
            id={spec.name}
            name={spec.name}
            placeholder={spec.placeholder}
            value={data[spec.name] || ""}
            onChange={handleOnChange}
            className="p-2 bg-slate-100 border rounded"
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default ProductSpecifications;