# main.py
# ... otros imports

import json

# ... aquí va el resto de tu código de la API ...
import uuid
from typing import List, Optional

# Importaciones locales de los otros módulos del backend
import crud
import models
import schemas
from database import engine, get_db
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Crea las tablas en la base de datos si no existen
# Esto se ejecuta una sola vez al iniciar la aplicación
models.Base.metadata.create_all(bind=engine)

# Inicializa la aplicación FastAPI
app = FastAPI()

# Lista de orígenes permitidos. Añade aquí la URL que te dará Vercel.
# Por ahora, podemos permitir todos para pruebas con "*"
origins = [
    "http://localhost:3000",  # Para desarrollo local
    # Permite todos los orígenes (puedes restringirlo luego a tu URL de Vercel)
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = FastAPI(
    title="API del Sistema de Gestión Escolar",
    description="Backend para gestionar la base de datos de estudiantes.",
    version="1.0.0",
)

# --- Configuración de CORS ---
# Permite que el frontend (que se ejecuta en un origen diferente)
# se comunique con esta API. Es una medida de seguridad crucial.
origins = [
    # Aquí puedes agregar las URLs de tu frontend de producción y desarrollo
    "http://localhost:8000",
    "https://*.google.com",
    "https://*.googleusercontent.com",
    # Si tienes una URL de vista previa en Render, agrégala también
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Para simplificar, se permite cualquier origen
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, PUT, etc.)
    allow_headers=["*"],  # Permite todas las cabeceras HTTP
)

# --- Definición de Endpoints de la API ---


@app.get("/")
def read_root():
    """Endpoint de prueba para verificar que la API está funcionando."""
    return {"message": "Bienvenido a la API del Gestor Escolar"}


@app.post("/api/students", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """
    Endpoint para crear un nuevo estudiante.
    Recibe los datos del estudiante en el cuerpo de la petición.
    """
    # Llama a la función del CRUD para crear el estudiante en la base de datos
    return crud.create_student(db=db, student=student)


@app.get("/api/students", response_model=List[schemas.Student])
def read_students(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una lista de todos los estudiantes.
    Soporta paginación con 'skip' y 'limit'.
    """
    students = crud.get_students(db, skip=skip, limit=limit)
    return students


@app.get("/api/students/{student_id}", response_model=schemas.Student)
def read_student(student_id: str, db: Session = Depends(get_db)):
    """
    Endpoint para obtener los detalles de un estudiante específico por su ID.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if db_student is None:
        # Si el estudiante no se encuentra, devuelve un error 404
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


@app.put("/api/students/{student_id}", response_model=schemas.Student)
def update_student(
    student_id: str,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db),
):
    """
    Endpoint para actualizar la información de un estudiante.
    Recibe los campos a actualizar en el cuerpo de la petición.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Actualiza los campos del objeto de la base de datos con los datos recibidos
    update_data = student_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "payments":
            # Si se actualizan los pagos, borramos los existentes y creamos los nuevos
            # Esta es una estrategia simple; una más compleja podría actualizar pago por pago.
            for payment in db_student.payments:
                db.delete(payment)
            for payment_data in value:
                new_payment = models.Payment(student_id=student_id, **payment_data)
                db.add(new_payment)
        else:
            setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student


@app.post("/api/students/{student_id}/transactions", response_model=schemas.Student)
def register_transaction(
    student_id: str,
    transaction_data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    """
    Endpoint para registrar un nuevo pago (transacción) para un estudiante.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Llama a la función del CRUD para manejar la lógica de la transacción
    updated_student = crud.create_student_transaction(db, db_student, transaction_data)

    db.commit()
    db.refresh(updated_student)
    return updated_student


@app.post("/api/students/{student_id}/documents/upload", response_model=schemas.Student)
async def upload_documents(
    student_id: str,
    files: List[UploadFile] = File(...),
    docType: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Endpoint para subir documentos. Maneja tanto la subida de archivos genéricos
    como la de certificados con metadatos.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Si se sube un certificado de secundaria con metadatos, los procesa
    if docType == "Certificado de Secundaria" and metadata:
        try:
            meta_data = json.loads(metadata)
            cert_schema = schemas.CertificateCreate(**meta_data)
            crud.add_secondary_certificate(db, db_student, cert_schema)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid metadata format: {e}")

    # Procesa cada archivo subido
    for file in files:
        # En una aplicación real, aquí guardarías el archivo en un almacenamiento en la nube (S3, etc.)
        # y obtendrías una URL. Para este proyecto, simulamos esto.
        file_location = (
            f"https://fake-storage.com/{db_student.curp}/{uuid.uuid4()}_{file.filename}"
        )

        file_doc = schemas.DocumentationFileCreate(
            name=file.filename, url=file_location, size=file.size
        )
        crud.add_documentation_file(db, db_student, file_doc)

    db.commit()
    db.refresh(db_student)
    return db_student
