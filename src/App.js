import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Welcome from './pages/Welcome';
import StaffSelection from './pages/StaffSelection';
import FacultyLogin from './pages/FacultyLogin';
import HodLogin from './pages/HodLogin';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HodDashboard from './pages/HodDashboard';
import StudentSignup from './pages/StudentSignup';
import StaffSignup from './pages/StaffSignup';
import LeaveApplication from './pages/LeaveApplication';
import ODApplication from './pages/ODApplication';
import RndSubmission from './pages/RndSubmission';
import FacultyLeaveApplication from './pages/FacultyLeaveApplication';
import FacultyAchievements from './pages/FacultyAchievements';
import StudentAnalysis from './pages/StudentAnalysis';
import DashboardLayout from './components/DashboardLayout';
import ODChecker from './pages/ODChecker';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/staff" element={<StaffSelection />} />
                    <Route path="/faculty-login" element={<FacultyLogin />} />
                    <Route path="/hod-login" element={<HodLogin />} />
                    <Route path="/student-login" element={<StudentLogin />} />
                    <Route path="/student-signup" element={<StudentSignup />} />
                    <Route path="/staff-signup" element={<StaffSignup />} />

                    {/* Student Dashboard Layout Routes */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/student-dashboard" element={
                            <PrivateRoute roles={['student']}>
                                <StudentDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/apply-leave" element={
                            <PrivateRoute roles={['student']}>
                                <LeaveApplication />
                            </PrivateRoute>
                        } />
                        <Route path="/apply-od" element={
                            <PrivateRoute roles={['student']}>
                                <ODApplication />
                            </PrivateRoute>
                        } />
                    </Route>

                    {/* Non-Layout Routes (Manage their own navigation) */}
                    <Route path="/staff-dashboard" element={
                        <PrivateRoute roles={['faculty', 'hod']}>
                            <StaffDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/faculty-dashboard" element={
                        <PrivateRoute roles={['faculty']}>
                            <FacultyDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/hod-dashboard" element={
                        <PrivateRoute roles={['hod']}>
                            <HodDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/rnd-submission" element={
                        <PrivateRoute roles={['faculty']}>
                            <RndSubmission />
                        </PrivateRoute>
                    } />
                    <Route path="/faculty-leave-application" element={
                        <PrivateRoute roles={['faculty']}>
                            <FacultyLeaveApplication />
                        </PrivateRoute>
                    } />
                    <Route path="/faculty-achievements" element={
                        <PrivateRoute roles={['faculty']}>
                            <FacultyAchievements />
                        </PrivateRoute>
                    } />
                    <Route path="/faculty-apply" element={
                        <PrivateRoute roles={['faculty']}>
                            <FacultyLeaveApplication />
                        </PrivateRoute>
                    } />
                    <Route path="/od-checker" element={
                        <PrivateRoute roles={['od_checker']}>
                            <ODChecker />
                        </PrivateRoute>
                    } />
                    <Route path="/student-analysis" element={
                        <PrivateRoute roles={['student']}>
                            <StudentAnalysis />
                        </PrivateRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
