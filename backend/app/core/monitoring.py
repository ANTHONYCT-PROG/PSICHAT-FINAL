"""
Sistema de monitoreo y métricas para PsiChat.
"""

import time
import psutil
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import crud
from app.core.logging import logger
import threading
from collections import defaultdict, deque
import json


@dataclass
class SystemMetrics:
    """Métricas del sistema."""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    active_connections: int
    requests_per_minute: float
    error_rate: float
    response_time_avg: float


@dataclass
class PerformanceMetrics:
    """Métricas de rendimiento."""
    endpoint: str
    method: str
    response_time: float
    status_code: int
    timestamp: datetime
    user_id: Optional[int] = None


class PerformanceMonitor:
    """Monitor de rendimiento en tiempo real."""
    
    def __init__(self, max_records: int = 1000):
        self.max_records = max_records
        self.metrics: deque = deque(maxlen=max_records)
        self.endpoint_stats: Dict[str, Dict] = defaultdict(lambda: {
            'count': 0,
            'total_time': 0.0,
            'errors': 0,
            'min_time': float('inf'),
            'max_time': 0.0
        })
        self.lock = threading.Lock()
    
    def record_request(self, endpoint: str, method: str, response_time: float, 
                      status_code: int, user_id: Optional[int] = None):
        """Registra una métrica de request."""
        metric = PerformanceMetrics(
            endpoint=endpoint,
            method=method,
            response_time=response_time,
            status_code=status_code,
            timestamp=datetime.utcnow(),
            user_id=user_id
        )
        
        with self.lock:
            self.metrics.append(metric)
            
            # Actualizar estadísticas del endpoint
            stats = self.endpoint_stats[f"{method} {endpoint}"]
            stats['count'] += 1
            stats['total_time'] += response_time
            stats['min_time'] = min(stats['min_time'], response_time)
            stats['max_time'] = max(stats['max_time'], response_time)
            
            if status_code >= 400:
                stats['errors'] += 1
    
    def get_endpoint_stats(self) -> Dict[str, Dict]:
        """Obtiene estadísticas por endpoint."""
        with self.lock:
            result = {}
            for endpoint, stats in self.endpoint_stats.items():
                if stats['count'] > 0:
                    result[endpoint] = {
                        'count': stats['count'],
                        'avg_time': stats['total_time'] / stats['count'],
                        'min_time': stats['min_time'],
                        'max_time': stats['max_time'],
                        'error_rate': stats['errors'] / stats['count'] * 100
                    }
            return result
    
    def get_recent_metrics(self, minutes: int = 5) -> List[PerformanceMetrics]:
        """Obtiene métricas recientes."""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        with self.lock:
            return [m for m in self.metrics if m.timestamp > cutoff]


class SystemMonitor:
    """Monitor del sistema."""
    
    def __init__(self):
        self.performance_monitor = PerformanceMonitor()
        self.start_time = datetime.utcnow()
        self._monitoring_task: Optional[asyncio.Task] = None
    
    async def start_monitoring(self):
        """Inicia el monitoreo del sistema."""
        if self._monitoring_task is None:
            self._monitoring_task = asyncio.create_task(self._monitor_loop())
            logger.info("Sistema de monitoreo iniciado")
    
    async def stop_monitoring(self):
        """Detiene el monitoreo del sistema."""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
            self._monitoring_task = None
            logger.info("Sistema de monitoreo detenido")
    
    async def _monitor_loop(self):
        """Loop principal de monitoreo."""
        while True:
            try:
                await self._collect_system_metrics()
                await asyncio.sleep(60)  # Recolectar métricas cada minuto
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error en loop de monitoreo: {e}")
                await asyncio.sleep(60)
    
    async def _collect_system_metrics(self):
        """Recolecta métricas del sistema."""
        try:
            # Métricas del sistema
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Métricas de la aplicación
            endpoint_stats = self.performance_monitor.get_endpoint_stats()
            total_requests = sum(stats['count'] for stats in endpoint_stats.values())
            total_errors = sum(stats['errors'] for stats in endpoint_stats.values())
            avg_response_time = sum(stats['avg_time'] * stats['count'] 
                                  for stats in endpoint_stats.values()) / max(total_requests, 1)
            
            metrics = SystemMetrics(
                timestamp=datetime.utcnow(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_usage_percent=disk.percent,
                active_connections=len(psutil.net_connections()),
                requests_per_minute=total_requests,
                error_rate=total_errors / max(total_requests, 1) * 100,
                response_time_avg=avg_response_time
            )
            
            # Guardar métricas en base de datos
            await self._save_metrics(metrics)
            
            # Log de métricas importantes
            if cpu_percent > 80 or memory.percent > 80:
                logger.warning(f"Alto uso de recursos - CPU: {cpu_percent}%, Memoria: {memory.percent}%")
            
            if total_errors / max(total_requests, 1) > 0.1:  # Más del 10% de errores
                logger.error(f"Alta tasa de errores: {total_errors / max(total_requests, 1) * 100:.2f}%")
                
        except Exception as e:
            logger.error(f"Error recolectando métricas del sistema: {e}")
    
    async def _save_metrics(self, metrics: SystemMetrics):
        """Guarda métricas en la base de datos."""
        try:
            db = SessionLocal()
            
            # Guardar métricas del sistema
            crud.create_metric(
                db, "sistema", "cpu_usage", metrics.cpu_percent, "porcentaje"
            )
            crud.create_metric(
                db, "sistema", "memory_usage", metrics.memory_percent, "porcentaje"
            )
            crud.create_metric(
                db, "sistema", "disk_usage", metrics.disk_usage_percent, "porcentaje"
            )
            crud.create_metric(
                db, "sistema", "active_connections", metrics.active_connections, "conexiones"
            )
            crud.create_metric(
                db, "sistema", "requests_per_minute", metrics.requests_per_minute, "requests"
            )
            crud.create_metric(
                db, "sistema", "error_rate", metrics.error_rate, "porcentaje"
            )
            crud.create_metric(
                db, "sistema", "avg_response_time", metrics.response_time_avg, "segundos"
            )
            
            db.close()
        except Exception as e:
            logger.error(f"Error guardando métricas: {e}")
    
    def record_request(self, endpoint: str, method: str, response_time: float, 
                      status_code: int, user_id: Optional[int] = None):
        """Registra una métrica de request."""
        self.performance_monitor.record_request(endpoint, method, response_time, status_code, user_id)
    
    def get_health_status(self) -> Dict[str, Any]:
        """Obtiene el estado de salud del sistema."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            endpoint_stats = self.performance_monitor.get_endpoint_stats()
            total_requests = sum(stats['count'] for stats in endpoint_stats.values())
            total_errors = sum(stats['errors'] for stats in endpoint_stats.values())
            
            uptime = datetime.utcnow() - self.start_time
            
            return {
                "status": "healthy" if cpu_percent < 80 and memory.percent < 80 else "warning",
                "uptime_seconds": uptime.total_seconds(),
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "total_requests": total_requests,
                "error_rate": total_errors / max(total_requests, 1) * 100,
                "active_endpoints": len(endpoint_stats)
            }
        except Exception as e:
            logger.error(f"Error obteniendo estado de salud: {e}")
            return {"status": "error", "message": str(e)}


# Instancia global del monitor
system_monitor = SystemMonitor()


class AlertManager:
    """Gestor de alertas del sistema."""
    
    def __init__(self):
        self.alerts: List[Dict[str, Any]] = []
        self.alert_rules = {
            "high_cpu": {"threshold": 80, "message": "Alto uso de CPU"},
            "high_memory": {"threshold": 80, "message": "Alto uso de memoria"},
            "high_error_rate": {"threshold": 10, "message": "Alta tasa de errores"},
            "slow_response": {"threshold": 5.0, "message": "Respuestas lentas"}
        }
    
    def check_alerts(self, metrics: SystemMetrics) -> List[Dict[str, Any]]:
        """Verifica si hay alertas basadas en las métricas."""
        new_alerts = []
        
        if metrics.cpu_percent > self.alert_rules["high_cpu"]["threshold"]:
            new_alerts.append({
                "type": "high_cpu",
                "message": self.alert_rules["high_cpu"]["message"],
                "value": metrics.cpu_percent,
                "timestamp": metrics.timestamp
            })
        
        if metrics.memory_percent > self.alert_rules["high_memory"]["threshold"]:
            new_alerts.append({
                "type": "high_memory",
                "message": self.alert_rules["high_memory"]["message"],
                "value": metrics.memory_percent,
                "timestamp": metrics.timestamp
            })
        
        if metrics.error_rate > self.alert_rules["high_error_rate"]["threshold"]:
            new_alerts.append({
                "type": "high_error_rate",
                "message": self.alert_rules["high_error_rate"]["message"],
                "value": metrics.error_rate,
                "timestamp": metrics.timestamp
            })
        
        if metrics.response_time_avg > self.alert_rules["slow_response"]["threshold"]:
            new_alerts.append({
                "type": "slow_response",
                "message": self.alert_rules["slow_response"]["message"],
                "value": metrics.response_time_avg,
                "timestamp": metrics.timestamp
            })
        
        self.alerts.extend(new_alerts)
        return new_alerts


# Instancia global del gestor de alertas
alert_manager = AlertManager() 