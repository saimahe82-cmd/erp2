import db from './api';

const leaveService = {
    // ── Submit a leave request ──
    applyLeave: (data, callerUser) => {
        const user = callerUser || db.getCurrentUser();
        if (!user) return { success: false, message: 'You must be logged in.' };

        const typeLabels = {
            sick: 'Sick Leave',
            personal: 'Personal Leave',
            medical: 'Medical Leave',
            od: 'On-Duty',
            emergency: 'Emergency Leave'
        };

        const request = db.addRequest({
            studentName: user.name,
            studentEmail: user.email,
            registerNo: user.registerNo || user.email,
            type: typeLabels[data.leaveType] || 'Leave Request',
            leaveType: data.leaveType,
            fromDate: data.fromDate,
            toDate: data.toDate,
            reason: data.reason,
            alterations: data.alterations || [],
            // If faculty applies, it's auto-approved by "faculty" (themselves) and goes to HOD
            facultyStatus: user.role === 'faculty' ? 'approved' : 'pending',
            hodStatus: 'pending',
            medicalCertificate: null,
        });

        db.addNotification({
            userId: user.id,
            message: `Your ${request.type} request from ${data.fromDate} to ${data.toDate} has been submitted.`,
            type: 'info',
        });

        return { success: true, request };
    },

    // ── Medical Certificate Upload ──
    uploadMedicalCertificate: (requestId, fileData) => {
        const request = db.updateRequest(requestId, {
            medicalCertificate: fileData,
            medicalCertificateUploadedAt: new Date().toISOString(),
        });
        return { success: true, request };
    },

    // ── Get all leave requests for current student ──
    getMyRequests: () => {
        const user = db.getCurrentUser();
        if (!user) return [];
        return db.getRequestsByStudent(user.email).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },

    // ── Get leave stats for current student ──
    getMyStats: () => {
        const user = db.getCurrentUser();
        if (!user) return { balance: 12, approved: 0, pending: 0, rejected: 0 };
        const requests = db.getRequestsByStudent(user.email);
        const approved = requests.filter((r) => r.status === 'approved').length;
        const pending = requests.filter((r) => r.status === 'pending').length;
        const rejected = requests.filter((r) => r.status === 'rejected').length;
        return {
            balance: (user.leaveBalance || 12) - approved,
            approved,
            pending,
            rejected,
        };
    },

    // ── Faculty: get pending requests ──
    getPendingForFaculty: () => {
        const user = db.getCurrentUser();
        if (!user || user.role !== 'faculty') return [];
        return db.getPendingFacultyRequests(user.email).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },

    // ── Faculty: actions ──
    facultyApproveLocal: (requestId) => {
        // Approves current stage and skips everything else (auto-approves HOD)
        const request = db.updateRequest(requestId, {
            proctorStatus: 'approved',
            classFacultyStatus: 'approved',
            facultyStatus: 'approved', // legacy
            hodStatus: 'approved'
        });
        if (request) {
            db.addNotification({
                userId: request.studentEmail,
                message: `Your ${request.type} request has been fully APPROVED by faculty.`,
                type: 'success',
            });
        }
        return request;
    },

    facultyForwardToHod: (requestId) => {
        const user = db.getCurrentUser();
        const existing = db.getRequests().find(r => r.id === requestId);
        if (!existing) return null;

        const isProctor = existing.proctorEmail?.toLowerCase() === user.email.toLowerCase();
        const isClassFaculty = existing.classFacultyEmail?.toLowerCase() === user.email.toLowerCase();

        let updates = {};
        let message = '';

        if (isProctor && existing.proctorStatus === 'pending') {
            updates.proctorStatus = 'approved';
            // If there's no class faculty OR the proctor IS the class faculty, move to HOD
            if (!existing.classFacultyEmail || isClassFaculty) {
                updates.classFacultyStatus = 'approved';
                updates.facultyStatus = 'approved';
                message = `Your ${existing.type} request approved by Proctor and moved to HOD.`;
            } else {
                message = `Your ${existing.type} request approved by Proctor and moved to Class Faculty.`;
            }
        } else if (isClassFaculty && existing.classFacultyStatus === 'pending') {
            updates.classFacultyStatus = 'approved';
            updates.facultyStatus = 'approved';
            message = `Your ${existing.type} request approved by Class Faculty and moved to HOD.`;
        } else if (!existing.proctorEmail) {
            // Legacy/Fallback
            updates.facultyStatus = 'approved';
            message = `Your ${existing.type} request approved by faculty and moved to HOD.`;
        }

        const request = db.updateRequest(requestId, updates);
        if (request && message) {
            db.addNotification({
                userId: request.studentEmail,
                message: message,
                type: 'info',
            });
        }
        return request;
    },

    facultyReject: (requestId) => {
        const user = db.getCurrentUser();
        const existing = db.getRequests().find(r => r.id === requestId);

        let updates = {};
        if (existing?.proctorEmail?.toLowerCase() === user.email.toLowerCase()) {
            updates.proctorStatus = 'rejected';
        } else if (existing?.classFacultyEmail?.toLowerCase() === user.email.toLowerCase()) {
            updates.classFacultyStatus = 'rejected';
        }
        updates.facultyStatus = 'rejected'; // legacy

        const request = db.updateRequest(requestId, updates);
        if (request) {
            db.addNotification({
                userId: request.studentEmail,
                message: `Your ${request.type} request has been REJECTED by faculty.`,
                type: 'error',
            });
        }
        return request;
    },

    // ── HOD: get pending requests (faculty-approved) ──
    getPendingForHod: () => {
        return db.getPendingHodRequests().sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },

    // ── HOD: approve/reject request ──
    hodAction: (requestId, action) => {
        const request = db.updateRequest(requestId, {
            hodStatus: action, // 'approved' or 'rejected'
        });
        if (request) {
            db.addNotification({
                userId: request.studentEmail,
                message: `Your ${request.type} request has been ${action} by HOD.`,
                type: action === 'approved' ? 'success' : 'error',
            });
        }
        return request;
    },

    // ── Get all requests (for admin/reports) ──
    getAllRequests: () => {
        return db.getRequests().sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },

    // ── OD Verification ──
    uploadOdProof: (requestId, proofData) => {
        // proofData: { file (Geotag Base64), location: { lat, lng }, certificate: Base64 (Optional), prize: String (Optional) }
        const request = db.updateRequest(requestId, {
            odProof: proofData.file,
            odProofLocation: proofData.location,
            odProofUploadedAt: new Date().toISOString(),
            odCertificate: proofData.certificate || null,
            odPrize: proofData.prize || null,
        });
        return { success: true, request };
    },

    getOverdueOdProofs: () => {
        const allRequests = db.getRequests();
        const now = new Date();
        return allRequests.filter(req => {
            if (req.type !== 'On-Duty' && req.type !== 'od' && !req.type.toLowerCase().includes('od')) return false;
            if (req.status !== 'approved') return false;

            // Check if OD proof is missing
            if (req.odProof) return false;

            // Check if OD period has ended
            const endDate = new Date(req.toDate);
            // Add 1 day buffer to end date to allow upload on the last day
            endDate.setHours(23, 59, 59, 999);

            return now > endDate;
        });
    },

    deleteRequest: (requestId) => {
        db.deleteRequest(requestId);
        return { success: true };
    },
};

export default leaveService;
