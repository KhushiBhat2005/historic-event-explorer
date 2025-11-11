import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search, Rocket, ListFilter } from 'lucide-react';
import { HistoricalEvent, Category, Era, Significance } from '../types';
import { CATEGORY_METADATA, ERA_LABELS, SIGNIFICANCE_LABELS } from '../constants';
import { formatDate, formatYear } from '../utils/helpers';

interface SolarSystemPageProps {
  events: HistoricalEvent[];
}

const planetData: Record<string, any> = {
  Sun: { color: 0xffcc33, size: 100, position: { x: 0, y: 0, z: 0 } },
  Mars: { era: Era.Ancient, label: 'Ancient', color: 0xff5733, size: 15, orbitRadius: 400, speed: 0.0006 },
  Uranus: { era: Era.Medieval, label: 'Medieval', color: 0xace5ee, size: 30, orbitRadius: 800, speed: 0.0002 },
  Venus: { era: Era.Renaissance, label: 'Renaissance', color: 0xffd700, size: 18, orbitRadius: 600, speed: 0.001 },
  Earth: { era: Era.Enlightenment, label: 'Enlightenment', color: 0x4d90fe, size: 20, orbitRadius: 1000, speed: 0.0008, hasMoon: true },
  Jupiter: { era: Era.Industrial, label: 'Industrial', color: 0xd2b48c, size: 50, orbitRadius: 1400, speed: 0.0004 },
  Saturn: { era: Era.Modern, label: 'Modern', color: 0xf0e68c, size: 45, orbitRadius: 1800, speed: 0.0003, hasRing: true },
  Neptune: { era: Era.Contemporary, label: 'Contemporary', color: 0x3f51b5, size: 28, orbitRadius: 2200, speed: 0.0001 },
};
const planetEraOrder = [Era.Ancient, Era.Medieval, Era.Renaissance, Era.Enlightenment, Era.Industrial, Era.Modern, Era.Contemporary];

const significanceMap = {
  [Significance.Low]: { size: 2.5 },
  [Significance.Medium]: { size: 3.0 },
  [Significance.High]: { size: 3.8 },
  [Significance.Critical]: { size: 4.5 },
};

const createLabelSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = 60;
    context.font = `bold ${fontSize}px "Lora", serif`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = fontSize * 1.2;
    
    context.font = `bold ${fontSize}px "Lora", serif`;
    context.fillStyle = 'rgba(224, 216, 199, 0.85)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(textWidth / 4, (fontSize * 1.2) / 4, 1.0);
    return sprite;
};

const SolarSystemPage: React.FC<SolarSystemPageProps> = ({ events }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const planetsRef = useRef<THREE.Group>(new THREE.Group());
  const eventsRef = useRef<THREE.Group>(new THREE.Group());
  const orbitsRef = useRef<THREE.Group>(new THREE.Group());
  const eventMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());

  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 600, 2500));
  const controlsTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [activeEra, setActiveEra] = useState<Era | 'all'>('all');

  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth > 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [significanceFilter, setSignificanceFilter] = useState<Significance | 'all'>('all');

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
        const matchesSignificance = significanceFilter === 'all' || event.significance === significanceFilter;
        return matchesSearch && matchesCategory && matchesSignificance;
      });
  }, [events, searchTerm, categoryFilter, significanceFilter]);

  const navigateToEra = useCallback((era: Era) => {
    const planetObject = planetsRef.current.children.find(c => c.userData.era === era);
    if (planetObject) {
      const planetPosition = new THREE.Vector3();
      planetObject.getWorldPosition(planetPosition);
      const planetSize = planetObject.userData.size || 20;
      
      cameraTargetRef.current.set(planetPosition.x + planetSize * 5, planetPosition.y + planetSize * 3, planetPosition.z + planetSize * 5);
      controlsTargetRef.current.copy(planetPosition);
      setActiveEra(era);
    }
  }, []);
  
  const navigateToOverview = useCallback(() => {
    cameraTargetRef.current.set(0, 600, 2500);
    controlsTargetRef.current.set(0, 0, 0);
    setActiveEra('all');
  }, []);
  
  const navigateToEvent = useCallback((event: HistoricalEvent) => {
    const eventMesh = eventMeshesRef.current.get(event.id);
    const planet = planetsRef.current.children.find(p => p.userData.era === event.era);
    if (!eventMesh || !planet) return;

    const eventWorldPosition = new THREE.Vector3();
    eventMesh.getWorldPosition(eventWorldPosition);

    const planetWorldPosition = new THREE.Vector3();
    planet.getWorldPosition(planetWorldPosition);

    controlsTargetRef.current.copy(eventWorldPosition);
    
    const direction = new THREE.Vector3().subVectors(eventWorldPosition, planetWorldPosition).normalize();
    const offset = direction.multiplyScalar(80);
    const cameraPos = new THREE.Vector3().addVectors(eventWorldPosition, offset);
    cameraPos.y += 20;
    cameraTargetRef.current.copy(cameraPos);
    
    setActiveEra(event.era);
  }, []);

  const handleEventSelect = (event: HistoricalEvent) => {
    navigateToEvent(event);
    setTimeout(() => setSelectedEvent(event), 500);
    if (window.innerWidth < 768) {
      setIsPanelOpen(false);
    }
  };

  // Initial Scene Setup
  useEffect(() => {
    if (!mountRef.current || rendererRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 10000);
    camera.position.copy(cameraTargetRef.current);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 50;
    controls.maxDistance = 5000;
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onClick = (event: MouseEvent) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(camera, camera);
        const intersects = raycaster.intersectObjects(eventsRef.current.children, true);
        const eventIntersect = intersects.find(i => i.object.userData.title);
        if(eventIntersect) {
            handleEventSelect(eventIntersect.object.userData as HistoricalEvent)
        }
    };
    
    mountRef.current.addEventListener('click', onClick);

    // Starfield
    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
        const x = THREE.MathUtils.randFloatSpread(8000);
        const y = THREE.MathUtils.randFloatSpread(8000);
        const z = THREE.MathUtils.randFloatSpread(8000);
        starVertices.push(x, y, z);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 2.5, sizeAttenuation: true });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const delta = clock.getDelta();

      camera.position.lerp(cameraTargetRef.current, 0.05);
      controls.target.lerp(controlsTargetRef.current, 0.05);
      controls.update();

      planetsRef.current.children.forEach(planet => {
        if (planet.userData.name === 'Moon') return;
        const data = planet.userData;
        if(data.speed) {
            planet.position.x = Math.cos(time * data.speed * 10) * data.orbitRadius;
            planet.position.z = Math.sin(time * data.speed * 10) * data.orbitRadius;
        }
        planet.rotation.y += 0.02 * delta;
      });

      const earth = planetsRef.current.children.find(p => p.userData.era === Era.Enlightenment);
      const moon = planetsRef.current.children.find(p => p.userData.name === 'Moon');
      if (earth && moon) {
        const moonOrbitRadius = 40;
        const moonSpeed = 0.5;
        moon.position.x = earth.position.x + Math.cos(time * moonSpeed) * moonOrbitRadius;
        moon.position.z = earth.position.z + Math.sin(time * moonSpeed) * moonOrbitRadius;
        moon.position.y = earth.position.y;
      }
      
      eventsRef.current.children.forEach(eventGroup => {
        const planet = planetsRef.current.children.find(p => p.userData.era === eventGroup.userData.era);
        if (planet) {
            eventGroup.position.copy(planet.position);
        }
        eventGroup.rotation.y += 0.05 * delta;
        eventGroup.rotation.x += 0.03 * delta;
      });

      eventMeshesRef.current.forEach((mesh, id) => {
        if (!mesh.visible) return;
        const isHighlighted = id === highlightedEventId;
        const material = mesh.material as THREE.MeshStandardMaterial;

        const targetScale = isHighlighted ? 1.8 : 1.0;
        const pulse = isHighlighted ? 1.0 : 1 + Math.sin(time * 3 + mesh.userData.randomOffset) * 0.15;
        const finalScale = targetScale * pulse;
        mesh.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.2);

        const targetEmissiveIntensity = isHighlighted ? 1.5 : 0.4;
        material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetEmissiveIntensity, 0.1);
      });
      
      stars.rotation.y += 0.005 * delta;

      renderer.render(scene, camera);
    };

    animate();
    setIsSceneReady(true);

    const onResize = () => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        const { clientWidth, clientHeight } = mountRef.current;
        cameraRef.current.aspect = clientWidth / clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(clientWidth, clientHeight);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mountRef.current);
    onResize();

    return () => {
      resizeObserver.disconnect();
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeEventListener('click', onClick);
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Create Planets and Orbits
  useEffect(() => {
    if (!sceneRef.current || !isSceneReady) return;
    const scene = sceneRef.current;
    
    scene.remove(planetsRef.current);
    scene.remove(orbitsRef.current);
    planetsRef.current = new THREE.Group();
    orbitsRef.current = new THREE.Group();

    const sunGeometry = new THREE.SphereGeometry(planetData.Sun.size, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: planetData.Sun.color, fog: false });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 2);
    sun.add(sunLight);
    
    const coronaGeometry = new THREE.SphereGeometry(planetData.Sun.size * 1.15, 64, 64);
    const coronaMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sun.add(corona);
    planetsRef.current.add(sun);
    
    Object.values(planetData).filter(p => p.era).forEach(data => {
        const planet = new THREE.Mesh(new THREE.SphereGeometry(data.size, 32, 32), new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8 }));
        planet.userData = data;

        const label = createLabelSprite(data.label);
        label.position.y = data.size * 1.6;
        planet.add(label);
        planetsRef.current.add(planet);
        
        if (data.hasMoon) {
          const moon = new THREE.Mesh(new THREE.SphereGeometry(data.size * 0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 }));
          moon.userData.name = 'Moon';
          planetsRef.current.add(moon);
        }

        if (data.hasRing) {
          const ring = new THREE.Mesh(new THREE.RingGeometry(data.size * 1.4, data.size * 1.9, 64), new THREE.MeshBasicMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
          ring.rotation.x = -Math.PI * 0.4;
          planet.add(ring);
        }
        
        const orbitPoints = new THREE.Path().absellipse(0, 0, data.orbitRadius, data.orbitRadius, 0, Math.PI * 2, false).getSpacedPoints(128);
        const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        orbitGeom.rotateX(-Math.PI / 2);

        const isOrbitActive = activeEra === data.era || activeEra === 'all';
        const orbitMaterial = new THREE.LineBasicMaterial({ color: activeEra === data.era ? 0xffffff : 0xaaaaaa, transparent: true, opacity: isOrbitActive ? 0.4 : 0.15 });
        orbitsRef.current.add(new THREE.Line(orbitGeom, orbitMaterial));
    });
    
    scene.add(planetsRef.current);
    scene.add(orbitsRef.current);
  }, [isSceneReady, activeEra]);

  // Create All Event Meshes
  useEffect(() => {
    if (!sceneRef.current || !isSceneReady || !events.length) return;
    const scene = sceneRef.current;
    
    scene.remove(eventsRef.current);
    eventsRef.current = new THREE.Group();
    eventMeshesRef.current.clear();

    const eventsByEra: Record<string, HistoricalEvent[]> = {};
    events.forEach(event => {
        if (!eventsByEra[event.era]) eventsByEra[event.era] = [];
        eventsByEra[event.era].push(event);
    });

    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      const planetInfo = Object.values(planetData).find(p => p.era === era);
      if (!planetInfo) return;
      
      const eventGroup = new THREE.Group();
      eventGroup.userData.era = era;
      
      eraEvents.forEach(event => {
        const metadata = CATEGORY_METADATA[event.category];
        const { size } = significanceMap[event.significance] || significanceMap[Significance.Medium];
        const eventMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(metadata.color), emissive: new THREE.Color(metadata.color), emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.5 });
        const eventMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), eventMaterial);
        
        const phi = Math.acos(-1 + (2 * Math.random()));
        const theta = Math.sqrt(eraEvents.length * Math.PI) * phi;
        const radius = planetInfo.size + 25 + Math.random() * 40;

        eventMesh.position.setFromSphericalCoords(radius, phi, theta);
        eventMesh.userData = { ...event, randomOffset: Math.random() * 100 };
        eventGroup.add(eventMesh);
        eventMeshesRef.current.set(event.id, eventMesh);
      });
      eventsRef.current.add(eventGroup);
    });
    scene.add(eventsRef.current);
  }, [isSceneReady, events]);

  // Update Event Visibility based on filters
  useEffect(() => {
    if (!eventMeshesRef.current.size) return;
    const filteredEventIds = new Set(filteredEvents.map(e => e.id));
    eventMeshesRef.current.forEach((mesh, id) => {
      mesh.visible = filteredEventIds.has(id);
    });
  }, [filteredEvents]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {!isSceneReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <Rocket className="mx-auto h-12 w-12 text-brand-gold animate-pulse" />
            <p className="text-brand-text-secondary mt-4 font-serif">Initializing Cosmos...</p>
          </div>
        </div>
      )}

      {/* Left Control Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 h-full w-full max-w-sm bg-brand-parchment-dark/80 backdrop-blur-lg border-r border-brand-gold/20 shadow-2xl z-20 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-brand-gold/20 flex-shrink-0">
              <h2 className="text-xl font-serif text-brand-gold">Explore Events</h2>
              <button onClick={() => setIsPanelOpen(false)} className="p-2 text-brand-text-secondary hover:text-white"><X/></button>
            </div>
            <div className="p-4 flex-shrink-0">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={18} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md pl-10 pr-4 py-2 text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"/>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as Category | 'all')} className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none">
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_METADATA).map(([key, {label, emoji}]) => <option key={key} value={key}>{emoji} {label}</option>)}
                </select>
                <select value={significanceFilter} onChange={e => setSignificanceFilter(e.target.value as Significance | 'all')} className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none">
                  <option value="all">All Significance</option>
                  {Object.entries(SIGNIFICANCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-4">
              {filteredEvents.map(event => {
                const metadata = CATEGORY_METADATA[event.category];
                return (
                  <div
                    key={event.id}
                    onMouseEnter={() => setHighlightedEventId(event.id)}
                    onMouseLeave={() => setHighlightedEventId(null)}
                    onClick={() => handleEventSelect(event)}
                    className="p-3 rounded-md hover:bg-brand-parchment-light cursor-pointer transition-colors border border-transparent hover:border-brand-gold/30"
                  >
                    <div className="flex items-start space-x-3">
                        <metadata.icon size={18} style={{color: metadata.color}} className="mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-brand-text-primary leading-tight">{event.title}</p>
                            <p className="text-xs text-brand-text-secondary mt-1">{formatYear(event.year)}</p>
                        </div>
                    </div>
                  </div>
                )
              })}
              {filteredEvents.length === 0 && <p className="text-center text-brand-text-secondary p-8">No events match your criteria.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Left Buttons */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {!isPanelOpen && (
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsPanelOpen(true)} 
            className="p-3 bg-brand-parchment-dark/80 backdrop-blur-sm border border-brand-gold/20 rounded-full text-brand-text-primary hover:bg-brand-parchment-light"
          >
            <ListFilter size={20}/>
          </motion.button>
        )}
         <button onClick={() => setShowInstructions(true)} className="p-3 bg-brand-parchment-dark/80 backdrop-blur-sm border border-brand-gold/20 rounded-full text-brand-text-primary hover:bg-brand-parchment-light">
          <HelpCircle size={20}/>
        </button>
      </div>

      {/* Era Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 bg-brand-parchment-dark/80 backdrop-blur-sm border border-brand-gold/20 rounded-full flex gap-1 z-10">
        <button 
          onClick={navigateToOverview} 
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${activeEra === 'all' ? 'bg-brand-gold text-white' : 'hover:bg-brand-parchment-light text-brand-text-secondary'}`}
        >
          Overview
        </button>
        {planetEraOrder.map(era => {
          const planetInfo = Object.values(planetData).find(p => p.era === era);
          if (!planetInfo) return null;
          return (
            <button 
              key={era} 
              onClick={() => navigateToEra(era)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${activeEra === era ? 'bg-brand-gold text-white' : 'hover:bg-brand-parchment-light text-brand-text-secondary'}`}
            >
              {planetInfo.label}
            </button>
          )
        })}
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-brand-parchment-dark rounded-lg border border-brand-gold/30 shadow-2xl p-6"
            >
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-2xl font-serif text-brand-gold">{selectedEvent.title}</h3>
                      <p className="text-sm text-brand-text-secondary mt-1">{formatDate(selectedEvent.date)}</p>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-2 -mr-2 -mt-2 text-brand-text-secondary hover:text-white"><X/></button>
              </div>
              <p className="mt-4 text-brand-text-primary">{selectedEvent.summary}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-brand-parchment-dark rounded-lg border border-brand-gold/30 shadow-2xl p-8 text-center"
            >
                <HelpCircle className="mx-auto h-12 w-12 text-brand-gold"/>
                <h2 className="text-3xl font-serif text-brand-text-primary mt-4">How to Explore</h2>
                <p className="text-brand-text-secondary mt-4">
                    Use your mouse to navigate the Solar System. <br/>
                    <b>Left-click & drag</b> to rotate. <br/>
                    <b>Right-click & drag</b> to pan. <br/>
                    <b>Scroll wheel</b> to zoom.
                </p>
                <p className="text-brand-text-secondary mt-2">
                    Click on the glowing crystals to learn about historical events. Use the bottom navigation to jump between eras.
                </p>
                <button onClick={() => setShowInstructions(false)} className="mt-6 px-6 py-2 bg-brand-gold text-white font-semibold rounded-md hover:opacity-90 transition-opacity">
                    Begin Exploration
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SolarSystemPage;