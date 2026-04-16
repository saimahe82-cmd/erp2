import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '1.5rem',
            color: 'var(--muted-fg)',
            fontSize: '0.875rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
        }}>
            <p>&copy; {new Date().getFullYear()} Nandha Engineering College. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
