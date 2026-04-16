import React from 'react';

const Topbar = ({ user }) => {
    const s = {
        topBar: {
            background: '#fff', borderBottom: '1px solid #e2e8f0',
            padding: '1.25rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255,255,255,0.85)',
        },
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    };

    return (
        <div style={s.topBar}>
            <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                    Good {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
                    Here's an overview of your activity
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b',
                }}>
                    <i className="fas fa-calendar-day"></i>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{
                    padding: '0.5rem 0.875rem', borderRadius: '0.5rem',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    fontSize: '0.8rem', fontWeight: 500, color: '#6366f1',
                }}>
                    {user?.department || 'CSE'} · {user?.role === 'student' ? `Year ${user?.year || 'III'}` : (user?.subject || 'Faculty')}
                </div>
            </div>
        </div>
    );
};

export default Topbar;
