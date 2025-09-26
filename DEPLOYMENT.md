# Deployment Guide

This guide covers various deployment strategies for the Angular Microfrontend project.

## 🐳 Docker Deployment

### Local Docker Development

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Access applications:
- Shell: http://localhost:4200
- MFE1: http://localhost:4201
- MFE2: http://localhost:4202

### Production Docker Deployment

1. Build production images:
```bash
docker build -f Dockerfile.shell -t angular-mfe-shell:prod .
docker build -f Dockerfile.mfe1 -t angular-mfe1-dashboard:prod .
docker build -f Dockerfile.mfe2 -t angular-mfe2-user-management:prod .
```

2. Run with production configuration:
```bash
docker run -d -p 4200:80 --name shell angular-mfe-shell:prod
docker run -d -p 4201:80 --name mfe1 angular-mfe1-dashboard:prod
docker run -d -p 4202:80 --name mfe2 angular-mfe2-user-management:prod
```

## ☁️ Cloud Deployment

### AWS ECS Deployment

1. Create ECS cluster
2. Build and push images to ECR
3. Create task definitions
4. Deploy services

Example task definition:
```json
{
  "family": "angular-mfe-shell",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "shell",
      "image": "your-account.dkr.ecr.region.amazonaws.com/angular-mfe-shell:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

### Kubernetes Deployment

1. Create namespace:
```bash
kubectl create namespace angular-mfe
```

2. Apply deployment manifests:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shell-deployment
  namespace: angular-mfe
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shell
  template:
    metadata:
      labels:
        app: shell
    spec:
      containers:
      - name: shell
        image: angular-mfe-shell:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: shell-service
  namespace: angular-mfe
spec:
  selector:
    app: shell
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name angular-mfe-shell \
  --image angular-mfe-shell:latest \
  --dns-name-label angular-mfe-shell \
  --ports 80
```

## 🌐 CDN and Static Hosting

### AWS S3 + CloudFront

1. Build applications:
```bash
npm run build:shell
npm run build:mfe1
npm run build:mfe2
```

2. Upload to S3 buckets
3. Configure CloudFront distributions
4. Set up custom domains

### Netlify Deployment

1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build shell`
   - Publish directory: `dist/shell`
3. Set up redirects for SPA routing

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## 🔧 Environment Configuration

### Environment Variables

Create environment-specific configurations:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  mfe1Url: 'https://mfe1.yourdomain.com',
  mfe2Url: 'https://mfe2.yourdomain.com',
  apiUrl: 'https://api.yourdomain.com'
};
```

### Runtime Configuration

For dynamic configuration:

```typescript
// config.service.ts
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any;

  async loadConfig() {
    const response = await fetch('/assets/config.json');
    this.config = await response.json();
  }

  get(key: string) {
    return this.config[key];
  }
}
```

## 🔒 Security Configuration

### HTTPS Setup

1. Obtain SSL certificates
2. Configure reverse proxy (Nginx/Apache)
3. Update CORS settings
4. Set security headers

### Content Security Policy

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://mfe1.yourdomain.com https://mfe2.yourdomain.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com;
";
```

## 📊 Monitoring and Logging

### Application Monitoring

1. Set up application performance monitoring (APM)
2. Configure error tracking (Sentry, Rollbar)
3. Implement health checks
4. Set up alerts

### Log Aggregation

```typescript
// logging.service.ts
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  log(level: string, message: string, data?: any) {
    // Send to logging service
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data, timestamp: new Date() })
    });
  }
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions

The project includes a complete CI/CD pipeline:

1. **Build Stage**: Compile and test all applications
2. **Test Stage**: Run unit and E2E tests
3. **Security Stage**: Vulnerability scanning
4. **Deploy Stage**: Deploy to staging/production

### Custom Deployment Scripts

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Building applications..."
npm run build:shell
npm run build:mfe1
npm run build:mfe2

echo "Building Docker images..."
docker build -f Dockerfile.shell -t $REGISTRY/shell:$TAG .
docker build -f Dockerfile.mfe1 -t $REGISTRY/mfe1:$TAG .
docker build -f Dockerfile.mfe2 -t $REGISTRY/mfe2:$TAG .

echo "Pushing images..."
docker push $REGISTRY/shell:$TAG
docker push $REGISTRY/mfe1:$TAG
docker push $REGISTRY/mfe2:$TAG

echo "Deploying to Kubernetes..."
kubectl set image deployment/shell-deployment shell=$REGISTRY/shell:$TAG
kubectl set image deployment/mfe1-deployment mfe1=$REGISTRY/mfe1:$TAG
kubectl set image deployment/mfe2-deployment mfe2=$REGISTRY/mfe2:$TAG

echo "Deployment complete!"
```

## 🔄 Blue-Green Deployment

1. Deploy new version to green environment
2. Run smoke tests
3. Switch traffic to green
4. Monitor for issues
5. Keep blue as rollback option

## 📈 Scaling Considerations

### Horizontal Scaling

- Use load balancers
- Implement session affinity if needed
- Scale based on CPU/memory metrics

### Performance Optimization

- Enable gzip compression
- Implement caching strategies
- Use CDN for static assets
- Optimize bundle sizes

## 🆘 Troubleshooting

### Common Deployment Issues

1. **CORS errors**: Check origin configurations
2. **Module Federation failures**: Verify remote URLs
3. **Build failures**: Check Node.js version compatibility
4. **Memory issues**: Increase container memory limits

### Health Checks

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION
    };
  }
}
```

## 📞 Support

For deployment issues:
- Check logs and monitoring dashboards
- Review configuration files
- Contact DevOps team
- Refer to cloud provider documentation
