# ----- Stage 1: The "Builder" Environment -----
# Use an official Node.js image. The "-alpine" tag refers to a very small version of Linux, which is efficient.
# We name this stage "builder" so we can refer back to it later.
FROM node:18-alpine AS builder

# Set the working directory inside the container to /app.
# All subsequent commands (COPY, RUN, etc.) will be executed from this path.
WORKDIR /app

# Copy the package.json and package-lock.json files first.
# This is a key optimization that leverages Docker's layer caching. The `npm install` step
# will only be re-run if these specific files change, not every time you change a source file.
COPY package.json package-lock.json ./

# Install all the project dependencies defined in package-lock.json.
# This includes Vite, TypeScript, and other tools needed to build the project.
RUN npm install

# Now, copy the rest of your frontend source code (the 'src' folder, vite.config.ts, etc.)
# into the container's /app directory.
COPY . .

# Run the build script from your package.json ("tsc && vite build").
# This tells Vite to compile your TypeScript and React code into optimized, static
# HTML, CSS, and JavaScript files, placing them in the `/app/dist` directory.
RUN npm run build

# ----- Stage 2: The Final "Production" Image -----
# Here we start a new, completely fresh stage from the official Nginx image.
# Nginx is a high-performance web server, perfect for serving static files.
FROM nginx:1.25-alpine

# This is the most important step of the multi-stage build.
# Copy ONLY the built assets from the `/app/dist` directory in the "builder" stage
# into the directory where Nginx serves files from by default.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy your custom Nginx configuration file into the Nginx configuration directory.
# This file is crucial for two things:
# 1. Correctly handling routing for a Single-Page Application (SPA).
# 2. Proxying API requests (like `/api/auth/login`) to your backend container.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Inform Docker that the container will listen on port 80 at runtime.
# This is the standard port for HTTP traffic.
EXPOSE 80

# The command that will run when the container starts.
# This starts the Nginx server. The '-g "daemon off;"' flag is essential
# as it tells Nginx to run in the foreground, which is the standard behavior for containers.
CMD ["nginx", "-g", "daemon off;"]