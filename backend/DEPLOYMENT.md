# StudySync Backend Docker Deployment Guide

This guide explains how to deploy the StudySync backend services using Docker.

## Architecture

The backend consists of three main services:

1. **Main Backend** (Port 5001) - File summarization API
2. **Speech2Text Service** (Port 5000) - Voice processing API  
3. **Video Call Server** (Port 3001) - WebRTC signaling server

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- 10GB free disk space

## Quick Start

### 1. Build and Run All Services

```bash
# Navigate to backend directory
cd backend

# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Individual Service Management

```bash
# Start specific service
docker-compose up -d backend
docker-compose up -d speech2text
docker-compose up -d video-call-server

# Stop specific service
docker-compose stop backend

# Restart specific service
docker-compose restart backend

# View logs for specific service
docker-compose logs -f backend
```

### 3. Health Checks

All services include health check endpoints:

- Main Backend: `http://localhost:5001/health`
- Speech2Text: `http://localhost:5000/health`
- Video Call Server: `http://localhost:3001/health`

## Production Deployment

### 1. Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Environment
FLASK_ENV=production
FLASK_DEBUG=0

# Node Environment
NODE_ENV=production

# Database (if using external database)
DATABASE_URL=your_database_url

# API Keys (if needed)
OPENAI_API_KEY=your_openai_key
```

### 2. Production Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Reverse Proxy Setup

For production, use a reverse proxy (nginx/traefik) to route traffic:

```nginx
# Example nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location /api/summarize {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/voice {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Monitoring and Logs

### 1. View All Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### 2. Resource Usage

```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df
```

### 3. Health Monitoring

```bash
# Check health status
curl http://localhost:5001/health
curl http://localhost:5000/health
curl http://localhost:3001/health
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :5001
   netstat -tulpn | grep :5000
   netstat -tulpn | grep :3001
   ```

2. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # In Docker Desktop: Settings > Resources > Memory
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Debug Mode

```bash
# Run in debug mode
docker-compose up --build

# Access container shell
docker-compose exec backend bash
docker-compose exec speech2text bash
docker-compose exec video-call-server sh
```

## Scaling

### Horizontal Scaling

```bash
# Scale specific service
docker-compose up -d --scale backend=3
docker-compose up -d --scale speech2text=2
```

### Load Balancer Configuration

When scaling, configure a load balancer to distribute traffic across multiple instances.

## Backup and Recovery

### 1. Data Backup

```bash
# Backup summaries data
docker-compose exec backend cp summaries.json /backup/

# Backup from host
cp backend/summaries.json ./backup/
```

### 2. Container Backup

```bash
# Create image backup
docker save studysync-backend > backend-backup.tar
docker save studysync-speech2text > speech2text-backup.tar
```

## Security Considerations

1. **Network Security**: Use Docker networks to isolate services
2. **Secrets Management**: Use Docker secrets for sensitive data
3. **Regular Updates**: Keep base images updated
4. **Access Control**: Limit container access and use non-root users

## Performance Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Caching**: Use Redis for session caching
3. **Database**: Use connection pooling
4. **Monitoring**: Implement proper monitoring and alerting

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Remove volumes
docker-compose down -v

# Full cleanup
docker system prune -a
``` 