import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';

const StudentSignup = () => {
    const [accommodation, setAccommodation] = useState('day-scholar');
    const [formData, setFormData] = useState({
        name: '', registerNo: '', department: '', year: '', vertical: '',
        phone: '', parentPhone: '', email: '', password: '', confirmPassword: '',
        guardianName: '', guardianPhone: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { studentSignup } = useAuth();

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
            const result = studentSignup({ ...formData, accommodation });
            if (result.success) {
                navigate('/student-dashboard');
            } else {
                setError(result.message);
            }
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="login-box" style={{ maxWidth: '600px' }}>
            <div className="auth-mobile-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Nandha Engineering College</h1>
            </div>
            <Link to="/student-login" className="back"><i className="fas fa-arrow-left"></i> Back to Login</Link>
            <h1>Student Registration</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Create your student portal account</p>

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" required placeholder="Enter Name"
                            value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Register Number</label>
                        <input type="text" required placeholder="24CS096"
                            value={formData.registerNo} onChange={(e) => handleChange('registerNo', e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Department</label>
                        <select required value={formData.department}
                            onChange={(e) => handleChange('department', e.target.value)}>
                            <option value="" disabled>Select Dept</option>
                            <option value="CSE">CSE</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="IT">IT</option>
                            <option value="MECH">MECH</option>
                            <option value="CIVIL">CIVIL</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Year of Study</label>
                        <select required value={formData.year}
                            onChange={(e) => handleChange('year', e.target.value)}>
                            <option value="" disabled>Select Year</option>
                            <option value="I">I Year</option>
                            <option value="II">II Year</option>
                            <option value="III">III Year</option>
                            <option value="IV">IV Year</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Verticals</label>
                    <select required value={formData.vertical}
                        onChange={(e) => handleChange('vertical', e.target.value)}>
                        <option value="" disabled>Select Vertical</option>
                        <option value="CIC lab">CIC lab</option>
                        <option value="RIC lab">RIC lab</option>
                        <option value="Gen AI lab">Gen AI lab</option>
                        <option value="Creation lab">Creation lab</option>
                        <option value="AR/VR lab">AR/VR lab</option>
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Student Phone</label>
                        <input type="tel" required placeholder="98765 43210"
                            value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Parent Phone</label>
                        <input type="tel" required placeholder="98765 43210"
                            value={formData.parentPhone} onChange={(e) => handleChange('parentPhone', e.target.value)} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Accommodation Type</label>
                    <select
                        value={accommodation}
                        required
                        onChange={(e) => setAccommodation(e.target.value)}
                    >
                        <option value="day-scholar">Day Scholar</option>
                        <option value="hosteler">Hosteler</option>
                    </select>
                </div>

                {accommodation === 'hosteler' && (
                    <div id="guardian-section" style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px dashed var(--card-border)',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{
                            fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase',
                            letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '1rem'
                        }}>
                            Guardian Details (For Hostelers)
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Guardian Name</label>
                                <input type="text" required placeholder="Enter name"
                                    value={formData.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Guardian Phone</label>
                                <input type="tel" required placeholder="Enter phone"
                                    value={formData.guardianPhone} onChange={(e) => handleChange('guardianPhone', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Personal Email</label>
                    <input type="email" required placeholder="24cs096@nandhaenggg.org"
                        value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" required placeholder="Create password (min 6 chars)"
                            value={formData.password} onChange={(e) => handleChange('password', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" required placeholder="Confirm password"
                            value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} style={{ marginTop: '1rem' }}>
                    {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-spinner fa-spin"></i> Creating Account...
                        </span>
                    ) : 'Complete Registration'}
                </button>
            </form>
            <div className="form-footer">
                Already have an account? <Link to="/student-login">Login here</Link>
            </div>
        </div>
    );
};

export default StudentSignup;
