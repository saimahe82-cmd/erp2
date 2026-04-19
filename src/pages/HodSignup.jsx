import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';

const HodSignup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', department: '',
        password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { hodSignup } = useAuth();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            const result = hodSignup(formData);
            if (result.success) {
                navigate('/hod-dashboard');
            } else {
                setError(result.message);
            }
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="auth-split-container">
            {/* Left Side: Information */}
            <div className="auth-info-side">
                <div className="auth-info-content">
                    <img src={logo} alt="NEC Logo" style={{ height: '100px', filter: 'brightness(0) invert(1)', marginBottom: '2rem' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Nandha Engineering College</h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>HOD Portal</p>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="auth-form-side">
                <div className="auth-form-inner">
                    <div className="auth-mobile-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Nandha Engineering College</h1>
                    </div>

                    <div className="auth-form-header">
                        <h2>Create HOD Account</h2>
                        <p>Fill in your details to get started</p>
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
                            <label>Full Name</label>
                            <input type="text" required placeholder="Dr. John Doe"
                                value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                        </div>

                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <input type="email" required placeholder="hod@college.edu"
                                value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                        </div>

                        <div className="auth-input-group">
                            <label>Department</label>
                            <select required value={formData.department}
                                onChange={(e) => handleChange('department', e.target.value)}>
                                <option value="" disabled>Select Department</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="IT">IT</option>
                                <option value="MECH">MECH</option>
                                <option value="CIVIL">CIVIL</option>
                            </select>
                        </div>

                        <div className="auth-input-group">
                            <label>Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                                <i
                                    className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                ></i>
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Confirm Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary-large" disabled={isLoading}>
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="form-footer" style={{ textAlign: 'center', marginTop: '2rem' }}>
                        Already have an account? <Link to="/hod-login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HodSignup;
