# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with clean cache
RUN npm cache clean --force && npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
