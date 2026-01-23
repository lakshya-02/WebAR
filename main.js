import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

window.THREE = THREE;

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const instructionsEl = document.getElementById('instructions');
const controlPanelEl = document.getElementById('control-panel');
const toggleControlsBtn = document.getElementById('toggle-controls');
const gridOverlayEl = document.getElementById('grid-overlay');
const arContainerEl = document.getElementById('ar-container');

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
let animationMixer;
let isPaused = false;
let currentAnimationIndex = 0;
let lightingEnvironment = 'default';
let ambientLight, directionalLight;
let touchStartDistance = 0;
let touchStartRotation = 0;
let modelRotation = 0;
let modelScale = 0.3;
let allAnimations = [];
let recordedFrames = [];

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
    return { renderer, scene, camera, ambientLight, directionalLight };
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
                
                // Store all animations
                allAnimations = gltf.animations || [];
                
                if (allAnimations.length > 0) {
                    animationMixer = new THREE.AnimationMixer(loadedModel);
                    const action = animationMixer.clipAction(allAnimations[0]);
                    action.play();
                    loadedModel.userData.mixer = animationMixer;
                    loadedModel.userData.clock = new THREE.Clock();
                    console.log(`${allAnimations.length} animations available`);
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

// GESTURE SUPPORT - Touch gestures for model interaction
function setupGestureSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCount = 0;

    document.addEventListener('touchstart', (e) => {
        touchCount = e.touches.length;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        if (touchCount === 2 && isModelVisible) {
            touchStartDistance = getDistance(e.touches[0], e.touches[1]);
            touchStartRotation = modelRotation;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (!isModelVisible || !model) return;

        if (touchCount === 2) {
            // Pinch zoom (scale)
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scaleFactor = currentDistance / touchStartDistance;
            modelScale = Math.max(0.1, Math.min(2, modelScale * scaleFactor));
            model.scale.set(modelScale, modelScale, modelScale);
            touchStartDistance = currentDistance;
        } else if (touchCount === 1) {
            // Drag to rotate
            const deltaX = e.touches[0].clientX - touchStartX;
            modelRotation += deltaX * 0.01;
            if (model) {
                model.rotation.y = modelRotation;
            }
            touchStartX = e.touches[0].clientX;
        }
    });

    document.addEventListener('touchend', () => {
        touchCount = 0;
        touchStartDistance = 0;
    });
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// CONTROL PANEL FUNCTIONS
function setupControlPanel() {
    toggleControlsBtn.addEventListener('click', () => {
        controlPanelEl.classList.toggle('show');
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
        isPaused = !isPaused;
        const btn = document.getElementById('pause-btn');
        btn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
        btn.classList.toggle('active');
        console.log(isPaused ? 'Animation paused' : 'Animation resumed');
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if (model) {
            model.rotation.set(0, 0, 0);
            model.position.set(0, 0, 0);
            modelScale = CONFIG.modelScale;
            model.scale.set(modelScale, modelScale, modelScale);
            modelRotation = 0;
            console.log('Model reset to default state');
        }
    });

    document.getElementById('animate-btn').addEventListener('click', () => {
        if (allAnimations.length > 0) {
            currentAnimationIndex = (currentAnimationIndex + 1) % allAnimations.length;
            console.log(`Switched to animation ${currentAnimationIndex}`);
        }
    });

    document.getElementById('light-btn').addEventListener('click', () => {
        cycleEnvironment();
    });

    document.getElementById('snap-btn').addEventListener('click', () => {
        takeSnapshot();
    });

    document.getElementById('scale-slider').addEventListener('input', (e) => {
        modelScale = parseFloat(e.target.value);
        if (model) {
            model.scale.set(modelScale, modelScale, modelScale);
            console.log(`Model scaled to: ${modelScale}`);
        }
    });

    document.getElementById('grid-btn').addEventListener('click', () => {
        gridOverlayEl.classList.toggle('show');
        console.log('Grid overlay toggled');
    });

    document.getElementById('env-btn').addEventListener('click', () => {
        cycleEnvironment();
    });
}

// ENVIRONMENT CONTROLS
function cycleEnvironment() {
    const environments = ['default', 'bright', 'dark', 'colored'];
    const currentIndex = environments.indexOf(lightingEnvironment);
    lightingEnvironment = environments[(currentIndex + 1) % environments.length];
    applyEnvironment();
}

function applyEnvironment() {
    if (!ambientLight || !directionalLight) return;

    switch (lightingEnvironment) {
        case 'bright':
            ambientLight.intensity = 1.2;
            directionalLight.intensity = 1.0;
            break;
        case 'dark':
            ambientLight.intensity = 0.3;
            directionalLight.intensity = 0.4;
            break;
        case 'colored':
            ambientLight.color.set(0x4488ff);
            directionalLight.color.set(0xff8844);
            ambientLight.intensity = 0.8;
            directionalLight.intensity = 0.8;
            break;
        default: // 'default'
            ambientLight.color.set(0xffffff);
            directionalLight.color.set(0xffffff);
            ambientLight.intensity = 0.8;
            directionalLight.intensity = 0.8;
    }
    console.log(`Environment set to: ${lightingEnvironment}`);
}

// SNAPSHOT FEATURE
function takeSnapshot() {
    try {
        const canvas = mindarThree.renderer.domElement;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `ar-snapshot-${Date.now()}.png`;
        link.click();
        console.log('Snapshot taken and downloaded');
    } catch (error) {
        console.error('Failed to take snapshot:', error);
    }
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
        if (!isPaused) {
            model.rotation.y += 0.01;
        }
    }
    
    if (model && animationMixer && !isPaused) {
        const delta = model.userData.clock.getDelta();
        animationMixer.update(delta);
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
        
        const { scene, ambientLight: aLight, directionalLight: dLight } = initThreeJS();
        ambientLight = aLight;
        directionalLight = dLight;

        setupImageTracking(scene);

        await startAR();

        instructionsEl.textContent = 'Loading 3D model...';
        model = await loadModel();
        if (anchor && model) {
            anchor.group.add(model);
            console.log('Model attached to anchor (post-load)');
        }
        instructionsEl.textContent = 'Point your camera at the target image';
        
        // Setup all interactive features
        setupGestureSupport();
        setupControlPanel();
        
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
