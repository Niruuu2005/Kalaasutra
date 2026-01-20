/**
 * 3D Preview Component using React Three Fiber
 * Displays a 3D model with custom text overlay
 */
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface KeychainPreviewProps {
  customText?: string;
}

export default function KeychainPreview({ customText = "Sample" }: KeychainPreviewProps) {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Placeholder box - replace with GLB model */}
        <mesh>
          <boxGeometry args={[2, 2, 0.3]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        
        {/* 3D Text - simplified version */}
        {customText && (
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[1.5, 0.3, 0.1]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        )}
        
        <OrbitControls enableZoom={true} />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
        <p className="text-sm">Text: {customText}</p>
        <p className="text-xs text-gray-300 mt-1">Drag to rotate • Scroll to zoom</p>
      </div>
    </div>
  );
}
