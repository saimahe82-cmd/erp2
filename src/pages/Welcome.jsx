import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';

const Welcome = () => {
    return (
        <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <img src={logo} alt="NEC Logo" style={{ height: '120px', marginBottom: '1.5rem' }} />
            <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nandha Engineering College</h1>
            <p className="subtitle" style={{ fontSize: '1.25rem', color: 'var(--muted-fg)', fontWeight: 500 }}>Nandha Engineering College</p>
            <div className="cards">
                <Link to="/student-login" className="card">
                    <i className="fas fa-user-graduate"></i>
                    <h2>Student</h2>
                    <span>Portal for student leave requests</span>
                </Link>
                <Link to="/staff" className="card">
                    <i className="fas fa-users-gear"></i>
                    <h2>Staff</h2>
                    <span>Faculty & Administration access</span>
                </Link>
            </div>
        </div>
    );
};

export default Welcome;
