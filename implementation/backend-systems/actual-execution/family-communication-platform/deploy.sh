#!/bin/bash
# SeniorCare AI - Bangalore Pilot Deployment Script
# Production deployment automation for customer-ready system

set -e

echo "🚀 SeniorCare AI - Bangalore Pilot Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo -e "${BLUE}Checking environment variables...${NC}"
    
    required_vars=(
        "REACT_APP_SUPABASE_URL"
        "REACT_APP_SUPABASE_ANON_KEY"
        "REACT_APP_API_URL"
        "GA_MEASUREMENT_ID"
        "FB_PIXEL_ID"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "   - $var"
        done
        echo -e "${YELLOW}Please set these variables before deployment.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required environment variables are set${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    
    # Install project dependencies
    npm install --production
    
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
}

# Run tests
run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    
    # Run unit tests
    if npm test -- --coverage --watchAll=false; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    fi
}

# Build application
build_application() {
    echo -e "${BLUE}Building application for production...${NC}"
    
    # Clean previous build
    if [ -d "build" ]; then
        rm -rf build
        echo "Cleaned previous build"
    fi
    
    # Build the application
    npm run build
    
    if [ -d "build" ]; then
        echo -e "${GREEN}✅ Application built successfully${NC}"
        echo "Build size: $(du -sh build | cut -f1)"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Deploy to production
deploy_to_production() {
    echo -e "${BLUE}Deploying to production...${NC}"
    
    # Check if build directory exists
    if [ ! -d "build" ]; then
        echo -e "${RED}❌ Build directory not found. Run build first.${NC}"
        exit 1
    fi
    
    # Deploy based on platform
    if [ "$DEPLOY_PLATFORM" = "vercel" ]; then
        deploy_to_vercel
    elif [ "$DEPLOY_PLATFORM" = "netlify" ]; then
        deploy_to_netlify
    elif [ "$DEPLOY_PLATFORM" = "aws" ]; then
        deploy_to_aws
    else
        echo -e "${YELLOW}No specific deployment platform configured.${NC}"
        echo -e "${YELLOW}Build files are ready in 'build' directory.${NC}"
    fi
    
    echo -e "${GREEN}✅ Deployment completed${NC}"
}

# Deploy to Vercel
deploy_to_vercel() {
    echo -e "${BLUE}Deploying to Vercel...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    vercel --prod
}

# Deploy to Netlify
deploy_to_netlify() {
    echo -e "${BLUE}Deploying to Netlify...${NC}"
    
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    netlify deploy --prod --dir=build
}

# Deploy to AWS S3
deploy_to_aws() {
    echo -e "${BLUE}Deploying to AWS S3...${NC}"
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    if [ -z "$AWS_S3_BUCKET" ]; then
        echo -e "${RED}❌ AWS_S3_BUCKET environment variable not set${NC}"
        exit 1
    fi
    
    # Sync build files to S3
    aws s3 sync build/ s3://$AWS_S3_BUCKET --delete
    
    # Invalidate CloudFront cache if configured
    if [ -n "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
        echo "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    fi
}

# Setup monitoring and alerts
setup_monitoring() {
    echo -e "${BLUE}Setting up monitoring and alerts...${NC}"
    
    # Create monitoring configuration
    cat > monitoring-config.json << EOF
{
  "project": "seniorcare-ai-bangalore-pilot",
  "environment": "production",
  "monitoring": {
    "uptime": true,
    "performance": true,
    "errors": true,
    "analytics": true
  },
  "alerts": {
    "email": ["dev@seniorcare-ai.com", "ops@seniorcare-ai.com"],
    "slack": "#alerts",
    "thresholds": {
      "error_rate": 5,
      "response_time": 2000,
      "availability": 99.5
    }
  }
}
EOF
    
    echo -e "${GREEN}✅ Monitoring configuration created${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${BLUE}Verifying deployment...${NC}"
    
    if [ -n "$DEPLOY_URL" ]; then
        echo "Testing deployment URL: $DEPLOY_URL"
        
        # Check if site is accessible
        if curl -f -s "$DEPLOY_URL" > /dev/null; then
            echo -e "${GREEN}✅ Site is accessible${NC}"
        else
            echo -e "${RED}❌ Site is not accessible${NC}"
            exit 1
        fi
        
        # Check if analytics are working
        if curl -f -s "$DEPLOY_URL" | grep -q "gtag"; then
            echo -e "${GREEN}✅ Google Analytics detected${NC}"
        else
            echo -e "${YELLOW}⚠️ Google Analytics not detected${NC}"
        fi
        
        # Check if Facebook Pixel is working
        if curl -f -s "$DEPLOY_URL" | grep -q "fbq"; then
            echo -e "${GREEN}✅ Facebook Pixel detected${NC}"
        else
            echo -e "${YELLOW}⚠️ Facebook Pixel not detected${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ DEPLOY_URL not set, skipping URL verification${NC}"
    fi
}

# Post-deployment tasks
post_deployment() {
    echo -e "${BLUE}Running post-deployment tasks...${NC}"
    
    # Send deployment notification
    echo "Deployment completed at $(date)" > deployment-log.txt
    echo "Version: $(git rev-parse --short HEAD)" >> deployment-log.txt
    echo "Environment: production" >> deployment-log.txt
    echo "Platform: ${DEPLOY_PLATFORM:-manual}" >> deployment-log.txt
    
    # Create backup of current deployment
    if [ -d "build" ]; then
        backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r build "$backup_dir/"
        echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    fi
    
    echo -e "${GREEN}✅ Post-deployment tasks completed${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting SeniorCare AI deployment process...${NC}"
    echo "Timestamp: $(date)"
    echo "Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
    echo ""
    
    # Run deployment steps
    check_env_vars
    echo ""
    
    install_dependencies
    echo ""
    
    # Skip tests in quick deploy mode
    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
        echo ""
    fi
    
    build_application
    echo ""
    
    setup_monitoring
    echo ""
    
    deploy_to_production
    echo ""
    
    verify_deployment
    echo ""
    
    post_deployment
    echo ""
    
    echo -e "${GREEN}🎉 SeniorCare AI deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Monitor application performance and user analytics"
    echo "2. Begin NRI family customer acquisition campaigns"
    echo "3. Collect user feedback for continuous improvement"
    echo "4. Scale infrastructure based on user growth"
    echo ""
    
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${GREEN}🌐 Your application is live at: $DEPLOY_URL${NC}"
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "SeniorCare AI Deployment Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h         Show this help message"
        echo "  --skip-tests       Skip running tests"
        echo "  --quick            Quick deploy (skip tests and verification)"
        echo ""
        echo "Environment Variables:"
        echo "  DEPLOY_PLATFORM    Target platform (vercel, netlify, aws)"
        echo "  DEPLOY_URL         URL to verify after deployment"
        echo "  SKIP_TESTS         Set to 'true' to skip tests"
        exit 0
        ;;
    --skip-tests)
        export SKIP_TESTS="true"
        main
        ;;
    --quick)
        export SKIP_TESTS="true"
        export SKIP_VERIFICATION="true"
        main
        ;;
    *)
        main
        ;;
esac
