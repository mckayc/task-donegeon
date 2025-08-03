#!/bin/sh

# This tells the script to exit immediately if any command fails.
# It's a safety measure to prevent the container from running in a broken state.
set -e

# Ensure the application user owns the database and uploads directories.
# This is crucial for when these directories are mounted as volumes from the host,
# as they might be owned by 'root' initially, causing permission errors.
chown -R appuser:appgroup /home/appuser/app/backend/db
chown -R appuser:appgroup /home/appuser/app/uploads
# Execute the command passed to the script (the Dockerfile's CMD)
exec "$@"