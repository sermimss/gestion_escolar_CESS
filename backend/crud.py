from sqlalchemy.orm import Session, joinedload
import uuid

import models, schemas

def get_student(db: Session, student_id: str):
    """
    Obtiene un único estudiante por su ID, cargando de forma anticipada
    todas sus relaciones para optimizar las consultas.
    """
    return db.query(models.Student).options(
        joinedload(models.Student.group),
        joinedload(models.Student.secondary_certificate),
        joinedload(models.Student.high_school_certificate),
        joinedload(models.Student.work_experience),
        joinedload(models.Student.contact),
        joinedload(models.Student.address),
        joinedload(models.Student.payments),
        joinedload(models.Student.payment_history).joinedload(models.Transaction.covered_payments),
        joinedload(models.Student.academic_history).joinedload(models.AcademicRecord.grades),
        joinedload(models.Student.documentation_files)
    ).filter(models.Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    """
    Obtiene una lista de todos los estudiantes, ordenados por nombre.
    """
    return db.query(models.Student).order_by(models.Student.name).offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    """
    Crea un nuevo registro de estudiante en la base de datos a partir de
    un esquema Pydantic. Construye el "grafo" de objetos, incluyendo
    relaciones anidadas como pagos, historial académico, etc.
    """
    # Extraer datos de relaciones anidadas
    payments_data = student.payments or []
    academic_history_data = student.academic_history or []
    
    # Extraer datos del objeto principal
    student_core_data = student.model_dump(exclude={
        'payments', 'academic_history', 'group', 'secondary_certificate', 
        'high_school_certificate', 'work_experience', 'contact', 'address'
    })

    # Crear la instancia principal del estudiante
    db_student = models.Student(id=str(uuid.uuid4()), **student_core_data)
    
    # Crear y asociar objetos anidados (relaciones uno a uno)
    if student.group:
        db_student.group = models.StudentGroup(**student.group.model_dump())
    if student.secondary_certificate:
        db_student.secondary_certificate = models.Certificate(**student.secondary_certificate.model_dump())
    if student.high_school_certificate:
        db_student.high_school_certificate = models.Certificate(**student.high_school_certificate.model_dump())
    if student.work_experience:
        db_student.work_experience = models.WorkExperience(**student.work_experience.model_dump())
    if student.contact:
        db_student.contact = models.Contact(**student.contact.model_dump())
    if student.address:
        db_student.address = models.Address(**student.address.model_dump())

    db.add(db_student)
    # db.flush() se usa para obtener el ID del estudiante antes del commit final,
    # lo que permite vincular las colecciones (pagos, historial, etc.)
    db.flush()

    # Crear y asociar colecciones (relaciones uno a muchos)
    for payment_data in payments_data:
        payment_dict = payment_data.model_dump()
        db_payment = models.Payment(id=str(uuid.uuid4()), student_id=db_student.id, **payment_dict)
        db.add(db_payment)

    for record_data in academic_history_data:
        grades_data = record_data.grades
        record_dict = record_data.model_dump(exclude={'grades'})
        db_record = models.AcademicRecord(student_id=db_student.id, **record_dict)
        db.add(db_record)
        db.flush() # Flush para obtener el ID del registro académico
        for grade_data in grades_data:
            db_grade = models.SubjectGrade(academic_record_id=db_record.id, **grade_data.model_dump())
            db.add(db_grade)
    
    db.commit()
    db.refresh(db_student)
    return db_student
