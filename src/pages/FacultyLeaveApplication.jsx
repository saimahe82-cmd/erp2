import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import ActionModal from '../components/ActionModal';
import './FacultyLeaveApplication.css';

const FacultyLeaveApplication = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('leave'); // 'leave' or 'od'

    const [leaveData, setLeaveData] = useState({
        leaveType: 'personal',
        reason: '',
        fromDate: '',
        toDate: ''
    });

    const [odData, setOdData] = useState({
        odType: 'workshop',
        purpose: '',
        fromDate: '',
        toDate: '',
        eventName: '',
        address: '',
        orderCopy: null
    });

    const [notification, setNotification] = useState('');
    const [isAlterationModalOpen, setIsAlterationModalOpen] = useState(false);
    const [alterations, setAlterations] = useState([]);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 4000);
    };

    const handleAddAlteration = () => {
        setAlterations([...alterations, { facultyName: '', className: '', section: '', period: '' }]);
    };

    const handleRemoveAlteration = (index) => {
        const updated = alterations.filter((_, i) => i !== index);
        setAlterations(updated);
    };

    const handleAlterationChange = (index, field, value) => {
        const updated = alterations.map((alt, i) =>
            i === index ? { ...alt, [field]: value } : alt
        );
        setAlterations(updated);
    };

    const handleLeaveChange = (e) => {
        const { name, value } = e.target;
        setLeaveData(prev => ({ ...prev, [name]: value }));
    };

    const handleOdChange = (e) => {
        const { name, value } = e.target;
        setOdData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setOdData(prev => ({ ...prev, orderCopy: e.target.files[0].name }));
        }
    };

    const handleSubmitLeave = (e) => {
        e.preventDefault();
        const submissionData = { ...leaveData };
        if (leaveData.leaveType !== 'others') {
            const labels = {
                sick: 'Sick Leave',
                personal: 'Personal Leave',
                emergency: 'Emergency Leave'
            };
            submissionData.reason = labels[leaveData.leaveType] || leaveData.leaveType;
        }

        const result = leaveService.applyLeave({
            ...submissionData,
            studentName: user.name,
            alterations: alterations
        }, user);

        if (result.success) {
            // We use a small delay or a query param to show the notification on the dashboard
            navigate('/faculty-dashboard?message=Leave request submitted successfully');
        } else {
            showNotification('❌ Failed to submit: ' + result.message);
        }
    };

    const handleSubmitOd = (e) => {
        e.preventDefault();
        const submissionData = { ...odData };
        if (odData.odType !== 'others') {
            const labels = {
                workshop: 'Workshop / Seminar',
                conference: 'Conference',
                symposium: 'Symposium',
                placement: 'Placement Activity'
            };
            submissionData.purpose = labels[odData.odType] || odData.odType;
        }

        const result = leaveService.applyLeave({
            leaveType: 'od',
            fromDate: odData.fromDate,
            toDate: odData.toDate,
            reason: `${submissionData.purpose} - ${odData.eventName} @ ${odData.address}`,
            studentName: user.name,
            alterations: alterations
        }, user);

        if (result.success) {
            navigate('/faculty-dashboard?message=On Duty request submitted successfully');
        } else {
            showNotification('❌ Failed to submit: ' + result.message);
        }
    };

    return (
        <div className="staff-portal-wrapper">
            {notification && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem', zIndex: 3000, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    {notification}
                </div>
            )}

            <ActionModal
                isOpen={isAlterationModalOpen}
                onClose={() => setIsAlterationModalOpen(false)}
                onConfirm={() => setIsAlterationModalOpen(false)}
                title="Class Alteration Information"
                type="info"
                message="Please ensure you have coordinated with your colleagues for class alterations. This section allows you to note which sessions are being handled by other faculty members during your absence."
            />

            <Link to="/faculty-dashboard" className="back-link">
                <i className="fas fa-arrow-left"></i> Back to Dashboard
            </Link>

            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)', padding: '2rem', borderRadius: '1.25rem', color: '#fff', marginBottom: '2rem' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '60px', filter: 'brightness(0) invert(1)' }} />
                <div>
                    <h1 className="page-title" style={{ margin: 0, color: '#fff' }}>Nandha Engineering College</h1>
                    <p className="page-subtitle" style={{ margin: '0.25rem 0 0', opacity: 0.9, fontWeight: 600, letterSpacing: '0.05em' }}>STAFF LEAVE & OD PORTAL</p>
                </div>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leave')}
                >
                    <i className="fas fa-calendar-alt"></i> Leave Submission
                </button>
                <button
                    className={`tab-button ${activeTab === 'od' ? 'active' : ''}`}
                    onClick={() => setActiveTab('od')}
                >
                    <i className="fas fa-briefcase"></i> On Duty Submission
                </button>
            </div>

            {activeTab === 'leave' ? (
                <div className="form-card">
                    <h2 className="form-title">Leave Request</h2>
                    <form onSubmit={handleSubmitLeave}>
                        <div className="form-group">
                            <label className="form-label">Leave Type</label>
                            <select
                                name="leaveType"
                                className="form-control"
                                value={leaveData.leaveType}
                                onChange={handleLeaveChange}
                            >
                                <option value="sick">Sick Leave</option>
                                <option value="personal">Personal Leave</option>
                                <option value="emergency">Emergency Leave</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        {leaveData.leaveType === 'others' && (
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea
                                    name="reason"
                                    className="form-control"
                                    placeholder="Enter the reason for your leave..."
                                    value={leaveData.reason}
                                    onChange={handleLeaveChange}
                                    required
                                ></textarea>
                            </div>
                        )}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input
                                    type="date"
                                    name="fromDate"
                                    className="form-control"
                                    value={leaveData.fromDate}
                                    onChange={handleLeaveChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    className="form-control"
                                    value={leaveData.toDate}
                                    onChange={handleLeaveChange}
                                />
                            </div>
                        </div>

                        <div className="alteration-section" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Class Alterations</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Specify which faculty will handle your classes</p>
                                </div>
                                <button type="button" className="secondary-btn" onClick={handleAddAlteration} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none' }}>
                                    <i className="fas fa-plus-circle"></i> Add Alteration
                                </button>
                            </div>

                            {alterations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed #e2e8f0', borderRadius: '0.75rem', background: 'white' }}>
                                    <i className="fas fa-users-cog" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No alterations added yet. Click "Add Alteration" to manage your classes.</p>
                                </div>
                            ) : (
                                <div className="alterations-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {alterations.map((alt, idx) => (
                                        <div key={idx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 40px',
                                            gap: '10px',
                                            alignItems: 'center',
                                            padding: '10px',
                                            background: 'white',
                                            borderRadius: '0.6rem',
                                            border: '1px solid #f1f5f9',
                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Faculty Name"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.facultyName}
                                                    onChange={(e) => handleAlterationChange(idx, 'facultyName', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Class & Year"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.className}
                                                    onChange={(e) => handleAlterationChange(idx, 'className', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Section"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.section}
                                                    onChange={(e) => handleAlterationChange(idx, 'section', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Period"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.period}
                                                    onChange={(e) => handleAlterationChange(idx, 'period', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAlteration(idx)}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '0.4rem',
                                                    cursor: 'pointer',
                                                    height: '34px',
                                                    width: '34px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Remove"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="submit-btn" style={{ marginTop: '2rem', width: '100%' }}>
                            Submit Leave Request
                        </button>
                    </form>
                </div>
            ) : (
                <div className="form-card">
                    <h2 className="form-title">On Duty Request</h2>
                    <form onSubmit={handleSubmitOd}>
                        <div className="form-group">
                            <label className="form-label">OD Type</label>
                            <select
                                name="odType"
                                className="form-control"
                                value={odData.odType}
                                onChange={handleOdChange}
                            >
                                <option value="workshop">Workshop / Seminar</option>
                                <option value="conference">Conference</option>
                                <option value="symposium">Symposium</option>
                                <option value="placement">Placement Activity</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        {odData.odType === 'others' && (
                            <div className="form-group">
                                <label className="form-label">Purpose</label>
                                <textarea
                                    name="purpose"
                                    className="form-control"
                                    placeholder="Enter the purpose of on duty..."
                                    value={odData.purpose}
                                    onChange={handleOdChange}
                                    required
                                ></textarea>
                            </div>
                        )}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input
                                    type="date"
                                    name="fromDate"
                                    className="form-control"
                                    value={odData.fromDate}
                                    onChange={handleOdChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    className="form-control"
                                    value={odData.toDate}
                                    onChange={handleOdChange}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <input
                                    type="text"
                                    name="eventName"
                                    className="form-control"
                                    placeholder="Enter event name"
                                    value={odData.eventName}
                                    onChange={handleOdChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    placeholder="Event venue address"
                                    value={odData.address}
                                    onChange={handleOdChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Order Copy</label>
                            <div className="upload-area" onClick={() => document.getElementById('file-upload').click()}>
                                <input
                                    type="file"
                                    id="file-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <div className="upload-icon">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                </div>
                                <div className="upload-text">
                                    {odData.orderCopy ? odData.orderCopy : "Click to upload approval proof"}
                                </div>
                            </div>
                        </div>

                        <div className="alteration-section" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Class Alterations</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Specify which faculty will handle your classes</p>
                                </div>
                                <button type="button" className="secondary-btn" onClick={handleAddAlteration} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none' }}>
                                    <i className="fas fa-plus-circle"></i> Add Alteration
                                </button>
                            </div>

                            {alterations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed #e2e8f0', borderRadius: '0.75rem', background: 'white' }}>
                                    <i className="fas fa-users-cog" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No alterations added yet. Click "Add Alteration" to manage your classes.</p>
                                </div>
                            ) : (
                                <div className="alterations-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {alterations.map((alt, idx) => (
                                        <div key={idx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 40px',
                                            gap: '10px',
                                            alignItems: 'center',
                                            padding: '10px',
                                            background: 'white',
                                            borderRadius: '0.6rem',
                                            border: '1px solid #f1f5f9',
                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Faculty Name"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.facultyName}
                                                    onChange={(e) => handleAlterationChange(idx, 'facultyName', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Class & Year"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.className}
                                                    onChange={(e) => handleAlterationChange(idx, 'className', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Section"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.section}
                                                    onChange={(e) => handleAlterationChange(idx, 'section', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Period"
                                                    className="form-control"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    value={alt.period}
                                                    onChange={(e) => handleAlterationChange(idx, 'period', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAlteration(idx)}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '0.4rem',
                                                    cursor: 'pointer',
                                                    height: '34px',
                                                    width: '34px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Remove"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem', width: '100%' }}>
                            Submit OD Request
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FacultyLeaveApplication;
