import React, { useState, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon } from './icons';
import { Certificate } from '../types';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentId: string, file: File, docType: string, metadata?: { number: string; gpa: string; institution: string }) => void;
    studentId: string;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose, onSubmit, studentId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('Otro');
    const [metadata, setMetadata] = useState({ number: '', gpa: '', institution: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;
    
    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Por favor, selecciona un archivo.");
            return;
        }
        if (docType === 'Certificado de Secundaria') {
            if (!metadata.number || !metadata.gpa || !metadata.institution) {
                alert("Por favor, completa todos los campos del certificado.");
                return;
            }
            onSubmit(studentId, file, docType, metadata);
        } else {
            onSubmit(studentId, file, docType);
        }
        // Reset state for next time
        setFile(null);
        setDocType('Otro');
        setMetadata({ number: '', gpa: '', institution: '' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Agregar Documento</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6 text-slate-400"/>
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Seleccionar Archivo</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-slate-600 hover:border-slate-500"
                        >
                            <CloudArrowUpIcon className="w-10 h-10 mx-auto text-slate-500" />
                            {file ? (
                                <p className="mt-2 text-sm text-green-400">{file.name}</p>
                            ) : (
                                <p className="mt-2 text-sm text-slate-400">
                                    <span className="font-semibold text-sky-400">Haz clic para subir</span> un archivo.
                                </p>
                            )}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="docType" className="block text-sm font-medium text-slate-300 mb-1">Tipo de Documento</label>
                        <select
                            id="docType"
                            value={docType}
                            onChange={e => setDocType(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                            <option>Otro</option>
                            <option>Certificado de Secundaria</option>
                            <option>Acta de Nacimiento</option>
                            <option>CURP</option>
                            <option>Comprobante de Domicilio</option>
                        </select>
                    </div>

                    {docType === 'Certificado de Secundaria' && (
                        <fieldset className="space-y-4 p-4 bg-slate-900/50 rounded-md">
                            <legend className="font-semibold text-slate-300 mb-2">Datos del Certificado</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="number" className="block text-xs font-medium text-slate-400 mb-1">Número de Cert.</label>
                                    <input type="text" name="number" value={metadata.number} onChange={handleMetaChange} required className="w-full text-sm bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label htmlFor="gpa" className="block text-xs font-medium text-slate-400 mb-1">Promedio</label>
                                    <input type="number" step="0.1" name="gpa" value={metadata.gpa} onChange={handleMetaChange} required className="w-full text-sm bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="institution" className="block text-xs font-medium text-slate-400 mb-1">Institución</label>
                                    <input type="text" name="institution" value={metadata.institution} onChange={handleMetaChange} required className="w-full text-sm bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                </div>
                            </div>
                        </fieldset>
                    )}

                    <footer className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md">Cancelar</button>
                        <button type="submit" disabled={!file} className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Agregar Documento
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddDocumentModal;