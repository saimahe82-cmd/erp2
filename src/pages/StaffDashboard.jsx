import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('all');
    const [successMsg, setSuccessMsg] = useState('');

    const loadData = useCallback(() => {
        setRequests(leaveService.getPendingForFaculty());
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };



    const handleApprove = (reqId, studentName) => {
        leaveService.facultyAction(reqId, 'approved');
        setSuccessMsg(`✅ Approved request for ${studentName}`);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleReject = (reqId, studentName) => {
        const reason = window.prompt(`Reason for rejecting ${studentName}'s request:`);
        if (reason === null) return;
        leaveService.facultyAction(reqId, 'rejected');
        setSuccessMsg(`❌ Rejected request for ${studentName}`);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleApproveAll = () => {
        if (requests.length === 0) return;
        if (!window.confirm(`Approve all ${requests.length} pending requests?`)) return;
        requests.forEach((req) => {
            leaveService.facultyAction(req.id, 'approved');
        });
        setSuccessMsg(`✅ Approved all ${requests.length} requests`);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const allRequests = leaveService.getAllRequests();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLeaves = allRequests.filter(r =>
        r.status === 'approved' && r.fromDate <= todayStr && r.toDate >= todayStr
    );

    const filteredRequests = filter === 'all' ? requests
        : requests.filter(r => r.leaveType === filter);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDuration = (from, to) => {
        const d1 = new Date(from);
        const d2 = new Date(to);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        return diff === 1 ? '1 Day' : `${diff} Days`;
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-brand" style={{ gap: '0.75rem', padding: '1.5rem' }}>
                    <img src={logo} alt="NEC Logo" style={{ width: '40px', filter: 'brightness(0) invert(1)' }} />
                    <span style={{ fontSize: '0.9rem', lineHeight: 1.1 }}>Nandha Engineering College</span>
                </div>
                <nav>
                    <ul className="sidebar-nav">
                        <li className="sidebar-nav-item">
                            <Link to="/staff-dashboard" className="sidebar-nav-link active">
                                <i className="fas fa-home"></i>
                                <span>Overview</span>
                            </Link>
                        </li>
                        <li className="sidebar-nav-item">
                            <Link to="/faculty-dashboard" className="sidebar-nav-link">
                                <i className="fas fa-clipboard-check"></i>
                                <span>Full Dashboard</span>
                            </Link>
                        </li>
                        <li className="sidebar-nav-item">
                            <a href="#students" className="sidebar-nav-link" onClick={(e) => { e.preventDefault(); navigate('/faculty-dashboard'); }}>
                                <i className="fas fa-users"></i>
                                <span>Students</span>
                            </a>
                        </li>
                        <li className="sidebar-nav-item">
                            <a href="#reports" className="sidebar-nav-link" onClick={(e) => {
                                e.preventDefault();
                                const total = allRequests.length;
                                const approved = allRequests.filter(r => r.status === 'approved').length;
                                const rejected = allRequests.filter(r => r.status === 'rejected').length;
                                const pending = allRequests.filter(r => r.status === 'pending').length;
                                alert(`📊 Reports Summary:\n\nTotal Requests: ${total}\nApproved: ${approved}\nRejected: ${rejected}\nPending: ${pending}`);
                            }}>
                                <i className="fas fa-chart-line"></i>
                                <span>Reports</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={handleLogout} className="sidebar-nav-link" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-section">
                        <h2 style={{ color: 'var(--primary)', fontWeight: 800 }}>Nandha Engineering College</h2>
                        <p className="subtitle" style={{ marginTop: 0, fontWeight: 600 }}>STAFF PORTAL · {user?.department || 'Computer Science'}</p>
                    </div>
                </header>

                {successMsg && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        {successMsg}
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <i className="fas fa-hourglass-half"></i>
                        </div>
                        <div className="stat-info">
                            <h3>Pending Approvals</h3>
                            <p>{String(requests.length).padStart(2, '0')} Requests</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">
                            <i className="fas fa-calendar-check"></i>
                        </div>
                        <div className="stat-info">
                            <h3>Today's Leaves</h3>
                            <p>{String(todayLeaves.length).padStart(2, '0')} Students</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <i className="fas fa-file-invoice"></i>
                        </div>
                        <div className="stat-info">
                            <h3>Total Processed</h3>
                            <p>{allRequests.filter(r => r.facultyStatus !== 'pending').length}</p>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h3 style={{ fontSize: '1.125rem' }}>Pending Leave Requests</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem', background: '#fff', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '0.5rem', fontSize: '0.8rem' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="sick">Sick Leave</option>
                                <option value="personal">Personal</option>
                                <option value="od">On-Duty</option>
                            </select>
                            <button
                                style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem' }}
                                onClick={handleApproveAll}
                                disabled={filteredRequests.length === 0}
                            >
                                Approve All
                            </button>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Reg No</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                        No pending requests! All caught up.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {req.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                <span>{req.studentName}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{req.registerNo}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{getDuration(req.fromDate, req.toDate)}</td>
                                        <td>{req.reason}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <i className="fas fa-check-circle"
                                                    style={{ color: '#10b981', cursor: 'pointer', fontSize: '1.125rem' }}
                                                    title="Approve"
                                                    onClick={() => handleApprove(req.id, req.studentName)}
                                                ></i>
                                                <i className="fas fa-times-circle"
                                                    style={{ color: '#ef4444', cursor: 'pointer', fontSize: '1.125rem' }}
                                                    title="Reject"
                                                    onClick={() => handleReject(req.id, req.studentName)}
                                                ></i>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
