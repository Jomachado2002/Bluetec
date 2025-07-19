// frontend/src/components/checkout/PaymentMethodSelector.js
import React, { useState } from 'react';
import { FaCreditCard, FaUniversity, FaFileInvoice, FaShieldAlt, FaExclamationCircle } from 'react-icons/fa';

const PaymentMethodSelector = ({ selectedMethod, onMethodSelect, isLoggedIn, isCompact = false }) => {

    const [showDetails, setShowDetails] = useState(null);

    const paymentMethods = [
        {
            id: 'bancard',
            name: 'Tarjeta de Crédito/Débito',
            description: 'Pago inmediato con Bancard',
            icon: FaCreditCard,
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600',
            borderColor: 'border-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            features: [
                'Pago inmediato y seguro',
                'Procesamiento automático',
                'Confirmación instantánea',
                'Soporte 24/7'
            ],
            recommended: true
        },
        {
            id: 'bank_transfer',
            name: 'Transferencia Bancaria',
            description: 'Transfiere desde tu banco',
            icon: FaUniversity,
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600',
            borderColor: 'border-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
            features: [
                'Proceso manual de verificación',
                'Confirmación en 24 horas',
                'Acepta cualquier banco',
                'Sin comisiones adicionales'
            ],
            bankDetails: {
                bank: 'BANCO CONTINENTAL',
                accountType: 'CTA CTE Gs',
                accountNumber: '66-214830-07',
                holder: 'COMPULANDIA SRL'
            }
        },
        {
            id: 'quote',
            name: 'Solicitar Presupuesto',
            description: 'Recibe cotización detallada',
            icon: FaFileInvoice,
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600',
            borderColor: 'border-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            features: [
                'Cotización en PDF',
                'Válido por 5 días',
                'Asesoramiento personalizado',
                'Sin compromiso de compra'
            ]
        }
    ];

    const handleMethodSelect = (method) => {
        onMethodSelect(method.id);
        setShowDetails(method.id);
    };

    const toggleDetails = (methodId) => {
        setShowDetails(showDetails === methodId ? null : methodId);
    };



    if (isCompact) {
        return (
            <div className="space-y-3">
                {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;

                    return (
                        <div key={method.id} className="relative">
                            <div
                                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                                    isSelected 
                                        ? `${method.borderColor} ${method.bgColor}` 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => onMethodSelect(method.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                                            <Icon className="text-white text-sm" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 text-sm">{method.name}</h3>
                                            <p className="text-gray-600 text-xs">{method.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? `${method.borderColor} ${method.color}` : 'border-gray-300'
                                    }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }


    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                    <FaCreditCard className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Método de Pago</h2>
                    <p className="text-gray-600 text-sm">Selecciona cómo deseas pagar tu pedido</p>
                </div>
            </div>

            <div className="space-y-4">
                {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    const isExpanded = showDetails === method.id;

                    return (
                        <div key={method.id} className="relative">
                            {/* Método de pago */}
                            <div
                                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                                    isSelected 
                                        ? `${method.borderColor} ${method.bgColor}` 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleMethodSelect(method)}
                            >
                                {/* Badge de recomendado */}
                                {method.recommended && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        RECOMENDADO
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center`}>
                                            <Icon className="text-white text-lg" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                                            <p className="text-gray-600 text-sm">{method.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDetails(method.id);
                                            }}
                                            className={`text-sm ${method.textColor} hover:underline`}
                                        >
                                            {isExpanded ? 'Ocultar' : 'Ver más'}
                                        </button>
                                        
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected ? `${method.borderColor} ${method.color}` : 'border-gray-300'
                                        }`}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalles expandidos */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Características:</h4>
                                                <ul className="space-y-1">
                                                    {method.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Información bancaria para transferencia */}
                                            {method.id === 'bank_transfer' && method.bankDetails && (
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Datos Bancarios:</h4>
                                                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                                        <p><strong>Banco:</strong> {method.bankDetails.bank}</p>
                                                        <p><strong>Tipo:</strong> {method.bankDetails.accountType}</p>
                                                        <p><strong>Cuenta:</strong> {method.bankDetails.accountNumber}</p>
                                                        <p><strong>Titular:</strong> {method.bankDetails.holder}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Información de seguridad */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <FaShieldAlt className="text-green-600 text-lg mt-1" />
                    <div>
                        <p className="text-gray-800 font-medium text-sm">Seguridad garantizada</p>
                        <p className="text-gray-600 text-sm">
                            Todos nuestros métodos de pago utilizan protocolos de seguridad avanzados. 
                            Tus datos están protegidos con encriptación SSL.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mensaje según método seleccionado */}
            {selectedMethod && (
                <div className="mt-4">
                    {selectedMethod === 'bancard' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FaExclamationCircle className="text-blue-600 text-lg mt-1" />
                                <div>
                                    <p className="text-blue-800 font-medium text-sm">Pago con Bancard</p>
                                    <p className="text-blue-700 text-sm">
                                        Serás redirigido a la plataforma segura de Bancard para completar el pago. 
                                        El proceso es rápido y seguro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMethod === 'bank_transfer' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FaExclamationCircle className="text-green-600 text-lg mt-1" />
                                <div>
                                    <p className="text-green-800 font-medium text-sm">Transferencia Bancaria</p>
                                    <p className="text-green-700 text-sm">
                                        Después de confirmar tu pedido, recibirás las instrucciones detalladas para realizar 
                                        la transferencia. Deberás subir el comprobante para verificación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMethod === 'quote' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FaExclamationCircle className="text-purple-600 text-lg mt-1" />
                                <div>
                                    <p className="text-purple-800 font-medium text-sm">Presupuesto</p>
                                    <p className="text-purple-700 text-sm">
                                        Generaremos un presupuesto detallado que podrás descargar en PDF o recibir por WhatsApp. 
                                        No hay compromiso de compra.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaymentMethodSelector;