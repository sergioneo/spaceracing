/**
 * Generates track data from a codeword
 * The codeword is used as a seed to deterministically generate asteroid positions and speeds
 */
export class TrackGenerator {
    constructor(codeword) {
        this.codeword = codeword.toUpperCase();
        this.seed = this.hashCode(codeword);
    }

    /**
     * Simple hash function to convert codeword to number
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Simple seeded random number generator
     */
    seededRandom() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    /**
     * Calculate distance between two points
     */
    distance(x1, z1, x2, z2) {
        return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
    }

    /**
     * Generate track configuration from codeword
     * Returns: { asteroidCount, asteroids: [{ position, velocity, size }] }
     */
    generateTrack() {
        // Use codeword length and characters to determine asteroid count
        const baseCount = 150 + (this.codeword.length * 10);
        const asteroidCount = Math.min(baseCount, 300); // Increased cap to 300

        const asteroids = [];
        const trackSize = 2000; // Much larger area to prevent visible wrapping
        const minDistance = 15; // Minimum distance from start/end

        // Start and end points (plain objects, will be converted to Vector3 in game.js)
        const startPoint = { x: -trackSize / 2, y: 0, z: -trackSize / 2 };
        const endPoint = { x: trackSize / 2, y: 0, z: trackSize / 2 };

        for (let i = 0; i < asteroidCount; i++) {
            // Generate position (avoid start and end areas)
            let position;
            let attempts = 0;
            do {
                const x = (this.seededRandom() - 0.5) * trackSize;
                const z = (this.seededRandom() - 0.5) * trackSize;
                position = { x, y: 0, z };
                attempts++;
            } while (
                attempts < 50 && (
                    this.distance(position.x, position.z, startPoint.x, startPoint.z) < minDistance ||
                    this.distance(position.x, position.z, endPoint.x, endPoint.z) < minDistance
                )
            );

            // Generate velocity based on codeword characters
            const charIndex = i % this.codeword.length;
            const charCode = this.codeword.charCodeAt(charIndex);
            const speedMultiplier = (charCode % 100) / 100; // 0-1 range
            
            // More varied speeds - some very slow, some fast
            // Use a distribution that favors slower speeds but has some fast ones
            const speedDistribution = this.seededRandom();
            let baseSpeed;
            if (speedDistribution < 0.4) {
                // 40% are slow (0.05 to 0.2)
                baseSpeed = 0.05 + speedMultiplier * 0.15;
            } else if (speedDistribution < 0.8) {
                // 40% are medium (0.2 to 0.5)
                baseSpeed = 0.2 + speedMultiplier * 0.3;
            } else {
                // 20% are fast (0.5 to 1.0)
                baseSpeed = 0.5 + speedMultiplier * 0.5;
            }

            // Direction based on character
            const angle = (charCode * (i + 1)) % 360;
            const dirX = Math.cos(angle * Math.PI / 180);
            const dirZ = Math.sin(angle * Math.PI / 180);

            const velocity = {
                x: dirX * baseSpeed,
                y: 0,
                z: dirZ * baseSpeed
            };

            // Size variation - make asteroids bigger and more varied
            // 10% chance of really big asteroids
            const sizeRoll = this.seededRandom();
            let size;
            if (sizeRoll < 0.1) {
                // 10% are huge (10-15 units)
                size = 10 + this.seededRandom() * 5;
            } else if (sizeRoll < 0.3) {
                // 20% are large (6-10 units)
                size = 6 + this.seededRandom() * 4;
            } else {
                // 70% are normal (2-6 units)
                size = 2 + this.seededRandom() * 4;
            }

            asteroids.push({
                position: position,
                velocity: velocity,
                size: size
            });
        }

        // Calculate sectors - divide track into a grid
        const sectorSize = 200; // Each sector is 200 units
        const sectorsPerSide = Math.ceil(trackSize / sectorSize);

        return {
            asteroidCount,
            asteroids,
            startPoint,
            endPoint,
            trackSize,
            sectorSize,
            sectorsPerSide
        };
    }
}

