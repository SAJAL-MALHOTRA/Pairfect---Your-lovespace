"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";

interface Outfit {
  top_style: string;
  top_color: string;
  bottom_style: string;
  bottom_color: string;
  shoes_style: string;
  shoes_color: string;
}

interface AvatarSceneProps {
  userOutfit: Outfit;
  partnerOutfit: Outfit | null;
  userName: string;
  partnerName: string | null;
}

function MinecraftFigure({ 
  outfit, 
  position, 
  skinColor = "#f5cac3" // default skin tone
}: { 
  outfit: Outfit; 
  position: [number, number, number];
  skinColor?: string;
}) {
  const { top_style, top_color, bottom_style, bottom_color, shoes_style, shoes_color } = outfit;

  // Joint Angles (Minecraft static toy poses)
  const leftArmAngle: [number, number, number] = [0.1, 0, 0.15];  // Slightly forward & out
  const rightArmAngle: [number, number, number] = [-0.1, 0, -0.15]; // Slightly backward & out
  const leftLegAngle: [number, number, number] = [0.05, 0, 0];    // Slight forward step
  const rightLegAngle: [number, number, number] = [-0.05, 0, 0];  // Slight backward step

  return (
    <group position={position}>
      
      {/* ================= HEAD & FACE ================= */}
      <group position={[0, 1.15, 0]}>
        {/* Base Head (Steve-style cube) */}
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.48, 0.48]} />
          <meshStandardMaterial color={skinColor} roughness={0.65} />
        </mesh>
        
        {/* Hair Cap Overlay (snug fit) */}
        <mesh position={[0, 0.08, -0.02]} castShadow>
          <boxGeometry args={[0.52, 0.36, 0.52]} />
          <meshStandardMaterial 
            color="#451a03" 
            roughness={0.8} 
            polygonOffset 
            polygonOffsetFactor={-1} 
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Double Block Buns (cozy details) */}
        <mesh position={[-0.18, 0.22, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh position={[0.18, 0.22, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>

        {/* Face Features (flat overlays on front face to prevent z-fighting) */}
        {/* Left Eye */}
        <mesh position={[-0.1, 0.05, 0.241]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#111827" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
        {/* Right Eye */}
        <mesh position={[0.1, 0.05, 0.241]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#111827" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>

        {/* Left Cheek Blush */}
        <mesh position={[-0.14, -0.03, 0.241]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.6} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
        {/* Right Cheek Blush */}
        <mesh position={[0.14, -0.03, 0.241]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.6} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>

        {/* Smiling Mouth */}
        <mesh position={[0, -0.07, 0.241]}>
          <boxGeometry args={[0.12, 0.04, 0.01]} />
          <meshBasicMaterial color="#111827" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      </group>


      {/* ================= TORSO & SHIRT ================= */}
      {/* Base Torso */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.6, 0.2]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Shirt/Torso Clothing Overlay */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.61, 0.26]} />
        <meshStandardMaterial 
          color={top_color} 
          roughness={0.75} 
          polygonOffset 
          polygonOffsetFactor={-1} 
          polygonOffsetUnits={-1} 
        />
      </mesh>

      {/* hoodie hood overlay behind head */}
      {top_style === "hoodie" && (
        <mesh position={[0, 0.9, -0.15]} castShadow>
          <boxGeometry args={[0.3, 0.26, 0.16]} />
          <meshStandardMaterial color={top_color} roughness={0.75} />
        </mesh>
      )}

      {/* collared shirt collar overlay */}
      {top_style === "collared" && (
        <mesh position={[0, 0.91, 0]}>
          <boxGeometry args={[0.22, 0.03, 0.24]} />
          <meshStandardMaterial color={top_color} roughness={0.75} />
        </mesh>
      )}


      {/* ================= ARMS & SLEEVES ================= */}
      {/* Left Arm Pivot (Shoulder Joint) */}
      <group position={[-0.26, 0.85, 0]} rotation={leftArmAngle}>
        {/* Base Arm Mesh */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Sleeve Overlay */}
        {top_style === "hoodie" || top_style === "collared" ? (
          // Long sleeve covers full arm
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.18, 0.51, 0.18]} />
            <meshStandardMaterial 
              color={top_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        ) : (
          // Short sleeve covers only upper arm segment
          <mesh position={[0, -0.08, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial 
              color={top_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        )}
      </group>

      {/* Right Arm Pivot (Shoulder Joint) */}
      <group position={[0.26, 0.85, 0]} rotation={rightArmAngle}>
        {/* Base Arm Mesh */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Sleeve Overlay */}
        {top_style === "hoodie" || top_style === "collared" ? (
          // Long sleeve
          <mesh position={[0, -0.25, 0]} castShadow>
            <boxGeometry args={[0.18, 0.51, 0.18]} />
            <meshStandardMaterial 
              color={top_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        ) : (
          // Short sleeve
          <mesh position={[0, -0.08, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial 
              color={top_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        )}
      </group>


      {/* ================= LEGS & PANTS ================= */}
      {/* Left Leg Pivot (Hip Joint) */}
      <group position={[-0.1, 0.3, 0]} rotation={leftLegAngle}>
        {/* Base Leg Mesh */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Pants Overlay */}
        {bottom_style === "pants" ? (
          // Full pants cover shin
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.22, 0.44, 0.22]} />
            <meshStandardMaterial 
              color={bottom_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        ) : (
          // Shorts cover upper thigh only
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.22, 0.2, 0.22]} />
            <meshStandardMaterial 
              color={bottom_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        )}

        {/* Shoes */}
        <mesh position={[0, -0.46, 0.02]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.22]} />
          <meshStandardMaterial 
            color={shoes_color} 
            roughness={0.8} 
            polygonOffset 
            polygonOffsetFactor={-2} 
            polygonOffsetUnits={-2} 
          />
        </mesh>
      </group>

      {/* Right Leg Pivot (Hip Joint) */}
      <group position={[0.1, 0.3, 0]} rotation={rightLegAngle}>
        {/* Base Leg Mesh */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Pants Overlay */}
        {bottom_style === "pants" ? (
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.22, 0.44, 0.22]} />
            <meshStandardMaterial 
              color={bottom_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        ) : (
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.22, 0.2, 0.22]} />
            <meshStandardMaterial 
              color={bottom_color} 
              roughness={0.75} 
              polygonOffset 
              polygonOffsetFactor={-1} 
              polygonOffsetUnits={-1} 
            />
          </mesh>
        )}

        {/* Shoes */}
        <mesh position={[0, -0.46, 0.02]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.22]} />
          <meshStandardMaterial 
            color={shoes_color} 
            roughness={0.8} 
            polygonOffset 
            polygonOffsetFactor={-2} 
            polygonOffsetUnits={-2} 
          />
        </mesh>
      </group>

    </group>
  );
}

export default function AvatarScene({ 
  userOutfit, 
  partnerOutfit,
  userName,
  partnerName 
}: AvatarSceneProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas 
        shadows 
        camera={{ position: [0, 0.8, 2.5], fov: 40 }}
        gl={{ preserveDrawingBuffer: true }} // critical for taking snapshots via canvas.toDataURL()
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#faf8f6"]} />
        
        {/* Soft studio lighting */}
        <ambientLight intensity={1.1} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.4} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <directionalLight position={[-5, 5, -2]} intensity={0.4} />
        <pointLight position={[0, 3, 2]} intensity={0.3} />

        {/* Figures grouped inside scene */}
        <group position={[0, -0.5, 0]}>
          {/* User's Voxel Rig (Left) */}
          <MinecraftFigure 
            outfit={userOutfit} 
            position={partnerOutfit ? [-0.35, 0, 0] : [0, 0, 0]} 
            skinColor="#f5cac3" // Warm peach
          />

          {/* Partner's Voxel Rig (Right) */}
          {partnerOutfit && (
            <MinecraftFigure 
              outfit={partnerOutfit} 
              position={[0.35, 0, 0]} 
              skinColor="#eddcd2" // Sand tone
            />
          )}

          {/* Ambient Contact Shadows */}
          <ContactShadows 
            position={[0, -0.5, 0]} 
            opacity={0.6} 
            scale={4} 
            blur={2.0} 
            far={1.2} 
          />
        </group>

        {/* Orbit Controls (constrained to horizontal spin only) */}
        <OrbitControls 
          enableZoom={true}
          minDistance={1.5}
          maxDistance={4.5}
          minPolarAngle={Math.PI / 2} // locked vertically
          maxPolarAngle={Math.PI / 2} // locked vertically
          target={[0, 0.4, 0]}
        />
      </Canvas>

      {/* Floating labels */}
      <div className="absolute top-4 left-0 right-0 flex justify-center space-x-12 pointer-events-none select-none text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
        <div className="bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {userName}
        </div>
        {partnerName && (
          <div className="bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {partnerName}
          </div>
        )}
      </div>
    </div>
  );
}
