import re
import unicodedata

def limpiar_texto(texto: str) -> str:
    """
    Limpia y normaliza un texto eliminando tildes, puntuación y convirtiendo a minúsculas.
    """
    if not isinstance(texto, str):
        return ""
    
    # Eliminar tildes y acentos
    texto = unicodedata.normalize("NFD", texto)
    texto = texto.encode("ascii", "ignore").decode("utf-8")
    
    # Eliminar puntuación y caracteres no alfabéticos
    texto = re.sub(r"[^\w\s]", "", texto)

    # Convertir a minúsculas
    texto = texto.lower()

    return texto
