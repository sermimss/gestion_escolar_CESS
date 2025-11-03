import React, { useState } from 'react';
import { UserIcon } from './icons';

interface LoginScreenProps {
    onLogin: (role: 'Director' | 'Administrativo') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username.toLowerCase() === 'director' && password === 'director') {
            onLogin('Director');
        } else if (username.toLowerCase() === 'administrativo' && password === 'administrativo') {
            onLogin('Administrativo');
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-sky-400 flex items-center justify-center gap-2">
                        <UserIcon className="w-8 h-8" />
                        Gestor Escolar IA
                    </h1>
                    <p className="text-slate-400 mt-2">Inicia sesión para continuar</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
                                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="director o administrativo"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-300">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
                                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800"
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;