import React, { useState } from 'react';
import { Student, PaymentStatus, Payment, PaymentMethod, PaymentType } from './types';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import GeminiInput from './components/GeminiInput';
import { processTextWithGemini } from './services/geminiService';
import { UserIcon, ChartBarIcon } from './components/icons';
import Dashboard from './components/Dashboard';
import EnrollmentForm from './components/EnrollmentForm';
import PaymentForm, { PaymentFormData } from './components/PaymentForm';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);


  const handleProcessEnrollment = async (command: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await processTextWithGemini(command);
      
      switch (result.action) {
        case 'ADD_STUDENT':
          setStudents(prevStudents => {
            const studentName = result.studentData.name.toLowerCase();
            if (prevStudents.some(s => s.name.toLowerCase() === studentName)) {
              throw new Error(`El estudiante '${result.studentData.name}' ya existe.`);
            }
            const newStudent: Student = {
              ...result.studentData,
              id: Date.now().toString(),
            };
            const newStudents = [...prevStudents, newStudent];
            setSelectedStudentId(newStudent.id);
            setIsEnrollmentFormOpen(false);
            return newStudents;
          });
          break;
        case 'NO_OP':
            setError("No entendí la solicitud. Por favor, intenta de nuevo.");
            break;
        default:
          console.warn("Acción desconocida:", result.action);
      }
    } catch (e: any) {
      setError(e.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPayment = (paymentData: PaymentFormData) => {
    setIsLoading(true);
    setError(null);
    try {
        setStudents(prevStudents => {
            const newStudents = [...prevStudents];
            const studentToUpdateIndex = newStudents.findIndex(s => s.id === selectedStudentId);
            if (studentToUpdateIndex === -1) {
                throw new Error(`Estudiante no encontrado.`);
            }

            const studentToUpdate = { ...newStudents[studentToUpdateIndex] };
            const updatedPayments = [...studentToUpdate.payments];
            let remainingAmount = paymentData.amount;
            const now = new Date().toISOString().split('T')[0];

            // 1. Pagar conceptos existentes seleccionados
            if (paymentData.selectedConcepts.length > 0) {
              for (const conceptId of paymentData.selectedConcepts) {
                if (remainingAmount <= 0) break;
                
                const paymentIndex = updatedPayments.findIndex(p => p.id === conceptId);
                if (paymentIndex !== -1) {
                    const payment = { ...updatedPayments[paymentIndex] };
                    const amountNeeded = payment.amountDue - payment.paidAmount;
                    const amountToPay = Math.min(remainingAmount, amountNeeded);

                    payment.paidAmount += amountToPay;
                    payment.status = payment.paidAmount >= payment.amountDue ? PaymentStatus.Paid : PaymentStatus.Partial;
                    payment.paymentDate = now;
                    payment.paymentMethod = paymentData.method;
                    
                    remainingAmount -= amountToPay;
                    updatedPayments[paymentIndex] = payment;
                }
              }
            }

            // 2. Añadir y pagar concepto personalizado si existe
            if (paymentData.isCustom && paymentData.customConceptDesc && paymentData.customConceptAmount > 0 && remainingAmount > 0) {
                const amountForCustom = Math.min(remainingAmount, paymentData.customConceptAmount);
                const newPayment: Payment = {
                    id: `custom-${Date.now()}`,
                    description: paymentData.customConceptDesc,
                    type: paymentData.customConceptType,
                    dueDate: now,
                    amountDue: paymentData.customConceptAmount,
                    paidAmount: amountForCustom,
                    status: amountForCustom >= paymentData.customConceptAmount ? PaymentStatus.Paid : PaymentStatus.Partial,
                    paymentDate: now,
                    paymentMethod: paymentData.method,
                    lateFeeApplied: 0,
                };
                updatedPayments.push(newPayment);
                remainingAmount -= amountForCustom;
            }
            
            studentToUpdate.payments = updatedPayments;
            newStudents[studentToUpdateIndex] = studentToUpdate;
            setIsPaymentFormOpen(false);
            return newStudents;
        });
    } catch(e: any) {
        setError(e.message || "Ocurrió un error al registrar el pago.");
    } finally {
        setIsLoading(false);
    }
  };


  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <>
      <EnrollmentForm 
        isOpen={isEnrollmentFormOpen}
        onClose={() => setIsEnrollmentFormOpen(false)}
        onSubmit={handleProcessEnrollment}
        isLoading={isLoading}
      />
      {selectedStudent && (
         <PaymentForm
            isOpen={isPaymentFormOpen}
            onClose={() => setIsPaymentFormOpen(false)}
            onSubmit={handleRegisterPayment}
            isLoading={isLoading}
            student={selectedStudent}
        />
      )}
      <div className="flex h-screen bg-slate-900 font-sans">
        <div className="w-1/3 border-r border-slate-700 flex flex-col max-w-sm">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-sky-400 flex items-center gap-2">
              <UserIcon className="w-7 h-7" />
              Gestor Escolar IA
            </h1>
            <p className="text-sm text-slate-400">Potenciado por Gemini.</p>
          </div>
          <div className="p-4 border-b border-slate-700">
             <button
              onClick={() => setSelectedStudentId(null)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
             >
                <ChartBarIcon className="w-5 h-5" />
                Dashboard
             </button>
          </div>
          <div className="flex-grow overflow-y-auto">
            <StudentList
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          </div>
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <GeminiInput
                isLoading={isLoading}
                selectedStudentName={selectedStudent?.name}
                onShowEnrollmentForm={() => setIsEnrollmentFormOpen(true)}
                onShowPaymentForm={() => setIsPaymentFormOpen(true)}
              />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </div>
        <main className="w-2/3 overflow-y-auto flex-1">
          {selectedStudent ? (
            <StudentDetails student={selectedStudent} />
          ) : (
            <Dashboard students={students} />
          )}
        </main>
      </div>
    </>
  );
};

export default App;