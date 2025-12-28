import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Carga las variables de entorno desde un archivo .env
# Esto es crucial para mantener las credenciales de la base de datos seguras.
load_dotenv()

# Obtiene la URL de conexión a la base de datos desde las variables de entorno.
# Si no se encuentra, se asume una base de datos SQLite local para desarrollo.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./school.db")

# Crea el "motor" de SQLAlchemy. Es el punto de entrada principal a la base de datos.
# El argumento 'connect_args' es específico para SQLite para permitir el uso en múltiples hilos.
engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_args)

# Crea una clase SessionLocal. Las instancias de esta clase representarán
# una sesión individual con la base de datos. Esto se usará en cada petición a la API.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crea una clase Base. Todos los modelos de la base de datos (como Student, Payment, etc.)
# heredarán de esta clase para ser reconocidos por SQLAlchemy.
Base = declarative_base()


# Función de dependencia para FastAPI
def get_db():
    """
    Esta función se encarga de abrir una sesión de base de datos
    cuando llega una petición a un endpoint y cerrarla cuando la petición termina.
    Esto asegura que los recursos de la base de datos se manejen correctamente.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
