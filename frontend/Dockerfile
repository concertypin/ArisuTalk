# Use the official Node.js 22 image
FROM node:22-slim AS builder

# Install pnpm globally
# https://pnpm.io/docker
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Set the working directory in the container
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .

# Copy package.json for the frontend
COPY frontend/package.json ./frontend/

# Install dependencies for the frontend.
# Since pnpm is used by only frontend, it will install frontend dependency only.
RUN pnpm install

# Copy the rest of the frontend source code
COPY frontend/ ./frontend/

# Let's build!
RUN pnpm run build:fe

# --------------------------------------------------------------
FROM joseluisq/static-web-server:2

# Copy dist static files
COPY --from=builder /app/frontend/dist /public

EXPOSE 5173

CMD ["--port", "5173", "--root", "/public"]
