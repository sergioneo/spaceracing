import * as THREE from 'three';
import { Game } from './game.js';
import { TrackGenerator } from './trackGenerator.js';

// Get track name from URL
function getTrackNameFromURL() {
    const path = window.location.pathname;
    // Remove leading/trailing slashes and get the last segment
    const segments = path.split('/').filter(s => s);
    return segments.length > 0 ? segments[segments.length - 1] : 'KESSEL';
}

const trackName = getTrackNameFromURL();

// Initialize game
const container = document.getElementById('game-container');
const game = new Game(container, trackName);

game.start();

