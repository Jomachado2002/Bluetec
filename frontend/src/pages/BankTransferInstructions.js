// frontend/src/pages/BankTransferInstructions.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUniversity, FaCopy, FaUpload, FaCheckCircle, FaWhatsapp, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
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
            // Obtener información del pedido
            const orderResponse = await fetch(`${SummaryApi.orders.getById.url}/${orderId}`, {
                method: SummaryApi.orders.getById.method,
                credentials: 'include'
            });

            const orderResult = await orderResponse.json();

            if (orderResult.success) {
                setOrder(orderResult.data);
                
                // Si el pedido ya tiene una transferencia, obtener sus datos
                if (orderResult.data.bank_transfer_id) {
                    fetchTransferDetails(orderResult.data.bank_transfer_id);
                } else {
                    // Crear transferencia si no existe
                    createBankTransfer(orderResult.data._id);
                }
            } else {
                toast.error('Error al cargar el pedido');
                navigate('/');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error de conexión');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const createBankTransfer = async (orderIdDB) => {
        try {
            const response = await fetch(`${SummaryApi.bankTransfers.create.url}/${orderId}/bank-transfer`, {
                method: SummaryApi.bankTransfers.create.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    customer_transfer_info: transferData
                })
            });

            const result = await response.json();

            if (result.success) {
                setTransfer(result.data.transfer);
                console.log('Transferencia creada:', result.data.transfer);
            }
        } catch (error) {
            console.error('Error creando transferencia:', error);
        }
    };

    const fetchTransferDetails = async (transferId) => {
        try {
            const response = await fetch(`${SummaryApi.bankTransfers.getById.url}/${transferId}`, {
                method: SummaryApi.bankTransfers.getById.method,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                setTransfer(result.data);
                setProofUploaded(!!result.data.transfer_proof?.file_url);
            }
        } catch (error) {
            console.error('Error obteniendo transferencia:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Copiado al portapapeles');
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !transfer) return;

        // Validar archivo
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (file.size > maxSize) {
            toast.error('El archivo no puede ser mayor a 5MB');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            toast.error('Solo se permiten archivos JPG, PNG o PDF');
            return;
        }

        setUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append('transfer_proof', file);
            formData.append('reference_number', transferData.reference_number);
            formData.append('transfer_date', transferData.transfer_date);
            formData.append('customer_bank', transferData.customer_bank);
            formData.append('customer_account', transferData.customer_account);
            formData.append('transfer_notes', transferData.transfer_notes);

            const response = await fetch(`${SummaryApi.bankTransfers.uploadProof.url}/${transfer.transfer_id}/proof`, {
                method: SummaryApi.bankTransfers.uploadProof.method,
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Comprobante subido exitosamente');
                setProofUploaded(true);
                setTransfer(result.data.transfer);
            } else {
                toast.error(result.message || 'Error al subir comprobante');
            }
        } catch (error) {
            console.error('Error subiendo comprobante:', error);
            toast.error('Error de conexión al subir comprobante');
        } finally {
            setUploadingProof(false);
        }
    };

    const sendToWhatsApp = () => {
        if (!order) return;

        let message = `*COMPROBANTE DE TRANSFERENCIA - BlueTec*\n\n`;
        message += `📋 *Pedido:* ${order.order_id}\n`;
        message += `💰 *Monto:* ${displayINRCurrency(order.total_amount)}\n`;
        message += `🏦 *Banco:* ${transferData.customer_bank}\n`;
        message += `📄 *Referencia:* ${transferData.reference_number}\n`;
        message += `📅 *Fecha:* ${transferData.transfer_date}\n\n`;
        message += `Hola, adjunto el comprobante de transferencia de mi pedido. Gracias.`;
        
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
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600 text-sm">Banco:</p>
                                            <p className="font-bold text-lg">{bankDetails.bank}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.bank)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600 text-sm">Tipo de Cuenta:</p>
                                            <p className="font-bold text-lg">{bankDetails.accountType}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.accountType)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600 text-sm">Número de Cuenta:</p>
                                            <p className="font-bold text-xl text-[#2A3190]">{bankDetails.accountNumber}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.accountNumber)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600 text-sm">Titular:</p>
                                            <p className="font-bold text-lg">{bankDetails.holder}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(bankDetails.holder)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t pt-4">
                                        <div>
                                            <p className="text-gray-600 text-sm">Monto a Transferir:</p>
                                            <p className="font-bold text-xl text-green-600">{displayINRCurrency(order.total_amount)}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(order.total_amount.toString())}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600 text-sm">Referencia:</p>
                                            <p className="font-bold text-lg">{order.order_id}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(order.order_id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulario para subir comprobante */}
                        {!proofUploaded ? (
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-bold text-[#2A3190] mb-4">Subir Comprobante de Transferencia</h3>
                                
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
                                                Tu Banco
                                            </label>
                                            <input
                                                type="text"
                                                name="customer_bank"
                                                value={transferData.customer_bank}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                                placeholder="Ej: Banco Itaú"
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
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Comprobante de Transferencia *
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
                                    <h3 className="text-xl font-bold text-green-600 mb-2">¡Comprobante Subido!</h3>
                                    <p className="text-gray-600">
                                        Tu comprobante ha sido recibido y está siendo verificado por nuestro equipo.
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
                                        <p className="font-medium text-gray-900">Sube el comprobante</p>
                                        <p className="text-gray-600 text-sm">Foto o PDF del comprobante de transferencia</p>
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
                                            Asegúrate de que el monto transferido coincida exactamente con el total del pedido. 
                                            Incluye la referencia del pedido en la transferencia.
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