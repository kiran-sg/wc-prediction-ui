# ===========================
# Stage 1: Build Angular App
# ===========================

# Use Node.js 18 as the base image for building the Angular app
FROM node:18 AS build

# Set the working directory inside the container to `/app`
WORKDIR /app

# Copy `package.json` and `package-lock.json` (if available) to the container
# This ensures dependencies are installed before copying the entire project
COPY package.json ./

# Install dependencies for the Angular project
RUN npm install

# Copy all project files from the local machine to the container's `/app` directory
COPY . .

# Build the Angular project in production mode
# This generates optimized files in the `dist/ipl-prediction-ui/browser` folder
RUN npm run build --configuration=production

# ==============================
# Stage 2: Serve with Nginx
# ==============================

# Use the official Nginx image as the base image for serving the built Angular app
FROM nginx:latest 

# Remove the default Nginx configuration file to use a custom configuration
RUN rm /etc/nginx/conf.d/default.conf 

# Copy the custom Nginx configuration file into the container
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular app from the previous `build` stage to Nginx's default serving directory
# `/usr/share/nginx/html` is where Nginx serves static files
COPY --from=build /app/dist/ipl-prediction-ui/browser /usr/share/nginx/html

# Expose port 80 to allow incoming traffic to the Nginx server
EXPOSE 80 

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]