# 🚀 AWS Deployment Guide for Smart Farming System

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **Git** for version control

## 🎯 Deployment Options

### Option 1: AWS Elastic Beanstalk (Recommended for Beginners)

#### Step 1: Prepare Your Application
```bash
# Create application archive
zip -r smart-farming-app.zip . -x "node_modules/*" ".git/*" "*.log"
```

#### Step 2: Deploy to Elastic Beanstalk
1. **Go to AWS Console** → Elastic Beanstalk
2. **Create Application**:
   - Application name: `smart-farming-system`
   - Platform: `Node.js`
   - Platform version: `Node.js 18 running on 64bit Amazon Linux 2`
3. **Upload your code**: Upload the `smart-farming-app.zip`
4. **Configure Environment Variables**:
   - `WEATHER_API_KEY`: `1670989aa9a1404ebe975604251912`
   - `GEMINI_API_KEY`: `AIzaSyCFa1ysArD0oLzZM9whf54uI8EDZEEKH5g`
   - `NODE_ENV`: `production`
5. **Deploy**

#### Step 3: Configure Domain (Optional)
- Go to Route 53 to set up custom domain
- Configure SSL certificate via Certificate Manager

---

### Option 2: AWS ECS with Fargate (Recommended for Production)

#### Step 1: Create ECR Repository
```bash
# Create ECR repository
aws ecr create-repository --repository-name smart-farming-system --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build and Push Docker Image
```bash
# Build Docker image
docker build -t smart-farming-system .

# Tag image
docker tag smart-farming-system:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smart-farming-system:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smart-farming-system:latest
```

#### Step 3: Create ECS Cluster
1. **Go to ECS Console**
2. **Create Cluster**:
   - Cluster name: `smart-farming-cluster`
   - Infrastructure: `AWS Fargate (serverless)`

#### Step 4: Create Task Definition
```json
{
  "family": "smart-farming-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "smart-farming-container",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smart-farming-system:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "WEATHER_API_KEY",
          "value": "1670989aa9a1404ebe975604251912"
        },
        {
          "name": "GEMINI_API_KEY",
          "value": "AIzaSyCFa1ysArD0oLzZM9whf54uI8EDZEEKH5g"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smart-farming-task",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 5: Create ECS Service
1. **Create Service** in your cluster
2. **Configure**:
   - Service name: `smart-farming-service`
   - Task definition: `smart-farming-task`
   - Desired tasks: `1`
   - Subnets: Select public subnets
   - Security group: Allow inbound traffic on port 3000

#### Step 6: Set Up Application Load Balancer
1. **Create ALB** in EC2 Console
2. **Configure**:
   - Scheme: Internet-facing
   - IP address type: IPv4
   - Listeners: HTTP (80) and HTTPS (443)
   - Target group: Point to ECS service

---

### Option 3: AWS EC2 (Manual Setup)

#### Step 1: Launch EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.micro (free tier) or t3.small
# Security group: Allow HTTP (80), HTTPS (443), SSH (22), and Custom (3000)
```

#### Step 2: Connect and Setup
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### Step 3: Deploy Application
```bash
# Clone your repository
git clone https://github.com/your-username/smart-farming-system.git
cd smart-farming-system

# Install dependencies
npm install

# Create environment file
echo "PORT=3000" > .env
echo "WEATHER_API_KEY=1670989aa9a1404ebe975604251912" >> .env
echo "GEMINI_API_KEY=AIzaSyCFa1ysArD0oLzZM9whf54uI8EDZEEKH5g" >> .env
echo "NODE_ENV=production" >> .env

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

#### Step 4: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/smart-farming

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/smart-farming /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- Store sensitive data in AWS Systems Manager Parameter Store
- Use IAM roles instead of hardcoded credentials

### 2. SSL Certificate
```bash
# Install Certbot for free SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 3. Security Groups
- Restrict inbound traffic to necessary ports only
- Use HTTPS (443) instead of HTTP (80) in production

---

## 📊 Monitoring and Logging

### CloudWatch Setup
1. **Create CloudWatch Log Group**
2. **Set up CloudWatch Alarms** for:
   - High CPU usage
   - Memory usage
   - Application errors
   - Response time

### Application Monitoring
```javascript
// Add to your app.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

---

## 🚀 Quick Deploy Commands

### For Elastic Beanstalk:
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init smart-farming-system
eb create production
eb deploy
```

### For ECS:
```bash
# Build and deploy
docker build -t smart-farming-system .
docker tag smart-farming-system:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smart-farming-system:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smart-farming-system:latest

# Update ECS service
aws ecs update-service --cluster smart-farming-cluster --service smart-farming-service --force-new-deployment
```

---

## 💰 Cost Optimization

### Free Tier Resources:
- **EC2**: t3.micro (750 hours/month)
- **Elastic Beanstalk**: No additional charges
- **ECS**: 25 GB storage, 20 GB data transfer
- **CloudWatch**: 10 custom metrics, 5 GB log ingestion

### Estimated Monthly Costs:
- **Elastic Beanstalk**: $15-30/month
- **ECS Fargate**: $10-25/month
- **EC2 t3.small**: $15-20/month

---

## 🔧 Troubleshooting

### Common Issues:
1. **Port 3000 not accessible**: Check security groups
2. **Environment variables not loaded**: Verify .env file or ECS task definition
3. **Application crashes**: Check CloudWatch logs
4. **SSL certificate issues**: Verify domain DNS settings

### Debug Commands:
```bash
# Check application logs
pm2 logs smart-farming-system

# Check system resources
htop
df -h

# Test application locally
curl http://localhost:3000/health
```

---

## 📞 Support

For deployment issues:
1. Check AWS CloudWatch logs
2. Verify security group settings
3. Test API endpoints using the test page: `/test-api.html`
4. Monitor application health: `/health`

**Your Smart Farming System will be live at**: `http://your-domain.com` 🌱