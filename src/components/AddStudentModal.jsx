import React, { useState } from 'react';
import authService from '../services/authService';

const AddStudentModal = ({ isOpen, onClose, onSuccess, type, facultyEmail }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter a Mail ID.');
            return;
        }

        setLoading(true);
        // Simulate small delay for UX
        setTimeout(() => {
            const result = authService.linkStudentByEmail(email, facultyEmail, type);

            if (result.success) {
                onSuccess(`${type === 'proctee' ? 'Proctee' : 'Student'} linked successfully!`);
                onClose();
            } else {
                setError(result.message);
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '1rem',
                width: '90%', maxWidth: '450px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>Add {type === 'proctee' ? 'Proctee' : 'Student'} by Email</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                    Enter the student's Mail ID to link them to your dashboard. This will fetch their existing profile and records.
                </p>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c',
                        padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem',
                        fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Student Mail ID</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            placeholder="e.g. 24cs096@nandhaenggg.org"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '0.875rem', background: '#2563eb', color: 'white',
                            border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer',
                            opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}>
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i> Searching...</>
                            ) : `Link ${type === 'proctee' ? 'Proctee' : 'Student'}`}
                        </button>
                    </div>
                </form>

                <style>{`
                    .label { display: block; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
                    .input-field { width: 100%; padding: 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box; }
                    .input-field:focus { outline: none; border-color: #2563eb; }
                `}</style>
            </div>
        </div>
    );
};

export default AddStudentModal;
