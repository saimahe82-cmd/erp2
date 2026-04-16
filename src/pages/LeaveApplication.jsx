import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';

const LeaveApplication = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showProfile, setShowProfile } = useOutletContext();
    const [formData, setFormData] = useState({
        leaveType: 'sick',
        fromDate: '',
        toDate: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validate dates
        if (new Date(formData.fromDate) > new Date(formData.toDate)) {
            setError('From Date cannot be after To Date.');
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            const submissionData = { ...formData };
            if (formData.leaveType !== 'others') {
                const typeLabels = {
                    sick: 'Sick Leave',
                    personal: 'Personal Leave',
                    emergency: 'Emergency Leave'
                };
                submissionData.reason = typeLabels[formData.leaveType] || formData.leaveType;
            }

            const result = leaveService.applyLeave(submissionData, user);
            if (result.success) {
                // Redirect based on role
                const dashboardPath = user?.role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard';
                navigate(dashboardPath);
            } else {
                setError(result.message || 'Failed to submit. Please try again.');
            }
            setIsSubmitting(false);
        }, 600);
    };

    const dashboardPath = user?.role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard';

    return (
        <div className="login-box" style={{ margin: '0 auto', maxWidth: '600px', textAlign: 'left', background: '#fff', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Nandha Engineering College</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.25rem' }}>STUDENT LEAVE APPLICATION</p>
                </div>
            </div>
            {/* <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Apply Leave</h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Request your absence for approval</p>
            </div> */}

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
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Leave Type</label>
                    <select
                        value={formData.leaveType}
                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                    >
                        <option value="sick">Sick Leave</option>
                        <option value="medical">Medical Leave</option>
                        <option value="personal">Personal Leave</option>
                        <option value="emergency">Emergency Leave</option>
                        <option value="others">Others</option>
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>From Date</label>
                        <input
                            type="date"
                            required
                            value={formData.fromDate}
                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>To Date</label>
                        <input
                            type="date"
                            required
                            value={formData.toDate}
                            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                        />
                    </div>
                </div>

                {formData.fromDate && formData.toDate && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1.5px dashed #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6366f1' }}>
                            <i className="fas fa-calendar-alt" style={{ marginRight: '0.5rem' }} />
                            Total Duration: {(() => {
                                const diff = Math.ceil((new Date(formData.toDate) - new Date(formData.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                                return diff === 1 ? '1 Day' : `${diff} Days`;
                            })()}
                        </span>
                    </div>
                )}

                {formData.leaveType === 'others' && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Reason for Leave</label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0',
                                minHeight: '120px',
                                fontFamily: 'inherit',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Explain your reason here..."
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '2.5rem', justifyContent: 'center' }}>
                    <button type="submit" style={{
                        flex: '1', maxWidth: '200px', height: '48px', padding: '0', margin: '0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.25)', transition: 'transform 0.2s', fontSize: '0.95rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                    }} disabled={isSubmitting}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-spinner fa-spin"></i> Submitting...
                            </span>
                        ) : 'Submit'}
                    </button>
                    <Link
                        to={dashboardPath}
                        style={{
                            flex: '1', maxWidth: '200px', height: '48px', padding: '0', margin: '0', border: '1.5px solid #e2e8f0',
                            borderRadius: '0.625rem', color: '#64748b', fontWeight: 700,
                            textDecoration: 'none', fontSize: '0.95rem', textAlign: 'center',
                            transition: 'all 0.2s', background: '#f8fafc', boxSizing: 'border-box',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default LeaveApplication;
