// Path: components/ClassPerformanceModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Classroom } from '../types';
import ClassPerformanceChart from './ClassPerformanceChart';
import ScoreDistributionChart from './ScoreDistributionChart';

interface ClassPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    classroom: Classroom;
}

type ActiveTab = 'distribution' | 'timeline';

const ClassPerformanceModal: React.FC<ClassPerformanceModalProps> = ({ isOpen, onClose, classroom }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('distribution');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const timelineChartData = useMemo(() => {
        const scoresByDate = new Map<string, { total: number; count: number }>();

        classroom.students.forEach(student => {
            student.scoreHistory.forEach(record => {
                const entry = scoresByDate.get(record.date) || { total: 0, count: 0 };
                entry.total += record.score;
                entry.count += 1;
                scoresByDate.set(record.date, entry);
            });
        });

        const calculatedData = Array.from(scoresByDate.entries()).map(([date, data]) => ({
            date,
            average: data.total / data.count,
        }));

        return calculatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [classroom]);

    const distributionChartData = useMemo(() => {
        // We want the distribution of the *current* scores, not historical ones.
        return classroom.students.map(s => s.score);
    }, [classroom]);


    if (!isOpen) return null;

    const TabButton: React.FC<{tabId: ActiveTab, children: React.ReactNode}> = ({ tabId, children }) => (
         <button
            onClick={() => setActiveTab(tabId)}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                activeTab === tabId ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-4 sm:p-8 rounded-xl shadow-2xl max-w-4xl w-full text-left transform transition-all animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Performance de la Classe</h3>
                     <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
                        <TabButton tabId="distribution">Répartition des Scores</TabButton>
                        <TabButton tabId="timeline">Performance sur la Durée</TabButton>
                    </div>
                </div>

                <div className="text-gray-300 mb-6 min-h-[350px] flex items-center justify-center">
                   {activeTab === 'distribution' && (
                        <>
                        {distributionChartData && distributionChartData.length > 0 ? (
                             <div className="w-full">
                                 <h4 className="text-sm text-center text-gray-400 mb-2">Répartition des scores actuels</h4>
                                 <ScoreDistributionChart scores={distributionChartData} />
                             </div>
                        ) : (
                             <div className="text-center py-16">
                                <h3 className="text-xl text-gray-400">Aucun score à afficher.</h3>
                                <p className="text-gray-500 mt-2">Les scores des étudiants apparaîtront ici.</p>
                            </div>
                        )}
                        </>
                   )}
                   {activeTab === 'timeline' && (
                        <>
                        {timelineChartData && timelineChartData.length > 1 ? (
                            <div className="w-full">
                                <ClassPerformanceChart data={timelineChartData} yAxisLabel="Score Moyen de la Classe" />
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-900/80 rounded-xl">
                                <h3 className="text-xl text-gray-400">Données insuffisantes pour le graphique.</h3>
                                <p className="text-gray-500 mt-2">Au moins deux sessions de scores archivés sont nécessaires.</p>
                            </div>
                        )}
                        </>
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

export default ClassPerformanceModal;