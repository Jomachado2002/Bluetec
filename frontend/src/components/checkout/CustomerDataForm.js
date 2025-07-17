// frontend/src/components/checkout/CustomerDataForm.js
import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';

const CustomerDataForm = ({ customerData, onUpdateCustomer, isLoggedIn, user }) => {
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'El nombre es requerido';
                if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
                return '';
            case 'email':
                if (!value.trim()) return 'El email es requerido';
                if (!/\S+@\S+\.\S+/.test(value)) return 'Formato de email inválido';
                return '';
            case 'phone':
                if (!value.trim()) return 'El teléfono es requerido';
                if (value.length < 8) return 'El teléfono debe tener al menos 8 dígitos';
                return '';
            default:
                return '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Actualizar datos
        onUpdateCustomer({
            ...customerData,
            [name]: value
        });

        // Validar campo
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const isFormValid = () => {
        return customerData.name.trim() && 
               customerData.email.trim() && 
               customerData.phone.trim() &&
               !errors.name && 
               !errors.email && 
               !errors.phone;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#2A3190] rounded-full flex items-center justify-center">
                    <FaUser className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Datos del Cliente</h2>
                    <p className="text-gray-600 text-sm">Información necesaria para procesar tu pedido</p>
                </div>
            </div>

            {/* Mensaje para usuarios logueados */}
            {isLoggedIn && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-green-600 text-sm" />
                        </div>
                        <div>
                            <p className="text-green-800 font-medium">¡Hola {user?.name}!</p>
                            <p className="text-green-700 text-sm">Tus datos han sido cargados automáticamente</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre completo */}
                <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                        Nombre completo *
                    </label>
                    <div className="relative">
                        <FaUser className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            name="name"
                            value={customerData.name}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] transition-all ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ingresa tu nombre completo"
                            required
                        />
                        {errors.name && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <FaExclamationCircle className="text-xs" />
                                {errors.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Email *
                    </label>
                    <div className="relative">
                        <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={customerData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] transition-all ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="tu@email.com"
                            required
                        />
                        {errors.email && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <FaExclamationCircle className="text-xs" />
                                {errors.email}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teléfono */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Teléfono *
                    </label>
                    <div className="relative">
                        <FaPhone className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="tel"
                            name="phone"
                            value={customerData.phone}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] transition-all ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+595 XXX XXXXXX"
                            required
                        />
                        {errors.phone && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <FaExclamationCircle className="text-xs" />
                                {errors.phone}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dirección opcional */}
                <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">
                        Dirección adicional (opcional)
                    </label>
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            name="address"
                            value={customerData.address}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190] transition-all"
                            placeholder="Información adicional sobre tu dirección"
                        />
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        La ubicación exacta se seleccionará en el siguiente paso
                    </p>
                </div>
            </div>

            {/* Información de privacidad */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaExclamationCircle className="text-blue-600 text-sm" />
                    </div>
                    <div>
                        <p className="text-blue-800 font-medium text-sm">Protección de datos</p>
                        <p className="text-blue-700 text-sm">
                            Tus datos personales se utilizarán únicamente para procesar tu pedido y mejorar tu experiencia de compra. 
                            No compartimos tu información con terceros.
                        </p>
                    </div>
                </div>
            </div>

            {/* Indicador de validez */}
            <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isFormValid() ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm ${isFormValid() ? 'text-green-600' : 'text-gray-500'}`}>
                        {isFormValid() ? 'Información completa' : 'Completa los campos requeridos'}
                    </span>
                </div>
                
                {isFormValid() && (
                    <div className="text-green-600 text-sm font-medium">
                        ✓ Listo para continuar
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDataForm;