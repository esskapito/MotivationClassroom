// Path: components/TeacherView.tsx

import React, { useState } from 'react';
import { Classroom, Student } from '../types';
import StudentCard from './StudentCard';
import ClassPerformanceModal from './ClassPerformanceModal';

interface TeacherViewProps {
    classroom: Classroom;
    classMean: number;
    onAddStudent: () => void;
    onUpdateScore: (studentId: string, newScore: number) => void;
    onLeave: () => void;
    onResetScores: () => void;
    onShowHistory: (student: Student) => void;
    onRemoveStudent: (student: Student) => void;
    onDeleteClassroom: () => void;
    onUpdateAnnouncement: (announcement: string) => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({ classroom, classMean, onAddStudent, onUpdateScore, onLeave, onResetScores, onShowHistory, onRemoveStudent, onDeleteClassroom, onUpdateAnnouncement }) => {
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
    const [announcement, setAnnouncement] = useState(classroom.announcement || '');

    const handlePublishAnnouncement = () => {
        onUpdateAnnouncement(announcement);
    };

    const handleExportCSV = () => {
        if (!classroom || classroom.students.length === 0) {
            alert("Il n'y a pas de données à exporter.");
            return;
        }
    
        const allDates = [...new Set(classroom.students.flatMap(s => s.scoreHistory.map(h => h.date)))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        const header = ["Nom de l'étudiant", "Code d'accès", "Score Actuel", ...allDates];
        let csvContent = header.join(",") + "\r\n";
    
        for (const student of classroom.students) {
            const studentScoresByDate = new Map(student.scoreHistory.map(h => [h.date, h.score]));
            
            const row = [
                `"${student.name || 'N/A'}"`,
                student.accessCode,
                student.score
            ];
    
            for (const date of allDates) {
                row.push(studentScoresByDate.get(date) ?? '');
            }
    
            csvContent += row.join(",") + "\r\n";
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `scores_${classroom.id}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full animate-fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">{classroom.name || 'Tableau de Bord Enseignant'}</h1>
                <div className="flex gap-4 flex-wrap items-center">
                    <button 
                        onClick={() => setIsPerformanceModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300"
                    >
                        Performance de la Classe
                    </button>
                    <button 
                        onClick={onAddStudent}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300"
                    >
                        + Ajouter un Étudiant
                    </button>
                     <button onClick={onLeave} className="text-sm text-gray-400 hover:text-white underline transition">
                        Se Déconnecter
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-6 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <span className="text-sm font-medium text-gray-400">Partagez ce code de classe avec vos étudiants :</span>
                    <strong className="text-2xl font-bold text-yellow-400 ml-2 select-all">{classroom.id}</strong>
                </div>
                <div className="text-right">
                    <span className="text-sm font-medium text-gray-400">Score Moyen de la Classe</span>
                    <div className="text-2xl font-bold text-blue-300">{classMean.toFixed(1)} pts</div>
                </div>
            </div>

            {classroom.students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classroom.students.map(student => (
                        <StudentCard 
                            key={student.id} 
                            student={student} 
                            onUpdateScore={onUpdateScore} 
                            onShowHistory={onShowHistory}
                            onRemoveStudent={onRemoveStudent}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-gray-800 rounded-xl">
                    <h3 className="text-xl text-gray-400">Aucun étudiant n'a encore été ajouté.</h3>
                    <p className="text-gray-500 mt-2">Cliquez sur "+ Ajouter un Étudiant" pour commencer.</p>
                </div>
            )}
            
            <div className="mt-12 pt-8 border-t-2 border-gray-500/30">
                 <h2 className="text-xl font-bold text-cyan-400 mb-4">Annonces de la Classe</h2>
                 <div className="bg-gray-800 p-6 rounded-xl flex flex-col gap-4">
                     <textarea
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Écrivez une annonce pour vos étudiants ici..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition min-h-[100px]"
                    />
                    <button onClick={handlePublishAnnouncement} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300 self-end">
                        Publier l'Annonce
                    </button>
                 </div>
            </div>

            <div className="mt-12 pt-8 border-t-2 border-red-500/30">
                 <h2 className="text-xl font-bold text-red-400 mb-4">Zone de Danger</h2>
                 <div className="bg-gray-800 p-6 rounded-xl flex flex-col gap-6">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h3 className="font-semibold">Réinitialiser les scores pour un nouveau jour</h3>
                            <p className="text-sm text-gray-400">Cette action remettra à zéro les scores de tous les étudiants et archivera leurs scores actuels.</p>
                        </div>
                        <button onClick={onResetScores} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300 whitespace-nowrap">
                            Réinitialiser les Scores
                        </button>
                    </div>
                     <div className="w-full border-t border-red-500/20"></div>
                     <div className="flex justify-between items-center w-full">
                        <div>
                            <h3 className="font-semibold">Exporter les données des étudiants</h3>
                            <p className="text-sm text-gray-400">Téléchargez un fichier CSV contenant tous les scores des étudiants.</p>
                        </div>
                        <button onClick={handleExportCSV} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300 whitespace-nowrap">
                            Exporter les Scores (CSV)
                        </button>
                    </div>
                     <div className="w-full border-t border-red-500/20"></div>
                     <div className="flex justify-between items-center w-full">
                        <div>
                            <h3 className="font-semibold">Supprimer cette classe</h3>
                            <p className="text-sm text-gray-400">Cette action est permanente et supprimera toutes les données de la classe.</p>
                        </div>
                        <button onClick={onDeleteClassroom} className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition duration-300 whitespace-nowrap">
                            Supprimer la Classe
                        </button>
                    </div>
                 </div>
            </div>

            <ClassPerformanceModal 
                isOpen={isPerformanceModalOpen}
                onClose={() => setIsPerformanceModalOpen(false)}
                classroom={classroom}
            />
        </div>
    );
};

export default TeacherView;