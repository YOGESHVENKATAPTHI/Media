# Media Proxy Service

A Vercel-hosted serverless function that proxies requests for videos, images, and M3U8 streams. This allows clients (admin and user portals) to load media content without CORS issues.

## Usage

Deploy to Vercel, then request media like:

```
GET https://your-vercel-url.vercel.app/api/proxy?url=https://example.com/video.mp4
```

## Features

- Proxies GET and HEAD requests
- Forwards appropriate headers
- Streams large files efficiently
- Handles redirects

## Deployment

1. Install Vercel CLI: `npm install -g vercel`
2. From this directory: `vercel`
3. Follow the prompts to deploy

## Integration

Update your client code to use the Vercel proxy URL instead of the local proxy route.
