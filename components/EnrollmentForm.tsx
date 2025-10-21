import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface EnrollmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (command: string) => void;
    isLoading: boolean;
}

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; required?: boolean; children?: React.ReactNode }> = 
({ label, name, value, onChange, type = 'text', required = false, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        {type === 'select' ? (
            <select id={name} name={name} value={value} onChange={onChange} required={required} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                {children}
            </select>
        ) : (
            <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
        )}
    </div>
);

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        curp: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        studyPlan: '',
        schedule: '',
        day: '',
        shift: '',
        hasScholarship: false,
        secCertNum: '',
        secCertGpa: '',
        secCertInst: '',
        hsCertNum: '',
        hsCertGpa: '',
        hsCertInst: '',
        workInst: '',
        workYears: '',
    });

    const [showsExtraFields, setShowsExtraFields] = useState(false);

    useEffect(() => {
        setShowsExtraFields(formData.studyPlan === 'Enfermería por Nivelación');
    }, [formData.studyPlan]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Construir el comando en lenguaje natural desde el formulario
        let command = `Inscribir a ${formData.name} (CURP: ${formData.curp}) en ${formData.studyPlan} en el grupo ${formData.schedule} ${formData.day} ${formData.shift}. Inicia el ${formData.enrollmentDate}.`;
        command += ` ${formData.hasScholarship ? 'Es' : 'No es'} trabajador de salud.`;
        command += ` Certificado secundaria: #${formData.secCertNum}, Promedio: ${formData.secCertGpa}, Inst: ${formData.secCertInst}.`;
        if (showsExtraFields) {
            if(formData.hsCertNum) command += ` Certificado bachillerato: #${formData.hsCertNum}, Promedio: ${formData.hsCertGpa}, Inst: ${formData.hsCertInst}.`;
            if(formData.workInst) command += ` Experiencia: ${formData.workYears} años en ${formData.workInst}.`;
        }
        onSubmit(command);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Inscribir Nuevo Alumno</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6 text-slate-400"/>
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Sección de Datos Personales */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-sky-400 mb-2">Datos Personales</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <InputField label="Nombre Completo" name="name" value={formData.name} onChange={handleChange} required />
                           <InputField label="CURP" name="curp" value={formData.curp} onChange={handleChange} required />
                        </div>
                    </fieldset>
                    
                    {/* Sección de Detalles del Curso */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-sky-400 mb-2">Detalles del Curso</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Plan de Estudios" name="studyPlan" value={formData.studyPlan} onChange={handleChange} type="select" required>
                                <option value="">Selecciona un plan...</option>
                                <option>Enfermería por Nivelación</option>
                                <option>Enfermería General</option>
                                <option>Podología</option>
                                <option>Enfermería Industrial</option>
                                <option>Enfermería Quirúrgica</option>
                                <option>Enfermería Auxiliar</option>
                                <option>Técnico en Atención Médica Prehospitalaria (TAMP)</option>
                            </InputField>
                            <InputField label="Fecha de Inicio" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} type="date" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <InputField label="Horario" name="schedule" value={formData.schedule} onChange={handleChange} type="select" required>
                                <option value="">Selecciona...</option>
                                <option>Entre Semana</option>
                                <option>Fin de Semana</option>
                            </InputField>
                            <InputField label="Día/Turno" name="day" value={formData.day} onChange={handleChange} type="select" required>
                                <option value="">Selecciona...</option>
                                <option>Sábado</option>
                                <option>Domingo</option>
                            </InputField>
                            <InputField label="Turno" name="shift" value={formData.shift} onChange={handleChange} type="select" required>
                                <option value="">Selecciona...</option>
                                <option>Matutino</option>
                                <option>Vespertino</option>
                            </InputField>
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="checkbox" id="hasScholarship" name="hasScholarship" checked={formData.hasScholarship} onChange={handleChange} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500" />
                             <label htmlFor="hasScholarship" className="text-sm text-slate-300">¿Es trabajador del sector salud? (Aplica para beca)</label>
                        </div>
                    </fieldset>

                    {/* Sección Académica */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-sky-400 mb-2">Información Académica</legend>
                        <div className="p-4 bg-slate-900/50 rounded-md space-y-4">
                            <h4 className="font-semibold text-slate-200">Certificado de Secundaria</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputField label="Número de Cert." name="secCertNum" value={formData.secCertNum} onChange={handleChange} required />
                                <InputField label="Promedio" name="secCertGpa" value={formData.secCertGpa} onChange={handleChange} type="number" required />
                                <InputField label="Institución" name="secCertInst" value={formData.secCertInst} onChange={handleChange} required />
                            </div>
                        </div>

                        {showsExtraFields && (
                            <>
                                <div className="p-4 bg-slate-900/50 rounded-md space-y-4">
                                    <h4 className="font-semibold text-slate-200">Certificado de Bachillerato (Opcional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InputField label="Número de Cert." name="hsCertNum" value={formData.hsCertNum} onChange={handleChange} />
                                        <InputField label="Promedio" name="hsCertGpa" value={formData.hsCertGpa} onChange={handleChange} type="number" />
                                        <InputField label="Institución" name="hsCertInst" value={formData.hsCertInst} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-md space-y-4">
                                    <h4 className="font-semibold text-slate-200">Experiencia Laboral (Opcional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Lugar de Trabajo" name="workInst" value={formData.workInst} onChange={handleChange} />
                                        <InputField label="Años de Experiencia" name="workYears" value={formData.workYears} onChange={handleChange} type="number" />
                                    </div>
                                </div>
                            </>
                        )}
                    </fieldset>
                </form>
                <footer className="p-4 bg-slate-800 border-t border-slate-700 mt-auto">
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md">Cancelar</button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-600">
                            {isLoading ? 'Inscribiendo...' : 'Inscribir Alumno'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default EnrollmentForm;
