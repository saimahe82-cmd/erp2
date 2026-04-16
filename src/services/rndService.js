import db from './api';

const rndService = {
    // ── Submit an R&D request ──
    submitRnd: (data) => {
        const user = db.getCurrentUser();
        if (!user) return { success: false, message: 'You must be logged in.' };

        const request = db.addRequest({
            studentName: user.name,
            studentEmail: user.email,
            registerNo: user.registerNo || user.email, // For faculty this might be ID
            type: 'R&D',
            leaveType: 'rnd', // Using 'rnd' to distinguish in DB
            activityType: data.activityType,
            title: data.title,
            domain: data.domain,
            abstract: data.abstract,
            document: data.document, // Base64 string if implemented
            status: 'pending',
            facultyStatus: 'approved', // Auto-approved for faculty self-submission? Or needs HOD? Assuming needs HOD.
            hodStatus: 'pending',
            appliedAt: new Date().toISOString(),
        });

        db.addNotification({
            userId: user.id,
            message: `Your R&D submission "${data.title}" has been submitted for approval.`,
            type: 'info',
        });

        return { success: true, request };
    },

    // ── Get R&D requests for current user ──
    getMyRndRequests: () => {
        const user = db.getCurrentUser();
        if (!user) return [];
        return db.getRequestsByStudent(user.email)
            .filter((r) => r.leaveType === 'rnd')
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },
};

export default rndService;
