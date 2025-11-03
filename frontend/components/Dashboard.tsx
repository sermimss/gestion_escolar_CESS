import React from 'react';
import { Student } from '../types';
import { DollarSignIcon, UserIcon, ChartBarIcon, BellIcon } from './icons';

interface DashboardProps {
    students: Student[];
    overdueStudentsCount: number;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-slate-800/50 rounded-lg p-6 flex items-center">
        <div className={`p-4 rounded-full mr-5 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ students, overdueStudentsCount }) => {
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const totalExpected = students.reduce((total, student) => 
        total + student.payments.reduce((sum, p) => sum + p.amountDue, 0), 0);
    
    const totalCollected = students.reduce((total, student) =>
        total + student.payments.reduce((sum, p) => sum + p.paidAmount, 0), 0);
        
    const totalBalance = totalExpected - totalCollected;
    const collectedPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    return (
        <div className="p-8 space-y-8">
            <header>
                <h2 className="text-4xl font-extrabold text-white flex items-center gap-3">
                    <ChartBarIcon className="w-9 h-9 text-sky-400" />
                    Dashboard Financiero
                </h2>
                <p className="text-slate-400 mt-1">Una vista general del estado financiero de la escuela.</p>
            </header>

            {overdueStudentsCount > 0 && (
                 <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-4">
                    <div className="p-2 bg-red-500/20 rounded-full">
                        <BellIcon className="w-6 h-6 text-red-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-300">Alerta de Pagos Vencidos</h3>
                        <p className="text-sm text-red-400">
                            Hay <span className="font-bold">{overdueStudentsCount}</span> alumno(s) con uno o más pagos vencidos. Revisa las notificaciones para enviar recordatorios.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Ingresos Esperados (Total)" value={formatCurrency(totalExpected)} icon={<DollarSignIcon className="w-7 h-7 text-white"/>} colorClass="bg-sky-500" />
                <StatCard title="Ingresos Recaudados" value={formatCurrency(totalCollected)} icon={<DollarSignIcon className="w-7 h-7 text-white"/>} colorClass="bg-green-500" />
                <StatCard title="Saldo Pendiente Total" value={formatCurrency(totalBalance)} icon={<DollarSignIcon className="w-7 h-7 text-white"/>} colorClass="bg-red-500" />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
                 <h3 className="text-xl font-bold text-slate-300 mb-4">Progreso de Recaudación</h3>
                 <div className="w-full bg-slate-700 rounded-full h-8">
                    <div 
                        className="bg-green-500 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
                        style={{ width: `${collectedPercentage}%`}}
                    >
                       {collectedPercentage.toFixed(1)}%
                    </div>
                </div>
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                    <span>{formatCurrency(0)}</span>
                    <span>{formatCurrency(totalExpected)}</span>
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <UserIcon className="w-6 h-6" />
                    Resumen de Alumnos
                </h3>
                <p className="text-5xl font-bold text-center text-white">{students.length}</p>
                <p className="text-center text-slate-400">alumnos inscritos en total.</p>
            </div>
        </div>
    );
};

export default Dashboard;