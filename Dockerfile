FROM node:20-slim

# Install system dependencies for Playwright Chromium
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libatspi2.0-0 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install Playwright Chromium (no sudo needed)
RUN npx playwright install chromium

# Install and build client
COPY client/package*.json ./client/
RUN npm install --prefix client

COPY . .
RUN npm run build --prefix client

# Create Data directory with correct permissions
RUN mkdir -p Data && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 3001

CMD ["node", "server/index.js"]
