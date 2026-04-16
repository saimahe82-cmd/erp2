import db from './api';

const odService = {
    // ── Submit an OD request ──
    applyOD: (data, callerUser) => {
        const user = callerUser || db.getCurrentUser();
        if (!user) return { success: false, message: 'You must be logged in.' };

        const typeLabels = {
            seminar: 'Seminar/Workshop',
            symposium: 'Symposium',
            placement: 'Placement Activity',
            sports: 'Sports',
            other: 'Other Official Work',
        };

        const request = db.addRequest({
            studentName: user.name,
            studentEmail: user.email,
            registerNo: user.registerNo || user.email,
            type: 'On-Duty',
            leaveType: 'od',
            odType: data.odType,
            odTypeLabel: typeLabels[data.odType] || data.odType,
            fromDate: data.fromDate,
            toDate: data.toDate,
            reason: data.description,
        });

        const displayType = typeLabels[data.odType] || data.odTypeLabel || data.odType;
        db.addNotification({
            userId: user.id,
            message: `Your OD request (${displayType}) from ${data.fromDate} to ${data.toDate} has been submitted.`,
            type: 'info',
        });

        return { success: true, request };
    },

    // ── Get OD requests for current student ──
    getMyODRequests: () => {
        const user = db.getCurrentUser();
        if (!user) return [];
        return db.getRequestsByStudent(user.email)
            .filter((r) => r.leaveType === 'od')
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    },
};

export default odService;
