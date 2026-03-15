// frontend/src/avatar/visemeController.ts
// Maps common TTS phonemes/timings to ARKit Viseme identifiers.

export type VisemeTiming = {
  viseme: string;
  durationMs: number;
};

// Simplified mapping: generic phoneme hints to Apple ARKit morph targets.
const ARKitMapping: Record<string, string> = {
  "A": "jawOpen",
  "O": "mouthFunnel",
  "E": "mouthSmile",
  "U": "mouthPucker",
  "P": "mouthPress",
  "default": "mouthClose"
};

export const applyViseme = (
  nodes: any, 
  visemeKey: string, 
  weight: number
) => {
  const target = ARKitMapping[visemeKey] || ARKitMapping["default"];
  // Assuming 'nodes.Wolf3D_Head' is the mesh with morph targets (Standard for RPM avatars)
  const headMesh = nodes.Wolf3D_Head; 
  if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
    const index = headMesh.morphTargetDictionary[target];
    if (index !== undefined) {
      // Linearly interpolate to weight for smoothness in a real loop
      headMesh.morphTargetInfluences[index] = weight;
    }
  }
};
