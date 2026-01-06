import { detectPlatform } from './platformDetection.js';

/**
 * Mobile Controls Handler
 * Provides touch-based controls for mobile devices
 */
export class MobileControls {
    constructor(game) {
        this.game = game;
        this.activeButtons = new Set();
        this.isMobile = detectPlatform() === 'mobile';

        this.init();
    }

    init() {
        // Show mobile controls on mobile devices
        if (this.isMobile) {
            document.getElementById('mobile-controls').classList.add('show');
        }

        // Setup touch event listeners for all control buttons
        this.setupDPad();
        this.setupActionButtons();

        // Prevent default touch behaviors on control elements
        this.preventDefaultTouch();
    }

    setupDPad() {
        const dpadButtons = document.querySelectorAll('.dpad-btn');

        dpadButtons.forEach(button => {
            const key = button.dataset.key;
            if (!key) return;

            // Touch start - simulate key down
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonDown(key);
                button.classList.add('active');
            }, { passive: false });

            // Touch end - simulate key up
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonUp(key);
                button.classList.remove('active');
            }, { passive: false });

            // Touch cancel (when touch is interrupted)
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleButtonUp(key);
                button.classList.remove('active');
            }, { passive: false });

            // Mouse events for testing on desktop
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleButtonDown(key);
            });

            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleButtonUp(key);
            });

            button.addEventListener('mouseleave', (e) => {
                this.handleButtonUp(key);
            });
        });
    }

    setupActionButtons() {
        const actionButtons = document.querySelectorAll('.action-btn');

        actionButtons.forEach(button => {
            const key = button.dataset.key;
            if (!key) return;

            // For action buttons, we trigger on press (not hold)
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonPress(key);
                button.classList.add('active');
                setTimeout(() => button.classList.remove('active'), 200);
            }, { passive: false });

            // Mouse events for testing on desktop
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleButtonPress(key);
            });
        });
    }

    handleButtonDown(key) {
        if (this.activeButtons.has(key)) return;

        this.activeButtons.add(key);

        // Update game's key state directly
        if (this.game.keys.hasOwnProperty(key)) {
            this.game.keys[key] = true;
        }
    }

    handleButtonUp(key) {
        this.activeButtons.delete(key);

        // Update game's key state directly
        if (this.game.keys.hasOwnProperty(key)) {
            this.game.keys[key] = false;
        }
    }

    handleButtonPress(key) {
        // For action buttons (Enter, Escape), trigger the action once
        if (key === 'Enter') {
            if (!this.game.isRunning && !this.game.isFinished && !this.game.isCountdown) {
                this.game.startCountdown();
            }
        } else if (key === 'Escape') {
            this.game.resetRace();
        } else if (key === ' ') {
            // Brake - toggle on/off
            this.handleButtonDown(key);
            setTimeout(() => this.handleButtonUp(key), 100);
        }
    }

    preventDefaultTouch() {
        // Prevent default touch behaviors on mobile controls to avoid scrolling
        const mobileControls = document.getElementById('mobile-controls');

        mobileControls.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        mobileControls.addEventListener('touchstart', (e) => {
            // Prevent zoom on double tap
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * Release all active buttons (useful for cleanup)
     */
    releaseAll() {
        this.activeButtons.forEach(key => {
            this.handleButtonUp(key);
        });
    }

    /**
     * Show mobile controls
     */
    show() {
        document.getElementById('mobile-controls').classList.add('show');
    }

    /**
     * Hide mobile controls
     */
    hide() {
        document.getElementById('mobile-controls').classList.remove('show');
        this.releaseAll();
    }
}
