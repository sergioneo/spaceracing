# 3D Models for Space Racing

## Current Implementation

The game currently uses **procedural generation** for both the ship and asteroids:
- **Ship**: Built from Three.js primitives (cylinders, spheres, boxes) combined into a Group
- **Asteroids**: Generated using IcosahedronGeometry with random noise deformation

## 3D Model Formats for Three.js

If you want to use external 3D models, here are the supported formats:

### Recommended Formats

1. **GLTF/GLB** (`.gltf` or `.glb`) - **BEST CHOICE**
   - Modern, efficient format
   - Supports animations, materials, textures
   - Small file sizes
   - Use `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`
   - Example:
     ```javascript
     import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
     const loader = new GLTFLoader();
     loader.load('models/ship.glb', (gltf) => {
         this.ship = gltf.scene;
         this.scene.add(this.ship);
     });
     ```

2. **OBJ** (`.obj`)
   - Simple, widely supported
   - Text format, easy to edit
   - Use `OBJLoader` from `three/examples/jsm/loaders/OBJLoader.js`
   - Note: Doesn't include materials (need separate MTL file)

3. **FBX** (`.fbx`)
   - Good for animations
   - Use `FBXLoader` from `three/examples/jsm/loaders/FBXLoader.js`

### Getting 3D Models

**Using ChatGPT/Claude:**
- Ask for: "Generate a simple spaceship 3D model in GLTF format"
- Or: "Create a low-poly asteroid model in OBJ format"
- They can generate the text-based formats (OBJ, PLY) directly

**Free Model Sources:**
- **Sketchfab** (sketchfab.com) - Many free models
- **Poly Haven** (polyhaven.com) - Free assets
- **TurboSquid** (turbosquid.com) - Mix of free and paid
- **Blender** - Free 3D software to create your own

**Creating Models:**
- **Blender** (free) - Full-featured 3D modeling
- **Tinkercad** (free, web-based) - Simple modeling
- **Spline** (spline.design) - Web-based 3D design

## Procedural vs External Models

**Procedural (Current):**
- ✅ No file loading
- ✅ Infinite variety
- ✅ Small code size
- ✅ Fast generation
- ❌ Less detailed
- ❌ Limited customization

**External Models:**
- ✅ Highly detailed
- ✅ Professional look
- ✅ Can use textures
- ❌ File loading time
- ❌ Larger file sizes
- ❌ Need to find/create models

## Recommendation

For this game, **procedural generation is perfect** because:
1. Each track generates unique asteroids
2. No loading delays
3. Easy to tweak and customize
4. Works well for the top-down view

If you want more detail, you could:
- Enhance the procedural ship with more parts
- Add texture maps to procedural asteroids
- Use simple GLTF models for special effects


