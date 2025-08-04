# ----- Stage 1: The "Builder" Stage -----
# Start with an official Node.js Alpine image. This provides the TypeScript compiler (tsc)
# and npm to install dependencies. We name this stage "builder".
FROM node:18-alpine AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy package manifests first to leverage Docker's layer caching.
# `npm install` will only re-run if these files change.
COPY package.json package-lock.json ./

# Install ALL dependencies, including the devDependencies like `typescript`,
# `ts-node-dev`, and `prisma`, which are required for the build process.
RUN npm install

# Copy the rest of the backend source code into the container.
# This includes your `src` folder, `prisma` schema, and `assets`.
COPY . .

# Run the build script defined in `package.json`. This command executes `tsc`,
# which compiles your TypeScript files from `src/` into JavaScript in the `dist/` directory.
RUN npm run build


# ----- Stage 2: The Final "Production" Image -----
# Start a new, clean stage from the same lightweight Node.js image.
# This ensures no build tools or source code from the previous stage are included.
FROM node:18-alpine

# Set the working directory for the production environment.
WORKDIR /app

# Copy the package manifests again.
COPY package.json package-lock.json ./

# CRITICAL STEP: Install ONLY production dependencies.
# The `--omit=dev` flag tells npm to skip installing anything in `devDependencies`.
# This results in a much smaller and more secure final image.
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the 'builder' stage.
COPY --from=builder /app/dist ./dist

# Copy the Prisma schema. This is required by the Prisma Client at runtime.
COPY --from=builder /app/prisma ./prisma

# Copy the game assets. The server needs to read these files to serve quest data.
COPY --from=builder /app/assets ./assets

# Generate the Prisma Client. This command reads the schema and creates the
# tailored database client code inside `node_modules/@prisma/client`.
# This MUST be run after installing dependencies and copying the schema.
RUN npx prisma generate

# Expose the port the Fastify server will listen on.
EXPOSE 3000

# The command to start the server when the container launches.
# This executes the "start" script in `package.json` (`node dist/server.js`).
CMD ["npm", "start"]