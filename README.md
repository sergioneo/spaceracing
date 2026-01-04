# Space Racing

A physics-based asteroid racing game where you navigate from a start point to an end point through a field of moving asteroids.

## Features

- **Realistic Physics**: Acceleration-based movement - pressing arrow keys applies force, not instant velocity changes
- **Dynamic Tracks**: Each track is generated from a codeword, creating unique asteroid patterns
- **3D Graphics**: Simplified 3D graphics using Three.js with top-down view
- **URL-based Tracks**: Access different tracks via URL parameter (e.g., `/KESSEL`)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
   - `http://localhost:3000/KESSEL` - Default track
   - `http://localhost:3000/YOURTRACK` - Any track name you want

## Controls

- **Arrow Keys**: Apply thrust in that direction
- **Space**: Reset the race

## How It Works

Each track codeword is used as a seed to generate:
- Number of asteroids (based on codeword length)
- Asteroid positions
- Asteroid speeds and directions (based on character codes)
- Asteroid sizes

The same codeword will always generate the same track, making it shareable and reproducible.

