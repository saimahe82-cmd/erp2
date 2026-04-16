import React from 'react';
import { Link } from 'react-router-dom';

const StaffSelection = () => {
    return (
        <div className="container">
            <Link to="/" className="back"><i className="fas fa-arrow-left"></i> Back to Home</Link>
            <h1>Staff Portal</h1>
            <p className="subtitle">Select your administrative role</p>
            <div className="cards">
                <Link to="/faculty-login" className="card">
                    <i className="fas fa-chalkboard-user"></i>
                    <h2>Faculty</h2>
                    <span>Teaching staff portal</span>
                </Link>
                <Link to="/hod-login" className="card">
                    <i className="fas fa-user-tie"></i>
                    <h2>HOD</h2>
                    <span>Head of Department access</span>
                </Link>
            </div>
        </div>
    );
};

export default StaffSelection;
