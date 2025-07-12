#!/bin/bash

# StudySync Backend Deployment Script
# This script helps deploy the backend services using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to build and start services
deploy_services() {
    local env=${1:-development}
    
    print_status "Deploying services in $env mode..."
    
    if [ "$env" = "production" ]; then
        docker-compose -f docker-compose.prod.yml up --build -d
    else
        docker-compose up --build -d
    fi
    
    print_success "Services deployed successfully"
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    local services=("backend" "speech2text" "video-call-server")
    local ports=(5001 5000 3001)
    
    for i in "${!services[@]}"; do
        local service=${services[$i]}
        local port=${ports[$i]}
        
        print_status "Checking $service on port $port..."
        
        if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service is healthy"
        else
            print_warning "$service health check failed"
        fi
    done
}

# Function to show logs
show_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    docker-compose restart
    print_success "Services restarted"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down --rmi all -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to show usage
show_usage() {
    echo "StudySync Backend Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy [env]     Deploy services (env: development|production, default: development)"
    echo "  start            Start existing services"
    echo "  stop             Stop services"
    echo "  restart          Restart services"
    echo "  status           Show service status"
    echo "  health           Check service health"
    echo "  logs [service]   Show logs (optional: service name)"
    echo "  cleanup          Clean up Docker resources"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy production"
    echo "  $0 logs backend"
    echo "  $0 health"
}

# Main script logic
main() {
    local command=${1:-help}
    
    case $command in
        "deploy")
            check_docker
            check_docker_compose
            deploy_services "$2"
            sleep 10
            check_health
            ;;
        "start")
            check_docker
            check_docker_compose
            docker-compose up -d
            print_success "Services started"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "health")
            check_health
            ;;
        "logs")
            show_logs "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function with all arguments
main "$@" 