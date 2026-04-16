import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StudentAnalysis.css';

const StudentAnalysis = ({ targetEmail, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch target user if from faculty dashboard
    const _db = JSON.parse(localStorage.getItem('stu_app_users') || '[]');
    const targetUser = targetEmail ? _db.find(u => u.email === targetEmail && u.role === 'student') : user;

    const [view, setView] = useState('landing'); // landing, loading, result
    const [loadingMsg, setLoadingMsg] = useState('');
    const [analysis, setAnalysis] = useState(null);

    // Mock AI Analysis Generator
    const generateAnalysis = () => {
        // Fetch User Data from LocalStorage
        const email = targetUser?.email?.toLowerCase();
        let extra = {}, projects = [];
        try {
            extra = JSON.parse(localStorage.getItem(`stu_extra_${email}`) || '{}');
            const storedProjs = localStorage.getItem(`stu_project_${email}`);
            if (storedProjs) {
                const parsed = JSON.parse(storedProjs);
                projects = Array.isArray(parsed) ? parsed : (parsed.name ? [parsed] : []);
            }
        } catch (e) {
            console.error("Error reading data for analysis", e);
        }

        const cgpa = parseFloat(extra.cgpa) || 0;
        const attendance = parseInt(extra.attendance) || 0;
        const internships = extra.internships || [];
        const publications = extra.publications || [];
        const certs = extra.certifications || { nptel: [], others: [] };

        // 1. Calculate Score
        let score = 50;
        if (cgpa > 0) score += (cgpa / 10) * 20;
        if (attendance > 0) score += (attendance / 100) * 10;
        score += Math.min(10, internships.length * 5);
        score += Math.min(10, projects.length * 5);

        let gradeStr = 'A+';
        if (score < 60) gradeStr = 'B';
        else if (score < 75) gradeStr = 'A';
        else if (score < 90) gradeStr = 'A+';
        else gradeStr = 'O';

        // 2. Determine Strengths
        const strengths = [];
        if (cgpa >= 8.5) strengths.push("Exceptional Academic Standing (CGPA > 8.5)");
        if (projects.length >= 2) strengths.push("Strong Hands-on Developer (Multiple Projects)");
        if (internships.length > 0) strengths.push("Proven Industry Experience & Exposure");
        if (publications.length > 0) strengths.push("Excellent Research & Academic Writing Skills");
        if ((certs.nptel?.length || 0) > 0) strengths.push("Proactive Continuous Learner (NPTEL Certified)");
        if (strengths.length === 0) strengths.push("Building foundational knowledge and exploring opportunities.");

        // 3. Determine Improvements
        const improvements = [];
        if (attendance < 80 && attendance > 0) improvements.push("Boost your attendance to ensure you don't miss core concepts.");
        if (projects.length === 0) improvements.push("Start building practical projects to apply your theoretical knowledge.");
        if (internships.length === 0) improvements.push("Seek out internships to gain real-world industry experience.");
        if (cgpa > 0 && cgpa < 7.0) improvements.push("Dedicate more time to core curriculum to improve academic standing.");
        if (improvements.length === 0) improvements.push("Consistently maintain your excellent performance trajectory!");

        // 4. Extract Interests based on keywords in projects/certs
        const keywords = {
            'AI': false, 'Machine Learning': false, 'Web': false, 'Cloud': false,
            'Data': false, 'Security': false, 'Hardware': false, 'IoT': false
        };

        const scanText = text => {
            if (!text) return;
            const t = text.toLowerCase();
            if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('machine learning')) keywords['AI & Machine Learning'] = true;
            if (t.includes('web') || t.includes('react') || t.includes('frontend') || t.includes('fullstack')) keywords['Web Development'] = true;
            if (t.includes('cloud') || t.includes('aws') || t.includes('azure')) keywords['Cloud Computing'] = true;
            if (t.includes('data') || t.includes('analytics')) keywords['Data Science'] = true;
            if (t.includes('hack') || t.includes('security') || t.includes('cyber')) keywords['Cybersecurity'] = true;
            if (t.includes('iot') || t.includes('internet of things') || t.includes('hardware')) keywords['IoT & Hardware'] = true;
        };

        projects.forEach(p => { scanText(p.name); scanText(p.domain); });
        (certs.nptel || []).forEach(c => scanText(c.title));
        (certs.others || []).forEach(c => scanText(c.title));

        const interests = Object.keys(keywords).filter(k => keywords[k]);
        if (interests.length === 0) {
            interests.push("Software Engineering");
            interests.push("Computer Science");
        }

        setAnalysis({ cgpa, attendance, projCount: projects.length, score: Math.round(score), gradeStr, strengths, improvements, interests });
    };

    const handleAnalyze = () => {
        setView('loading');

        const msgs = [
            "Initializing Nexus AI Core...",
            "Scanning Student Database...",
            "Evaluating Academic Records...",
            "Analyzing Project Repositories...",
            "Synthesizing Skill Matrices...",
            "Finalizing Comprehensive Profile..."
        ];

        let i = 0;
        setLoadingMsg(msgs[0]);

        const interval = setInterval(() => {
            i++;
            if (i < msgs.length) {
                setLoadingMsg(msgs[i]);
            } else {
                clearInterval(interval);
                generateAnalysis();
                setView('result');
            }
        }, 800);
    };

    if (view === 'loading') {
        return (
            <div className="analysis-container">
                <div className="ambient-orb orb-1"></div>
                <div className="ambient-orb orb-2"></div>

                <div className="loading-view">
                    <div className="radar-container">
                        <div className="radar-grid"></div>
                        <div className="radar-scanner"></div>
                        <div className="radar-core"></div>
                    </div>
                    <div className="loading-text">{loadingMsg}</div>
                </div>
            </div>
        );
    }

    if (view === 'result' && analysis) {
        return (
            <div className="analysis-container" style={{ overflowY: 'auto' }}>
                <div className="ambient-orb orb-1"></div>
                <div className="ambient-orb orb-3"></div>

                <div className="content-wrapper">
                    <nav className="analysis-nav">
                        <button className="back-btn" onClick={() => onClose ? onClose() : navigate('/student-dashboard')}>
                            <i className="fas fa-arrow-left"></i> {onClose ? 'Back to Profile' : 'Back to Dashboard'}
                        </button>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f8fafc', letterSpacing: '2px' }}>NEXUS AI</div>
                    </nav>

                    <div className="result-view">
                        <div className="result-header">
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>Analysis Complete</h1>
                            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem' }}>Personalized insights for {targetUser?.name}</p>

                            <div className="grade-badge">
                                <span className="grade-score">{analysis.gradeStr}</span>
                                <span className="grade-label">Overall Profile Grade</span>
                            </div>
                        </div>

                        <div className="analysis-grid">

                            {/* Profile Metrics */}
                            <div className="glass-card">
                                <h3 className="card-title"><i className="fas fa-chart-pie" style={{ color: '#3b82f6' }}></i> Core Metrics</h3>

                                <div className="progress-item">
                                    <div className="progress-header"><span>Academic CGPA</span> <span>{analysis.cgpa || 0} / 10</span></div>
                                    <div className="progress-track"><div className="progress-fill" style={{ width: `${(analysis.cgpa / 10) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div></div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header"><span>Attendance</span> <span>{analysis.attendance || 0}%</span></div>
                                    <div className="progress-track"><div className="progress-fill" style={{ width: `${analysis.attendance}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}></div></div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header"><span>Project Volume</span> <span>{analysis.projCount}</span></div>
                                    <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, analysis.projCount * 20)}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}></div></div>
                                </div>
                                <div className="progress-item" style={{ marginTop: '2rem' }}>
                                    <div className="progress-header" style={{ color: '#fde047' }}><span>Overall AI Score</span> <span>{analysis.score} / 100</span></div>
                                    <div className="progress-track" style={{ height: '12px' }}><div className="progress-fill" style={{ width: `${analysis.score}%`, background: 'linear-gradient(90deg, #f59e0b, #fde047)' }}></div></div>
                                </div>
                            </div>

                            {/* Strengths & Improvements */}
                            <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                                    <div>
                                        <h3 className="card-title"><i className="fas fa-bolt" style={{ color: '#10b981' }}></i> Key Strengths</h3>
                                        <div className="trait-list">
                                            {analysis.strengths.slice(0, 4).map((str, idx) => (
                                                <div className="trait-item" key={idx}>
                                                    <div className="trait-icon strength-icon"><i className="fas fa-check"></i></div>
                                                    <div className="trait-text">{str}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="card-title"><i className="fas fa-arrow-trend-up" style={{ color: '#f59e0b' }}></i> Growth Areas</h3>
                                        <div className="trait-list">
                                            {analysis.improvements.slice(0, 4).map((imp, idx) => (
                                                <div className="trait-item" key={idx}>
                                                    <div className="trait-icon improve-icon"><i className="fas fa-lightbulb"></i></div>
                                                    <div className="trait-text">{imp}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Interests */}
                            <div className="glass-card" style={{ gridColumn: 'span 3' }}>
                                <h3 className="card-title"><i className="fas fa-brain" style={{ color: '#a855f7' }}></i> Detected Strong Interests</h3>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>Based on keyword analysis of your projects, certifications, and activities.</p>
                                <div className="badges-container">
                                    {analysis.interests.map((interest, idx) => (
                                        <div className="interest-badge" key={idx}>
                                            <i className="fas fa-hashtag" style={{ opacity: 0.5 }}></i> {interest}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="analysis-container">
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>

            <div className="content-wrapper">
                <nav className="analysis-nav">
                    <button className="back-btn" onClick={() => onClose ? onClose() : navigate('/student-dashboard')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fas fa-arrow-left"></i> {onClose ? 'Back to Profile' : 'Back to Dashboard'}
                    </button>
                </nav>

                <div className="landing-view">
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
                            <i className="fas fa-brain" style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
                        </div>
                    </div>
                    <h1 className="title-main">Discover Your<br />True Potential</h1>
                    <p className="subtitle">
                        Initiate our advanced AI analysis sequence. We will intelligently map your academic performance, project contributions, and extracurricular achievements to visualize your unique career path.
                    </p>
                    <button className="analyze-btn" onClick={handleAnalyze}>
                        Analyze My Profile <i className="fas fa-rocket"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalysis;
