# Use the official Node.js 22 alpine image
FROM node:22-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml .

# Copy package.json and pnpm-lock.yaml for the frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/

# Install dependencies for the frontend
RUN cd frontend && pnpm install

# Copy the rest of the frontend source code
COPY frontend/ ./frontend/

# Expose the port Vite runs on
EXPOSE 5173

# Set the working directory to the frontend folder
WORKDIR /app/frontend

# Set the environment variable to indicate we are in a Docker container
ENV IS_DOCKER=true

# The command to start the development server
CMD ["pnpm", "dev", "--host"]
