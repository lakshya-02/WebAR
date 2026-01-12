import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

window.THREE = THREE;

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const instructionsEl = document.getElementById('instructions');

const CONFIG = {
    targetMindPath: './assets/target.mind',
    modelPath: './assets/model.glb',
    modelScale: 0.3,
    cameraFov: 63,
};

let mindarThree;
let model;
let isModelVisible = false;
let anchor;

function showError(message) {
    console.error('AR Error:', message);
    errorEl.textContent = message;
    errorEl.classList.add('show');
    loadingEl.classList.add('hidden');
    
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function initThreeJS() {
    console.log('Initializing Three.js...');
    loadingEl.querySelector('p').textContent = 'Initializing AR system...';
    
    mindarThree = new MindARThree({
        container: document.getElementById('ar-container'),
        imageTargetSrc: CONFIG.targetMindPath,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
    });

    const { renderer, scene, camera } = mindarThree;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    console.log('Three.js initialized');
    return { renderer, scene, camera };
}

async function loadModel() {
    console.log('Loading 3D model...');
    loadingEl.querySelector('p').textContent = 'Loading 3D model (this may take a moment)...';
    
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        
        loader.load(
            CONFIG.modelPath,
            (gltf) => {
                console.log('Model loaded successfully');
                const loadedModel = gltf.scene;
                
                loadedModel.scale.set(CONFIG.modelScale, CONFIG.modelScale, CONFIG.modelScale);
                
                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(loadedModel);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                    loadedModel.userData.mixer = mixer;
                    loadedModel.userData.clock = new THREE.Clock();
                }
                
                resolve(loadedModel);
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(0);
                    console.log(`Loading model: ${percent}%`);
                    loadingEl.querySelector('p').textContent = `Loading model: ${percent}%`;
                } else {
                    const mb = (progress.loaded / 1024 / 1024).toFixed(1);
                    loadingEl.querySelector('p').textContent = `Loading model: ${mb} MB...`;
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                reject(error);
            }
        );
    });
}

function setupImageTracking(scene) {
    console.log('Setting up image tracking...');
    
    anchor = mindarThree.addAnchor(0);
    
    if (model) {
        anchor.group.add(model);
        console.log('Model attached to anchor');
    }

    anchor.onTargetFound = () => {
        console.log('Target found!');
        isModelVisible = true;
        instructionsEl.classList.add('hidden');
    };

    anchor.onTargetLost = () => {
        console.log('Target lost');
        isModelVisible = false;
        instructionsEl.classList.remove('hidden');
    };

    setupTapInteraction(anchor);
}

function setupTapInteraction(anchor) {
    let rotation = 0;
    
    window.addEventListener('click', () => {
        if (isModelVisible && model) {
            rotation += Math.PI / 4;
            if (model) {
                model.rotation.y = rotation;
                console.log('Model rotated');
            }
        }
    });
}

async function startAR() {
    try {
        loadingEl.querySelector('p').textContent = 'Starting camera...';
        console.log('Starting AR session...');
        await mindarThree.start();
        console.log('AR session started successfully');
        hideLoading();
        
    } catch (error) {
        console.error('Failed to start AR:', error);
        
        if (error.name === 'NotAllowedError') {
            showError('Camera permission denied. Please allow camera access.');
        } else if (error.name === 'NotFoundError') {
            showError('No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
            showError('Camera is already in use by another application.');
        } else if (error.message && error.message.includes('target')) {
            showError('Failed to load target image. Check assets/target.mind file.');
        } else {
            showError('Failed to start AR. Check console for details.');
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (model && isModelVisible) {
        model.rotation.y += 0.01;
    }
    
    if (model && model.userData.mixer) {
        const delta = model.userData.clock.getDelta();
        model.userData.mixer.update(delta);
    }
    
    if (mindarThree) {
        mindarThree.renderer.render(mindarThree.scene, mindarThree.camera);
    }
}

async function checkAssets() {
    const checks = [
        fetch(CONFIG.targetMindPath, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok),
        fetch(CONFIG.modelPath, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok),
    ];
    
    try {
        const results = await Promise.all(checks);
        
        if (!results[0]) {
            showError('Missing assets/target.mind. Put target.mind in the assets folder.');
            return false;
        }
        if (!results[1]) {
            showError('Missing assets/model.glb. Put model.glb in the assets folder.');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking assets:', error);
        return false;
    }
}

async function init() {
    try {
        console.log('Starting WebAR Image Tracking application...');
        
        const assetsExist = await checkAssets();
        if (!assetsExist) {
            return;
        }
        
        const { scene } = initThreeJS();

        setupImageTracking(scene);

        await startAR();

        instructionsEl.textContent = 'Loading 3D model...';
        model = await loadModel();
        if (anchor && model) {
            anchor.group.add(model);
            console.log('Model attached to anchor (post-load)');
        }
        instructionsEl.textContent = 'Point your camera at the target image';
        
        animate();
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError(`Initialization failed: ${error.message}`);
    }
}

if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    showError('WebAR requires HTTPS. Use localhost for testing or deploy to HTTPS.');
} else {
    window.addEventListener('DOMContentLoaded', init);
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden, pausing AR');
        if (mindarThree) {
            mindarThree.stop();
        }
    } else {
        console.log('Page visible, resuming AR');
        if (mindarThree) {
            mindarThree.start();
        }
    }
});
