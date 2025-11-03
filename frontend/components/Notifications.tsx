import React, { useState } from 'react';
import { BellIcon } from './icons';

export interface OverdueNotification {
    studentId: string;
    studentName: string;
    overdueCount: number;
}

interface NotificationsProps {
    notifications: OverdueNotification[];
    onSendReminder: (studentName: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onSendReminder }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (notifications.length === 0) {
        return null; // Don't show the bell if there are no notifications
    }

    const handleSend = (e: React.MouseEvent, studentName: string) => {
        e.stopPropagation(); // prevent dropdown from closing
        onSendReminder(studentName);
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                aria-label="Notificaciones"
            >
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                        {notifications.length}
                    </span>
                </span>
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="p-3 border-b border-slate-700">
                        <h3 className="font-semibold text-white">Pagos Vencidos</h3>
                    </div>
                    <ul className="py-2 max-h-80 overflow-y-auto">
                        {notifications.map(notif => (
                            <li key={notif.studentId} className="px-3 py-2 hover:bg-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-200">{notif.studentName}</p>
                                        <p className="text-xs text-slate-400">{notif.overdueCount} pago(s) vencido(s)</p>
                                    </div>
                                    <button 
                                        onClick={(e) => handleSend(e, notif.studentName)}
                                        className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 px-2 py-1 rounded-md transition-colors"
                                    >
                                        Enviar Recordatorio
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Notifications;