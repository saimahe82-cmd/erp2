import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import odService from '../services/odService';
import db from '../services/api';

const ODApplication = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        odCategory: '',
        odType: '',
        fromDate: '',
        toDate: '',
        hours: '',
        periods: '',
        description: '',
        // Event specific modules
        eventType: '',
        otherEventType: '',
        eventName: '',
        participationType: '',
        teamMembers: [{ name: '', regNo: '', year: '' }],
        venue: '',
        eventLevel: '',
        locationState: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.odCategory || !formData.odType) {
            setError('Please select both OD category and type.');
            return;
        }

        if (new Date(formData.fromDate) > new Date(formData.toDate)) {
            setError('From Date cannot be after To Date.');
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            const categoryLabel = formData.odCategory === 'internal' ? 'Internal' : 'External';
            const typeLabel = formData.odType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const fullTypeLabel = `${categoryLabel} OD - ${typeLabel}`;

            let extendedDescription = formData.description || fullTypeLabel;
            if (formData.odCategory === 'internal' && formData.hours) {
                extendedDescription += `\n(Hours: ${formData.hours}, Periods: ${formData.periods})`;
            }

            if (formData.odType === 'event') {
                const eTypeStr = formData.eventType === 'others' ? formData.otherEventType : formData.eventType;
                extendedDescription += `\n\n=== EVENT DETAILS ===\n`;
                extendedDescription += `Event Type: ${eTypeStr || '-'}\n`;
                extendedDescription += `Event Name: ${formData.eventName || '-'}\n`;
                extendedDescription += `Venue: ${formData.venue || '-'} | Level: ${formData.eventLevel || '-'} | State: ${formData.locationState || '-'}\n`;
                extendedDescription += `Participation: ${formData.participationType || '-'}\n`;

                if (formData.participationType === 'Team' && formData.teamMembers.length > 0) {
                    extendedDescription += `\nTeam Members:\n`;
                    formData.teamMembers.forEach((member, i) => {
                        extendedDescription += `  ${i + 1}. ${member.name} (Reg No: ${member.regNo}, Year: ${member.year})\n`;
                    });
                }
            }

            const submissionData = {
                odType: fullTypeLabel,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                description: extendedDescription.trim()
            };

            const result = odService.applyOD(submissionData, user);

            // Sync to team members
            if (result.success && formData.odType === 'event' && formData.participationType === 'Team') {
                let missingStudents = [];
                const allUsers = db.getUsers();
                for (const member of formData.teamMembers) {
                    if (!member.regNo || member.regNo.trim().toLowerCase() === user.registerNo?.trim().toLowerCase()) continue;

                    const validStudent = allUsers.find(u =>
                        u.registerNo?.trim().toLowerCase() === member.regNo.trim().toLowerCase() &&
                        u.role === 'student'
                    );

                    if (!validStudent) {
                        missingStudents.push(member.regNo);
                    } else {
                        // Submit on their behalf
                        const syncedSubmissionData = {
                            ...submissionData,
                            description: `[Team Sync - Initiated by ${user?.name || 'Unknown'} (${user?.registerNo || 'N/A'})]\n${extendedDescription.trim()}`
                        };
                        odService.applyOD(syncedSubmissionData, validStudent);
                    }
                }

                if (missingStudents.length > 0) {
                    alert(`Warning: OD was submitted successfully, but we could not find/sync it to students with Register No: ${missingStudents.join(', ')}. Please manually inform them to apply or check their register numbers.`);
                }
            }

            if (result.success) {
                navigate('/student-dashboard');
            } else {
                setError(result.message || 'Failed to submit. Please try again.');
            }
            setIsSubmitting(false);
        }, 600);
    };

    return (
        <div className="login-box" style={{ margin: '2rem auto', maxWidth: '650px', textAlign: 'left', background: '#fff', padding: '2.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                <img src={logo} alt="NEC Logo" style={{ height: '80px' }} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Nandha Engineering College</h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.25rem' }}>STUDENT OD APPLICATION</p>
                </div>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>OD Category</label>
                    <select
                        value={formData.odCategory}
                        onChange={(e) => setFormData({ ...formData, odCategory: e.target.value, odType: '' })}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                    >
                        <option value="">Select Category</option>
                        <option value="internal">Internal OD</option>
                        <option value="external">External OD</option>
                    </select>
                </div>

                {formData.odCategory === 'internal' && (
                    <>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Internal OD Type</label>
                            <select
                                value={formData.odType}
                                onChange={(e) => setFormData({ ...formData, odType: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="">Select Type</option>
                                <option value="sports">Sports</option>
                                <option value="project_work">Project Work</option>
                                <option value="event">Event</option>
                                <option value="other">Others</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Total Hours</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    placeholder="e.g. 3"
                                    required
                                    value={formData.hours}
                                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Specific Periods</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1, 2, 3"
                                    required
                                    value={formData.periods}
                                    onChange={(e) => setFormData({ ...formData, periods: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                />
                            </div>
                        </div>
                    </>
                )}

                {formData.odCategory === 'external' && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>External OD Type</label>
                        <select
                            value={formData.odType}
                            onChange={(e) => setFormData({ ...formData, odType: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                        >
                            <option value="">Select Type</option>
                            <option value="event">Events</option>
                            <option value="internship">Internships</option>
                            <option value="field_visit">Field Visit</option>
                            <option value="sports">Sports</option>
                            <option value="other">Others</option>
                        </select>
                    </div>
                )}

                {/* ── EVENT SPECIFIC MODULE ── */}
                {formData.odType === 'event' && (
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-star" style={{ color: '#f59e0b' }} /> Event Details
                        </h4>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Event Type</label>
                            <select
                                value={formData.eventType}
                                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="">Select Event Type</option>
                                <option value="Hackathon">Hackathon</option>
                                <option value="symposium">Symposium</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        {formData.eventType === 'others' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Specify Event Type</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.otherEventType}
                                    onChange={(e) => setFormData({ ...formData, otherEventType: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                    placeholder="e.g. Workshop"
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Event Name</label>
                            <input
                                type="text"
                                required
                                value={formData.eventName}
                                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                placeholder="Name of the event"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Event Level</label>
                                <select
                                    value={formData.eventLevel}
                                    onChange={(e) => setFormData({ ...formData, eventLevel: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                >
                                    <option value="">Select Level</option>
                                    <option value="State">State</option>
                                    <option value="National">National</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Venue</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                    placeholder="Location"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>State Context</label>
                                <select
                                    value={formData.locationState}
                                    onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                                >
                                    <option value="">Select Option</option>
                                    <option value="Inside state">Inside state</option>
                                    <option value="Outside state">Outside state</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Participation Type</label>
                            <select
                                value={formData.participationType}
                                onChange={(e) => setFormData({ ...formData, participationType: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="">Select Category</option>
                                <option value="Individual">Individual</option>
                                <option value="Team">Team</option>
                            </select>
                        </div>

                        {formData.participationType === 'Team' && (
                            <div style={{ marginTop: '1rem' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Team Members</p>
                                {formData.teamMembers.map((member, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,0.8fr) auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                                        <input
                                            type="text"
                                            placeholder="Member Name"
                                            required
                                            value={member.name}
                                            onChange={(e) => {
                                                const newTeam = formData.teamMembers.map((m, i) => i === idx ? { ...m, name: e.target.value } : m);
                                                setFormData({ ...formData, teamMembers: newTeam });
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Register No"
                                            required
                                            value={member.regNo}
                                            onChange={(e) => {
                                                const newTeam = formData.teamMembers.map((m, i) => i === idx ? { ...m, regNo: e.target.value } : m);
                                                setFormData({ ...formData, teamMembers: newTeam });
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Year (e.g. 3)"
                                            required
                                            value={member.year}
                                            onChange={(e) => {
                                                const newTeam = formData.teamMembers.map((m, i) => i === idx ? { ...m, year: e.target.value } : m);
                                                setFormData({ ...formData, teamMembers: newTeam });
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTeam = formData.teamMembers.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, teamMembers: newTeam });
                                            }}
                                            disabled={formData.teamMembers.length === 1}
                                            style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.25rem', cursor: formData.teamMembers.length === 1 ? 'not-allowed' : 'pointer', opacity: formData.teamMembers.length === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <i className="fas fa-trash-alt" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, teamMembers: [...formData.teamMembers, { name: '', regNo: '', year: '' }] })}
                                    style={{ background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                                >
                                    <i className="fas fa-plus" /> Add Member
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>From Date</label>
                        <input
                            type="date"
                            required
                            value={formData.fromDate}
                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>To Date</label>
                        <input
                            type="date"
                            required
                            value={formData.toDate}
                            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }}
                        />
                    </div>
                </div>

                {formData.fromDate && formData.toDate && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1.5px dashed #bae6fd', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>
                            <i className="fas fa-clock" style={{ marginRight: '0.5rem' }} />
                            OD Duration: {(() => {
                                const diff = Math.ceil((new Date(formData.toDate) - new Date(formData.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                                return diff > 0 ? (diff === 1 ? '1 Day' : `${diff} Days`) : 'Invalid Date Range';
                            })()}
                        </span>
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Activity/Event Description</label>
                    <textarea
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0',
                            minHeight: '120px',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                        placeholder="Details of the event or activity..."
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '2.5rem', justifyContent: 'center' }}>
                    <button type="submit" style={{
                        flex: '1', maxWidth: '200px', height: '48px', padding: '0', margin: '0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.25)', transition: 'transform 0.2s', fontSize: '0.95rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                    }} disabled={isSubmitting}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-spinner fa-spin"></i> Submitting...
                            </span>
                        ) : 'Submit'}
                    </button>
                    <Link
                        to="/student-dashboard"
                        style={{
                            flex: '1', maxWidth: '200px', height: '48px', padding: '0', margin: '0', border: '1.5px solid #e2e8f0',
                            borderRadius: '0.625rem', color: '#64748b', fontWeight: 700,
                            textDecoration: 'none', fontSize: '0.95rem', textAlign: 'center',
                            transition: 'all 0.2s', background: '#f8fafc', boxSizing: 'border-box',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ODApplication;
