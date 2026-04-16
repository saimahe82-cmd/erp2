import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';

const FacultyLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const result = login('faculty', email, password);
            if (result.success) {
                if (result.user && result.user.role === 'od_checker') {
                    navigate('/od-checker');
                } else {
                    navigate('/faculty-dashboard');
                }
            } else {
                setError(result.message);
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="auth-split-container">
            {/* Left Side: Information */}
            <div className="auth-info-side">
                <div className="auth-icon-wrapper">
                    <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="auth-info-content">
                    <h1>Faculty Portal</h1>
                    <p>Manage your students, proctees, and academic responsibilities all in one place.</p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="auth-form-side">
                <div className="auth-form-inner">
                    <div className="auth-mobile-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Nandha Engineering College</h1>
                    </div>

                    <div className="auth-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to access your dashboard</p>
                    </div>

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
                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="faculty@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <i
                                    className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                ></i>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="#" className="forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn-primary-large" disabled={isLoading}>
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>



                    <div className="form-footer" style={{ textAlign: 'center', marginTop: '2rem' }}>
                        Don't have an account? <Link to="/staff-signup">Create account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyLogin;
