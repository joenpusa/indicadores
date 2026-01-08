import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [dialog, setDialog] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'primary',
        resolve: null
    });

    const confirm = useCallback(({
        title = 'Confirmación',
        message = '¿Estás seguro?',
        confirmText = 'Sí',
        cancelText = 'No',
        variant = 'primary'
    }) => {
        return new Promise((resolve) => {
            setDialog({
                show: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                resolve
            });
        });
    }, []);

    const handleConfirm = () => {
        if (dialog.resolve) dialog.resolve(true);
        setDialog((prev) => ({ ...prev, show: false }));
    };

    const handleCancel = () => {
        if (dialog.resolve) dialog.resolve(false);
        setDialog((prev) => ({ ...prev, show: false }));
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                show={dialog.show}
                title={dialog.title}
                message={dialog.message}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
                variant={dialog.variant}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};
