import { GoogleGenAI, Type } from "@google/genai";
import { Student, Certificate } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EnrollmentBusinessLogic = `
Eres un asistente de administración escolar experto para una escuela de certificaciones. Tu tarea es analizar las solicitudes de los usuarios y convertirlas en datos JSON estructurados basados en el esquema proporcionado. Debes generar un calendario de pagos completo y un historial académico inicial para los nuevos estudiantes basado en las reglas de negocio de la escuela.

**REGLAS DE NEGOCIO DE LA ESCUELA**
**Fecha de Hoy:** ${new Date().toISOString().split('T')[0]}

**Planes de Estudio y Costos:**
1.  **Enfermería por Nivelación:** Duración: 12 Meses. Pagos: 12 mensualidades, 3 reinscripciones cuatrimestrales (inicio, mes 5, mes 9). Costos: 2200 MXN/mes, 2200 MXN/reinscripción. Materias: Anatomía, Fisiología, Farmacología, Enfermería Comunitaria.
2.  **Enfermería General:** Duración: 24 Meses de clases + 12 de Servicio. Pagos: 36 mensualidades, 6 reinscripciones cuatrimestrales (inicio, mes 5, 9, 13, 17, 21). Costos: 1900 MXN/mes, 1900 MXN/reinscripción. Materias: Fundamentos de Enfermería, Salud Pública, Pediatría, Geriatría.
3.  **Podología, Enfermería Industrial, Enfermería Quirúrgica:** Duración: 27 Semanas. Pagos: 1 inscripción, 27 pagos semanales. Costos: 900 MXN inscripción, 250 MXN/semana. Materias: Biomecánica, Patología del Pie, Asepsia y Antisepsia.
4.  **Enfermería Auxiliar, TAMP:** Duración: 54 Semanas. Pagos: 2 inscripciones (inicio, semana 27), 54 pagos semanales. Costos: 900 MXN inscripción, 250 MXN/semana. Materias: Primeros Auxilios, Soporte Vital Básico, Atención de Traumas.

**Reglas de Pago:**
*   Mensualidades vencen el mismo día del mes de inicio.
*   Pagos Semanales vencen el mismo día de la semana de inicio.
*   **Beca:** Para trabajadores de salud en 'Enfermería por Nivelación' y 'General'. Descuento de 300 MXN en CADA pago.
*   **Fechas de Vencimiento:** Calcula todas en formato AAAA-MM-DD.

**Tarea de Inscripción:**
1.  Analiza el texto del usuario y crea un objeto JSON de estudiante completo.
2.  **Genera el array 'payments' completo** según las reglas del plan de estudios.
3.  **Genera un historial académico inicial ('academicHistory')**. Crea un registro para el "Primer Periodo" y asígnale calificaciones simuladas realistas (entre 7.5 y 10.0) para 3-4 materias relevantes del plan de estudios.
`;

const CertificateSchema = { type: Type.OBJECT, properties: { number: { type: Type.STRING }, gpa: { type: Type.NUMBER }, institution: { type: Type.STRING } }, required: ["number", "gpa", "institution"] };
const PaymentSchema = { type: Type.OBJECT, properties: { id: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING }, dueDate: { type: Type.STRING }, amountDue: { type: Type.NUMBER }, paidAmount: { type: Type.NUMBER }, status: { type: Type.STRING }, lateFeeApplied: { type: Type.NUMBER } }, required: ["id", "description", "type", "dueDate", "amountDue", "paidAmount", "status", "lateFeeApplied"] };
const AcademicRecordSchema = { type: Type.OBJECT, properties: { period: { type: Type.STRING }, grades: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, grade: { type: Type.NUMBER } } } }, gpa: { type: Type.NUMBER } } };

const enrollmentSchema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ["ADD_STUDENT", "NO_OP"] },
    studentData: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING }, curp: { type: Type.STRING }, enrollmentDate: { type: Type.STRING }, studyPlan: { type: Type.STRING },
            group: { type: Type.OBJECT, properties: { plan: { type: Type.STRING }, shift: { type: Type.STRING }, schedule: { type: Type.STRING }, day: { type: Type.STRING } } },
            hasScholarship: { type: Type.BOOLEAN },
            highSchoolCertificate: CertificateSchema,
            workExperience: { type: Type.OBJECT, properties: { institution: { type: Type.STRING }, years: { type: Type.NUMBER } } },
            address: { type: Type.OBJECT, properties: { street: { type: Type.STRING }, city: { type: Type.STRING }, state: { type: Type.STRING }, zipCode: { type: Type.STRING } } },
            payments: { type: Type.ARRAY, items: PaymentSchema },
            academicHistory: { type: Type.ARRAY, items: AcademicRecordSchema }
        }
    },
  },
  required: ["action"]
};

export const processTextWithGemini = async (text: string): Promise<any> => {
  try {
    const fullPrompt = `${EnrollmentBusinessLogic}\n**Texto del Usuario:**\n"${text}"`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: enrollmentSchema,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });
    const jsonText = response.text.trim();
    if (!jsonText) throw new Error("Respuesta vacía de la API de Gemini");
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error al procesar inscripción con Gemini:", error);
    throw new Error("No se pudo interpretar la solicitud de inscripción. Por favor, reformúlala.");
  }
};


const QueryBusinessLogic = `
Eres un asistente de director de escuela experto. Tu tarea es analizar una pregunta en lenguaje natural y consultar una base de datos de estudiantes en formato JSON para encontrar la respuesta.

**Formato de la Base de Datos de Estudiantes:**
El usuario te proporcionará un array de objetos 'Student' como contexto. Cada estudiante tiene la siguiente estructura:
- id: string
- name: string
- studyPlan: string
- payments: Array de objetos con { description, amountDue, paidAmount, status, dueDate }
- academicHistory: Array de objetos con { period, gpa, grades: [{ subject, grade }] }
- hasScholarship: boolean

**Tarea:**
1.  Analiza la pregunta del usuario.
2.  Examina CUIDADOSAMENTE el array de estudiantes proporcionado como contexto.
3.  Formula una respuesta precisa basada únicamente en los datos.
4.  Devuelve la respuesta en el formato JSON especificado en el esquema.

**Tipos de Respuesta:**
-   Si la pregunta pide una lista de nombres (ej. "¿Quiénes deben más de 5000?"), usa 'student_list'.
-   Si la pregunta pide un cálculo (ej. "¿Cuál es el promedio general?"), usa 'calculated_value'.
-   Si la pregunta es general o no encaja en las anteriores, usa 'text_response'.
`;

const querySchema = {
    type: Type.OBJECT,
    properties: {
        responseType: { type: Type.STRING, enum: ['student_list', 'calculated_value', 'text_response'] },
        studentList: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, detail: { type: Type.STRING } } } },
        calculatedValue: { type: Type.STRING },
        textResponse: { type: Type.STRING }
    },
    required: ['responseType']
};


export const queryStudentDataWithGemini = async (query: string, students: Student[]): Promise<any> => {
    try {
        const context = `**Contexto (Base de Datos de Estudiantes):**\n${JSON.stringify(students, null, 2)}`;
        const fullPrompt = `${QueryBusinessLogic}\n${context}\n\n**Pregunta del Usuario:**\n"${query}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: querySchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonText = response.text.trim();
        if (!jsonText) throw new Error("Respuesta vacía de la API de Gemini para la consulta.");
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error al procesar consulta con Gemini:", error);
        throw new Error("No se pudo procesar la consulta. Intenta de nuevo.");
    }
};