import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--bg-main, #f8fafc)',
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                }}>
                    <div className="loading-spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTopColor: 'var(--primary, #4f46e5)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}></div>
                    <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        // Redirect to their own dashboard
        switch (user.role) {
            case 'student':
                return <Navigate to="/student-dashboard" replace />;
            case 'faculty':
                return <Navigate to="/faculty-dashboard" replace />;
            case 'hod':
                return <Navigate to="/hod-dashboard" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default PrivateRoute;
