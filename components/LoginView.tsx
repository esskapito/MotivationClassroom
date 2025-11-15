// Path: components/LoginView.tsx

import React, { useState } from 'react';
import Spinner from './Spinner';
import { getSecretQuestionAPI, resetPasswordAPI } from '../services/apiService';

interface LoginViewProps {
    onCreateClass: (password: string, className: string, secretQuestion: string, secretAnswer: string) => void;
    onTeacherLogin: (classCode: string, password: string) => void;
    onJoinClass: (classCode: string, studentCode: string) => void;
    isLoading: boolean;
    onShowModal: (title: string, message: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onCreateClass, onTeacherLogin, onJoinClass, isLoading, onShowModal }) => {
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    
    const [joinClassCode, setJoinClassCode] = useState('');
    const [studentCode, setStudentCode] = useState('');
    
    const [teacherAction, setTeacherAction] = useState<'login' | 'create' | 'reset'>('login');
    const [teacherClassCode, setTeacherClassCode] = useState('');
    const [className, setClassName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [secretQuestion, setSecretQuestion] = useState('');
    const [secretAnswer, setSecretAnswer] = useState('');
    
    // State for password reset flow
    const [resetStep, setResetStep] = useState(1);
    const [resetClassCode, setResetClassCode] = useState('');
    const [retrievedQuestion, setRetrievedQuestion] = useState('');
    const [resetAnswer, setResetAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onJoinClass(joinClassCode, studentCode);
    };

    const handleTeacherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (teacherAction === 'create') {
            if (password !== confirmPassword) {
                return onShowModal("Erreur", "Les mots de passe ne correspondent pas.");
            }
            if(password.length < 4) {
                return onShowModal("Erreur", "Le mot de passe doit contenir au moins 4 caractères.");
            }
            if (className.trim().length < 2) {
                return onShowModal("Erreur", "Le nom de la classe doit contenir au moins 2 caractères.");
            }
             if (secretQuestion.trim().length < 10) {
                return onShowModal("Erreur", "La question secrète doit contenir au moins 10 caractères.");
            }
            if (secretAnswer.trim().length < 4) {
                return onShowModal("Erreur", "La réponse secrète doit contenir au moins 4 caractères.");
            }
            onCreateClass(password, className.trim(), secretQuestion.trim(), secretAnswer.trim());
        } else { // 'login' action
            onTeacherLogin(teacherClassCode, password);
        }
    };

    const handleResetStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { secretQuestion } = await getSecretQuestionAPI(resetClassCode);
            setRetrievedQuestion(secretQuestion);
            setResetStep(2);
        } catch (error) {
            onShowModal("Erreur", error instanceof Error ? error.message : "Impossible de trouver cette classe.");
        }
    };

    const handleResetStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            return onShowModal("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
        }
        if (newPassword.length < 4) {
            return onShowModal("Erreur", "Le nouveau mot de passe doit contenir au moins 4 caractères.");
        }
        try {
            await resetPasswordAPI(resetClassCode, resetAnswer, newPassword);
            onShowModal("Succès", "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.");
            setTeacherAction('login'); // Go back to login form
        } catch (error) {
             onShowModal("Erreur", error instanceof Error ? error.message : "Réponse incorrecte ou erreur du serveur.");
        }
    };
    
    const resetForms = () => {
        setTeacherAction('login');
        setResetStep(1);
        setResetClassCode('');
        setRetrievedQuestion('');
        setResetAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
    }

    const TabButton: React.FC<{tabId: 'student' | 'teacher', children: React.ReactNode}> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`w-1/2 py-3 text-lg font-semibold transition-colors duration-300 rounded-t-lg focus:outline-none ${
                activeTab === tabId ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    const renderTeacherContent = () => {
        if (teacherAction === 'reset') {
            return (
                 <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-center mb-6 text-yellow-300">Réinitialiser le Mot de Passe</h2>
                    {resetStep === 1 && (
                        <form onSubmit={handleResetStep1} className="space-y-4">
                             <p className="text-sm text-gray-400 text-center">Entrez le code de votre classe pour commencer.</p>
                            <div>
                                <label htmlFor="reset-class-code" className="block text-sm font-medium text-gray-300 mb-1">Code de la Classe</label>
                                <input id="reset-class-code" type="text" value={resetClassCode} onChange={(e) => setResetClassCode(e.target.value.toUpperCase())} placeholder="CLS-..." required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
                            </div>
                             <button type="submit" disabled={isLoading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? <Spinner /> : 'Suivant'}
                            </button>
                        </form>
                    )}
                    {resetStep === 2 && (
                        <form onSubmit={handleResetStep2} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Question Secrète</label>
                                <p className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 italic">{retrievedQuestion}</p>
                            </div>
                             <div>
                                <label htmlFor="reset-answer" className="block text-sm font-medium text-gray-300 mb-1">Votre Réponse Secrète</label>
                                <input id="reset-answer" type="text" value={resetAnswer} onChange={(e) => setResetAnswer(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
                            </div>
                             <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">Nouveau Mot de Passe</label>
                                <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
                            </div>
                             <div>
                                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-300 mb-1">Confirmer le Nouveau Mot de Passe</label>
                                <input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? <Spinner /> : 'Réinitialiser'}
                            </button>
                        </form>
                    )}
                    <button onClick={resetForms} className="text-sm text-gray-400 hover:text-white underline transition mt-4 block mx-auto">
                        Retour à la connexion
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="flex justify-center mb-6 border border-gray-600 rounded-lg p-1">
                    <button onClick={() => setTeacherAction('login')} className={`w-1/2 py-2 rounded-md transition ${teacherAction === 'login' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Se Connecter</button>
                    <button onClick={() => setTeacherAction('create')} className={`w-1/2 py-2 rounded-md transition ${teacherAction === 'create' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>Créer une Classe</button>
                </div>

                <h2 className="text-2xl font-bold text-center mb-6 text-blue-300">{teacherAction === 'login' ? 'Connexion Enseignant' : 'Créer une Nouvelle Classe'}</h2>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                    {teacherAction === 'login' && (
                        <div>
                            <label htmlFor="teacher-class-code" className="block text-sm font-medium text-gray-300 mb-1">Code de la Classe</label>
                            <input id="teacher-class-code" type="text" value={teacherClassCode} onChange={(e) => setTeacherClassCode(e.target.value.toUpperCase())} placeholder="CLS-..." required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                        </div>
                    )}
                     {teacherAction === 'create' && (
                        <div>
                            <label htmlFor="class-name" className="block text-sm font-medium text-gray-300 mb-1">Nom de la Classe</label>
                            <input id="class-name" type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Ex: Maths 4B" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            <p className="text-xs text-gray-400 mt-1 pl-1">Le code de la classe sera basé sur ce nom (ex: CLS-MATHS-4B).</p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    {teacherAction === 'create' && (
                        <>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">Confirmer le mot de passe</label>
                            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                        </div>
                        <div className="pt-4 mt-4 border-t border-gray-600">
                             <h3 className="font-semibold text-gray-300 mb-2">Récupération de Compte</h3>
                              <div>
                                <label htmlFor="secret-question" className="block text-sm font-medium text-gray-300 mb-1">Question Secrète</label>
                                <input id="secret-question" type="text" value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)} placeholder="Ex: Quel était le nom de mon premier animal ?" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                             <div className="mt-4">
                                <label htmlFor="secret-answer" className="block text-sm font-medium text-gray-300 mb-1">Réponse Secrète</label>
                                <input id="secret-answer" type="text" value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                                <p className="text-xs text-gray-400 mt-1 pl-1">Cette réponse est sensible à la casse. Gardez-la en lieu sûr.</p>
                            </div>
                        </div>
                        </>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner /> : (teacherAction === 'login' ? 'Se Connecter' : 'Créer')}
                    </button>
                    {teacherAction === 'login' && (
                        <button type="button" onClick={() => setTeacherAction('reset')} className="text-sm text-gray-400 hover:text-white underline transition mt-2 block mx-auto">
                            Mot de passe oublié ?
                        </button>
                    )}
                </form>
            </>
        )
    }

    return (
        <div className="max-w-md mx-auto animate-fade-in">
            <div className="flex">
                <TabButton tabId="student">Étudiant</TabButton>
                <TabButton tabId="teacher">Enseignant</TabButton>
            </div>

            <div className="bg-gray-800 p-8 rounded-b-xl shadow-2xl">
                {activeTab === 'student' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-center mb-6 text-green-300">Rejoindre une Classe</h2>
                        <form onSubmit={handleStudentSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="join-class-code" className="block text-sm font-medium text-gray-300 mb-1">Code de la Classe</label>
                                <input id="join-class-code" type="text" value={joinClassCode} onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())} placeholder="CLS-..." required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                            </div>
                            <div>
                                <label htmlFor="student-code" className="block text-sm font-medium text-gray-300 mb-1">Votre Code d'Accès (4 chiffres)</label>
                                <input id="student-code" type="text" inputMode="numeric" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="1234" required pattern="\d{4}" title="Le code doit être composé de 4 chiffres." className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? <Spinner /> : 'Rejoindre'}
                            </button>
                        </form>
                    </div>
                )}
                
                {activeTab === 'teacher' && renderTeacherContent()}
            </div>
        </div>
    );
};

export default LoginView;