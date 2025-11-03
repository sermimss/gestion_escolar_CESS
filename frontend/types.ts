export enum PaymentStatus {
  Paid = 'Pagado',
  Pending = 'Pendiente',
  Overdue = 'Vencido',
  Partial = 'Parcial',
}

export enum PaymentMethod {
  Cash = 'Efectivo',
  Card = 'Tarjeta',
  Transfer = 'Transferencia',
  Deposit = 'Depósito',
}

export enum PaymentType {
    Enrollment = 'Inscripción',
    ReEnrollment = 'Reinscripción',
    Monthly = 'Mensualidad',
    Weekly = 'Semanal',
    SocialService = 'Servicio Social',
    Titulation = 'Titulación',
    CompletionCertificate = 'Certificado de Término',
}

export interface Payment {
  id: string;
  description: string;
  type: PaymentType;
  dueDate: string;
  amountDue: number;
  paidAmount: number;
  status: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  lateFeeApplied: number;
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    method: PaymentMethod;
    coveredPayments: {
        paymentId: string;
        description: string;
        amountPaid: number;
    }[];
}

export interface Certificate {
    number: string;
    gpa: number;
    institution: string;
}

export interface WorkExperience {
    institution: string;
    years: number;
}

export interface StudentGroup {
    plan: string;
    shift: 'Matutino' | 'Vespertino';
    schedule: 'Entre Semana' | 'Fin de Semana';
    day?: 'Sábado' | 'Domingo';
}

export interface SubjectGrade {
    subject: string;
    grade: number;
}

export interface AcademicRecord {
    period: string; // e.g., "Cuatrimestre 1", "Semana 1-9"
    grades: SubjectGrade[];
    gpa: number;
}

export interface DocumentationFile {
    name: string;
    url: string;
    size: number;
}

export interface Student {
  id: string;
  name: string;
  curp: string;
  enrollmentDate: string;
  studyPlan: string;
  group?: StudentGroup;
  hasScholarship: boolean;
  secondaryCertificate?: Certificate;
  highSchoolCertificate?: Certificate;
  workExperience?: WorkExperience;
  contact?: {
      phone: string;
      email: string;
  };
  address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
  };
  payments: Payment[];
  paymentHistory: Transaction[];
  academicHistory: AcademicRecord[];
  documentationFiles: DocumentationFile[];
  graduationCompleted: boolean;
  digitalCertificateDelivered: boolean;
  status: 'Activo' | 'Egresado';
  graduationYear?: number;
  certificateReceived: boolean;
  certificateFileUrl: string | null;
}