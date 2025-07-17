// frontend/src/components/checkout/CheckoutStepper.js
import React from 'react';
import { FaUser, FaMapMarkerAlt, FaCreditCard, FaCheck } from 'react-icons/fa';

const CheckoutStepper = ({ currentStep, onStepClick }) => {
    const steps = [
        { step: 1, title: 'Datos del Cliente', icon: FaUser },
        { step: 2, title: 'Ubicación', icon: FaMapMarkerAlt },
        { step: 3, title: 'Método de Pago', icon: FaCreditCard },
        { step: 4, title: 'Confirmación', icon: FaCheck }
    ];

    const getStepStatus = (step) => {
        if (step < currentStep) return 'completed';
        if (step === currentStep) return 'active';
        return 'inactive';
    };

    const getStepClass = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500 text-white border-green-500';
            case 'active':
                return 'bg-[#2A3190] text-white border-[#2A3190]';
            case 'inactive':
                return 'bg-gray-200 text-gray-500 border-gray-300';
            default:
                return 'bg-gray-200 text-gray-500 border-gray-300';
        }
    };

    const getLineClass = (step) => {
        if (step < currentStep) return 'bg-green-500';
        return 'bg-gray-300';
    };

    return (
        <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between relative">
                {steps.map((step, index) => {
                    const status = getStepStatus(step.step);
                    const Icon = step.icon;
                    const isClickable = step.step <= currentStep;

                    return (
                        <div key={step.step} className="flex flex-col items-center relative z-10">
                            {/* Línea conectora */}
                            {index < steps.length - 1 && (
                                <div 
                                    className={`absolute top-6 left-1/2 w-full h-0.5 ${getLineClass(step.step)} transform translate-x-1/2`}
                                    style={{ 
                                        width: 'calc(100vw / 4)', 
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}
                                />
                            )}

                            {/* Círculo del paso */}
                            <button
                                onClick={() => isClickable && onStepClick && onStepClick(step.step)}
                                disabled={!isClickable}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStepClass(status)} ${
                                    isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
                                }`}
                            >
                                {status === 'completed' ? (
                                    <FaCheck className="text-lg" />
                                ) : (
                                    <Icon className="text-lg" />
                                )}
                            </button>

                            {/* Texto del paso */}
                            <div className="mt-3 text-center">
                                <div className={`text-sm font-medium ${
                                    status === 'active' ? 'text-[#2A3190]' : 
                                    status === 'completed' ? 'text-green-600' : 
                                    'text-gray-500'
                                }`}>
                                    Paso {step.step}
                                </div>
                                <div className={`text-xs mt-1 ${
                                    status === 'active' ? 'text-[#2A3190]' : 
                                    status === 'completed' ? 'text-green-600' : 
                                    'text-gray-500'
                                }`}>
                                    {step.title}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Barra de progreso */}
            <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Progreso</span>
                    <span>{Math.round((currentStep / 4) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-[#2A3190] to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutStepper;