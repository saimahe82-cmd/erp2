import { Link } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';

const Header = () => {
    return (
        <header style={{
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '40px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)', lineHeight: 1.1 }}>Nandha Engineering College</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-fg)', letterSpacing: '0.05em' }}>LEAVE SYSTEM</span>
                </div>
            </Link>
        </header>
    );
};

export default Header;
