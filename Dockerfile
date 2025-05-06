# Stage 1: Build the React frontend
FROM node:18 AS frontend

WORKDIR /frontend
COPY front-end/package*.json ./
RUN npm install
COPY front-end/ ./
RUN npm run build

# Stage 2: Build the Flask backend
FROM python:3.12-slim AS backend

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Copy React build output from Stage 1 into Flask's static folder
COPY --from=frontend /frontend/build /app/static/react_build

COPY energy_estimation.db /app/

# Flask app run settings
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
EXPOSE 5000

CMD ["python", "app.py"]