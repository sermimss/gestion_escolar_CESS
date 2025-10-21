import { GoogleGenAI, Type } from "@google/genai";
import { PaymentStatus, PaymentMethod, PaymentType, Student, Certificate, WorkExperience, StudentGroup } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BUSINESS_LOGIC_PROMPT = `
Eres un asistente de administración escolar experto para una escuela de certificaciones. Tu tarea es analizar las solicitudes de los usuarios y convertirlas en datos JSON estructurados basados en el esquema proporcionado. Debes generar un calendario de pagos completo para los nuevos estudiantes basado en las reglas de negocio de la escuela.

**REGLAS DE NEGOCIO DE LA ESCUELA**

**Fecha de Hoy:** ${new Date().toISOString().split('T')[0]}

**Planes de Estudio y Costos:**
1.  **Enfermería por Nivelación:**
    *   Duración: 12 Meses.
    *   Pagos: 12 mensualidades, 3 reinscripciones cuatrimestrales (al inicio, mes 5, mes 9).
    *   Costos: 2200 MXN por mes, 2200 MXN por reinscripción.
2.  **Enfermería General:**
    *   Duración: 24 Meses de clases + 12 Meses de Servicio Social.
    *   Pagos: 36 mensualidades en total, 6 reinscripciones cuatrimestrales (al inicio, mes 5, 9, 13, 17, 21).
    *   Costos: 1900 MXN por mes, 1900 MXN por reinscripción.
3.  **Podología, Enfermería Industrial, Enfermería Quirúrgica:**
    *   Duración: 27 Semanas.
    *   Pagos: 1 inscripción inicial, 27 pagos semanales.
    *   Costos: 900 MXN de inscripción, 250 MXN por semana.
4.  **Enfermería Auxiliar, Técnico en Atención Médica Prehospitalaria (TAMP):**
    *   Duración: 54 Semanas.
    *   Pagos: 2 inscripciones (al inicio, semana 27), 54 pagos semanales.
    *   Costos: 900 MXN por inscripción, 250 MXN por semana.

**Reglas de Pago:**
*   **Mensualidades:** Vencen el mismo día del mes que la fecha de inicio.
*   **Pagos Semanales:** Vencen el mismo día de la semana que la fecha de inicio.
*   **Beca:** Para trabajadores de la salud en 'Enfermería por Nivelación' y 'Enfermería General'. Otorga un descuento de 300 MXN en CADA pago (mensualidades y reinscripciones). Aplica este descuento al generar el calendario.
*   **Fechas de Vencimiento:** Calcula todas las fechas de vencimiento basándote en la fecha de inicio del estudiante en formato AAAA-MM-DD.

**Tarea:**
Analiza el texto del usuario. Si es una inscripción, crea un objeto JSON de estudiante completo. **DEBES generar el array 'payments' completo de acuerdo con las reglas para el plan de estudios especificado.** Calcula todas las fechas de vencimiento y aplica descuentos si corresponde.
**Texto del Usuario:**
`;

const CertificateSchema = {
    type: Type.OBJECT,
    properties: {
        number: { type: Type.STRING },
        gpa: { type: Type.NUMBER },
        institution: { type: Type.STRING },
    },
    required: ["number", "gpa", "institution"]
};

const PaymentSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        description: { type: Type.STRING },
        type: { type: Type.STRING, enum: Object.values(PaymentType) },
        dueDate: { type: Type.STRING },
        amountDue: { type: Type.NUMBER },
        paidAmount: { type: Type.NUMBER },
        status: { type: Type.STRING, enum: Object.values(PaymentStatus) },
        lateFeeApplied: { type: Type.NUMBER },
    },
    required: ["id", "description", "type", "dueDate", "amountDue", "paidAmount", "status", "lateFeeApplied"]
};


const schema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      enum: ["ADD_STUDENT", "NO_OP"],
      description: "La acción a realizar. USA NO_OP si el texto no es una solicitud procesable."
    },
    studentData: {
        type: Type.OBJECT,
        description: "Datos completos del estudiante, solo para la acción ADD_STUDENT.",
        properties: {
            name: { type: Type.STRING },
            curp: { type: Type.STRING },
            enrollmentDate: { type: Type.STRING },
            studyPlan: { type: Type.STRING },
            group: {
                type: Type.OBJECT,
                properties: {
                    plan: { type: Type.STRING },
                    shift: { type: Type.STRING, enum: ['Matutino', 'Vespertino'] },
                    schedule: { type: Type.STRING, enum: ['Entre Semana', 'Fin de Semana'] },
                    day: { type: Type.STRING, enum: ['Sábado', 'Domingo'] },
                },
            },
            hasScholarship: { type: Type.BOOLEAN },
            secondaryCertificate: CertificateSchema,
            highSchoolCertificate: CertificateSchema,
            workExperience: {
                type: Type.OBJECT,
                properties: {
                    institution: { type: Type.STRING },
                    years: { type: Type.NUMBER }
                }
            },
            payments: {
                type: Type.ARRAY,
                items: PaymentSchema
            }
        }
    },
  },
  required: ["action"]
};

export const processTextWithGemini = async (text: string): Promise<any> => {
  try {
    const fullPrompt = `${BUSINESS_LOGIC_PROMPT}"${text}"`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Respuesta vacía de la API de Gemini");
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error al procesar con Gemini:", error);
    throw new Error("No se pudo interpretar la solicitud. Por favor, reformúlala.");
  }
};