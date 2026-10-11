import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Eye, ZoomIn, ZoomOut, Compass, Sparkles } from 'lucide-react';

interface MenuItemRiskNode {
  id: string;
  name: string;
  category: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG';
  volume: number; // 0 to 100
  margin: number; // 0 to 100
  risk: number; // 0 to 100 (Wastage / volatility risk)
  price: number;
  cost: number;
}

const DEFAULT_NODES: MenuItemRiskNode[] = [
  { id: '1', name: 'Butter Chicken Special', category: 'STAR', volume: 92, margin: 82, risk: 22, price: 440, cost: 79 },
  { id: '2', name: 'Tandoori Garlic Naan', category: 'STAR', volume: 98, margin: 88, risk: 12, price: 85, cost: 10 },
  { id: '3', name: 'Dal Makhani Heritage', category: 'STAR', volume: 85, margin: 79, risk: 18, price: 320, cost: 67 },
  { id: '4', name: 'Paneer Tikka Platter', category: 'STAR', volume: 78, margin: 74, risk: 28, price: 380, cost: 98 },
  { id: '5', name: 'Chicken Biryani Handi', category: 'PLOWHORSE', volume: 90, margin: 52, risk: 35, price: 360, cost: 172 },
  { id: '6', name: 'Mutton Rogan Josh', category: 'PLOWHORSE', volume: 72, margin: 48, risk: 45, price: 520, cost: 270 },
  { id: '7', name: 'Saffron Lassi Royale', category: 'PUZZLE', volume: 38, margin: 85, risk: 30, price: 180, cost: 27 },
  { id: '8', name: 'Truffle Mushroom Kulcha', category: 'PUZZLE', volume: 29, margin: 80, risk: 42, price: 240, cost: 48 },
  { id: '9', name: 'Raw Papaya Salad', category: 'DOG', volume: 20, margin: 40, risk: 85, price: 210, cost: 126 },
  { id: '10', name: 'Fish Amritsari', category: 'DOG', volume: 25, margin: 38, risk: 80, price: 460, cost: 285 },
];

export const RiskLensMatrix3D: React.FC<{ items?: MenuItemRiskNode[] }> = ({ items = DEFAULT_NODES }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<MenuItemRiskNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<MenuItemRiskNode | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewPreset, setViewPreset] = useState<'ISOMETRIC' | 'FRONT' | 'TOP'>('ISOMETRIC');
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(38, 28, 42);
    camera.lookAt(0, 10, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.5, 80);
    pointLight.position.set(0, 25, 0);
    scene.add(pointLight);

    // 5. 3D Risk Terrain Grid Floor
    const gridHelper = new THREE.GridHelper(50, 25, 0xf59e0b, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Coordinate Axis Lines & Extruded Pillars
    const axisGroup = new THREE.Group();

    // Volume X-axis (Emerald line)
    const xGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-25, 0, 0), new THREE.Vector3(25, 0, 0)]);
    const xMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    axisGroup.add(new THREE.Line(xGeo, xMat));

    // Margin Y-axis (Amber vertical line)
    const yGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 30, 0)]);
    const yMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    axisGroup.add(new THREE.Line(yGeo, yMat));

    // Risk Z-axis (Rose depth line)
    const zGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -25), new THREE.Vector3(0, 0, 25)]);
    const zMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
    axisGroup.add(new THREE.Line(zGeo, zMat));

    scene.add(axisGroup);

    // 7. Interactive 3D Nodes representing items in Risk Space
    const nodeMeshes: THREE.Mesh[] = [];
    const spheresGroup = new THREE.Group();

    const colorMap = {
      STAR: 0x10b981, // Emerald
      PLOWHORSE: 0x3b82f6, // Blue
      PUZZLE: 0xa855f7, // Purple
      DOG: 0xf43f5e, // Rose
    };

    items.forEach((item) => {
      // Map coordinates to 3D space:
      // X = (volume - 50) * 0.45
      // Y = (margin / 100) * 26 + 2
      // Z = (item.risk - 50) * 0.45
      const posX = ((item.volume - 50) / 50) * 20;
      const posY = (item.margin / 100) * 24 + 1;
      const posZ = ((item.risk - 50) / 50) * 20;

      // Sphere geometry
      const sphereGeo = new THREE.SphereGeometry(1.4, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorMap[item.category],
        emissive: colorMap[item.category],
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.6,
      });

      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(posX, posY, posZ);
      sphere.userData = item;
      spheresGroup.add(sphere);
      nodeMeshes.push(sphere);

      // Vertical guide stalk down to grid plane
      const stalkGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(posX, 0, posZ),
        new THREE.Vector3(posX, posY, posZ),
      ]);
      const stalkMat = new THREE.LineDashedMaterial({
        color: colorMap[item.category],
        dashSize: 0.8,
        gapSize: 0.5,
        opacity: 0.4,
        transparent: true,
      });
      const stalk = new THREE.Line(stalkGeo, stalkMat);
      stalk.computeLineDistances();
      spheresGroup.add(stalk);

      // Pulsing halo ring around node
      const ringGeo = new THREE.RingGeometry(1.8, 2.1, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorMap[item.category],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(posX, posY, posZ);
      spheresGroup.add(ring);
    });

    scene.add(spheresGroup);

    // 8. Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const item = intersects[0].object.userData as MenuItemRiskNode;
        setHoveredNode(item);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const item = intersects[0].object.userData as MenuItemRiskNode;
        setSelectedNode(item);
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 9. Animation Loop
    let animationId: number;
    let angle = 0.8;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (autoRotate) {
        angle += 0.005;
        const radius = 45;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.lookAt(0, 10, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      document.body.style.cursor = 'default';
    };
  }, [items, autoRotate]);

  const setCameraPreset = (preset: 'ISOMETRIC' | 'FRONT' | 'TOP') => {
    setViewPreset(preset);
    setAutoRotate(false);
    if (!cameraRef.current) return;

    if (preset === 'ISOMETRIC') {
      cameraRef.current.position.set(38, 28, 42);
      cameraRef.current.lookAt(0, 10, 0);
    } else if (preset === 'FRONT') {
      cameraRef.current.position.set(0, 15, 50);
      cameraRef.current.lookAt(0, 12, 0);
    } else if (preset === 'TOP') {
      cameraRef.current.position.set(0, 55, 0.1);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full rounded-3xl card-3d-elevated bg-slate-950 overflow-hidden border border-amber-500/30">
      
      {/* 3D Viewport Controls & Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Title & Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-white tracking-wider uppercase">
            3D Spatial Risk & Profit Matrix
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            RiskLens Engine
          </span>
        </div>

        {/* 3D Navigation Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-lg text-xs font-bold">
          <button
            onClick={() => setCameraPreset('ISOMETRIC')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'ISOMETRIC' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Isometric 45°
          </button>
          <button
            onClick={() => setCameraPreset('FRONT')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'FRONT' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Margin vs Volume
          </button>
          <button
            onClick={() => setCameraPreset('TOP')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewPreset === 'TOP' && !autoRotate ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              autoRotate ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
            title="Auto-Orbit Camera"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-96 sm:h-[420px]" />

      {/* Axis Guide Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none p-3 rounded-2xl bg-slate-950/85 border border-slate-800 backdrop-blur-md space-y-1.5 text-[10px] font-mono shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" />
          <span>X-Axis: Sales Volume (Order Frequency)</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <span className="w-2.5 h-0.5 bg-amber-400 rounded-full" />
          <span>Y-Axis: Gross Margin % (Profit Contribution)</span>
        </div>
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <span className="w-2.5 h-0.5 bg-rose-400 rounded-full" />
          <span>Z-Axis: Spoilage & Preparation Risk</span>
        </div>
      </div>

      {/* Hovered / Selected Node Card (Bottom Right) */}
      {(hoveredNode || selectedNode) && (
        <div className="absolute bottom-4 right-4 z-10 max-w-xs p-4 rounded-2xl card-3d bg-slate-900/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              {(hoveredNode || selectedNode)?.name}
            </span>
            <span
              className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                (hoveredNode || selectedNode)?.category === 'STAR'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : (hoveredNode || selectedNode)?.category === 'PLOWHORSE'
                  ? 'bg-blue-500/20 text-blue-300'
                  : (hoveredNode || selectedNode)?.category === 'PUZZLE'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {(hoveredNode || selectedNode)?.category}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800">
            <div>
              <span className="text-slate-400 block">Margin</span>
              <span className="text-amber-400 font-black font-mono">
                {(hoveredNode || selectedNode)?.margin}%
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Volume</span>
              <span className="text-emerald-400 font-black font-mono">
                {(hoveredNode || selectedNode)?.volume} orders
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Risk Index</span>
              <span className="text-rose-400 font-black font-mono">
                {(hoveredNode || selectedNode)?.risk}/100
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-300 flex justify-between pt-1">
            <span>Price: ₹{(hoveredNode || selectedNode)?.price}</span>
            <span>Cost: ₹{(hoveredNode || selectedNode)?.cost}</span>
          </div>
        </div>
      )}

    </div>
  );
};
