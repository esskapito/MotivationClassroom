// Path: components/SetUsernameView.tsx

import React, { useState } from 'react';
import Spinner from './Spinner';

interface SetUsernameViewProps {
    onSetName: (name: string) => void;
    isLoading: boolean;
}

const SetUsernameView: React.FC<SetUsernameViewProps> = ({ onSetName, isLoading }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            alert("Votre nom d'utilisateur doit contenir au moins 2 caractères.");
            return;
        }
        onSetName(name.trim());
    };

    return (
        <div className="max-w-md mx-auto animate-fade-in text-center">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold mb-4 text-green-300">Bienvenue !</h1>
                <p className="text-gray-400 mb-8">Veuillez choisir un nom d'utilisateur. Ce nom sera visible par votre enseignant.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="sr-only">Nom d'utilisateur</label>
                        <input 
                            id="username"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Entrez votre nom..."
                            required
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" 
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner /> : 'Confirmer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetUsernameView;