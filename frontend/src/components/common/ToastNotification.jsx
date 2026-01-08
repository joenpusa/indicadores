import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const pastelColors = {
    success: '#d1e7dd', // Pastel Green
    danger: '#f8d7da',  // Pastel Red
    info: '#cff4fc',    // Pastel Blue
    warning: '#fff3cd'  // Pastel Yellow
};

const textColors = {
    success: '#0f5132',
    danger: '#842029',
    info: '#055160',
    warning: '#664d03'
};

const ToastNotification = ({ toasts, removeToast }) => {
    return (
        <ToastContainer className="p-3" position="bottom-center" style={{ zIndex: 1055, position: 'fixed' }}>
            {toasts.map((toast) => {
                const bgColor = pastelColors[toast.variant] || '#f8f9fa';
                const textColor = textColors[toast.variant] || '#212529';

                return (
                    <Toast
                        key={toast.id}
                        onClose={() => removeToast(toast.id)}
                        show={true}
                        delay={3000}
                        autohide
                        style={{ backgroundColor: bgColor, color: textColor, border: 'none' }}
                    >
                        <Toast.Header closeButton={true} style={{ backgroundColor: 'rgba(255,255,255,0.4)', color: textColor, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <strong className="me-auto">{toast.title}</strong>
                        </Toast.Header>
                        <Toast.Body>
                            {toast.message}
                        </Toast.Body>
                    </Toast>
                );
            })}
        </ToastContainer>
    );
};

export default ToastNotification;
