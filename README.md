# WebAR Image Tracking

A minimal WebAR application using Three.js and MindAR. Scan a target image to display a 3D model in augmented reality.

## What You Need

1. Two asset files in the assets folder:
   - target.mind (compiled image target)
   - model.glb (3D model file)

2. A local web server (Live Server, Python, or Node.js)

3. HTTPS connection or localhost for testing

4. Mobile device with camera (iOS 11+ Safari or Android 7+ Chrome)

## Step 1: Get Your Assets

### Generate target.mind File

1. Choose a target image (JPG or PNG) with high contrast and rich detail
2. Go to https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Upload your image
4. Download the generated file as targets.mind
5. Rename it to target.mind
6. Place it in the assets folder

### Get a 3D Model

Option A - Download sample model:
```
curl -o assets/model.glb https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb
```

Option B - Find free models:
- Visit https://sketchfab.com/3d-models?features=downloadable
- Download a model with free license
- Convert to GLB format if needed at https://products.aspose.app/3d/conversion
- Save as model.glb in the assets folder

## Step 2: Run the Website Locally

### Using VS Code Live Server

1. Install Live Server extension
2. Right-click index.html
3. Select "Open with Live Server"
4. Opens at http://localhost:5500

### Using Python

```
python -m http.server 8000
```
Then open http://localhost:8000

### Using Node.js

```
npx http-server -p 8000
```
Then open http://localhost:8000

## Step 3: Test on Desktop

1. Open the localhost URL in your browser
2. Allow camera access when prompted
3. Show your target image to the webcam
4. The 3D model should appear on the target

## Step 4: Test on Mobile

1. Make sure your phone and computer are on the same network
2. Find your computer's IP address:
   - Windows: Run ipconfig in terminal
   - Mac/Linux: Run ifconfig in terminal
3. On your mobile browser, go to http://YOUR_IP_ADDRESS:PORT
4. Allow camera permissions
5. Point camera at the target image
6. Tap screen to rotate the model

## Deploy to Production

### Netlify (Recommended)

1. Go to https://netlify.com and create free account
2. Drag and drop your project folder
3. Site is live with HTTPS automatically

### GitHub Pages

1. Create GitHub repository
2. Push your code
3. Go to Settings > Pages
4. Enable Pages from main branch
5. Access at https://USERNAME.github.io/REPO

## Configuration

Edit these values in main.js if needed:

```javascript
const CONFIG = {
    targetMindPath: './assets/target.mind',
    modelPath: './assets/model.glb',
    modelScale: 0.3,    // Adjust if model is too big or small
    cameraFov: 63,
};
```

## Troubleshooting

Problem: Camera permission denied
Solution: Check browser settings and allow camera access

Problem: Assets not loading
Solution: Verify target.mind and model.glb exist in assets folder

Problem: Model too big or small
Solution: Change modelScale value in CONFIG (try 0.1 to 1.0)

Problem: Target not detected
Solution: Ensure good lighting and target image is clear and flat

Problem: Works on localhost but not mobile
Solution: Use HTTPS deployment or check network connection

## Browser Requirements

- iOS: Safari 11 or higher (Chrome on iOS will not work)
- Android: Chrome 67 or higher on Android 7+
- Desktop: Any modern browser with webcam access

## Important Notes

- HTTPS is required for camera access (except on localhost)
- Target image should have high contrast and detail
- Keep model file size under 5MB for best performance
- Print target image or display on another screen for testing
- Good lighting conditions improve tracking quality

## Tech Stack

- HTML5
- JavaScript ES6+
- Three.js (3D rendering)
- MindAR (image tracking)
- WebGL

## Resources

- MindAR Compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
- MindAR Documentation: https://hiukim.github.io/mind-ar-js-doc/
- Three.js Documentation: https://threejs.org/docs/
- Free 3D Models: https://github.com/KhronosGroup/glTF-Sample-Models
