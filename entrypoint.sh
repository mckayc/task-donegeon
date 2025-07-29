#!/bin/sh
set -e

# Take ownership of the volume mounts. This is run as root before we drop privileges.
chown -R appuser:appgroup /app/uploads /app/backend/backups /app/backend/db

# Create db file
touch /app/backend/data.db

# Execute the main container command (CMD) as the non-root 'appuser'
exec su-exec appuser "$@"