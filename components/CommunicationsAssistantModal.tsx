import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { XMarkIcon, MegaphoneIcon, UserIcon } from './icons';

interface CommunicationsAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    isLoading: boolean;
}

const CommunicationsAssistantModal: React.FC<CommunicationsAssistantModalProps> = ({ isOpen, onClose, students, isLoading }) => {
    const [targetGroup, setTargetGroup] = useState('all');
    const [message, setMessage] = useState('');
    const [previews, setPreviews] = useState<{name: string, message: string}[]>([]);

    const filteredStudents = useMemo(() => {
        if (targetGroup === 'all') return students;
        if (targetGroup === 'debtors') {
            return students.filter(s => {
                const totalDue = s.payments.reduce((sum, p) => sum + p.amountDue, 0);
                const totalPaid = s.payments.reduce((sum, p) => sum + p.paidAmount, 0);
                return (totalDue - totalPaid) > 0;
            });
        }
        return students.filter(s => s.studyPlan === targetGroup);
    }, [students, targetGroup]);

    const studyPlans = useMemo(() => [...new Set(students.map(s => s.studyPlan))], [students]);

    if (!isOpen) return null;

    const handleGeneratePreviews = () => {
        if (!message.trim()) return;

        const generatedPreviews = filteredStudents.map(student => {
            const balance = student.payments.reduce((sum, p) => sum + p.amountDue, 0) - student.payments.reduce((sum, p) => sum + p.paidAmount, 0);
            const personalizedMessage = message
                .replace(/\[nombre\]/g, student.name)
                .replace(/\[carrera\]/g, student.studyPlan)
                .replace(/\[saldo\]/g, new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(balance));
            return { name: student.name, message: personalizedMessage };
        });
        setPreviews(generatedPreviews);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <MegaphoneIcon className="w-6 h-6 text-teal-400"/>
                        <h2 className="text-xl font-bold text-white">Asistente de Comunicaciones</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6 text-slate-400"/>
                    </button>
                </header>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-y-auto">
                    {/* Panel de Configuración */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-300">1. Configurar Mensaje</h3>
                        <div>
                            <label htmlFor="targetGroup" className="block text-sm font-medium text-slate-300 mb-1">Enviar a:</label>
                            <select
                                id="targetGroup"
                                value={targetGroup}
                                onChange={e => setTargetGroup(e.target.value)}
                                className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="all">Todos los Alumnos ({students.length})</option>
                                <option value="debtors">Alumnos con Adeudo</option>
                                <optgroup label="Por Carrera">
                                    {studyPlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">Mensaje:</label>
                             <textarea
                                id="message"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                rows={8}
                                className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Usa placeholders: <code className="bg-slate-900 px-1 rounded">[nombre]</code>, <code className="bg-slate-900 px-1 rounded">[carrera]</code>, <code className="bg-slate-900 px-1 rounded">[saldo]</code>.
                            </p>
                        </div>
                         <button 
                            onClick={handleGeneratePreviews}
                            disabled={isLoading || !message.trim()}
                            className="w-full px-4 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-md disabled:bg-slate-600"
                         >
                            Generar Vistas Previas
                        </button>
                    </div>
                    {/* Panel de Vistas Previas */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-300">2. Vistas Previas ({previews.length} / {filteredStudents.length} destinatarios)</h3>
                        <div className="bg-slate-900/50 rounded-lg p-3 h-96 overflow-y-auto space-y-3">
                            {previews.length > 0 ? previews.map((p, index) => (
                                <div key={index} className="bg-slate-700/50 p-3 rounded-md">
                                    <p className="text-sm font-semibold text-sky-400 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Para: {p.name}</p>
                                    <p className="text-sm text-slate-300 mt-1 pl-1 border-l-2 border-slate-600">{p.message}</p>
                                </div>
                            )) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-slate-500 text-sm">Las vistas previas aparecerán aquí.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationsAssistantModal;
