#!/bin/sh
set -e

# Create data directories if they don't exist inside the volume mount.
mkdir -p /app/backend/db/backups

# Take ownership of the volume mounts. This is run as root before we drop privileges.
# This ensures SQLite can write to its directory and backups/uploads can be saved.
chown -R appuser:appgroup /app/uploads /app/backend/db

# Execute the main container command (CMD) as the non-root 'appuser'
exec su-exec appuser "$@"