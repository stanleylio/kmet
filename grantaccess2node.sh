#!/bin/bash
# give www-data (Apache) r and x access to the node and logging directory

usermod -a -G www-data otg

chgrp www-data /home/otg/node
chmod g+rx /home/otg/node

chgrp www-data /home/otg/logging
chmod g+rx /home/otg/logging
