import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';

const Sidebar = ({ user, logout, showApplyMenu, setShowApplyMenu, showProfile, setShowProfile, activeNav }) => {
    const location = useLocation();

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const s = {
        sidebar: {
            width: '272px', background: 'linear-gradient(195deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed',
            top: 0, left: 0, bottom: 0, zIndex: 50, padding: '0',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        },
        sidebarTop: {
            padding: '1.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        },
        brand: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
        brandIcon: {
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        },
        brandText: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' },
        brandSub: { fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' },
        navSection: { padding: '1.5rem 1rem', flex: 1 },
        navLabel: {
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)',
            padding: '0 0.75rem', marginBottom: '0.75rem',
        },
        navItem: (active) => ({
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.75rem 1rem', borderRadius: '0.625rem',
            color: active ? '#fff' : 'rgba(255,255,255,0.55)',
            background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
            border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.875rem',
            fontWeight: active ? 600 : 400, textDecoration: 'none', marginBottom: '0.25rem',
            position: 'relative',
        }),
        navSubItem: (active) => ({
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.625rem 1rem 0.625rem 2.75rem', borderRadius: '0.625rem',
            color: active ? '#fff' : 'rgba(255,255,255,0.45)',
            background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.8125rem',
            fontWeight: active ? 600 : 400, textDecoration: 'none', marginBottom: '0.125rem',
        }),
        navIcon: (active) => ({ fontSize: '1rem', width: '20px', textAlign: 'center', color: active ? '#818cf8' : 'inherit' }),
        profileBox: {
            margin: '0 1rem 1.5rem', padding: '1rem', borderRadius: '0.75rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        },
        avatar: {
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
        },
    };

    return (
        <aside style={s.sidebar}>
            <div style={s.sidebarTop}>
                <div style={{ ...s.brand, padding: '0.5rem 0' }}>
                    <img src={logo} alt="NEC Logo" style={{ width: '45px' }} />
                    <div>
                        <div style={{ ...s.brandText, fontSize: '0.95rem', lineHeight: 1.1 }}>Nandha Engineering College</div>
                        <div style={s.brandSub}>{user?.role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}</div>
                    </div>
                </div>
            </div>

            <div style={s.navSection}>
                <div style={s.navLabel}>Menu</div>
                <Link to="/student-dashboard"
                    style={s.navItem(location.pathname === '/student-dashboard' && !location.search.includes('view=details'))}>
                    <i className="fas fa-th-large" style={s.navIcon(location.pathname === '/student-dashboard' && !location.search.includes('view=details'))}></i>
                    <span>Dashboard</span>
                </Link>

                <div style={s.navItem(showApplyMenu)} onClick={() => setShowApplyMenu(!showApplyMenu)}>
                    <i className="fas fa-paper-plane" style={s.navIcon(showApplyMenu)}></i>
                    <span>Apply</span>
                    <i className={`fas fa-chevron-${showApplyMenu ? 'up' : 'down'}`} style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.5 }}></i>
                </div>

                {showApplyMenu && (
                    <div style={{ marginBottom: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                        <Link to="/apply-leave" style={s.navSubItem(location.pathname === '/apply-leave')}>
                            <i className="fas fa-file-medical" style={{ fontSize: '0.8rem', opacity: 0.7 }}></i>
                            <span>Leave Application</span>
                        </Link>
                        <Link to="/apply-od" style={s.navSubItem(location.pathname === '/apply-od')}>
                            <i className="fas fa-briefcase" style={{ fontSize: '0.8rem', opacity: 0.7 }}></i>
                            <span>OD Application</span>
                        </Link>
                    </div>
                )}

                <Link to="/student-dashboard?view=project" style={s.navItem(location.search.includes('view=project'))}>
                    <i className="fas fa-project-diagram" style={s.navIcon(location.search.includes('view=project'))}></i>
                    <span>My Project</span>
                </Link>

                <div style={{ ...s.navLabel, marginTop: '2rem' }}>Account</div>
                <Link to="/student-dashboard?view=details" style={s.navItem(location.search.includes('view=details'))}>
                    <i className="fas fa-id-card" style={s.navIcon(location.search.includes('view=details'))}></i>
                    <span>My Details</span>
                </Link>
                <div style={{ ...s.navItem(false), color: '#f87171' }} onClick={logout}>
                    <i className="fas fa-arrow-right-from-bracket" style={{ ...s.navIcon(false), color: '#f87171' }}></i>
                    <span>Sign Out</span>
                </div>
            </div>

            {/* Sidebar Profile Card */}
            <div style={s.profileBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={s.avatar}>
                        <img src={logo} alt="User Icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            {user?.registerNo || user?.email}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
