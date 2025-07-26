"""
Rutas para gestión de reportes de sesiones.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.reporte import (
    ReporteResponse, 
    ReporteListResponse, 
    GenerarReporteRequest,
    ReporteUpdate
)
from app.services.reporte_service import reporte_service
from app.db import crud
from app.core.logging import logger

router = APIRouter()


@router.post("/generar", response_model=ReporteResponse)
async def generar_reporte(
    request: GenerarReporteRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genera un reporte de sesión usando Gemini.
    """
    try:
        # Verificar que el usuario es tutor
        if current_user.rol.value != "tutor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los tutores pueden generar reportes"
            )
        
        # Verificar que la sesión existe y pertenece al tutor
        sesion = crud.get_chat_session(db, request.sesion_id)
        if not sesion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesión no encontrada"
            )
        
        if sesion.tutor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para generar reporte de esta sesión"
            )
        
        # Verificar que la sesión no tenga reporte previo
        reportes_existentes = crud.get_reportes_by_sesion(db, request.sesion_id)
        if reportes_existentes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta sesión ya tiene un reporte generado"
            )
        
        # Generar el reporte
        resultado = await reporte_service.generar_reporte_sesion(
            sesion_id=request.sesion_id,
            tutor_id=current_user.id,
            notas_tutor=request.notas_tutor,
            motivo_finalizacion=request.motivo_finalizacion
        )
        
        # Obtener el reporte completo
        reporte = crud.get_reporte(db, resultado["reporte_id"])
        
        logger.info(f"Reporte generado exitosamente", data={
            "reporte_id": reporte.id,
            "sesion_id": request.sesion_id,
            "tutor_id": current_user.id
        })
        
        return reporte
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno generando reporte"
        )


@router.get("/", response_model=ReporteListResponse)
async def listar_reportes(
    pagina: int = 1,
    por_pagina: int = 20,
    sesion_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista reportes según el rol del usuario.
    """
    try:
        offset = (pagina - 1) * por_pagina
        
        if current_user.rol.value == "tutor":
            # Tutores ven sus propios reportes
            reportes = crud.get_reportes_by_tutor(
                db, current_user.id, limit=por_pagina, offset=offset
            )
            total = len(crud.get_reportes_by_tutor(db, current_user.id, limit=1000))
        elif current_user.rol.value == "estudiante":
            # Estudiantes ven reportes visibles sobre ellos
            reportes = crud.get_reportes_by_estudiante(
                db, current_user.id, limit=por_pagina, offset=offset
            )
            total = len(crud.get_reportes_by_estudiante(db, current_user.id, limit=1000))
        else:
            # Admins ven todos los reportes
            # TODO: Implementar función para obtener todos los reportes
            reportes = []
            total = 0
        
        return ReporteListResponse(
            reportes=reportes,
            total=total,
            pagina=pagina,
            por_pagina=por_pagina
        )
        
    except Exception as e:
        logger.error(f"Error listando reportes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno listando reportes"
        )


@router.get("/{reporte_id}", response_model=ReporteResponse)
async def obtener_reporte(
    reporte_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene un reporte específico.
    """
    try:
        reporte = crud.get_reporte(db, reporte_id)
        if not reporte:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reporte no encontrado"
            )
        
        # Verificar permisos
        if current_user.rol.value == "tutor":
            if reporte.tutor_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para ver este reporte"
                )
        elif current_user.rol.value == "estudiante":
            if reporte.estudiante_id != current_user.id or not reporte.visible_estudiante:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para ver este reporte"
                )
        
        return reporte
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno obteniendo reporte"
        )


@router.put("/{reporte_id}", response_model=ReporteResponse)
async def actualizar_reporte(
    reporte_id: int,
    reporte_update: ReporteUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza un reporte (solo tutores).
    """
    try:
        # Verificar que el usuario es tutor
        if current_user.rol.value != "tutor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los tutores pueden actualizar reportes"
            )
        
        # Verificar que el reporte existe y pertenece al tutor
        reporte = crud.get_reporte(db, reporte_id)
        if not reporte:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reporte no encontrado"
            )
        
        if reporte.tutor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar este reporte"
            )
        
        # Actualizar el reporte
        update_data = reporte_update.model_dump(exclude_unset=True)
        reporte_actualizado = crud.update_reporte(db, reporte_id, update_data)
        
        logger.info(f"Reporte actualizado", data={
            "reporte_id": reporte_id,
            "tutor_id": current_user.id
        })
        
        return reporte_actualizado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno actualizando reporte"
        )


@router.delete("/{reporte_id}")
async def eliminar_reporte(
    reporte_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un reporte (solo tutores).
    """
    try:
        # Verificar que el usuario es tutor
        if current_user.rol.value != "tutor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los tutores pueden eliminar reportes"
            )
        
        # Verificar que el reporte existe y pertenece al tutor
        reporte = crud.get_reporte(db, reporte_id)
        if not reporte:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reporte no encontrado"
            )
        
        if reporte.tutor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para eliminar este reporte"
            )
        
        # Eliminar el reporte
        crud.delete_reporte(db, reporte_id)
        
        logger.info(f"Reporte eliminado", data={
            "reporte_id": reporte_id,
            "tutor_id": current_user.id
        })
        
        return {"message": "Reporte eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno eliminando reporte"
        ) 