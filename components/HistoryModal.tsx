// Path: components/HistoryModal.tsx

import React, { useEffect, useMemo } from 'react';
import { Student } from '../types';
import ClassPerformanceChart from './ClassPerformanceChart';

interface HistoryModalProps {
    student: Student | null;
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ student, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const chartData = useMemo(() => {
        if (!student || !student.scoreHistory) return [];
        // The chart component expects the 'average' key, so we map 'score' to 'average'.
        return student.scoreHistory
            .map(record => ({
                date: record.date,
                average: record.score 
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [student]);


    if (!student) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-4 sm:p-8 rounded-xl shadow-2xl max-w-4xl w-full text-left transform transition-all animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold mb-4">Historique pour <span className="text-green-300">{student.name}</span></h3>
                
                {chartData.length > 1 ? (
                    <div className="mb-8 p-4 bg-gray-900/50 rounded-lg">
                        <ClassPerformanceChart data={chartData} yAxisLabel="Score" />
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-900/50 rounded-lg mb-6">
                        <p className="text-gray-400">Données insuffisantes pour afficher un graphique de progression.</p>
                    </div>
                )}
                
                <div className="text-gray-300 mb-6 max-h-60 overflow-y-auto pr-2">
                     <h4 className="text-lg font-semibold mb-3">Scores Archivés</h4>
                    {student.scoreHistory && student.scoreHistory.length > 0 ? (
                        <ul className="space-y-3">
                            {[...student.scoreHistory].reverse().map((record, index) => (
                                <li key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                    <span className="font-mono text-gray-400">{new Date(record.date).toLocaleDateString()}</span>
                                    <span className="font-bold text-lg">{record.score} points</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucun historique de score disponible pour cet étudiant.</p>
                    )}
                </div>
                <button 
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 block ml-auto"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};

export default HistoryModal;