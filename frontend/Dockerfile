FROM node:20-alpine

WORKDIR /app

# Copy package requirements
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite development port
EXPOSE 5173

# Start development server in host mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
