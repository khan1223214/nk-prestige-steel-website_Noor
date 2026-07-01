import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * Abstract industrial 3D hero:
 * - Central molten-gold ingot cube
 * - Orbiting metallic shards (scrap fragments)
 * - Rotating truck-like chassis silhouette below
 */

function GoldIngot() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.35;
      ref.current.rotation.x += dt * 0.08;
    }
  });
  return (
    <Float speed={1.4} floatIntensity={1.2} rotationIntensity={0.6}>
      <mesh ref={ref} castShadow>
        <boxGeometry args={[1.6, 0.9, 0.7]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.18} emissive="#8a6f18" emissiveIntensity={0.35} />
      </mesh>
    </Float>
  );
}

function MetalShards({ count = 22 }) {
  const group = useRef();
  const shards = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 1.6;
      return {
        pos: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2.4, Math.sin(angle) * radius],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        size: 0.16 + Math.random() * 0.22,
        speed: 0.3 + Math.random() * 0.6,
      };
    });
  }, [count]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.12;
    group.current.children.forEach((c, i) => {
      c.rotation.x += dt * shards[i].speed;
      c.rotation.z += dt * shards[i].speed * 0.7;
    });
  });

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot}>
          <octahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#D4AF37" : "#8892a8"}
            metalness={0.95}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function TruckChassis() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group ref={ref} position={[0, -1.6, 0]} scale={0.7}>
      {/* Container box */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.6, 1.0, 1.2]} />
        <meshStandardMaterial color="#2C303A" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Cab */}
      <mesh position={[-1.7, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.7, 1.1]} />
        <meshStandardMaterial color="#0A1128" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[-1.35, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.9]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} emissive="#D4AF37" emissiveIntensity={0.4} />
      </mesh>
      {/* Wheels */}
      {[[-1.5, -0.15, 0.6], [-1.5, -0.15, -0.6], [0.6, -0.15, 0.6], [0.6, -0.15, -0.6], [1.4, -0.15, 0.6], [1.4, -0.15, -0.6]].map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.15, 24]} />
          <meshStandardMaterial color="#0f1420" metalness={0.6} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Particles({ count = 60 }) {
  const points = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (points.current) {
      points.current.rotation.y += dt * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#D4AF37" size={0.04} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.5, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#060B14"]} />
        <fog attach="fog" args={["#060B14", 6, 14]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 5]} intensity={1.2} color="#D4AF37" />
        <directionalLight position={[-4, 3, -4]} intensity={0.6} color="#4a6fa5" />
        <pointLight position={[0, 2, 0]} intensity={1.4} color="#F0C420" distance={8} />
        <Suspense fallback={null}>
          <GoldIngot />
          <MetalShards count={18} />
          <TruckChassis />
          <Particles count={80} />
          <ContactShadows position={[0, -2.3, 0]} opacity={0.5} scale={10} blur={2.4} far={4} color="#000" />
          <Environment preset="warehouse" />
        </Suspense>
      </Canvas>
    </div>
  );
}
