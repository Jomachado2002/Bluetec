// frontend/src/pages/BankTransferInstructions.js - CORREGIDO
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUniversity, FaCopy, FaUpload, FaCheckCircle, FaWhatsapp, FaArrowLeft, FaExclamationCircle, FaPaperPlane } from 'react-icons/fa';
import displayINRCurrency from '../helpers/displayCurrency';
import SummaryApi from '../common';

const BankTransferInstructions = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [transfer, setTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);
    const [submittingWithoutProof, setSubmittingWithoutProof] = useState(false);
    const [transferData, setTransferData] = useState({
        reference_number: '',
        transfer_date: new Date().toISOString().split('T')[0],
        customer_bank: '',
        customer_account: '',
        transfer_notes: ''
    });

    // Datos bancarios de la empresa
    const bankDetails = {
        bank: 'BANCO CONTINENTAL',
        accountType: 'CTA CTE Gs',
        accountNumber: '66-214830-07',
        holder: 'COMPULANDIA SRL'
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderAndTransfer();
        }
    }, [orderId]);

    const fetchOrderAndTransfer = async () => {
        setLoading(true);
        try {
            console.log('🔍 === OBTENIENDO PEDIDO Y TRANSFERENCIA ===');
            console.log('📋 Order ID:', orderId);

            // ✅ USAR ENDPOINT CORRECTO PARA OBTENER PEDIDO
            const orderResponse = await fetch(`${SummaryApi.baseURL}/api/orders/${orderId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Order Response Status:', orderResponse.status);

            if (!orderResponse.ok) {
                throw new Error(`Error HTTP ${orderResponse.status}`);
            }

            const orderResult = await orderResponse.json();
            console.log('📋 Order Result:', orderResult);

            if (orderResult.success) {
                setOrder(orderResult.data);
                
                // Si el pedido ya tiene una transferencia, obtener sus datos
                if (orderResult.data.bank_transfer_id) {
                    await fetchTransferDetails(orderResult.data.bank_transfer_id);
                } else {
                    // Crear transferencia automáticamente
                    await createBankTransfer();
                }
            } else {
                toast.error(orderResult.message || 'Error al cargar el pedido');
                navigate('/');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            toast.error('Error de conexión. Verifica que el backend esté funcionando.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const createBankTransfer = async () => {
        try {
            console.log('🆕 === CREANDO TRANSFERENCIA BANCARIA ===');
            
            const response = await fetch(`${SummaryApi.baseURL}/api/orders/${orderId}/bank-transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    customer_transfer_info: {
                        ...transferData,
                        transfer_amount: order?.total_amount || 0
                    }
                })
            });

            console.log('📥 Create Transfer Response:', response.status);

            if (!response.ok) {
                console.warn('⚠️ Error creando transferencia, continuando sin ella');
                return;
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Transferencia creada:', result.data.transfer);
                setTransfer(result.data.transfer);
            }
        } catch (error) {
            console.error('❌ Error creando transferencia:', error);
            console.log('ℹ️ Continuando sin transferencia previa');
        }
    };

    const fetchTransferDetails = async (transferId) => {
        try {
            console.log('🔍 === OBTENIENDO DETALLES DE TRANSFERENCIA ===');
            
            const response = await fetch(`${SummaryApi.baseURL}/api/bank-transfers/${transferId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setTransfer(result.data);
                    setProofUploaded(!!result.data.transfer_proof?.file_url);
                }
            }
        } catch (error) {
            console.error('❌ Error obteniendo transferencia:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('📋 Copiado al portapapeles');
        }).catch(() => {
            toast.error('Error al copiar');
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTransferData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ VALIDAR DATOS MÍNIMOS PARA ENVÍO
    const canSubmitTransfer = () => {
        return transferData.reference_number.trim() && 
               transferData.customer_bank.trim() && 
               order;
    };

    // ✅ ENVIAR TRANSFERENCIA SIN COMPROBANTE
    const submitTransferWithoutProof = async () => {
        if (!canSubmitTransfer()) {
            toast.error('Complete al menos el número de referencia y banco');
            return;
        }

        setSubmittingWithoutProof(true);

        try {
            console.log('📤 === ENVIANDO TRANSFERENCIA SIN COMPROBANTE ===');
            
            const transferId = transfer?.transfer_id || `TRF-${Date.now()}`;
            
            const submitData = {
                order_id: orderId,
                reference_number: transferData.reference_number,
                transfer_date: transferData.transfer_date,
                customer_bank: transferData.customer_bank,
                customer_account: transferData.customer_account,
                transfer_notes: transferData.transfer_notes,
                transfer_amount: order.total_amount,
                // ✅ INDICAR QUE SE ENVIARÁ COMPROBANTE DESPUÉS
                proof_status: 'pending_upload',
                submission_method: 'without_proof'
            };

            console.log('📤 Datos a enviar:', submitData);

            // ✅ ENDPOINT PARA CREAR/ACTUALIZAR TRANSFERENCIA
            const response = await fetch(`${SummaryApi.baseURL}/api/bank-transfers/${transferId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(submitData)
            });

            console.log('📥 Submit Response Status:', response.status);

            const result = await response.json();
            console.log('📥 Submit Result:', result);

            if (result.success) {
                toast.success('✅ Información de transferencia enviada exitosamente');
                
                // ✅ ACTUALIZAR ESTADO LOCAL
                setTransfer(result.data || {
                    transfer_id: transferId,
                    ...submitData,
                    admin_verification: { status: 'pending' }
                });
                
                // ✅ NOTIFICAR ÉXITO
                toast.info('ℹ️ Puedes subir el comprobante después por WhatsApp');
                
            } else {
                toast.error(result.message || 'Error al enviar transferencia');
            }

        } catch (error) {
            console.error('❌ Error enviando transferencia:', error);
            toast.error('Error de conexión. La información se guardó localmente.');
            
            // ✅ GUARDAR EN LOCALSTORAGE COMO BACKUP
            localStorage.setItem(`transfer_${orderId}`, JSON.stringify({
                ...transferData,
                order_id: orderId,
                timestamp: Date.now(),
                status: 'pending_submission'
            }));
            
            toast.info('📱 Contacta por WhatsApp para confirmar tu transferencia');
        } finally {
            setSubmittingWithoutProof(false);
        }
    };

    // ✅ MANEJAR SUBIDA DE ARCHIVO (MEJORADO)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar archivo
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (file.size > maxSize) {
            toast.error('📁 El archivo no puede ser mayor a 5MB');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            toast.error('📁 Solo se permiten archivos JPG, PNG o PDF');
            return;
        }

        if (!canSubmitTransfer()) {
            toast.error('Complete los datos de transferencia antes de subir el comprobante');
            return;
        }

        setUploadingProof(true);

        try {
            console.log('📤 === SUBIENDO COMPROBANTE ===');
            
            const formData = new FormData();
            formData.append('transfer_proof', file);
            formData.append('reference_number', transferData.reference_number);
            formData.append('transfer_date', transferData.transfer_date);
            formData.append('customer_bank', transferData.customer_bank);
            formData.append('customer_account', transferData.customer_account);
            formData.append('transfer_notes', transferData.transfer_notes);
            formData.append('order_id', orderId);

            // ✅ USAR TRANSFERENCIA EXISTENTE O CREAR NUEVA
            const transferId = transfer?.transfer_id || `TRF-${Date.now()}`;
            
            const response = await fetch(`${SummaryApi.baseURL}/api/bank-transfers/${transferId}/proof`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            console.log('📥 Upload Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📥 Upload Result:', result);

            if (result.success) {
                toast.success('✅ Comprobante subido exitosamente');
                setProofUploaded(true);
                setTransfer(result.data.transfer || result.data);
            } else {
                throw new Error(result.message || 'Error al subir comprobante');
            }

        } catch (error) {
            console.error('❌ Error subiendo comprobante:', error);
            toast.error(`❌ Error al subir comprobante: ${error.message}`);
            
            // ✅ OFRECER ALTERNATIVA POR WHATSAPP
            toast.info('💡 Puedes enviar el comprobante por WhatsApp como alternativa');
            
        } finally {
            setUploadingProof(false);
        }
    };

    const sendToWhatsApp = () => {
        if (!order) return;

        let message = `*TRANSFERENCIA BANCARIA - BlueTec*\n\n`;
        message += `📋 *Pedido:* ${order.order_id}\n`;
        message += `💰 *Monto:* ${displayINRCurrency(order.total_amount)}\n\n`;
        
        if (transferData.reference_number) {
            message += `🏦 *Datos de mi transferencia:*\n`;
            message += `📄 *Referencia:* ${transferData.reference_number}\n`;
            message += `🏪 *Mi Banco:* ${transferData.customer_bank}\n`;
            message += `📅 *Fecha:* ${transferData.transfer_date}\n\n`;
        }
        
        message += `Hola, ${proofUploaded ? 'ya subí' : 'necesito ayuda con'} el comprobante de transferencia de mi pedido. Gracias.`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/+595984133733?text=${encodedMessage}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando instrucciones...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedido no encontrado</h2>
                    <p className="text-gray-600 mb-4">No se pudo cargar la información del pedido</p>
                    <Link to="/" className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUniversity className="text-4xl text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#2A3190] mb-2">Instrucciones de Transferencia</h1>
                    <p className="text-gray-600 text-lg">Completa tu pedido realizando la transferencia bancaria</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Instrucciones principales */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Información del pedido */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A3190] mb-4">Información del Pedido</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Número de Pedido:</p>
                                    <p className="font-bold text-lg text-[#2A3190]">{order.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Total a Transferir:</p>
                                    <p className="font-bold text-xl text-green-600">{displayINRCurrency(order.total_amount)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Datos bancarios */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A3190] mb-4">Datos Bancarios de COMPULANDIA SRL</h2>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="space-y-4">
                                    {Object.entries({
                                        'Banco': bankDetails.bank,
                                        'Tipo de Cuenta': bankDetails.accountType,
                                        'Número de Cuenta': bankDetails.accountNumber,
                                        'Titular': bankDetails.holder,
                                        'Monto a Transferir': displayINRCurrency(order.total_amount),
                                        'Referencia': order.order_id
                                    }).map(([label, value]) => (
                                        <div key={label} className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-600 text-sm">{label}:</p>
                                                <p className={`font-bold ${label === 'Monto a Transferir' ? 'text-xl text-green-600' : 'text-lg'}`}>
                                                    {value}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(value.toString())}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Copiar"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ✅ FORMULARIO MEJORADO */}
                        {!proofUploaded ? (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-bold text-[#2A3190] mb-4">Información de tu Transferencia</h3>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                Número de Referencia *
                                            </label>
                                            <input
                                                type="text"
                                                name="reference_number"
                                                value={transferData.reference_number}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                                placeholder="Ej: 123456789"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                Fecha de Transferencia *
                                            </label>
                                            <input
                                                type="date"
                                                name="transfer_date"
                                                value={transferData.transfer_date}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                Tu Banco *
                                            </label>
                                            <input
                                                type="text"
                                                name="customer_bank"
                                                value={transferData.customer_bank}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                                placeholder="Ej: Banco Itaú"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                Tu Cuenta
                                            </label>
                                            <input
                                                type="text"
                                                name="customer_account"
                                                value={transferData.customer_account}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                                placeholder="Últimos 4 dígitos"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Notas adicionales
                                        </label>
                                        <textarea
                                            name="transfer_notes"
                                            value={transferData.transfer_notes}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                            rows="3"
                                            placeholder="Información adicional sobre la transferencia..."
                                        />
                                    </div>

                                    {/* ✅ BOTÓN PARA ENVIAR SIN COMPROBANTE */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FaExclamationCircle className="text-yellow-600" />
                                            <h4 className="font-semibold text-yellow-800">Opciones de Envío</h4>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <button
                                                onClick={submitTransferWithoutProof}
                                                disabled={!canSubmitTransfer() || submittingWithoutProof}
                                                className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {submittingWithoutProof ? (
                                                    <>
                                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Enviando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPaperPlane />
                                                        Enviar Información (Sin Comprobante)
                                                    </>
                                                )}
                                            </button>
                                            
                                            <p className="text-yellow-700 text-sm text-center">
                                                Podrás subir el comprobante después o enviarlo por WhatsApp
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Subir comprobante */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Comprobante de Transferencia (Opcional)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">
                                                Arrastra y suelta tu comprobante aquí, o haz clic para seleccionar
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                                disabled={uploadingProof}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className={`bg-[#2A3190] text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-[#1e236b] transition-colors ${
                                                    uploadingProof ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                {uploadingProof ? 'Subiendo...' : 'Seleccionar Archivo'}
                                            </label>
                                            <p className="text-gray-500 text-sm mt-2">
                                                JPG, PNG o PDF - Máximo 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                <div className="text-center">
                                    <FaCheckCircle className="text-5xl text-green-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-green-600 mb-2">¡Información Recibida!</h3>
                                    <p className="text-gray-600">
                                        Tu información de transferencia ha sido recibida y está siendo verificada por nuestro equipo.
                                        Recibirás una confirmación en las próximas 24 horas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel lateral */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 sticky top-4">
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Pasos a Seguir</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-[#2A3190] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Realiza la transferencia</p>
                                        <p className="text-gray-600 text-sm">Usa los datos bancarios mostrados arriba</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-[#2A3190] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Envía la información</p>
                                        <p className="text-gray-600 text-sm">Completa los datos y envía (con o sin comprobante)</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Espera la verificación</p>
                                        <p className="text-gray-600 text-sm">Verificamos en máximo 24 horas</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        4
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Confirmaremos tu pedido</p>
                                        <p className="text-gray-600 text-sm">Te contactaremos para coordinar entrega</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={sendToWhatsApp}
                                    className="w-full bg-[#25D366] text-white py-3 rounded-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <FaWhatsapp className="text-lg" />
                                    Enviar por WhatsApp
                                </button>
                                
                                <Link
                                    to={`/confirmacion-pedido/${order.order_id}`}
                                    className="w-full bg-[#2A3190] text-white py-3 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    Ver Resumen del Pedido
                                </Link>
                                
                                <Link
                                    to="/"
                                    className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <FaArrowLeft />
                                    Volver al Inicio
                                </Link>
                            </div>

                            {/* Información importante */}
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <FaExclamationCircle className="text-yellow-600 text-lg mt-1" />
                                    <div>
                                        <p className="text-yellow-800 font-medium text-sm">Importante</p>
                                        <p className="text-yellow-700 text-sm">
                                            Puedes enviar la información primero y subir el comprobante después. 
                                            Asegúrate de que el monto transferido coincida exactamente con el total del pedido.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Información de contacto */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">¿Necesitas ayuda?</h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-blue-700">📱 WhatsApp: +595 984 133733</p>
                                    <p className="text-blue-700">📧 Email: ventas@bluetec.com.py</p>
                                    <p className="text-blue-700">🕒 Lun - Vie: 8:00 - 18:00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankTransferInstructions;