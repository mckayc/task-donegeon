#!/bin/sh
set -e

# [NO CHANGE, BUT CONTEXT IS DIFFERENT]
# This script now runs as the 'root' user.
# The 'chown' command will now succeed because 'root' has permission
# to change the ownership of any file, including files in the volumes
# you mount from your host machine (like ./db and ./uploads).
chown -R appuser:appgroup /home/appuser/app/backend/db
chown -R appuser:appgroup /home/appuser/app/uploads

# [+] ADDED: Use su-exec to drop privileges
# This is the most important change. After the 'chown' commands are done,
# we use 'su-exec' to switch from the 'root' user to our secure 'appuser'.
# It then executes ("exec") the main command that was passed to this script.
#
# What is "$@"?
# It's a special shell variable that represents all the arguments passed
# to the script. In our case, it's the CMD from the Dockerfile:
# ["node", "backend/server.js"]
#
# So, this line effectively runs: `su-exec appuser node backend/server.js`
exec su-exec appuser "$@"