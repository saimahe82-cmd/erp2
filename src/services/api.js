// =============================================================
// LocalStorage-based API service (no backend required)
// All data persists in the browser's localStorage
// =============================================================

const DB_KEYS = {
    USERS: 'cls_users',
    LEAVE_REQUESTS: 'cls_leave_requests',
    OD_REQUESTS: 'cls_od_requests',
    CURRENT_USER: 'cls_current_user',
    NOTIFICATIONS: 'cls_notifications',
};

// ── Helpers ──────────────────────────────────────────────────

function getCollection(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function setCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ── Seed default data on first load ─────────────────────────

function seedDefaults() {
    const users = getCollection(DB_KEYS.USERS);
    if (users.length === 0) {
        const studentNames = [
            'Arun Kumar', 'Deepa R', 'Karthik S', 'Meera Nair', 'Rahul V',
            'Sneha P', 'Alice Mary', 'Bharath K', 'Divya S', 'Ganesh R'
        ];

        const seededStudents = studentNames.map((name, idx) => ({
            id: generateId() + idx,
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@college.edu`,
            password: 'student123',
            role: 'student',
            registerNo: `CS24${String(idx + 1).padStart(3, '0')}`,
            department: 'CSE',
            year: 'III',
            phone: `987654321${idx}`,
            parentPhone: `987654322${idx}`,
            accommodation: idx % 2 === 0 ? 'Day Scholar' : 'Hosteler',
            leaveBalance: 12,
        }));

        // Seed "Extra" profile data for each student
        seededStudents.forEach((s, idx) => {
            const extraData = {
                section: idx % 2 === 0 ? 'A' : 'B',
                cgpa: (8.0 + (idx * 0.15)).toFixed(2),
                attendance: (85 + (idx % 10)).toString(),
                bloodGroup: 'O+',
                events: [],
                internships: idx % 3 === 0 ? [{
                    company: 'Tech Corp',
                    role: 'Intern',
                    type: 'Software',
                    startDate: '2025-06-01',
                    endDate: '2025-08-01'
                }] : [],
                publications: idx % 4 === 0 ? [{
                    title: 'Modern AI Systems',
                    journal: 'ACM Journal',
                    date: '2025-01-15'
                }] : [],
                certifications: {
                    nptel: idx % 2 === 0 ? [{ title: 'Cloud Computing', status: 'Passed' }] : [],
                    patents: [],
                    verticals: []
                }
            };
            localStorage.setItem(`stu_extra_${s.email}`, JSON.stringify(extraData));
        });

        const studentEmails = seededStudents.map(s => s.email);

        const defaultUsers = [
            {
                id: generateId(),
                name: 'Prof. Richard',
                email: 'richard@college.edu',
                password: 'faculty123',
                role: 'faculty',
                department: 'CSE',
                subject: 'Data Structures',
                proctees: studentEmails,
                students: ['24cs096@nandhaenggg.org'], // Linking John Doe by email
            },
            {
                id: generateId(),
                name: 'Dr. Smith',
                email: 'smith@college.edu',
                password: 'hod123',
                role: 'hod',
                department: 'CSE',
            },
            {
                id: generateId(),
                name: 'Officer Buvana',
                email: 'buvana123@gmail.com',
                password: 'buvana123',
                role: 'od_checker',
                department: 'Admin',
            },
            {
                id: generateId(),
                name: 'John Doe',
                email: '24cs096@nandhaenggg.org',
                password: 'student123',
                role: 'student',
                registerNo: '24CS096',
                department: 'CSE',
                year: 'III',
                phone: '9876543210',
                parentPhone: '9876543211',
                accommodation: 'day-scholar',
                leaveBalance: 12,
            },
            ...seededStudents
        ];
        setCollection(DB_KEYS.USERS, defaultUsers);
    }

    const leaves = getCollection(DB_KEYS.LEAVE_REQUESTS);
    if (leaves.length === 0) {
        const defaultLeaves = [
            {
                id: generateId(),
                studentName: 'John Doe',
                studentEmail: '24cs096@nandhaenggg.org',
                registerNo: '24CS096',
                type: 'On-Duty',
                leaveType: 'od',
                fromDate: '2026-02-20',
                toDate: '2026-02-22',
                reason: 'Hackathon at IIT Madras',
                status: 'pending',
                facultyStatus: 'pending',
                hodStatus: 'pending',
                appliedAt: new Date('2026-02-18').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'John Doe',
                studentEmail: '24cs096@nandhaenggg.org',
                registerNo: '24CS096',
                type: 'Sick Leave',
                leaveType: 'sick',
                fromDate: '2026-02-10',
                toDate: '2026-02-11',
                reason: 'Fever and cold',
                status: 'approved',
                facultyStatus: 'approved',
                hodStatus: 'approved',
                appliedAt: new Date('2026-02-09').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'Alice Mary',
                studentEmail: 'alice@college.edu',
                registerNo: '24CS102',
                type: 'On-Duty',
                leaveType: 'od',
                fromDate: '2026-02-21',
                toDate: '2026-02-22',
                reason: 'Workshop at VIT',
                status: 'pending',
                facultyStatus: 'pending',
                hodStatus: 'pending',
                appliedAt: new Date('2026-02-17').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'Arun Kumar',
                studentEmail: 'arun@college.edu',
                registerNo: 'CS21B001',
                type: 'Leave',
                leaveType: 'personal',
                fromDate: '2026-02-20',
                toDate: '2026-02-20',
                reason: 'Family function',
                status: 'pending',
                facultyStatus: 'pending',
                hodStatus: 'pending',
                appliedAt: new Date('2026-02-18').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'Meera Nair',
                studentEmail: 'meera@college.edu',
                registerNo: 'CS21B034',
                type: 'On-Duty',
                leaveType: 'od',
                fromDate: '2026-02-21',
                toDate: '2026-02-22',
                reason: 'Hackathon - IIT Madras',
                status: 'pending',
                facultyStatus: 'pending',
                hodStatus: 'pending',
                appliedAt: new Date('2026-02-19').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'Sneha P',
                studentEmail: 'sneha@college.edu',
                registerNo: 'CS22B016',
                type: 'Leave',
                leaveType: 'sick',
                fromDate: '2026-02-19',
                toDate: '2026-02-19',
                reason: 'Medical appointment',
                status: 'approved',
                facultyStatus: 'approved',
                hodStatus: 'approved',
                appliedAt: new Date('2026-02-17').toISOString(),
            },
            {
                id: generateId(),
                studentName: 'Rahul V',
                studentEmail: 'rahul@college.edu',
                registerNo: 'CS22B005',
                type: 'On-Duty',
                leaveType: 'od',
                fromDate: '2026-02-18',
                toDate: '2026-02-18',
                reason: 'Workshop at VIT',
                status: 'rejected',
                facultyStatus: 'rejected',
                hodStatus: 'pending',
                appliedAt: new Date('2026-02-16').toISOString(),
            },
        ];
        setCollection(DB_KEYS.LEAVE_REQUESTS, defaultLeaves);
    }
}

// Initialize defaults on import
seedDefaults();

// Force inject buvana if she doesn't exist in existing environments
(function ensureBuvanaExists() {
    const users = getCollection(DB_KEYS.USERS);
    if (!users.find(u => u.email === 'buvana123@gmail.com')) {
        users.push({
            id: generateId(),
            name: 'Officer Buvana',
            email: 'buvana123@gmail.com',
            password: 'buvana123',
            role: 'od_checker',
            department: 'Admin',
        });
        setCollection(DB_KEYS.USERS, users);
    }
})();

// ── Exported DB operations ──────────────────────────────────

const db = {
    // ── Users ──
    getUsers: () => getCollection(DB_KEYS.USERS),
    getUserByEmail: (email) => getCollection(DB_KEYS.USERS).find((u) => u.email.toLowerCase() === email.toLowerCase()),
    getProctorForStudent: (studentEmail) => getCollection(DB_KEYS.USERS).find(u => u.role === 'faculty' && u.proctees && u.proctees.some(e => e.toLowerCase() === studentEmail.toLowerCase())),
    getClassFacultyForStudent: (studentEmail) => getCollection(DB_KEYS.USERS).find(u => u.role === 'faculty' && u.students && u.students.some(e => e.toLowerCase() === studentEmail.toLowerCase())),
    addUser: (user) => {
        const users = getCollection(DB_KEYS.USERS);
        const newUser = { ...user, id: generateId() };
        users.push(newUser);
        setCollection(DB_KEYS.USERS, users);
        return newUser;
    },
    updateUser: (id, updates) => {
        const users = getCollection(DB_KEYS.USERS);
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updates };
            setCollection(DB_KEYS.USERS, users);
            return users[idx];
        }
        return null;
    },

    // ── Session ──
    setCurrentUser: (user) => localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user)),
    getCurrentUser: () => {
        try {
            const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },
    clearCurrentUser: () => localStorage.removeItem(DB_KEYS.CURRENT_USER),

    // ── Leave & OD Requests ──
    getRequests: () => getCollection(DB_KEYS.LEAVE_REQUESTS),
    getRequestsByStudent: (email) =>
        getCollection(DB_KEYS.LEAVE_REQUESTS).filter((r) => r.studentEmail.toLowerCase() === email.toLowerCase()),
    getRequestsByStatus: (status) =>
        getCollection(DB_KEYS.LEAVE_REQUESTS).filter((r) => r.status === status),
    getPendingFacultyRequests: (facultyEmail) =>
        getCollection(DB_KEYS.LEAVE_REQUESTS).filter((r) => {
            if (!facultyEmail) return true; // Legacy support or admin view
            const email = facultyEmail.toLowerCase();
            // Case 1: Faculty is proctor and proctor approval is pending
            const isPendingProctor = r.proctorEmail?.toLowerCase() === email && r.proctorStatus === 'pending';
            // Case 2: Faculty is class faculty and proctor has approved but class faculty hasn't
            const isPendingClassFaculty = r.classFacultyEmail?.toLowerCase() === email && r.proctorStatus === 'approved' && r.classFacultyStatus === 'pending';

            // For backward compatibility with requests before this change
            const isLegacyPending = !r.proctorEmail && r.facultyStatus === 'pending';

            return isPendingProctor || isPendingClassFaculty || isLegacyPending;
        }),
    getPendingHodRequests: () =>
        getCollection(DB_KEYS.LEAVE_REQUESTS).filter((r) => {
            const isFacultyApproved = r.classFacultyStatus === 'approved' || (!r.classFacultyEmail && r.facultyStatus === 'approved');
            if (r.leaveType === 'od' && (r.odType || r.odTypeLabel)?.toLowerCase().includes('event')) {
                return isFacultyApproved && r.hodStatus === 'pending' && r.checkerStatus === 'approved';
            }
            return isFacultyApproved && r.hodStatus === 'pending';
        }),
    addRequest: (request) => {
        const requests = getCollection(DB_KEYS.LEAVE_REQUESTS);
        const proctor = db.getProctorForStudent(request.studentEmail);
        const classFaculty = db.getClassFacultyForStudent(request.studentEmail);

        const newReq = {
            ...request,
            id: generateId(),
            status: 'pending',
            proctorEmail: proctor?.email || null,
            classFacultyEmail: classFaculty?.email || null,
            proctorStatus: request.proctorStatus || 'pending',
            classFacultyStatus: request.classFacultyStatus || 'pending',
            hodStatus: request.hodStatus || 'pending',
            facultyStatus: request.facultyStatus || 'pending', // Keep for backward compatibility
            checkerStatus: (request.odType || request.odTypeLabel)?.toLowerCase().includes('event') ? 'pending' : 'not_required',
            appliedAt: new Date().toISOString(),
        };
        requests.push(newReq);
        setCollection(DB_KEYS.LEAVE_REQUESTS, requests);
        return newReq;
    },
    updateRequest: (id, updates) => {
        const requests = getCollection(DB_KEYS.LEAVE_REQUESTS);
        const idx = requests.findIndex((r) => r.id === id);
        if (idx !== -1) {
            requests[idx] = { ...requests[idx], ...updates };

            const r = requests[idx];
            // Auto-set overall status
            const isRejected = r.proctorStatus === 'rejected' ||
                r.classFacultyStatus === 'rejected' ||
                r.hodStatus === 'rejected' ||
                r.facultyStatus === 'rejected'; // legacy

            const isApproved = r.hodStatus === 'approved';

            if (isRejected) {
                requests[idx].status = 'rejected';
            } else if (isApproved) {
                requests[idx].status = 'approved';
            } else {
                requests[idx].status = 'pending';
            }

            setCollection(DB_KEYS.LEAVE_REQUESTS, requests);
            return requests[idx];
        }
        return null;
    },
    deleteRequest: (id) => {
        let requests = getCollection(DB_KEYS.LEAVE_REQUESTS);
        requests = requests.filter((r) => r.id !== id);
        setCollection(DB_KEYS.LEAVE_REQUESTS, requests);
    },

    // ── Notifications ──
    getNotifications: (userId) => getCollection(DB_KEYS.NOTIFICATIONS).filter((n) => n.userId === userId),
    addNotification: (notification) => {
        const notifs = getCollection(DB_KEYS.NOTIFICATIONS);
        notifs.push({ ...notification, id: generateId(), read: false, createdAt: new Date().toISOString() });
        setCollection(DB_KEYS.NOTIFICATIONS, notifs);
    },
    markNotificationRead: (id) => {
        const notifs = getCollection(DB_KEYS.NOTIFICATIONS);
        const idx = notifs.findIndex((n) => n.id === id);
        if (idx !== -1) {
            notifs[idx].read = true;
            setCollection(DB_KEYS.NOTIFICATIONS, notifs);
        }
    },

    // ── Utility ──
    generateId,
};

export default db;
