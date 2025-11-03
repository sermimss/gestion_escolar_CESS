
import React, { useState, useMemo, useEffect } from 'react';
import { Student, PaymentStatus, Payment, PaymentMethod, PaymentType, Transaction, DocumentationFile, Certificate } from './types';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import GeminiInput from './components/GeminiInput';
import { processTextWithGemini, queryStudentDataWithGemini } from './services/geminiService';
import { UserIcon, ChartBarIcon, UserGroupIcon, AcademicCapIcon, DocumentCheckIcon, LightBulbIcon, MegaphoneIcon, LogoutIcon, CloudIcon, ChevronDownIcon, TrashIcon } from './components/icons';
import Dashboard from './components/Dashboard';
import EnrollmentForm from './components/EnrollmentForm';
import PaymentForm, { PaymentFormData } from './components/PaymentForm';
import PendingCertificates from './components/PendingCertificates';
import AcademicIntelligenceModal from './components/AcademicIntelligenceModal';
import CommunicationsAssistantModal from './components/CommunicationsAssistantModal';
import LoginScreen from './components/LoginScreen';
import Notifications, { OverdueNotification } from './components/Notifications';
import AddDocumentModal from './components/AddDocumentModal';


type UserRole = 'Director' | 'Administrativo';
type View = 'dashboard' | 'students' | 'graduates';
// ¡CAMBIO IMPORTANTE! Apunta a la URL de producción de Render.
// Reemplaza 'https://gestor-escolar-api.onrender.com' con la URL real de tu backend.
const API_URL = 'https://gestion-escolar-cess.onrender.com/api';

const DriveConnectScreen: React.FC<{ onConnect: () => void }> = ({ onConnect }) => (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-200">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg text-center">
             <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google Drive" className="h-12 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-100 mt-4">Conecta tu Base de Datos Central</h1>
            <p className="text-slate-400">
                Para iniciar, la aplicación debe conectarse al servidor y la base de datos central. (Simulado)
            </p>
            <button
                onClick={onConnect}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800"
            >
                <CloudIcon className="w-5 h-5" />
                Conectar a la Base de Datos
            </button>
            <p className="text-xs text-slate-500">
                Al conectar, la aplicación comenzará a interactuar con el backend real.
            </p>
        </div>
    </div>
);


const GraduatedStudentsView: React.FC<{ students: Student[] }> = ({ students }) => {
    const groupedByYear = useMemo(() => {
        return students.reduce((acc, student) => {
            const year = student.graduationYear || 'Sin Año';
            if (!acc[year]) acc[year] = {};
            
            const plan = student.studyPlan;
            if (!acc[year][plan]) acc[year][plan] = [];

            acc[year][plan].push(student);
            return acc;
        }, {} as Record<string, Record<string, Student[]>>);
    }, [students]);

    const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    return (
        <div className="p-8 space-y-8">
             <header>
                <h2 className="text-4xl font-extrabold text-white flex items-center gap-3">
                    <UserGroupIcon className="w-9 h-9 text-sky-400" />
                    Archivo de Alumnos Egresados
                </h2>
                <p className="text-slate-400 mt-1">Historial de alumnos que han completado sus estudios.</p>
            </header>
            {students.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <AcademicCapIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>Aún no hay alumnos egresados registrados.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedYears.map(year => (
                        <div key={year}>
                            <h3 className="text-2xl font-bold text-sky-300 mb-4 border-b border-slate-700 pb-2">{year}</h3>
                            <div className="space-y-4">
                                {Object.keys(groupedByYear[year]).sort().map(plan => (
                                    <div key={plan} className="bg-slate-800/50 rounded-lg p-4">
                                        <h4 className="font-bold text-slate-200">{plan}</h4>
                                        <ul className="mt-2 list-disc list-inside text-slate-300">
                                            {groupedByYear[year][plan].map(student => (
                                                <li key={student.id}>{student.name} - <span className="text-sm text-slate-400">CURP: {student.curp}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [graduatedStudents, setGraduatedStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isAcademicIntelligenceOpen, setIsAcademicIntelligenceOpen] = useState(false);
  const [isCommunicationsOpen, setIsCommunicationsOpen] = useState(false);
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const dbStatus = localStorage.getItem('dbConnected') === 'true';
    setIsDriveConnected(dbStatus);

    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/students`);
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor. ¿Está encendido?');
        }
        const data: Student[] = await response.json();
        setStudents(data.filter(s => s.status === 'Activo'));
        setGraduatedStudents(data.filter(s => s.status === 'Egresado'));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (dbStatus && authenticatedRole) {
      fetchStudents();
    }
  }, [isDriveConnected, authenticatedRole]);


  const handleDriveConnect = () => {
      localStorage.setItem('dbConnected', 'true');
      setIsDriveConnected(true);
  };

  const handleLogin = (role: UserRole) => {
    setAuthenticatedRole(role);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setAuthenticatedRole(null);
    setSelectedStudentId(null);
  };
  
  const handleDisconnectDrive = () => {
    const isConfirmed = window.confirm("¿Estás seguro de que quieres desconectar? Esto requerirá recargar la página.");
    if (isConfirmed) {
      localStorage.removeItem('dbConnected');
      setIsDriveConnected(false);
      setAuthenticatedRole(null);
      setStudents([]);
      setGraduatedStudents([]);
    }
  };

  const handleProcessEnrollment = async (command: string, files: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
        const result = await processTextWithGemini(command);

        if (result.action === 'ADD_STUDENT') {
            const newStudentPayload = {
                ...result.studentData,
                payments: result.studentData.payments || [],
                academicHistory: result.studentData.academicHistory || [],
            };

            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudentPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Error al crear el alumno.' }));
                throw new Error(errorData.detail);
            }
            
            let createdStudent: Student = await response.json();

            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => formData.append('files', file, file.name));
                
                const fileResponse = await fetch(`${API_URL}/students/${createdStudent.id}/documents/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (!fileResponse.ok) {
                    throw new Error('Alumno creado, pero falló la subida de documentos.');
                }
                createdStudent = await fileResponse.json();
            }

            setStudents(prev => [...prev, createdStudent]);
            setSelectedStudentId(createdStudent.id);
            setCurrentView('students');
            setIsEnrollmentFormOpen(false);
            setNotification(`¡Alumno '${createdStudent.name}' inscrito con éxito!`);
            setTimeout(() => setNotification(null), 5000);

        } else if (result.action === 'NO_OP') {
            setError("No entendí la solicitud. Por favor, intenta de nuevo.");
        } else {
            console.warn("Acción desconocida:", result.action);
        }
    } catch (e: any) {
        setError(e.message || "Ocurrió un error inesperado.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateStudent = async (studentId: string, updatedData: Partial<Student>) => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await fetch(`${API_URL}/students/${studentId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData),
          });

          if (!response.ok) {
              const err = await response.json().catch(() => ({ detail: 'Error al actualizar el alumno.' }));
              throw new Error(err.detail);
          }
          
          const finalUpdatedStudent: Student = await response.json();

          if (finalUpdatedStudent.status === 'Egresado' && updatedData.status === 'Egresado') {
              setGraduatedStudents(prev => [...prev.filter(s => s.id !== studentId), finalUpdatedStudent]);
              setStudents(prev => prev.filter(s => s.id !== studentId));
              setSelectedStudentId(null);
              setCurrentView('graduates');
          } else {
              setStudents(prev => prev.map(s => (s.id === studentId ? finalUpdatedStudent : s)));
          }
          setNotification("Datos del alumno actualizados.");
          setTimeout(() => setNotification(null), 3000);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAddDocument = async (studentId: string, file: File, docType: string, metadata?: { number: string; gpa: string; institution: string }) => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append('files', file, file.name);
        formData.append('docType', docType);
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch(`${API_URL}/students/${studentId}/documents/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Error al subir el documento.');

        const updatedStudent: Student = await response.json();

        setStudents(prev => prev.map(s => (s.id === studentId ? updatedStudent : s)));
        setIsAddDocumentOpen(false);
        setNotification(`Documento '${file.name}' agregado a ${updatedStudent.name}.`);
        setTimeout(() => setNotification(null), 5000);

    } catch (e: any) {
        setError(e.message || "Ocurrió un error al subir el documento.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterPayment = async (paymentData: PaymentFormData) => {
    if(!selectedStudentId) return;
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_URL}/students/${selectedStudentId}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Error al registrar el pago.' }));
            throw new Error(err.detail);
        }

        const updatedStudent: Student = await response.json();
        setStudents(prev => prev.map(s => (s.id === selectedStudentId ? updatedStudent : s)));
        setIsPaymentFormOpen(false);
        setNotification(`Pago registrado para ${updatedStudent.name}.`);
        setTimeout(() => setNotification(null), 5000);

    } catch(e: any) {
        setError(e.message || "Ocurrió un error al registrar el pago.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCertificateUpload = () => {
    const studentToUpdate = students.find(s => !s.certificateReceived && s.status === 'Activo');
    if (studentToUpdate) {
        handleUpdateStudent(studentToUpdate.id, {
            certificateReceived: true,
            certificateFileUrl: `/certs/${studentToUpdate.curp}.pdf`
        });
        setNotification(`Certificado para ${studentToUpdate.name} ha sido cargado y asociado por la IA.`);
        setTimeout(() => setNotification(null), 5000);
    } else {
        setError("No hay alumnos activos pendientes de recibir su certificado.");
        setTimeout(() => setError(null), 5000);
    }
  }

  const handleMarkCertificateDelivered = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const regularPayments = student.payments.filter(p => p.type !== PaymentType.Titulation && p.type !== PaymentType.CompletionCertificate);
    const regularTotalDue = regularPayments.reduce((sum, p) => sum + p.amountDue, 0);
    const regularTotalPaid = regularPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const allPlanPaymentsCompleted = (regularTotalDue - regularTotalPaid) <= 0 && regularTotalDue > 0;

    const finalPayment = student.payments.find(p => p.type === PaymentType.Titulation || p.type === PaymentType.CompletionCertificate);
    const finalPaymentPaid = finalPayment ? finalPayment.status === PaymentStatus.Paid : false;
    
    const isReadyForGraduation = allPlanPaymentsCompleted && student.graduationCompleted && finalPaymentPaid && student.certificateReceived;

    if (isReadyForGraduation) {
      handleUpdateStudent(studentId, {
        digitalCertificateDelivered: true,
        status: 'Egresado',
        graduationYear: new Date().getFullYear(),
      });
      setNotification(`Certificado de ${student.name} entregado. El alumno ha sido movido a egresados.`);
      setTimeout(() => setNotification(null), 5000);
    } else {
      setError(`No se puede marcar como entregado. Revisa los pagos o trámites de ${student.name}.`);
      setSelectedStudentId(studentId);
      setCurrentView('students');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAcademicQuery = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const result = await queryStudentDataWithGemini(query, students);
        return result;
    } catch (e: any) {
        setError(e.message || "Ocurrió un error inesperado al consultar.");
        return null;
    } finally {
        setIsLoading(false);
    }
  };

  const overdueNotifications: OverdueNotification[] = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return students
        .map(student => {
            const overduePayments = student.payments.filter(p =>
                p.status !== PaymentStatus.Paid && p.dueDate < todayStr
            );

            if (overduePayments.length > 0) {
                return {
                    studentId: student.id,
                    studentName: student.name,
                    overdueCount: overduePayments.length,
                };
            }
            return null;
        })
        .filter((s): s is OverdueNotification => s !== null);
  }, [students]);

  const handleSendReminder = (studentName: string) => {
      setNotification(`Recordatorio de pago simulado enviado a ${studentName}.`);
      setTimeout(() => setNotification(null), 5000);
  };

  const filteredActiveStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery]);

  const foundGraduatedStudent = useMemo(() => {
    if (!searchQuery) return null;
    return graduatedStudents.find(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [graduatedStudents, searchQuery]);

  const pendingCertificateStudents = useMemo(() => {
      return students.filter(s => s.certificateReceived && !s.digitalCertificateDelivered);
  }, [students]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const renderMainContent = () => {
    if (isLoading && students.length === 0 && authenticatedRole) {
      return (
          <div className="flex items-center justify-center h-full text-center text-slate-500">
              <p>Cargando datos desde el servidor...</p>
          </div>
      );
    }
     if (error) {
      return (
        <div className="flex items-center justify-center h-full p-4">
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-6 rounded-lg text-center max-w-lg">
                 <h2 className="text-2xl font-bold">Error de Conexión</h2>
                <p className="mt-2">{error}</p>
                 <button onClick={() => setError(null)} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-md">
                    Entendido
                </button>
            </div>
        </div>
      );
    }
    if (currentView === 'dashboard') {
        return authenticatedRole === 'Director' 
            ? <Dashboard students={students} overdueStudentsCount={overdueNotifications.length} /> 
            : <PendingCertificates students={pendingCertificateStudents} onMarkDelivered={handleMarkCertificateDelivered} />;
    }
    if (currentView === 'graduates') {
        return <GraduatedStudentsView students={graduatedStudents} />
    }
    if (selectedStudent) {
        return <StudentDetails student={selectedStudent} onUpdateStudent={handleUpdateStudent} onSendReminder={handleSendReminder} onOpenAddDocument={() => setIsAddDocumentOpen(true)} />
    }
     // Fallback for an empty main view
    return (
        <div className="flex items-center justify-center h-full text-center text-slate-500">
            <div>
                <UserIcon className="w-16 h-16 mx-auto mb-4"/>
                <h2 className="text-2xl font-bold">Gestor Escolar IA</h2>
                <p>Seleccione un alumno de la lista para ver sus detalles.</p>
            </div>
        </div>
    );
  }
  
  if (!isDriveConnected) {
    return <DriveConnectScreen onConnect={handleDriveConnect} />;
  }

  if (!authenticatedRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
       {selectedStudentId && (
        <AddDocumentModal
            isOpen={isAddDocumentOpen}
            onClose={() => setIsAddDocumentOpen(false)}
            onSubmit={handleAddDocument}
            studentId={selectedStudentId}
        />
      )}
      <AcademicIntelligenceModal 
        isOpen={isAcademicIntelligenceOpen}
        onClose={() => setIsAcademicIntelligenceOpen(false)}
        onQuery={handleAcademicQuery}
        isLoading={isLoading}
      />
      <CommunicationsAssistantModal
        isOpen={isCommunicationsOpen}
        onClose={() => setIsCommunicationsOpen(false)}
        students={students}
        isLoading={isLoading}
      />
      <div className="flex h-screen bg-slate-900 font-sans">
        <div className="w-1/3 border-r border-slate-700 flex flex-col max-w-sm">
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-sky-400 flex items-center gap-2">
              <UserIcon className="w-7 h-7" />
              Gestor Escolar IA
            </h1>
            <div className="flex items-center gap-2 text-xs text-green-400 mt-1">
                <CloudIcon className="w-4 h-4" />
                <span>Conectado al Servidor</span>
            </div>
          </div>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div className="relative">
                <button
                    onClick={() => setIsSettingsOpen(prev => !prev)}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:bg-slate-700 p-2 rounded-md transition-colors"
                >
                    <span>Bienvenido, <span className="font-bold text-sky-400">{authenticatedRole}</span></span>
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
                {isSettingsOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20">
                        <ul className="py-1">
                            <li>
                                <button onClick={() => { handleLogout(); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3">
                                    <LogoutIcon className="w-5 h-5" />
                                    Cerrar Sesión
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        handleDisconnectDrive();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                    Desconectar del Servidor
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                  {authenticatedRole === 'Director' && <Notifications notifications={overdueNotifications} onSendReminder={handleSendReminder} />}
              </div>
            </div>
          <div className="p-4 border-b border-slate-700 space-y-4">
              <div className="flex gap-2">
                 <button onClick={() => { setSelectedStudentId(null); setCurrentView('dashboard'); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors">
                    <ChartBarIcon className="w-5 h-5" /> {authenticatedRole === 'Director' ? 'Dashboard' : 'Tareas Pendientes'}
                 </button>
                 <button onClick={() => { setSelectedStudentId(null); setCurrentView('graduates'); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors">
                    <UserGroupIcon className="w-5 h-5" /> Egresados
                 </button>
              </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Herramientas IA</label>
                <div className="flex gap-2 mt-1">
                     {authenticatedRole === 'Director' && (
                        <button onClick={() => setIsAcademicIntelligenceOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
                            <LightBulbIcon className="w-5 h-5" /> Inteligencia Académica
                        </button>
                     )}
                     {authenticatedRole === 'Administrativo' && (
                        <button onClick={() => setIsCommunicationsOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors">
                            <MegaphoneIcon className="w-5 h-5" /> Asistente de Comunicación
                        </button>
                     )}
                 </div>
             </div>
             {authenticatedRole === 'Director' && (
                <div>
                     <button onClick={handleCertificateUpload} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
                        <DocumentCheckIcon className="w-5 h-5" /> Simular Carga de Certificado
                     </button>
                </div>
             )}
          </div>
          <div className="flex-grow overflow-y-auto">
            <StudentList
              students={filteredActiveStudents}
              selectedStudentId={selectedStudentId}
              onSelectStudent={(id) => { setSelectedStudentId(id); setCurrentView('students'); }}
            />
          </div>
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <GeminiInput
                isLoading={isLoading}
                selectedStudentName={selectedStudent?.name}
                onShowEnrollmentForm={() => setIsEnrollmentFormOpen(true)}
                onShowPaymentForm={() => setIsPaymentFormOpen(true)}
              />
            {notification && <p className="text-green-400 text-sm mt-2 text-center">{notification}</p>}
          </div>
        </div>
        <main className="w-2/3 overflow-y-auto flex-1 flex flex-col">
          {authenticatedRole === 'Administrativo' && (
              <div className="p-4 border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10">
                  <input
                    type="text"
                    placeholder="Buscar alumno por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  {foundGraduatedStudent && (
                      <div className="mt-2 bg-blue-500/10 text-blue-300 text-sm p-3 rounded-md">
                          <p>El alumno <strong>{foundGraduatedStudent.name}</strong> ya ha egresado. 
                          <button onClick={() => { setCurrentView('graduates'); setSearchQuery('')}} className="font-bold underline ml-2 hover:text-blue-200">
                               Ver en el archivo de egresados.
                          </button>
                          </p>
                      </div>
                  )}
              </div>
          )}
          <div className="flex-grow">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
