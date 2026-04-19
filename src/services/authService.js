import db from './api';

const authService = {
    // ── Student Login ──
    studentLogin: (email, password) => {
        const user = db.getUserByEmail(email);
        if (!user) return { success: false, message: 'Account not found. Please sign up first.' };
        if (user.role !== 'student') return { success: false, message: 'This is not a student account.' };
        if (user.password !== password) return { success: false, message: 'Incorrect password.' };
        db.setCurrentUser(user);
        return { success: true, user };
    },

    // ── Faculty Login ──
    facultyLogin: (email, password) => {
        const user = db.getUserByEmail(email);
        if (!user) return { success: false, message: 'Account not found. Please sign up first.' };
        if (user.role !== 'faculty' && user.role !== 'od_checker') return { success: false, message: 'This is not a faculty account.' };
        if (user.password !== password) return { success: false, message: 'Incorrect password.' };
        db.setCurrentUser(user);
        localStorage.setItem('facultyName', user.name);
        localStorage.setItem('facultyEmail', user.email);
        localStorage.setItem('facultySubject', user.subject || '');
        return { success: true, user };
    },

    // ── HOD Login ──
    hodLogin: (email, password) => {
        const user = db.getUserByEmail(email);
        if (!user) return { success: false, message: 'Account not found. Please sign up first.' };
        if (user.role !== 'hod') return { success: false, message: 'This is not an HOD account.' };
        if (user.password !== password) return { success: false, message: 'Incorrect password.' };
        db.setCurrentUser(user);
        return { success: true, user };
    },

    // ── Student Signup ──
    studentSignup: (data) => {
        const email = data.email.trim().toLowerCase();
        const existing = db.getUserByEmail(email);
        if (existing) return { success: false, message: 'An account with this email already exists.' };
        if (data.password !== data.confirmPassword) return { success: false, message: 'Passwords do not match.' };
        const newUser = db.addUser({
            name: data.name,
            email: data.email,
            password: data.password,
            role: 'student',
            registerNo: data.registerNo,
            department: data.department,
            year: data.year,
            phone: data.phone,
            parentPhone: data.parentPhone,
            accommodation: data.accommodation,
            vertical: data.vertical,
            address: data.address || '',
            guardianName: data.guardianName || '',
            guardianPhone: data.guardianPhone || '',
            leaveBalance: 12,
        });
        db.setCurrentUser(newUser);
        return { success: true, user: newUser };
    },

    // ── Link Student By Email (Faculty Action) ──
    linkStudentByEmail: (email, facultyEmail, type) => {
        const studentEmail = email.trim().toLowerCase();
        const student = db.getUserByEmail(studentEmail);

        if (!student) {
            return { success: false, message: 'No student with that Mail ID' };
        }

        if (student.role !== 'student') {
            return { success: false, message: 'This email is not associated with a student account.' };
        }

        const faculty = db.getUserByEmail(facultyEmail);
        if (faculty) {
            const listKey = type === 'proctee' ? 'proctees' : 'students';
            const currentList = faculty[listKey] || [];

            // Check if already linked
            if (currentList.includes(student.email)) {
                return { success: false, message: `This student is already in your ${type} list.` };
            }

            db.updateUser(faculty.id, {
                [listKey]: [...currentList, student.email]
            });
            return { success: true, user: student };
        }

        return { success: false, message: 'Faculty record not found.' };
    },

    // ── Staff Signup ──
    staffSignup: (data) => {
        const existing = db.getUserByEmail(data.email);
        if (existing) return { success: false, message: 'An account with this email already exists.' };
        if (data.password !== data.confirmPassword) return { success: false, message: 'Passwords do not match.' };
        const newUser = db.addUser({
            name: data.name,
            email: data.email,
            password: data.password,
            role: 'faculty',
            department: data.department,
            subject: data.subject,
            proctees: [],
            students: [],
        });
        db.setCurrentUser(newUser);
        localStorage.setItem('facultyName', newUser.name);
        localStorage.setItem('facultyEmail', newUser.email);
        localStorage.setItem('facultySubject', newUser.subject || '');
        return { success: true, user: newUser };
    },

    // ── HOD Signup ──
    hodSignup: (data) => {
        const existing = db.getUserByEmail(data.email);
        if (existing) return { success: false, message: 'An account with this email already exists.' };
        if (data.password !== data.confirmPassword) return { success: false, message: 'Passwords do not match.' };
        const newUser = db.addUser({
            name: data.name,
            email: data.email,
            password: data.password,
            role: 'hod',
            department: data.department,
        });
        db.setCurrentUser(newUser);
        return { success: true, user: newUser };
    },

    // ── Logout ──
    logout: () => {
        db.clearCurrentUser();
        localStorage.removeItem('facultyName');
        localStorage.removeItem('facultyEmail');
        localStorage.removeItem('facultySubject');
    },

    // ── Get Current User ──
    getCurrentUser: () => db.getCurrentUser(),

    // ── Check if logged in ──
    isLoggedIn: () => !!db.getCurrentUser(),
};

export default authService;
