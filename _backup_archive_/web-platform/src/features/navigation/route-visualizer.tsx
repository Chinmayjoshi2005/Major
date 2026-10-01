"use client";

import { Line } from "@react-three/drei";
import { useNavigationStore } from "@/store";

export function RouteVisualizer() {
  const route = useNavigationStore((s) => s.activeRoute);

  if (!route?.found || route.path.length < 2) return null;

  const points = route.path.map(
    (p) => [p.position.x, p.position.y + 0.3, p.position.z] as [number, number, number]
  );

  return (
    <group>
      <Line
        points={points}
        color="#ff6b9d"
        lineWidth={3}
        dashed={false}
      />
      {route.path.length > 0 && (
        <mesh
          position={[
            route.path[route.path.length - 1].position.x,
            route.path[route.path.length - 1].position.y + 1,
            route.path[route.path.length - 1].position.z,
          ]}
        >
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color="#ff6b9d"
            emissive="#ff6b9d"
            emissiveIntensity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
