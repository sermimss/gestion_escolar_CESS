import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import { Student, PaymentMethod, PaymentStatus, PaymentType } from '../types';

export interface PaymentFormData {
    amount: number;
    method: PaymentMethod;
    selectedConcepts: string[];
    isCustom: boolean;
    customConceptDesc?: string;
    customConceptAmount?: number;
    customConceptType: PaymentType;
}

interface PaymentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PaymentFormData) => void;
    isLoading: boolean;
    student: Student;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const PaymentForm: React.FC<PaymentFormProps> = ({ isOpen, onClose, onSubmit, isLoading, student }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
    const [isCustom, setIsCustom] = useState(false);
    const [customDesc, setCustomDesc] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [customType, setCustomType] = useState<PaymentType>(PaymentType.Monthly);
    
    useEffect(() => {
        // Reset form on open
        if (isOpen) {
            setAmount('');
            setMethod(PaymentMethod.Cash);
            setSelectedConcepts([]);
            setIsCustom(false);
            setCustomDesc('');
            setCustomAmount('');
            setCustomType(PaymentType.Monthly);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const pendingPayments = student.payments.filter(p => p.status !== PaymentStatus.Paid);

    const handleConceptToggle = (paymentId: string) => {
        setSelectedConcepts(prev => 
            prev.includes(paymentId) 
            ? prev.filter(id => id !== paymentId) 
            : [...prev, paymentId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert("Por favor, introduce un monto válido.");
            return;
        }
        onSubmit({
            amount: paymentAmount,
            method,
            selectedConcepts,
            isCustom,
            customConceptDesc: customDesc,
            customConceptAmount: parseFloat(customAmount) || 0,
            customConceptType: customType,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Registrar Pago para {student.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6 text-slate-400"/>
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Detalles del Pago */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-sky-400 mb-2">Detalles del Pago</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Monto a Pagar (MXN)</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                            </div>
                            <div>
                                <label htmlFor="method" className="block text-sm font-medium text-slate-300 mb-1">Método de Pago</label>
                                <select id="method" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Conceptos a Pagar */}
                    <fieldset className="space-y-2">
                        <legend className="text-lg font-semibold text-sky-400 mb-2">Conceptos a Pagar</legend>
                        <div className="bg-slate-900/50 rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                            {pendingPayments.length > 0 ? pendingPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                                    <label htmlFor={`payment-${p.id}`} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`payment-${p.id}`}
                                            checked={selectedConcepts.includes(p.id)}
                                            onChange={() => handleConceptToggle(p.id)}
                                            className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                                        />
                                        <div>
                                            <span className="text-slate-200 font-medium">{p.description}</span>
                                            <span className="text-xs text-slate-400 block">Vence: {p.dueDate}</span>
                                        </div>
                                    </label>
                                    <span className="font-mono text-sm text-yellow-400">{formatCurrency(p.amountDue - p.paidAmount)}</span>
                                </div>
                            )) : <p className="text-slate-400 text-sm text-center">Este alumno no tiene pagos pendientes.</p>}
                        </div>
                    </fieldset>
                    
                     {/* Pago no contemplado */}
                    <fieldset className="space-y-4">
                        <div className="flex items-center gap-2">
                             <input type="checkbox" id="isCustom" name="isCustom" checked={isCustom} onChange={e => setIsCustom(e.target.checked)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500" />
                             <label htmlFor="isCustom" className="text-sm font-medium text-slate-300">Registrar Pago no Contemplado</label>
                        </div>
                        {isCustom && (
                             <div className="p-4 bg-slate-900/50 rounded-md space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                       <label htmlFor="customDesc" className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                                       <input type="text" id="customDesc" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder="Ej. Constancia de Estudios"/>
                                   </div>
                                    <div>
                                       <label htmlFor="customAmount" className="block text-sm font-medium text-slate-300 mb-1">Costo del Concepto</label>
                                       <input type="number" id="customAmount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                   </div>
                                </div>
                                 <div>
                                       <label htmlFor="customType" className="block text-sm font-medium text-slate-300 mb-1">Tipo de Pago</label>
                                       <select id="customType" value={customType} onChange={e => setCustomType(e.target.value as PaymentType)} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                            {Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}
                                       </select>
                                 </div>
                             </div>
                        )}
                    </fieldset>
                </form>
                <footer className="p-4 bg-slate-800 border-t border-slate-700 mt-auto">
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md">Cancelar</button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading || !amount} className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Registrando...' : 'Registrar Pago'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PaymentForm;