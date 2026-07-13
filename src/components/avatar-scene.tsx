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

function ToyFigure({ 
  outfit, 
  position, 
  genderColor = "#f5cac3" // default skin tone
}: { 
  outfit: Outfit; 
  position: [number, number, number];
  genderColor?: string;
}) {
  const { top_style, top_color, bottom_style, bottom_color, shoes_style, shoes_color } = outfit;

  return (
    <group position={position}>
      {/* 1. Hair & Head */}
      {/* Head */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={genderColor} roughness={0.6} />
      </mesh>
      
      {/* Hair Cap */}
      <mesh position={[0, 1.5, -0.03]} castShadow>
        <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>

      {/* Hair Buns / Extra Detail (playful toy look) */}
      <mesh position={[-0.15, 1.62, -0.05]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 1.62, -0.05]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>

      {/* Face Features */}
      {/* Eyes */}
      <mesh position={[-0.07, 1.48, 0.17]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0.07, 1.48, 0.17]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#111827" />
      </mesh>

      {/* Blushing cheeks */}
      <mesh position={[-0.12, 1.41, 0.15]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.12, 1.41, 0.15]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.5} />
      </mesh>

      {/* 2. Torso (Shirt / Hoodie) */}
      {/* Upper Torso */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.14, 0.5, 16]} />
        <meshStandardMaterial color={top_color} roughness={0.7} />
      </mesh>

      {/* V-neck or Collar option */}
      {top_style === "collared" && (
        <mesh position={[0, 1.08, 0]} rotation={[0.05, 0, 0]}>
          <torusGeometry args={[0.12, 0.022, 8, 16]} />
          <meshStandardMaterial color={top_color} roughness={0.7} />
        </mesh>
      )}

      {/* Hoodie Hood behind head */}
      {top_style === "hoodie" && (
        <mesh position={[0, 1.25, -0.1]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={top_color} roughness={0.7} />
        </mesh>
      )}

      {/* 3. Arms (Tshirt sleeves vs Long sleeve hoodie) */}
      {/* Left Arm */}
      <group position={[-0.24, 0.95, 0]} rotation={[0, 0, 0.15]}>
        {/* Sleeve upper */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.12, 8]} />
          <meshStandardMaterial color={top_color} roughness={0.7} />
        </mesh>
        {/* Forearm skin / sleeve lower */}
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.15, 8]} />
          <meshStandardMaterial 
            color={top_style === "hoodie" ? top_color : genderColor} 
            roughness={0.7} 
          />
        </mesh>
        {/* Hand joint */}
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={genderColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.24, 0.95, 0]} rotation={[0, 0, -0.15]}>
        {/* Sleeve upper */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.12, 8]} />
          <meshStandardMaterial color={top_color} roughness={0.7} />
        </mesh>
        {/* Forearm skin / sleeve lower */}
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.15, 8]} />
          <meshStandardMaterial 
            color={top_style === "hoodie" ? top_color : genderColor} 
            roughness={0.7} 
          />
        </mesh>
        {/* Hand joint */}
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={genderColor} roughness={0.6} />
        </mesh>
      </group>

      {/* 4. Bottom (Pants / Shorts) */}
      {/* Lower Torso / Pelvis */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.15, 0.12, 16]} />
        <meshStandardMaterial color={bottom_color} roughness={0.7} />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.08, 0.45, 0]}>
        {/* Upper Leg */}
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.22, 8]} />
          <meshStandardMaterial color={bottom_color} roughness={0.7} />
        </mesh>
        {/* Shin (pants vs shorts) */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.2, 8]} />
          <meshStandardMaterial 
            color={bottom_style === "shorts" ? genderColor : bottom_color} 
            roughness={0.7} 
          />
        </mesh>
        {/* Left Foot / Shoe */}
        <mesh position={[0, -0.46, 0.03]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.16]} />
          <meshStandardMaterial color={shoes_color} roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.08, 0.45, 0]}>
        {/* Upper Leg */}
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.22, 8]} />
          <meshStandardMaterial color={bottom_color} roughness={0.7} />
        </mesh>
        {/* Shin (pants vs shorts) */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.2, 8]} />
          <meshStandardMaterial 
            color={bottom_style === "shorts" ? genderColor : bottom_color} 
            roughness={0.7} 
          />
        </mesh>
        {/* Right Foot / Shoe */}
        <mesh position={[0, -0.46, 0.03]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.16]} />
          <meshStandardMaterial color={shoes_color} roughness={0.8} />
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
        camera={{ position: [0, 1.2, 3], fov: 40 }}
        gl={{ preserveDrawingBuffer: true }} // critical for taking snapshots via canvas.toDataURL()
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#faf8f6"]} />
        
        {/* Lighting */}
        <ambientLight intensity={1.1} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <directionalLight position={[-5, 5, -2]} intensity={0.5} />
        <pointLight position={[0, 4, 2]} intensity={0.4} />

        {/* Both avatars side by side */}
        <group position={[0, -0.4, 0]}>
          {/* User's Avatar (Left) */}
          <ToyFigure 
            outfit={userOutfit} 
            position={partnerOutfit ? [-0.4, 0, 0] : [0, 0, 0]} 
            genderColor="#f5cac3" // Warm peach
          />

          {/* Partner's Avatar (Right, if paired) */}
          {partnerOutfit && (
            <ToyFigure 
              outfit={partnerOutfit} 
              position={[0.4, 0, 0]} 
              genderColor="#eddcd2" // Sand tone
            />
          )}

          {/* Floor & Shadows */}
          <ContactShadows 
            position={[0, -0.5, 0]} 
            opacity={0.6} 
            scale={5} 
            blur={2.4} 
            far={1.5} 
          />
        </group>

        {/* Orbit Controls with restriction boundaries */}
        <OrbitControls 
          enableZoom={true}
          minDistance={1.8}
          maxDistance={5}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
          target={[0, 0.6, 0]}
        />
      </Canvas>

      {/* Floating labels for avatars */}
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
