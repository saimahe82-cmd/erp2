import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import logo from '../assets/nec-logo.jpeg';
import './HodDashboard.css';

/* ══════════════════════════════════════════════════════════════
   HELPER — Read student's current section from their saved profile
   This ensures filtering always reflects the latest section the
   student saved in "My Details", even for old leave requests.
══════════════════════════════════════════════════════════════ */
const getStudentSection = (studentEmail) => {
    if (!studentEmail) return 'A';
    try {
        const stored = JSON.parse(
            localStorage.getItem(`stu_extra_${studentEmail.toLowerCase()}`) || 'null'
        );
        return stored?.section || 'A';
    } catch (e) {
        console.error('Error reading student section:', e);
        return 'A';
    }
};

const HodDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('dashboard');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [modalRemarks, setModalRemarks] = useState('');

    // Filter states
    const [leaveFilter, setLeaveFilter] = useState('all');
    const [odFilter, setOdFilter] = useState('all');

    const [requests, setRequests] = useState({});
    const [overdueProofs, setOverdueProofs] = useState([]);

    const loadRequests = useCallback(() => {
        const pending = leaveService.getPendingForHod();
        setOverdueProofs(leaveService.getOverdueOdProofs());

        const mappedRequests = {};

        pending.forEach(req => {
            let requestType = 'leave';
            if (req.type.toLowerCase().includes('od') || req.type.toLowerCase().includes('on-duty')) {
                requestType = 'od';
            } else if (req.type === 'R&D' || req.leaveType === 'rnd') {
                requestType = 'rnd';
            }

            // ── KEY FIX: Always resolve section live from student's saved profile ──
            // Falls back to what was stored in the request, then defaults to 'A'
            const resolvedSection = getStudentSection(req.studentEmail) || req.section || 'A';

            const commonFields = [
                [requestType === 'rnd' || req.studentEmail?.includes('faculty') || req.studentEmail?.includes('staff') ? 'Staff' : 'Student', req.studentName],
                ['Register No', req.registerNo],
                ['Type', req.leaveType ? req.leaveType.toUpperCase() : req.type],
                ['Status', req.hodStatus],
            ];

            let specificFields = [];
            if (requestType === 'rnd') {
                specificFields = [
                    ['Activity', req.activityType],
                    ['Title', req.title],
                    ['Domain', req.domain],
                    ['Abstract', req.abstract || '-'],
                    ['Applied On', new Date(req.appliedAt).toLocaleDateString()]
                ];
                if (req.journalName) specificFields.push(['Journal', req.journalName]);
                if (req.conferenceName) specificFields.push(['Conference', req.conferenceName]);
                if (req.patentTitle) specificFields.push(['Patent', req.patentTitle]);
                if (req.fundingAgency) specificFields.push(['Funding Agency', req.fundingAgency]);
                if (req.document) specificFields.push(['Document', req.documentName || 'View File']);
            } else {
                specificFields = [
                    ['From', new Date(req.fromDate).toLocaleDateString()],
                    ['To', new Date(req.toDate).toLocaleDateString()],
                    ['Reason', req.reason],
                    ['Department', 'CSE'],
                    ['Section', resolvedSection]
                ];
                if (req.odProof) {
                    specificFields.push(['Geotag Evidence', req.odProof]);
                    if (req.odProofLocation) {
                        specificFields.push(['Verified Location', `Lat: ${req.odProofLocation.lat}, Lng: ${req.odProofLocation.lng}`]);
                    }
                }
            }

            mappedRequests[req.id] = {
                id: req.id,
                type: requestType,
                title: `${req.type} — ${req.studentName}`,
                fields: [...commonFields, ...specificFields],
                pending: req.hodStatus === 'pending',
                studentName: req.studentName,
                reason: req.reason,
                // ── Store the live-resolved section for filter comparisons ──
                section: resolvedSection,
                activityType: req.activityType,
                document: req.document,
                documentName: req.documentName,
                alterations: req.alterations || []
            };
        });

        setRequests(mappedRequests);
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openModal = (id) => {
        setSelectedRequestId(id);
        setModalRemarks('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedRequestId(null);
    };

    const handleAction = (status) => {
        if (!selectedRequestId) return;
        leaveService.hodAction(selectedRequestId, status);
        loadRequests();
        closeModal();
    };

    const getField = (id, fieldName) => {
        const f = requests[id].fields.find(item => item[0] === fieldName);
        return f ? f[1] : '';
    };

    const getStatus = (id) => {
        return getField(id, 'Status');
    };

    // Filter requests by section using the live-resolved section stored on each request
    const filterBySection = (requestsList, filterValue) => {
        if (filterValue === 'all') return requestsList;
        return requestsList.filter(r => r.section === filterValue);
    };

    const pendingCount = Object.values(requests).filter(r => r.pending).length;
    const leavePending = Object.values(requests).filter(r => r.type === 'leave' && r.pending).length;
    const odPending = Object.values(requests).filter(r => r.type === 'od' && r.pending).length;
    const rndPending = Object.values(requests).filter(r => r.type === 'rnd' && r.pending).length;

    const leaveRequests = filterBySection(
        Object.values(requests).filter(r => r.type === 'leave'),
        leaveFilter
    );
    const odRequests = filterBySection(
        Object.values(requests).filter(r => r.type === 'od'),
        odFilter
    );


    const SectionFilterBar = ({ current, onChange }) => (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-filter" style={{ color: 'var(--primary)' }} /> Filter Section:
            </span>
            <select
                value={current}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    padding: '0.5rem 2rem 0.5rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s',
                    minWidth: '150px'
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
            >
                <option value="all">All Sections</option>
                {['A', 'B', 'C', 'D'].map(section => (
                    <option key={section} value={section}>
                        CSE - {section}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="hod-dashboard-wrapper">
            {/* SIDEBAR */}
            <nav className="sidebar">
                <div className="sidebar-header">HOD Panel</div>
                <div className="sidebar-nav">
                    <button
                        className={activePage === 'dashboard' ? 'active' : ''}
                        onClick={() => setActivePage('dashboard')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Dashboard
                    </button>
                    <button
                        className={activePage === 'leave' ? 'active' : ''}
                        onClick={() => setActivePage('leave')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Leave Requests
                    </button>
                    <button
                        className={activePage === 'od' ? 'active' : ''}
                        onClick={() => setActivePage('od')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                        </svg>
                        On Duty Requests
                    </button>
                    <button
                        className={activePage === 'rnd' ? 'active' : ''}
                        onClick={() => setActivePage('rnd')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 3h6l3 7-6 11-6-11z" />
                            <path d="M12 21V10" />
                        </svg>
                        R&D Submissions
                    </button>
                </div>

                <div style={{ marginTop: 'auto', padding: '16px 8px' }}>
                    <div className="sidebar-nav">
                        <button onClick={handleLogout} style={{ color: '#ef4444' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* MAIN */}
            <div className="main">
                <div className="topbar" style={{ height: '70px', padding: '0 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} alt="NEC Logo" style={{ height: '45px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', lineHeight: 1.1 }}>Nandha Engineering College</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-fg)', letterSpacing: '0.05em' }}>HOD DASHBOARD</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--muted-fg)' }}>{user?.name || 'HOD'}</span>
                    </div>
                </div>
                <div className="content">

                    {/* ── DASHBOARD PAGE ── */}
                    {activePage === 'dashboard' && (
                        <div className="page active">
                            <h1>Dashboard Overview</h1>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-card-header">
                                        <span className="stat-card-title">Leave Requests</span>
                                        <span className="stat-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="stat-card-value">{leavePending}</div>
                                    <div className="stat-card-desc">Pending approval</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-header">
                                        <span className="stat-card-title">OD Requests</span>
                                        <span className="stat-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="7" width="20" height="14" rx="2" />
                                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="stat-card-value">{odPending}</div>
                                    <div className="stat-card-desc">Pending approval</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-header">
                                        <span className="stat-card-title">R&D Submissions</span>
                                        <span className="stat-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 3h6l3 7-6 11-6-11z" />
                                                <path d="M12 21V10" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="stat-card-value">{rndPending}</div>
                                    <div className="stat-card-desc">Pending approval</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-header">
                                        <span className="stat-card-title">Total Pending</span>
                                        <span className="stat-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="stat-card-value">{pendingCount}</div>
                                    <div className="stat-card-desc">Across all categories</div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">Recent Pending Requests</div>
                                <div className="card-content">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Section</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.values(requests).filter(r => r.pending).slice(0, 5).map(req => (
                                                <tr key={req.id}>
                                                    <td className="mono">{req.id}</td>
                                                    <td>{getField(req.id, 'Student') || getField(req.id, 'Staff')}</td>
                                                    <td>
                                                        {req.type !== 'rnd' && (
                                                            <span style={{
                                                                padding: '0.25rem 0.5rem',
                                                                background: '#f1f5f9',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600
                                                            }}>
                                                                CSE-{req.section}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{req.type === 'leave' ? 'Leave' : req.type === 'od' ? 'OD' : 'R&D'}</td>
                                                    <td>
                                                        <span className={`badge badge-${getStatus(req.id)}`}>
                                                            {getStatus(req.id)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── LEAVE REQUESTS PAGE ── */}
                    {activePage === 'leave' && (
                        <div className="page active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h1 style={{ margin: 0 }}>Leave Requests</h1>
                                <SectionFilterBar current={leaveFilter} onChange={setLeaveFilter} />
                            </div>
                            <div className="card">
                                <div className="card-content" style={{ paddingTop: '20px' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Student</th>
                                                <th>Days</th>
                                                <th>Reason</th>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaveRequests.map(req => {
                                                const rawReq = leaveService.getAllRequests().find(r => r.id === req.id);
                                                const days = rawReq && rawReq.fromDate && rawReq.toDate ? Math.max(1, Math.ceil((new Date(rawReq.toDate) - new Date(rawReq.fromDate)) / 86400000) + 1) : 1;
                                                return (
                                                    <tr key={req.id}>
                                                        <td className="mono">{req.id}</td>
                                                        <td className="td-name">
                                                            <div className="font-medium">{getField(req.id, 'Student')}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>CSE-{req.section}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 800, color: '#6366f1', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                                {days}d
                                                            </span>
                                                        </td>
                                                        <td title={getField(req.id, 'Reason')}>{getField(req.id, 'Reason')?.substring(0, 20)}{getField(req.id, 'Reason')?.length > 20 ? '...' : ''}</td>
                                                        <td>{getField(req.id, 'From')}</td>
                                                        <td>{getField(req.id, 'To')}</td>
                                                        <td>
                                                            <span className={`badge badge-${getStatus(req.id)}`}>
                                                                {getStatus(req.id)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-ghost" onClick={() => openModal(req.id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── OD REQUESTS PAGE ── */}
                    {activePage === 'od' && (
                        <div className="page active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h1 style={{ margin: 0 }}>On Duty Requests</h1>
                                <SectionFilterBar current={odFilter} onChange={setOdFilter} />
                            </div>
                            <div className="card">
                                <div className="card-content" style={{ paddingTop: '20px' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Student</th>
                                                <th>Days</th>
                                                <th>Event / Reason</th>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {odRequests.map(req => {
                                                const rawReq = leaveService.getAllRequests().find(r => r.id === req.id);
                                                const days = rawReq && rawReq.fromDate && rawReq.toDate ? Math.max(1, Math.ceil((new Date(rawReq.toDate) - new Date(rawReq.fromDate)) / 86400000) + 1) : 1;
                                                return (
                                                    <tr key={req.id}>
                                                        <td className="mono">{req.id}</td>
                                                        <td className="td-name">
                                                            <div className="font-medium">{getField(req.id, 'Student')}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>CSE-{req.section}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 800, color: '#0ea5e9', background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                                {days}d
                                                            </span>
                                                        </td>
                                                        <td title={getField(req.id, 'Reason')}>{getField(req.id, 'Reason')?.substring(0, 20)}{getField(req.id, 'Reason')?.length > 20 ? '...' : ''}</td>
                                                        <td>{getField(req.id, 'From')}</td>
                                                        <td>{getField(req.id, 'To')}</td>
                                                        <td>
                                                            <span className={`badge badge-${getStatus(req.id)}`}>
                                                                {getStatus(req.id)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-ghost" onClick={() => openModal(req.id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── R&D REQUESTS PAGE ── */}
                    {activePage === 'rnd' && (
                        <div className="page active">
                            <h1>R&D Submissions</h1>
                            <div className="card">
                                <div className="card-content" style={{ paddingTop: '20px' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Staff Name</th>
                                                <th>Activity</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.values(requests).filter(r => r.type === 'rnd').length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                        No R&D submissions found.
                                                    </td>
                                                </tr>
                                            ) : Object.values(requests).filter(r => r.type === 'rnd').map(req => (
                                                <tr key={req.id}>
                                                    <td className="mono">{req.id}</td>
                                                    <td className="font-medium">{getField(req.id, 'Staff')}</td>
                                                    <td>{getField(req.id, 'Activity') || getField(req.id, 'Reason')}</td>
                                                    <td>
                                                        <span className={`badge badge-${getStatus(req.id)}`}>
                                                            {getStatus(req.id)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-ghost" onClick={() => openModal(req.id)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── MODAL ── */}
            {modalOpen && selectedRequestId && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target.className === 'modal-overlay') closeModal(); }}
                >
                    <div className="modal">
                        <h2>{requests[selectedRequestId].title}</h2>
                        <div className="modal-grid">
                            {requests[selectedRequestId].fields.map(([label, val], idx) => (
                                <div key={idx}>
                                    <span className="label">{label}:</span>{' '}
                                    {label === 'Status' ? (
                                        <span className={`badge badge-${val}`}>{val}</span>
                                    ) : label === 'Document' && requests[selectedRequestId].type === 'rnd' ? (
                                        <span style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>
                                            <i className="fas fa-file-pdf" /> {val}
                                        </span>
                                    ) : label === 'Geotag Evidence' ? (
                                        <div style={{ marginTop: '0.75rem', overflow: 'hidden' }}>
                                            <img src={val} alt="Live Verification Proof" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <i className="fas fa-check-circle" /> Validated by Hardware Geolocation
                                            </div>
                                        </div>
                                    ) : label === 'Verified Location' ? (
                                        <strong><a href={`https://maps.google.com/?q=${val.split('Lat: ')[1]?.split(', Lng: ')[0]},${val.split('Lng: ')[1]}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9' }}><i className="fas fa-map-marker-alt" /> Map Location</a> ({val})</strong>
                                    ) : label === 'Section' ? (
                                        <strong>CSE-{val}</strong>
                                    ) : (
                                        <strong>{val}</strong>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Alterations Section */}
                        {requests[selectedRequestId].alterations &&
                            requests[selectedRequestId].alterations.length > 0 && (
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <h3 style={{
                                        fontSize: '0.9rem', fontWeight: 700, color: '#475569',
                                        marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>
                                        Class Alterations
                                    </h3>
                                    <div style={{
                                        background: '#f8fafc', borderRadius: '0.5rem',
                                        overflow: 'hidden', border: '1px solid #e2e8f0'
                                    }}>
                                        <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Faculty</th>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Class</th>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Sec</th>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Period</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests[selectedRequestId].alterations.map((alt, i) => (
                                                    <tr
                                                        key={i}
                                                        style={{
                                                            borderBottom: i === requests[selectedRequestId].alterations.length - 1
                                                                ? 'none' : '1px solid #e2e8f0'
                                                        }}
                                                    >
                                                        <td style={{ padding: '8px', fontWeight: 600 }}>{alt.facultyName}</td>
                                                        <td style={{ padding: '8px' }}>{alt.className}</td>
                                                        <td style={{ padding: '8px' }}>{alt.section}</td>
                                                        <td style={{ padding: '8px' }}>{alt.period}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        {/* Approve / Reject actions */}
                        {requests[selectedRequestId].pending &&
                            requests[selectedRequestId].type !== 'rnd' && (
                                <div className="modal-actions-area">
                                    <textarea
                                        placeholder="Add remarks..."
                                        value={modalRemarks}
                                        onChange={(e) => setModalRemarks(e.target.value)}
                                    />
                                    <div className="modal-actions">
                                        <button className="btn btn-reject" onClick={() => handleAction('rejected')}>
                                            ✕ Reject
                                        </button>
                                        <button className="btn btn-approve" onClick={() => handleAction('approved')}>
                                            ✓ Approve
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* R&D info note */}
                        {requests[selectedRequestId].type === 'rnd' && (
                            <div style={{
                                marginTop: '1rem', padding: '0.75rem',
                                background: 'hsl(210, 20%, 96%)', borderRadius: '0.5rem',
                                fontSize: '0.875rem', color: 'var(--muted-fg)'
                            }}>
                                <p>R&D submissions are for record and review only. No approval needed.</p>
                            </div>
                        )}

                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={closeModal}
                                style={{ marginLeft: 'auto' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HodDashboard;