import uuid
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Float, Date, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .database import Base

# --- Tabla de Asociación para la relación Muchos a Muchos ---
# Conecta las Transacciones con los Pagos que cubren.
# Una transacción puede cubrir múltiples pagos, y un pago parcial puede ser
# cubierto por múltiples transacciones (aunque en nuestra lógica actual es más simple).
transaction_payments_association = Table(
    'transaction_payments', Base.metadata,
    Column('transaction_id', UUID(as_uuid=True), ForeignKey('transactions.id'), primary_key=True),
    Column('payment_id', UUID(as_uuid=True), ForeignKey('payments.id'), primary_key=True)
)


# --- Modelos Principales (Tablas) ---

class Student(Base):
    """Modelo principal que representa a un estudiante."""
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    curp = Column(String, unique=True, index=True)
    enrollmentDate = Column(Date)
    studyPlan = Column(String)
    hasScholarship = Column(Boolean, default=False)
    
    # --- Relaciones Uno a Uno ---
    group = relationship("StudentGroup", back_populates="student", uselist=False, cascade="all, delete-orphan")
    secondary_certificate = relationship("Certificate", foreign_keys='[Certificate.student_id_secondary]', back_populates="student_secondary", uselist=False, cascade="all, delete-orphan")
    high_school_certificate = relationship("Certificate", foreign_keys='[Certificate.student_id_highschool]', back_populates="student_highschool", uselist=False, cascade="all, delete-orphan")
    work_experience = relationship("WorkExperience", back_populates="student", uselist=False, cascade="all, delete-orphan")
    contact = relationship("Contact", back_populates="student", uselist=False, cascade="all, delete-orphan")
    address = relationship("Address", back_populates="student", uselist=False, cascade="all, delete-orphan")

    # --- Relaciones Uno a Muchos ---
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    payment_history = relationship("Transaction", back_populates="student", cascade="all, delete-orphan")
    academic_history = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    documentation_files = relationship("DocumentationFile", back_populates="student", cascade="all, delete-orphan")
    
    # --- Campos de Estatus de Graduación ---
    graduationCompleted = Column(Boolean, default=False)
    digitalCertificateDelivered = Column(Boolean, default=False)
    status = Column(String, default='Activo') # Activo, Egresado
    graduationYear = Column(Integer, nullable=True)
    certificateReceived = Column(Boolean, default=False)
    certificateFileUrl = Column(String, nullable=True)

class StudentGroup(Base):
    """Detalles del grupo al que pertenece un estudiante."""
    __tablename__ = "student_groups"
    id = Column(Integer, primary_key=True, index=True)
    plan = Column(String)
    shift = Column(String)
    schedule = Column(String)
    day = Column(String, nullable=True)
    student_id = Column(String, ForeignKey("students.id"), unique=True)
    student = relationship("Student", back_populates="group")

class Certificate(Base):
    """Información de un certificado (secundaria o bachillerato)."""
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String)
    gpa = Column(Float)
    institution = Column(String)
    # Se usan dos FKs para diferenciar el tipo de certificado
    student_id_secondary = Column(String, ForeignKey('students.id'), unique=True, nullable=True)
    student_id_highschool = Column(String, ForeignKey('students.id'), unique=True, nullable=True)
    
    student_secondary = relationship("Student", foreign_keys=[student_id_secondary], back_populates="secondary_certificate")
    student_highschool = relationship("Student", foreign_keys=[student_id_highschool], back_populates="high_school_certificate")


class WorkExperience(Base):
    """Experiencia laboral del estudiante."""
    __tablename__ = "work_experiences"
    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String)
    years = Column(Integer)
    student_id = Column(String, ForeignKey("students.id"), unique=True)
    student = relationship("Student", back_populates="work_experience")
    
class Contact(Base):
    """Datos de contacto del estudiante."""
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String)
    email = Column(String)
    student_id = Column(String, ForeignKey("students.id"), unique=True)
    student = relationship("Student", back_populates="contact")

class Address(Base):
    """Dirección del estudiante."""
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True, index=True)
    street = Column(String)
    city = Column(String)
    state = Column(String)
    zipCode = Column(String)
    student_id = Column(String, ForeignKey("students.id"), unique=True)
    student = relationship("Student", back_populates="address")

class Payment(Base):
    """Representa un concepto de pago individual en el calendario de pagos."""
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String)
    type = Column(String) # Enum en frontend
    dueDate = Column(Date)
    amountDue = Column(Float)
    paidAmount = Column(Float, default=0.0)
    status = Column(String) # Enum en frontend
    lateFeeApplied = Column(Float, default=0.0)
    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="payments")

class Transaction(Base):
    """Representa un pago realizado por un estudiante en una fecha específica."""
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(Date)
    amount = Column(Float)
    method = Column(String) # Enum en frontend
    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="payment_history")
    
    # Relación Muchos a Muchos con la tabla de asociación
    covered_payments = relationship("Payment", secondary=transaction_payments_association)

class AcademicRecord(Base):
    """Registro académico para un período específico (cuatrimestre, semestre)."""
    __tablename__ = "academic_records"
    id = Column(Integer, primary_key=True, index=True)
    period = Column(String)
    gpa = Column(Float)
    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="academic_history")
    grades = relationship("SubjectGrade", back_populates="academic_record", cascade="all, delete-orphan")

class SubjectGrade(Base):
    """Calificación de una materia específica dentro de un registro académico."""
    __tablename__ = "subject_grades"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    grade = Column(Float)
    academic_record_id = Column(Integer, ForeignKey("academic_records.id"))
    academic_record = relationship("AcademicRecord", back_populates="grades")

class DocumentationFile(Base):
    """Representa un archivo documental subido para un estudiante."""
    __tablename__ = "documentation_files"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    size = Column(Float)
    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="documentation_files")
