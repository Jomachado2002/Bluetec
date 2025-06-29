// frontend/src/pages/BancardConfirmProxy.js - VERSIÓN CORREGIDA

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BancardConfirmProxy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        console.log('🔄 === PROXY BANCARD CONFIRMACIÓN MEJORADO ===');
        console.log('🌐 URL completa:', window.location.href);
        console.log('📋 Search params:', window.location.search);
        
        // ✅ OBTENER TODOS LOS PARÁMETROS DE BANCARD
        const allParams = {};
        for (const [key, value] of searchParams.entries()) {
          allParams[key] = value;
        }
        
        console.log('📋 Parámetros extraídos:', allParams);
        setDebugInfo(allParams);

        // ✅ CONSTRUIR OPERATION OBJECT PARA BACKEND
        const operation = {
          token: allParams.token || '',
          shop_process_id: allParams.shop_process_id || allParams.operation_id || '',
          response: allParams.response || (allParams.response_code === '00' ? 'S' : 'N'),
          response_details: allParams.response_details || '',
          amount: allParams.amount || '',
          currency: allParams.currency || allParams.currency_id || 'PYG',
          authorization_number: allParams.authorization_number || '',
          ticket_number: allParams.ticket_number || '',
          response_code: allParams.response_code || '',
          response_description: allParams.response_description || '',
          extended_response_description: allParams.extended_response_description || '',
          security_information: {
            customer_ip: allParams.customer_ip || '',
            card_source: allParams.card_source || '',
            card_country: allParams.card_country || '',
            version: allParams.version || '0.3',
            risk_index: allParams.risk_index || '0'
          },
          iva_amount: allParams.iva_amount || '',
          iva_ticket_number: allParams.iva_ticket_number || ''
        };

        console.log('📤 Enviando al backend:', operation);

        // ✅ ENVIAR AL BACKEND PARA PROCESAMIENTO
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        
        if (!backendUrl) {
          throw new Error('Backend URL no configurada');
        }

        try {
          const response = await fetch(`${backendUrl}/api/bancard/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ operation })
          });

          console.log('📥 Backend response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Backend confirmó correctamente:', result);
          } else {
            console.warn('⚠️ Backend respondió con error:', response.status);
          }
        } catch (backendError) {
          console.error('❌ Error comunicándose con backend:', backendError);
          // Continuar con el flujo aunque falle el backend
        }

        // ✅ DETERMINAR ÉXITO BASADO EN PARÁMETROS DE BANCARD
        const isSuccess = 
          (operation.response === 'S' && operation.response_code === '00') ||
          allParams.status === 'success' ||
          (operation.authorization_number && operation.ticket_number) ||
          (!operation.response_code && operation.shop_process_id); // Si no hay código, asumir éxito

        console.log('🎯 Análisis de resultado:', {
          response: operation.response,
          response_code: operation.response_code,
          authorization_number: operation.authorization_number,
          status_param: allParams.status,
          isSuccess
        });

        // ✅ CONSTRUIR PARÁMETROS PARA LA URL DE DESTINO
        const destinationParams = new URLSearchParams();
        
        // Pasar todos los parámetros relevantes
        Object.entries(allParams).forEach(([key, value]) => {
          if (value && value.toString().trim() !== '') {
            destinationParams.append(key, value);
          }
        });

        // Asegurar que tenemos al menos el shop_process_id
        if (!destinationParams.has('shop_process_id') && operation.shop_process_id) {
          destinationParams.append('shop_process_id', operation.shop_process_id);
        }

        // ✅ REDIRIGIR SEGÚN EL RESULTADO
        if (isSuccess) {
          setStatus('success');
          console.log('✅ Pago exitoso, redirigiendo a success');
          
          setTimeout(() => {
            navigate(`/pago-exitoso?${destinationParams.toString()}`);
          }, 1500);
        } else {
          setStatus('failed');
          console.log('❌ Pago fallido, redirigiendo a cancelled');
          
          setTimeout(() => {
            navigate(`/pago-cancelado?${destinationParams.toString()}`);
          }, 1500);
        }

      } catch (error) {
        console.error('❌ Error en proxy:', error);
        setStatus('error');
        setTimeout(() => {
          navigate('/pago-cancelado?error=proxy_error');
        }, 1500);
      }
    };

    processConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full mx-4">
        
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2A3190] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Procesando confirmación...</h2>
            <p className="text-gray-600 mb-4">Verificando tu transacción con Bancard</p>
            
            {/* ✅ DEBUG INFO PARA DESARROLLO */}
            {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
                <p className="font-semibold mb-2">Debug Info:</p>
                {Object.entries(debugInfo).map(([key, value]) => (
                  <p key={key} className="text-gray-600">
                    <span className="font-medium">{key}:</span> {value}
                  </p>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="text-sm">Conexión segura SSL</span>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">¡Pago Confirmado!</h2>
            <p className="text-green-600">Redirigiendo a la confirmación...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Pago no procesado</h2>
            <p className="text-red-600">Redirigiendo a la página de error...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Error de comunicación</h2>
            <p className="text-yellow-600">Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BancardConfirmProxy;