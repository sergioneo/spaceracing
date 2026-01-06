import * as THREE from 'three';
import { Game } from './game.js';
import { TrackGenerator } from './trackGenerator.js';
import { detectPlatform } from './platformDetection.js';

// Get track name from URL
function getTrackNameFromURL() {
    const path = window.location.pathname;
    // Remove leading/trailing slashes and get the last segment
    const segments = path.split('/').filter(s => s);
    return segments.length > 0 ? segments[segments.length - 1] : 'KESSEL';
}

// Update controls display based on platform
function updateControlsDisplay() {
    const isMobile = detectPlatform() === 'mobile';
    const controlsDiv = document.getElementById('controls');

    if (isMobile) {
        // Update text for mobile
        document.getElementById('control-start').textContent = 'Tap START to begin';
        document.getElementById('control-arrows').textContent = 'Use D-Pad to navigate';
        document.getElementById('control-brake').textContent = 'Tap BRAKE to slow down';
        document.getElementById('control-reset').textContent = 'Tap RESET to restart';
    }
}

const trackName = getTrackNameFromURL();

// Update controls display
updateControlsDisplay();

// Menu toggle functionality
function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuPanel = document.getElementById('menu-panel');
    const menuLeaderboardBtn = document.getElementById('menu-leaderboard-btn');

    // Toggle menu on button click
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        menuPanel.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            menuPanel.classList.remove('open');
        }
    });

    // Handle leaderboard button click
    menuLeaderboardBtn.addEventListener('click', () => {
        // Close menu
        menuToggle.classList.remove('active');
        menuPanel.classList.remove('open');

        // Trigger leaderboard (will be handled by leaderboardUI)
        const event = new CustomEvent('showLeaderboard');
        document.dispatchEvent(event);
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
            menuToggle.classList.remove('active');
            menuPanel.classList.remove('open');
        }
    });
}

// Initialize menu
setupMenuToggle();

// Initialize game
const container = document.getElementById('game-container');
const game = new Game(container, trackName);

game.start();

