import React, { useState, useEffect } from 'react';

const ActionModal = ({ isOpen, onClose, onConfirm, title, message, placeholder, initialValue = '', type = 'input' }) => {
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setInputValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(type === 'input' ? inputValue : true);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div style={{
                background: 'white', padding: '1.5rem', borderRadius: '1rem',
                width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.25rem' }}>{message}</p>

                {type === 'input' && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        style={{
                            width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1',
                            borderRadius: '0.5rem', marginBottom: '1.5rem', outline: 'none'
                        }}
                    />
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#475569',
                            border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '0.6rem 1.25rem', background: '#2563eb', color: 'white',
                            border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {type === 'input' ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
