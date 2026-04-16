import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';

const HodLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const result = login('hod', email, password);
            if (result.success) {
                navigate('/hod-dashboard');
            } else {
                setError(result.message);
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="login-box">
            <div className="auth-mobile-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Nandha Engineering College</h1>
            </div>
            <Link to="/staff" className="back"><i className="fas fa-arrow-left"></i> Back to Selection</Link>
            <h1>HOD Login</h1>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email / ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Enter your email or ID"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-spinner fa-spin"></i> Signing in...
                        </span>
                    ) : 'Sign In'}
                </button>
            </form>



            <div className="form-footer">
                Don't have an account? <Link to="/staff-signup">Sign up here</Link>
            </div>
        </div>
    );
};

export default HodLogin;
