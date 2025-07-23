// frontend/src/helpers/deliveryHelpers.js - HELPERS PARA DELIVERY

export const deliveryStatuses = {
    payment_confirmed: {
        icon: '✅',
        title: 'Pago Confirmado',
        color: '#28a745',
        bgColor: '#d4edda',
        description: 'Tu pago ha sido procesado exitosamente'
    },
    preparing_order: {
        icon: '📦',
        title: 'Preparando Pedido',
        color: '#ffc107',
        bgColor: '#fff3cd',
        description: 'Estamos empacando tus productos con cuidado'
    },
    in_transit: {
        icon: '🚚',
        title: 'En Camino',
        color: '#007bff',
        bgColor: '#cce7ff',
        description: 'Tu pedido está en camino hacia tu dirección'
    },
    delivered: {
        icon: '📍',
        title: 'Entregado',
        color: '#28a745',
        bgColor: '#d4edda',
        description: 'Tu pedido ha sido entregado exitosamente'
    },
    problem: {
        icon: '⚠️',
        title: 'Requiere Atención',
        color: '#dc3545',
        bgColor: '#f8d7da',
        description: 'Hay un inconveniente que necesita resolución'
    }
};

export const calculateProgress = (currentStatus) => {
    const statuses = ['payment_confirmed', 'preparing_order', 'in_transit', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    return Math.round(((currentIndex + 1) / statuses.length) * 100);
};

export const formatDeliveryDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getNextStatus = (currentStatus) => {
    const flow = {
        payment_confirmed: 'preparing_order',
        preparing_order: 'in_transit',
        in_transit: 'delivered',
        delivered: null
    };
    return flow[currentStatus];
};