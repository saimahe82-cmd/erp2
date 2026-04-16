import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showApplyMenu, setShowApplyMenu] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const s = {
        page: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, sans-serif" },
        main: { marginLeft: '272px', flex: 1, padding: '0', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
        content: { padding: '2rem 2.5rem', flex: 1 },
    };

    return (
        <div style={s.page}>
            <Sidebar
                user={user}
                logout={handleLogout}
                showApplyMenu={showApplyMenu}
                setShowApplyMenu={setShowApplyMenu}
                showProfile={showProfile}
                setShowProfile={setShowProfile}
            />
            <main style={s.main}>
                <div style={s.content}>
                    <Outlet context={{ showProfile, setShowProfile }} />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
