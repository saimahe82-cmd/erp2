import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../services/api';
import logo from '../assets/nec-logo.jpeg';

const ODChecker = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [teamModalId, setTeamModalId] = useState(null);
    const [filter, setFilter] = useState('pending'); // 'pending' or 'history'

    useEffect(() => {
        if (!user || user.role !== 'od_checker') {
            navigate('/');
        } else {
            fetchRequests();
        }
    }, [user, navigate]);

    const fetchRequests = () => {
        const allReqs = db.getRequests().filter(r =>
            r.leaveType === 'od' &&
            (r.odType || r.odTypeLabel || '').toLowerCase().includes('event')
        ).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        setRequests(allReqs);
    };

    const handleAction = (id, action) => {
        // Update the checkerStatus directly
        const r = db.updateRequest(id, { checkerStatus: action });
        if (r) {
            db.addNotification({
                userId: db.getUserByEmail(r.studentEmail)?.id,
                message: `Your Event OD has been ${action} by the Verification Officer.`,
                type: action === 'approved' ? 'success' : 'error'
            });
            fetchRequests();
        }
    };

    const parseEventDetails = (description) => {
        const lines = description.split('\n');
        const extract = (key) => lines.find(l => l.startsWith(key))?.replace(key, '').trim() || '—';

        let venue = '—', level = '—', state = '—';
        const venueLine = lines.find(l => l.startsWith('Venue:'));
        if (venueLine) {
            const parts = venueLine.split('|');
            venue = parts[0]?.replace('Venue:', '').trim() || '—';
            level = parts[1]?.replace('Level:', '').trim() || '—';
            state = parts[2]?.replace('State:', '').trim() || '—';
        }

        let teamString = '—';
        const teamHeaderIdx = lines.findIndex(l => l.includes('Team Members:'));
        if (teamHeaderIdx !== -1) {
            const members = [];
            for (let i = teamHeaderIdx + 1; i < lines.length; i++) {
                if (lines[i].trim() && lines[i].includes('(Reg No:')) {
                    members.push(lines[i].trim());
                }
            }
            teamString = members.join('\n');
        }

        return {
            type: extract('Event Type:'),
            name: extract('Event Name:'),
            participation: extract('Participation:'),
            venue,
            level,
            state,
            teamString
        };
    };



    const handleLogout = () => {
        logout();
        navigate('/faculty-login');
    };

    const filteredReqs = requests.filter(r =>
        filter === 'pending' ? r.checkerStatus === 'pending' : (r.checkerStatus === 'approved' || r.checkerStatus === 'rejected')
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} alt="Logo" style={{ height: '40px' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>OD Verification Portal</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Officer: {user?.name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fas fa-sign-out-alt" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>

                {/* Stats & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setFilter('pending')}
                            style={{
                                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                background: filter === 'pending' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#fff',
                                color: filter === 'pending' ? '#fff' : '#64748b',
                                boxShadow: filter === 'pending' ? '0 4px 12px rgba(59,130,246,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            Pending Actions
                        </button>
                        <button
                            onClick={() => setFilter('history')}
                            style={{
                                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                background: filter === 'history' ? 'linear-gradient(135deg, #64748b, #475569)' : '#fff',
                                color: filter === 'history' ? '#fff' : '#64748b',
                                boxShadow: filter === 'history' ? '0 4px 12px rgba(100,116,139,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            Processed History
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>S.No</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Student Info</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Event Info</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Context</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Post-Event Evidence</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReqs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
                                            No {filter} event OD requests found.
                                        </td>
                                    </tr>
                                ) : filteredReqs.map((req, idx) => {
                                    const stu = db.getUserByEmail(req.studentEmail);
                                    const parsedDetails = parseEventDetails(req.reason);

                                    return (
                                        <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                            <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>{idx + 1}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{req.studentName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{req.registerNo} • {stu?.year || '—'} Yr</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{new Date(req.appliedAt).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{parsedDetails.name}</div>
                                                <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', background: '#e0e7ff', color: '#4338ca', fontSize: '0.7rem', borderRadius: '4px', fontWeight: 700, marginRight: '0.5rem' }}>
                                                    {parsedDetails.type}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {req.fromDate === req.toDate ? req.fromDate : `${req.fromDate} to ${req.toDate}`}
                                                </span>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    {parsedDetails.participation === 'Team' ? (
                                                        <span
                                                            onClick={() => setTeamModalId(req.id)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#b45309', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            <i className="fas fa-users" /> Team (Click to View)
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px' }}>
                                                            Individual
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#334155' }}><i className="fas fa-map-marker-alt" style={{ color: '#ef4444', width: '15px' }} /> {parsedDetails.venue}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}><i className="fas fa-trophy" style={{ color: '#f59e0b', width: '15px' }} /> {parsedDetails.level} Level</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}><i className="fas fa-globe" style={{ color: '#3b82f6', width: '15px' }} /> {parsedDetails.state}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', fontWeight: 500 }}>Prize Won:</span>
                                                        {req.odPrize ? req.odPrize : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>}
                                                    </div>
                                                    {req.odCertificate ? (
                                                        <a href={req.odCertificate} download={`certificate_${req.registerNo}_${req.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', background: '#ecfdf5', color: '#059669', borderRadius: '6px', textDecoration: 'none', width: 'fit-content' }}>
                                                            <i className="fas fa-link" /> View Certificate
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No cert uploaded</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {filter === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'approved')}
                                                            style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', transition: 'transform 0.1s' }}
                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            title="Approve for HOD"
                                                        >
                                                            <i className="fas fa-check" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'rejected')}
                                                            style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', transition: 'transform 0.1s' }}
                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            title="Reject Request"
                                                        >
                                                            <i className="fas fa-times" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
                                                        background: req.checkerStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                                                        color: req.checkerStatus === 'approved' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {req.checkerStatus === 'approved' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Team Modal */}
            {teamModalId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }} onClick={() => setTeamModalId(null)}>
                    <div style={{ background: '#fff', borderRadius: '1rem', width: '90%', maxWidth: '500px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Team Members</h3>
                            <button onClick={() => setTeamModalId(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                            {parseEventDetails(filteredReqs.find(r => r.id === teamModalId)?.reason || '').teamString}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ODChecker;
