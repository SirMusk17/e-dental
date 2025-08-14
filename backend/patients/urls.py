from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PatientViewSet, AuditLogViewSet

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    # APIs REST
    path('api/', include(router.urls)),
]
