import os
from pathlib import Path

# Load .env file
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, _, value = line.partition('=')
            os.environ.setdefault(key.strip(), value.strip())

from .base import *  # noqa: F401,F403,E402

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('DB_NAME', 'o3l_dev'),
        'USER': os.environ.get('DB_USER', 'o3l_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'o3l_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

if os.name == 'nt':
    import glob
    _pg_dirs = [
        r'C:\Program Files\PostgreSQL\18\bin',
        r'C:\Program Files\PostgreSQL\17\bin',
        r'C:\PostgreSQL\18\bin',
        r'C:\PostgreSQL\17\bin',
        r'I:\PostgreSQL\18\bin',
    ]
    _default_gdal = r'C:\Program Files\PostgreSQL\18\bin\libgdal-35.dll'
    _default_geos = r'C:\Program Files\PostgreSQL\18\bin\libgeos_c.dll'
    for _d in _pg_dirs:
        _g = glob.glob(os.path.join(_d, 'libgdal*.dll'))
        _c = glob.glob(os.path.join(_d, 'libgeos_c*.dll'))
        if _g and _c:
            os.environ['PATH'] = _d + os.pathsep + os.environ.get('PATH', '')
            _default_gdal = _g[0]
            _default_geos = _c[0]
            break
    GDAL_LIBRARY_PATH = os.environ.get('GDAL_LIBRARY_PATH') or _default_gdal
    GEOS_LIBRARY_PATH = os.environ.get('GEOS_LIBRARY_PATH') or _default_geos
else:
    GDAL_LIBRARY_PATH = os.environ.get('GDAL_LIBRARY_PATH') or None
    GEOS_LIBRARY_PATH = os.environ.get('GEOS_LIBRARY_PATH') or None

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '192.168.1.4', '*']

CORS_ALLOW_ALL_ORIGINS = True
