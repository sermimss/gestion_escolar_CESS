import React from 'react';
import { Student } from '../types';
import { DocumentCheckIcon, UserIcon } from './icons';

interface PendingCertificatesProps {
    students: Student[];
    onMarkDelivered: (studentId: string) => void;
}

const PendingCertificates: React.FC<PendingCertificatesProps> = ({ students, onMarkDelivered }) => {
    if (students.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-500">
                    <UserIcon className="w-16 h-16 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold">Bienvenido, Administrador</h2>
                    <p>No hay certificados pendientes de entrega en este momento.</p>
                    <p className="mt-2 text-sm">Seleccione un estudiante de la lista para ver sus detalles o use la búsqueda.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <header className="mb-6">
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <DocumentCheckIcon className="w-8 h-8 text-amber-400" />
                    Certificados Pendientes de Entrega
                </h2>
                <p className="text-slate-400 mt-1">Alumnos con certificados recibidos y listos para ser entregados.</p>
            </header>
            <div className="bg-slate-800/50 rounded-lg">
                <ul className="divide-y divide-slate-700">
                    {students.map(student => (
                        <li key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-800">
                            <div>
                                <p className="font-semibold text-slate-200">{student.name}</p>
                                <p className="text-sm text-slate-400">{student.studyPlan}</p>
                            </div>
                            <button
                                onClick={() => onMarkDelivered(student.id)}
                                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-md transition-colors"
                            >
                                Marcar como Entregado
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PendingCertificates;