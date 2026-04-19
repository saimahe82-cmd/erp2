import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage on mount
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = (role, email, password) => {
        let result;
        switch (role) {
            case 'student':
                result = authService.studentLogin(email, password);
                break;
            case 'faculty':
                result = authService.facultyLogin(email, password);
                break;
            case 'hod':
                result = authService.hodLogin(email, password);
                break;
            default:
                return { success: false, message: 'Invalid role.' };
        }
        if (result.success) {
            setUser(result.user);
        }
        return result;
    };

    const studentSignup = (data) => {
        const result = authService.studentSignup(data);
        if (result.success) {
            setUser(result.user);
        }
        return result;
    };

    const staffSignup = (data) => {
        const result = authService.staffSignup(data);
        if (result.success) {
            setUser(result.user);
        }
        return result;
    };

    const hodSignup = (data) => {
        const result = authService.hodSignup(data);
        if (result.success) {
            setUser(result.user);
        }
        return result;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = () => {
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, studentSignup, staffSignup, hodSignup, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
