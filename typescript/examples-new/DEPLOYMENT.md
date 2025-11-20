# SK8 Examples Deployment Guide

## Overview
This guide explains how to deploy the SK8 examples gallery to various hosting platforms.

## Prerequisites
- All examples are static HTML/CSS/JS files
- No server-side processing required
- All examples work offline (self-contained)

## Deployment Options

### Option 1: GitHub Pages (Recommended)

#### Setup
1. Push examples to your GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main` or `master`)
4. Set directory to `/typescript/examples-new` or `/docs`
5. Save and wait for deployment

#### Custom Domain (Optional)
1. Add CNAME file with your domain
2. Configure DNS with your domain provider
3. Add custom domain in GitHub Pages settings

#### URL Structure
```
https://username.github.io/sk8/examples-new/
https://username.github.io/sk8/examples-new/01-hello-world/
https://username.github.io/sk8/templates/blank-project/
```

### Option 2: Netlify

#### Deploy from Git
1. Connect Netlify to your GitHub repository
2. Set build directory to `typescript/examples-new`
3. No build command needed (static files)
4. Deploy!

#### Drag and Drop
1. Go to Netlify dashboard
2. Drag the `examples-new` folder
3. Instant deployment

#### Custom Domain
- Configure in Netlify dashboard
- Automatic HTTPS included

### Option 3: Vercel

#### From Git
```bash
cd typescript/examples-new
vercel
```

#### Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "public": true,
  "github": {
    "silent": true
  }
}
```

### Option 4: AWS S3 + CloudFront

#### Upload to S3
```bash
aws s3 sync examples-new/ s3://your-bucket/examples/ --acl public-read
```

#### CloudFront Setup
1. Create CloudFront distribution
2. Point origin to S3 bucket
3. Configure default root object: `index.html`
4. Enable HTTPS

### Option 5: Self-Hosted

#### Simple HTTP Server
```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name examples.sk8.dev;
    root /var/www/sk8/examples-new;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName examples.sk8.dev
    DocumentRoot /var/www/sk8/examples-new

    <Directory /var/www/sk8/examples-new>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

## Pre-Deployment Checklist

### 1. Verify All Examples Work
```bash
# Test each example locally
cd examples-new
python3 -m http.server 8000
# Visit http://localhost:8000 and test each example
```

### 2. Check File Paths
- Ensure all paths are relative
- No absolute paths (e.g., `/home/user/...`)
- Links work from any directory level

### 3. Optimize Assets
```bash
# Minify CSS/JS (optional)
npm install -g clean-css-cli uglify-js

# Minify
cleancss -o styles.min.css styles.css
uglifyjs script.js -o script.min.js
```

### 4. Test Cross-Browser
- Chrome
- Firefox
- Safari
- Edge

### 5. Mobile Testing
- Test responsive design
- Touch interactions work
- Performance on mobile devices

## Performance Optimization

### Enable Compression
```nginx
# Nginx
gzip on;
gzip_types text/html text/css application/javascript;
```

### Add Caching Headers
```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### CDN Integration
Use a CDN for better global performance:
- Cloudflare (free tier available)
- AWS CloudFront
- Fastly
- KeyCDN

## Security Considerations

### Content Security Policy
Add to HTML `<head>`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### HTTPS
Always use HTTPS in production:
- Free with Let's Encrypt
- Included with GitHub Pages, Netlify, Vercel
- Required for modern web APIs

## Monitoring

### Analytics (Optional)
Add Google Analytics or Plausible:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### Error Tracking
Consider:
- Sentry
- Rollbar
- LogRocket

## Continuous Deployment

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Examples

on:
  push:
    branches: [ main ]
    paths:
      - 'typescript/examples-new/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./typescript/examples-new
```

## Troubleshooting

### Examples Not Loading
- Check console for errors
- Verify file paths are correct
- Ensure CORS is not blocking resources

### Performance Issues
- Enable compression
- Add caching headers
- Use CDN for assets
- Optimize images

### Mobile Issues
- Test viewport meta tag
- Check touch event handlers
- Verify responsive CSS

## Post-Deployment

### Share Your Examples
- Tweet about it
- Post on Reddit (r/webdev, r/gamedev)
- Share in SK8 community
- Add to awesome-lists

### Get Feedback
- Enable discussions on GitHub
- Add feedback form
- Monitor analytics
- Iterate based on usage

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/your-repo/issues)
- Ask in [Discussions](https://github.com/your-repo/discussions)
- Contact community on Discord/Slack

## License

All examples are open source under the SK8 license.
