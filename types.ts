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
    SocialService = 'Servicio Social'
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

export interface Student {
  id: string;
  name: string;
  curp: string;
  enrollmentDate: string;
  studyPlan: string;
  group: StudentGroup;
  hasScholarship: boolean;
  secondaryCertificate: Certificate;
  highSchoolCertificate?: Certificate;
  workExperience?: WorkExperience;
  contact?: {
      phone: string;
      email: string;
  };
  payments: Payment[];
}