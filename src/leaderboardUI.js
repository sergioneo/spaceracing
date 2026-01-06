import { submitScore, getAllPlatformScores } from './leaderboardService.js';
import { getPlatformName } from './platformDetection.js';

export class LeaderboardUI {
    constructor(trackName) {
        this.trackName = trackName;
        this.currentTime = null;
        this.scoreSubmitted = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Submit score button
        const submitBtn = document.getElementById('submit-score-btn');
        submitBtn.addEventListener('click', () => this.handleScoreSubmit());

        // Allow Enter key to submit
        const playerNameInput = document.getElementById('player-name');
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleScoreSubmit();
            }
        });

        // Listen for leaderboard show event from menu
        document.addEventListener('showLeaderboard', () => this.showLeaderboard());

        // Close leaderboard button
        const closeBtn = document.getElementById('close-leaderboard');
        closeBtn.addEventListener('click', () => this.hideLeaderboard());
    }

    /**
     * Shows the score submission form with the race time
     * @param {number} time - Race completion time in seconds
     */
    showScoreSubmission(time) {
        this.currentTime = time;
        this.scoreSubmitted = false;

        // Reset form
        const playerNameInput = document.getElementById('player-name');
        const submitBtn = document.getElementById('submit-score-btn');
        const statusDiv = document.getElementById('submission-status');

        playerNameInput.value = '';
        playerNameInput.disabled = false;
        submitBtn.disabled = false;
        statusDiv.textContent = `Platform: ${getPlatformName()}`;
        statusDiv.style.color = '#0ff';

        // Show the score submission section
        document.getElementById('score-submission').style.display = 'block';
    }

    /**
     * Handles score submission
     */
    async handleScoreSubmit() {
        const playerNameInput = document.getElementById('player-name');
        const submitBtn = document.getElementById('submit-score-btn');
        const statusDiv = document.getElementById('submission-status');

        const playerName = playerNameInput.value.trim();

        // Validation
        if (!playerName) {
            statusDiv.textContent = 'Please enter your name';
            statusDiv.style.color = '#ff6600';
            return;
        }

        if (playerName.length < 2) {
            statusDiv.textContent = 'Name must be at least 2 characters';
            statusDiv.style.color = '#ff6600';
            return;
        }

        // Disable form while submitting
        playerNameInput.disabled = true;
        submitBtn.disabled = true;
        statusDiv.textContent = 'Submitting...';
        statusDiv.style.color = '#0ff';

        try {
            await submitScore(this.trackName, playerName, this.currentTime);
            statusDiv.textContent = '✓ Score saved successfully!';
            statusDiv.style.color = '#00ff00';
            this.scoreSubmitted = true;

            // Auto-show leaderboard after submission
            setTimeout(() => {
                this.showLeaderboard();
            }, 1500);
        } catch (error) {
            console.error('Error submitting score:', error);
            statusDiv.textContent = '✗ Error saving score. Please check Firebase config.';
            statusDiv.style.color = '#ff0000';
            playerNameInput.disabled = false;
            submitBtn.disabled = false;
        }
    }

    /**
     * Shows the leaderboard screen
     */
    async showLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        const trackNameSpan = document.querySelector('#leaderboard-track span');

        trackNameSpan.textContent = this.trackName;
        leaderboardScreen.classList.add('show');

        // Load leaderboard data
        await this.loadLeaderboards();
    }

    /**
     * Hides the leaderboard screen
     */
    hideLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        leaderboardScreen.classList.remove('show');
    }

    /**
     * Loads and displays leaderboard data
     */
    async loadLeaderboards() {
        const pcLeaderboardDiv = document.getElementById('pc-leaderboard');
        const mobileLeaderboardDiv = document.getElementById('mobile-leaderboard');

        // Show loading state
        pcLeaderboardDiv.innerHTML = '<div class="leaderboard-empty">Loading...</div>';
        mobileLeaderboardDiv.innerHTML = '<div class="leaderboard-empty">Loading...</div>';

        try {
            const scores = await getAllPlatformScores(this.trackName, 10);

            // Render PC leaderboard
            this.renderLeaderboard(pcLeaderboardDiv, scores.pc);

            // Render Mobile leaderboard
            this.renderLeaderboard(mobileLeaderboardDiv, scores.mobile);
        } catch (error) {
            console.error('Error loading leaderboards:', error);
            pcLeaderboardDiv.innerHTML = '<div class="leaderboard-empty">Error loading leaderboard</div>';
            mobileLeaderboardDiv.innerHTML = '<div class="leaderboard-empty">Error loading leaderboard</div>';
        }
    }

    /**
     * Renders a leaderboard list
     * @param {HTMLElement} container - Container element
     * @param {Array} scores - Array of score objects
     */
    renderLeaderboard(container, scores) {
        if (!scores || scores.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
            return;
        }

        let html = '';
        scores.forEach((score, index) => {
            const rank = index + 1;
            const topClass = rank <= 3 ? `top-${rank}` : '';

            html += `
                <div class="leaderboard-entry ${topClass}">
                    <div class="entry-rank">${rank}</div>
                    <div class="entry-name">${this.escapeHtml(score.playerName)}</div>
                    <div class="entry-time">${score.time.toFixed(2)}s</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Escapes HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Resets the score submission form
     */
    resetScoreSubmission() {
        this.currentTime = null;
        this.scoreSubmitted = false;
        document.getElementById('score-submission').style.display = 'none';
    }
}
