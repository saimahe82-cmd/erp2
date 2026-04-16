import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import logo from '../assets/nec-logo.jpeg';
import './FacultyDashboard.css';
import db from '../services/api';
import videoStorage from '../services/videoStorage';
import AddStudentModal from '../components/AddStudentModal';
import ActionModal from '../components/ActionModal';
import { jsPDF } from 'jspdf';
import StudentAnalysis from './StudentAnalysis';

/* ─────────────────────────────────────────────────────────────
   HELPERS & DATA
───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   LOCAL STORAGE HELPERS
───────────────────────────────────────────────────────────── */
const emptyExtra = () => ({
    phone: '', bloodGroup: '', address: '', parentName: '', parentPhone: '',
    fatherName: '', fatherPhone: '', fatherOccupation: '', fatherIncome: '',
    motherName: '', motherPhone: '', motherOccupation: '', motherIncome: '',
    siblings: [],
    caste: '', community: '',
    sslcSchool: '', sslcPlace: '', sslcGained: '', sslcTotal: '',
    hscSchool: '', hscPlace: '', hscGained: '', hscTotal: '',
    diplomaSchool: '', diplomaPlace: '', diplomaGained: '', diplomaTotal: '', diplomaApplicable: false,
    currentSemester: '',
    semesterGPAs: {
        sem1: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem2: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem3: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem4: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem5: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem6: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem7: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' },
        sem8: { gpa: '', courses: [], labCourses: [], marksheet: null, marksheetName: '' }
    },
    cgpa: '', attendance: '', section: '', notes: '',
    events: [], internships: [], publications: [],
    certifications: { nptel: [], pattern: [], vertical: [], others: [] },
    gender: '',
});

const getExtra = (email) => {
    try {
        const r = localStorage.getItem(`stu_extra_${email}`);
        return r ? { ...emptyExtra(), ...JSON.parse(r) } : emptyExtra();
    } catch { return emptyExtra(); }
};
const saveExtra = (email, data) => localStorage.setItem(`stu_extra_${email}`, JSON.stringify(data));

/* ─────────────────────────────────────────────────────────────
   TINY HELPERS
───────────────────────────────────────────────────────────── */
const attColor = v => v >= 90 ? '#10b981' : v >= 75 ? '#f59e0b' : '#ef4444';
const attBg = v => v >= 90 ? '#f0fdf4' : v >= 75 ? '#fffbeb' : '#fef2f2';

/* ─────────────────────────────────────────────────────────────
   SLIDE NAVIGATION DRAWER
───────────────────────────────────────────────────────────── */
const NavDrawer = ({ isOpen, onClose, facultyData, onLogout, navigate, onTrackHistory }) => {
    const drawerRef = useRef(null);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const navItems = [
        {
            section: 'My Activities',
            items: [
                {
                    icon: '🏆', iconBg: '#fef3c7', iconColor: '#92400e',
                    label: 'My Achievements',
                    desc: 'Internships, publications & certifications',
                    onClick: () => { onClose(); navigate('/faculty-achievements'); },
                },
                {
                    icon: '📅', iconBg: '#f0f9ff', iconColor: '#0369a1',
                    label: 'Leave / OD',
                    desc: 'Apply and track your leave requests',
                    onClick: () => { onClose(); navigate('/faculty-leave-application'); },
                },
                {
                    icon: '🔬', iconBg: '#faf5ff', iconColor: '#6d28d9',
                    label: 'R&D Submissions',
                    desc: 'Submit and view research proposals',
                    onClick: () => { onClose(); navigate('/rnd-submission'); },
                },
                {
                    icon: '👥', iconBg: '#ecfdf5', iconColor: '#059669',
                    label: 'My Mentees',
                    desc: 'View projects submitted by your mentees',
                    onClick: () => { onClose(); window.dispatchEvent(new CustomEvent('open-mentees')); },
                },
                {
                    icon: '📋', iconBg: '#ecfdf5', iconColor: '#059669',
                    label: 'Track Leave History',
                    desc: 'View student absence records by date & section',
                    onClick: () => { onClose(); onTrackHistory(); },
                },
            ],
        },
    ];

    return (
        <>
            <div className="nav-drawer-overlay" onClick={onClose} />
            <div className="nav-drawer" ref={drawerRef}>
                {/* Header */}
                <div className="nav-drawer-header" style={{ position: 'relative' }}>
                    <button className="nav-drawer-close" onClick={onClose}>✕</button>
                    <div className="nav-drawer-avatar">{facultyData.avatar}</div>
                    <p className="nav-drawer-name">{facultyData.name}</p>
                    <p className="nav-drawer-sub">{facultyData.subject} &nbsp;•&nbsp; {facultyData.email}</p>
                </div>

                {/* Nav items */}
                <div className="nav-drawer-body">
                    {navItems.map(group => (
                        <div key={group.section}>
                            <p className="nav-drawer-section">{group.section}</p>
                            {group.items.map(item => (
                                <button key={item.label} className="nav-drawer-item" onClick={item.onClick}>
                                    <div className="nav-drawer-icon" style={{ background: item.iconBg }}>
                                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                    </div>
                                    <div>
                                        <p className="nav-drawer-label">{item.label}</p>
                                        <p className="nav-drawer-desc">{item.desc}</p>
                                    </div>
                                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div className="nav-drawer-logout">
                    <button className="nav-drawer-logout-btn" onClick={() => { onClose(); onLogout(); }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '.625rem', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '.875rem', fontWeight: 700, color: '#ef4444' }}>Logout</p>
                            <p style={{ margin: '.1rem 0 0', fontSize: '.72rem', color: '#f87171' }}>Sign out of Faculty Portal</p>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────
   EDITABLE FIELD COMPONENTS
───────────────────────────────────────────────────────────── */
const EField = ({ label, value, onChange, editing, type = 'text', placeholder = '', options = null }) => (
    <div>
        <label className="sd-label">{label}</label>
        {editing
            ? options ? (
                <select className="sd-input" value={value || ''} onChange={e => onChange(e.target.value)}>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            ) : <input className="sd-input" type={type} value={value || ''} placeholder={placeholder || label} onChange={e => onChange(e.target.value)} />
            : <div className="sd-info-box"><p className="sd-info-value">{value || <span style={{ color: '#cbd5e1' }}>—</span>}</p></div>
        }
    </div>
);

const ETextArea = ({ label, value, onChange, editing }) => (
    <div>
        <label className="sd-label">{label}</label>
        {editing
            ? <textarea className="sd-input" rows={3} value={value || ''} onChange={e => onChange(e.target.value)} style={{ resize: 'vertical' }} />
            : <div className="sd-info-box"><p className="sd-info-value" style={{ whiteSpace: 'pre-wrap' }}>{value || <span style={{ color: '#cbd5e1' }}>—</span>}</p></div>
        }
    </div>
);

/* ─────────────────────────────────────────────────────────────
   VIEW-ONLY LIST — displays student-submitted data
───────────────────────────────────────────────────────────── */
const ViewList = ({ items, fields, emptyText, titleField }) => {
    if (!items || !Array.isArray(items) || items.length === 0) return <div className="sd-empty">{emptyText}</div>;
    return (
        <div>
            {items.map((item, idx) => {
                if (!item || typeof item !== 'object') return null;
                return (
                    <div key={idx} className="sd-view-item">
                        {titleField && (item[titleField] !== undefined && item[titleField] !== null && item[titleField] !== '') && (
                            <p style={{ margin: '0 0 .3rem', fontWeight: 700, color: '#1e293b', fontSize: '.88rem', lineHeight: 1.4 }}>
                                {item[titleField]}
                            </p>
                        )}
                        <div className="sd-view-row">
                            {fields.filter(f => f.key !== titleField && item[f.key] !== undefined && item[f.key] !== null && item[f.key] !== '').map(f => (
                                <span key={f.key} className="sd-view-chip">
                                    <span className="sd-view-chip-label">{f.label}</span>
                                    <span className="sd-view-chip-val">
                                        {f.type === 'image' && typeof item[f.key] === 'string' && item[f.key].startsWith('data:image') ? (
                                            <img src={item[f.key]} alt="Certificate" style={{ height: '80px', borderRadius: '4px', display: 'block', marginTop: '0.25rem' }} />
                                        ) : f.type === 'link' && typeof item[f.key] === 'string' && (item[f.key].startsWith('http') || item[f.key].startsWith('www')) ? (
                                            <a href={item[f.key].startsWith('http') ? item[f.key] : 'https://' + item[f.key]} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
                                                View Certificate
                                            </a>
                                        ) : (
                                            item[f.key]
                                        )}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   LEAVE SUMMARY
───────────────────────────────────────────────────────────── */
const LeaveSummary = ({ studentEmail }) => {
    const all = leaveService.getAllRequests().filter(r => r.studentEmail === studentEmail);
    const approved = all.filter(r => r.facultyStatus === 'approved' || r.hodStatus === 'approved');
    const leaves = approved.filter(r => r.type?.toLowerCase().includes('leave'));
    const ods = approved.filter(r => r.type?.toLowerCase().includes('od') || r.type?.toLowerCase().includes('on duty'));
    const pending = all.filter(r => r.facultyStatus === 'pending');
    const rejected = all.filter(r => r.facultyStatus === 'rejected');

    const countDays = list => list.reduce((sum, r) => {
        if (!r.fromDate || !r.toDate) return sum + 1;
        const d = Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1;
        return sum + (d > 0 ? d : 1);
    }, 0);

    return (
        <div>
            <div className="sd-grid2" style={{ marginBottom: '.875rem' }}>
                {[
                    { label: 'Leave Days Taken', val: countDays(leaves), color: '#f59e0b', bg: '#fffbeb', icon: '🏖️' },
                    { label: 'OD Days Taken', val: countDays(ods), color: '#8b5cf6', bg: '#faf5ff', icon: '🔬' },
                    { label: 'Pending Requests', val: pending.length, color: '#0ea5e9', bg: '#f0f9ff', icon: '⏳' },
                    { label: 'Rejected', val: rejected.length, color: '#ef4444', bg: '#fef2f2', icon: '❌' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '.75rem', padding: '.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
                        <div style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 600, marginTop: '.2rem' }}>{s.label}</div>
                    </div>
                ))}
            </div>
            {all.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Type', 'From', 'To', 'Reason', 'Faculty', 'HOD', 'Days'].map(h => (
                                    <th key={h} style={{ padding: '.4rem .55rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {all.map((r, i) => {
                                const days = r.fromDate && r.toDate ? Math.max(1, Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1) : 1;
                                const isOd = r.type?.toLowerCase().includes('od') || r.type?.toLowerCase().includes('on duty');
                                const fc = r.facultyStatus;
                                const hc = r.hodStatus || '—';
                                const sc = s => s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : s === 'pending' ? '#f59e0b' : '#94a3b8';
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '.35rem .55rem' }}>
                                            <span style={{ background: isOd ? '#ede9fe' : '#fef9c3', color: isOd ? '#7c3aed' : '#854d0e', borderRadius: '4px', padding: '2px 6px', fontSize: '.7rem', fontWeight: 600 }}>{r.type}</span>
                                        </td>
                                        <td style={{ padding: '.35rem .55rem', color: '#475569', whiteSpace: 'nowrap' }}>{r.fromDate ? new Date(r.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                                        <td style={{ padding: '.35rem .55rem', color: '#475569', whiteSpace: 'nowrap' }}>{r.toDate ? new Date(r.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                                        <td style={{ padding: '.35rem .55rem', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                                        <td style={{ padding: '.35rem .55rem' }}><span style={{ color: sc(fc), fontWeight: 700, textTransform: 'capitalize', fontSize: '.72rem' }}>{fc}</span></td>
                                        <td style={{ padding: '.35rem .55rem' }}><span style={{ color: sc(hc), fontWeight: 700, textTransform: 'capitalize', fontSize: '.72rem' }}>{hc}</span></td>
                                        <td style={{ padding: '.35rem .55rem', color: '#1e293b', fontWeight: 700 }}>{days}d</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="sd-empty">No leave or OD requests found for this student.</div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   PER-STUDENT PDF GENERATOR
───────────────────────────────────────────────────────────── */
const generateStudentPDF = (studentEmail) => {
    const su = db.getUsers().find(u => u.email === studentEmail && u.role === 'student');
    const ex = su ? getExtra(su.email) : emptyExtra();
    const allLeave = su ? leaveService.getAllRequests().filter(r => r.studentEmail === su.email) : [];

    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, ML = 14, MR = 196;
    let y = 0;

    doc.setFillColor(30, 64, 175); doc.rect(0, 0, W, 36, 'F');
    doc.setFillColor(14, 165, 233); doc.rect(0, 30, W, 8, 'F');
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.8);
    doc.circle(23, 18, 9, 'D');
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    const studentDisplay = su?.name || studentEmail;
    doc.text(studentDisplay.charAt(0).toUpperCase(), 23, 22, { align: 'center' });
    doc.setFontSize(15); doc.text(studentDisplay, 36, 13);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text([su?.registerNo, su?.department, `${su?.year || '—'} Year`, `Sec ${su?.section || ex.section || '—'}`].filter(Boolean).join('  •  '), 36, 20);
    doc.text(su?.email || 'N/A', 36, 26);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('STUDENT PROFILE REPORT', W / 2, 35, { align: 'center' });
    y = 46;

    const checkPage = (needed = 20) => { if (y + needed > 282) { doc.addPage(); y = 14; } };

    const sectionBar = (title, rgb) => {
        checkPage(14);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]); doc.rect(ML, y, MR - ML, 6.5, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(title, ML + 3, y + 4.5);
        y += 10; doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'normal');
    };

    const fieldRow3 = (pairs) => {
        const cW = (MR - ML) / 3;
        pairs.forEach(({ label, value }, i) => {
            const x = ML + i * cW;
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
            doc.text(String(label).toUpperCase(), x, y);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
            doc.text(String(value || '—').substring(0, 34), x, y + 4.5);
        });
        y += 10;
    };

    const textBlock = (label, value) => {
        if (!value) return;
        checkPage(14);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(String(label).toUpperCase(), ML, y);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(String(value), MR - ML);
        doc.text(lines, ML, y + 4.5);
        y += 4.5 + lines.length * 4 + 4;
    };

    sectionBar('ACADEMIC & PERSONAL INFORMATION', [30, 64, 175]);
    fieldRow3([{ label: 'Register No', value: su?.registerNo }, { label: 'Department', value: su?.department }, { label: 'Year', value: su?.year }]);
    fieldRow3([{ label: 'Section', value: su?.section || ex.section }, { label: 'CGPA', value: ex.cgpa }, { label: 'Attendance', value: ex.attendance ? `${ex.attendance}%` : '' }]);
    fieldRow3([{ label: 'Phone', value: ex.phone }, { label: 'Blood Group', value: ex.bloodGroup }, { label: 'Email', value: su?.email }]);
    fieldRow3([{ label: 'Caste', value: ex.caste }, { label: 'Community', value: ex.community }, { label: '', value: '' }]);

    sectionBar('FAMILY DETAILS', [16, 185, 129]);
    fieldRow3([{ label: "Father's Name", value: ex.fatherName }, { label: "Father's Phone", value: ex.fatherPhone }, { label: "Occupation", value: ex.fatherOccupation }]);
    fieldRow3([{ label: "Father's Income", value: ex.fatherIncome }, { label: "Mother's Name", value: ex.motherName }, { label: "Mother's Phone", value: ex.motherPhone }]);
    fieldRow3([{ label: "Mother's Occupation", value: ex.motherOccupation }, { label: "Mother's Income", value: ex.motherIncome }, { label: '', value: '' }]);

    if (ex.siblings && ex.siblings.length > 0) {
        checkPage(15);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text('SIBLINGS', ML, y); y += 4;
        ex.siblings.forEach(s => {
            checkPage(6);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
            doc.text(`• ${s.name} (${s.status}): ${s.detail}`, ML + 3, y);
            y += 5;
        });
        y += 2;
    }
    textBlock('Address', ex.address);

    sectionBar('SCHOOLING HISTORY', [245, 158, 11]);
    const sPct = (ex.sslcGained && ex.sslcTotal) ? ((ex.sslcGained / ex.sslcTotal) * 100).toFixed(2) : '—';
    const hPct = (ex.hscGained && ex.hscTotal) ? ((ex.hscGained / ex.hscTotal) * 100).toFixed(2) : '—';
    fieldRow3([{ label: 'SSLC School', value: ex.sslcSchool }, { label: 'SSLC Place', value: ex.sslcPlace }, { label: 'SSLC %', value: sPct !== '—' ? `${sPct}%` : '—' }]);
    fieldRow3([{ label: 'HSC School', value: ex.hscSchool }, { label: 'HSC Place', value: ex.hscPlace }, { label: 'HSC %', value: hPct !== '—' ? `${hPct}%` : '—' }]);
    if (ex.diplomaApplicable) {
        const dPct = (ex.diplomaGained && ex.diplomaTotal) ? ((ex.diplomaGained / ex.diplomaTotal) * 100).toFixed(2) : '—';
        fieldRow3([{ label: 'Diploma College', value: ex.diplomaSchool }, { label: 'Diploma Place', value: ex.diplomaPlace }, { label: 'Diploma %', value: dPct !== '—' ? `${dPct}%` : '—' }]);
    }

    const completedSemCount = (parseInt(ex.currentSemester) || 0) - 1;
    if (completedSemCount > 0) {
        sectionBar('DETAILED ACADEMIC PERFORMANCE', [139, 92, 246]);
        const roms = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        for (let i = 0; i < completedSemCount; i++) {
            const semKey = `sem${i + 1}`;
            const semData = ex.semesterGPAs?.[semKey] || { gpa: '—', courses: [] };
            const gpaVal = typeof semData === 'object' ? semData.gpa : semData;

            checkPage(15);
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
            doc.text(`SEMESTER ${roms[i]}   (GPA: ${gpaVal || '—'})`, ML, y);
            y += 5;

            // Theory Courses
            if (semData.courses && semData.courses.length > 0) {
                doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(71, 85, 105);
                doc.text('THEORY COURSES', ML, y); y += 4;

                doc.setFontSize(5.5); doc.setTextColor(148, 163, 184);
                const cols = [ML, ML + 18, ML + 52, ML + 80, ML + 102, ML + 120, ML + 140, ML + 160];
                const headers = ['CODE', 'COURSE NAME', 'FACULTY', 'CAT1', 'CAT2', 'INT.', 'GRADE'];
                headers.forEach((h, idx) => doc.text(h, cols[idx], y));
                y += 4;

                doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(30, 41, 59);
                semData.courses.forEach(c => {
                    checkPage(6);
                    doc.text(String(c.code || '—').substring(0, 12), cols[0], y);
                    doc.text(String(c.courseName || '—').substring(0, 18), cols[1], y);
                    doc.text(String(c.faculty || '—').substring(0, 18), cols[2], y);
                    doc.text(String(c.cat1 || '—'), cols[3], y);
                    doc.text(String(c.cat2 || '—'), cols[4], y);
                    doc.text(String(c.internal || '—'), cols[5], y);
                    doc.text(String(c.grade || '—'), cols[6], y);
                    y += 5;
                });
                y += 2;
            }

            // Lab Courses
            if (semData.labCourses && semData.labCourses.length > 0) {
                checkPage(12);
                doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(157, 23, 77);
                doc.text('LAB / PRACTICAL COURSES', ML, y); y += 4;

                doc.setFontSize(5.5); doc.setTextColor(148, 163, 184);
                const cols = [ML, ML + 20, ML + 60, ML + 100, ML + 130, ML + 155];
                const headers = ['CODE', 'COURSE NAME', 'FACULTY', 'INT.', 'GRADE'];
                headers.forEach((h, idx) => doc.text(h, cols[idx], y));
                y += 4;

                doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(30, 41, 59);
                semData.labCourses.forEach(c => {
                    checkPage(6);
                    doc.text(String(c.code || '—').substring(0, 12), cols[0], y);
                    doc.text(String(c.courseName || '—').substring(0, 22), cols[1], y);
                    doc.text(String(c.faculty || '—').substring(0, 22), cols[2], y);
                    doc.text(String(c.internal || '—'), cols[3], y);
                    doc.text(String(c.grade || '—'), cols[4], y);
                    y += 5;
                });
                y += 3;
            }

            if ((!semData.courses || semData.courses.length === 0) && (!semData.labCourses || semData.labCourses.length === 0)) {
                doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 184);
                doc.text('No detailed course records found.', ML + 5, y);
                y += 6;
            }
        }
    }

    textBlock('Faculty Notes / Remarks', ex.notes);

    checkPage(35);
    sectionBar('LEAVE & OD SUMMARY', [124, 58, 237]);
    const approved = allLeave.filter(r => r.facultyStatus === 'approved' || r.hodStatus === 'approved');
    const calcDays = list => list.reduce((s, r) => s + (!r.fromDate || !r.toDate ? 1 : Math.max(1, Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1)), 0);
    const leaveDays = calcDays(approved.filter(r => r.type?.toLowerCase().includes('leave')));
    const odDays = calcDays(approved.filter(r => r.type?.toLowerCase().includes('od') || r.type?.toLowerCase().includes('on duty')));

    const statBoxes = [
        { label: 'Leave Days', val: leaveDays, color: [245, 158, 11] },
        { label: 'OD Days', val: odDays, color: [139, 92, 246] },
        { label: 'Total Requests', val: allLeave.length, color: [14, 165, 233] },
        { label: 'Pending', val: allLeave.filter(r => r.facultyStatus === 'pending').length, color: [16, 185, 129] },
    ];
    const bW = (MR - ML) / statBoxes.length;
    statBoxes.forEach((s, i) => {
        const bx = ML + i * bW;
        doc.setFillColor(s.color[0], s.color[1], s.color[2]); doc.roundedRect(bx, y, bW - 2, 13, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(String(s.val), bx + (bW - 2) / 2, y + 7.5, { align: 'center' });
        doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
        doc.text(s.label, bx + (bW - 2) / 2, y + 11.5, { align: 'center' });
    });
    y += 17;

    if (allLeave.length > 0) {
        checkPage(18);
        const cols = [ML, ML + 26, ML + 52, ML + 78, ML + 120, ML + 141, ML + 162];
        const heads = ['Type', 'From', 'To', 'Reason', 'Faculty', 'HOD', 'Days'];
        doc.setFillColor(241, 245, 249); doc.rect(ML, y, MR - ML, 5.5, 'F');
        doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        heads.forEach((h, i) => doc.text(h, cols[i], y + 3.8));
        y += 6.5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        allLeave.slice(0, 20).forEach((r, idx) => {
            checkPage(7);
            if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(ML, y - 0.5, MR - ML, 6, 'F'); }
            doc.setTextColor(30, 41, 59);
            const days = r.fromDate && r.toDate ? Math.max(1, Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1) : 1;
            const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
            const fc = r.facultyStatus || '—';
            const hc = r.hodStatus || '—';
            const sc = s => s === 'approved' ? [16, 185, 129] : s === 'rejected' ? [239, 68, 68] : s === 'pending' ? [245, 158, 11] : [148, 163, 184];
            doc.text(String(r.type || '—').substring(0, 10), cols[0], y + 3.5);
            doc.text(fmt(r.fromDate), cols[1], y + 3.5);
            doc.text(fmt(r.toDate), cols[2], y + 3.5);
            doc.text(String(r.reason || '—').substring(0, 22), cols[3], y + 3.5);
            doc.setTextColor(...sc(fc)); doc.text(fc.charAt(0).toUpperCase() + fc.slice(1), cols[4], y + 3.5);
            doc.setTextColor(...sc(hc)); doc.text(hc.charAt(0).toUpperCase() + hc.slice(1), cols[5], y + 3.5);
            doc.setTextColor(30, 41, 59); doc.text(`${days}d`, cols[6], y + 3.5);
            y += 6;
        });
        y += 3;
    }

    const events = ex.events || [];
    if (events.length > 0) {
        checkPage(22);
        sectionBar('EVENTS / HACKATHONS  (Student Submitted)', [236, 72, 153]);
        events.forEach((ev, i) => {
            checkPage(22);
            doc.setFillColor(253, 242, 248); doc.setDrawColor(252, 207, 228); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, MR - ML, 18, 2, 2, 'FD');
            const evTitle = [ev.eventType || 'Event', ev.eventLevel && `(${ev.eventLevel})`].filter(Boolean).join(' ');
            doc.text(`${i + 1}.  ${evTitle} @ ${ev.place || 'Unknown Place'}`.substring(0, 72), ML + 3, y + 6);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.setFontSize(7);
            const dateStr = (ev.fromDate && ev.toDate) ? `${ev.fromDate} to ${ev.toDate}` : (ev.fromDate || ev.toDate || '');
            const meta = [dateStr && `Date: ${dateStr}`, ev.prize && `Prize: ${ev.prize}`, ev.certificate && `Link: Attached`].filter(Boolean).join('   |   ');
            doc.text(meta, ML + 3, y + 12);
            if (ev.certificate) { doc.setFontSize(6.5); doc.setTextColor(14, 165, 233); doc.text(`URL: ${String(ev.certificate).substring(0, 70)}`, ML + 3, y + 17); }
            y += ev.certificate ? 23 : 19;
        });
    }

    const internships = ex.internships || [];
    if (internships.length > 0) {
        checkPage(22);
        sectionBar('INTERNSHIPS  (Student Submitted)', [16, 185, 129]);
        internships.forEach((it, i) => {
            checkPage(22);
            const boxH = it.remarks ? 23 : 18;
            doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, MR - ML, boxH, 2, 2, 'FD');
            doc.setTextColor(6, 95, 70); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
            doc.text(`${i + 1}.  ${(it.company || 'N/A')}${it.role ? '  —  ' + it.role : ''}`.substring(0, 72), ML + 3, y + 6);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.setFontSize(7);
            const meta = [it.duration && `Duration: ${it.duration}`, it.year && `Year: ${it.year}`, it.stipend && `Stipend: ${it.stipend}`, it.mode && `Mode: ${it.mode}`].filter(Boolean).join('   |   ');
            doc.text(meta, ML + 3, y + 12);
            if (it.remarks) { doc.setFontSize(6.5); doc.setTextColor(100, 116, 139); doc.text(`Remarks: ${String(it.remarks).substring(0, 80)}`, ML + 3, y + 18); }
            y += boxH + 3;
        });
    }

    const publications = ex.publications || [];
    if (publications.length > 0) {
        checkPage(22);
        sectionBar('RESEARCH PUBLICATIONS  (Student Submitted)', [14, 165, 233]);
        publications.forEach((p, i) => {
            checkPage(26);
            const titleLines = doc.splitTextToSize(`${i + 1}.  ${p.title || 'Untitled'}`, MR - ML - 6);
            const extraLines = Math.max(0, titleLines.length - 1);
            const boxH = 18 + extraLines * 4 + (p.doi ? 5 : 0);
            doc.setFillColor(240, 249, 255); doc.setDrawColor(186, 230, 253); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, MR - ML, boxH, 2, 2, 'FD');
            doc.setTextColor(3, 105, 161); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
            doc.text(titleLines, ML + 3, y + 6);
            const afterTitle = y + 6 + extraLines * 4;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105); doc.setFontSize(7);
            const meta = [p.journal && `Journal: ${p.journal}`, p.type && `Type: ${p.type}`, p.year && `Year: ${p.year}`].filter(Boolean).join('   |   ');
            doc.text(meta, ML + 3, afterTitle + 5);
            if (p.doi) { doc.setFontSize(6.5); doc.setTextColor(14, 165, 233); doc.text(`DOI/URL: ${String(p.doi).substring(0, 70)}`, ML + 3, afterTitle + 10.5); }
            y += boxH + 3;
        });
    }

    const certCats = [
        { key: 'nptel', label: 'NPTEL COURSES', rgb: [249, 115, 22], bg: [255, 247, 237], bd: [254, 215, 170], titleKey: 'course', fields: [{ k: 'course', l: 'Course' }, { k: 'grade', l: 'Grade' }, { k: 'score', l: 'Score' }, { k: 'year', l: 'Year' }] },
        { key: 'pattern', label: 'PATTERN', rgb: [139, 92, 246], bg: [250, 245, 255], bd: [233, 213, 255], titleKey: 'name', fields: [{ k: 'name', l: 'Name' }, { k: 'level', l: 'Level' }, { k: 'score', l: 'Score' }, { k: 'year', l: 'Year' }] },
        { key: 'vertical', label: 'VERTICAL', rgb: [14, 165, 233], bg: [240, 249, 255], bd: [186, 230, 253], titleKey: 'skill', fields: [{ k: 'skill', l: 'Skill' }, { k: 'tech', l: 'Technologies' }, { k: 'status', l: 'Status' }, { k: 'year', l: 'Year' }] },
        { key: 'others', label: 'OTHER CERTIFICATIONS', rgb: [16, 185, 129], bg: [240, 253, 244], bd: [187, 247, 208], titleKey: 'name', fields: [{ k: 'name', l: 'Name' }, { k: 'issuer', l: 'Issuer' }, { k: 'year', l: 'Year' }, { k: 'id', l: 'ID/URL' }] },
    ];

    const hasCerts = certCats.some(c => (ex.certifications?.[c.key] || []).length > 0);
    if (hasCerts) {
        checkPage(18);
        sectionBar('CERTIFICATIONS  (Student Submitted)', [245, 158, 11]);
        certCats.forEach(cat => {
            const items = ex.certifications?.[cat.key] || [];
            if (!items.length) return;
            checkPage(14);
            doc.setFillColor(cat.bg[0], cat.bg[1], cat.bg[2]); doc.rect(ML, y, MR - ML, 5.5, 'F');
            doc.setDrawColor(cat.rgb[0], cat.rgb[1], cat.rgb[2]); doc.setLineWidth(0.4); doc.line(ML, y, ML, y + 5.5);
            doc.setTextColor(cat.rgb[0], cat.rgb[1], cat.rgb[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
            doc.text(cat.label, ML + 3, y + 3.8);
            y += 7;
            items.forEach(item => {
                checkPage(11);
                doc.setFillColor(cat.bg[0], cat.bg[1], cat.bg[2]);
                doc.setDrawColor(cat.bd[0], cat.bd[1], cat.bd[2]); doc.setLineWidth(0.2);
                doc.roundedRect(ML + 2, y, MR - ML - 4, 9, 1.2, 1.2, 'FD');
                doc.setTextColor(30, 41, 59); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
                doc.text(String(item[cat.titleKey] || '').substring(0, 50), ML + 5, y + 3.8);
                const rest = cat.fields.filter(f => f.k !== cat.titleKey && item[f.k]);
                if (rest.length) {
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139); doc.setFontSize(6.5);
                    doc.text(rest.map(f => `${f.l}: ${item[f.k]}`).join('   |   ').substring(0, 90), ML + 5, y + 7.2);
                }
                y += 11;
            });
            y += 2;
        });
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.25); doc.line(ML, 286, MR, 286);
        doc.setFontSize(6.5); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
        doc.text(`Generated ${new Date().toLocaleString('en-IN')}   •   Page ${i} of ${totalPages}`, W / 2, 290, { align: 'center' });
    }

    doc.save(`${(su?.name || studentEmail).replace(/\s+/g, '_')}_Profile.pdf`);
};

/* ─────────────────────────────────────────────────────────────
   FULL STUDENT DETAIL PANEL (5-tab modal)
───────────────────────────────────────────────────────────── */
const StudentDetailPanel = ({ studentEmail, onClose }) => {
    const su = db.getUsers().find(u => u.email === studentEmail && u.role === 'student');

    const [extra, setExtra] = useState(() => su ? getExtra(su.email) : emptyExtra());
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(null);
    const [tab, setTab] = useState('overview');
    const [liveExtra, setLiveExtra] = useState(() => su ? getExtra(su.email) : emptyExtra());
    const [showAI, setShowAI] = useState(false);
    const [showAcademic, setShowAcademic] = useState(false);

    const refreshLive = () => { if (su) setLiveExtra(getExtra(su.email)); };

    const startEdit = () => { setDraft(JSON.parse(JSON.stringify(extra))); setEditing(true); };
    const cancelEdit = () => { setDraft(null); setEditing(false); };
    const saveEdit = () => {
        if (su) saveExtra(su.email, draft);
        setExtra(draft); setLiveExtra({ ...liveExtra, ...draft }); setDraft(null); setEditing(false);
    };

    const d = editing ? draft : extra;
    const setD = (path, val) => setDraft(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.'); let obj = next;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = val; return next;
    });

    const attVal = parseFloat(d.attendance) || 0;
    const cgpaVal = parseFloat(d.cgpa) || 0;

    const TABS = [
        { key: 'overview', label: '👤 Overview' },
        { key: 'leave', label: '📅 Leave / OD' },
        { key: 'events', label: '⭐ Events' },
        { key: 'internship', label: '💼 Internship' },
        { key: 'publications', label: '📄 Publications' },
        { key: 'certifications', label: '🏅 Certifications' },
    ];
    const isEditableTab = tab === 'overview' || tab === 'leave';

    const handleTabChange = (key) => {
        setTab(key);
        if (!['overview', 'leave'].includes(key)) refreshLive();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease' }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: '1.25rem', width: '90%', maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 60px -12px rgba(0,0,0,.3)', animation: 'slideUp .25s ease' }} onClick={e => e.stopPropagation()}>

                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%)', padding: '1.5rem 1.75rem', borderRadius: '1.25rem 1.25rem 0 0', color: '#fff', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,.18)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    <div style={{ position: 'absolute', top: '1rem', right: '3.5rem', display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setShowAI(true)} className="sd-pdf-btn" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(236,72,153,0.3)' }}>
                            <i className="fas fa-brain" style={{ marginRight: '.3rem' }} /> AI Analysis
                        </button>
                        <button onClick={() => generateStudentPDF(studentEmail)} className="sd-pdf-btn">📄 PDF</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
                            {(su?.name || 'S').charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{su?.name || 'Student'}</h2>
                            <p style={{ margin: '.2rem 0 0', opacity: .8, fontSize: '.82rem' }}>
                                {su?.registerNo || 'No Reg'} &nbsp;•&nbsp; {su?.department || 'Dept N/A'} &nbsp;•&nbsp; {su?.year || '—'} Year &nbsp;•&nbsp; Sec {su?.section || d.section || '—'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '.25rem' }}>
                                <p style={{ margin: 0, opacity: .65, fontSize: '.75rem' }}>{su?.email || 'Email N/A'}</p>
                                {d.gender && (
                                    <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        {d.gender}
                                    </span>
                                )}
                                {(d.vertical || su?.vertical) && (
                                    <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        {d.vertical || su?.vertical}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isEditableTab && (
                            !editing
                                ? <button onClick={startEdit} style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', borderRadius: '.6rem', padding: '.45rem 1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, marginRight: '5.5rem' }}>✏️ Edit</button>
                                : <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, marginRight: '5.5rem' }}>
                                    <button className="sd-btn-save" onClick={saveEdit}>💾 Save</button>
                                    <button className="sd-btn-cancel" onClick={cancelEdit}>Cancel</button>
                                </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.55rem' }}>
                        {[
                            { label: 'CGPA', val: cgpaVal || '—' },
                            { label: 'Attendance', val: attVal ? `${attVal}%` : '—' },
                            { label: 'Blood Grp', val: d.bloodGroup || '—' },
                            { label: 'Phone', val: d.phone || '—' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,.13)', borderRadius: '.65rem', padding: '.5rem .6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
                                <div style={{ fontSize: '.65rem', opacity: .75, marginTop: '.1rem' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafafa', padding: '0 1rem', overflowX: 'auto' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => handleTabChange(t.key)} style={{ background: 'none', border: 'none', padding: '.7rem .8rem', fontSize: '.78rem', fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#0ea5e9' : '#64748b', borderBottom: tab === t.key ? '2.5px solid #0ea5e9' : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', marginBottom: '-1px' }}>
                            {t.label}
                            {!['overview', 'leave'].includes(t.key) && (
                                <span style={{ marginLeft: '.3rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1px 5px', fontSize: '.6rem', fontWeight: 700 }}>STUDENT</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem 1.75rem' }}>
                    {tab === 'overview' && (
                        <div>
                            <p className="sd-section-title">🎓 Academic Info</p>
                            <div className="sd-grid3" style={{ marginBottom: '.875rem' }}>
                                <EField label="Register No" value={su?.registerNo} onChange={() => { }} editing={false} />
                                <EField label="Department" value={su?.department} onChange={() => { }} editing={false} />
                                <EField label="Year" value={su?.year} onChange={() => { }} editing={false} />
                                <EField label="Section" value={su?.section || d.section} onChange={v => setD('section', v)} editing={editing} />
                                <EField label="Vertical" value={d.vertical || su?.vertical} onChange={v => setD('vertical', v)} editing={editing} options={[{ value: '', label: '— Select —' }, { value: 'CIC lab', label: 'CIC lab' }, { value: 'RIC lab', label: 'RIC lab' }, { value: 'Gen AI lab', label: 'Gen AI lab' }, { value: 'Creation lab', label: 'Creation lab' }, { value: 'AR/VR lab', label: 'AR/VR lab' }]} />
                                <EField label="CGPA" value={d.cgpa} type="number" placeholder="e.g. 8.5" onChange={v => setD('cgpa', v)} editing={editing} />
                                <EField label="Attendance %" value={d.attendance} type="number" placeholder="e.g. 92" onChange={v => setD('attendance', v)} editing={editing} />
                            </div>
                            {(attVal > 0 || cgpaVal > 0) && (
                                <div style={{ marginBottom: '.875rem' }}>
                                    <p className="sd-section-title">📊 Performance</p>
                                    {attVal > 0 && (
                                        <div className="sd-bar-wrap">
                                            <div className="sd-bar-row"><span className="sd-bar-label">Attendance</span><span className="sd-bar-val" style={{ color: attColor(attVal) }}>{attVal}%</span></div>
                                            <div className="sd-bar-track"><div className="sd-bar-fill" style={{ width: `${Math.min(attVal, 100)}%`, background: attColor(attVal) }} /></div>
                                        </div>
                                    )}
                                    {cgpaVal > 0 && (
                                        <div className="sd-bar-wrap">
                                            <div className="sd-bar-row"><span className="sd-bar-label">CGPA</span><span className="sd-bar-val" style={{ color: '#0ea5e9' }}>{cgpaVal} / 10</span></div>
                                            <div className="sd-bar-track"><div className="sd-bar-fill" style={{ width: `${cgpaVal * 10}%`, background: '#0ea5e9' }} /></div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '.75rem', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '.85rem', color: '#0369a1' }}>Nexus AI Deep Scan</p>
                                            <p style={{ margin: '.15rem 0 0', fontSize: '.7rem', color: '#0ea5e9' }}>Analyze performance, strengths, and career fit.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAI(true)}
                                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.5rem', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(14,165,233,0.2)' }}
                                        >
                                            <i className="fas fa-rocket" /> Run Analysis
                                        </button>
                                    </div>
                                </div>
                            )}
                            <p className="sd-section-title">👥 Family Details</p>
                            <div className="sd-grid2" style={{ marginBottom: '.75rem' }}>
                                <EField label="Father's Name" value={d.fatherName} onChange={v => setD('fatherName', v)} editing={editing} />
                                <EField label="Father's Phone" value={d.fatherPhone} onChange={v => setD('fatherPhone', v)} editing={editing} />
                                <EField label="Father's Occupation" value={d.fatherOccupation} onChange={v => setD('fatherOccupation', v)} editing={editing} />
                                <EField label="Father's Income" value={d.fatherIncome} onChange={v => setD('fatherIncome', v)} editing={editing} type="number" />
                                <EField label="Mother's Name" value={d.motherName} onChange={v => setD('motherName', v)} editing={editing} />
                                <EField label="Mother's Phone" value={d.motherPhone} onChange={v => setD('motherPhone', v)} editing={editing} />
                                <EField label="Mother's Occupation" value={d.motherOccupation} onChange={v => setD('motherOccupation', v)} editing={editing} />
                                <EField label="Mother's Income" value={d.motherIncome} onChange={v => setD('motherIncome', v)} editing={editing} type="number" />
                            </div>

                            <p className="sd-section-title">👫 Siblings ({d.siblings?.length || 0})</p>
                            <div style={{ marginBottom: '.75rem' }}>
                                <ViewList items={d.siblings || []} emptyText="No siblings listed." titleField="name" fields={[{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'detail', label: 'Doing' }]} />
                            </div>

                            <p className="sd-section-title">🏫 Schooling History</p>
                            <div className="sd-grid2" style={{ marginBottom: '.75rem' }}>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '.7rem', color: '#64748b' }}>SSLC (10th)</p>
                                    <EField label="School" value={d.sslcSchool} onChange={v => setD('sslcSchool', v)} editing={editing} />
                                    <EField label="Percentage" value={(d.sslcGained && d.sslcTotal) ? ((d.sslcGained / d.sslcTotal) * 100).toFixed(2) + '%' : '—'} editing={false} />
                                </div>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '.7rem', color: '#64748b' }}>HSC (12th)</p>
                                    <EField label="School" value={d.hscSchool} onChange={v => setD('hscSchool', v)} editing={editing} />
                                    <EField label="Percentage" value={(d.hscGained && d.hscTotal) ? ((d.hscGained / d.hscTotal) * 100).toFixed(2) + '%' : '—'} editing={false} />
                                </div>
                                {d.diplomaApplicable && (
                                    <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                                        <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '.7rem', color: '#64748b' }}>Diploma</p>
                                        <div className="sd-grid2">
                                            <EField label="College" value={d.diplomaSchool} onChange={v => setD('diplomaSchool', v)} editing={editing} />
                                            <EField label="Percentage" value={(d.diplomaGained && d.diplomaTotal) ? ((d.diplomaGained / d.diplomaTotal) * 100).toFixed(2) + '%' : '—'} editing={false} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="sd-section-title">📋 Personal Details</p>
                            <div className="sd-grid3" style={{ marginBottom: '.75rem' }}>
                                <EField label="Email" value={su?.email} onChange={() => { }} editing={false} />
                                <EField label="Phone" value={d.phone} onChange={v => setD('phone', v)} editing={editing} />
                                <EField label="Gender" value={d.gender} onChange={v => setD('gender', v)} editing={editing} />
                                <EField label="Blood Group" value={d.bloodGroup} onChange={v => setD('bloodGroup', v)} editing={editing} placeholder="e.g. O+" />
                                <EField label="Caste" value={d.caste} onChange={v => setD('caste', v)} editing={editing} />
                                <EField label="Community" value={d.community} onChange={v => setD('community', v)} editing={editing} />
                            </div>
                            <ETextArea label="Address" value={d.address} onChange={v => setD('address', v)} editing={editing} />

                            <p className="sd-section-title">🔗 Professional Links</p>
                            <div className="sd-grid3" style={{ marginBottom: '.75rem' }}>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>LeetCode</label>
                                    {d.leetcode ? (
                                        <a href={d.leetcode} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                            <i className="fa-brands fa-leetcode" /> View Profile <i className="fas fa-external-link-alt" style={{ fontSize: '.6rem' }} />
                                        </a>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic' }}>Not provided</span>
                                    )}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>LinkedIn</label>
                                    {d.linkedin ? (
                                        <a href={d.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                            <i className="fa-brands fa-linkedin" /> View Profile <i className="fas fa-external-link-alt" style={{ fontSize: '.6rem' }} />
                                        </a>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic' }}>Not provided</span>
                                    )}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.6rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>GitHub</label>
                                    {d.github ? (
                                        <a href={d.github} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                            <i className="fa-brands fa-github" /> View Profile <i className="fas fa-external-link-alt" style={{ fontSize: '.6rem' }} />
                                        </a>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic' }}>Not provided</span>
                                    )}
                                </div>
                            </div>

                            <p className="sd-section-title">🏫 Schooling Details</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.75rem', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '.75rem', color: '#64748b' }}>SSLC (10th)</p>
                                    <EField label="School" value={d.sslcSchool} onChange={v => setD('sslcSchool', v)} editing={editing} />
                                    <EField label="Place" value={d.sslcPlace} onChange={v => setD('sslcPlace', v)} editing={editing} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                                        <EField label="Gained" value={d.sslcGained} onChange={v => setD('sslcGained', v)} editing={editing} type="number" />
                                        <EField label="Total" value={d.sslcTotal} onChange={v => setD('sslcTotal', v)} editing={editing} type="number" />
                                    </div>
                                    <div style={{ marginTop: '.5rem', padding: '.4rem', background: '#fff', borderRadius: '.4rem', border: '1px dashed #f59e0b', textAlign: 'center' }}>
                                        <span style={{ fontSize: '.85rem', fontWeight: 800, color: '#f59e0b' }}>
                                            {(d.sslcGained && d.sslcTotal) ? ((d.sslcGained / d.sslcTotal) * 100).toFixed(2) : '0.00'}%
                                        </span>
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '.75rem', borderRadius: '.75rem', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '.75rem', color: '#64748b' }}>HSC (12th)</p>
                                    <EField label="School" value={d.hscSchool} onChange={v => setD('hscSchool', v)} editing={editing} />
                                    <EField label="Place" value={d.hscPlace} onChange={v => setD('hscPlace', v)} editing={editing} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                                        <EField label="Gained" value={d.hscGained} onChange={v => setD('hscGained', v)} editing={editing} type="number" />
                                        <EField label="Total" value={d.hscTotal} onChange={v => setD('hscTotal', v)} editing={editing} type="number" />
                                    </div>
                                    <div style={{ marginTop: '.5rem', padding: '.4rem', background: '#fff', borderRadius: '.4rem', border: '1px dashed #06b6d4', textAlign: 'center' }}>
                                        <span style={{ fontSize: '.85rem', fontWeight: 800, color: '#06b6d4' }}>
                                            {(d.hscGained && d.hscTotal) ? ((d.hscGained / d.hscTotal) * 100).toFixed(2) : '0.00'}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="sd-section-title">📊 Semester-wise Performance</p>
                            <div style={{ marginBottom: '1rem' }}>
                                <EField
                                    label="Current Semester"
                                    value={d.currentSemester}
                                    onChange={v => setD('currentSemester', v)}
                                    editing={editing}
                                    placeholder="e.g. 5"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p className="sd-section-title" style={{ margin: 0 }}>📊 Performance</p>
                                <button
                                    onClick={() => setShowAcademic(!showAcademic)}
                                    style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '.5rem', padding: '.4rem .8rem', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {showAcademic ? 'Hide' : 'View'} Academic Performance
                                </button>
                            </div>

                            {showAcademic && (
                                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '.75rem', border: '1px solid #e2e8f0' }}>
                                    {(d.currentSemester && parseInt(d.currentSemester) > 1) ? (
                                        Array.from({ length: parseInt(d.currentSemester) - 1 }).map((_, i) => {
                                            const semKey = `sem${i + 1}`;
                                            const rom = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i];
                                            const rawSemData = d.semesterGPAs?.[semKey];
                                            const semData = (typeof rawSemData === 'object' && rawSemData !== null)
                                                ? { gpa: '', courses: [], labCourses: [], ...rawSemData }
                                                : { gpa: rawSemData || '', courses: [], labCourses: [] };
                                            const gpaVal = semData.gpa || '—';

                                            return (
                                                <div key={semKey} style={{ marginBottom: '1rem', borderBottom: i < parseInt(d.currentSemester) - 2 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '.75rem', color: '#1e40af' }}>SEMESTER {rom}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            {semData.marksheet && (
                                                                <button
                                                                    onClick={() => {
                                                                        const win = window.open();
                                                                        win.document.write(`<iframe src="${semData.marksheet}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                                    }}
                                                                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '.4rem', padding: '.2rem .6rem', fontSize: '.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.3rem' }}
                                                                >
                                                                    <i className="fas fa-file-pdf" /> View Marksheet
                                                                </button>
                                                            )}
                                                            <span style={{ fontWeight: 800, fontSize: '.75rem', color: '#0369a1' }}>GPA: {semData.gpa || '—'}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>
                                                        <i className="fas fa-book-open" style={{ fontSize: '.7rem', color: '#6366f1' }} />
                                                        <span style={{ fontSize: '.68rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>Theory Courses</span>
                                                    </div>
                                                    <ViewList
                                                        items={semData.courses || []}
                                                        emptyText="No theory courses."
                                                        titleField="code"
                                                        fields={[
                                                            { key: 'code', label: 'Code' },
                                                            { key: 'courseName', label: 'Course Name' },
                                                            { key: 'faculty', label: 'Faculty' },
                                                            { key: 'cat1', label: 'CAT1' },
                                                            { key: 'cat2', label: 'CAT2' },
                                                            { key: 'internal', label: 'Internal' },
                                                            { key: 'grade', label: 'Grade' }
                                                        ]}
                                                    />

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #fbcfe8', paddingBottom: '0.2rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                                                        <i className="fas fa-flask" style={{ fontSize: '.7rem', color: '#ec4899' }} />
                                                        <span style={{ fontSize: '.68rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase' }}>Lab / Practical Courses</span>
                                                    </div>
                                                    <ViewList
                                                        items={semData.labCourses || []}
                                                        emptyText="No lab courses recorded."
                                                        titleField="code"
                                                        fields={[
                                                            { key: 'code', label: 'Code' },
                                                            { key: 'courseName', label: 'Course Name' },
                                                            { key: 'faculty', label: 'Faculty' },
                                                            { key: 'internal', label: 'Internal' },
                                                            { key: 'grade', label: 'Grade' }
                                                        ]}
                                                    />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', fontSize: '.8rem', color: '#64748b', padding: '1rem' }}>No completed semesters yet.</div>
                                    )}
                                </div>
                            )}

                            {d.currentSemester && parseInt(d.currentSemester) > 1 && !showAcademic && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '.75rem', marginBottom: '1rem' }}>
                                    {Array.from({ length: parseInt(d.currentSemester) - 1 }).map((_, i) => {
                                        const semKey = `sem${i + 1}`;
                                        const rom = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i];
                                        return (
                                            <div key={semKey} style={{ background: '#f8fafc', padding: '.65rem', borderRadius: '.5rem', border: '1px solid #e2e8f0' }}>
                                                <p style={{ margin: '0 0 .35rem', fontWeight: 700, fontSize: '.65rem', color: '#64748b' }}>Sem {rom}</p>
                                                <EField
                                                    label={`GPA`}
                                                    value={typeof d.semesterGPAs?.[semKey] === 'object' ? d.semesterGPAs[semKey].gpa : d.semesterGPAs?.[semKey]}
                                                    onChange={v => {
                                                        const existing = d.semesterGPAs?.[semKey] || { gpa: '', courses: [] };
                                                        const newGPAs = { ...d.semesterGPAs, [semKey]: typeof existing === 'object' ? { ...existing, gpa: v } : { gpa: v, courses: [] } };
                                                        setD('semesterGPAs', newGPAs);
                                                        // Note: We don't auto-calculate CGPA here because it's student-submitted data
                                                        // But faculty could technically edit it? User said "get it in faculty dashboard"
                                                    }}
                                                    editing={editing}
                                                    type="number"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div style={{ padding: '.75rem', background: '#f0f9ff', borderRadius: '.75rem', border: '1px solid #bae6fd', textAlign: 'center', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '.65rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>Current Cumulative CGPA</p>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{d.cgpa || '0.00'}</p>
                            </div>
                            <div style={{ marginTop: '.875rem' }}>
                                <p className="sd-section-title">📝 Faculty Notes / Remarks</p>
                                <ETextArea label="Notes" value={d.notes} onChange={v => setD('notes', v)} editing={editing} />
                            </div>
                        </div>
                    )}

                    {tab === 'leave' && (
                        <div>
                            <p className="sd-section-title">📅 Leave & OD History (live from system)</p>
                            {su ? <LeaveSummary studentEmail={su.email} /> : <div className="sd-empty">Student not found in database.</div>}
                        </div>
                    )}

                    {tab === 'events' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                                <p className="sd-section-title" style={{ margin: 0 }}>⭐ Event Details</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <span className="sd-source-badge">✅ Student Submitted</span>
                                    <span style={{ background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', borderRadius: '999px', padding: '.2rem .65rem', fontSize: '.7rem', fontWeight: 700 }}>
                                        {(liveExtra.events || []).length} record{(liveExtra.events || []).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <ViewList items={liveExtra.events || []} emptyText="No event records submitted by student yet." titleField="eventType"
                                fields={[
                                    { key: 'eventType', label: 'Event Type' },
                                    { key: 'eventLevel', label: 'Level' },
                                    { key: 'place', label: 'Place' },
                                    { key: 'fromDate', label: 'From Date' },
                                    { key: 'toDate', label: 'To Date' },
                                    { key: 'prize', label: 'Prize' },
                                    { key: 'certificate', label: 'Certificate', type: 'link' }
                                ]}
                            />
                        </div>
                    )}

                    {tab === 'internship' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                                <p className="sd-section-title" style={{ margin: 0 }}>💼 Internship Details</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <span className="sd-source-badge">✅ Student Submitted</span>
                                    <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '.2rem .65rem', fontSize: '.7rem', fontWeight: 700 }}>
                                        {(liveExtra.internships || []).length} record{(liveExtra.internships || []).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <ViewList items={liveExtra.internships || []} emptyText="No internship records submitted by student yet." titleField="company"
                                fields={[{ key: 'company', label: 'Company' }, { key: 'role', label: 'Role' }, { key: 'type', label: 'Type' }, { key: 'fromDate', label: 'From' }, { key: 'toDate', label: 'To' }, { key: 'stipend', label: 'Stipend' }, { key: 'certificate', label: 'Certificate' }]}
                            />
                        </div>
                    )}

                    {tab === 'publications' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                                <p className="sd-section-title" style={{ margin: 0 }}>📄 Research Publications</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                    <span className="sd-source-badge">✅ Student Submitted</span>
                                    <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '.2rem .65rem', fontSize: '.7rem', fontWeight: 700 }}>
                                        {(liveExtra.publications || []).length} record{(liveExtra.publications || []).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <ViewList items={liveExtra.publications || []} emptyText="No publications submitted by student yet." titleField="title"
                                fields={[{ key: 'title', label: 'Title' }, { key: 'journal', label: 'Journal/Conf' }, { key: 'type', label: 'Type' }, { key: 'date', label: 'Date' }, { key: 'doi', label: 'DOI/Link' }]}
                            />
                        </div>
                    )}

                    {tab === 'certifications' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                                <p className="sd-section-title" style={{ margin: 0 }}>🏅 Certifications</p>
                                <span className="sd-source-badge">✅ Student Submitted</span>
                            </div>
                            {[
                                { key: 'nptel', title: '🎓 Online Courses', bg: '#fff7ed', border: '#fed7aa', accent: '#f97316', tc: '#c2410c', tf: 'courseName', fields: [{ key: 'courseName', label: 'Course' }, { key: 'platform', label: 'Platform' }, { key: 'score', label: 'Score' }, { key: 'completionDate', label: 'Date' }] },
                                { key: 'pattern', title: '🔷 Patents', bg: '#faf5ff', border: '#e9d5ff', accent: '#8b5cf6', tc: '#6d28d9', tf: 'title', fields: [{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }, { key: 'applicationNo', label: 'App No' }, { key: 'filedDate', label: 'Date' }] },
                                { key: 'vertical', title: '📐 Vertical Activities', bg: '#f0f9ff', border: '#bae6fd', accent: '#0ea5e9', tc: '#0369a1', tf: 'activityName', fields: [{ key: 'activityName', label: 'Activity' }, { key: 'category', label: 'Category' }, { key: 'achievement', label: 'Achievement' }, { key: 'date', label: 'Date' }] },
                                { key: 'others', title: '🏆 Other Certifications', bg: '#f0fdf4', border: '#bbf7d0', accent: '#10b981', tc: '#065f46', tf: 'name', fields: [{ key: 'name', label: 'Certificate' }, { key: 'issuer', label: 'Issuer' }, { key: 'year', label: 'Year' }, { key: 'id', label: 'ID/URL' }] },
                            ].map(cat => (
                                <div key={cat.key} className="sd-cert-block" style={{ background: cat.bg, border: `1px solid ${cat.border}`, borderLeft: `4px solid ${cat.accent}` }}>
                                    <p style={{ margin: '0 0 .6rem', fontWeight: 700, color: cat.tc, fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{cat.title}</p>
                                    <ViewList items={liveExtra.certifications?.[cat.key] || []} emptyText={`No ${cat.title.replace(/[^a-zA-Z ]/g, '').trim()} submitted yet.`} titleField={cat.tf} fields={cat.fields} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editing && isEditableTab && (
                    <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #f1f5f9', padding: '.875rem 1.75rem', display: 'flex', gap: '.75rem', justifyContent: 'flex-end', borderRadius: '0 0 1.25rem 1.25rem' }}>
                        <button className="sd-btn-cancel" onClick={cancelEdit}>Cancel</button>
                        <button className="sd-btn-save" onClick={saveEdit}>💾 Save All Changes</button>
                    </div>
                )}
            </div>

            {showAI && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0f172a' }}>
                    <StudentAnalysis targetEmail={studentEmail} onClose={() => setShowAI(false)} />
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   STUDENT LIST PANEL
───────────────────────────────────────────────────────────── */
const StudentListPanel = ({ list, type, onBack, onAdd, onRemove, onDownloadPDF }) => {
    const [selected, setSelected] = useState(null);
    const [aiEmail, setAiEmail] = useState(null);
    const [filterVertical, setFilterVertical] = useState('');

    const filteredList = list.filter(email => {
        const su = db.getUsers().find(u => u.email === email && u.role === 'student');
        if (!su) return false;
        const ex = getExtra(su.email);

        if (filterVertical && (ex.vertical || su.vertical) !== filterVertical) return false;

        return true;
    });

    return (
        <div>
            {selected && <StudentDetailPanel studentEmail={selected} onClose={() => setSelected(null)} />}
            {aiEmail && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0f172a' }}>
                    <StudentAnalysis targetEmail={aiEmail} onClose={() => setAiEmail(null)} />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', borderRadius: '.5rem', padding: '.45rem .8rem', cursor: 'pointer', color: '#475569', fontWeight: 600, fontSize: '.82rem' }}>← Back</button>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', flex: 1 }}>{type === 'proctee' ? '👤 Proctees' : '🎓 Students'} ({filteredList.length}/{list.length})</h2>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button onClick={onAdd} className="btn-approve" style={{ fontSize: '.8rem', padding: '.5rem .9rem' }}>+ Add</button>
                    <button onClick={onRemove} className="btn-reject" style={{ fontSize: '.8rem', padding: '.5rem .9rem' }}>Remove</button>
                    <button onClick={() => onDownloadPDF(filteredList, type === 'proctee' ? 'Proctees' : 'Students')} className="btn-approve" style={{ background: '#6366f1', fontSize: '.8rem', padding: '.5rem .9rem' }}>📄 Bulk PDF</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vertical</label>
                    <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)} style={{ padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}>
                        <option value="">All</option>
                        <option value="CIC lab">CIC lab</option>
                        <option value="RIC lab">RIC lab</option>
                        <option value="Gen AI lab">Gen AI lab</option>
                        <option value="Creation lab">Creation lab</option>
                        <option value="AR/VR lab">AR/VR lab</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => { setFilterVertical(''); }} style={{ padding: '0.4rem 0.8rem', background: '#e2e8f0', color: '#475569', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Reset</button>
                </div>
            </div>

            {filteredList.length === 0
                ? <div className="sd-empty">No {type}s matched your filters or none added yet.</div>
                : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '.75rem' }}>
                        {filteredList.map((email, idx) => {
                            const su = db.getUsers().find(u => u.email === email && u.role === 'student');
                            const ex = su ? getExtra(su.email) : emptyExtra();
                            const name = su?.name || email;
                            const att = parseFloat(ex.attendance) || null;
                            const cgpa = parseFloat(ex.cgpa) || null;
                            const allReqs = su ? leaveService.getAllRequests().filter(r => r.studentEmail === su.email) : [];
                            const pendingCt = allReqs.filter(r => r.facultyStatus === 'pending').length;
                            const intCount = (ex.internships || []).length;
                            const pubCount = (ex.publications || []).length;
                            const certCount = Object.values(ex.certifications || {}).flat().length;

                            return (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '.6rem', right: '.6rem', zIndex: 2, display: 'flex', gap: '0.3rem' }}>
                                        <button className="sd-pdf-btn" style={{ fontSize: '.65rem', padding: '.28rem .55rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderColor: 'transparent' }}
                                            onClick={e => { e.stopPropagation(); setAiEmail(email); }} title={`AI Analysis for ${name}`}>🤖</button>
                                        <button className="sd-pdf-btn" style={{ fontSize: '.65rem', padding: '.28rem .55rem' }}
                                            onClick={e => { e.stopPropagation(); generateStudentPDF(email); }} title={`Download ${name}'s PDF`}>📄</button>
                                    </div>
                                    <button className="sd-card-btn" onClick={() => setSelected(email)} style={{ paddingRight: '5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.65rem' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                                {name.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                                                <p style={{ margin: '.1rem 0 0', color: '#64748b', fontSize: '.72rem' }}>{su?.registerNo || '—'} • {su?.year || '—'} Yr</p>
                                            </div>
                                            {pendingCt > 0 && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '999px', padding: '.15rem .45rem', fontSize: '.65rem', fontWeight: 700, flexShrink: 0 }}>{pendingCt}⏳</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.45rem' }}>
                                            {cgpa !== null
                                                ? <span style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', borderRadius: '.4rem', padding: '.25rem .4rem', fontSize: '.72rem', textAlign: 'center', fontWeight: 700 }}>CGPA {cgpa}</span>
                                                : <span style={{ flex: 1, background: '#f8fafc', color: '#94a3b8', borderRadius: '.4rem', padding: '.25rem .4rem', fontSize: '.72rem', textAlign: 'center' }}>CGPA —</span>
                                            }
                                            {att !== null
                                                ? <span style={{ flex: 1, background: attBg(att), color: attColor(att), borderRadius: '.4rem', padding: '.25rem .4rem', fontSize: '.72rem', textAlign: 'center', fontWeight: 700 }}>{att}% Att</span>
                                                : <span style={{ flex: 1, background: '#f8fafc', color: '#94a3b8', borderRadius: '.4rem', padding: '.25rem .4rem', fontSize: '.72rem', textAlign: 'center' }}>Att —</span>
                                            }
                                        </div>
                                        {(intCount > 0 || pubCount > 0 || certCount > 0) && (
                                            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.45rem' }}>
                                                {intCount > 0 && <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '.1rem .4rem', fontSize: '.65rem', fontWeight: 700 }}>💼 {intCount}</span>}
                                                {pubCount > 0 && <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '.1rem .4rem', fontSize: '.65rem', fontWeight: 700 }}>📄 {pubCount}</span>}
                                                {certCount > 0 && <span style={{ background: '#faf5ff', color: '#6d28d9', border: '1px solid #e9d5ff', borderRadius: '4px', padding: '.1rem .4rem', fontSize: '.65rem', fontWeight: 700 }}>🏅 {certCount}</span>}
                                            </div>
                                        )}
                                        <p style={{ margin: 0, fontSize: '.72rem', color: '#0ea5e9', fontWeight: 700 }}>View Full Details →</p>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            }
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   STUDENT DETAILS MODAL
───────────────────────────────────────────────────────────── */
const StudentDetailsModal = ({ isOpen, onClose, proctees, students, onAddStudent, onRemoveStudent, onDownloadPDF }) => {
    const [view, setView] = useState('menu');
    const close = () => { setView('menu'); onClose(); };
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease' }} onClick={close}>
            <div style={{ background: '#fff', borderRadius: '1.5rem', width: '90%', maxWidth: '920px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 60px -12px rgba(0,0,0,.3)', animation: 'slideUp .25s ease' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '1.5rem 1.5rem 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '.75rem', background: 'linear-gradient(135deg,#1e40af,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>Student Details</h2>
                            <p style={{ margin: '.05rem 0 0', fontSize: '.73rem', color: '#94a3b8' }}>{proctees.length} proctees • {students.length} students</p>
                        </div>
                    </div>
                    <button onClick={close} style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem 1.75rem' }}>
                    {view === 'menu' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            {[
                                { key: 'proctees', count: proctees.length, icon: '👤', label: 'My Proctees', sub: 'Academic records, leave, student-submitted certifications & more', grad: '#059669,#10b981', border: '#bbf7d0', bg: '#f0fdf4', text: '#065f46' },
                                { key: 'students', count: students.length, icon: '🎓', label: 'My Students', sub: 'Attendance, OD history, student-submitted internships & achievements', grad: '#1e40af,#3b82f6', border: '#bfdbfe', bg: '#eff6ff', text: '#1e3a8a' },
                            ].map(c => (
                                <button key={c.key} onClick={() => setView(c.key)} style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: '1.25rem', padding: '1.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${c.border}aa`; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '.875rem', background: `linear-gradient(135deg,${c.grad})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.4rem', boxShadow: `0 4px 14px ${c.border}` }}>{c.icon}</div>
                                    <h3 style={{ margin: '0 0 .35rem', fontSize: '1.05rem', fontWeight: 800, color: c.text }}>{c.label}</h3>
                                    <p style={{ margin: '0 0 1rem', fontSize: '.82rem', color: c.text, opacity: .75 }}>{c.sub}</p>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', background: `linear-gradient(135deg,${c.grad})`, color: '#fff', borderRadius: '999px', padding: '.3rem .85rem', fontSize: '.78rem', fontWeight: 700 }}>{c.count} students →</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {view === 'proctees' && <StudentListPanel list={proctees} type="proctee" onBack={() => setView('menu')} onAdd={() => onAddStudent('proctee')} onRemove={() => onRemoveStudent('proctee')} onDownloadPDF={() => onDownloadPDF(proctees, 'Proctees')} />}
                    {view === 'students' && <StudentListPanel list={students} type="student" onBack={() => setView('menu')} onAdd={() => onAddStudent('student')} onRemove={() => onRemoveStudent('student')} onDownloadPDF={() => onDownloadPDF(students, 'Students')} />}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   MY MENTEES MODAL
───────────────────────────────────────────────────────────── */
const MyMenteesModal = ({ isOpen, onClose, facultyEmail }) => {
    const [mentees, setMentees] = useState([]);
    const [detailView, setDetailView] = useState(null); // Stores {student, project} when viewing details

    useEffect(() => {
        if (!isOpen) return;
        const allStudents = db.getUsers().filter(u => u.role === 'student');
        const list = [];
        allStudents.forEach(s => {
            try {
                const projectData = localStorage.getItem(`stu_project_${s.email.toLowerCase()}`);
                if (projectData) {
                    const parsed = JSON.parse(projectData);
                    const projects = Array.isArray(parsed) ? parsed : (parsed.name ? [parsed] : []);
                    projects.forEach(p => {
                        if (p.mentorEmail?.toLowerCase() === facultyEmail?.toLowerCase()) {
                            if (!p.submittedBy || p.submittedBy.toLowerCase() === s.email.toLowerCase()) {
                                list.push({ student: s, project: p });
                            }
                        }
                    });
                }
            } catch (e) { }
        });
        setMentees(list);
    }, [isOpen, facultyEmail]);

    const handleFileOpen = async (dataUrl, fileName, type, studentEmail) => {
        if (!dataUrl) return;

        try {
            let finalUrl = dataUrl;
            let mimeType = 'video/mp4';

            if (type === 'video' && dataUrl === 'indexeddb') {
                const STORAGE_KEY = `stu_project_${studentEmail}`;
                const blob = await videoStorage.getVideo(STORAGE_KEY);
                if (blob) {
                    finalUrl = URL.createObjectURL(blob);
                    mimeType = blob.type;
                } else {
                    alert('Video data not found in local storage.');
                    return;
                }
            } else {
                // Convert Data URL to Blob for better browser handling
                const parts = dataUrl.split(',');
                const mime = parts[0].match(/:(.*?);/)[1];
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                finalUrl = URL.createObjectURL(blob);
                mimeType = mime;
            }

            if (type === 'ppt') {
                const link = document.createElement('a');
                link.href = finalUrl;
                link.download = fileName || 'presentation.pptx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(finalUrl), 100);
            } else {
                const win = window.open();
                if (win) {
                    win.document.write(`
                        <html>
                            <head><title>Video Preview - ${fileName}</title></head>
                            <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh; font-family: sans-serif;">
                                <video controls autoplay style="max-width:100%; max-height:100%;">
                                    <source src="${finalUrl}" type="${mimeType}">
                                    Your browser does not support the video tag.
                                </video>
                            </body>
                        </html>
                    `);
                    win.document.close();
                } else {
                    alert('Popup blocked! Please allow popups for this site.');
                }
            }
        } catch (e) {
            console.error('Error opening file:', e);
            window.open(dataUrl);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease' }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: '1.5rem', width: '90%', maxWidth: '1000px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 60px -12px rgba(0,0,0,.3)', animation: 'slideUp .25s ease' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        {detailView ? (
                            <button onClick={() => setDetailView(null)} style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-arrow-left" />
                            </button>
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '.75rem', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-users" style={{ color: '#fff' }} />
                            </div>
                        )}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                                {detailView ? detailView.project.name : 'My Mentees Projects'}
                            </h2>
                            <p style={{ margin: '.05rem 0 0', fontSize: '.73rem', color: '#94a3b8' }}>
                                {detailView ? `By ${detailView.student.name}` : 'Students who listed you as their project mentor'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', color: '#475569' }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem 1.75rem' }}>
                    {mentees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                            <h3 style={{ color: '#64748b' }}>No mentees found</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Students will appear here once they add your email as their mentor.</p>
                        </div>
                    ) : detailView ? (
                        /* DETAIL VIEW */
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1.25rem', padding: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Project Information</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Domain</span>
                                                <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{detailView.project.domain || 'Not specified'}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Team Size</span>
                                                <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{detailView.project.noOfStudents || '—'} Students</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Documents & Demo</p>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            {detailView.project.ppt && (
                                                <button onClick={() => handleFileOpen(detailView.project.ppt, detailView.project.pptName, 'ppt')} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                                                    <i className="fas fa-file-powerpoint" style={{ color: '#e11d48' }} /> View PPT
                                                </button>
                                            )}
                                            {detailView.project.video && (
                                                <button onClick={() => handleFileOpen(detailView.project.video, detailView.project.videoName, 'video', detailView.student.email)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                                                    <i className="fas fa-play-circle" style={{ color: '#2563eb' }} /> Play Video
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {detailView.project.team && detailView.project.team.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Team Members Details</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                            {detailView.project.team.map((tm, tIdx) => (
                                                <div key={tIdx} style={{ background: '#fff', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{tm.name || 'Unknown'}</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Reg No</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{tm.regNo || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Dept</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{tm.dept || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Year</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{tm.year || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Section</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{tm.section || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* LIST VIEW */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                            {mentees.map((m, idx) => (
                                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1.25rem', padding: '1.5rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {m.student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{m.student.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{m.student.registerNo}</p>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.25rem', background: '#fff', padding: '1rem', borderRadius: '0.85rem', border: '1px solid #f1f5f9' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>Project Title</p>
                                        <p style={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, margin: 0 }}>{m.project.name || 'Untitled Project'}</p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Domain</p>
                                            <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, margin: 0 }}>{m.project.domain || '—'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Team Size</p>
                                            <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, margin: 0 }}>{m.project.noOfStudents || '—'} Students</p>
                                        </div>
                                    </div>

                                    <button onClick={() => setDetailView(m)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.85rem', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(99,102,241,0.2)', transition: 'all 0.2s' }}>
                                        <i className="fas fa-eye" /> View Team & Files
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
const LeaveHistoryModal = ({ isOpen, onClose, proctees = [], students = [] }) => {
    const [scope, setScope] = useState('proctees'); // 'proctees' or 'students'
    const [genderFilter, setGenderFilter] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    if (!isOpen) return null;

    // Data Filtering
    const allRequests = leaveService.getAllRequests();
    const allStudents = db.getUsers().filter(u => u.role === 'student');
    const targetEmails = scope === 'proctees' ? proctees : students;

    const filteredStudents = allStudents.filter(s => {
        if (!targetEmails.includes(s.email.toLowerCase())) return false;
        const extra = getExtra(s.email);
        const matchesGender = genderFilter === 'All' || (extra.gender || '').toLowerCase() === genderFilter.toLowerCase();
        return matchesGender;
    });

    const activeLeaves = [];
    filteredStudents.forEach(s => {
        // Find approved leave/OD requests for this student
        const sReqs = allRequests.filter(r =>
            r.studentEmail === s.email &&
            (r.facultyStatus === 'approved' || r.hodStatus === 'approved')
        );

        sReqs.forEach(r => {
            if (!r.fromDate) return;
            const rFrom = new Date(r.fromDate).getTime();
            const rTo = r.toDate ? new Date(r.toDate).getTime() : rFrom;

            if (fromDate) {
                const selStart = new Date(fromDate).getTime();
                const selEnd = toDate ? new Date(toDate).getTime() : selStart;

                // Allow overlapping
                if (rFrom <= selEnd && rTo >= selStart) {
                    activeLeaves.push({ ...r, student: s });
                }
            }
        });
    });

    return (
        <div className="lh-modal-overlay" onClick={onClose}>
            <div className="lh-modal-content" onClick={e => e.stopPropagation()}>
                <div className="lh-modal-header">
                    <h2 className="lh-modal-title"><span>📋</span> Student Leave History</h2>
                    <button className="lh-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="lh-modal-body">
                    {/* Left: Filters & Dates */}
                    <div>
                        <div className="lh-filters">
                            {['proctees', 'students'].map(s => (
                                <button key={s} className={`lh-filter-btn ${scope === s ? 'active' : ''}`} onClick={() => setScope(s)} style={{ textTransform: 'capitalize' }}>
                                    My {s}
                                </button>
                            ))}
                        </div>

                        <div className="lh-filters" style={{ marginTop: '1rem' }}>
                            {['All', 'Male', 'Female'].map(g => (
                                <button key={g} className={`lh-filter-btn ${genderFilter === g ? 'active' : ''}`} onClick={() => setGenderFilter(g)} style={{ flex: 1 }}>
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Select Date Range</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#475569', width: '40px' }}>From:</span>
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#475569', width: '40px' }}>To:</span>
                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} title="Leave empty for single day" />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', background: '#f0f9ff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bae6fd' }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#0369a1', fontWeight: 600 }}>
                                {fromDate
                                    ? `Showing absences ${toDate ? `from ${fromDate}` : `on ${fromDate}`}`
                                    : 'Please select a date'
                                }
                            </p>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#0ea5e9' }}>
                                For your <strong>{scope}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Right: Results */}
                    <div className="lh-status-panel">
                        <p className="sd-section-title">Absentees ({activeLeaves.length})</p>
                        <div className="lh-list-scroll">
                            {activeLeaves.length > 0 ? (
                                activeLeaves.map((lh, idx) => (
                                    <div key={idx} className="lh-student-card">
                                        <div className="lh-stu-avatar">{(lh.student.name || '?').charAt(0)}</div>
                                        <div className="lh-stu-info">
                                            <p className="lh-stu-name">{lh.student.name}</p>
                                            <p className="lh-stu-reg">{lh.student.registerNo} • {lh.student.year} Year</p>
                                            <p className="lh-stu-reason">{lh.reason || 'No reason provided'}</p>
                                            <p className="lh-stu-dates">
                                                🗓️ {new Date(lh.fromDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                {lh.fromDate !== lh.toDate && ` - ${new Date(lh.toDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                                                <span style={{ float: 'right', background: lh.type.toLowerCase().includes('od') ? '#ede9fe' : '#fef9c3', color: lh.type.toLowerCase().includes('od') ? '#7c3aed' : '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>{lh.type}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="lh-empty">
                                    <div className="lh-empty-icon">🏖️</div>
                                    <div className="lh-empty-text">No students on leave for the selected dates/section.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   MAIN FACULTY DASHBOARD
───────────────────────────────────────────────────────────── */
const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [facultyData, setFacultyData] = useState({ name: 'Faculty Name', email: 'faculty@example.com', subject: 'Subject', avatar: 'F' });
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [proctees, setProctees] = useState([]);
    const [students, setStudents] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [overdueProofs, setOverdueProofs] = useState([]);
    const [selectedProof, setSelectedProof] = useState(null);
    const [myRequests, setMyRequests] = useState([]);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [addType, setAddType] = useState('student');
    const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
    const [actionModal, setActionModal] = useState({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => { }, type: 'input' });
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [showLeaveHistory, setShowLeaveHistory] = useState(false);
    const [isMenteesOpen, setIsMenteesOpen] = useState(false);

    useEffect(() => {
        const handleOpenMentees = () => setIsMenteesOpen(true);
        window.addEventListener('open-mentees', handleOpenMentees);
        return () => window.removeEventListener('open-mentees', handleOpenMentees);
    }, []);

    const loadData = useCallback(() => {
        const pending = leaveService.getPendingForFaculty();
        setPendingRequests(pending);

        const all = leaveService.getAllRequests().filter(r => r.studentEmail !== (user?.email || ''));
        if (user) {
            const fu = db.getUserByEmail(user.email);
            if (fu) {
                const myProctees = (fu.proctees || []).map(e => e.toLowerCase());
                const myStudents = (fu.students || []).map(e => e.toLowerCase());
                setProctees(fu.proctees || []);
                setStudents(fu.students || []);

                // Only show students this faculty is responsible for
                setAllRequests(all.filter(r =>
                    myProctees.includes(r.studentEmail.toLowerCase()) ||
                    myStudents.includes(r.studentEmail.toLowerCase())
                ));
            }
            setMyRequests(leaveService.getMyRequests());
        }
        setOverdueProofs(leaveService.getOverdueOdProofs());
    }, [user]);

    useEffect(() => {
        if (user) setFacultyData({ name: user.name || 'Faculty Name', email: user.email || 'faculty@example.com', subject: user.subject || 'Subject', avatar: (user.name || 'F').charAt(0).toUpperCase() });
        loadData();
        const msg = new URLSearchParams(location.search).get('message');
        if (msg) { showNotification(`✅ ${msg}`); navigate('/faculty-dashboard', { replace: true }); }
    }, [user, loadData, location.search, navigate]);

    const showNotification = msg => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
    const handleLogout = () => { logout(); navigate('/'); };
    const handleApprove = (id, name) => { leaveService.facultyForwardToHod(id); showNotification(`✅ Approved for ${name}`); loadData(); };
    const handleReject = (id, name) => setActionModal({
        isOpen: true, title: 'Reject Request', message: `Reason for rejecting ${name}'s request:`, placeholder: 'e.g., Incomplete documentation', type: 'input',
        onConfirm: (reason) => { if (!reason) return; leaveService.facultyReject(id); showNotification(`❌ Rejected for ${name}`); loadData(); }
    });

    const addStudent = type => { setAddType(type); setIsAddStudentOpen(true); setIsStudentDetailsOpen(false); };

    const generateBulkPDF = (list, title) => {
        if (!list?.length) { showNotification(`⚠️ No ${title.toLowerCase()} to download.`); return; }
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFillColor(41, 128, 185); doc.rect(0, 0, 297, 40, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22);
        doc.text(`${title} List`, 148.5, 25, { align: 'center' });
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); let y = 55;
        doc.setFont('helvetica', 'bold');
        ['S.No', 'Register No', 'Name', 'Year', 'Department', 'Email'].forEach((h, i) => doc.text(h, [15, 30, 70, 130, 150, 200][i], y));
        y += 8; doc.line(15, y - 5, 282, y - 5); doc.setFont('helvetica', 'normal');
        list.forEach((email, idx) => {
            if (y > 180) { doc.addPage('l'); y = 20; }
            const s = db.getUsers().find(u => u.email === email && u.role === 'student');
            [String(idx + 1), s?.registerNo || 'N/A', s?.name || email, s?.year || 'N/A', s?.department || 'N/A', email].forEach((v, i) => doc.text(v, [15, 30, 70, 130, 150, 200][i], y));
            y += 8;
        });
        doc.save(`${title.replace(' ', '_')}_List.pdf`);
        setIsStudentDetailsOpen(false);
    };

    const removeStudent = type => {
        const fu = db.getUserByEmail(user.email); if (!fu) return;
        const list = type === 'proctee' ? (fu.proctees || []) : (fu.students || []);
        if (!list.length) { showNotification(`⚠️ No ${type}s to remove.`); return; }
        setActionModal({
            isOpen: true, title: `Remove ${type === 'proctee' ? 'Proctee' : 'Student'}`, message: `Enter the exact Mail ID of the ${type} to remove:`, placeholder: 'student@college.edu', type: 'input',
            onConfirm: sEmail => {
                const targetEmail = sEmail?.trim().toLowerCase();
                if (!targetEmail) return;
                const filtered = list.filter(e => e.toLowerCase() !== targetEmail);
                if (filtered.length === list.length) { showNotification(`⚠️ "${sEmail}" not found in your list.`); return; }
                if (type === 'proctee') { db.updateUser(fu.id, { proctees: filtered }); setProctees(filtered); }
                else { db.updateUser(fu.id, { students: filtered }); setStudents(filtered); }
                showNotification(`🗑️ ${sEmail} removed.`);
                setIsStudentDetailsOpen(false);
                loadData();
            }
        });
    };

    const getStatusBadge = status => {
        if (status === 'approved') return <span className="status-badge status-approved">✅ Approved</span>;
        if (status === 'rejected') return <span className="status-badge status-rejected">❌ Rejected</span>;
        return <span className="status-badge status-pending">⏳ Pending</span>;
    };

    return (
        <div className="bg-page">

            {/* ── SLIDE NAVIGATION DRAWER ── */}
            <NavDrawer
                isOpen={isNavOpen}
                onClose={() => setIsNavOpen(false)}
                facultyData={facultyData}
                onLogout={handleLogout}
                navigate={navigate}
                onTrackHistory={() => setShowLeaveHistory(true)}
            />

            {showLeaveHistory && (
                <LeaveHistoryModal
                    isOpen={showLeaveHistory}
                    onClose={() => setShowLeaveHistory(false)}
                    proctees={proctees}
                    students={students}
                />
            )}

            {/* Modals */}
            <StudentDetailsModal isOpen={isStudentDetailsOpen} onClose={() => setIsStudentDetailsOpen(false)} proctees={proctees} students={students} onAddStudent={addStudent} onRemoveStudent={removeStudent} onDownloadPDF={generateBulkPDF} />
            <MyMenteesModal isOpen={isMenteesOpen} onClose={() => setIsMenteesOpen(false)} facultyEmail={user?.email} />
            <AddStudentModal isOpen={isAddStudentOpen} onClose={() => { setIsAddStudentOpen(false); setIsStudentDetailsOpen(true); }} onSuccess={msg => { loadData(); showNotification(msg); setIsStudentDetailsOpen(true); }} type={addType} facultyEmail={user?.email} />
            <ActionModal {...actionModal} onClose={() => setActionModal(p => ({ ...p, isOpen: false }))} />
            <ActionModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} onConfirm={() => setIsStatsOpen(false)} title="Dashboard Notifications" type="info"
                message={`You have ${pendingRequests.length} pending requests and ${allRequests.filter(r => r.facultyStatus === 'approved').length} approved.${overdueProofs.length > 0 ? `\n\n⚠️ ${overdueProofs.length} students missing OD proofs.` : ''}`}
            />

            {/* ── TOP NAV ── */}
            <header className="topnav" style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
                <div className="topnav-inner">
                    <div className="topnav-brand" style={{ gap: '1rem' }}>
                        <img src={logo} alt="NEC Logo" style={{ height: '45px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="brand-text" style={{ color: '#fff', fontSize: '1.25rem', lineHeight: '1.2' }}>Nandha Engineering College</span>
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>FACULTY PORTAL</span>
                        </div>
                    </div>

                    <div className="topnav-actions">
                        {/* Notification bell */}
                        <button className="icon-btn notification-btn" onClick={() => setIsStatsOpen(true)} style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1.5px solid rgba(255, 255, 255, 0.3)'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            {(pendingRequests.length > 0 || overdueProofs.length > 0) && <span className="notification-dot" style={{ background: overdueProofs.length > 0 ? '#ef4444' : '#fbbf24' }}></span>}
                        </button>

                        {/* ☰ Hamburger menu */}
                        <button
                            className="nav-menu-btn"
                            onClick={() => setIsNavOpen(true)}
                            title="Menu"
                            aria-label="Open navigation menu"
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <span style={{ background: '#fff' }} />
                            <span style={{ background: '#fff' }} />
                            <span style={{ background: '#fff' }} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                {successMsg && (
                    <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#10b981', padding: '.75rem 1rem', borderRadius: '.5rem', marginBottom: '1.5rem', fontSize: '.875rem' }}>
                        {successMsg}
                    </div>
                )}

                {/* Faculty Info card */}
                <div className="info-row fade-in">
                    <div className="card faculty-card">
                        <div className="faculty-avatar">{facultyData.avatar}</div>
                        <div className="faculty-details">
                            <h1 className="faculty-name">{facultyData.name}</h1>
                            <div className="faculty-meta">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>
                                <span>{facultyData.subject}</span>
                            </div>
                            <div className="faculty-meta">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <span>{facultyData.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {[
                        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, cls: 'stat-icon-blue', val: students.length, label: 'Total Students', delay: '0ms' },
                        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>, cls: 'stat-icon-teal', val: proctees.length, label: 'Total Proctees', delay: '100ms' },
                        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, cls: 'stat-icon-amber', val: pendingRequests.length, label: 'Pending Requests', delay: '200ms' },
                        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, cls: 'stat-icon-purple', val: allRequests.filter(r => r.facultyStatus !== 'pending').length, label: 'Processed', delay: '300ms' },
                    ].map((s, i) => (
                        <div key={i} className="card stat-card fade-in" style={{ animationDelay: s.delay }}>
                            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                            <p className="stat-value">{s.val}</p>
                            <p className="stat-label">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Student Details entry card */}
                <div className="card fade-in" style={{ padding: '1.5rem', animationDelay: '150ms', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ margin: '0 0 .3rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>🎓 Student Details</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '.875rem' }}>Complete profiles — faculty-editable overview, live leave/OD + student-submitted internships, publications & certifications</p>
                        </div>
                        <button onClick={() => setIsStudentDetailsOpen(true)} style={{ background: 'linear-gradient(135deg,#1e40af,#0ea5e9)', color: '#fff', border: 'none', borderRadius: '.75rem', padding: '.75rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: '.5rem', boxShadow: '0 4px 12px rgba(14,165,233,.35)', transition: 'all .2s', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(14,165,233,.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,.35)'; }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            Student Details
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '.65rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {[
                            { dot: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', text: `${proctees.length} Proctees` },
                            { dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', text: `${students.length} Students` },
                            { dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', color: '#92400e', text: 'Live Leave & OD' },
                            { dot: '#8b5cf6', bg: '#faf5ff', border: '#e9d5ff', color: '#6d28d9', text: 'Student Certs & NPTEL' },
                            { dot: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', text: 'Student Internships & Pubs' },
                            { dot: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', color: '#065f46', text: '✏️ Faculty Editable Overview' },
                        ].map(c => (
                            <span key={c.text} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '999px', padding: '.28rem .8rem', fontSize: '.73rem', color: c.color, fontWeight: 600 }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }}></span>
                                {c.text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Leave/OD Requests Table */}
                <div className="card table-card fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="list-header">
                        <div className="list-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(35,95%,55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
                            <h2>Requests for Leave / OD</h2>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Reason</th>
                                    <th>Days</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allRequests.length === 0
                                    ? <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No requests found.</td></tr>
                                    : allRequests.slice(0, 10).map(req => {
                                        const days = req.fromDate && req.toDate ? Math.max(1, Math.ceil((new Date(req.toDate) - new Date(req.fromDate)) / 86400000) + 1) : 1;
                                        return (
                                            <tr key={req.id}>
                                                <td className="td-name">
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{req.studentName}</div>
                                                    <div style={{ fontSize: '.65rem', color: '#64748b', fontWeight: 500 }}>
                                                        <span className="type-badge" style={{ padding: '1px 4px', fontSize: '0.6rem', marginRight: '4px' }}>{req.type}</span>
                                                        {req.proctorEmail?.toLowerCase() === user.email.toLowerCase() && req.proctorStatus === 'pending' && <span style={{ color: '#059669' }}>• Proctor Approval</span>}
                                                        {req.classFacultyEmail?.toLowerCase() === user.email.toLowerCase() && req.proctorStatus === 'approved' && req.classFacultyStatus === 'pending' && <span style={{ color: '#2563eb' }}>• Class Faculty Approval</span>}
                                                    </div>
                                                </td>
                                                <td className="td-muted" title={req.reason}>{req.reason?.substring(0, 30)}{req.reason?.length > 30 ? '...' : ''}</td>
                                                <td>
                                                    <span style={{ fontWeight: 800, color: '#6366f1', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                        {days}d
                                                    </span>
                                                </td>
                                                <td className="td-muted">{new Date(req.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                <td className="td-muted">{new Date(req.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                <td>{
                                                    req.facultyStatus === 'approved'
                                                        ? <span className="status-badge status-approved">✅ Approved</span>
                                                        : req.proctorStatus === 'approved'
                                                            ? <span className="status-badge status-approved" style={{ background: '#dcfce7', color: '#166534' }}>Proctor Approved</span>
                                                            : getStatusBadge(req.facultyStatus)
                                                }</td>
                                                <td className="td-actions">
                                                    {pendingRequests.some(pr => pr.id === req.id)
                                                        ? <>
                                                            <button className="btn-approve" onClick={() => handleApprove(req.id, req.studentName)}>Approve</button>
                                                            <button className="btn-reject" onClick={() => handleReject(req.id, req.studentName)}>Reject</button>
                                                        </>
                                                        : req.odProof && (
                                                            <button className="btn-approve" style={{ background: '#0ea5e9', fontSize: '.7rem', padding: '.3rem .6rem' }}
                                                                onClick={() => setSelectedProof({ img: req.odProof, loc: req.odProofLocation, student: req.studentName, date: req.odProofUploadedAt })}>
                                                                Proof
                                                            </button>
                                                        )
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* My Leave/OD Status */}
                <div className="card table-card fade-in" style={{ marginTop: '2rem', animationDelay: '500ms' }}>
                    <div className="list-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                        <div className="list-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            <h2>My Leave / OD Status</h2>
                        </div>
                        <button onClick={() => navigate('/faculty-apply')} className="btn-approve" style={{ border: 'none', cursor: 'pointer' }}>Apply New</button>
                    </div>
                    <div className="table-wrapper">
                        {myRequests.length === 0
                            ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>You haven't submitted any requests yet.</div>
                            : (
                                <table>
                                    <thead><tr><th>Type</th><th>Period</th><th>HOD Status</th><th>Applied On</th></tr></thead>
                                    <tbody>
                                        {myRequests.map(req => (
                                            <tr key={req.id}>
                                                <td><span className={`badge ${req.type.toLowerCase().includes('leave') ? 'badge-amber' : 'badge-blue'}`}>{req.type}</span></td>
                                                <td>{req.fromDate} to {req.toDate}</td>
                                                <td>{getStatusBadge(req.hodStatus)}</td>
                                                <td style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{new Date(req.appliedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        }
                    </div>
                </div>

                {/* OD Proof Modal */}
                {selectedProof && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)', animation: 'fadeIn .2s ease' }} onClick={() => setSelectedProof(null)}>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', maxWidth: '500px', width: '90%', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,.1)' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedProof(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
                            <h3 style={{ marginBottom: '.5rem', color: '#0f172a' }}>OD Verification Proof</h3>
                            <p style={{ fontSize: '.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Submitted by <strong>{selectedProof.student}</strong> on {new Date(selectedProof.date).toLocaleString()}</p>
                            <div style={{ background: '#f8fafc', borderRadius: '.75rem', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                                <img src={selectedProof.img} alt="OD Proof" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${selectedProof.loc?.lat},${selectedProof.loc?.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem', borderRadius: '.5rem', background: '#eff6ff', color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '.875rem' }}>📍 View Location</a>
                                <button onClick={() => setSelectedProof(null)} style={{ flex: 1, padding: '.75rem', borderRadius: '.5rem', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer' }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FacultyDashboard;