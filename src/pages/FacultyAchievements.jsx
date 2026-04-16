import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import rndService from '../services/rndService';

const FacultyAchievements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = () => {
            const data = rndService.getMyRndRequests();
            setAchievements(data);
            setLoading(false);
        };
        fetchAchievements();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    const getActivityIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'journal': return '📚';
            case 'conference': return '🎤';
            case 'patent': return '💡';
            case 'book': return '📖';
            case 'funding': return '💰';
            case 'workshop': return '🏫';
            default: return '🏆';
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
                padding: '2rem',
                borderRadius: '1.25rem',
                color: '#fff',
                marginBottom: '2rem',
                boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.3)',
                position: 'relative'
            }}>
                <button
                    onClick={() => navigate('/faculty-dashboard')}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '2rem',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Back to Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <img src={logo} alt="NEC Logo" style={{ height: '60px', filter: 'brightness(0) invert(1)' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Nandha Engineering College</h1>
                        <p style={{ margin: '0.25rem 0 0', opacity: 0.9, fontWeight: 600, letterSpacing: '0.05em' }}>MY ACHIEVEMENTS</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        Loading your achievements...
                    </div>
                ) : achievements.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem',
                        background: '#fff',
                        borderRadius: '1.25rem',
                        border: '2px dashed #e2e8f0',
                        color: '#64748b'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>No achievements found</h3>
                        <p>Submit your R&D activities to see them listed here.</p>
                        <button
                            onClick={() => navigate('/rnd-submission')}
                            style={{
                                marginTop: '1.5rem',
                                background: '#0ea5e9',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            + Submit R&D Now
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {achievements.map((item, idx) => (
                            <div key={idx} style={{
                                background: '#fff',
                                borderRadius: '1.25rem',
                                padding: '1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                border: '1px solid #f1f5f9',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '0.75rem',
                                        background: '#f0f9ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem'
                                    }}>
                                        {getActivityIcon(item.activityType)}
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        background: `${getStatusColor(item.hodStatus)}15`,
                                        color: getStatusColor(item.hodStatus),
                                        border: `1px solid ${getStatusColor(item.hodStatus)}30`
                                    }}>
                                        {item.hodStatus || 'Pending'}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.4 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem' }}>{item.domain}</p>

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Activity Type</span>
                                        <span style={{ fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{item.activityType}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Submitted On</span>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>
                                            {new Date(item.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FacultyAchievements;
