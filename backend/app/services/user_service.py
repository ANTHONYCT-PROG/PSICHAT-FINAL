from app.db import models
from typing import Optional

def determinar_rol_por_email(email: str) -> models.RolUsuario:
    """
    Determina el rol del usuario basándose en el dominio del email.
    Emails con dominios educativos o específicos serán tutores.
    """
    # Lista de dominios que indican tutores/docentes
    dominios_tutor = [
        "edu.co", "edu.mx", "edu.ar", "edu.cl", "edu.pe", "edu.ec", "edu.ve",
        "edu.bo", "edu.py", "edu.uy", "edu.gt", "edu.hn", "edu.ni", "edu.cr",
        "edu.pa", "edu.do", "edu.cu", "edu.pr", "profesor", "teacher", "docente",
        "tutor", "instructor"
    ]
    
    email_lower = email.lower()
    for dominio in dominios_tutor:
        if dominio in email_lower:
            return models.RolUsuario.TUTOR
    
    return models.RolUsuario.ESTUDIANTE
