import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { UserIcon, BookOpenIcon } from './icons';

interface StudentListProps {
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, selectedStudentId, onSelectStudent }) => {
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  const studentsByPlan = useMemo(() => {
    return students.reduce((acc, student) => {
      const plan = student.studyPlan;
      if (!acc[plan]) {
        acc[plan] = [];
      }
      acc[plan].push(student);
      return acc;
    }, {} as Record<string, Student[]>);
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (activeFilter === 'todos') {
      return students;
    }
    return studentsByPlan[activeFilter] || [];
  }, [students, activeFilter, studentsByPlan]);

  const FilterButton: React.FC<{ filterKey: string; label: string; count: number }> = ({ filterKey, label, count }) => (
    <button
      onClick={() => setActiveFilter(filterKey)}
      className={`w-full text-left p-3 flex items-center justify-between transition-colors duration-200 rounded-md mb-1 ${
        activeFilter === filterKey ? 'bg-sky-500/20 text-sky-300' : 'hover:bg-slate-800 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <BookOpenIcon className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded-full">{count}</span>
    </button>
  );

  if (students.length === 0) {
    return <div className="p-4 text-center text-slate-500">Aún no hay estudiantes.</div>;
  }

  return (
    <div>
      <div className="p-2">
        <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Carreras</h3>
        <FilterButton filterKey="todos" label="Todos los Alumnos" count={students.length} />
        {Object.keys(studentsByPlan).sort().map(plan => (
          <FilterButton key={plan} filterKey={plan} label={plan} count={studentsByPlan[plan].length} />
        ))}
      </div>
      <div className="border-t border-slate-700 mt-2">
          <h3 className="px-4 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
             Alumnos en: {activeFilter === 'todos' ? 'Todas las Carreras' : activeFilter}
          </h3>
          {filteredStudents.length > 0 ? (
            <ul>
              {filteredStudents.map(student => (
                <li key={student.id}>
                  <button
                    onClick={() => onSelectStudent(student.id)}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors duration-200 ${
                      selectedStudentId === student.id ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${ selectedStudentId === student.id ? 'bg-sky-500/30' : 'bg-slate-700'}`}>
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {student.hasScholarship && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" title="Becado"></div>}
                        <span className="font-semibold">{student.name}</span>
                      </div>
                      <p className="text-sm text-slate-400">{student.studyPlan}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-center text-slate-500">No hay alumnos en esta carrera.</p>
          )}
      </div>
    </div>
  );
};

export default StudentList;
