// Path: components/StudentCard.tsx

import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface StudentCardProps {
    student: Student;
    onUpdateScore: (studentId: string, newScore: number) => void;
    onShowHistory: (student: Student) => void;
    onRemoveStudent: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onUpdateScore, onShowHistory, onRemoveStudent }) => {
    const [score, setScore] = useState(student.score);

    useEffect(() => {
        setScore(student.score);
    }, [student.score]);

    const handleUpdate = () => {
        const newScore = parseInt(String(score), 10);
        if (!isNaN(newScore)) {
            onUpdateScore(student.id, newScore);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUpdate();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg transition transform hover:-translate-y-1 flex flex-col relative">
            <button
                onClick={() => onRemoveStudent(student)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors z-10 p-1"
                aria-label={`Supprimer ${student.name || 'cet étudiant'}`}
                title="Supprimer l'étudiant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </button>

            <h3 className="text-lg font-bold text-green-300 mb-2 pr-6">{student.name || 'En attente du nom...'}</h3>
            <p className="text-xs text-gray-400 mb-4">Code d'accès: <span className="font-mono select-all">{student.accessCode}</span></p>
            <div className="flex-grow flex items-end">
                <input 
                    type="number" 
                    value={score} 
                    onChange={(e) => setScore(Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex gap-2 mt-3">
                 <button 
                    onClick={() => onShowHistory(student)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                    Historique
                </button>
                <button 
                    onClick={handleUpdate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                    Valider
                </button>
            </div>
        </div>
    );
};

export default StudentCard;