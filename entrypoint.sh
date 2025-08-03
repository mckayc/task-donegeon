#!/bin/sh

# This tells the script to exit immediately if any command fails.
# It's a safety measure to prevent the container from running in a broken state.
set -e

# This is the most important line.
# 'exec' replaces the current shell process with the command that follows it.
# "$@" is a special shell variable that means "all the arguments passed to this script".
# In our Dockerfile, the CMD provides these arguments: ["node", "backend/server.js"].
# So, this line becomes: exec node backend/server.js
#
# By using 'exec', our Node.js server becomes the main process (PID 1) inside the container.
# This is critical because it allows the server to correctly receive signals from Docker,
# like when you run `docker stop`. This enables graceful shutdowns.
exec "$@"