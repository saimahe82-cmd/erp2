import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/nec-logo.jpeg';
import { useAuth } from '../context/AuthContext';
import rndService from '../services/rndService';
import './RndSubmission.css'; // Import scoped styles

const RndSubmission = () => {
    const { user } = useAuth(); // Removed logout as it's not in the new header design
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        activityType: '',
        title: '',
        domain: '',
        abstract: '',
        // Journal Details
        journalName: '',
        issn: '',
        indexedIn: [],
        impactFactor: '',
        volumeIssueYear: '',
        doi: '',
        // Conference Details
        conferenceName: '',
        organizedBy: '',
        venue: '',
        date: '',
        isbn: '',
        // Patent Details
        patentTitle: '',
        applicationNo: '',
        filingDate: '',
        patentStatus: '',
        // Funding Details
        fundingAgency: '',
        sanctionedAmount: '',
        duration: '',
        // Files
        document: null,
        documentName: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleIndexedToggle = (val) => {
        setFormData(prev => {
            const current = prev.indexedIn;
            if (current.includes(val)) {
                return { ...prev, indexedIn: current.filter(item => item !== val) };
            } else {
                return { ...prev, indexedIn: [...current, val] };
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFormData({
                ...formData,
                document: e.target.files[0], // In real app, this would be a file object
                documentName: e.target.files[0].name
            });
        }
    };

    const removeFile = () => {
        setFormData({ ...formData, document: null, documentName: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.activityType) {
            setError('Please select an activity type.');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            const result = rndService.submitRnd(formData);
            if (result.success) {
                // Determine redirect or success message. 
                // The new design has "Submit for Review".
                // We'll redirect to dashboard for now.
                navigate('/faculty-dashboard');
            } else {
                setError(result.message || 'Failed to submit. Please try again.');
            }
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div className="rnd-portal">
            <header className="header">
                <div className="header-inner" style={{ gap: '1.5rem' }}>
                    <img src={logo} alt="NEC Logo" style={{ height: '50px', filter: 'brightness(0) invert(1)' }} />
                    <div style={{ flex: 1 }}>
                        <h1 className="header-title" style={{ fontSize: '1.5rem' }}>Nandha Engineering College</h1>
                        <p className="header-subtitle" style={{ fontWeight: 600, letterSpacing: '0.05em', opacity: 0.9 }}>R&D SUBMISSION PORTAL</p>
                    </div>
                    <button
                        onClick={() => navigate('/faculty-dashboard')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                        title="Back to Dashboard"
                    >
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </header>

            <main className="main-container">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            background: 'hsla(0, 72%, 55%, 0.1)',
                            border: '1px solid hsla(0, 72%, 55%, 0.2)',
                            color: 'var(--destructive)',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    )}

                    {/* Research Details */}
                    <div className="section-card rnd-fade-in">
                        <div className="section-indicator" style={{ backgroundColor: 'hsl(217,72%,50%)' }}></div>
                        <div className="section-header">
                            <div className="section-icon"><i className="fas fa-microscope"></i></div>
                            <h2 className="section-title">Research Details</h2>
                        </div>
                        <div className="section-body">
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Type of Activity <span className="required">*</span></label>
                                    <select
                                        className="form-select"
                                        value={formData.activityType}
                                        onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                                        required
                                    >
                                        <option value="">Select activity type...</option>
                                        <option value="journal">Journal Publication</option>
                                        <option value="conference">Conference Paper</option>
                                        <option value="patent">Patent Filing</option>
                                        <option value="book">Book Chapter</option>
                                        <option value="funding">Funded Project</option>
                                        <option value="workshop">Workshop / FDP Conducted</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Title of Research Work <span className="required">*</span></label>
                                    <input
                                        className="form-input"
                                        placeholder="Enter title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Domain / Research Area <span className="required">*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Machine Learning, IoT, Data Science"
                                    required
                                    value={formData.domain}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Abstract</label>
                                <p className="form-hint">Short description of your research (max 300 words)</p>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Write a brief abstract..."
                                    rows="4"
                                    value={formData.abstract}
                                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Journal Details */}
                    {formData.activityType === 'journal' && (
                        <div className="section-card rnd-fade-in">
                            <div className="section-indicator" style={{ backgroundColor: 'hsl(217,72%,50%)' }}></div>
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-book-open"></i></div>
                                <h2 className="section-title">Journal Details</h2>
                            </div>
                            <div className="section-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Journal Name <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="Enter journal name"
                                            value={formData.journalName}
                                            onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ISSN Number <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., 1234-5678"
                                            value={formData.issn}
                                            onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Indexed In</label>
                                    <div className="chip-group">
                                        {['Scopus', 'SCI', 'UGC Care'].map((idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                className={`chip ${formData.indexedIn.includes(idx) ? 'active' : ''}`}
                                                onClick={() => handleIndexedToggle(idx)}
                                            >
                                                {idx}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid-3">
                                    <div className="form-group">
                                        <label className="form-label">Impact Factor</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., 3.5"
                                            type="number"
                                            step="0.01"
                                            value={formData.impactFactor}
                                            onChange={(e) => setFormData({ ...formData, impactFactor: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Volume / Issue / Year</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., Vol.12, Issue 3, 2025"
                                            value={formData.volumeIssueYear}
                                            onChange={(e) => setFormData({ ...formData, volumeIssueYear: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">DOI Number</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., 10.1234/abcd"
                                            value={formData.doi}
                                            onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Conference Details */}
                    {formData.activityType === 'conference' && (
                        <div className="section-card rnd-fade-in">
                            <div className="section-indicator" style={{ backgroundColor: 'hsl(200,80%,48%)' }}></div>
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-award"></i></div>
                                <h2 className="section-title">Conference Details</h2>
                            </div>
                            <div className="section-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Conference Name <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="Enter conference name"
                                            value={formData.conferenceName}
                                            onChange={(e) => setFormData({ ...formData, conferenceName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Organized By <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="Organizing body"
                                            value={formData.organizedBy}
                                            onChange={(e) => setFormData({ ...formData, organizedBy: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid-3">
                                    <div className="form-group">
                                        <label className="form-label">Venue</label>
                                        <input
                                            className="form-input"
                                            placeholder="City, Country"
                                            value={formData.venue}
                                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input
                                            className="form-input"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ISBN Number</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., 978-3..."
                                            value={formData.isbn}
                                            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Patent Details */}
                    {formData.activityType === 'patent' && (
                        <div className="section-card rnd-fade-in">
                            <div className="section-indicator" style={{ backgroundColor: 'hsl(262,60%,55%)' }}></div>
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-shield-alt"></i></div>
                                <h2 className="section-title">Patent Details</h2>
                            </div>
                            <div className="section-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Patent Title <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="Enter patent title"
                                            value={formData.patentTitle}
                                            onChange={(e) => setFormData({ ...formData, patentTitle: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Application Number <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="Enter application number"
                                            value={formData.applicationNo}
                                            onChange={(e) => setFormData({ ...formData, applicationNo: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Filing Date <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            type="date"
                                            value={formData.filingDate}
                                            onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status <span className="required">*</span></label>
                                        <select
                                            className="form-select"
                                            value={formData.patentStatus}
                                            onChange={(e) => setFormData({ ...formData, patentStatus: e.target.value })}
                                            required
                                        >
                                            <option value="">Select status...</option>
                                            <option value="Filed">Filed</option>
                                            <option value="Published">Published</option>
                                            <option value="Granted">Granted</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Funding Details */}
                    {formData.activityType === 'funding' && (
                        <div className="section-card rnd-fade-in">
                            <div className="section-indicator" style={{ backgroundColor: 'hsl(152,60%,42%)' }}></div>
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-money-bill-wave"></i></div>
                                <h2 className="section-title">Funding Details</h2>
                            </div>
                            <div className="section-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Funding Agency <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., DST, AICTE, UGC"
                                            value={formData.fundingAgency}
                                            onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sanctioned Amount (₹) <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            placeholder="e.g., 500000"
                                            value={formData.sanctionedAmount}
                                            onChange={(e) => setFormData({ ...formData, sanctionedAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project Duration</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g., 2 years (2024-2026)"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid-2-lg">
                        {/* Document Uploads */}
                        <div className="section-card rnd-fade-in">
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                                <h2 className="section-title">Document Uploads</h2>
                            </div>
                            <div className="section-body">
                                <div className="form-group">
                                    <label className="form-label">Proof / Document <span className="required">*</span></label>
                                    {!formData.document ? (
                                        <div className="upload-zone" onClick={() => document.getElementById('fileUpload').click()}>
                                            <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                            <p className="upload-text">Click to upload or drag & drop</p>
                                            <p className="upload-hint">.PDF files</p>
                                            <input
                                                id="fileUpload"
                                                type="file"
                                                accept=".pdf"
                                                hidden
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="file-preview">
                                            <i className="fas fa-file-alt file-icon"></i>
                                            <span className="file-name">{formData.documentName}</span>
                                            <button type="button" className="file-remove" onClick={removeFile}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* HOD Approval */}
                        <div className="section-card rnd-fade-in">
                            <div className="section-header">
                                <div className="section-icon"><i className="fas fa-file-contract"></i></div>
                                <h2 className="section-title">HOD Approval</h2>
                            </div>
                            <div className="section-body">
                                <div className="form-group">
                                    <label className="form-label">Current Status</label>
                                    <div className="status-badge status-pending">
                                        <span className="status-dot status-dot-pending"></span>
                                        Pending
                                    </div>
                                </div>
                                <div className="info-box">
                                    <p>Your submission will be reviewed by the Head of Department. You'll receive a notification once the status is updated.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/faculty-dashboard')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i> Submit for Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default RndSubmission;
