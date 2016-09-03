activate_this = '/var/www/km1app/env/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

import sys,logging
logging.basicConfig(stream=sys.stderr)
sys.path.append('/var/www/km1app')
from km1app.f1 import app as application
