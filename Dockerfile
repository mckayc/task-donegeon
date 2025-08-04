# frontend/Dockerfile

# --- Stage 1: The Build Environment ---
# Use an official Node.js image. The 'alpine' version is a lightweight Linux distribution.
# We name this stage 'builder' so we can refer to it later.
FROM node:18-alpine AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy the package.json and package-lock.json files first.
# This leverages Docker's layer caching. If these files haven't changed, Docker
# won't re-run the `npm install` step, making future builds much faster.
COPY package.json ./
COPY package-lock.json ./

# Install all the project dependencies.
RUN npm install

# Copy the rest of the application's source code into the container.
COPY . .

# Run the build script defined in package.json to compile the React app
# into static HTML, CSS, and JS files. This output goes into the /app/dist directory.
RUN npm run build

# --- Stage 2: The Production Environment ---
# Start from a clean, lightweight Nginx image. Nginx is a high-performance web server.
FROM nginx:1.25-alpine

# Copy ONLY the built application files from the 'builder' stage.
# We copy the contents of /app/dist from the 'builder' into the default
# Nginx web root directory.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration file into the Nginx configuration directory.
# This file tells Nginx how to serve our app and proxy API requests.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tell Docker that the container will listen on port 80 at runtime.
EXPOSE 80

# This is the command that runs when the container starts. It starts the Nginx
# server in the foreground, which is standard practice for Docker containers.
CMD ["nginx", "-g", "daemon off;"]