// Path: components/StudentView.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student } from '../types';

interface StudentViewProps {
    student: Student;
    classroomName: string | null;
    classMean: number;
    onLeave: () => void;
    onShowModal: (title: string, message: string) => void;
    onShowHistory: () => void;
    announcement?: string | null;
}

const StudentView: React.FC<StudentViewProps> = ({ student, classroomName, classMean, onLeave, onShowModal, onShowHistory, announcement }) => {
    const [pulseScore, setPulseScore] = useState(false);
    const [pulseMean, setPulseMean] = useState(false);

    const prevPropsRef = useRef<{ student: Student; classMean: number }>();

    useEffect(() => {
        const prevProps = prevPropsRef.current;
        if (prevProps) {
            const prevScore = prevProps.student.score;
            const currentScore = student.score;

            if (currentScore !== prevScore) {
                setPulseScore(true);
                setTimeout(() => setPulseScore(false), 700);
                if (currentScore > prevScore) {
                    onShowModal("Félicitations!", `Votre score a augmenté de ${prevScore} à ${currentScore} points ! Continuez comme ça !`);
                }
            }

            const prevMean = prevProps.classMean;
            // Ensure consistent formatting for comparison to prevent errors.
            // The toFixed() method requires an argument, and using it on both sides
            // avoids floating-point inaccuracies.
            // FIX: Added argument to toFixed() for consistent comparison.
            if (classMean.toFixed(1) !== prevMean.toFixed(1)) {
                setPulseMean(true);
                setTimeout(() => setPulseMean(false), 700);
            }
        }
        prevPropsRef.current = { student, classMean };
    }, [student, classMean, onShowModal]);

    const lastArchivedScore = useMemo(() => {
        if (student.scoreHistory && student.scoreHistory.length > 0) {
            return student.scoreHistory[student.scoreHistory.length - 1];
        }
        return null;
    }, [student.scoreHistory]);

    return (
        <div className="animate-fade-in w-full">
            {classroomName && <p className="text-center text-gray-400 mb-2 text-sm sm:text-base">{classroomName}</p>}

            {announcement && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-cyan-900/50 border border-cyan-700 rounded-lg shadow-lg animate-fade-in">
                    <h3 className="font-bold text-cyan-300 mb-2">Annonce de l'Enseignant</h3>
                    <p className="text-white whitespace-pre-wrap">{announcement}</p>
                </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">Mon Progrès</h1>
            <div className="relative max-w-md mx-auto bg-gray-800 p-4 sm:p-8 rounded-xl shadow-2xl space-y-4 sm:space-y-6">
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400">Live</span>
                </div>

                <div className="text-center">
                    <h2 className="text-md sm:text-xl font-semibold text-green-300 mb-1 sm:mb-2">Score Actuel de {student.name}</h2>
                    <p className={`text-5xl sm:text-6xl font-bold text-green-400 ${pulseScore ? 'animate-pulse-quick' : ''}`}>{student.score}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-gray-700">
                    <div className="text-center">
                        <h2 className="text-sm sm:text-lg font-semibold text-blue-300 mb-1">Moyenne de la Classe</h2>
                        <p className={`text-3xl sm:text-4xl font-bold text-blue-400 ${pulseMean ? 'animate-pulse-quick' : ''}`}>{classMean.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                        <h2 className="text-sm sm:text-lg font-semibold text-yellow-300 mb-1">Dernier Score Archivé</h2>
                        {lastArchivedScore ? (
                             <p className="text-3xl sm:text-4xl font-bold text-yellow-400">{lastArchivedScore.score}</p>
                        ) : (
                            <p className="text-3xl sm:text-4xl font-bold text-gray-500">-</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="max-w-md mx-auto mt-6 sm:mt-8 space-y-4">
                 <button 
                    onClick={onShowHistory}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                >
                    Voir mon Historique
                </button>
                <button onClick={onLeave} className="block w-full text-center text-sm sm:text-base text-gray-400 hover:text-white underline transition">
                    Quitter la Classe
                </button>
            </div>
        </div>
    );
};

export default StudentView;