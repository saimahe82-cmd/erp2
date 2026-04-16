import db from './services/api.js';
import leaveService from './services/leaveService.js';
import odService from './services/odService.js';

// Setup Mock User manually if needed
const facultyUser = { name: "Prof. Richard", email: "richard@college.edu", role: "faculty" };
localStorage.setItem('cls_current_user', JSON.stringify({ name: "John Doe", email: "24cs096@nandhaenggg.org", role: "student", registerNo: "24CS096" }));

console.log("Submitting as Student...");
odService.applyOD({
    odType: 'workshop',
    fromDate: '2026-03-25',
    toDate: '2026-03-26',
    description: 'Node script test'
});

console.log("Switching to Faculty...");
localStorage.setItem('cls_current_user', JSON.stringify(facultyUser));

const pending = leaveService.getPendingForFaculty();
console.log("Pending:", pending.length);

const all = leaveService.getAllRequests().filter(r => r.studentEmail !== (facultyUser.email));
const fu = db.getUserByEmail(facultyUser.email);
const myProctees = (fu.proctees || []).map(e => e.toLowerCase());
const myStudents = (fu.students || []).map(e => e.toLowerCase());

const allRequests = all.filter(r =>
    myProctees.includes(r.studentEmail.toLowerCase()) ||
    myStudents.includes(r.studentEmail.toLowerCase())
);
console.log("All (Students) Requests:", allRequests.length);

const myReqs = leaveService.getMyRequests();
console.log("My (Faculty) Requests:", myReqs.length);

if (myReqs.some(r => r.studentEmail === '24cs096@nandhaenggg.org')) {
    console.log("BUG DETECTED: Student request appears in myRequests!");
} else {
    console.log("myRequests correctly does not contain student requests.");
}
