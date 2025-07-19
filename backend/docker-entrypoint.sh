#!/bin/sh

# Set the source and destination directories
DEFAULT_UPLOADS_DIR="/app/default-uploads"
UPLOADS_DIR="/app/uploads" # <-- Match this to your volume mount point

# Check if the uploads directory is empty.
if [ -z "$(ls -A $UPLOADS_DIR)" ]; then
   echo "Uploads directory is empty. Copying default assets..."
   # The '/.' is crucial: it copies the contents, not the folder itself.
   cp -r $DEFAULT_UPLOADS_DIR/. $UPLOADS_DIR/
   echo "Default assets copied."
else
   echo "Uploads directory already contains files. Skipping copy."
fi

# Execute the main command passed to the script (e.g., "npm start")
exec "$@"