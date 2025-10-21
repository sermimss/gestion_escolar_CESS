import React, { useState } from 'react';
import { Student, PaymentStatus, Payment } from '../types';
import { UserIcon, BookOpenIcon, CalendarIcon, DollarSignIcon, IdCardIcon, FileTextIcon, BriefcaseIcon } from './icons';

interface StudentDetailsProps {
  student: Student;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode, colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-slate-800/50 rounded-lg p-4 flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.Paid: return 'bg-green-500/20 text-green-300';
        case PaymentStatus.Pending: return 'bg-gray-500/20 text-gray-300';
        case PaymentStatus.Overdue: return 'bg-red-500/20 text-red-300';
        case PaymentStatus.Partial: return 'bg-yellow-500/20 text-yellow-300';
        default: return 'bg-slate-600';
    }
}

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value?: string | number | null }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-slate-300">
            <div className="text-slate-500 mt-1">{icon}</div>
            <div>
                <p className="font-semibold">{value}</p>
                <p className="text-sm text-slate-400">{label}</p>
            </div>
        </div>
    );
};

const StudentDetails: React.FC<StudentDetailsProps> = ({ student }) => {
  const [activeTab, setActiveTab] = useState('finanzas');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const totalDue = student.payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const balance = totalDue - totalPaid;

  const renderFinancials = () => (
    <div className="space-y-6">
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-300">Resumen Financiero</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Pagado" value={formatCurrency(totalPaid)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass="bg-green-500" />
                <StatCard title="Saldo Pendiente" value={formatCurrency(balance)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass="bg-red-500" />
                <StatCard title="Costo Total" value={formatCurrency(totalDue)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass="bg-sky-500" />
            </div>
        </section>
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-300">Calendario de Pagos</h3>
            <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-max">
                        <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-4 font-semibold">Descripción</th>
                            <th className="p-4 font-semibold">Tipo</th>
                            <th className="p-4 font-semibold">Fecha Vencimiento</th>
                            <th className="p-4 font-semibold">Monto</th>
                            <th className="p-4 font-semibold">Pagado</th>
                            <th className="p-4 font-semibold">Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {student.payments.map(payment => (
                            <tr key={payment.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-800">
                            <td className="p-4">{payment.description}</td>
                            <td className="p-4">{payment.type}</td>
                            <td className="p-4">{payment.dueDate}</td>
                            <td className="p-4 font-mono">{formatCurrency(payment.amountDue)}</td>
                            <td className="p-4 font-mono">{formatCurrency(payment.paidAmount)}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusBadge(payment.status)}`}>
                                {payment.status}
                                </span>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
  );

  const renderAcademicInfo = () => (
      <div className="bg-slate-800/50 rounded-lg p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-300 border-b border-slate-700 pb-3">Información Académica y Requisitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Certificado de Secundaria" value={`#${student.secondaryCertificate.number} (Prom: ${student.secondaryCertificate.gpa})`} />
              <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Institución (Secundaria)" value={student.secondaryCertificate.institution} />
              {student.highSchoolCertificate && <>
                <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Certificado de Bachillerato" value={`#${student.highSchoolCertificate.number} (Prom: ${student.highSchoolCertificate.gpa})`} />
                <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Institución (Bachillerato)" value={student.highSchoolCertificate.institution} />
              </>}
              {student.workExperience && <>
                <DetailItem icon={<BriefcaseIcon className="w-5 h-5"/>} label="Experiencia Laboral" value={`${student.workExperience.years} años`} />
                <DetailItem icon={<BriefcaseIcon className="w-5 h-5"/>} label="Lugar de Trabajo" value={student.workExperience.institution} />
              </>}
          </div>
      </div>
  );
  
  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center space-x-4">
        <div className="p-4 bg-slate-700 rounded-full">
            <UserIcon className="w-12 h-12 text-sky-400" />
        </div>
        <div>
            <div className="flex items-center gap-3">
                {student.hasScholarship && <div className="w-4 h-4 bg-blue-400 rounded-full" title="Estudiante con beca"></div>}
                <h2 className="text-4xl font-extrabold text-white">{student.name}</h2>
            </div>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-2 text-slate-400">
                <div className="flex items-center gap-2"><IdCardIcon className="w-5 h-5"/><span>{student.curp}</span></div>
                <div className="flex items-center gap-2"><BookOpenIcon className="w-5 h-5"/><span>{student.studyPlan}</span></div>
                <div className="flex items-center gap-2"><CalendarIcon className="w-5 h-5"/><span>Inscrito: {student.enrollmentDate}</span></div>
            </div>
        </div>
      </header>

      <div className="border-b border-slate-700">
        <nav className="flex space-x-4">
          <button onClick={() => setActiveTab('finanzas')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'finanzas' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}>Finanzas</button>
          <button onClick={() => setActiveTab('academico')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'academico' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}>Información Académica</button>
        </nav>
      </div>

      <div>
        {activeTab === 'finanzas' && renderFinancials()}
        {activeTab === 'academico' && renderAcademicInfo()}
      </div>

    </div>
  );
};

export default StudentDetails;
