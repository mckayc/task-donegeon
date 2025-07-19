#!/bin/sh

# Set the source and destination directories
DEFAULT_UPLOADS_DIR="/app/default-uploads"
UPLOADS_DIR="/app/uploads"

# Check if the uploads directory is empty.
# The `-z "$(ls -A ...)"` command is a reliable way to check for an empty directory.
if [ -z "$(ls -A $UPLOADS_DIR)" ]; then
   echo "Uploads directory is empty. Copying default assets..."
   # The '/.' at the end of the source directory is important.
   # It copies the *contents* of the directory, not the directory itself.
   cp -r $DEFAULT_UPLOADS_DIR/. $UPLOADS_DIR/
   echo "Default assets copied."
else
   echo "Uploads directory already contains files. Skipping copy."
fi

# This is the crucial part. `exec "$@"` tells the script to run whatever
# command was passed to it as arguments. In our Dockerfile, this will be
# the `CMD` instruction (e.g., ["npm", "start"]). This makes your Node.js
# application the main process of the container.
exec "$@"