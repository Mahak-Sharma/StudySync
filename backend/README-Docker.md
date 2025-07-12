# StudySync Backend - Docker Quick Start

This guide will help you quickly deploy the StudySync backend services using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available
- 10GB free disk space

### 1. Deploy All Services (Development)

```bash
# Navigate to backend directory
cd backend

# Deploy all services
deploy.bat deploy
```

### 2. Deploy All Services (Production)

```bash
# Deploy in production mode
deploy.bat deploy production
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `deploy.bat deploy` | Deploy services in development mode |
| `deploy.bat deploy production` | Deploy services in production mode |
| `deploy.bat start` | Start existing services |
| `deploy.bat stop` | Stop all services |
| `deploy.bat restart` | Restart all services |
| `deploy.bat status` | Show service status |
| `deploy.bat health` | Check service health |
| `deploy.bat logs` | Show all service logs |
| `deploy.bat logs backend` | Show specific service logs |
| `deploy.bat cleanup` | Clean up Docker resources |

## 🌐 Service Endpoints

After deployment, your services will be available at:

- **Main Backend**: http://localhost:5001
  - Health Check: http://localhost:5001/health
  - Summarize API: http://localhost:5001/summarize

- **Speech2Text Service**: http://localhost:5000
  - Health Check: http://localhost:5000/health
  - Voice API: http://localhost:5000/api/voice

- **Video Call Server**: http://localhost:3001
  - Health Check: http://localhost:3001/health
  - WebSocket: ws://localhost:3001

## 🔧 Manual Docker Commands

If you prefer using Docker commands directly:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Production deployment
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the ports
   netstat -ano | findstr :5001
   netstat -ano | findstr :5000
   netstat -ano | findstr :3001
   ```

2. **Docker Not Running**
   - Start Docker Desktop
   - Wait for it to fully load
   - Try the deployment again

3. **Memory Issues**
   - Increase Docker Desktop memory limit (Settings > Resources > Memory)
   - Recommended: 4GB minimum

4. **Service Health Check Fails**
   ```bash
   # Check service logs
   deploy.bat logs backend
   deploy.bat logs speech2text
   deploy.bat logs video-call-server
   ```

### Debug Mode

```bash
# Run without detaching to see logs
docker-compose up --build

# Access container shell
docker-compose exec backend bash
docker-compose exec speech2text bash
docker-compose exec video-call-server sh
```

## 📊 Monitoring

### Check Service Status
```bash
deploy.bat status
```

### Monitor Resource Usage
```bash
docker stats
```

### View Service Logs
```bash
# All services
deploy.bat logs

# Specific service
deploy.bat logs backend
```

## 🔄 Updating Services

To update your services with new code:

```bash
# Stop services
deploy.bat stop

# Rebuild and start
deploy.bat deploy

# Or for production
deploy.bat deploy production
```

## 🧹 Cleanup

To completely clean up Docker resources:

```bash
deploy.bat cleanup
```

This will:
- Stop all containers
- Remove all images
- Remove all volumes
- Clean up unused Docker resources

## 📝 Environment Variables

For production deployment, you can create a `.env` file in the backend directory:

```env
FLASK_ENV=production
FLASK_DEBUG=0
NODE_ENV=production
```

## 🔒 Security Notes

- Services run as non-root users inside containers
- Health checks are enabled for all services
- Production mode disables debug features
- Consider using Docker secrets for sensitive data

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `deploy.bat logs`
3. Verify Docker is running: `docker info`
4. Check service health: `deploy.bat health` 