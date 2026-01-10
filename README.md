# WebAR Image Tracking

A web-based augmented reality application that displays 3D models on tracked images using your device camera.

## Features

- Image tracking using MindAR
- 3D model display in AR
- Mobile and desktop support
- No installation required

## Quick Start

1. Place your `target.mind` and `model.glb` files in the `assets` folder
2. Run a local server: `python -m http.server 8000`
3. Open `http://localhost:8000` in your browser
4. Allow camera access
5. Point camera at your target image

## Setup Assets

### Target Image
Generate your target file at: https://hiukim.github.io/mind-ar-js-doc/tools/compile

### 3D Model
Use any GLB format model. Sample model:
```bash
curl -o assets/model.glb https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb
```

## Mobile Testing

1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile browser, go to: `http://YOUR_IP:8000`
3. Allow camera permissions
4. Point at target image

## Deployment

Deploy to GitHub Pages, Netlify, or Vercel for HTTPS access (required for mobile camera).

## Browser Support

- iOS Safari 11+
- Android Chrome 67+
- Desktop browsers with webcam

## Configuration

Edit `main.js` to adjust model scale and paths:
```javascript
const CONFIG = {
    modelScale: 0.3,  // Change model size
    // ...
};
```

## Tech Stack

Three.js, MindAR, WebGL
