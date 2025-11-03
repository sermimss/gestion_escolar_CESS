import uuid
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Schemas Base ---
# Estos definen los campos comunes que se usan tanto para crear como para leer datos.

class CertificateBase(BaseModel):
    number: str
    gpa: float
    institution: str

class WorkExperienceBase(BaseModel):
    institution: str
    years: int

class StudentGroupBase(BaseModel):
    plan: str
    shift: str
    schedule: str
    day: Optional[str] = None

class ContactBase(BaseModel):
    phone: str
    email: str

class AddressBase(BaseModel):
    street: str
    city: str
    state: str
    zipCode: str

class SubjectGradeBase(BaseModel):
    subject: str
    grade: float

class AcademicRecordBase(BaseModel):
    period: str
    gpa: float

class DocumentationFileBase(BaseModel):
    name: str
    url: str
    size: float

class PaymentBase(BaseModel):
    description: str
    type: str
    dueDate: date
    amountDue: float
    paidAmount: float = 0.0
    status: str
    lateFeeApplied: float = 0.0

class CoveredPaymentBase(BaseModel):
    paymentId: str
    description: str
    amountPaid: float

class TransactionBase(BaseModel):
    date: date
    amount: float
    method: str

# --- Schemas para Creación (usados en endpoints POST/PUT) ---
# Heredan de los 'Base' y pueden añadir o quitar campos. No incluyen 'id' porque la BD lo genera.

class CertificateCreate(CertificateBase):
    pass

class WorkExperienceCreate(WorkExperienceBase):
    pass

class StudentGroupCreate(StudentGroupBase):
    pass

class ContactCreate(ContactBase):
    pass

class AddressCreate(AddressBase):
    pass

class SubjectGradeCreate(SubjectGradeBase):
    pass

class AcademicRecordCreate(AcademicRecordBase):
    grades: List[SubjectGradeCreate] = []

class DocumentationFileCreate(DocumentationFileBase):
    pass

class PaymentCreate(PaymentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class TransactionCreate(TransactionBase):
    selectedConcepts: List[str] = [] # IDs de los Payments a cubrir
    isCustom: bool = False
    customConceptDesc: Optional[str] = None
    customConceptAmount: Optional[float] = None
    customConceptType: Optional[str] = None

# --- Schemas para Lectura (usados como `response_model` en endpoints GET) ---
# Estos son los que definen la estructura del JSON que se envía al frontend.
# Incluyen 'id' y relaciones anidadas completas.

class Config:
    """
    Configuración de Pydantic para que funcione con el ORM de SQLAlchemy.
    Le permite leer los datos directamente desde los objetos del modelo (ej. student.name).
    """
    from_attributes = True

class Certificate(CertificateBase):
    id: int
    model_config = Config

class WorkExperience(WorkExperienceBase):
    id: int
    model_config = Config
    
class StudentGroup(StudentGroupBase):
    id: int
    model_config = Config

class Contact(ContactBase):
    id: int
    model_config = Config
    
class Address(AddressBase):
    id: int
    model_config = Config

class SubjectGrade(SubjectGradeBase):
    id: int
    model_config = Config
    
class AcademicRecord(AcademicRecordBase):
    id: int
    grades: List[SubjectGrade] = []
    model_config = Config
    
class DocumentationFile(DocumentationFileBase):
    id: int
    model_config = Config

class Payment(PaymentBase):
    id: uuid.UUID
    model_config = Config

class Transaction(TransactionBase):
    id: uuid.UUID
    # Para la respuesta, mostramos los objetos completos de los pagos que cubrió
    covered_payments: List[Payment] = []
    model_config = Config
    
# --- El Schema Principal del Estudiante ---

class StudentBase(BaseModel):
    """Campos principales y editables de un estudiante."""
    name: str
    curp: str
    enrollmentDate: date
    studyPlan: str
    hasScholarship: bool = False
    status: str = 'Activo'
    graduationCompleted: bool = False
    digitalCertificateDelivered: bool = False
    graduationYear: Optional[int] = None
    certificateReceived: bool = False
    certificateFileUrl: Optional[str] = None
    
    # Relaciones anidadas opcionales
    group: Optional[StudentGroupCreate] = None
    secondary_certificate: Optional[CertificateCreate] = None
    high_school_certificate: Optional[CertificateCreate] = None
    work_experience: Optional[WorkExperienceCreate] = None
    contact: Optional[ContactCreate] = None
    address: Optional[AddressCreate] = None

class StudentCreate(StudentBase):
    """Schema para crear un nuevo estudiante con su calendario de pagos e historial inicial."""
    payments: List[PaymentCreate] = []
    academic_history: List[AcademicRecordCreate] = []

class StudentUpdate(BaseModel):
    """
    Schema para actualizar. Todos los campos son opcionales, ya que el frontend
    puede enviar solo los que cambiaron.
    """
    name: Optional[str] = None
    curp: Optional[str] = None
    enrollmentDate: Optional[date] = None
    studyPlan: Optional[str] = None
    hasScholarship: Optional[bool] = None
    status: Optional[str] = None
    graduationCompleted: Optional[bool] = None
    digitalCertificateDelivered: Optional[bool] = None
    graduationYear: Optional[int] = None
    certificateReceived: Optional[bool] = None
    certificateFileUrl: Optional[str] = None
    payments: Optional[List[PaymentCreate]] = None


class Student(StudentBase):
    """
    El schema completo para la respuesta de la API.
    Define la estructura JSON anidada que recibirá el frontend.
    """
    id: str
    group: Optional[StudentGroup] = None
    secondary_certificate: Optional[Certificate] = None
    high_school_certificate: Optional[Certificate] = None
    work_experience: Optional[WorkExperience] = None
    contact: Optional[Contact] = None
    address: Optional[Address] = None
    payments: List[Payment] = []
    payment_history: List[Transaction] = []
    academic_history: List[AcademicRecord] = []
    documentation_files: List[DocumentationFile] = []

    model_config = Config
