import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '@/components/common/ToastNotification';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, variant = 'info', title = 'Notificación') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, variant, title }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = (message, title = 'Éxito') => addToast(message, 'success', title);
    const error = (message, title = 'Error') => addToast(message, 'danger', title);
    const info = (message, title = 'Información') => addToast(message, 'info', title);
    const warning = (message, title = 'Advertencia') => addToast(message, 'warning', title);

    const value = { success, error, info, warning };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastNotification toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};
