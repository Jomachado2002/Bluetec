// frontend/src/components/MetaPixelTracker.js
import { useEffect } from 'react';

const MetaPixelTracker = () => {
  useEffect(() => {
    // Función para cargar Meta Pixel
    const loadMetaPixel = () => {
      // Meta Pixel Code en una función asignada
      const initPixel = function(f,b,e,v,n,t,s) {
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
      };
     
      // Ejecutar la función
      initPixel(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
     
      // Inicializar pixel
      if (typeof window.fbq !== 'undefined') {
        window.fbq('init', '1668993647830344');
        window.fbq('track', 'PageView');
        console.log('✅ Meta Pixel de BlueTec cargado correctamente');
      }
    };
     
    // Cargar el pixel
    loadMetaPixel();
  }, []);

  return null;
};

// Función para trackear contacto por WhatsApp
export const trackWhatsAppContact = (productData = null) => {
  console.log('🟢 Tracking WhatsApp contact:', productData?.productName || 'Consulta General');
     
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'Contact', {
      content_name: productData?.productName || 'Consulta General',
      content_category: productData?.category || 'General',
      content_ids: productData?.slug ? [productData.slug] : [],
      value: productData?.sellingPrice || 0,
      currency: 'PYG'
    });
         
    window.fbq('trackCustom', 'WhatsAppContact', {
      product_name: productData?.productName || 'Consulta General',
      source: 'website_button',
      timestamp: Date.now()
    });
         
    console.log('✅ Evento WhatsApp enviado a Meta exitosamente');
  } else {
    console.warn('⚠️ Meta Pixel no está disponible');
  }
};

// Función para trackear descarga de PDF
export const trackPDFDownload = (customerData, cartTotal) => {
  console.log('🟢 Tracking PDF download');
     
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'Lead', {
      content_name: 'PDF_Presupuesto',
      value: cartTotal,
      currency: 'PYG',
      customer_name: customerData.name
    });
         
    window.fbq('trackCustom', 'PDFDownload', {
      lead_type: 'budget_request',
      customer_provided_info: Boolean(customerData.name)
    });
         
    console.log('✅ PDF Download enviado a Meta');
  }
};

// Función para trackear agregar al carrito
export const trackAddToCart = (product) => {
  console.log('🟢 Tracking Add to Cart:', product?.productName);
     
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.slug],
      content_name: product.productName,
      content_category: product.category,
      value: product.sellingPrice,
      currency: 'PYG'
    });
         
    console.log('✅ Add to Cart enviado a Meta');
  }
};

// Función para trackear interés en producto
// ✅ CORREGIDO: usar productId (que debería ser el slug)
export const trackProductInterest = (productSlug, interestLevel, score) => {
  if (typeof window.fbq !== 'undefined') {
    window.fbq('trackCustom', 'ProductInterest', {
      content_ids: [productSlug], // ✅ Ahora coincide con el parámetro
      interest_level: interestLevel,
      score: score,
      timestamp: Date.now()
    });
  }
};
// ✅ AGREGAR ESTA FUNCIÓN
export const trackViewContent = (product) => {
  console.log('🟢 Tracking View Content:', product?.productName);
  
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.slug], // ✅ USAR SLUG
      content_name: product.productName,
      content_category: product.category,
      value: product.sellingPrice,
      currency: 'PYG'
    });
    
    console.log('✅ View Content enviado a Meta');
  }
};

export default MetaPixelTracker;