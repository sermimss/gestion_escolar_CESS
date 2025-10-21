import React from 'react';
import { SparklesIcon } from './icons';

interface GeminiInputProps {
  isLoading: boolean;
  selectedStudentName?: string;
  onShowEnrollmentForm: () => void;
  onShowPaymentForm: () => void;
}

const GeminiInput: React.FC<GeminiInputProps> = ({ isLoading, selectedStudentName, onShowEnrollmentForm, onShowPaymentForm }) => {

  return (
    <div className="space-y-2">
       <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-300">
          <SparklesIcon className="w-5 h-5 text-sky-400"/>
          Acciones Rápidas
      </div>
      <div className="flex gap-2 pt-1">
          <button 
              onClick={onShowEnrollmentForm}
              disabled={isLoading}
              type="button"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-3 py-2 rounded-md disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors font-medium"
          >
              Inscribir Alumno
          </button>
          <button
              onClick={onShowPaymentForm}
              disabled={isLoading || !selectedStudentName}
              type="button"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-3 py-2 rounded-md disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 transition-colors font-medium"
          >
              Registrar Pago
          </button>
      </div>
    </div>
  );
};

export default GeminiInput;