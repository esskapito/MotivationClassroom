// Path: api/server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const BASE_PATH = '/dashboard'; // Define subfolder

// --- Middleware ---
app.use(express.json());

// --- Security & Helper Utilities ---
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const generateToken = () => crypto.randomBytes(16).toString('hex');

const hashPassword = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};
const verifyPassword = (password, hash, salt) => {
    const hashToVerify = hashPassword(password, salt);
    return hash === hashToVerify;
};

const generateStudentCode = (studentsInClass) => {
    const existingCodes = new Set(studentsInClass.map(s => s.accessCode));
    let newCode;
    do {
        newCode = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existingCodes.has(newCode));
    return newCode;
};

// --- Database Utilities ---
const initDb = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ classrooms: {} }, null, 2));
    }
};
const readDb = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));


// --- API Endpoints ---
const apiRouter = express.Router();

apiRouter.get('/class.php', (req, res) => {
    const { action, code } = req.query;
    if (action === 'get') {
        const db = readDb();
        const classroom = db.classrooms[code];
        if (classroom) {
            // Sanitize classroom data, only include what's safe for clients
            const sanitizedClassroom = { 
                id: classroom.id, 
                name: classroom.name || null, 
                students: classroom.students, 
                announcement: classroom.announcement || null,
                secretQuestion: classroom.secretQuestion || null // Send question for potential recovery flow
            };
            return res.json(sanitizedClassroom);
        } else {
            return res.status(404).json({ message: "Classe non trouvée." });
        }
    }
    return res.status(400).json({ message: "Action GET non reconnue." });
});

apiRouter.post('/join.php', (req, res) => {
    const { classCode, studentCode } = req.body;
    const db = readDb();
    const classroom = db.classrooms[classCode];
    if (!classroom) return res.status(404).json({ message: "Classe non trouvée." });
    const student = classroom.students.find(s => s.accessCode === studentCode);
    if (!student) return res.status(403).json({ message: "Code étudiant invalide." });
    const sanitizedClassroom = { id: classroom.id, name: classroom.name || null, students: classroom.students, announcement: classroom.announcement || null };
    return res.json({ classroom: sanitizedClassroom, student });
});

apiRouter.post('/student/set_name.php', (req, res) => {
    const { classCode, accessCode, name } = req.body;
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "Le nom d'utilisateur est invalide." });
    }
    const db = readDb();
    const classroom = db.classrooms[classCode];
    if (!classroom) return res.status(404).json({ message: "Classe non trouvée." });
    
    const student = classroom.students.find(s => s.accessCode === accessCode);
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé." });

    if (student.name !== null) {
        return res.json(student);
    }
    
    student.name = name.trim();
    writeDb(db);
    res.json(student);
});


apiRouter.post('/teacher.php', (req, res) => {
    const { action } = req.query;
    const db = readDb();
    if (action === 'create') {
        const { password, className, secretQuestion, secretAnswer } = req.body;
        if (!password || !className || !secretQuestion || !secretAnswer) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }
        if (password.length < 4 || className.trim().length < 2 || secretQuestion.trim().length < 10 || secretAnswer.trim().length < 4) {
             return res.status(400).json({ message: "Veuillez respecter les longueurs minimales requises pour chaque champ." });
        }

        const slug = className.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').substring(0, 25);
        if (!slug) {
            return res.status(400).json({ message: "Le nom de la classe contient des caractères invalides." });
        }
        const classId = `CLS-${slug}`;

        if (db.classrooms[classId]) {
            return res.status(409).json({ message: "Ce nom de classe est déjà pris. Veuillez en choisir un autre." });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(password, salt);
        const secretAnswerSalt = crypto.randomBytes(16).toString('hex');
        const secretAnswerHash = hashPassword(secretAnswer.trim(), secretAnswerSalt);
        const teacherToken = generateToken();

        db.classrooms[classId] = { 
            id: classId, 
            name: className.trim(), 
            salt, 
            passwordHash, 
            teacherToken, 
            secretQuestion: secretQuestion.trim(),
            secretAnswerSalt,
            secretAnswerHash,
            students: [], 
            announcement: null 
        };
        writeDb(db);

        const sanitizedClassroom = { id: classId, name: className.trim(), students: [], announcement: null, secretQuestion: secretQuestion.trim() };
        return res.status(201).json({ classroom: sanitizedClassroom, teacherToken });
    }
    if (action === 'login') {
        const { classCode, password } = req.body;
        const classroom = db.classrooms[classCode];
        if (!classroom) return res.status(404).json({ message: "Classe non trouvée." });
        if (verifyPassword(password, classroom.passwordHash, classroom.salt)) {
            const newTeacherToken = generateToken();
            db.classrooms[classCode].teacherToken = newTeacherToken;
            writeDb(db);
            const sanitizedClassroom = { id: classroom.id, name: classroom.name || null, students: classroom.students, announcement: classroom.announcement || null, secretQuestion: classroom.secretQuestion || null };
            return res.json({ classroom: sanitizedClassroom, teacherToken: newTeacherToken });
        } else {
            return res.status(403).json({ message: "Mot de passe incorrect." });
        }
    }
    return res.status(400).json({ message: "Action enseignant non reconnue." });
});

// --- Public Teacher Reset Actions ---
const teacherResetRouter = express.Router();

teacherResetRouter.post('/', (req, res) => {
    const { action } = req.query;
    const db = readDb();

    if (action === 'get_question') {
        const { classCode } = req.body;
        const classroom = db.classrooms[classCode];
        if (!classroom || !classroom.secretQuestion) {
            return res.status(404).json({ message: "Classe non trouvée ou aucune question de sécurité configurée." });
        }
        return res.json({ secretQuestion: classroom.secretQuestion });
    }

    if (action === 'reset_password') {
        const { classCode, secretAnswer, newPassword } = req.body;
         if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: "Le nouveau mot de passe est invalide." });
        }
        const classroom = db.classrooms[classCode];
        if (!classroom) {
            return res.status(404).json({ message: "Classe non trouvée." });
        }

        if (verifyPassword(secretAnswer, classroom.secretAnswerHash, classroom.secretAnswerSalt)) {
            // Answer is correct, update password
            const newPasswordHash = hashPassword(newPassword, classroom.salt); // Reuse original password salt
            classroom.passwordHash = newPasswordHash;
            classroom.teacherToken = generateToken(); // Invalidate old tokens
            writeDb(db);
            return res.json({ message: "Mot de passe réinitialisé avec succès." });
        } else {
            return res.status(403).json({ message: "La réponse secrète est incorrecte." });
        }
    }

    return res.status(400).json({ message: "Action de réinitialisation non reconnue." });
});


// Protected (Teacher-Only) Actions
const teacherActionsRouter = express.Router();
teacherActionsRouter.use((req, res, next) => {
    const { classCode, teacherToken } = req.body;
    if (!teacherToken) return res.status(401).json({ message: "Token d'authentification manquant." });
    const db = readDb();
    const classroom = db.classrooms[classCode];
    if (!classroom || classroom.teacherToken !== teacherToken) {
        return res.status(403).json({ message: "Token invalide ou expiré. Veuillez vous reconnecter." });
    }
    req.db = db;
    req.classroom = classroom;
    next();
});

teacherActionsRouter.post('/student.php', (req, res) => {
    const { action } = req.query;
    const { db, classroom } = req;
    if (action === 'add') {
        const newStudent = { 
            id: generateId('S'), 
            accessCode: generateStudentCode(classroom.students), 
            name: null,
            score: 0,
            scoreHistory: [] 
        };
        classroom.students.push(newStudent);
        writeDb(db);
        res.status(201).json({ newStudent, updatedClassroom: classroom });
    } else if (action === 'update_score') {
        const { studentId, score } = req.body;
        const student = classroom.students.find(s => s.id === studentId);
        if (!student) return res.status(404).json({ message: "Étudiant non trouvé." });
        student.score = Number(score);
        writeDb(db);
        res.json(classroom);
    } else if (action === 'remove') {
        const { studentId } = req.body;
        const studentIndex = classroom.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) return res.status(404).json({ message: "Étudiant non trouvé." });
        
        classroom.students.splice(studentIndex, 1);
        writeDb(db);
        res.json(classroom);
    } else {
        res.status(400).json({ message: "Action non reconnue." });
    }
});

teacherActionsRouter.post('/classroom.php', (req, res) => {
    const { action } = req.query;
    const { db, classroom } = req;

    if (action === 'reset_scores') {
        const today = new Date().toISOString().split('T')[0];
        classroom.students.forEach(student => {
            if (!student.scoreHistory) {
                student.scoreHistory = [];
            }
            student.scoreHistory.push({ date: today, score: student.score });
            student.score = 0;
        });
        writeDb(db);
        res.json(classroom);
    } else if (action === 'delete') {
        delete db.classrooms[req.body.classCode];
        writeDb(db);
        res.json({ message: "Classe supprimée avec succès." });
    } else if (action === 'update_announcement') {
        const { announcement } = req.body;
        classroom.announcement = announcement || null;
        writeDb(db);
        res.json(classroom);
    } else {
        res.status(400).json({ message: "Action non reconnue pour la classe." });
    }
});

// --- Server Routing ---
// Mount API routers with the base path
app.use(`${BASE_PATH}/api`, apiRouter);
app.use(`${BASE_PATH}/api/teacher/reset.php`, teacherResetRouter);
app.use(`${BASE_PATH}/api/teacher`, teacherActionsRouter);

// Serve static files from the project root, but make them available under BASE_PATH
app.use(BASE_PATH, express.static(path.join(__dirname, '..')));

// Add a redirect from the root to the subfolder for convenience
app.get('/', (req, res) => {
    res.redirect(301, BASE_PATH);
});

// The catch-all for the React app, ensuring it's served for any deep link within the subfolder
app.get(`${BASE_PATH}/*`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- Start Server ---
initDb();
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});