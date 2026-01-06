import * as THREE from 'three';
import { TrackGenerator } from './trackGenerator.js';
import { LeaderboardUI } from './leaderboardUI.js';

export class Game {
    constructor(container, trackName) {
        this.container = container;
        this.trackName = trackName;
        this.leaderboardUI = new LeaderboardUI(trackName);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ship = null;
        this.asteroids = [];
        this.initialAsteroidData = []; // Store initial asteroid states for reset
        this.startTime = null;
        this.isRunning = false;
        this.isFinished = false;
        this.isCountdown = false;
        this.countdownStartTime = null;
        this.countdownDuration = 3000; // 3 seconds countdown

        // Physics properties
        this.shipVelocity = new THREE.Vector3(0, 0, 0);
        this.shipAcceleration = new THREE.Vector3(0, 0, 0);
        this.thrustForce = 0.05; // Acceleration per frame when key is pressed (reduced from 0.15)
        this.friction = 1.0; // No friction - maintain constant velocity in space
        this.maxSpeed = 5; // Maximum velocity

        // Input state
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false // Space for brake
        };

        // Countdown movement
        this.countdownSpeed = 2; // Speed of left-to-right movement during countdown

        this.init();
    }

    async init() {
        try {
            console.log('Initializing game scene...');
            // Generate track
            const generator = new TrackGenerator(this.trackName);
            const trackDataRaw = generator.generateTrack();
            
            // Convert plain objects to THREE.Vector3
            this.trackData = {
                asteroidCount: trackDataRaw.asteroidCount,
                asteroids: trackDataRaw.asteroids.map(ast => ({
                    position: new THREE.Vector3(ast.position.x, ast.position.y, ast.position.z),
                    velocity: new THREE.Vector3(ast.velocity.x, ast.velocity.y, ast.velocity.z),
                    size: ast.size
                })),
                startPoint: new THREE.Vector3(trackDataRaw.startPoint.x, trackDataRaw.startPoint.y, trackDataRaw.startPoint.z),
                endPoint: new THREE.Vector3(trackDataRaw.endPoint.x, trackDataRaw.endPoint.y, trackDataRaw.endPoint.z),
                trackSize: trackDataRaw.trackSize
            };
            console.log('Track generated:', this.trackData.asteroidCount, 'asteroids');

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        // Camera (top-down view) - zoomed in more
        this.camera = new THREE.PerspectiveCamera(
            45, // Reduced FOV for more zoom (was 60)
            window.innerWidth / window.innerHeight,
            0.1,
            2000 // Increased far clipping for larger world
        );
        this.camera.position.set(0, 50, 0); // Lower height = more zoom (was 80)
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Create ship (async, wait for it)
        await this.createShip();

        // Create asteroids
        this.createAsteroids();

        // Create start and end markers
        this.createMarkers();

        // Create grid/ground
        this.createGround();

        // Event listeners
        this.setupEventListeners();

        // Update UI
        document.getElementById('track-name').textContent = this.trackName;
        document.getElementById('status').textContent = 'Press ENTER to start';

        // Start animation loop
        this.animate();
        console.log('Game scene initialized successfully');
        } catch (error) {
            console.error('Error in game initialization:', error);
            throw error;
        }
    }

    async createShip() {
        // Create a procedurally generated spaceship
        this.ship = new THREE.Group();

        // Materials
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x0066aa,
            metalness: 0.9,
            roughness: 0.1,
            emissiveIntensity: 0.5
        });

        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ffff,
            emissive: 0x00aaff,
            transparent: true,
            opacity: 0.8,
            metalness: 1.0,
            roughness: 0.05,
            emissiveIntensity: 0.8
        });

        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x0099dd,
            emissive: 0x004488,
            metalness: 0.8,
            roughness: 0.2,
            emissiveIntensity: 0.4
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            metalness: 0.7,
            roughness: 0.3,
            emissiveIntensity: 0.6
        });

        // Main fuselage (elongated body)
        const fuselageGeometry = new THREE.ConeGeometry(0.6, 2.5, 8);
        const fuselage = new THREE.Mesh(fuselageGeometry, mainMaterial);
        fuselage.rotation.x = -Math.PI / 2;
        fuselage.position.z = 0.5;
        fuselage.castShadow = true;
        this.ship.add(fuselage);

        // Cockpit (glass dome)
        const cockpitGeometry = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.rotation.x = -Math.PI / 2;
        cockpit.position.z = 1.5;
        cockpit.position.y = 0.3;
        cockpit.castShadow = true;
        this.ship.add(cockpit);

        // Wings (delta wing design)
        const wingGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, 0, -0.2);
        leftWing.castShadow = true;
        this.ship.add(leftWing);

        // Wing tips (angled)
        const wingTipGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
        const leftWingTip = new THREE.Mesh(wingTipGeometry, accentMaterial);
        leftWingTip.rotation.z = Math.PI / 2;
        leftWingTip.position.set(-1.7, 0, -0.2);
        leftWingTip.castShadow = true;
        this.ship.add(leftWingTip);

        const rightWingTip = new THREE.Mesh(wingTipGeometry, accentMaterial);
        rightWingTip.rotation.z = -Math.PI / 2;
        rightWingTip.position.set(1.7, 0, -0.2);
        rightWingTip.castShadow = true;
        this.ship.add(rightWingTip);

        // Engine nacelles (on wings)
        const engineNacelleGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 8);

        const leftEngine = new THREE.Mesh(engineNacelleGeometry, mainMaterial);
        leftEngine.rotation.x = Math.PI / 2;
        leftEngine.position.set(-1, -0.2, -0.5);
        leftEngine.castShadow = true;
        this.ship.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineNacelleGeometry, mainMaterial);
        rightEngine.rotation.x = Math.PI / 2;
        rightEngine.position.set(1, -0.2, -0.5);
        rightEngine.castShadow = true;
        this.ship.add(rightEngine);

        // Engine glows
        const engineGlowGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.3, 8);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2
        });

        const leftEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        leftEngineGlow.rotation.x = Math.PI / 2;
        leftEngineGlow.position.set(-1, -0.2, -1.1);
        this.ship.add(leftEngineGlow);

        const rightEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        rightEngineGlow.rotation.x = Math.PI / 2;
        rightEngineGlow.position.set(1, -0.2, -1.1);
        this.ship.add(rightEngineGlow);

        // Central engine (rear)
        const centralEngineGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8);
        const centralEngine = new THREE.Mesh(centralEngineGeometry, mainMaterial);
        centralEngine.rotation.x = Math.PI / 2;
        centralEngine.position.z = -1;
        centralEngine.castShadow = true;
        this.ship.add(centralEngine);

        // Central engine glow
        const centralGlowGeometry = new THREE.CylinderGeometry(0.45, 0.55, 0.4, 8);
        const centralGlow = new THREE.Mesh(centralGlowGeometry, engineGlowMaterial);
        centralGlow.rotation.x = Math.PI / 2;
        centralGlow.position.z = -1.5;
        this.ship.add(centralGlow);

        // Accent stripes on fuselage
        const stripeGeometry = new THREE.BoxGeometry(0.1, 0.1, 1.5);
        const leftStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
        leftStripe.position.set(-0.4, 0.3, 0.5);
        this.ship.add(leftStripe);

        const rightStripe = new THREE.Mesh(stripeGeometry, accentMaterial);
        rightStripe.position.set(0.4, 0.3, 0.5);
        this.ship.add(rightStripe);

        // Outer glow ring for visibility
        const glowRing = new THREE.RingGeometry(1.8, 2.2, 32);
        const glowRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(glowRing, glowRingMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.1;
        this.ship.add(ring);

        // Position ship at the starting point
        this.ship.position.copy(this.trackData.startPoint);

        // Point ship toward the end point
        const direction = new THREE.Vector3()
            .subVectors(this.trackData.endPoint, this.trackData.startPoint)
            .normalize();
        this.ship.rotation.y = Math.atan2(direction.x, direction.z);

        this.ship.castShadow = true;
        this.scene.add(this.ship);
    }

    createAsteroids() {
        this.asteroids = [];
        this.initialAsteroidData = []; // Clear and rebuild initial data
        this.trackData.asteroids.forEach((asteroidData, index) => {
            // Create more detailed asteroid using Icosahedron with noise
            const geometry = new THREE.IcosahedronGeometry(asteroidData.size, 1);
            
            // Add random noise to vertices for more organic look
            const positions = geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const z = positions.getZ(i);
                const noise = (Math.random() - 0.5) * 0.3; // Random variation
                positions.setXYZ(
                    i,
                    x + x * noise,
                    y + y * noise,
                    z + z * noise
                );
            }
            geometry.computeVertexNormals(); // Recalculate normals after deformation
            
            // Better material with more detail
            const material = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(
                    0.1, // Hue (brownish)
                    0.3 + Math.random() * 0.3, // Saturation variation
                    0.2 + Math.random() * 0.2 // Lightness variation
                ),
                roughness: 0.9,
                metalness: 0.1,
                bumpScale: 0.5
            });
            
            const asteroid = new THREE.Mesh(geometry, material);
            
            // Add random rotation for visual interest
            asteroid.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // Store rotation speed
            asteroid.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            };
            
            // Handle both Vector3 and plain objects
            if (asteroidData.position instanceof THREE.Vector3) {
                asteroid.position.copy(asteroidData.position);
            } else {
                asteroid.position.set(asteroidData.position.x, asteroidData.position.y, asteroidData.position.z);
            }
            
            // Handle velocity - ensure it's a Vector3
            if (asteroidData.velocity instanceof THREE.Vector3) {
                asteroid.userData.velocity = asteroidData.velocity.clone();
            } else {
                asteroid.userData.velocity = new THREE.Vector3(
                    asteroidData.velocity.x,
                    asteroidData.velocity.y,
                    asteroidData.velocity.z
                );
            }
            
            asteroid.userData.size = asteroidData.size;
            asteroid.castShadow = true;
            asteroid.receiveShadow = true;
            this.scene.add(asteroid);
            this.asteroids.push(asteroid);

            // Store initial state for reset
            this.initialAsteroidData.push({
                position: asteroid.position.clone(),
                velocity: asteroid.userData.velocity.clone(),
                rotation: {
                    x: asteroid.rotation.x,
                    y: asteroid.rotation.y,
                    z: asteroid.rotation.z
                },
                rotationSpeed: asteroid.userData.rotationSpeed
            });
        });
    }

    createMarkers() {
        // Start marker (green) - invisible, not added to scene
        // We don't need a visible start marker since we start there

        // End marker (red) - doubled in size
        const endGeometry = new THREE.CylinderGeometry(4, 4, 1, 16);
        const endMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x440000
        });
        const endMarker = new THREE.Mesh(endGeometry, endMaterial);
        endMarker.position.copy(this.trackData.endPoint);
        endMarker.position.y = 0.5;
        this.scene.add(endMarker);
    }

    createGround() {
        // Create sector grid with alternating shades
        const sectorSize = this.trackData.sectorSize;
        const sectorsPerSide = this.trackData.sectorsPerSide;
        const halfTrack = this.trackData.trackSize / 2;

        for (let x = 0; x < sectorsPerSide; x++) {
            for (let z = 0; z < sectorsPerSide; z++) {
                // Alternating pattern for visual distinction
                const isEven = (x + z) % 2 === 0;
                const color = isEven ? 0x000033 : 0x000022;

                const planeGeometry = new THREE.PlaneGeometry(sectorSize, sectorSize);
                const planeMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(planeGeometry, planeMaterial);

                // Position plane
                plane.position.x = -halfTrack + (x * sectorSize) + (sectorSize / 2);
                plane.position.z = -halfTrack + (z * sectorSize) + (sectorSize / 2);
                plane.position.y = -1;
                plane.rotation.x = -Math.PI / 2;

                this.scene.add(plane);
            }
        }

        // Add sector grid lines
        const gridHelper = new THREE.GridHelper(
            this.trackData.trackSize,
            sectorsPerSide,
            0x0066ff,
            0x003366
        );
        gridHelper.position.y = -0.5;
        this.scene.add(gridHelper);

        // Add stars background - distributed across the entire play area
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 5000; // More stars for larger area
        const starsPositions = new Float32Array(starsCount * 3);
        const spreadSize = this.trackData.trackSize * 1.5; // Cover 1.5x the track size
        for (let i = 0; i < starsCount; i++) {
            starsPositions[i * 3] = (Math.random() - 0.5) * spreadSize; // x
            starsPositions[i * 3 + 1] = (Math.random() - 0.5) * spreadSize; // y (depth variation)
            starsPositions[i * 3 + 2] = (Math.random() - 0.5) * spreadSize; // z
        }
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
                e.preventDefault();
                if (this.isRunning && !this.isCountdown) {
                    // Only apply controls after countdown
                }
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!this.isRunning && !this.isFinished && !this.isCountdown) {
                    this.startCountdown();
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.resetRace();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
                e.preventDefault();
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    startCountdown() {
        this.isCountdown = true;
        this.countdownStartTime = Date.now();

        // Show the countdown overlay
        const overlay = document.getElementById('countdown-overlay');
        overlay.classList.add('show');
        overlay.classList.remove('go');
        document.getElementById('countdown-number').textContent = '3';
        document.getElementById('status').textContent = 'Get ready...';
    }

    startRace() {
        if (!this.isRunning && !this.isFinished) {
            this.isRunning = true;
            this.isCountdown = false;
            this.startTime = Date.now();
            this.shipVelocity.set(0, 0, 0); // Start with zero velocity
            document.getElementById('status').textContent = 'Racing!';
        }
    }

    resetRace() {
        this.isRunning = false;
        this.isFinished = false;
        this.isCountdown = false;
        this.startTime = null;
        this.countdownStartTime = null;
        this.shipVelocity.set(0, 0, 0);
        this.shipAcceleration.set(0, 0, 0);

        // Reset ship to starting point
        this.ship.position.copy(this.trackData.startPoint);

        // Point ship toward the end point
        const direction = new THREE.Vector3()
            .subVectors(this.trackData.endPoint, this.trackData.startPoint)
            .normalize();
        this.ship.rotation.y = Math.atan2(direction.x, direction.z);

        document.getElementById('status').textContent = 'Press ENTER to start';
        document.getElementById('time').textContent = '0.00';

        // Reset all asteroids to their initial positions and velocities
        this.asteroids.forEach((asteroid, index) => {
            if (this.initialAsteroidData[index]) {
                asteroid.position.copy(this.initialAsteroidData[index].position);
                asteroid.userData.velocity.copy(this.initialAsteroidData[index].velocity);
                asteroid.rotation.x = this.initialAsteroidData[index].rotation.x;
                asteroid.rotation.y = this.initialAsteroidData[index].rotation.y;
                asteroid.rotation.z = this.initialAsteroidData[index].rotation.z;
            }
        });

        // Hide all overlays
        document.getElementById('countdown-overlay').classList.remove('show', 'go');
        this.hideCrashScreen();
        this.hideWinScreen();
    }

    updatePhysics(deltaTime) {
        // Handle countdown phase
        if (this.isCountdown) {
            const elapsed = Date.now() - this.countdownStartTime;
            const remaining = Math.ceil((this.countdownDuration - elapsed) / 1000);

            if (remaining > 0) {
                // Update countdown display
                const countdownNumber = document.getElementById('countdown-number');
                if (countdownNumber.textContent !== remaining.toString()) {
                    countdownNumber.textContent = remaining;
                    // Restart animation
                    const overlay = document.getElementById('countdown-overlay');
                    overlay.style.animation = 'none';
                    setTimeout(() => {
                        overlay.style.animation = '';
                    }, 10);
                }

                // Ship stays stationary during countdown
            } else {
                // Countdown finished, show GO!
                const overlay = document.getElementById('countdown-overlay');
                overlay.classList.add('go');
                document.getElementById('countdown-number').textContent = 'GO!';

                // Hide countdown after a short delay and start race
                setTimeout(() => {
                    overlay.classList.remove('show', 'go');
                }, 500);

                this.startRace();
            }
            return;
        }

        if (!this.isRunning || this.isFinished) return;

        // Calculate acceleration from input
        this.shipAcceleration.set(0, 0, 0);

        if (this.keys.ArrowUp) {
            this.shipAcceleration.z -= this.thrustForce;
        }
        if (this.keys.ArrowDown) {
            this.shipAcceleration.z += this.thrustForce;
        }
        if (this.keys.ArrowLeft) {
            this.shipAcceleration.x -= this.thrustForce;
        }
        if (this.keys.ArrowRight) {
            this.shipAcceleration.x += this.thrustForce;
        }

        // Apply brake (space key) - reduces velocity gradually
        if (this.keys[' ']) {
            this.shipVelocity.multiplyScalar(0.95); // 5% reduction per frame
        }

        // Apply acceleration to velocity
        this.shipVelocity.add(this.shipAcceleration);

        // Apply friction
        this.shipVelocity.multiplyScalar(this.friction);

        // Limit max speed
        if (this.shipVelocity.length() > this.maxSpeed) {
            this.shipVelocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Update position
        this.ship.position.add(this.shipVelocity.clone().multiplyScalar(deltaTime * 60));

        // Update ship rotation to face movement direction
        if (this.shipVelocity.length() > 0.1) {
            const direction = this.shipVelocity.clone().normalize();
            this.ship.rotation.y = Math.atan2(direction.x, direction.z);
        }

        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.position.add(
                asteroid.userData.velocity.clone().multiplyScalar(deltaTime * 60)
            );

            // Wrap asteroids around the edges (teleport from one side to the other)
            const halfSize = this.trackData.trackSize / 2;
            if (asteroid.position.x > halfSize) {
                asteroid.position.x = -halfSize;
            } else if (asteroid.position.x < -halfSize) {
                asteroid.position.x = halfSize;
            }

            if (asteroid.position.z > halfSize) {
                asteroid.position.z = -halfSize;
            } else if (asteroid.position.z < -halfSize) {
                asteroid.position.z = halfSize;
            }

            // Rotate asteroids for visual interest
            if (asteroid.userData.rotationSpeed) {
                asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
                asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
                asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
            }
        });

        // Check collision with asteroids
        this.checkCollisions();

        // Check win condition
        const distanceToEnd = this.ship.position.distanceTo(this.trackData.endPoint);
        if (distanceToEnd < 3) {
            this.finishRace();
        }
    }

    checkCollisions() {
        const shipRadius = 1.5;
        this.asteroids.forEach(asteroid => {
            const distance = this.ship.position.distanceTo(asteroid.position);
            const minDistance = shipRadius + asteroid.userData.size;
            if (distance < minDistance) {
                // Collision! Show crash screen
                this.showCrashScreen();
            }
        });
    }

    showCrashScreen() {
        this.isRunning = false;
        this.isFinished = true;
        document.getElementById('crash-screen').classList.add('show');
        document.getElementById('status').textContent = 'Crashed!';
    }

    hideCrashScreen() {
        document.getElementById('crash-screen').classList.remove('show');
    }

    finishRace() {
        if (!this.isFinished) {
            this.isFinished = true;
            this.isRunning = false;
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
            document.getElementById('status').textContent = `Finished! Time: ${elapsed}s`;
            this.showWinScreen(elapsed);
        }
    }

    showWinScreen(time) {
        document.getElementById('win-time').textContent = `Time: ${time}s`;
        document.getElementById('win-screen').classList.add('show');

        // Show score submission form
        this.leaderboardUI.showScoreSubmission(time);
    }

    hideWinScreen() {
        document.getElementById('win-screen').classList.remove('show');
        this.leaderboardUI.resetScoreSubmission();
    }

    updateUI() {
        if (this.isRunning && this.startTime) {
            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
            document.getElementById('time').textContent = elapsed;
        }

        // Update destination arrow
        this.updateDestinationArrow();

        // Update asteroid warnings
        this.updateAsteroidWarnings();
    }
    
    updateDestinationArrow() {
        if (!this.trackData || !this.ship) return;
        
        const arrow = document.getElementById('destination-arrow');
        if (!arrow) return;
        
        // Get end point - ensure it's a Vector3
        let endPoint = this.trackData.endPoint;
        if (!endPoint) return;
        
        // Convert to Vector3 if it's not already
        if (!(endPoint instanceof THREE.Vector3)) {
            endPoint = new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);
        }
        
        // Project end point to screen coordinates
        const vector = endPoint.clone().project(this.camera);
        
        // Check if end point is visible on screen (within viewport)
        const isVisible = vector.z > 0 && 
                         vector.x >= -1 && vector.x <= 1 && 
                         vector.y >= -1 && vector.y <= 1;
        
        if (isVisible) {
            arrow.style.display = 'none';
        } else {
            arrow.style.display = 'block';
            
            // Calculate direction from ship to destination
            const shipPos = this.ship.position;
            const direction = new THREE.Vector3(
                endPoint.x - shipPos.x,
                0,
                endPoint.z - shipPos.z
            ).normalize();
            
            // Calculate angle for arrow rotation (in degrees)
            const angle = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
            
            // Position arrow at edge of screen pointing toward destination
            const edgeDistance = 60;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // Calculate which edge the arrow should be on
            let arrowX, arrowY;

            // Determine which edge based on direction
            if (Math.abs(direction.x) > Math.abs(direction.z)) {
                // Horizontal edge (left or right)
                arrowX = direction.x > 0 ? window.innerWidth - edgeDistance : edgeDistance;
                // Position vertically based on z direction
                arrowY = centerY - (direction.z * (centerY - edgeDistance));
            } else {
                // Vertical edge (top or bottom)
                arrowY = direction.z > 0 ? window.innerHeight - edgeDistance : edgeDistance;
                // Position horizontally based on x direction
                arrowX = centerX + (direction.x * (centerX - edgeDistance));
            }

            // Clamp to screen bounds
            arrowX = Math.max(edgeDistance, Math.min(window.innerWidth - edgeDistance, arrowX));
            arrowY = Math.max(edgeDistance, Math.min(window.innerHeight - edgeDistance, arrowY));

            arrow.style.left = (arrowX - 40) + 'px'; // Center the arrow (80px wide)
            arrow.style.top = (arrowY - 40) + 'px'; // Center the arrow (80px tall)
            arrow.style.transform = `rotate(${angle}deg)`;
        }
    }

    updateAsteroidWarnings() {
        if (!this.ship || !this.isRunning) {
            document.getElementById('asteroid-warnings').innerHTML = '';
            return;
        }

        const warningsContainer = document.getElementById('asteroid-warnings');
        const warningThreshold = 60; // Distance threshold in game units to show warning
        const nearbyAsteroids = [];

        // Find asteroids that are nearby but off-screen
        this.asteroids.forEach(asteroid => {
            const distance = this.ship.position.distanceTo(asteroid.position);

            // Check if asteroid is within warning range
            if (distance < warningThreshold) {
                // Project asteroid to screen coordinates
                const vector = asteroid.position.clone().project(this.camera);

                // Check if asteroid is off-screen
                const isOffScreen = vector.z <= 0 ||
                                   vector.x < -1 || vector.x > 1 ||
                                   vector.y < -1 || vector.y > 1;

                if (isOffScreen) {
                    nearbyAsteroids.push({
                        asteroid,
                        distance,
                        size: asteroid.userData.size
                    });
                }
            }
        });

        // Clear existing warnings
        warningsContainer.innerHTML = '';

        // Create warning indicators for nearby off-screen asteroids (limit to 5 most urgent)
        nearbyAsteroids
            .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
            .slice(0, 5) // Only show top 5
            .forEach(({ asteroid }) => {
                const warning = document.createElement('div');
                warning.className = 'asteroid-warning';

                // Calculate direction from ship to asteroid
                const shipPos = this.ship.position;
                const direction = new THREE.Vector3(
                    asteroid.position.x - shipPos.x,
                    0,
                    asteroid.position.z - shipPos.z
                ).normalize();

                // Position warning at edge of screen
                const edgeDistance = 30;
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;

                let warningX, warningY;
                let edgeClass = '';

                // Determine which edge based on direction and add appropriate class
                if (Math.abs(direction.x) > Math.abs(direction.z)) {
                    // Horizontal edge (left or right)
                    if (direction.x > 0) {
                        warningX = window.innerWidth - edgeDistance;
                        edgeClass = 'edge-right';
                    } else {
                        warningX = edgeDistance;
                        edgeClass = 'edge-left';
                    }
                    warningY = centerY - (direction.z * (centerY - edgeDistance * 2));
                } else {
                    // Vertical edge (top or bottom)
                    if (direction.z > 0) {
                        warningY = window.innerHeight - edgeDistance;
                        edgeClass = 'edge-bottom';
                    } else {
                        warningY = edgeDistance;
                        edgeClass = 'edge-top';
                    }
                    warningX = centerX + (direction.x * (centerX - edgeDistance * 2));
                }

                // Clamp to screen bounds
                warningX = Math.max(edgeDistance, Math.min(window.innerWidth - edgeDistance, warningX));
                warningY = Math.max(edgeDistance, Math.min(window.innerHeight - edgeDistance, warningY));

                warning.classList.add(edgeClass);
                warning.style.left = warningX + 'px';
                warning.style.top = warningY + 'px';
                warning.style.width = '60px';
                warning.style.height = '60px';

                warningsContainer.appendChild(warning);
            });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60fps

        this.updatePhysics(deltaTime);
        this.updateUI();

        // Camera follows ship (top-down view) - zoomed in
        if (this.ship) {
            this.camera.position.x = this.ship.position.x;
            this.camera.position.y = 50; // Lower height = more zoom (was 80)
            this.camera.position.z = this.ship.position.z + 20; // Closer follow distance (was 30)
            this.camera.lookAt(this.ship.position);
        }

        this.renderer.render(this.scene, this.camera);
    }

    start() {
        // Game is already initialized and animating
    }
}

