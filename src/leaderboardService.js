import { database } from './firebaseConfig.js';
import { ref, push, set, query, orderByChild, limitToFirst, get } from 'firebase/database';
import { detectPlatform } from './platformDetection.js';

/**
 * Leaderboard data structure in Firebase:
 * /leaderboards/{trackName}/{platform}/{entryId}
 *   - playerName: string
 *   - time: number (in seconds)
 *   - timestamp: number
 *   - platform: string ('pc' or 'mobile')
 */

/**
 * Submits a score to the leaderboard
 * @param {string} trackName - Name of the track
 * @param {string} playerName - Player's name
 * @param {number} time - Time in seconds
 * @returns {Promise<void>}
 */
export async function submitScore(trackName, playerName, time) {
    try {
        const platform = detectPlatform();
        const timestamp = Date.now();

        // Create reference to the leaderboard for this track and platform
        const leaderboardRef = ref(database, `leaderboards/${trackName}/${platform}`);

        // Create a new entry
        const newEntryRef = push(leaderboardRef);

        await set(newEntryRef, {
            playerName: playerName.trim(),
            time: parseFloat(time),
            timestamp: timestamp,
            platform: platform
        });

        console.log('Score submitted successfully');
        return true;
    } catch (error) {
        console.error('Error submitting score:', error);
        throw error;
    }
}

/**
 * Fetches top scores for a specific track and platform
 * @param {string} trackName - Name of the track
 * @param {string} platform - Platform ('pc' or 'mobile')
 * @param {number} limit - Number of top scores to fetch (default: 10)
 * @returns {Promise<Array>} Array of score objects
 */
export async function getTopScores(trackName, platform, limit = 10) {
    try {
        const leaderboardRef = ref(database, `leaderboards/${trackName}/${platform}`);
        const topScoresQuery = query(
            leaderboardRef,
            orderByChild('time'),
            limitToFirst(limit)
        );

        const snapshot = await get(topScoresQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Sort by time ascending (lowest time first)
        scores.sort((a, b) => a.time - b.time);

        return scores;
    } catch (error) {
        console.error('Error fetching scores:', error);
        throw error;
    }
}

/**
 * Fetches top scores for both platforms
 * @param {string} trackName - Name of the track
 * @param {number} limit - Number of top scores per platform (default: 10)
 * @returns {Promise<Object>} Object with 'pc' and 'mobile' arrays
 */
export async function getAllPlatformScores(trackName, limit = 10) {
    try {
        const [pcScores, mobileScores] = await Promise.all([
            getTopScores(trackName, 'pc', limit),
            getTopScores(trackName, 'mobile', limit)
        ]);

        return {
            pc: pcScores,
            mobile: mobileScores
        };
    } catch (error) {
        console.error('Error fetching all platform scores:', error);
        throw error;
    }
}

/**
 * Gets player's rank for a specific score
 * @param {string} trackName - Name of the track
 * @param {string} platform - Platform ('pc' or 'mobile')
 * @param {number} time - Player's time
 * @returns {Promise<number>} Player's rank (1-based)
 */
export async function getPlayerRank(trackName, platform, time) {
    try {
        const scores = await getTopScores(trackName, platform, 1000); // Fetch more to calculate rank
        const rank = scores.findIndex(score => score.time >= time) + 1;
        return rank > 0 ? rank : scores.length + 1;
    } catch (error) {
        console.error('Error getting player rank:', error);
        return -1;
    }
}
