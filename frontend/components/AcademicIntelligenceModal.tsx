import React, { useState } from 'react';
import { XMarkIcon, LightBulbIcon } from './icons';

interface AcademicIntelligenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuery: (query: string) => Promise<any>;
    isLoading: boolean;
}

const AcademicIntelligenceModal: React.FC<AcademicIntelligenceModalProps> = ({ isOpen, onClose, onQuery, isLoading }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setResult(null);
        const queryResult = await onQuery(query);
        setResult(queryResult);
    };

    const renderResult = () => {
        if (!result) return null;

        switch (result.responseType) {
            case 'student_list':
                return (
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-2">Alumnos Encontrados:</h4>
                        <ul className="list-disc list-inside bg-slate-900/50 p-3 rounded-md space-y-1">
                            {result.studentList.map((student: { name: string, detail: string }, index: number) => (
                                <li key={index} className="text-slate-300">
                                    <span className="font-semibold">{student.name}</span> - <span className="text-slate-400">{student.detail}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            case 'calculated_value':
                return (
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-2">Resultado del Cálculo:</h4>
                        <p className="text-2xl font-bold text-sky-400 bg-slate-900/50 p-4 rounded-md text-center">{result.calculatedValue}</p>
                    </div>
                );
            case 'text_response':
                 return (
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-2">Respuesta de la IA:</h4>
                        <p className="text-slate-300 bg-slate-900/50 p-4 rounded-md">{result.textResponse}</p>
                    </div>
                );
            default:
                return <p className="text-yellow-400">La respuesta no tiene un formato reconocido.</p>
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <LightBulbIcon className="w-6 h-6 text-indigo-400"/>
                        <h2 className="text-xl font-bold text-white">Inteligencia Académica</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6 text-slate-400"/>
                    </button>
                </header>
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    <p className="text-sm text-slate-400">
                        Realiza una pregunta en lenguaje natural sobre los datos de los alumnos. La IA analizará la información y te dará una respuesta.
                    </p>
                    <p className="text-xs text-slate-500">
                        Ejemplos: "¿Quiénes tienen un promedio menor a 8.0?", "¿Qué alumnos de Enfermería General deben más de 3000 pesos?", "Calcula el total de ingresos recaudados de alumnos con beca."
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Escribe tu consulta aquí..."
                            className="w-full h-24 bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isLoading}
                        />
                         <button type="submit" disabled={isLoading || !query.trim()} className="w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Consultando...' : 'Consultar a la IA'}
                        </button>
                    </form>
                    <div className="border-t border-slate-700 my-4"></div>
                    <div className="min-h-[100px]">
                        {isLoading && <p className="text-center text-slate-400">Procesando...</p>}
                        {renderResult()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicIntelligenceModal;