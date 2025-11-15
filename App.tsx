// Path: App.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Student, Classroom } from './types';
import LoginView from './components/LoginView';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import SetUsernameView from './components/SetUsernameView';
import { createClassroomAPI, joinClassroomAPI, getClassroomAPI, addStudentAPI, updateScoreAPI, loginTeacherAPI, resetScoresAPI, setStudentNameAPI, removeStudentAPI, deleteClassroomAPI, updateAnnouncementAPI, getSecretQuestionAPI, resetPasswordAPI } from './services/apiService';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import ConfirmationModal from './components/ConfirmationModal';
import HistoryModal from './components/HistoryModal';

const App: React.FC = () => {
    const [view, setView] = useState<View>(View.Login);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
    const [teacherToken, setTeacherToken] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Use a ref for a synchronous lock to prevent double-submits
    const submissionLockRef = useRef(false);

    const clearSession = useCallback(() => {
        sessionStorage.removeItem('classCode');
        sessionStorage.removeItem('studentAccessCode');
        sessionStorage.removeItem('teacherToken');
        setTeacherToken(null);
        setClassroom(null);
        setCurrentStudent(null);
        setView(View.Login);
    }, []);
    
    useEffect(() => {
        const loadSession = async () => {
            setIsPageLoading(true);
            try {
                const savedClassCode = sessionStorage.getItem('classCode');
                const savedStudentAccessCode = sessionStorage.getItem('studentAccessCode');
                const savedTeacherToken = sessionStorage.getItem('teacherToken');

                if (savedClassCode) {
                    const data = await getClassroomAPI(savedClassCode);
                    setClassroom(data);
                    
                    if (savedTeacherToken) {
                        setTeacherToken(savedTeacherToken);
                        setView(View.Teacher);
                    } else if (savedStudentAccessCode) {
                        const student = data.students.find(s => s.accessCode === savedStudentAccessCode);
                        if (student) {
                            setCurrentStudent(student);
                            if (student.name) {
                                setView(View.Student);
                            } else {
                                setView(View.SetUsername);
                            }
                        } else {
                           clearSession();
                        }
                    } else {
                        setView(View.Login);
                    }
                } else {
                     setView(View.Login);
                }
            } catch (error) {
                console.error("Session could not be restored:", error);
                clearSession();
            } finally {
                setIsPageLoading(false);
            }
        };
        loadSession();
    }, [clearSession]);

    useEffect(() => {
        if (view !== View.Student || !classroom?.id) return;
        const intervalId = setInterval(async () => {
            try {
                const updatedClassroom = await getClassroomAPI(classroom.id!);
                setClassroom(updatedClassroom);
                if (currentStudent) {
                    const updatedStudent = updatedClassroom.students.find(s => s.id === currentStudent.id);
                    if (updatedStudent) setCurrentStudent(updatedStudent);
                }
            } catch (error) { console.error("Polling failed:", error); }
        }, 3000);
        return () => clearInterval(intervalId);
    }, [view, classroom?.id, currentStudent?.id]);

    const handleCreateClass = useCallback(async (password: string, className: string, secretQuestion: string, secretAnswer: string) => {
        if (submissionLockRef.current) return;
        submissionLockRef.current = true;
        setIsSubmitting(true);
        try {
            const { classroom: newClassroom, teacherToken: token } = await createClassroomAPI(password, className, secretQuestion, secretAnswer);
            setClassroom(newClassroom);
            setTeacherToken(token);
            setView(View.Teacher);
            sessionStorage.setItem('classCode', newClassroom.id);
            sessionStorage.setItem('teacherToken', token);
        } catch (error) {
            setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de créer la classe." });
        } finally {
            setIsSubmitting(false);
            submissionLockRef.current = false;
        }
    }, []);

    const handleTeacherLogin = useCallback(async (classCode: string, password: string) => {
        if (submissionLockRef.current) return;
        submissionLockRef.current = true;
        setIsSubmitting(true);
        try {
            const { classroom: loggedInClassroom, teacherToken: token } = await loginTeacherAPI(classCode, password);
            setClassroom(loggedInClassroom);
            setTeacherToken(token);
            setView(View.Teacher);
            sessionStorage.setItem('classCode', loggedInClassroom.id);
            sessionStorage.setItem('teacherToken', token);
        } catch(error) {
            setModalContent({ title: "Erreur de Connexion", message: error instanceof Error ? error.message : "Vérifiez vos identifiants." });
        } finally {
            setIsSubmitting(false);
            submissionLockRef.current = false;
        }
    }, []);

    const handleJoinClass = useCallback(async (classCode: string, studentCode: string) => {
        if (submissionLockRef.current) return;
        submissionLockRef.current = true;
        setIsSubmitting(true);
        try {
            const { classroom: joinedClassroom, student } = await joinClassroomAPI(classCode, studentCode);
            setClassroom(joinedClassroom);
            setCurrentStudent(student);
            
            sessionStorage.setItem('classCode', joinedClassroom.id);
            sessionStorage.setItem('studentAccessCode', student.accessCode);

            if (student.name) {
                setView(View.Student);
            } else {
                setView(View.SetUsername);
            }
        } catch (error) {
            setModalContent({ title: "Erreur de Connexion", message: error instanceof Error ? error.message : "Vérifiez vos codes." });
        } finally {
            setIsSubmitting(false);
            submissionLockRef.current = false;
        }
    }, []);

    const handleSetStudentName = useCallback(async (name: string) => {
        if (submissionLockRef.current) return;
        if (!currentStudent || !classroom) return;
        if (currentStudent.name) {
            setView(View.Student);
            return;
        }
        
        submissionLockRef.current = true;
        setIsSubmitting(true);
        try {
            const updatedStudent = await setStudentNameAPI(classroom.id, currentStudent.accessCode, name);
            setCurrentStudent(updatedStudent);
            setView(View.Student);
        } catch (error) {
             setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de définir le nom d'utilisateur." });
        } finally {
            setIsSubmitting(false);
            submissionLockRef.current = false;
        }
    }, [currentStudent, classroom]);
    
    const handleLeave = useCallback(() => {
        clearSession();
    }, [clearSession]);
    
    const handleAddStudent = useCallback(async () => {
        if (!classroom || !teacherToken) return;
        try {
            const { newStudent, updatedClassroom } = await addStudentAPI(classroom.id, teacherToken);
            setClassroom(updatedClassroom);
            setModalContent({ title: "Étudiant Ajouté", message: `L'étudiant a été ajouté. Son code d'accès est : ${newStudent.accessCode}. Il choisira son nom lors de sa première connexion.` });
        } catch (error) {
            setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible d'ajouter l'étudiant." });
        }
    }, [classroom, teacherToken]);

    const handleUpdateScore = useCallback(async (studentId: string, newScore: number) => {
        if (!classroom || !teacherToken) return;
        try {
            const updatedClassroom = await updateScoreAPI(classroom.id, studentId, newScore, teacherToken);
            setClassroom(updatedClassroom);
        } catch (error) {
            setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de mettre à jour le score." });
        }
    }, [classroom, teacherToken]);
    
    const handleRequestResetScores = useCallback(() => {
        setConfirmation({
            title: "Réinitialiser les Scores",
            message: "Êtes-vous sûr de vouloir remettre à zéro les scores de tous les étudiants ? Leurs scores actuels seront archivés dans leur historique.",
            onConfirm: async () => {
                if (!classroom || !teacherToken) return;
                try {
                    const updatedClassroom = await resetScoresAPI(classroom.id, teacherToken);
                    setClassroom(updatedClassroom);
                    setModalContent({ title: "Succès", message: "Les scores ont été réinitialisés et archivés."});
                } catch (error) {
                    setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de réinitialiser les scores." });
                } finally {
                    setConfirmation(null);
                }
            }
        });
    }, [classroom, teacherToken]);

    const handleRequestRemoveStudent = useCallback((studentToRemove: Student) => {
        setConfirmation({
            title: "Supprimer l'Étudiant",
            message: `Êtes-vous sûr de vouloir supprimer ${studentToRemove.name || 'cet étudiant'} ? Toutes ses données seront perdues de manière permanente.`,
            onConfirm: async () => {
                if (!classroom || !teacherToken) return;
                try {
                    const updatedClassroom = await removeStudentAPI(classroom.id, studentToRemove.id, teacherToken);
                    setClassroom(updatedClassroom);
                    setModalContent({ title: "Succès", message: "L'étudiant a été supprimé."});
                } catch (error) {
                    setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de supprimer l'étudiant." });
                } finally {
                    setConfirmation(null);
                }
            }
        });
    }, [classroom, teacherToken]);

    const handleRequestDeleteClassroom = useCallback(() => {
        if (!classroom) return;
        setConfirmation({
            title: "Supprimer la Classe",
            message: `Êtes-vous sûr de vouloir supprimer la classe "${classroom.name || classroom.id}" ? Cette action est irréversible et supprimera tous les étudiants et leurs données.`,
            onConfirm: async () => {
                if (!classroom || !teacherToken) return;
                try {
                    await deleteClassroomAPI(classroom.id, teacherToken);
                    setModalContent({ title: "Succès", message: "La classe a été supprimée avec succès."});
                    clearSession();
                } catch (error) {
                    setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de supprimer la classe." });
                } finally {
                    setConfirmation(null);
                }
            }
        });
    }, [classroom, teacherToken, clearSession]);

    const handleUpdateAnnouncement = useCallback(async (announcement: string) => {
        if (!classroom || !teacherToken) return;
        try {
            const updatedClassroom = await updateAnnouncementAPI(classroom.id, announcement, teacherToken);
            setClassroom(updatedClassroom);
            setModalContent({ title: "Succès", message: "L'annonce a été mise à jour."});
        } catch (error) {
            setModalContent({ title: "Erreur", message: error instanceof Error ? error.message : "Impossible de mettre à jour l'annonce." });
        }
    }, [classroom, teacherToken]);

    const handleShowModal = useCallback((title: string, message: string) => {
        setModalContent({ title, message });
    }, []);
    
    const handleShowHistory = useCallback((student: Student) => {
        setHistoryStudent(student);
    }, []);

    const classMean = useMemo(() => {
        if (!classroom || classroom.students.length === 0) return 0;
        return classroom.students.reduce((acc, student) => acc + student.score, 0) / classroom.students.length;
    }, [classroom]);

    const renderView = () => {
        if (isPageLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <Spinner />
                    <p className="text-xl text-gray-400">Chargement...</p>
                </div>
            );
        }
        switch (view) {
            case View.Teacher: return classroom && <TeacherView classroom={classroom} classMean={classMean} onAddStudent={handleAddStudent} onUpdateScore={handleUpdateScore} onLeave={handleLeave} onResetScores={handleRequestResetScores} onShowHistory={handleShowHistory} onRemoveStudent={handleRequestRemoveStudent} onDeleteClassroom={handleRequestDeleteClassroom} onUpdateAnnouncement={handleUpdateAnnouncement} />;
            case View.Student: return currentStudent && classroom && <StudentView student={currentStudent} classroomName={classroom.name} classMean={classMean} onLeave={handleLeave} onShowModal={handleShowModal} onShowHistory={() => handleShowHistory(currentStudent)} announcement={classroom.announcement} />;
            case View.SetUsername: return <SetUsernameView onSetName={handleSetStudentName} isLoading={isSubmitting} />;
            default: return <LoginView onCreateClass={handleCreateClass} onJoinClass={handleJoinClass} onTeacherLogin={handleTeacherLogin} isLoading={isSubmitting} onShowModal={handleShowModal} />;
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-6xl mx-auto">
                {renderView()}
            </main>
            {modalContent && <Modal title={modalContent.title} message={modalContent.message} onClose={() => setModalContent(null)} />}
            {confirmation && <ConfirmationModal title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation(null)} />}
            <HistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />
        </div>
    );
};

export default App;