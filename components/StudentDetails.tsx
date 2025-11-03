import React, { useState } from 'react';
import { Student, PaymentStatus, Payment, PaymentType } from '../types';
import { UserIcon, BookOpenIcon, CalendarIcon, DollarSignIcon, IdCardIcon, FileTextIcon, BriefcaseIcon, AcademicCapIcon, DocumentCheckIcon, ClockIcon, MapPinIcon, DownloadIcon, DocumentIcon, CloudArrowUpIcon } from './icons';

interface StudentDetailsProps {
  student: Student;
  onUpdateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  onSendReminder: (studentName: string) => void;
  onOpenAddDocument: () => void;
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

interface TabButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
            isActive
                ? 'text-sky-400 border-sky-400 bg-sky-500/10'
                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
        {icon}
        {label}
    </button>
);


const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onUpdateStudent, onSendReminder, onOpenAddDocument }) => {
  const [activeTab, setActiveTab] = useState('finanzas');

  const titlingPlans = ['Enfermería General', 'Enfermería por Nivelación'];
  const isTitlingPlan = titlingPlans.includes(student.studyPlan);

  const finalProcedureConcept = isTitlingPlan ? 'Titulación' : 'Certificado de Término';
  const finalProcedurePaymentType = isTitlingPlan ? PaymentType.Titulation : PaymentType.CompletionCertificate;
  const finalProcedureDescription = isTitlingPlan ? 'Pago de Titulación y Cédula Profesional' : 'Pago de Certificado de Término';
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const totalDue = student.payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const balance = totalDue - totalPaid;

  const regularPayments = student.payments.filter(p => p.type !== PaymentType.Titulation && p.type !== PaymentType.CompletionCertificate);
  const regularTotalDue = regularPayments.reduce((sum, p) => sum + p.amountDue, 0);
  const regularTotalPaid = regularPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const allPlanPaymentsCompleted = (regularTotalDue - regularTotalPaid) <= 0 && regularTotalDue > 0;

  const finalPayment = student.payments.find(p => p.type === PaymentType.Titulation || p.type === PaymentType.CompletionCertificate);
  const finalPaymentExists = !!finalPayment;
  const finalPaymentPaid = finalPayment ? finalPayment.status === PaymentStatus.Paid : false;

  const canGraduate = allPlanPaymentsCompleted && student.graduationCompleted && finalPaymentPaid && student.certificateReceived;

  const getTitlingCost = (studyPlan: string): number => {
    switch(studyPlan) {
        case 'Enfermería General': return 17000;
        case 'Enfermería por Nivelación': return 40000;
        case 'Podología':
        case 'Enfermería Industrial':
        case 'Enfermería Quirúrgica':
        case 'Enfermería Auxiliar':
        case 'Técnico en Atención Médica Prehospitalaria (TAMP)':
            return 4500;
        default:
            return 0;
    }
  };

  const handleGenerateFinalProcedurePayment = () => {
    const cost = getTitlingCost(student.studyPlan);
    if (cost > 0 && !finalPaymentExists) {
        const newPayment: Payment = {
            id: `final-${student.id}-${Date.now()}`,
            description: finalProcedureDescription,
            type: finalProcedurePaymentType,
            dueDate: new Date().toISOString().split('T')[0],
            amountDue: cost,
            paidAmount: 0,
            status: PaymentStatus.Pending,
            lateFeeApplied: 0,
        };
        const updatedPayments = [...student.payments, newPayment];
        onUpdateStudent(student.id, { payments: updatedPayments });
    }
  };
  
  const handleMarkAsGraduated = (isDelivered: boolean) => {
      onUpdateStudent(student.id, {
          digitalCertificateDelivered: isDelivered,
          status: 'Egresado',
          graduationYear: new Date().getFullYear(),
      });
  };

  const handleDownloadPaymentHistory = () => {
    if (!student.paymentHistory || student.paymentHistory.length === 0) return;

    const headers = ['Fecha Transacción', 'Monto Transacción', 'Método', 'Concepto Cubierto', 'Monto Aplicado al Concepto'];
    const csvRows = [headers.join(',')];

    student.paymentHistory.forEach(transaction => {
        if (transaction.coveredPayments.length > 0) {
            transaction.coveredPayments.forEach(cp => {
                const row = [
                    transaction.date,
                    transaction.amount,
                    transaction.method,
                    `"${cp.description.replace(/"/g, '""')}"`, // Escape double quotes
                    cp.amountPaid
                ];
                csvRows.push(row.join(','));
            });
        }
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const studentNameSafe = student.name.replace(/\s+/g, '_');
    link.setAttribute('download', `historial_pagos_${studentNameSafe}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFinancials = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (
    <div className="space-y-6">
        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-300">Resumen Financiero</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Pagado" value={formatCurrency(totalPaid)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass="bg-green-500" />
                <StatCard title="Saldo Pendiente" value={formatCurrency(balance)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass={balance > 0 ? "bg-red-500" : "bg-green-500"} />
                <StatCard title="Costo Total" value={formatCurrency(totalDue)} icon={<DollarSignIcon className="w-6 h-6 text-white"/>} colorClass="bg-sky-500" />
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold mb-4 text-slate-300 flex items-center gap-2"><AcademicCapIcon className="w-6 h-6"/>Trámites Finales</h3>
            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                    {/* Graduación */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="graduation"
                            checked={student.graduationCompleted}
                            onChange={(e) => onUpdateStudent(student.id, { graduationCompleted: e.target.checked })}
                            disabled={!allPlanPaymentsCompleted}
                            className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500 disabled:opacity-50"
                        />
                        <label htmlFor="graduation" className={`font-medium ${!allPlanPaymentsCompleted ? 'text-slate-500' : 'text-slate-200'}`}>
                            Pago de Graduación Cubierto
                        </label>
                    </div>
                    {/* Titulación / Certificado */}
                    <div>
                        {finalPaymentExists ? (
                             <p className={`text-sm font-medium text-center p-2 rounded-md ${finalPaymentPaid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {finalPaymentPaid ? `Cobro de ${finalProcedureConcept} PAGADO.` : `Cobro de ${finalProcedureConcept} PENDIENTE.`}
                            </p>
                        ) : (
                            <button
                                onClick={handleGenerateFinalProcedurePayment}
                                disabled={!allPlanPaymentsCompleted}
                                className="w-full px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-colors"
                            >
                                Generar Cobro de {finalProcedureConcept} ({formatCurrency(getTitlingCost(student.studyPlan))})
                            </button>
                        )}
                    </div>
                </div>
                 <div className="border-t border-slate-700/50 my-4"></div>
                 {/* Certificado Digital */}
                 <div className="space-y-3">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="certificate"
                                checked={student.digitalCertificateDelivered}
                                onChange={(e) => { if (e.target.checked) handleMarkAsGraduated(true); }}
                                disabled={!canGraduate}
                                className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500 disabled:opacity-50"
                            />
                            <label htmlFor="certificate" className={`font-medium ${!canGraduate ? 'text-slate-500' : 'text-slate-200'}`}>
                               Certificado Digital Entregado
                            </label>
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${student.certificateReceived ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-400'}`}>
                            {student.certificateReceived ? <DocumentCheckIcon className="w-4 h-4" /> : null}
                            <span>{student.certificateReceived ? 'Certificado Recibido' : 'Certificado No Recibido'}</span>
                        </div>
                     </div>
                     {!canGraduate && (
                        <p className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                           Requiere: Pagos del plan liquidados, graduación cubierta, {finalProcedureConcept.toLowerCase()} pagado y certificado recibido de dirección.
                        </p>
                    )}
                 </div>
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
                             <th className="p-4 font-semibold">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {student.payments.map(payment => {
                            const isOverdue = payment.status !== PaymentStatus.Paid && payment.dueDate < todayStr;
                            return (
                            <tr key={payment.id} className={`border-b border-slate-700 last:border-b-0 hover:bg-slate-800 ${isOverdue ? 'bg-red-500/5' : ''}`}>
                                <td className="p-4">{payment.description}</td>
                                <td className="p-4">{payment.type}</td>
                                <td className={`p-4 ${isOverdue ? 'font-bold text-red-400' : ''}`}>{payment.dueDate}</td>
                                <td className="p-4 font-mono">{formatCurrency(payment.amountDue)}</td>
                                <td className="p-4 font-mono">{formatCurrency(payment.paidAmount)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusBadge(payment.status)}`}>
                                    {payment.status}
                                    </span>
                                </td>
                                 <td className="p-4">
                                    {isOverdue && (
                                        <button
                                            onClick={() => onSendReminder(student.name)}
                                            className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 px-2 py-1 rounded-md transition-colors"
                                        >
                                            Recordatorio
                                        </button>
                                    )}
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
    );
  };

  const renderAcademicInfo = () => (
      <div className="bg-slate-800/50 rounded-lg p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-300 border-b border-slate-700 pb-3">Información Académica y Requisitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.secondaryCertificate ? (
                 <>
                    <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Certificado de Secundaria" value={`#${student.secondaryCertificate.number} (Prom: ${student.secondaryCertificate.gpa})`} />
                    <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Institución (Secundaria)" value={student.secondaryCertificate.institution} />
                 </>
              ) : (
                <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-md text-center text-slate-400">
                    Certificado de secundaria no ha sido registrado. Agréguelo en la pestaña de 'Documentación'.
                </div>
              )}
              {student.highSchoolCertificate && <>
                <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Certificado de Bachillerato" value={`#${student.highSchoolCertificate.number} (Prom: ${student.highSchoolCertificate.gpa})`} />
                <DetailItem icon={<FileTextIcon className="w-5 h-5"/>} label="Institución (Bachillerato)" value={student.highSchoolCertificate.institution} />
              </>}
              {student.workExperience && <>
                <DetailItem icon={<BriefcaseIcon className="w-5 h-5"/>} label="Experiencia Laboral" value={`${student.workExperience.years} años`} />
                <DetailItem icon={<BriefcaseIcon className="w-5 h-5"/>} label="Lugar de Trabajo" value={student.workExperience.institution} />
              </>}
          </div>
          {student.certificateFileUrl && (
             <div className="border-t border-slate-700 pt-6">
                <h4 className="text-lg font-semibold text-sky-400">Certificado Digital Asociado</h4>
                <p className="text-sm text-slate-400 mt-1">El certificado de este alumno ha sido cargado al sistema por dirección.</p>
                <a 
                    href={student.certificateFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sky-400 hover:text-sky-300 font-semibold underline"
                >
                    Ver Certificado Simulado
                </a>
             </div>
          )}
      </div>
  );

    const renderPaymentHistory = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-300">Historial de Transacciones</h3>
                <button
                    onClick={handleDownloadPaymentHistory}
                    disabled={!student.paymentHistory || student.paymentHistory.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Descargar Historial
                </button>
            </div>
            {student.paymentHistory && student.paymentHistory.length > 0 ? (
                <div className="space-y-4">
                    {[...student.paymentHistory].reverse().map(transaction => (
                        <div key={transaction.id} className="bg-slate-800/50 rounded-lg p-4 transition-transform hover:scale-[1.02] hover:bg-slate-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-slate-400">Fecha: {transaction.date}</p>
                                    <p className="font-bold text-sky-400 text-lg">{formatCurrency(transaction.amount)}</p>
                                </div>
                                <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{transaction.method}</span>
                            </div>
                            <div className="mt-3 border-t border-slate-700 pt-3">
                                <p className="text-sm font-semibold text-slate-300 mb-2">Conceptos Cubiertos:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                                    {transaction.coveredPayments.map(cp => (
                                        <li key={cp.paymentId}>
                                            {cp.description}: <span className="font-mono text-slate-200">{formatCurrency(cp.amountPaid)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                     <ClockIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>No se han registrado transacciones para este alumno.</p>
                </div>
            )}
        </div>
    );

    const renderDocumentation = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-300">Documentación del Alumno</h3>
                <button
                    onClick={onOpenAddDocument}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors"
                >
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Agregar Documento
                </button>
            </div>
            {student.documentationFiles && student.documentationFiles.length > 0 ? (
                 <div className="bg-slate-800/50 rounded-lg">
                    <ul className="divide-y divide-slate-700">
                        {student.documentationFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors">
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                    <DocumentIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-400" />
                                    <div>
                                        <p className="font-semibold text-slate-200 group-hover:text-sky-400 group-hover:underline">{file.name}</p>
                                        <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </a>
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 px-3 py-1.5 rounded-md transition-colors">
                                    Ver
                                </a>
                            </li>
                        ))}
                    </ul>
                 </div>
            ) : (
                 <div className="text-center py-12 text-slate-500">
                     <DocumentIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>No se ha subido documentación para este alumno.</p>
                </div>
            )}
        </div>
    );
  

  return (
    <div className="flex flex-col h-full bg-slate-900">
        <header className="p-6 border-b border-slate-700 bg-slate-800/20">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-4">
                <div className="p-3 bg-sky-500/20 rounded-full">
                    <UserIcon className="w-7 h-7 text-sky-400"/>
                </div>
                <div>
                    {student.name}
                    <span className="block text-base font-normal text-slate-400">{student.studyPlan}</span>
                </div>
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                 <DetailItem icon={<IdCardIcon className="w-5 h-5"/>} label="CURP" value={student.curp} />
                 <DetailItem icon={<CalendarIcon className="w-5 h-5"/>} label="Fecha de Inscripción" value={student.enrollmentDate} />
                 <DetailItem icon={<BookOpenIcon className="w-5 h-5"/>} label="Grupo" value={student.group ? `${student.group.schedule} - ${student.group.day || ''}` : 'No asignado'} />
                 {student.address && <DetailItem icon={<MapPinIcon className="w-5 h-5"/>} label="Dirección" value={`${student.address.street}, ${student.address.city}, ${student.address.state} ${student.address.zipCode}`} />}
            </div>
        </header>

        <nav className="flex border-b border-slate-700">
            <TabButton label="Finanzas" icon={<DollarSignIcon className="w-5 h-5"/>} isActive={activeTab === 'finanzas'} onClick={() => setActiveTab('finanzas')} />
            <TabButton label="Información Académica" icon={<FileTextIcon className="w-5 h-5"/>} isActive={activeTab === 'academico'} onClick={() => setActiveTab('academico')} />
            <TabButton label="Historial de Pagos" icon={<ClockIcon className="w-5 h-5"/>} isActive={activeTab === 'historial'} onClick={() => setActiveTab('historial')} />
            <TabButton label="Documentación" icon={<DocumentIcon className="w-5 h-5"/>} isActive={activeTab === 'documentacion'} onClick={() => setActiveTab('documentacion')} />
        </nav>

        <main className="flex-grow overflow-y-auto p-6">
            {activeTab === 'finanzas' && renderFinancials()}
            {activeTab === 'academico' && renderAcademicInfo()}
            {activeTab === 'historial' && renderPaymentHistory()}
            {activeTab === 'documentacion' && renderDocumentation()}
        </main>
    </div>
  );
};

export default StudentDetails;