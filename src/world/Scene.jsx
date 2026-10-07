import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Outlines, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import PropTypes from 'prop-types';
import { STOPS } from './stops';

/*
 * Kamal's planet: a code-built, ink-outlined toon world.
 * The visitor never walks. They pick a place; the planet turns so that place sits on
 * top, facing the camera, and Kamil hops beside it like he walked you there.
 */

const R = 10;
const INK = '#1c2338';
const C = {
  grassA: '#a9d99a', grassB: '#86c387', grassC: '#cbe39c', meadow: '#dccf8a', plaza: '#f1d9a8', stone: '#e8cf9c',
  cream: '#f7efe0', lilac: '#e8e0f3', coral: '#ef7b62', roof: '#e2614f', wood: '#b9825a', woodDark: '#8a5a3b',
  glass: '#bfe7ff', water: '#79c6e6', rock: '#c9c3d6', kamil: '#4aa3ff', leaf: '#4fae73', leafDark: '#3f9a63',
  steel: '#9aa6bf', skin: '#f2c7a5', hair: '#3a2a22', gold: '#ffc85c', pink: '#ff9fbf', blue: '#2f80ed', lamp: '#ffe08a',
};

const ramp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 200, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const mats = {};
const toon = (color) => (mats[color] ??= new THREE.MeshToonMaterial({ color, gradientMap: ramp }));
const glow = (color) => (mats[`g${color}`] ??= new THREE.MeshBasicMaterial({ color }));

const UP = new THREE.Vector3(0, 1, 0);
const dirOf = (lat, lon) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
};
const STOP_DIRS = STOPS.map((s) => dirOf(s.lat, s.lon));

// Rolling hills, flattened into plazas around each place so buildings sit level.
function height(n) {
  const h = 0.32 * Math.sin(n.x * 3.1 + n.y * 1.7) * Math.cos(n.z * 2.6 - n.x)
        + 0.18 * Math.sin(n.y * 6.3 + n.z * 4.1) + 0.1 * Math.cos(n.x * 8.7 - n.z * 5.3);
  let flat = 1;
  for (const d of STOP_DIRS) flat = Math.min(flat, THREE.MathUtils.smoothstep(n.angleTo(d), 0.16, 0.34));
  return h * flat;
}
const surface = (n, lift = 0) => n.clone().multiplyScalar(R + height(n) + lift);
const upTo = (n) => new THREE.Quaternion().setFromUnitVectors(UP, n);

// Planet rotation that puts normal n on top, tipped toward the camera, north kept upright.
const TOP = new THREE.Vector3(0, 1, 0.42).normalize();
function faceQuat(n) {
  const q = new THREE.Quaternion().setFromUnitVectors(n, TOP);
  const back = new THREE.Vector3(0, 0, -1);
  const north = back.clone().applyQuaternion(q);
  const proj = (v) => v.clone().sub(TOP.clone().multiplyScalar(v.dot(TOP))).normalize();
  const a = proj(north), b = proj(back);
  let ang = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  if (a.clone().cross(b).dot(TOP) < 0) ang = -ang;
  return new THREE.Quaternion().setFromAxisAngle(TOP, ang).multiply(q);
}

const Ink = ({ t = 0.05 }) => <Outlines thickness={t * 2.6} color={INK} />;
Ink.propTypes = { t: PropTypes.number };
const M = ({ geo, color, ink = true, t, ...rest }) => (
  <mesh material={toon(color)} castShadow receiveShadow {...rest}>{geo}{ink && <Ink t={t} />}</mesh>
);
M.propTypes = { geo: PropTypes.node, color: PropTypes.string, ink: PropTypes.bool, t: PropTypes.number };

/* ---------------- terrain ---------------- */

function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 5).toNonIndexed();
    const p = g.attributes.position, v = new THREE.Vector3(), cols = new Float32Array(p.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const s = surface(v); p.setXYZ(i, s.x, s.y, s.z); }
    for (let f = 0; f < p.count; f += 3) {                     // one colour per face: a flat, hand-painted look
      v.fromBufferAttribute(p, f).normalize();
      const near = Math.min(...STOP_DIRS.map((d) => v.angleTo(d)));
      const n = Math.sin(v.x * 11 + v.z * 7) * Math.cos(v.y * 9 - v.x * 5);
      col.set(near < 0.17 ? C.plaza : n > 0.62 ? C.meadow : n > 0.4 ? C.grassC : n < -0.3 ? C.grassB : C.grassA);
      for (let k = 0; k < 3; k++) col.toArray(cols, (f + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp, flatShading: true }), []);
  return <mesh geometry={geo} material={mat} receiveShadow><Ink t={0.06} /></mesh>;
}

// Stepping stones + lamp posts along great circles between consecutive places.
const PATHS = (() => {
  const out = [];
  STOPS.forEach((s, i) => {
    const a = STOP_DIRS[i], b = STOP_DIRS[(i + 1) % STOPS.length];
    const steps = Math.floor(a.angleTo(b) / 0.055);
    for (let k = 2; k < steps - 1; k++) out.push({ n: a.clone().lerp(b, k / steps).normalize(), lamp: k % 7 === 3, rot: k * 1.3 });
  });
  return out;
})();

function Paths() {
  return PATHS.map(({ n, lamp, rot }, i) => (
    <group key={i} position={surface(n, -0.02)} quaternion={upTo(n)}>
      <mesh material={toon(C.stone)} rotation={[0, rot, 0]}><cylinderGeometry args={[0.22, 0.24, 0.08, 6]} /></mesh>
      {lamp && (
        <group position={[0.55, 0, 0]}>
          <M geo={<cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />} color={C.woodDark} position={[0, 0.55, 0]} t={0.015} />
          <mesh position={[0, 1.18, 0]} material={glow(C.lamp)}><sphereGeometry args={[0.17, 10, 8]} /><Ink t={0.012} /></mesh>
          <mesh position={[0, 1.15, 0]}><sphereGeometry args={[0.32, 10, 8]} /><meshBasicMaterial color={C.lamp} transparent opacity={0.18} depthWrite={false} /></mesh>
        </group>
      )}
    </group>
  ));
}

/* ---------------- Kenney Nature Kit models (CC0), re-shaded to match the planet ---------------- */

const MODEL = (n) => `/models/nature/${n}.glb`;
const NATURE = ['tree_oak', 'tree_default', 'tree_detailed', 'tree_fat', 'tree_pineRoundA', 'tree_pineTallA_detailed', 'tree_oak_fall',
  'tree_default_fall', 'tree_small', 'plant_bush', 'plant_bushLarge', 'plant_bushDetailed', 'grass_large', 'flower_redA', 'flower_yellowA',
  'flower_purpleA', 'rock_largeA', 'rock_smallA', 'rock_tallB', 'mushroom_redGroup', 'stump_roundDetailed', 'log_stack', 'crop_pumpkin',
  'crops_cornStageD', 'campfire_stones', 'tent_detailedOpen', 'lily_large'];
NATURE.forEach((n) => useGLTF.preload(MODEL(n)));

// Kenney's teal-green palette, remapped by material name onto the planet's palette.
const KENNEY = {
  leafsGreen: '#56b06f', leafsDark: '#3f8f5f', leafsFall: '#f0a14e', grass: '#7fc27d', corn: '#f2cf5b',
  woodBark: '#9a6440', woodBarkDark: '#6e4a33', woodBirch: '#efe6d6', woodInner: '#e9c79a', wood: '#c58a5c',
  dirt: '#c7bfd3', stone: '#b9b3c6', colorRed: '#ef6f5e', colorYellow: '#ffc85c', colorPurple: '#b98ae6', _defaultMat: '#f6eedf',
};

// Flatten a GLTF into its meshes once (geometry + toon material per original colour + transform).
const flatCache = {};
function flatten(name, scene) {
  if (flatCache[name]) return flatCache[name];
  scene.updateMatrixWorld(true);
  const parts = [];
  const box = new THREE.Box3().setFromObject(scene);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const src = Array.isArray(o.material) ? o.material : [o.material];
    const mat = src.map((m) => toon(KENNEY[m.name] || `#${m.color.getHexString()}`));
    parts.push({ geo: o.geometry, mat: mat.length === 1 ? mat[0] : mat, matrix: o.matrixWorld.clone() });
  });
  return (flatCache[name] = { parts, minY: box.min.y, height: Math.max(0.001, box.max.y - box.min.y) });
}

function Model({ name, h = 1, ink = 0.02, ...rest }) {
  const { scene } = useGLTF(MODEL(name));
  const { parts, minY, height } = flatten(name, scene);
  const k = h / height;
  return (
    <group {...rest}>
      <group scale={k} position={[0, -minY * k, 0]}>
        {parts.map((pt, i) => (
          <mesh key={i} geometry={pt.geo} material={pt.mat} matrix={pt.matrix} matrixAutoUpdate={false} castShadow receiveShadow>
            {ink > 0 && <Ink t={ink / k} />}
          </mesh>
        ))}
      </group>
    </group>
  );
}
Model.propTypes = { name: PropTypes.string.isRequired, h: PropTypes.number, ink: PropTypes.number };

/* ---------------- props ---------------- */


function Fence({ n = 5, w = 0.45 }) {
  return (
    <group>
      {Array.from({ length: n }, (_, i) => <M key={i} geo={<boxGeometry args={[0.07, 0.42, 0.07]} />} color={C.wood} position={[i * w, 0.21, 0]} t={0.02} />)}
      <M geo={<boxGeometry args={[(n - 1) * w + 0.1, 0.06, 0.05]} />} color={C.wood} position={[((n - 1) * w) / 2, 0.3, 0]} t={0.02} />
    </group>
  );
}
Fence.propTypes = { n: PropTypes.number, w: PropTypes.number };

function Windows({ cols, rows, w, h, gapX, gapY, z, lit }) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * gapX, y = (r - (rows - 1) / 2) * gapY;
    out.push(
      <group key={`${r}-${c}`} position={[x, y, z]}>
        <mesh material={toon(INK)}><boxGeometry args={[w + 0.06, h + 0.06, 0.02]} /></mesh>
        <mesh position={[0, 0, 0.012]} material={glow((r + c) % 3 === 0 && lit ? C.lamp : '#a9dcff')}><boxGeometry args={[w, h, 0.02]} /></mesh>
      </group>,
    );
  }
  return out;
}

// Name plate above a place. Hidden whenever the place is on the far side of the planet.
function Sign({ text, icon, hot, y }) {
  const anchor = useRef(), el = useRef();
  const wp = useMemo(() => new THREE.Vector3(), []), wn = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!anchor.current || !el.current) return;
    anchor.current.getWorldPosition(wp);
    wn.copy(wp).normalize();
    const facing = wn.dot(camera.position.clone().sub(wp).normalize());
    el.current.style.opacity = facing > 0.15 ? Math.min(1, (facing - 0.15) * 4).toFixed(2) : '0';
  });
  return (
    <group ref={anchor} position={[0, y, 0]}>
      <Html center distanceFactor={11} zIndexRange={[2, 0]}>
        <div ref={el} className={`w-sign${hot ? ' hot' : ''}`}><span aria-hidden="true">{icon}</span>{text}</div>
      </Html>
    </group>
  );
}
Sign.propTypes = { text: PropTypes.string, icon: PropTypes.string, hot: PropTypes.bool, y: PropTypes.number };

// A tiny resident. `act` picks the loop: hammer, water, walk, wave.
function Person({ shirt, act, scale = 1.7, ...rest }) {
  const g = useRef(), arm = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (act === 'hammer') arm.current.rotation.x = -1.2 + Math.abs(Math.sin(t * 5)) * 1.3;
    if (act === 'water') arm.current.rotation.x = -1.0 + Math.sin(t * 1.5) * 0.25;
    if (act === 'wave') arm.current.rotation.z = 2.4 + Math.sin(t * 6) * 0.4;
    if (act === 'walk') { g.current.position.x = Math.sin(t * 0.6) * 0.9; g.current.rotation.y = Math.cos(t * 0.6) > 0 ? Math.PI / 2 : -Math.PI / 2; g.current.position.y = Math.abs(Math.sin(t * 6)) * 0.04; }
  });
  return (
    <group scale={scale} {...rest}>
      <group ref={g}>
        <M geo={<capsuleGeometry args={[0.13, 0.22, 4, 8]} />} color={shirt} position={[0, 0.3, 0]} t={0.015} />
        <M geo={<sphereGeometry args={[0.12, 10, 8]} />} color={C.skin} position={[0, 0.6, 0]} t={0.015} />
        <M geo={<sphereGeometry args={[0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />} color={C.hair} position={[0, 0.62, 0]} ink={false} />
        <group ref={arm} position={[0.15, 0.42, 0]}>
          <M geo={<capsuleGeometry args={[0.04, 0.16, 3, 6]} />} color={shirt} position={[0, -0.1, 0]} t={0.01} />
          {act === 'hammer' && <M geo={<boxGeometry args={[0.12, 0.06, 0.06]} />} color={INK} position={[0, -0.22, 0.04]} ink={false} />}
          {act === 'water' && <M geo={<cylinderGeometry args={[0.07, 0.06, 0.12, 8]} />} color={C.blue} position={[0, -0.22, 0.06]} t={0.01} />}
        </group>
      </group>
    </group>
  );
}
Person.propTypes = { shirt: PropTypes.string, act: PropTypes.string, scale: PropTypes.number };

// Someone strolling a path between two places, back and forth, forever.
function Stroller({ from, to, shirt, speed, phase }) {
  const g = useRef(), body = useRef();
  const a = STOP_DIRS[from], b = STOP_DIRS[to];
  const n = useMemo(() => new THREE.Vector3(), []), n2 = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    const u = 0.2 + 0.6 * (0.5 - 0.5 * Math.cos(t));            // ease along the middle of the path
    const dir = Math.sin(t) >= 0 ? 1 : -1;
    n.copy(a).lerp(b, u).normalize(); n2.copy(a).lerp(b, u + 0.01 * dir).normalize();
    g.current.position.copy(surface(n, -0.02));
    const fwd = n2.clone().sub(n).normalize();
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(n, fwd), n, fwd);
    g.current.quaternion.setFromRotationMatrix(m);
    body.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 7 + phase)) * 0.05;
  });
  return (
    <group ref={g}>
      <group ref={body} position={[0.32, 0, 0]} scale={1.5}>
        <M geo={<capsuleGeometry args={[0.12, 0.2, 4, 8]} />} color={shirt} position={[0, 0.28, 0]} t={0.015} />
        <M geo={<sphereGeometry args={[0.11, 10, 8]} />} color={C.skin} position={[0, 0.56, 0]} t={0.015} />
        <M geo={<sphereGeometry args={[0.115, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />} color={C.hair} position={[0, 0.58, 0]} ink={false} />
      </group>
    </group>
  );
}
Stroller.propTypes = { from: PropTypes.number, to: PropTypes.number, shirt: PropTypes.string, speed: PropTypes.number, phase: PropTypes.number };

function Sheep({ phase = 0 }) {
  const head = useRef();
  useFrame(({ clock }) => { head.current.rotation.x = 0.5 + Math.max(0, Math.sin(clock.elapsedTime * 0.8 + phase)) * 0.6; });
  return (
    <group>
      {[[0, 0.32, 0, 0.28], [0.18, 0.36, 0.05, 0.2], [-0.18, 0.34, -0.04, 0.21], [0, 0.45, 0.1, 0.18]].map(([x, y, z, r], i) => (
        <M key={i} geo={<icosahedronGeometry args={[r, 0]} />} color="#fbf8f2" position={[x, y, z]} t={0.02} />
      ))}
      {[[-0.15, 0.1], [0.15, 0.1], [-0.15, -0.1], [0.15, -0.1]].map(([x, z], i) => <M key={i} geo={<cylinderGeometry args={[0.03, 0.03, 0.2, 5]} />} color={INK} position={[x, 0.1, z]} ink={false} />)}
      <group ref={head} position={[0, 0.38, 0.3]}>
        <M geo={<boxGeometry args={[0.16, 0.16, 0.2]} />} color="#3b3346" position={[0, 0, 0.08]} t={0.015} />
      </group>
    </group>
  );
}
Sheep.propTypes = { phase: PropTypes.number };

function Sparks() {
  const g = useRef();
  useFrame(({ clock }) => g.current.children.forEach((sp, i) => {
    const k = (clock.elapsedTime * 1.6 + i / 6) % 1;
    const a = i * 2.1;
    sp.position.set(Math.cos(a) * k * 0.5, 0.2 + Math.sin(k * Math.PI) * 0.35, Math.sin(a) * k * 0.5);
    sp.scale.setScalar(0.05 * (1 - k)); sp.visible = Math.sin(clock.elapsedTime * 5) > 0.2;
  }));
  return <group ref={g}>{Array.from({ length: 6 }, (_, i) => <mesh key={i} material={glow('#ffb84d')}><sphereGeometry args={[1, 6, 4]} /></mesh>)}</group>;
}

function Laundry() {
  const g = useRef();
  useFrame(({ clock }) => g.current.children.forEach((c, i) => { c.rotation.x = Math.sin(clock.elapsedTime * 2.2 + i) * 0.25; }));
  return (
    <group>
      {[-0.9, 0.9].map((x) => <M key={x} geo={<cylinderGeometry args={[0.03, 0.03, 1.1, 5]} />} color={C.woodDark} position={[x, 0.55, 0]} ink={false} />)}
      <mesh position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} material={toon(INK)}><cylinderGeometry args={[0.008, 0.008, 1.8, 4]} /></mesh>
      <group ref={g} position={[0, 1.04, 0]}>
        {[[-0.55, C.coral], [-0.1, C.blue], [0.35, C.gold], [0.7, '#ffffff']].map(([x, col]) => (
          <group key={x} position={[x, 0, 0]}><M geo={<boxGeometry args={[0.26, 0.32, 0.02]} />} color={col} position={[0, -0.17, 0]} t={0.01} /></group>
        ))}
      </group>
    </group>
  );
}

/* ---------------- the five places ---------------- */

function Workshop({ hot, crates }) {
  const smoke = useRef();
  useFrame(({ clock }) => smoke.current?.children.forEach((c, i) => {
    const k = (clock.elapsedTime * 0.45 + i / 4) % 1;
    c.position.set(0.7 + Math.sin(k * 6 + i) * 0.12, 2.55 + k * 1.6, -0.5); c.scale.setScalar(0.14 + k * 0.3);
    c.material.opacity = 0.85 * (1 - k);
  }));
  return (
    <group>
      <M geo={<boxGeometry args={[2.6, 1.5, 1.8]} />} color={C.cream} position={[0, 0.75, -0.5]} />
      <M geo={<cylinderGeometry args={[1.45, 1.45, 2.0, 3]} />} color={C.roof} position={[0, 1.78, -0.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[0.72, 1, 1]} />
      <M geo={<boxGeometry args={[0.36, 0.9, 0.36]} />} color={C.woodDark} position={[0.7, 2.2, -0.5]} />
      <M geo={<boxGeometry args={[0.7, 1.0, 0.06]} />} color={C.wood} position={[-0.5, 0.5, 0.42]} />
      <mesh position={[-0.3, 0.5, 0.46]} material={glow(C.gold)}><sphereGeometry args={[0.04, 6, 6]} /></mesh>
      <group position={[0.65, 0.9, 0]}><Windows cols={1} rows={1} w={0.55} h={0.45} gapX={0} gapY={0} z={0.42} lit /></group>
      <M geo={<boxGeometry args={[2.0, 0.08, 0.6]} />} color={C.coral} position={[0, 1.45, 0.62]} rotation={[0.35, 0, 0]} t={0.03} />
      {/* workbench with one glowing crate per shipped project */}
      <M geo={<boxGeometry args={[2.6, 0.12, 0.7]} />} color={C.wood} position={[0, 0.55, 1.35]} />
      {[-1.15, 1.15].map((x) => <M key={x} geo={<boxGeometry args={[0.1, 0.55, 0.6]} />} color={C.woodDark} position={[x, 0.27, 1.35]} t={0.02} />)}
      {crates.map((_, i) => (
        <M key={i} geo={<boxGeometry args={[0.32, 0.32, 0.32]} />} color={i % 2 ? C.gold : C.coral}
          position={[-1.0 + (i * 2.0) / Math.max(1, crates.length - 1), 0.78 + (hot ? Math.abs(Math.sin(i * 1.7)) * 0.08 : 0), 1.35]} rotation={[0, i * 0.4, 0]} t={0.03} />
      ))}
      <group ref={smoke}>{[0, 1, 2, 3].map((i) => <mesh key={i}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffffff" transparent depthWrite={false} /></mesh>)}</group>
      <group position={[-1.6, 0, 0.9]} rotation={[0, Math.PI / 2, 0]}><Fence n={4} /></group>
      <Person shirt={C.blue} act="hammer" position={[0.6, 0, 1.95]} rotation={[0, Math.PI, 0]} />
      <group position={[0.45, 0.62, 1.6]}><Sparks /></group>
      <Person shirt={C.coral} act="wave" position={[-1.25, 0, 1.9]} rotation={[0, 0.4, 0]} />
      <M geo={<boxGeometry args={[0.3, 0.3, 0.3]} />} color={INK} position={[0.45, 0.45, 1.65]} t={0.01} />
    </group>
  );
}
Workshop.propTypes = { hot: PropTypes.bool, crates: PropTypes.array };

function Office({ floors }) {
  const n = Math.max(3, floors);
  const g = useRef();
  // a different window lights up every couple of seconds: someone's working late
  useFrame(({ clock }) => {
    if (!g.current) return;
    const ud = g.current.userData;
    if (!ud.panes) ud.panes = g.current.children.flatMap((fl) => fl.children.slice(1).map((w) => w.children?.[1])).filter((m) => m?.isMesh);
    const panes = ud.panes;
    if (!panes.length) return;
    const on = Math.floor(clock.elapsedTime / 1.6) % panes.length;
    panes.forEach((m, i) => { m.material = glow(i === on || i % 5 === 0 ? C.lamp : '#a9dcff'); });
  });
  return (
    <group ref={g}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[0, 0.42 + i * 0.66, 0]}>
          <M geo={<boxGeometry args={[1.7 - i * 0.06, 0.62, 1.5 - i * 0.06]} />} color={i % 2 ? C.cream : C.lilac} />
          <Windows cols={3} rows={1} w={0.26} h={0.3} gapX={0.45} gapY={0} z={0.76 - i * 0.03} lit={i === n - 1} />
        </group>
      ))}
      <M geo={<boxGeometry args={[0.5, 0.55, 0.06]} />} color={C.blue} position={[0, 0.28, 0.79]} />
      <Person shirt={C.gold} act="wave" position={[0.75, 0, 1.15]} />
      <M geo={<coneGeometry args={[1.05, 0.8, 4]} />} color={C.coral} position={[0, 0.42 + n * 0.66 + 0.05, 0]} rotation={[0, Math.PI / 4, 0]} />
      <M geo={<cylinderGeometry args={[0.025, 0.025, 1.0, 6]} />} color={INK} position={[0.3, 0.42 + n * 0.66 + 0.75, 0]} ink={false} />
      <M geo={<boxGeometry args={[0.5, 0.3, 0.02]} />} color={C.blue} position={[0.56, 0.42 + n * 0.66 + 1.1, 0]} t={0.02} />
    </group>
  );
}
Office.propTypes = { floors: PropTypes.number };

function Tower() {
  const rings = useRef();
  useFrame(({ clock }) => rings.current?.children.forEach((r, i) => {
    const k = (clock.elapsedTime * 0.6 + i / 3) % 1;
    r.scale.setScalar(0.3 + k * 2.6); r.material.opacity = 0.9 * (1 - k);
  }));
  const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  return (
    <group>
      <M geo={<boxGeometry args={[1.2, 0.8, 1.0]} />} color={C.cream} position={[0.9, 0.4, 0.2]} />
      <M geo={<boxGeometry args={[1.3, 0.12, 1.1]} />} color={C.coral} position={[0.9, 0.86, 0.2]} />
      {legs.map(([x, z]) => <M key={`${x}${z}`} geo={<cylinderGeometry args={[0.05, 0.08, 3.8, 6]} />} color={C.coral} position={[x * 0.32, 1.9, z * 0.32]} rotation={[z * 0.1, 0, -x * 0.1]} t={0.02} />)}
      {[0.9, 1.8, 2.7].map((y) => <M key={y} geo={<torusGeometry args={[0.46 - y * 0.08, 0.035, 5, 4]} />} color={C.cream} position={[0, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]} t={0.015} />)}
      <M geo={<sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />} color={C.cream} position={[0, 3.95, 0.12]} rotation={[-1.05, 0, 0]} />
      <mesh position={[0, 4.05, 0]} material={glow('#ff5d5d')}><sphereGeometry args={[0.13, 10, 8]} /></mesh>
      <Person shirt={C.lilac} act="wave" position={[0.9, 0.92, 0.3]} />
      <group ref={rings} position={[0, 4.05, 0]}>
        {[0, 1, 2].map((i) => <mesh key={i} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.035, 6, 32]} /><meshBasicMaterial color="#7dc4ff" transparent depthWrite={false} /></mesh>)}
      </group>
    </group>
  );
}

function Greenhouse({ sprouts }) {
  const plants = useRef();
  useFrame(({ clock }) => plants.current?.children.forEach((p, i) => { p.rotation.z = Math.sin(clock.elapsedTime * 1.4 + i) * 0.12; }));
  const n = Math.max(4, sprouts);
  return (
    <group>
      <M geo={<cylinderGeometry args={[1.55, 1.6, 0.2, 20]} />} color={C.wood} position={[0, 0.1, 0]} />
      <group ref={plants}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.7, 0.2, Math.sin(a) * 0.7]}>
              <M geo={<cylinderGeometry args={[0.04, 0.05, 0.8, 5]} />} color={C.leaf} position={[0, 0.4, 0]} t={0.015} />
              <M geo={<sphereGeometry args={[0.22, 8, 6]} />} color={i % 2 ? C.pink : C.gold} position={[0, 0.86, 0]} t={0.02} />
            </group>
          );
        })}
      </group>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color={C.glass} transparent opacity={0.25} roughness={0.1} depthWrite={false} />
        <Ink t={0.02} />
      </mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 0.2, 0]} rotation={[0, (i * Math.PI) / 4, 0]} material={toon(C.cream)}><torusGeometry args={[1.5, 0.03, 4, 24, Math.PI]} /></mesh>)}
      <Person shirt={C.coral} act="water" position={[1.75, 0, 0.5]} rotation={[0, -1.2, 0]} />
      <Person shirt={C.blue} act="water" position={[-1.7, 0, 0.6]} rotation={[0, 1.3, 0]} />
    </group>
  );
}
Greenhouse.propTypes = { sprouts: PropTypes.number };

function PostOffice({ hot }) {
  const flag = useRef(), letters = useRef();
  useFrame(({ clock }, dt) => {
    if (flag.current) flag.current.rotation.z = THREE.MathUtils.damp(flag.current.rotation.z, hot ? 0 : -Math.PI / 2, 6, dt);
    letters.current?.children.forEach((l, i) => {
      const t = clock.elapsedTime * 0.5 + i * 0.33;
      l.visible = hot;
      l.position.set(Math.cos(t * 2) * (1.2 + i * 0.3), 2.2 + Math.sin(t * 3) * 0.4 + i * 0.3, Math.sin(t * 2) * (1.2 + i * 0.3));
      l.rotation.set(0, -t * 2, Math.sin(t * 4) * 0.3);
    });
  });
  return (
    <group>
      <M geo={<boxGeometry args={[2.2, 1.3, 1.5]} />} color={C.cream} position={[-0.5, 0.65, -0.4]} />
      <M geo={<boxGeometry args={[2.4, 0.24, 1.7]} />} color={C.coral} position={[-0.5, 1.4, -0.4]} />
      <M geo={<boxGeometry args={[1.4, 0.34, 0.05]} />} color={C.blue} position={[-0.5, 1.05, 0.37]} />
      <M geo={<boxGeometry args={[0.55, 0.75, 0.05]} />} color={C.wood} position={[-0.5, 0.38, 0.37]} t={0.02} />
      <M geo={<cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />} color={C.woodDark} position={[1.15, 0.4, 0.6]} />
      <M geo={<boxGeometry args={[0.6, 0.45, 0.75]} />} color={C.blue} position={[1.15, 0.98, 0.6]} />
      <M geo={<cylinderGeometry args={[0.3, 0.3, 0.75, 12, 1, false, 0, Math.PI]} />} color={C.blue} position={[1.15, 1.2, 0.6]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
      <group ref={flag} position={[1.46, 1.05, 0.6]}>
        <M geo={<boxGeometry args={[0.05, 0.55, 0.05]} />} color={C.coral} position={[0, 0.27, 0]} t={0.015} />
        <M geo={<boxGeometry args={[0.05, 0.2, 0.26]} />} color={C.coral} position={[0, 0.48, 0.13]} t={0.015} />
      </group>
      <Person shirt={C.gold} act="walk" position={[0, 0, 1.45]} />
      <Person shirt={C.leaf} act="wave" position={[0.6, 0, 1.0]} rotation={[0, -0.4, 0]} />
      <group position={[-2.1, 0, 0.8]} rotation={[0, 0.9, 0]}><Laundry /></group>
      <group ref={letters}>
        {[0, 1, 2].map((i) => <mesh key={i} material={toon('#ffffff')}><boxGeometry args={[0.36, 0.02, 0.24]} /><Ink t={0.012} /></mesh>)}
      </group>
    </group>
  );
}
PostOffice.propTypes = { hot: PropTypes.bool };

function Windmill() {
  const blades = useRef();
  useFrame((_, dt) => { blades.current.rotation.z += dt * 1.2; });
  return (
    <group>
      <M geo={<cylinderGeometry args={[0.28, 0.45, 1.8, 8]} />} color={C.cream} position={[0, 0.9, 0]} />
      <M geo={<coneGeometry args={[0.4, 0.5, 8]} />} color={C.coral} position={[0, 2.05, 0]} />
      <group ref={blades} position={[0, 1.7, 0.42]}>
        {[0, 1, 2, 3].map((i) => <M key={i} geo={<boxGeometry args={[0.16, 1.1, 0.03]} />} color={C.cream} rotation={[0, 0, (i * Math.PI) / 2]} t={0.015} />)}
      </group>
    </group>
  );
}

/* ---------------- Kamil ---------------- */

function Kamil({ ctl, excited, mood, point }) {
  const g = useRef(), body = useRef(), eyes = useRef(), armL = useRef(), armR = useRef(), brows = useRef();
  const st = useRef({ y: 0, vy: 0, sq: 1, vsq: 0, blink: 0, nextBlink: 2, lands: 0 });
  const { pointer } = useThree();
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30); // springs blow up on long frames (slow phones, tab switches)
    const s = st.current, t = clock.elapsedTime;
    const c = ctl.current;
    if (c.lands !== s.lands) { s.lands = c.lands; s.vsq -= 2.2; }                    // squash on every step
    if (!c.walking && s.y <= 0 && s.vy === 0 && excited && Math.sin(t * 4.2) > 0.985) { s.vy = 4.2; s.vsq = 1.5; }
    s.vy -= 30 * dt; s.y += s.vy * dt;
    if (s.y < 0) { if (s.vy < -2) s.vsq -= Math.min(4, -s.vy * 0.4); s.y = 0; s.vy = 0; }
    s.vsq += ((1 + Math.sin(t * 2.2) * 0.025 - s.sq) * 120 - s.vsq * 9) * dt; s.sq += s.vsq * dt;
    const air = s.y > 0.05 || c.air > 0.15;
    const sy = air ? 1.1 : s.sq, sx = air ? 0.93 : 1 / Math.sqrt(Math.max(0.6, s.sq));
    g.current.position.y = s.y;
    body.current.scale.set(sx, sy, sx);
    if (t > s.nextBlink) { s.blink = 1; s.nextBlink = t + 2 + Math.random() * 3; }
    s.blink = Math.max(0, s.blink - dt * 8);
    const shut = 1 - Math.sin(s.blink * Math.PI) * 0.9;
    eyes.current.children.forEach((e, i) => { e.scale.y = mood === 'wink' && i === 1 ? 0.15 : shut; });
    // arms: wave hello when excited, point at the place when presenting it
    // arms: swing while walking, wave hello when excited, point at the place when presenting it
    // Arm angles (z): the right arm hangs at -1.1 and lifts toward +; the left arm mirrors it.
    const swing = Math.sin(c.stepPhase * Math.PI * 2) * 0.45;
    const pr = point && !c.walking && c.pointSide > 0, pl = point && !c.walking && c.pointSide < 0;
    const waving = excited && !point && !c.walking;
    const rT = c.walking ? -1.0 + swing : pr ? 0.25 : waving ? 1.25 + Math.sin(t * 9) * 0.4 : air ? -0.3 : -1.1;
    const lT = c.walking ? 1.0 + swing : pl ? -0.25 : air ? 0.3 : 1.1;
    armR.current.rotation.z = THREE.MathUtils.damp(armR.current.rotation.z, rT, 10, dt);
    armL.current.rotation.z = THREE.MathUtils.damp(armL.current.rotation.z, lT, 10, dt);
    brows.current.position.y = THREE.MathUtils.damp(brows.current.position.y, excited || point ? 0.5 : 0.42, 8, dt);
    eyes.current.position.x = THREE.MathUtils.damp(eyes.current.position.x, pointer.x * 0.18, 8, dt);
    eyes.current.position.y = THREE.MathUtils.damp(eyes.current.position.y, 0.15 + pointer.y * 0.1, 8, dt);
  });
  const blue = useMemo(() => new THREE.MeshToonMaterial({ color: C.kamil, gradientMap: ramp }), []);
  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.8, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.2} depthWrite={false} /></mesh>
      <group ref={g}>
        <group ref={body}>
          <mesh material={blue} position={[0, 0.8, 0]} scale={[1, 0.84, 1]} castShadow><sphereGeometry args={[1, 32, 24]} /><Ink t={0.06} /></mesh>
          {[[armR, 0.88], [armL, -0.88]].map(([ref, x]) => (
            <group key={x} ref={ref} position={[x, 0.75, 0.1]}>
              <mesh material={blue} position={[Math.sign(x) * 0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.14, 0.32, 4, 8]} /><Ink t={0.04} /></mesh>
            </group>
          ))}
          <mesh position={[-0.42, 1.2, 0.62]} rotation={[0.3, -0.5, 0.6]} scale={[0.22, 0.12, 0.05]} material={glow('#ffffff')}><sphereGeometry args={[1, 12, 8]} /></mesh>
          <group position={[0, 0.8, 0.86]}>
            <group ref={brows} position={[0, 0.42, 0.02]}>
              {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={glow('#0b1217')}><capsuleGeometry args={[0.03, 0.14, 3, 6]} /></mesh>)}
            </group>
            <group ref={eyes} position={[0, 0.15, 0]}>
              {[-0.3, 0.3].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                  <mesh scale={[0.13, 0.22, 0.1]} material={glow('#0b1217')}><sphereGeometry args={[1, 12, 10]} /></mesh>
                  <mesh position={[0.04, 0.08, 0.08]} scale={0.045} material={glow('#ffffff')}><sphereGeometry args={[1, 8, 6]} /></mesh>
                </group>
              ))}
            </group>
            {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, -0.12, -0.05]} scale={[0.14, 0.08, 0.04]}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color={C.pink} transparent opacity={0.85} /></mesh>)}
            <mesh position={[0, -0.18, 0.02]} rotation={[0, 0, Math.PI]} scale={excited ? 1.3 : 1} material={glow('#0b1217')}><torusGeometry args={[0.13, 0.035, 6, 16, Math.PI]} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
Kamil.propTypes = { ctl: PropTypes.object.isRequired, excited: PropTypes.bool, mood: PropTypes.string, point: PropTypes.bool };

/* ---------------- scatter + sky ---------------- */

const SCATTER = (() => {
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (let i = 0; i < 190; i++) {
    const n = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    if (STOP_DIRS.some((d) => n.angleTo(d) < 0.36)) continue;
    if (PATHS.some((p) => p.n.angleTo(n) < 0.06)) continue;
    const r = rnd();
    out.push({ n, kind: r < 0.55 ? 'tree' : r < 0.72 ? 'rock' : r < 0.9 ? 'flower' : 'bush', tk: rnd() < 0.5 ? 0 : 1, s: 0.6 + rnd() * 0.7, r: rnd() * 6 });
  }
  return out;
})();
const MILL = new THREE.Vector3(0.55, -0.35, -0.76).normalize();

const PICK = {
  tree: [['tree_oak', 1.9], ['tree_default', 1.8], ['tree_detailed', 2.0], ['tree_fat', 1.6], ['tree_pineRoundA', 2.0], ['tree_pineTallA_detailed', 2.5], ['tree_oak_fall', 1.9], ['tree_default_fall', 1.8], ['tree_small', 1.2]],
  rock: [['rock_largeA', 0.45], ['rock_smallA', 0.25], ['rock_tallB', 0.6], ['stump_roundDetailed', 0.3]],
  bush: [['plant_bush', 0.55], ['plant_bushLarge', 0.8], ['plant_bushDetailed', 0.65]],
  flower: [['flower_redA', 0.4], ['flower_yellowA', 0.4], ['flower_purpleA', 0.4], ['grass_large', 0.4], ['mushroom_redGroup', 0.35]],
};

function Scatter() {
  return SCATTER.map((it, i) => {
    const list = PICK[it.kind];
    const [name, h] = list[i % list.length];
    return (
      <group key={i} position={surface(it.n, -0.04)} quaternion={upTo(it.n)}>
        <Model name={name} h={h * (0.8 + it.s * 0.3)} rotation={[0, it.r, 0]} ink={it.kind === 'flower' ? 0 : 0.02} />
      </group>
    );
  });
}

// Little scenes around each place, plus a camp in the meadow.
const CAMP = new THREE.Vector3(-0.55, 0.35, -0.76).normalize();
function Dressing({ id }) {
  if (id === 'workshop') return (<>
    <Model name="log_stack" h={0.55} position={[-2.0, 0, -0.3]} rotation={[0, 0.4, 0]} />
    <Model name="stump_roundDetailed" h={0.35} position={[1.9, 0, -0.1]} />
  </>);
  if (id === 'greenhouse') return (<>
    {[[-1.9, 0.3], [-2.2, -0.4], [2.1, -0.6]].map(([x, z], i) => <Model key={i} name="crop_pumpkin" h={0.32} position={[x, 0, z]} rotation={[0, i, 0]} />)}
    {[[-1.6, -1.1], [-1.1, -1.5], [1.7, -1.3]].map(([x, z], i) => <Model key={i} name="crops_cornStageD" h={0.9} position={[x, 0, z]} ink={0} />)}
  </>);
  if (id === 'office') return (<>
    <Model name="plant_bushLarge" h={0.6} position={[-0.95, 0, 0.95]} />
    <Model name="plant_bushLarge" h={0.6} position={[0.95, 0, 0.95]} rotation={[0, 1, 0]} />
  </>);
  if (id === 'post') return (<>
    <Model name="flower_redA" h={0.4} position={[-1.3, 0, 0.55]} ink={0} />
    <Model name="flower_yellowA" h={0.4} position={[0.25, 0, 0.55]} ink={0} />
  </>);
  if (id === 'tower') return <Model name="rock_tallB" h={0.9} position={[-1.3, 0, -0.6]} />;
  return null;
}
Dressing.propTypes = { id: PropTypes.string };

function Sky({ clouds: showClouds = true }) {
  const clouds = useRef(), birds = useRef();
  useFrame(({ clock }, dt) => {
    clouds.current.rotation.y += dt * 0.035;
    birds.current.children.forEach((b, i) => {
      const t = clock.elapsedTime * 0.35 + i * 0.7;
      b.position.set(Math.cos(t) * (13 + i), 4 + Math.sin(t * 1.7) * 1.2 + i * 0.6, Math.sin(t) * (13 + i));
      b.rotation.y = -t;
      const flap = Math.sin(clock.elapsedTime * 9 + i) * 0.5;
      b.children[0].rotation.z = flap; b.children[1].rotation.z = -flap;
    });
  });
  return (
    <>
      <group ref={clouds} visible={showClouds}>
        {[[15, 5, 2], [-14, 8, 6], [5, -10, 14], [-6, 13, -9], [13, -4, -11], [-12, -7, -8]].map((p, i) => (
          <group key={i} position={p} scale={0.8 + (i % 3) * 0.35}>
            {[[0, 0, 0, 1], [0.95, -0.1, 0, 0.75], [-0.95, -0.15, 0, 0.7], [0.3, 0.5, 0, 0.7]].map(([x, y, z, r], j) => (
              <mesh key={j} position={[x, y, z]} material={toon('#ffffff')}><icosahedronGeometry args={[r, 1]} /><Ink t={0.03} /></mesh>
            ))}
          </group>
        ))}
      </group>
      <group ref={birds}>
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <mesh material={glow(INK)} position={[-0.15, 0, 0]}><boxGeometry args={[0.3, 0.03, 0.08]} /></mesh>
            <mesh material={glow(INK)} position={[0.15, 0, 0]}><boxGeometry args={[0.3, 0.03, 0.08]} /></mesh>
          </group>
        ))}
      </group>
    </>
  );
}

function Bouncy({ hot, children }) {
  const g = useRef(), st = useRef({ v: 0, s: 1, was: false });
  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 30), k = st.current;
    if (hot && !k.was) k.v = -3.5;                 // squash on hover-in, then spring back
    k.was = hot;
    k.v += ((1 - k.s) * 160 - k.v * 10) * dt; k.s += k.v * dt;
    g.current.scale.set(1 + (1 - k.s) * 0.6, k.s, 1 + (1 - k.s) * 0.6);
  });
  return <group ref={g}>{children}</group>;
}
Bouncy.propTypes = { hot: PropTypes.bool, children: PropTypes.node };

const SHEEP = [[0.62, 0.55, 0.56], [0.7, 0.45, 0.55], [-0.75, -0.2, 0.62], [0.1, -0.85, 0.5], [-0.3, 0.6, -0.74]].map((v) => new THREE.Vector3(...v).normalize());

Sky.propTypes = { clouds: PropTypes.bool };

/* ---------------- scene ---------------- */

const SIGN_Y = { workshop: 3.4, office: 5.4, tower: 5.2, greenhouse: 2.6, post: 2.8 };

export default function Scene({ phase, stop, onStop, data, compact }) {
  const planet = useRef();
  const q = useRef(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, 0.6, 0)));
  const drag = useRef(null);
  const lookAt = useRef(new THREE.Vector3(-14, 2, 0));
  const kamil = useRef();
  const [hover, setHover] = useState(null);
  const { gl } = useThree();

  const stopQ = useMemo(() => (stop ? faceQuat(STOP_DIRS[STOPS.findIndex((s) => s.id === stop)]) : null), [stop]);
  // Where Kamil stands at a place: front-left of it once the planet has turned it to the top.
  const STAND_W = useMemo(() => TOP.clone().add(new THREE.Vector3(-0.13, -0.02, 0.12)).normalize(), []);
  const standFor = (fq) => STAND_W.clone().applyQuaternion(fq.clone().invert());
  // On the landing he waits at HOME, a meadow between the Workshop and the Greenhouse.
  const HOME = useMemo(() => STOP_DIRS[0].clone().add(STOP_DIRS[3]).normalize(), []);
  const homeQ = useMemo(() => faceQuat(HOME), [HOME]);
  const ctl = useRef({ walking: false, lands: 0, air: 0, stepPhase: 0, pointSide: 1 });
  const walk = useRef({ cur: null, from: null, to: null, start: 0, t: 0, dur: 0, steps: 0, lastStep: 0, forStop: undefined });
  const kq = useRef(new THREE.Quaternion());

  useFrame((state, dt) => {
    const { camera } = state;
    const landing = phase === 'landing';
    const cam = landing ? (compact ? [0, 6, 52] : [-14, 9, 58]) : compact ? (stop ? [0, 18, 13] : [0, 22.5, 18]) : stop ? [1.4, 15.2, 14.5] : [0, 17.5, 22];
    const look = landing ? (compact ? [0, -6.8, 0] : [-14, 2, 0]) : compact ? (stop ? [0, 5.6, 2.8] : [0, 4.6, 0]) : stop ? [2.7, 10.4, 3.4] : [0, 9.2, 2];
    const k = phase === 'diving' ? 3 : 2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cam[0], k, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cam[1], k, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cam[2], k, dt);
    const lk = lookAt.current;
    lk.x = THREE.MathUtils.damp(lk.x, look[0], k, dt); lk.y = THREE.MathUtils.damp(lk.y, look[1], k, dt); lk.z = THREE.MathUtils.damp(lk.z, look[2], k, dt);
    camera.lookAt(lk);
    camera.fov = THREE.MathUtils.damp(camera.fov, phase === 'diving' ? 70 : landing ? (compact ? 46 : 32) : compact ? 50 : stop ? 40 : 42, 4, dt);
    camera.updateProjectionMatrix();

    const w = walk.current, c = ctl.current;
    if (!w.cur) w.cur = HOME.clone();
    // a new destination: walk there from wherever he is now
    if (w.forStop !== stop) {
      w.forStop = stop;
      w.from = w.cur.clone();
      w.to = stop ? standFor(stopQ) : HOME.clone();
      const ang = w.from.angleTo(w.to);
      w.dur = phase === 'landing' ? 0 : THREE.MathUtils.clamp(ang * 2.1, 0.9, 3.0);
      w.steps = Math.max(2, Math.round((ang * R) / 0.85));
      w.start = state.clock.elapsedTime; w.t = 0; w.lastStep = 0;
    }
    let walking = false, hopH = 0;
    if (w.t < w.dur) {
      w.t = Math.min(w.dur, state.clock.elapsedTime - w.start);   // wall-clock time: same walk on any device
      const u = w.t / w.dur, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      w.cur.copy(w.from).lerp(w.to, e).normalize();                    // great-circle-ish walk across the surface
      const sp = e * w.steps, step = Math.floor(sp);
      if (step !== w.lastStep) { w.lastStep = step; c.lands += 1; }
      c.stepPhase = sp % 1;
      hopH = Math.sin((sp % 1) * Math.PI) * 0.45;
      walking = w.t < w.dur;
    } else { w.cur.copy(w.to); c.stepPhase = 0; }
    c.walking = walking; c.air = hopH;

    // the world turns to follow him; once he's arrived it frames the place
    if (!drag.current) {
      const tq = walking ? faceQuat(w.cur) : stopQ || homeQ;
      if (!walking && !stop) {                                          // landing: gentle sway, Kamil stays on top facing you
        const sway = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(state.clock.elapsedTime * 0.25) * 0.05, Math.sin(state.clock.elapsedTime * 0.18) * 0.18, 0));
        q.current.slerp(sway.multiply(tq), 1 - Math.exp(-dt * 1.4));
      } else q.current.slerp(tq, 1 - Math.exp(-dt * (walking ? 3.2 : 2.2)));
    }
    planet.current.quaternion.copy(q.current);

    // place Kamil on the surface (planet-local), orient him in world space, then convert
    const nLocal = w.cur;
    kamil.current.position.copy(surface(nLocal, 0.02 + hopH));
    const nWorld = nLocal.clone().applyQuaternion(q.current);
    const baseW = nWorld.clone().multiplyScalar(R);
    let up, fwd;
    if (walking) {
      up = nWorld;                                                      // feet on the ground, facing the way he's going
      fwd = w.to.clone().applyQuaternion(q.current).sub(nWorld.clone().multiplyScalar(w.to.clone().applyQuaternion(q.current).dot(nWorld)));
      if (fwd.lengthSq() < 1e-6) fwd = camera.position.clone().sub(baseW);
    } else {
      up = UP.clone();                                                  // presenting: upright, facing you
      fwd = camera.position.clone().sub(baseW);
    }
    fwd.sub(up.clone().multiplyScalar(fwd.dot(up))).normalize();
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, fwd), up, fwd);
    const worldQ = new THREE.Quaternion().setFromRotationMatrix(m);
    kq.current.slerp(q.current.clone().invert().multiply(worldQ), 1 - Math.exp(-dt * 10));
    kamil.current.quaternion.copy(kq.current);

    // which arm points at the place: the side of the screen the building is on
    if (stop) {
      const b = STOP_DIRS[STOPS.findIndex((x) => x.id === stop)].clone().applyQuaternion(q.current).multiplyScalar(R).project(camera);
      const k2 = baseW.clone().project(camera);
      c.pointSide = b.x >= k2.x ? 1 : -1;
    }
  });

  const onDown = (e) => { e.stopPropagation(); drag.current = { x: e.clientX, y: e.clientY, moved: 0 }; gl.domElement.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY; d.moved += Math.abs(dx) + Math.abs(dy);
    q.current.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(dy * 0.006, dx * 0.006, 0)));
  };
  const onUp = () => { drag.current = null; };
  const go = (id) => (e) => { e.stopPropagation(); if (drag.current && drag.current.moved > 6) return; onStop(id); };

  const counts = { crates: (data.problems || []).length, floors: (data.experience || []).length, sprouts: (data.hunting || []).length + 4 };

  return (
    <>
      <hemisphereLight args={['#ffe9cf', '#5d64a8', 1.0]} />
      <directionalLight
        position={[14, 24, 10]} intensity={1.9} color="#ffd9a8" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={70}
      />
      <directionalLight position={[-16, 6, -8]} intensity={0.55} color="#9db4ff" />
      <group ref={planet} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        <Terrain />
        {[[-5, 125, 2.4], [52, -150, 1.8]].map(([lat, lon, r], i) => {
          const n = dirOf(lat, lon);
          return (
            <group key={i} position={surface(n, 0.02)} quaternion={upTo(n)}>
              <mesh material={toon(C.water)}><cylinderGeometry args={[r, r, 0.05, 24]} /><Ink t={0.03} /></mesh>
              <Model name="lily_large" h={0.08} position={[r * 0.35, 0.03, r * 0.2]} ink={0} />
              <Model name="lily_large" h={0.08} position={[-r * 0.4, 0.03, -r * 0.1]} rotation={[0, 2, 0]} ink={0} />
            </group>
          );
        })}
        <Paths />
        <group position={surface(CAMP, -0.04)} quaternion={upTo(CAMP)}>
          <Model name="tent_detailedOpen" h={1.1} rotation={[0, 0.6, 0]} />
          <Model name="campfire_stones" h={0.3} position={[1.2, 0, 0.9]} />
        </group>
        <Scatter />
        <group position={surface(MILL, -0.05)} quaternion={upTo(MILL)}><Windmill /></group>
        {SHEEP.map((n, i) => <group key={i} position={surface(n, -0.03)} quaternion={upTo(n)}><group rotation={[0, i * 1.7, 0]}><Sheep phase={i} /></group></group>)}
        <Stroller from={0} to={1} shirt={C.coral} speed={0.22} phase={0} />
        <Stroller from={1} to={2} shirt={C.blue} speed={0.18} phase={2} />
        <Stroller from={2} to={3} shirt={C.gold} speed={0.2} phase={4} />
        <Stroller from={3} to={4} shirt={C.lilac} speed={0.24} phase={1} />
        <Stroller from={4} to={0} shirt={C.leaf} speed={0.19} phase={3} />
        {STOPS.map((s, i) => {
          const n = STOP_DIRS[i];
          const hot = hover === s.id || stop === s.id;
          return (
            <group
              key={s.id} position={surface(n, -0.04)} quaternion={upTo(n)} onClick={go(s.id)}
              onPointerOver={(e) => { e.stopPropagation(); setHover(s.id); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { setHover(null); document.body.style.cursor = ''; }}
            >
              <Bouncy hot={hover === s.id}>
                {s.id === 'workshop' && <Workshop hot={hot} crates={Array(counts.crates).fill(0)} />}
                {s.id === 'office' && <Office floors={counts.floors} />}
                {s.id === 'tower' && <Tower />}
                {s.id === 'greenhouse' && <Greenhouse sprouts={counts.sprouts} />}
                {s.id === 'post' && <PostOffice hot={hot} />}
              </Bouncy>
              <Dressing id={s.id} />
              {phase === 'planet' && <Sign text={s.name} icon={s.icon} hot={hot} y={SIGN_Y[s.id]} />}
              <mesh position={[0, 1.6, 0]} visible={false}><sphereGeometry args={[2.6, 8, 6]} /></mesh>
            </group>
          );
        })}
        <group ref={kamil} scale={phase === 'landing' ? 1.7 : 0.9}>
          <Kamil ctl={ctl} point={phase === 'planet' && !!stop} excited={phase === 'landing' || hover != null} mood={stop === 'post' ? 'wink' : 'happy'} />
        </group>
      </group>
      <Sky clouds={!stop} />
    </>
  );
}

Scene.propTypes = {
  phase: PropTypes.string.isRequired,
  stop: PropTypes.string,
  onStop: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  compact: PropTypes.bool,
};
