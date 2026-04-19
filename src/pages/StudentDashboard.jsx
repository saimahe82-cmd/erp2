import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import db from '../services/api';
import videoStorage from '../services/videoStorage';
import AddStudentModal from '../components/AddStudentModal';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';

/* ══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/** Editable form field — text / date / email / tel / textarea / select */
const Field = ({ label, value, onChange, type = 'text', icon, readOnly = false, options = null }) => {
    const [focused, setFocused] = useState(false);
    const base = {
        width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.5rem',
        border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
        fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b',
        background: readOnly ? '#f8fafc' : '#fff', outline: 'none',
        transition: 'border-color 0.2s', boxSizing: 'border-box',
        cursor: readOnly ? 'not-allowed' : 'text',
    };
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.7rem', fontWeight: 600, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem',
            }}>
                {icon && <i className={`fas ${icon}`} style={{ color: '#94a3b8', fontSize: '0.65rem' }} />}
                {label}
            </label>
            {options ? (
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={readOnly}
                    style={{
                        ...base, appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem',
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                >
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            ) : type === 'textarea' ? (
                <textarea
                    rows={3}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    readOnly={readOnly}
                    style={{ ...base, resize: 'vertical', minHeight: '72px' }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            ) : type === 'image' ? (
                <div>
                    {value && (
                        <div style={{ position: 'relative', marginBottom: '0.5rem', display: 'inline-block' }}>
                            <img src={value} alt="Preview" style={{ height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e2e8f0', display: 'block' }} />
                            {!readOnly && (
                                <button type="button" onClick={() => onChange('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    )}
                    {!readOnly && (!value) && (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => onChange(reader.result);
                                    reader.readAsDataURL(file);
                                }
                            }}
                            style={{ ...base, padding: '0.4rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        />
                    )}
                </div>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    readOnly={readOnly}
                    style={base}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            )}
        </div>
    );
};

/** Detail section card wrapper */
const DetailSection = ({ title, icon, color = '#6366f1', children, badge }) => (
    <div style={{
        background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0',
        overflow: 'hidden', marginBottom: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
        <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${color}08, transparent)`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '9px',
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}25`,
                }}>
                    <i className={`fas ${icon}`} style={{ color, fontSize: '0.85rem' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{title}</span>
            </div>
            {badge && (
                <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '9999px',
                    background: `${color}15`, color, fontSize: '0.7rem', fontWeight: 600,
                }}>{badge}</span>
            )}
        </div>
        <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
);

/** Dynamic list editor — add / remove / edit rows */
const ListEditor = ({ items, setItems, fields, addLabel, color = '#6366f1' }) => {
    const addItem = () => {
        const empty = {};
        fields.forEach(f => { empty[f.key] = f.type === 'select' ? (f.options?.[0]?.value || '') : ''; });
        setItems([...items, empty]);
    };
    const removeItem = idx => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx, key, val) =>
        setItems(items.map((item, i) => i === idx ? { ...item, [key]: val } : item));

    return (
        <div>
            {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                    <i className="fas fa-plus-circle" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }} />
                    No entries yet. Click below to add.
                </div>
            )}
            {items.map((item, idx) => (
                <div key={idx} style={{
                    background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem 1rem 0.25rem',
                    border: '1px solid #f1f5f9', marginBottom: '0.875rem', position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', top: '-10px', left: '14px',
                        background: color, color: '#fff', borderRadius: '9999px',
                        padding: '0.1rem 0.55rem', fontSize: '0.65rem', fontWeight: 700,
                    }}>#{idx + 1}</div>
                    <button onClick={() => removeItem(idx)} style={{
                        position: 'absolute', top: '0.625rem', right: '0.625rem',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                        color: '#ef4444', borderRadius: '6px', padding: '0.2rem 0.5rem',
                        cursor: 'pointer', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontFamily: 'inherit',
                    }}>
                        <i className="fas fa-trash-alt" style={{ fontSize: '0.58rem' }} /> Remove
                    </button>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '0 1rem', marginTop: '0.75rem',
                    }}>
                        {fields.map(f => (
                            <Field
                                key={f.key}
                                label={f.label}
                                icon={f.icon}
                                value={item[f.key] || ''}
                                onChange={v => updateItem(idx, f.key, v)}
                                type={f.type || 'text'}
                                options={f.options}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <button
                onClick={addItem}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '0.5rem',
                    border: `1.5px dashed ${color}55`, background: `${color}08`,
                    color, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'inherit', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}14`}
                onMouseLeave={e => e.currentTarget.style.background = `${color}08`}
            >
                <i className="fas fa-plus" style={{ fontSize: '0.7rem' }} /> {addLabel}
            </button>
        </div>
    );
};

/** Specialized Table Editor for compact list data (e.g. Courses) */
const TableEditor = ({ items, setItems, fields, addLabel, color = '#6366f1' }) => {
    const addItem = () => {
        const empty = {};
        fields.forEach(f => {
            empty[f.key] = f.type === 'select' ? (f.options?.[0]?.value || '') : '';
        });
        setItems([...items, empty]);
    };
    const removeItem = idx => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx, key, val) =>
        setItems(items.map((item, i) => i === idx ? { ...item, [key]: val } : item));

    const thStyle = {
        padding: '0.75rem 0.5rem', fontSize: '0.65rem', fontWeight: 700,
        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '2px solid #f1f5f9', textAlign: 'left', background: '#f8fafc'
    };

    const inputStyle = {
        width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.375rem',
        border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none',
        transition: 'all 0.2s', background: '#fff', fontFamily: 'inherit'
    };

    return (
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
                        {fields.map(f => (
                            <th key={f.key} style={thStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {f.icon && <i className={`fas ${f.icon}`} style={{ fontSize: '0.7rem', opacity: 0.5 }} />}
                                    {f.label}
                                </div>
                            </th>
                        ))}
                        <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={fields.length + 2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                No entries yet. Click "Add Course" below.
                            </td>
                        </tr>
                    ) : items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfd' }}>
                            <td style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</td>
                            {fields.map(f => (
                                <td key={f.key} style={{ padding: '0.5rem' }}>
                                    {f.renderIf && !f.renderIf(item) ? (
                                        <div style={{ textAlign: 'center', color: '#cbd5e1' }}>-</div>
                                    ) : f.type === 'select' ? (
                                        <select
                                            value={item[f.key] || ''}
                                            onChange={e => updateItem(idx, f.key, e.target.value)}
                                            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                                        >
                                            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={f.type || 'text'}
                                            value={item[f.key] || ''}
                                            onChange={e => updateItem(idx, f.key, e.target.value)}
                                            placeholder={f.label}
                                            style={inputStyle}
                                            onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 2px ${color}15`; }}
                                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    )}
                                </td>
                            ))}
                            <td style={{ textAlign: 'center' }}>
                                <button
                                    onClick={() => removeItem(idx)}
                                    style={{
                                        background: 'none', border: 'none', color: '#ef4444',
                                        cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem',
                                        transition: 'all 0.2s', borderRadius: '0.375rem'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    title="Delete row"
                                >
                                    <i className="fas fa-trash-alt" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                onClick={addItem}
                style={{
                    marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                    border: `1.5px dashed ${color}55`, background: `${color}08`,
                    color, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
                onMouseLeave={e => e.currentTarget.style.background = `${color}08`}
            >
                <i className="fas fa-plus" /> {addLabel}
            </button>
        </div>
    );
};



/* ══════════════════════════════════════════════════════════════
   PAGE 1 — DASHBOARD VIEW
══════════════════════════════════════════════════════════════ */
const DashboardView = ({ user, setActivePage }) => {
    const [stats, setStats] = useState({ balance: 12, approved: 0, pending: 0, rejected: 0 });
    const [requests, setRequests] = useState([]);
    const [quickForm, setQuickForm] = useState({ leaveType: 'sick', fromDate: '', toDate: '' });
    const [successMsg, setSuccessMsg] = useState('');
    const [showProfile, setShowProfile] = useState(false);

    const loadData = useCallback(() => {
        setStats(leaveService.getMyStats());
        setRequests(leaveService.getMyRequests());
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleQuickApply = (e) => {
        e.preventDefault();
        if (!quickForm.fromDate || !quickForm.toDate) return;
        const result = leaveService.applyLeave({
            leaveType: quickForm.leaveType,
            fromDate: quickForm.fromDate,
            toDate: quickForm.toDate,
            reason: `Quick ${quickForm.leaveType} leave request`,
        }, user);
        if (result.success) {
            setSuccessMsg('Leave request submitted successfully!');
            setQuickForm({ leaveType: 'sick', fromDate: '', toDate: '' });
            loadData();
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    // ── OD Completion Tracker ──
    const [completionModalReqId, setCompletionModalReqId] = useState(null);
    const [completionData, setCompletionData] = useState({ prize: '', photoBase64: null, certBase64: null, location: null, photoName: '', certName: '' });
    const [isSubmittingOD, setIsSubmittingOD] = useState(false);

    const submitODCompletion = () => {
        if (!completionData.photoBase64) {
            alert('Geotag Photo is strictly required.');
            return;
        }

        setIsSubmittingOD(true);

        const execUpload = (coords) => {
            leaveService.uploadOdProof(completionModalReqId, {
                file: completionData.photoBase64,
                location: coords,
                certificate: completionData.certBase64,
                prize: completionData.prize
            });
            setSuccessMsg('OD Evidences successfully locked & verified!');
            setCompletionModalReqId(null);
            setCompletionData({ prize: '', photoBase64: null, certBase64: null, location: null, photoName: '', certName: '' });
            setIsSubmittingOD(false);
            loadData();
            setTimeout(() => setSuccessMsg(''), 4000);
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => execUpload({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { alert('Failed to pull Location context! Ensure location permissions are active.'); setIsSubmittingOD(false); }
            );
        } else {
            alert('Geolocation strictly unavailable upon this platform.');
            setIsSubmittingOD(false);
        }
    };

    const handleODFileUpload = (e, targetProperty) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setCompletionData(prev => ({
                ...prev,
                [`${targetProperty}Base64`]: reader.result,
                [`${targetProperty}Name`]: file.name
            }));
        };
        reader.readAsDataURL(file);
    };

    const formatShortDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDuration = (from, to) => {
        const diff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
        return diff === 1 ? '1 Day' : `${diff} Days`;
    };

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved': return { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: 'fa-check-circle' };
            case 'rejected': return { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: 'fa-times-circle' };
            default: return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'fa-clock' };
        }
    };

    const getLeaveTypeIcon = (type) => {
        if (type?.includes('Sick')) return { icon: 'fa-briefcase-medical', color: '#ef4444' };
        if (type?.includes('On-Duty') || type?.includes('OD')) return { icon: 'fa-building', color: '#6366f1' };
        if (type?.includes('Personal')) return { icon: 'fa-user', color: '#f59e0b' };
        if (type?.includes('Emergency')) return { icon: 'fa-exclamation-triangle', color: '#dc2626' };
        return { icon: 'fa-calendar', color: '#3b82f6' };
    };

    const balancePct = Math.round((stats.balance / 12) * 100);

    const s = {
        topBar: {
            background: '#fff', borderBottom: '1px solid #e2e8f0',
            padding: '1.25rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            zIndex: 10,
        },
        content: { padding: '2rem 2.5rem' },
        statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.25rem', marginBottom: '2rem' },
        statCard: {
            background: '#fff', borderRadius: '1rem', padding: '1.5rem',
            border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
        statGlow: (color) => ({
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: color, opacity: 0.06, filter: 'blur(20px)',
        }),
        gridMain: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' },
        tableCard: {
            background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
        tableHead: {
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        },
        quickCard: {
            background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
        quickHeader: {
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
        },
        avatar: {
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
        },
    };

    const hoverCard = (e, enter) => {
        e.currentTarget.style.transform = enter ? 'translateY(-2px)' : 'translateY(0)';
        e.currentTarget.style.boxShadow = enter ? '0 8px 25px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)';
    };

    return (
        <>
            {/* Top Bar */}
            <div style={{ ...s.topBar, height: '80px', padding: '0 2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <img src={logo} alt="NEC Logo" style={{ height: '50px' }} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', margin: 0 }}>
                            Nandha Engineering College
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.125rem', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
                            STUDENT PORTAL
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b',
                    }}>
                        <i className="fas fa-calendar-day" />
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{
                        padding: '0.5rem 0.875rem', borderRadius: '0.5rem',
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        fontSize: '0.8rem', fontWeight: 500, color: '#6366f1',
                    }}>
                        {user?.department || 'CSE'} · Year {user?.year || 'III'}
                    </div>
                </div>
            </div>

            <div style={s.content}>
                {/* Success Message */}
                {successMsg && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))',
                        border: '1px solid rgba(16,185,129,0.2)', color: '#059669',
                        padding: '1rem 1.25rem', borderRadius: '0.75rem',
                        marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'rgba(16,185,129,0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <i className="fas fa-check" style={{ fontSize: '0.75rem' }} />
                        </div>
                        {successMsg}
                    </div>
                )}

                {/* Profile Panel */}
                {showProfile && (
                    <div style={{
                        background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0',
                        padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ ...s.avatar, width: '56px', height: '56px', fontSize: '1.125rem', borderRadius: '16px' }}>
                                {getInitials(user?.name)}
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>{user?.name}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</p>
                            </div>
                            <button onClick={() => setShowProfile(false)} style={{
                                marginLeft: 'auto', background: 'none', border: 'none',
                                color: '#94a3b8', cursor: 'pointer', fontSize: '1rem',
                            }}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {[
                                { label: 'Register No', value: user?.registerNo, icon: 'fa-id-badge' },
                                { label: 'Department', value: user?.department, icon: 'fa-building-columns' },
                                { label: 'Year', value: user?.year, icon: 'fa-calendar-alt' },
                                { label: 'Phone', value: user?.phone, icon: 'fa-phone' },
                            ].map((item, i) => (
                                <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <i className={`fas ${item.icon}`} style={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{item.label}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>
                        {/* My Details Button */}
                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                onClick={() => { setShowProfile(false); setActivePage('mydetails'); }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
                            >
                                <i className="fas fa-id-card" style={{ fontSize: '0.8rem' }} />
                                My Details
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Analysis Banner */}
                <div style={{ marginBottom: '1.75rem' }}>
                    <Link to="/student-analysis" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                        padding: '1.5rem 2rem', borderRadius: '1rem',
                        textDecoration: 'none', color: '#fff',
                        boxShadow: '0 8px 25px rgba(139,92,246,0.3)',
                        transition: 'transform 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <i className="fas fa-sparkles" style={{ color: '#fde047' }} /> AI Profile Analysis
                            </h2>
                            <p style={{ margin: '0.35rem 0 0 0', opacity: 0.95, fontSize: '0.9rem', fontWeight: 500 }}>
                                Discover your strengths, hidden interests, and get personalized insights based on your academic journey!
                            </p>
                        </div>
                        <div style={{
                            background: '#fff', color: '#8b5cf6', padding: '0.75rem 1.5rem',
                            borderRadius: '9999px', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                            See Your Analysis <i className="fas fa-arrow-right" />
                        </div>
                    </Link>
                </div>

                {/* ── Stats Cards ── */}
                <div style={s.statsRow}>
                    {/* Leave Balance — circular progress */}
                    <div
                        style={{ ...s.statCard, display: 'flex', alignItems: 'center', gap: '1.25rem' }}
                        onMouseEnter={e => hoverCard(e, true)}
                        onMouseLeave={e => hoverCard(e, false)}
                    >
                        <div style={s.statGlow('#6366f1')} />
                        <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="32" cy="32" r="27" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                                <circle cx="32" cy="32" r="27" fill="none" stroke="url(#gradBalance)" strokeWidth="5"
                                    strokeDasharray={2 * Math.PI * 27}
                                    strokeDashoffset={2 * Math.PI * 27 - (balancePct / 100) * 2 * Math.PI * 27}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                />
                                <defs>
                                    <linearGradient id="gradBalance" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#6366f1' }}>
                                {stats.balance}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leave Balance</div>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1e293b', marginTop: '0.125rem' }}>
                                {stats.balance} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>/ 12 days</span>
                            </div>
                        </div>
                    </div>
                    {/* Approved */}
                    <div style={s.statCard} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
                        <div style={s.statGlow('#10b981')} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '1.125rem' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginTop: '1rem' }}>{String(stats.approved).padStart(2, '0')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Total approved leaves</div>
                    </div>

                    {/* Pending */}
                    <div style={s.statCard} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
                        <div style={s.statGlow('#f59e0b')} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <i className="fas fa-clock" style={{ color: '#f59e0b', fontSize: '1.125rem' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginTop: '1rem' }}>{String(stats.pending).padStart(2, '0')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Awaiting approval</div>
                    </div>

                    {/* Rejected */}
                    <div style={s.statCard} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
                        <div style={s.statGlow('#ef4444')} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <i className="fas fa-times-circle" style={{ color: '#ef4444', fontSize: '1.125rem' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginTop: '1rem' }}>{String(stats.rejected).padStart(2, '0')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Declined requests</div>
                    </div>
                </div>

                {/* ── Main Grid: Table + Quick Apply ── */}
                <div style={s.gridMain}>
                    {/* Requests Table */}
                    <div style={s.tableCard}>
                        <div style={s.tableHead}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Recent Requests</h3>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>Your latest leave & OD applications</p>
                            </div>
                            <Link to="/apply-leave" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', fontSize: '0.8rem', fontWeight: 600,
                                textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                            }}>
                                <i className="fas fa-plus" style={{ fontSize: '0.7rem' }} />
                                New Request
                            </Link>
                        </div>
                        <div>
                            {requests.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '2px dashed #e2e8f0' }}>
                                        <i className="fas fa-inbox" style={{ fontSize: '1.5rem', color: '#cbd5e1' }} />
                                    </div>
                                    <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>No requests yet</p>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Apply for your first leave to see it here</p>
                                </div>
                            ) : (
                                requests.slice(0, 6).map((req, idx) => {
                                    const statusCfg = getStatusConfig(req.status);
                                    const typeCfg = getLeaveTypeIcon(req.type);
                                    return (
                                        <div key={req.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '1rem 1.5rem',
                                            borderBottom: idx < Math.min(requests.length, 6) - 1 ? '1px solid #f1f5f9' : 'none',
                                            transition: 'background 0.15s ease', cursor: 'default',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafbfd'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Type icon */}
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${typeCfg.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${typeCfg.color}22` }}>
                                                <i className={`fas ${typeCfg.icon}`} style={{ color: typeCfg.color, fontSize: '0.875rem' }} />
                                            </div>
                                            {/* Details */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {(() => {
                                                        if (req.type.toLowerCase().includes('od')) {
                                                            if (req.reason?.includes('Event Type:')) {
                                                                const typeStr = req.reason.split('\n').find(l => l.startsWith('Event Type:'))?.replace('Event Type:', '').trim();
                                                                if (typeStr && typeStr !== '-') return typeStr;
                                                            }
                                                            if (req.odType) {
                                                                if (req.odType.toLowerCase().includes('event')) return 'Event';
                                                                if (req.odType.toLowerCase().includes('project')) return 'Project';
                                                                if (req.odType.toLowerCase().includes('sport')) return 'Sports';
                                                                if (req.odType.toLowerCase().includes('internship')) return 'Internship';
                                                                if (req.odType.toLowerCase().includes('paper')) return 'Paper Presentation';
                                                                return req.odType.split('-').pop().trim();
                                                            }
                                                            return 'On-Duty';
                                                        }
                                                        return req.type;
                                                    })()}
                                                    {req.odCertificate && (
                                                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                            <i className="fas fa-file-circle-check" /> Cert Submitted
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                                                    {formatShortDate(req.fromDate)} — {formatShortDate(req.toDate)} · {getDuration(req.fromDate, req.toDate)}
                                                </div>
                                            </div>
                                            {/* Approval stepper */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }} title={`Faculty: ${req.facultyStatus} → HOD: ${req.hodStatus}`}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.6rem', background: req.facultyStatus === 'approved' ? '#10b981' : req.facultyStatus === 'rejected' ? '#ef4444' : '#e2e8f0', color: req.facultyStatus === 'pending' ? '#94a3b8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                    {req.facultyStatus === 'approved' ? '✓' : req.facultyStatus === 'rejected' ? '✕' : 'F'}
                                                </div>
                                                <div style={{ width: '16px', height: '2px', background: req.facultyStatus === 'approved' ? '#10b981' : '#e2e8f0', borderRadius: '1px' }} />
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.6rem', background: req.hodStatus === 'approved' ? '#10b981' : req.hodStatus === 'rejected' ? '#ef4444' : '#e2e8f0', color: req.hodStatus === 'pending' ? '#94a3b8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                    {req.hodStatus === 'approved' ? '✓' : req.hodStatus === 'rejected' ? '✕' : 'H'}
                                                </div>
                                            </div>
                                            {/* Status badge */}
                                            <div style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: statusCfg.bg, color: statusCfg.color, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <i className={`fas ${statusCfg.icon}`} style={{ fontSize: '0.6rem' }} />
                                                {statusCfg.label}
                                            </div>
                                            {/* OD Verify button */}
                                            {req.status === 'approved' && (req.type.toLowerCase() === 'od' || req.type.toLowerCase() === 'on-duty' || req.type.toLowerCase().includes('od')) && !req.odProof && (
                                                <div style={{ display: 'inline-block' }}>
                                                    <button
                                                        onClick={() => setCompletionModalReqId(req.id)}
                                                        style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: '#f97316', color: '#fff', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.3rem', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}
                                                        title="Provide Evidence to Complete OD"
                                                    >
                                                        <i className="fas fa-camera" style={{ fontSize: '0.6rem' }} /> Complete OD
                                                    </button>
                                                </div>
                                            )}

                                            {/* Medical Certificate Upload */}
                                            {req.status === 'approved' && req.leaveType === 'medical' && (
                                                <div style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
                                                    {req.medicalCertificate ? (
                                                        <div style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                            <i className="fas fa-file-circle-check" /> Certificate Submitted
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,image/*"
                                                                id={`med-cert-upload-${req.id}`}
                                                                style={{ display: 'none' }}
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        leaveService.uploadMedicalCertificate(req.id, reader.result);
                                                                        setSuccessMsg('Medical certificate submitted successfully!');
                                                                        loadData();
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => document.getElementById(`med-cert-upload-${req.id}`).click()}
                                                                style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                                            >
                                                                <i className="fas fa-upload" /> Pending Certificate
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Apply Panel */}
                    <div style={s.quickCard}>
                        <div style={s.quickHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-bolt" style={{ fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Quick Apply</h3>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Fast-track your request</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleQuickApply}>
                                {/* Leave type buttons */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leave Type</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[
                                            { value: 'sick', label: 'Sick', icon: 'fa-briefcase-medical' },
                                            { value: 'personal', label: 'Personal', icon: 'fa-user' },
                                            { value: 'od', label: 'On-Duty', icon: 'fa-building' },
                                        ].map((opt) => (
                                            <button key={opt.value} type="button"
                                                onClick={() => setQuickForm({ ...quickForm, leaveType: opt.value })}
                                                style={{
                                                    flex: 1, padding: '0.625rem 0.5rem', borderRadius: '0.5rem',
                                                    border: quickForm.leaveType === opt.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                                    background: quickForm.leaveType === opt.value ? 'rgba(99,102,241,0.05)' : '#fff',
                                                    color: quickForm.leaveType === opt.value ? '#6366f1' : '#64748b',
                                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
                                                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                                                }}>
                                                <i className={`fas ${opt.icon}`} style={{ fontSize: '0.875rem' }} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Date range */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    {[
                                        { key: 'fromDate', label: 'From' },
                                        { key: 'toDate', label: 'To' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                                            <input type="date" required value={quickForm[key]}
                                                onChange={e => setQuickForm({ ...quickForm, [key]: e.target.value })}
                                                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontFamily: 'inherit', color: '#1e293b', background: '#fff', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Day Display */}
                                {quickForm.fromDate && quickForm.toDate && (
                                    <div style={{ marginBottom: '1.25rem', textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>
                                            Duration: {getDuration(quickForm.fromDate, quickForm.toDate)}
                                        </span>
                                    </div>
                                )}
                                {!quickForm.fromDate || !quickForm.toDate ? <div style={{ marginBottom: '1.25rem' }} /> : null}
                                <button type="submit" style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.625rem',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
                                >
                                    <i className="fas fa-paper-plane" style={{ fontSize: '0.8rem' }} />
                                    Submit Request
                                </button>
                            </form>

                            {/* Quick Actions */}
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Quick Actions</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {[
                                        { to: '/apply-leave', icon: 'fa-file-medical', color: '#10b981', label: 'Detailed Leave Form' },
                                        { to: '/apply-od', icon: 'fa-briefcase', color: '#6366f1', label: 'On-Duty Application' },
                                    ].map(item => (
                                        <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', textDecoration: 'none', color: '#475569', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s ease', background: '#fafbfd' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fafbfd'; }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${item.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className={`fas ${item.icon}`} style={{ fontSize: '0.7rem', color: item.color }} />
                                            </div>
                                            {item.label}
                                            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#cbd5e1' }} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OD COMPLETION MODAL */}
            {completionModalReqId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '1.25rem', width: '90%', maxWidth: '450px',
                        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-clipboard-check" style={{ color: '#0ea5e9' }} /> Complete OD Request
                            </h2>
                            <button onClick={() => { setCompletionModalReqId(null); setCompletionData({ prize: '', photoBase64: null, certBase64: null, location: null, photoName: '', certName: '' }); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>
                                &times;
                            </button>
                        </div>
                        {(() => {
                            const req = requests.find(r => r.id === completionModalReqId);
                            const isEvent = req?.odType === 'Event' || (req?.reason && req.reason.toLowerCase().includes('event'));

                            return (
                                <>
                                    {isEvent && (
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Prize Won?</label>
                                            <select
                                                value={completionData.prize}
                                                onChange={(e) => setCompletionData(p => ({ ...p, prize: e.target.value }))}
                                                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                                            >
                                                <option value="">Select an Option...</option>
                                                <option value="First">First</option>
                                                <option value="Second">Second</option>
                                                <option value="Third">Third</option>
                                                <option value="Participation">Participation</option>
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Live Geotag Photo (Required)</label>
                                        <input type="file" accept="image/*" id="photo-geotag-input" style={{ display: 'none' }} onChange={(e) => handleODFileUpload(e, 'photo')} />
                                        <button onClick={() => document.getElementById('photo-geotag-input').click()} style={{ padding: '0.6rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#334155', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-camera" /> {completionData.photoName ? completionData.photoName : 'Upload Photo'}
                                        </button>
                                        <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center' }}>Location verified automatically upon submission.</p>
                                    </div>

                                    {isEvent && (
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Certificate (Optional)</label>
                                            <input type="file" accept=".pdf,image/*" id="cert-upload-input" style={{ display: 'none' }} onChange={(e) => handleODFileUpload(e, 'cert')} />
                                            <button onClick={() => document.getElementById('cert-upload-input').click()} style={{ padding: '0.6rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#334155', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <i className="fas fa-award" /> {completionData.certName ? completionData.certName : 'Attach Certificate'}
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={submitODCompletion}
                                        disabled={isSubmittingOD}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', border: 'none', fontWeight: 700, cursor: isSubmittingOD ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
                                    >
                                        {isSubmittingOD ? 'Verifying & Syncing...' : 'Finalize OD Request'}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
};

/* ══════════════════════════════════════════════════════════════
   PAGE 2 — MY DETAILS VIEW
══════════════════════════════════════════════════════════════ */
const MyDetailsView = ({ user, setActivePage }) => {
    const [saved, setSaved] = useState(false);
    const [stats, setStats] = useState({ balance: 12, approved: 0, pending: 0, rejected: 0 });

    /* --- Unified Storage Hook --- */
    const EXTRA_KEY = `stu_extra_${user?.email}`;

    // Load initial data
    const [extra, setExtra] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(EXTRA_KEY) || '{}');
            return {
                phone: stored.phone || '',
                bloodGroup: stored.bloodGroup || '',
                address: stored.address || '',
                parentName: stored.parentName || '',
                parentPhone: stored.parentPhone || '',
                cgpa: stored.cgpa || '',
                attendance: stored.attendance || '',
                section: stored.section || user?.section || '',
                notes: stored.notes || '',
                internships: stored.internships || [],
                publications: stored.publications || [],
                patents: stored.patents || [], // Optional for faculty view but saved here
                certifications: stored.certifications || {
                    nptel: [],
                    pattern: [], // We'll map patents here for faculty pattern view
                    vertical: [],
                    others: []
                },
                fatherName: stored.fatherName || '',
                fatherPhone: stored.fatherPhone || '',
                motherName: stored.motherName || '',
                motherPhone: stored.motherPhone || '',
                caste: stored.caste || '',
                community: stored.community || '',
                sslcSchool: stored.sslcSchool || '',
                sslcPlace: stored.sslcPlace || '',
                sslcGained: stored.sslcGained || '',
                sslcTotal: stored.sslcTotal || '',
                hscSchool: stored.hscSchool || '',
                hscPlace: stored.hscPlace || '',
                hscGained: stored.hscGained || '',
                hscTotal: stored.hscTotal || '',
                diplomaSchool: stored.diplomaSchool || '',
                diplomaPlace: stored.diplomaPlace || '',
                diplomaGained: stored.diplomaGained || '',
                diplomaTotal: stored.diplomaTotal || '',
                diplomaApplicable: stored.diplomaApplicable || false,
                currentSemester: stored.currentSemester || '',
                fatherOccupation: stored.fatherOccupation || '',
                fatherIncome: stored.fatherIncome || '',
                motherOccupation: stored.motherOccupation || '',
                motherIncome: stored.motherIncome || '',
                siblings: stored.siblings || [],
                leetcode: stored.leetcode || '',
                linkedin: stored.linkedin || '',
                github: stored.github || '',
                semesterGPAs: (() => {
                    const base = stored.semesterGPAs || {};
                    const result = {};
                    ['sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8'].forEach(s => {
                        if (typeof base[s] === 'object' && base[s] !== null) {
                            result[s] = {
                                gpa: base[s].gpa || '',
                                courses: base[s].courses || [],
                                labCourses: base[s].labCourses || [],
                                marksheet: base[s].marksheet || null, // Base64 string
                                marksheetName: base[s].marksheetName || ''
                            };
                        } else {
                            result[s] = { gpa: base[s] || '', courses: [], labCourses: [], marksheet: null, marksheetName: '' };
                        }
                    });
                    return result;
                })(),
                gender: stored.gender || '',
            };
        } catch {
            return {
                phone: '', bloodGroup: '', address: '', parentName: '', parentPhone: '',
                cgpa: '', attendance: '', section: '', notes: '',
                internships: [], publications: [], patents: [],
                certifications: { nptel: [], pattern: [], vertical: [], others: [] },
                fatherName: '', fatherPhone: '', motherName: '', motherPhone: '',
                caste: '', community: '',
                sslcSchool: '', sslcPlace: '', sslcGained: '', sslcTotal: '',
                hscSchool: '', hscPlace: '', hscGained: '', hscTotal: '',
                diplomaSchool: '', diplomaPlace: '', diplomaGained: '', diplomaTotal: '', diplomaApplicable: false,
                currentSemester: '',
                fatherOccupation: '', fatherIncome: '', motherOccupation: '', motherIncome: '',
                siblings: [],
                leetcode: '', linkedin: '', github: '',
                gender: '',
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
            };
        }
    });

    // Helper to update specific sub-objects
    const updateExtra = (section, val) => {
        setExtra(prev => ({ ...prev, [section]: val }));
    };

    // Helper for certifications specifically
    const updateCert = (key, val) => {
        setExtra(prev => ({
            ...prev,
            certifications: { ...prev.certifications, [key]: val }
        }));
    };

    useEffect(() => { setStats(leaveService.getMyStats()); }, []);

    const allLeaves = leaveService.getMyRequests?.() || [];
    const leaveOnly = allLeaves.filter(r => !r.type?.toLowerCase().includes('od') && !r.type?.toLowerCase().includes('on-duty'));
    const odOnly = allLeaves.filter(r => r.type?.toLowerCase().includes('od') || r.type?.toLowerCase().includes('on-duty'));

    const leaveDaysUsed = leaveOnly
        .filter(r => r.status === 'approved')
        .reduce((acc, r) => acc + Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1, 0);

    const odDaysUsed = odOnly
        .filter(r => r.status === 'approved')
        .reduce((acc, r) => acc + Math.ceil((new Date(r.toDate) - new Date(r.fromDate)) / 86400000) + 1, 0);

    const handleSave = () => {
        localStorage.setItem(EXTRA_KEY, JSON.stringify(extra));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    /* Reusable history table */
    const HistoryTable = ({ rows, emptyMsg }) => (
        <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.6fr 1fr', background: '#f8fafc', padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                {['Type / Purpose', 'From', 'To', 'Days', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
            </div>
            {rows.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.825rem' }}>{emptyMsg}</div>
            ) : rows.map((req, i) => {
                const days = Math.ceil((new Date(req.toDate) - new Date(req.fromDate)) / 86400000) + 1;
                const sc = {
                    approved: ['#059669', 'rgba(16,185,129,0.1)'],
                    rejected: ['#dc2626', 'rgba(239,68,68,0.1)'],
                    pending: ['#d97706', 'rgba(245,158,11,0.1)'],
                }[req.status] || ['#64748b', '#f1f5f9'];
                return (
                    <div key={req.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.6fr 1fr', padding: '0.75rem 1rem', borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfd', fontSize: '0.825rem', color: '#334155' }}>
                        <div style={{ fontWeight: 500 }}>{req.reason || req.type}</div>
                        <div>{new Date(req.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                        <div>{new Date(req.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                        <div style={{ fontWeight: 600 }}>{days}</div>
                        <div>
                            <span style={{ padding: '0.15rem 0.6rem', borderRadius: '9999px', background: sc[1], color: sc[0], fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {req.status}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Top Bar */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #e2e8f0', padding: '1.125rem 2.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <button
                        onClick={() => setActivePage('dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'inherit' }}
                    >
                        <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} /> Back
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>My Details</h1>
                        <p style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '1px' }}>Academic & personal profile — all fields editable</p>
                    </div>
                </div>
                <button onClick={handleSave} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 1.375rem', borderRadius: '0.625rem',
                    background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.3s ease',
                }}>
                    <i className={`fas ${saved ? 'fa-check' : 'fa-floppy-disk'}`} style={{ fontSize: '0.8rem' }} />
                    {saved ? 'Saved!' : 'Save All Changes'}
                </button>
            </div>

            <div style={{ padding: '2rem 2.5rem', maxWidth: '980px' }}>

                {/* Stats Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
                    {[
                        { label: 'Leave Balance', value: stats.balance ?? 12, sub: 'days left', icon: 'fa-calendar-check', color: '#6366f1' },
                        { label: 'Leave Days Used', value: leaveDaysUsed, sub: 'approved leaves', icon: 'fa-calendar-minus', color: '#f59e0b' },
                        { label: 'OD Days', value: odDaysUsed, sub: 'approved OD days', icon: 'fa-building', color: '#10b981' },
                        { label: 'Pending', value: stats.pending ?? 0, sub: 'awaiting approval', icon: 'fa-clock', color: '#ef4444' },
                    ].map((st, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.125rem 1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-14px', right: '-14px', width: '60px', height: '60px', borderRadius: '50%', background: st.color, opacity: 0.07, filter: 'blur(14px)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${st.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className={`fas ${st.icon}`} style={{ color: st.color, fontSize: '0.78rem' }} />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{st.label}</span>
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{String(st.value).padStart(2, '0')}</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>{st.sub}</div>
                        </div>
                    ))}
                </div>

                {/* ── 1. Personal Details ── */}
                <DetailSection title="Personal Details" icon="fa-user-circle" color="#6366f1">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
                        <Field label="Full Name" icon="fa-user" value={user?.name} readOnly />
                        <Field label="Register Number" icon="fa-id-badge" value={extra.registerNo} onChange={v => updateExtra('registerNo', v)} />
                        <Field label="Email" icon="fa-envelope" value={user?.email} readOnly />
                        <Field label="Personal Email" icon="fa-envelope" type="tel" value={extra.personalEmail} onChange={v => updateExtra('personalEmail', v)} />
                        <Field label="Phone" icon="fa-phone" type="tel" value={extra.phone} onChange={v => updateExtra('phone', v)} />
                        <Field label="Department" icon="fa-building-columns" value={user?.department} readOnly />
                        <Field label="Vertical" icon="fa-network-wired" value={extra.vertical || user?.vertical || ''} onChange={v => updateExtra('vertical', v)} options={[{ value: '', label: '— Select —' }, { value: 'CIC lab', label: 'CIC lab' }, { value: 'RIC lab', label: 'RIC lab' }, { value: 'Gen AI lab', label: 'Gen AI lab' }, { value: 'Creation lab', label: 'Creation lab' }, { value: 'AR/VR lab', label: 'AR/VR lab' }]} />
                        <Field label="Year" icon="fa-calendar-alt" value={user?.year} readOnly />
                        <Field label="Section" icon="fa-layer-group" value={extra.section} onChange={v => updateExtra('section', v)}
                            options={[{ value: '', label: '— Select —' }, ...['A', 'B', 'C', 'D'].map(s => ({ value: s, label: `Section ${s}` }))]}
                        />
                        <Field label="CGPA" icon="fa-chart-line" value={extra.cgpa} readOnly placeholder="Calculated from semesters" />
                        <Field label="Attendance %" icon="fa-user-check" type="number" value={extra.attendance} onChange={v => updateExtra('attendance', v)} placeholder="e.g. 92" />
                        <Field label="Date of Birth" icon="fa-cake-candles" type="date" value={extra.dob} onChange={v => updateExtra('dob', v)} />
                        <Field label="Blood Group" icon="fa-droplet" value={extra.bloodGroup} onChange={v => updateExtra('bloodGroup', v)}
                            options={[{ value: '', label: '— Select —' }, ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }))]}
                        />
                        <Field label="Caste" icon="fa-users-line" value={extra.caste} onChange={v => updateExtra('caste', v)} />
                        <Field label="Community" icon="fa-people-group" value={extra.community} onChange={v => updateExtra('community', v)}
                            options={[{ value: '', label: '— Select Community —' }, { value: 'BC', label: 'BC' }, { value: 'MBC', label: 'MBC' }, { value: 'SC/ST', label: 'SC/ST' }]}
                        />
                        <Field label="Gender" icon="fa-venus-mars" value={extra.gender} onChange={v => updateExtra('gender', v)}
                            options={[{ value: '', label: '— Select Gender —' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]}
                        />
                    </div>
                    <Field label="Address" icon="fa-map-marker-alt" type="textarea" value={extra.address} onChange={v => updateExtra('address', v)} />

                    <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <i className="fas fa-share-nodes" style={{ marginRight: '0.5rem' }} /> Professional Links
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <Field label="LeetCode" icon="fa-code" value={extra.leetcode} onChange={v => updateExtra('leetcode', v)} placeholder="https://leetcode.com/username" />
                            <Field label="LinkedIn" icon="fa-linkedin" value={extra.linkedin} onChange={v => updateExtra('linkedin', v)} placeholder="https://linkedin.com/in/username" />
                            <Field label="GitHub" icon="fa-github" value={extra.github} onChange={v => updateExtra('github', v)} placeholder="https://github.com/username" />
                        </div>
                    </div>
                </DetailSection>

                {/* ── 2. Family Details ── */}
                <DetailSection title="Family Details" icon="fa-house-user" color="#10b981">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
                        <Field label="Father's Name" icon="fa-user-tie" value={extra.fatherName} onChange={v => updateExtra('fatherName', v)} />
                        <Field label="Father's Phone" icon="fa-phone" type="tel" value={extra.fatherPhone} onChange={v => updateExtra('fatherPhone', v)} />
                        <Field label="Father's Occupation" icon="fa-briefcase" value={extra.fatherOccupation} onChange={v => updateExtra('fatherOccupation', v)} />
                        <Field label="Father's Annual Income" icon="fa-indian-rupee-sign" type="number" value={extra.fatherIncome} onChange={v => updateExtra('fatherIncome', v)} />
                        <Field label="Mother's Name" icon="fa-user-nurse" value={extra.motherName} onChange={v => updateExtra('motherName', v)} />
                        <Field label="Mother's Phone" icon="fa-phone" type="tel" value={extra.motherPhone} onChange={v => updateExtra('motherPhone', v)} />
                        <Field label="Mother's Occupation" icon="fa-briefcase" value={extra.motherOccupation} onChange={v => updateExtra('motherOccupation', v)} />
                        <Field label="Mother's Annual Income" icon="fa-indian-rupee-sign" type="number" value={extra.motherIncome} onChange={v => updateExtra('motherIncome', v)} />
                    </div>
                </DetailSection>

                {/* ── 2a. Sibling Details ── */}
                <DetailSection title="Sibling Details" icon="fa-users" color="#ec4899">
                    <ListEditor
                        items={extra.siblings}
                        setItems={v => updateExtra('siblings', v)}
                        addLabel="Add Sibling"
                        color="#ec4899"
                        fields={[
                            { key: 'name', label: 'Sibling Name', icon: 'fa-user' },
                            { key: 'status', label: 'Status', icon: 'fa-info-circle', type: 'select', options: [{ value: 'studies', label: 'Studies' }, { value: 'working', label: 'Working' }] },
                            { key: 'detail', label: 'What they are doing (Studies/Work Detail)', icon: 'fa-graduation-cap' }
                        ]}
                    />
                </DetailSection>

                {/* ── 3. Schooling Details ── */}
                <DetailSection title="Schooling Details (SSLC, HSC & Diploma)" icon="fa-school" color="#f59e0b">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-certificate" style={{ color: '#f59e0b' }} /> SSLC (10th Standard)
                            </h4>
                            <Field label="School Name" icon="fa-building" value={extra.sslcSchool} onChange={v => updateExtra('sslcSchool', v)} />
                            <Field label="Place" icon="fa-location-dot" value={extra.sslcPlace} onChange={v => updateExtra('sslcPlace', v)} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Marks Gained" icon="fa-check" type="number" value={extra.sslcGained} onChange={v => updateExtra('sslcGained', v)} />
                                <Field label="Total Marks" icon="fa-plus" type="number" value={extra.sslcTotal} onChange={v => updateExtra('sslcTotal', v)} />
                            </div>
                            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '0.5rem', border: '1.5px dashed #f59e0b', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>SSLC Percentage</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {(extra.sslcGained && extra.sslcTotal) ? ((extra.sslcGained / extra.sslcTotal) * 100).toFixed(2) : '0.00'}%
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-graduation-cap" style={{ color: '#f59e0b' }} /> HSC (12th Standard)
                            </h4>
                            <Field label="School Name" icon="fa-building" value={extra.hscSchool} onChange={v => updateExtra('hscSchool', v)} />
                            <Field label="Place" icon="fa-location-dot" value={extra.hscPlace} onChange={v => updateExtra('hscPlace', v)} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Marks Gained" icon="fa-check" type="number" value={extra.hscGained} onChange={v => updateExtra('hscGained', v)} />
                                <Field label="Total Marks" icon="fa-plus" type="number" value={extra.hscTotal} onChange={v => updateExtra('hscTotal', v)} />
                            </div>
                            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '0.5rem', border: '1.5px dashed #f59e0b', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>HSC Percentage</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {(extra.hscGained && extra.hscTotal) ? ((extra.hscGained / extra.hscTotal) * 100).toFixed(2) : '0.00'}%
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <i className="fas fa-scroll" style={{ color: '#f59e0b' }} /> Diploma (If Applicable)
                                </h4>
                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={extra.diplomaApplicable} onChange={e => updateExtra('diplomaApplicable', e.target.checked)} /> Applicable?
                                </label>
                            </div>
                            {extra.diplomaApplicable && (
                                <>
                                    <Field label="College Name" icon="fa-building" value={extra.diplomaSchool} onChange={v => updateExtra('diplomaSchool', v)} />
                                    <Field label="Place" icon="fa-location-dot" value={extra.diplomaPlace} onChange={v => updateExtra('diplomaPlace', v)} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Field label="Marks Gained" icon="fa-check" type="number" value={extra.diplomaGained} onChange={v => updateExtra('diplomaGained', v)} />
                                        <Field label="Total Marks" icon="fa-plus" type="number" value={extra.diplomaTotal} onChange={v => updateExtra('diplomaTotal', v)} />
                                    </div>
                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '0.5rem', border: '1.5px dashed #f59e0b', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Diploma Percentage</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                                            {(extra.diplomaGained && extra.diplomaTotal) ? ((extra.diplomaGained / extra.diplomaTotal) * 100).toFixed(2) : '0.00'}%
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </DetailSection>

                {/* ── 2. Leave History ── */}
                <DetailSection title="Leave History" icon="fa-calendar-xmark" color="#f59e0b" badge={`${leaveDaysUsed} Days Used`}>
                    <HistoryTable rows={leaveOnly} emptyMsg="No leave records found." />
                    <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                            <span>Leave Utilisation</span>
                            <span>{leaveDaysUsed} / 12 days used</span>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: '9999px',
                                width: `${Math.min((leaveDaysUsed / 12) * 100, 100)}%`,
                                background: leaveDaysUsed > 9 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : leaveDaysUsed > 6 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                                transition: 'width 0.8s ease',
                            }} />
                        </div>
                    </div>
                </DetailSection>

                {/* ── 3. OD Records ── */}
                <DetailSection title="On-Duty (OD) Records" icon="fa-building" color="#10b981" badge={`${odDaysUsed} Days`}>
                    <HistoryTable rows={odOnly} emptyMsg="No OD records found." />
                </DetailSection>

                {/* ── 4. Semester-wise Performance ── */}
                <DetailSection title="Semester-wise Performance" icon="fa-chart-column" color="#8b5cf6">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <Field
                            label="Current Semester"
                            icon="fa-graduation-cap"
                            value={extra.currentSemester}
                            onChange={v => {
                                const semCount = parseInt(v) || 0;
                                const validGPAs = [];
                                for (let i = 1; i < semCount; i++) {
                                    const val = extra.semesterGPAs[`sem${i}`]?.gpa;
                                    if (val !== '' && !isNaN(val)) validGPAs.push(Number(val));
                                }
                                const avg = validGPAs.length > 0 ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2) : '';
                                setExtra(prev => ({ ...prev, currentSemester: v, cgpa: avg }));
                            }}
                            options={[
                                { value: '', label: '— Select Semester —' },
                                ...['1', '2', '3', '4', '5', '6', '7', '8'].map(s => ({ value: s, label: `Semester ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][parseInt(s) - 1]}` }))
                            ]}
                        />
                    </div>

                    {extra.currentSemester && parseInt(extra.currentSemester) > 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {Array.from({ length: parseInt(extra.currentSemester) - 1 }).map((_, i) => {
                                const semKey = `sem${i + 1}`;
                                const rom = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i];
                                const semData = extra.semesterGPAs[semKey] || { gpa: '', courses: [] };

                                return (
                                    <div key={semKey} style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Semester {rom} Records</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>GPA:</span>
                                                    <input
                                                        type="number" step="0.01" value={semData.gpa}
                                                        onChange={e => {
                                                            const newGPAs = { ...extra.semesterGPAs, [semKey]: { ...semData, gpa: e.target.value } };
                                                            const semCount = parseInt(extra.currentSemester);
                                                            const validGPAs = [];
                                                            for (let j = 1; j < semCount; j++) {
                                                                const val = j === (i + 1) ? e.target.value : newGPAs[`sem${j}`].gpa;
                                                                if (val !== '' && !isNaN(val)) validGPAs.push(Number(val));
                                                            }
                                                            const avg = validGPAs.length > 0 ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2) : '';
                                                            setExtra(prev => ({ ...prev, semesterGPAs: newGPAs, cgpa: avg }));
                                                        }}
                                                        style={{ width: '60px', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                                                    <input
                                                        type="file"
                                                        id={`file-${semKey}`}
                                                        style={{ display: 'none' }}
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[e.target.files.length - 1];
                                                            if (!file) return;
                                                            const reader = new FileReader();
                                                            reader.onload = (re) => {
                                                                const newGPAs = {
                                                                    ...extra.semesterGPAs,
                                                                    [semKey]: { ...semData, marksheet: re.target.result, marksheetName: file.name }
                                                                };
                                                                updateExtra('semesterGPAs', newGPAs);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }}
                                                    />
                                                    {semData.marksheet ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {semData.marksheet.startsWith('data:image') && (
                                                                <img src={semData.marksheet} alt="Result Preview" style={{ height: '32px', width: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => window.open(semData.marksheet)} title="View Photo" />
                                                            )}
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}><i className="fas fa-check-circle" /> Photo Uploaded</span>
                                                                <span style={{ fontSize: '0.55rem', color: '#64748b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {semData.marksheetName}
                                                                </span>
                                                            </div>
                                                            <button title="Remove Photo" type="button" onClick={() => {
                                                                const newGPAs = { ...extra.semesterGPAs, [semKey]: { ...semData, marksheet: null, marksheetName: '' } };
                                                                updateExtra('semesterGPAs', newGPAs);
                                                                // reset file input
                                                                const fileInput = document.getElementById(`file-${semKey}`);
                                                                if(fileInput) fileInput.value = '';
                                                            }} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => document.getElementById(`file-${semKey}`).click()}
                                                            style={{
                                                                padding: '0.35rem 0.75rem',
                                                                borderRadius: '0.5rem',
                                                                border: '1px dashed #6366f1',
                                                                background: '#e0e7ff',
                                                                color: '#4f46e5',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#c7d2fe'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#e0e7ff'; }}
                                                        >
                                                            <i className="fas fa-camera" />
                                                            Upload Result Photo
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.25rem' }}>
                                            {/* THEORY COURSES */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.4rem 0.75rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>
                                                <i className="fas fa-book-open" style={{ color: '#6366f1', fontSize: '0.8rem' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Theory Courses</span>
                                            </div>
                                            <TableEditor
                                                items={semData.courses || []}
                                                setItems={courses => {
                                                    const newGPAs = { ...extra.semesterGPAs, [semKey]: { ...semData, courses } };
                                                    updateExtra('semesterGPAs', newGPAs);
                                                }}
                                                addLabel="Add Theory Course"
                                                color="#6366f1"
                                                fields={[
                                                    { key: 'code', label: 'Code', icon: 'fa-tag' },
                                                    { key: 'courseName', label: 'Course Name', icon: 'fa-book' },
                                                    { key: 'faculty', label: 'Faculty', icon: 'fa-chalkboard-user' },
                                                    { key: 'cat1', label: 'CAT 1', icon: 'fa-pen-clip', type: 'number' },
                                                    { key: 'cat2', label: 'CAT 2', icon: 'fa-pen-clip', type: 'number' },
                                                    { key: 'internal', label: 'Internal', icon: 'fa-clipboard-check', type: 'number' },
                                                    {
                                                        key: 'grade', label: 'Grade', icon: 'fa-ranking-star', type: 'select',
                                                        options: [{ value: '', label: '— Grade —' }, { value: 'O', label: 'O' }, { value: 'A+', label: 'A+' }, { value: 'A', label: 'A' }, { value: 'B+', label: 'B+' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'U', label: 'U (Reappear)' }]
                                                    },
                                                    {
                                                        key: 'reappearedGrade', label: 'Re-Exam', icon: 'fa-redo', type: 'select',
                                                        options: [{ value: '', label: '— Grade —' }, { value: 'O', label: 'O' }, { value: 'A+', label: 'A+' }, { value: 'A', label: 'A' }, { value: 'B+', label: 'B+' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'U', label: 'U (Reappear)' }],
                                                        renderIf: (item) => item.grade === 'U'
                                                    }
                                                ]}
                                            />

                                            {/* LAB COURSES */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', marginBottom: '0.75rem', padding: '0.4rem 0.75rem', background: '#fdf2f8', borderRadius: '0.5rem' }}>
                                                <i className="fas fa-flask" style={{ color: '#ec4899', fontSize: '0.8rem' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>Lab / Practical Courses</span>
                                            </div>
                                            <TableEditor
                                                items={semData.labCourses || []}
                                                setItems={labCourses => {
                                                    const newGPAs = { ...extra.semesterGPAs, [semKey]: { ...semData, labCourses } };
                                                    updateExtra('semesterGPAs', newGPAs);
                                                }}
                                                addLabel="Add Lab Course"
                                                color="#ec4899"
                                                fields={[
                                                    { key: 'code', label: 'Code', icon: 'fa-tag' },
                                                    { key: 'courseName', label: 'Course Name', icon: 'fa-book' },
                                                    { key: 'faculty', label: 'Faculty', icon: 'fa-chalkboard-user' },
                                                    { key: 'internal', label: 'Internal', icon: 'fa-clipboard-check', type: 'number' },
                                                    {
                                                        key: 'grade', label: 'Grade', icon: 'fa-ranking-star', type: 'select',
                                                        options: [{ value: '', label: '— Grade —' }, { value: 'O', label: 'O' }, { value: 'A+', label: 'A+' }, { value: 'A', label: 'A' }, { value: 'B+', label: 'B+' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'U', label: 'U (Reappear)' }]
                                                    },
                                                    {
                                                        key: 'reappearedGrade', label: 'Re-Exam', icon: 'fa-redo', type: 'select',
                                                        options: [{ value: '', label: '— Grade —' }, { value: 'O', label: 'O' }, { value: 'A+', label: 'A+' }, { value: 'A', label: 'A' }, { value: 'B+', label: 'B+' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'U', label: 'U (Reappear)' }],
                                                        renderIf: (item) => item.grade === 'U'
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '1rem', border: '1px solid #bae6fd', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Calculated Current CGPA</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0284c7' }}>
                            {extra.cgpa || '0.00'}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#0ea5e9', marginTop: '0.5rem' }}>
                            {parseInt(extra.currentSemester) > 1
                                ? `Average of completed semesters (Sem I to Sem ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][parseInt(extra.currentSemester) - 2]})`
                                : 'No completed semesters yet'}
                        </p>
                    </div>
                </DetailSection>

                {/* ── 4.5 Events ── */}
                <DetailSection title="Events" icon="fa-calendar-alt" color="#ec4899">
                    <ListEditor items={extra.events || []} setItems={v => updateExtra('events', v)} addLabel="Add Event" color="#ec4899"
                        fields={[
                            { key: 'eventType', label: 'Event Type', icon: 'fa-tags' },
                            { key: 'eventLevel', label: 'Event Level', icon: 'fa-layer-group', type: 'select', options: [{ value: '', label: '— Select —' }, { value: 'State', label: 'State' }, { value: 'National', label: 'National' }, { value: 'International', label: 'International' }] },
                            { key: 'place', label: 'Place', icon: 'fa-location-dot' },
                            { key: 'fromDate', label: 'From Date', icon: 'fa-calendar', type: 'date' },
                            { key: 'toDate', label: 'To Date', icon: 'fa-calendar-check', type: 'date' },
                            { key: 'prize', label: 'Prize', icon: 'fa-trophy' },
                            { key: 'certificate', label: 'Certificate Link', icon: 'fa-link' },
                        ]}
                    />
                </DetailSection>

                {/* ── 5. Internship Details ── */}
                <DetailSection title="Internship Details" icon="fa-laptop-code" color="#3b82f6">
                    <ListEditor items={extra.internships} setItems={v => updateExtra('internships', v)} addLabel="Add Internship" color="#3b82f6"
                        fields={[
                            { key: 'company', label: 'Company / Organisation', icon: 'fa-building' },
                            { key: 'role', label: 'Role / Designation', icon: 'fa-user-tie' },
                            { key: 'type', label: 'Internship Type', icon: 'fa-tag', type: 'select', options: [{ value: 'internship', label: 'Internship' }, { value: 'virtual', label: 'Virtual Internship' }, { value: 'industrial', label: 'Industrial Training' }, { value: 'research', label: 'Research Internship' }] },
                            { key: 'fromDate', label: 'From Date', icon: 'fa-calendar', type: 'date' },
                            { key: 'toDate', label: 'To Date', icon: 'fa-calendar-check', type: 'date' },
                            { key: 'stipend', label: 'Stipend (₹)', icon: 'fa-indian-rupee-sign' },
                            { key: 'certificate', label: 'Certificate No. / Link', icon: 'fa-certificate' },
                            { key: 'description', label: 'Work Description', icon: 'fa-align-left', type: 'textarea' },
                        ]}
                    />
                </DetailSection>

                {/* ── 5. Publications ── */}
                <DetailSection title="Publications" icon="fa-book-open" color="#8b5cf6">
                    <ListEditor items={extra.publications} setItems={v => updateExtra('publications', v)} addLabel="Add Publication" color="#8b5cf6"
                        fields={[
                            { key: 'title', label: 'Paper Title', icon: 'fa-heading' },
                            { key: 'journal', label: 'Journal / Conference', icon: 'fa-newspaper' },
                            { key: 'type', label: 'Type', icon: 'fa-tag', type: 'select', options: [{ value: 'journal', label: 'Journal Paper' }, { value: 'conference', label: 'Conference Paper' }, { value: 'book', label: 'Book Chapter' }, { value: 'workshop', label: 'Workshop Paper' }] },
                            { key: 'doi', label: 'DOI / Link', icon: 'fa-link' },
                            { key: 'date', label: 'Published Date', icon: 'fa-calendar', type: 'date' },
                            { key: 'indexing', label: 'Indexing (Scopus / SCI / UGC)', icon: 'fa-database' },
                        ]}
                    />
                </DetailSection>

                {/* ── 6. Patents ── */}
                <DetailSection title="Patents" icon="fa-lightbulb" color="#f97316">
                    <ListEditor items={extra.patents} setItems={v => updateExtra('patents', v)} addLabel="Add Patent" color="#f97316"
                        fields={[
                            { key: 'title', label: 'Patent Title', icon: 'fa-heading' },
                            { key: 'applicationNo', label: 'Application Number', icon: 'fa-hashtag' },
                            { key: 'status', label: 'Status', icon: 'fa-flag', type: 'select', options: [{ value: 'filed', label: 'Filed' }, { value: 'published', label: 'Published' }, { value: 'granted', label: 'Granted' }, { value: 'rejected', label: 'Rejected' }] },
                            { key: 'filedDate', label: 'Filed Date', icon: 'fa-calendar', type: 'date' },
                            { key: 'inventors', label: 'Inventors', icon: 'fa-users' },
                            { key: 'description', label: 'Brief Description', icon: 'fa-align-left', type: 'textarea' },
                        ]}
                    />
                </DetailSection>

                {/* ── 7. Vertical Activities ── */}
                <DetailSection title="Vertical Activities" icon="fa-trophy" color="#ec4899">
                    <div style={{ marginBottom: '0.875rem', padding: '0.625rem 0.875rem', background: 'rgba(236,72,153,0.06)', borderRadius: '0.5rem', border: '1px solid rgba(236,72,153,0.15)', fontSize: '0.775rem', color: '#be185d' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.4rem' }} />
                        Co-curricular & extra-curricular activities — sports, clubs, hackathons, NSS/NCC, student council, cultural events, etc.
                    </div>
                    <ListEditor items={extra.certifications.vertical} setItems={v => updateCert('vertical', v)} addLabel="Add Activity" color="#ec4899"
                        fields={[
                            { key: 'activityName', label: 'Activity / Event Name', icon: 'fa-star' },
                            { key: 'category', label: 'Category', icon: 'fa-tag', type: 'select', options: [{ value: 'technical', label: 'Technical (Hackathon / Coding)' }, { value: 'sports', label: 'Sports' }, { value: 'cultural', label: 'Cultural' }, { value: 'nss', label: 'NSS / NCC / YRC' }, { value: 'club', label: 'Club / Association' }, { value: 'leadership', label: 'Leadership / Student Council' }, { value: 'other', label: 'Other' }] },
                            { key: 'role', label: 'Role / Position', icon: 'fa-user-shield' },
                            { key: 'achievement', label: 'Achievement / Award', icon: 'fa-medal' },
                            { key: 'date', label: 'Date', icon: 'fa-calendar', type: 'date' },
                            { key: 'organiser', label: 'Organised By', icon: 'fa-building' },
                            { key: 'proof', label: 'Certificate / Proof Link', icon: 'fa-link' },
                        ]}
                    />
                </DetailSection>

                {/* ── 8. NPTEL / Online Courses ── */}
                <DetailSection title="NPTEL / Online Courses" icon="fa-graduation-cap" color="#0ea5e9">
                    <div style={{ marginBottom: '0.875rem', padding: '0.625rem 0.875rem', background: 'rgba(14,165,233,0.06)', borderRadius: '0.5rem', border: '1px solid rgba(14,165,233,0.15)', fontSize: '0.775rem', color: '#0369a1' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.4rem' }} />
                        NPTEL, SWAYAM, Coursera, edX, Udemy and other MOOC certifications.
                    </div>
                    <ListEditor items={extra.certifications.nptel} setItems={v => updateCert('nptel', v)} addLabel="Add Course" color="#0ea5e9"
                        fields={[
                            { key: 'courseName', label: 'Course Name', icon: 'fa-book' },
                            { key: 'platform', label: 'Platform', icon: 'fa-globe', type: 'select', options: [{ value: 'nptel', label: 'NPTEL' }, { value: 'swayam', label: 'SWAYAM' }, { value: 'coursera', label: 'Coursera' }, { value: 'edx', label: 'edX' }, { value: 'udemy', label: 'Udemy' }, { value: 'linkedin', label: 'LinkedIn Learning' }, { value: 'other', label: 'Other MOOC' }] },
                            { key: 'instructor', label: 'Instructor / Institute', icon: 'fa-chalkboard-teacher' },
                            { key: 'duration', label: 'Duration (Weeks)', icon: 'fa-clock' },
                            { key: 'score', label: 'Score / Grade (%)', icon: 'fa-percent' },
                            { key: 'completionDate', label: 'Completion Date', icon: 'fa-calendar-check', type: 'date' },
                            { key: 'certificateNo', label: 'Certificate No.', icon: 'fa-certificate' },
                            { key: 'credits', label: 'Credits Earned', icon: 'fa-coins' },
                        ]}
                    />
                </DetailSection>

                {/* Bottom Save */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2.5rem' }}>
                    <button onClick={handleSave} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 2rem', borderRadius: '0.75rem',
                        background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.3s ease',
                    }}>
                        <i className={`fas ${saved ? 'fa-check-double' : 'fa-floppy-disk'}`} />
                        {saved ? 'All Changes Saved!' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </>
    );
};

/* ══════════════════════════════════════════════════════════════
   PAGE 3 — MY PROJECT VIEW
   Students can add/edit their project details and upload files.
══════════════════════════════════════════════════════════════ */
const MyProjectView = ({ user }) => {
    const PROJECT_KEY = `stu_project_${user?.email?.toLowerCase()}`;
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
    const [saved, setSaved] = useState(false);

    // Default project template
    const defaultProject = {
        id: '', name: '', domain: '', mentorName: '', mentorEmail: '',
        noOfStudents: '', team: [], ppt: null, pptName: '', video: null, videoName: ''
    };

    // Load all projects for current user
    const [projects, setProjects] = useState(() => {
        try {
            const stored = localStorage.getItem(PROJECT_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Handle legacy format (single object vs array)
                if (Array.isArray(parsed)) return parsed;
                if (parsed && parsed.name) return [parsed]; // Legacy single project
            }
            return [];
        } catch {
            return [];
        }
    });

    const [currentProject, setCurrentProject] = useState(defaultProject);
    const [error, setError] = useState('');

    // Update team member fields based on noOfStudents
    useEffect(() => {
        const count = parseInt(currentProject.noOfStudents) || 0;
        const requiredTeamSize = Math.max(0, count - 1); // Exclude current user
        const currentTeam = currentProject.team || [];

        if (requiredTeamSize !== currentTeam.length) {
            const newTeam = [...currentTeam];
            if (requiredTeamSize > newTeam.length) {
                for (let i = newTeam.length; i < requiredTeamSize; i++) {
                    newTeam.push({ name: '', dept: '', year: '', section: '', regNo: '' });
                }
            } else {
                newTeam.splice(requiredTeamSize);
            }
            setCurrentProject(p => ({ ...p, team: newTeam }));
        }
    }, [currentProject.noOfStudents]);

    const handleSave = async () => {
        try {
            setError('');

            // Assign a unique ID if it doesn't have one
            const projectToSave = { ...currentProject, id: currentProject.id || Date.now().toString(), submittedBy: currentProject.submittedBy || user?.email };

            // If there's a video blob, save it to IndexedDB utilizing the unique ID
            if (projectToSave.videoBlob) {
                await videoStorage.saveVideo(`${PROJECT_KEY}_${projectToSave.id}`, projectToSave.videoBlob);
            }

            // Save metadata
            const metadata = {
                ...projectToSave,
                video: projectToSave.videoBlob ? 'indexeddb' : projectToSave.video,
                videoBlob: undefined // Don't save blob to localStorage
            };

            // Update local projects array
            let updatedProjects = [...projects];
            const existingIdx = updatedProjects.findIndex(p => p.id === metadata.id);
            if (existingIdx >= 0) {
                updatedProjects[existingIdx] = metadata;
            } else {
                updatedProjects.push(metadata);
            }

            setProjects(updatedProjects);
            localStorage.setItem(PROJECT_KEY, JSON.stringify(updatedProjects));

            // Sync with other valid team members
            const allUsers = db.getUsers();
            let missingStudents = [];
            for (const member of metadata.team) {
                if (!member.regNo) continue;
                // Find valid student by regNo
                const validStudent = allUsers.find(u =>
                    u.registerNo?.trim().toLowerCase() === member.regNo.trim().toLowerCase() &&
                    u.role === 'student'
                );

                if (!validStudent) {
                    missingStudents.push(member.regNo);
                    continue;
                }

                if (validStudent && validStudent.email.toLowerCase() !== user.email?.toLowerCase()) {
                    const memberKey = `stu_project_${validStudent.email.toLowerCase()}`;
                    let memberProjects = [];
                    try {
                        const st = localStorage.getItem(memberKey);
                        if (st) {
                            const parsed = JSON.parse(st);
                            memberProjects = Array.isArray(parsed) ? parsed : (parsed.name ? [parsed] : []);
                        }
                    } catch (e) { }

                    const mIdx = memberProjects.findIndex(p => p.id === metadata.id);
                    if (mIdx >= 0) {
                        memberProjects[mIdx] = metadata;
                    } else {
                        memberProjects.push(metadata);
                    }
                    localStorage.setItem(memberKey, JSON.stringify(memberProjects));
                }
            }

            if (missingStudents.length > 0) {
                alert(`Warning: Could not find students with Register No: ${missingStudents.join(', ')}. Project details were not synced to them. Please check their register numbers.`);
            }

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                setViewMode('list');
            }, 1000);

        } catch (e) {
            console.error('Storage error:', e);
            setError('Storage error! Your video might be too large for this browser.');
        }
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (field === 'ppt') {
            const limit = 2 * 1024 * 1024;
            if (file.size > limit) {
                setError(`PPT limit is ${limit / (1024 * 1024)}MB for local storage.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (re) => {
                setCurrentProject(prev => ({ ...prev, ppt: re.target.result, pptName: file.name }));
            };
            reader.readAsDataURL(file);
        } else if (field === 'video') {
            setCurrentProject(prev => ({ ...prev, videoBlob: file, videoName: file.name, video: 'pending' }));
        }
        setError('');
    };

    if (viewMode === 'list') {
        return (
            <div style={{ padding: '2rem 2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Your Projects</h2>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Manage and view your academic projects</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentProject(defaultProject);
                            setViewMode('form');
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
                    >
                        <i className="fas fa-plus" /> Add Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}>
                            <i className="fas fa-folder-open" style={{ fontSize: '1.25rem' }} />
                        </div>
                        <p style={{ fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>No projects done</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Click "Add Project" to add your first project.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {projects.map((p, idx) => (
                            <div key={p.id || idx} style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{p.name || 'Untitled Project'}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        <span><i className="fas fa-globe" style={{ marginRight: '0.3rem' }} /> {p.domain || 'N/A'}</span>
                                        <span><i className="fas fa-users" style={{ marginRight: '0.3rem' }} /> {p.noOfStudents || 1} Members</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setCurrentProject({ ...defaultProject, ...p, team: p.team || [] });
                                        setViewMode('form');
                                    }}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Edit Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <button
                onClick={() => setViewMode('list')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 0.875rem', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, marginBottom: '1.5rem' }}
            >
                <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} /> Back to Projects
            </button>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <i className="fas fa-exclamation-circle" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{error}</span>
                </div>
            )}
            <DetailSection title={currentProject.id ? "Edit Project Details" : "Add Project Details"} icon="fa-project-diagram" color="#6366f1">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <Field label="Project Name" value={currentProject.name} onChange={v => setCurrentProject(p => ({ ...p, name: v }))} icon="fa-heading" />
                    <Field label="Domain" value={currentProject.domain} onChange={v => setCurrentProject(p => ({ ...p, domain: v }))} icon="fa-globe" />
                    <Field label="Mentor Name" value={currentProject.mentorName} onChange={v => setCurrentProject(p => ({ ...p, mentorName: v }))} icon="fa-user-tie" />
                    <Field label="Mentor Email" value={currentProject.mentorEmail} onChange={v => setCurrentProject(p => ({ ...p, mentorEmail: v }))} icon="fa-envelope" type="email" />
                    <Field label="No. of Students" value={currentProject.noOfStudents} onChange={v => setCurrentProject(p => ({ ...p, noOfStudents: v }))} icon="fa-users" type="number" />
                </div>

                {(currentProject.team || []).length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-users-cog" style={{ color: '#6366f1' }} /> Team Member Details (Excluding You)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(currentProject.team || []).map((m, idx) => (
                                <div key={idx} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Member #{idx + 1}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                        <Field label="Name" value={m.name} onChange={v => {
                                            const nt = [...currentProject.team]; nt[idx].name = v; setCurrentProject(p => ({ ...p, team: nt }));
                                        }} icon="fa-user" />
                                        <Field label="Department" value={m.dept} onChange={v => {
                                            const nt = [...currentProject.team]; nt[idx].dept = v; setCurrentProject(p => ({ ...p, team: nt }));
                                        }} icon="fa-building" />
                                        <Field label="Year" value={m.year} onChange={v => {
                                            const nt = [...currentProject.team]; nt[idx].year = v; setCurrentProject(p => ({ ...p, team: nt }));
                                        }} icon="fa-calendar-alt" />
                                        <Field label="Section" value={m.section} onChange={v => {
                                            const nt = [...currentProject.team]; nt[idx].section = v; setCurrentProject(p => ({ ...p, team: nt }));
                                        }} icon="fa-layer-group" />
                                        <Field label="Register No" value={m.regNo} onChange={v => {
                                            const nt = [...currentProject.team]; nt[idx].regNo = v; setCurrentProject(p => ({ ...p, team: nt }));
                                        }} icon="fa-id-card" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>PPT File</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="file" accept=".ppt,.pptx" id="ppt-upload" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'ppt')} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button onClick={() => document.getElementById('ppt-upload').click()} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #6366f1', background: currentProject.ppt ? '#eff6ff' : '#fff', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className={`fas ${currentProject.ppt ? 'fa-check-circle' : 'fa-file-powerpoint'}`} />
                                    {currentProject.ppt ? 'Change PPT' : 'Upload PPT'}
                                </button>
                                {currentProject.ppt && (
                                    <button onClick={() => setCurrentProject(p => ({ ...p, ppt: null, pptName: '' }))} style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete PPT">
                                        <i className="fas fa-trash-alt" />
                                    </button>
                                )}
                            </div>
                            {currentProject.pptName && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{currentProject.pptName}</span>}
                        </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Video Demo</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="file" accept="video/*" id="video-upload" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'video')} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button onClick={() => document.getElementById('video-upload').click()} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #6366f1', background: currentProject.video || currentProject.videoBlob ? '#eff6ff' : '#fff', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className={`fas ${currentProject.video || currentProject.videoBlob ? 'fa-check-circle' : 'fa-file-video'}`} />
                                    {currentProject.video || currentProject.videoBlob ? 'Change Video' : 'Upload Video'}
                                </button>
                                {(currentProject.video || currentProject.videoBlob) && (
                                    <button onClick={() => setCurrentProject(p => ({ ...p, video: null, videoBlob: null, videoName: '' }))} style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Video">
                                        <i className="fas fa-trash-alt" />
                                    </button>
                                )}
                            </div>
                            {currentProject.videoName && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{currentProject.videoName}</span>}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '0.75rem', background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.3s ease' }}>
                        <i className={`fas ${saved ? 'fa-check-double' : 'fa-save'}`} />
                        {saved ? 'Project Saved!' : 'Save Project Details'}
                    </button>
                </div>
            </DetailSection>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════
   ROOT EXPORT — StudentDashboard
   Single component: manages activePage state, renders Sidebar +
   either DashboardView or MyDetailsView
══════════════════════════════════════════════════════════════ */
const StudentDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { showProfile, setShowProfile } = useOutletContext();

    // Switch between 'dashboard', 'mydetails', and 'project' based on URL search param
    const activePage = location.search.includes('view=details') ? 'mydetails' : location.search.includes('view=project') ? 'project' : 'dashboard';

    const setActivePage = (page) => {
        if (page === 'mydetails') navigate('?view=details');
        else if (page === 'project') navigate('?view=project');
        else navigate('?view=dashboard');
    };

    return (
        <div style={{ width: '100%' }}>
            {activePage === 'dashboard' ? (
                <DashboardView user={user} setActivePage={setActivePage} />
            ) : activePage === 'project' ? (
                <MyProjectView user={user} />
            ) : (
                <MyDetailsView user={user} setActivePage={setActivePage} />
            )}
        </div>
    );
};

export default StudentDashboard;