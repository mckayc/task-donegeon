# Use an official Node.js image. The "-alpine" tag refers to a very small version of Linux.
# We name this stage "builder" so we can refer to it later.
FROM node:18-alpine as builder
# Set the working directory inside the container to /app.
# All subsequent commands will run from this directory.
WORKDIR /app
# Copy the package.json and package-lock.json files first.
# Docker caches layers. By copying these separately, Docker won't need to reinstall
# all your npm packages every time you change a source file, only when your dependencies change.
COPY package.json package-lock.json ./
# Install all the project dependencies, including development dependencies like Vite.
RUN npm install
# Now, copy the rest of your frontend source code into the container.
COPY . .
# Run the build script defined in your package.json.
# This compiles your TypeScript/React code into plain JavaScript and creates the 'dist' directory.
RUN npm run build
# Start from a fresh, lightweight Nginx web server image.
FROM nginx:1.25-alpine
# This is the key step. Copy ONLY the built 'dist' folder from the "builder" stage
# into the public HTML directory of the Nginx server.
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy our custom Nginx configuration file. This file tells Nginx how
# to handle Single Page Application routing and proxy API requests to the backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Inform Docker that the container listens on port 80 at runtime.
EXPOSE 80
# The command to start the Nginx server when the container starts.
# "-g 'daemon off;'" ensures Nginx runs in the foreground, which is standard for containers.
CMD ["nginx", "-g", "daemon off;"]