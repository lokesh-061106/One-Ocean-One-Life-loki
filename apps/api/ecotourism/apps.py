from django.apps import AppConfig


class EcotourismConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ecotourism'
    verbose_name = 'Ecotourism'

    def ready(self):
        try:
            from .views import apply_land_calibration
            apply_land_calibration()
        except Exception:
            pass
