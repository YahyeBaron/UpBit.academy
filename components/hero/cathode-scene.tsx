'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CathodeScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ------------------------------------------------------------------
       COORDINATE SYSTEM
       World units are pixels of the 1080x1080 master frame the model was
       measured in. At the isometric rest pose:
         px = X - Z
         py = 0.5774*(X + Z) - 1.1547*Y
       The floor is Y = 0.
    -------------------------------------------------------------------*/

    /* projected bounds of the artwork, in master pixels */
    const ART = { x0: 254, x1: 777, y0: 214, y1: 676 };
    const ART_W = ART.x1 - ART.x0;
    const ART_H = ART.y1 - ART.y0;
    const ART_CX = (ART.x0 + ART.x1) / 2;
    const ART_CY = (ART.y0 + ART.y1) / 2;

    /* world point that sits at the middle of the artwork (solved at Y = 90) */
    const TARGET = new THREE.Vector3(
      ((ART_CY + 1.1547 * 90) / 0.5774 + ART_CX) / 2,
      90,
      ((ART_CY + 1.1547 * 90) / 0.5774 - ART_CX) / 2
    );

    /* isometric rest pose in spherical terms: direction (1,1,1)/sqrt(3) */
    const BASE_THETA = Math.PI / 4;
    const BASE_PHI = Math.acos(1 / Math.sqrt(3));
    const CAM_DIST = 4200;

    THREE.ColorManagement.enabled = false;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    }

    const scene = new THREE.Scene();

    /* Mirror about vertical axis: X = Z + MIRROR_K */
    const MIRROR_K = 515.5;
    const root = new THREE.Group();
    root.matrixAutoUpdate = false;
    root.matrix.set(
      0, 0, 1, MIRROR_K,
      0, 1, 0, 0,
      1, 0, 0, -MIRROR_K,
      0, 0, 0, 1
    );
    scene.add(root);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 12000);
    camera.up.set(0, 1, 0);

    /* orbit state */
    const orb = { x: 0, y: 0, tx: 0, ty: 0, over: 0, tOver: 0 };
    function placeCamera(t: number) {
      const az = orb.x * 0.26 + Math.sin(t * 0.17) * 0.028;
      const el = -orb.y * 0.17 + Math.sin(t * 0.11 + 1.1) * 0.018;
      const th = BASE_THETA + az;
      const ph = Math.min(1.3, Math.max(0.34, BASE_PHI + el));
      const sp = Math.sin(ph);
      camera.position.set(
        TARGET.x + CAM_DIST * sp * Math.cos(th),
        TARGET.y + CAM_DIST * Math.cos(ph),
        TARGET.z + CAM_DIST * sp * Math.sin(th)
      );
      camera.lookAt(TARGET);
    }

    /* palette (sRGB byte values measured off the reference) */
    const C_TOP = 0x1b1b1b;
    const C_FRONT = 0x1b1b1b;
    const C_SIDE = 0x121212;
    const C_DARK = 0x121212;
    const C_LINE = 0x3a3a3a;
    const C_GRID = 0x121212;

    /* ------------------------------------------------------------------ */
    /* materials */
    /* ------------------------------------------------------------------ */
    function faceMaterial(top: number, front: number, side: number) {
      return new THREE.ShaderMaterial({
        uniforms: {
          cTop: { value: new THREE.Color(top) },
          cFront: { value: new THREE.Color(front) },
          cSide: { value: new THREE.Color(side) }
        },
        vertexShader: `
          varying vec3 vN;
          void main(){
            vN = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          uniform vec3 cTop, cFront, cSide;
          varying vec3 vN;
          void main(){
            vec3 n = normalize(vN);
            float ax = abs(n.x), ay = abs(n.y), az = abs(n.z);
            vec3 c = cTop;
            if (ay >= ax && ay >= az)      c = cTop;
            else if (az >= ax)             c = cFront;
            else                           c = cSide;
            gl_FragColor = vec4(c, 1.0);
          }`,
        side: THREE.DoubleSide
      });
    }

    const matLight = faceMaterial(C_TOP, C_SIDE, C_FRONT);
    const matDark = faceMaterial(C_DARK, C_DARK, C_DARK);

    function hazeMaterial(sideMul: number) {
      return new THREE.ShaderMaterial({
        uniforms: { uSide: { value: sideMul } },
        vertexShader: `
          varying vec3 vN; varying vec3 vW;
          void main(){
            vN = normalize(mat3(modelMatrix) * normal);
            vW = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          uniform float uSide;
          varying vec3 vN; varying vec3 vW;
          void main(){
            float f = clamp(0.016196*vW.x - 0.008591*vW.y - 0.007604*vW.z - 5.819, 0.0, 1.0);
            float v = mix(0.0666, 0.0902, f);
            vec3 n = normalize(vN);
            if (abs(n.y) < max(abs(n.x), abs(n.z))) v *= uSide;
            gl_FragColor = vec4(vec3(v), 1.0);
          }`,
        side: THREE.DoubleSide
      });
    }
    const matBg = hazeMaterial(0.8);
    const matBgUp = hazeMaterial(1.0);

    /* ------------------------------------------------------------------ */
    /* screen-space constant-width lines */
    /* ------------------------------------------------------------------ */
    const lineUniforms = {
      uRes: { value: new THREE.Vector2(1080, 1080) },
      uW: { value: 2.0 },
      uTime: { value: 0 },
      uIntro: { value: 0 }
    };

    function lineMaterial(color?: number, opacity?: number, fade?: number[]) {
      return new THREE.ShaderMaterial({
        uniforms: Object.assign(
          {
            uColor: { value: new THREE.Color(color === undefined ? C_LINE : color) },
            uOpacity: { value: opacity === undefined ? 1 : opacity },
            uFade: { value: new THREE.Vector2(fade ? fade[0] : 1e6, fade ? fade[1] : 1e6 + 1) },
            uFadeC: { value: new THREE.Vector2(fade ? fade[2] : 0, fade ? fade[3] : 0) }
          },
          lineUniforms
        ),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform vec2 uRes; uniform float uW;
          attribute vec3 aOther;
          attribute float aSide;
          attribute float aSeed;
          varying vec3 vW; varying float vSeed;
          void main(){
            vW = position; vSeed = aSeed;
            vec4 c0 = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            vec4 c1 = projectionMatrix * modelViewMatrix * vec4(aOther,1.0);
            vec2 n0 = c0.xy / c0.w;
            vec2 n1 = c1.xy / c1.w;
            vec2 d  = (n1 - n0) * uRes;
            float L = length(d);
            d = (L > 0.0001) ? d / L : vec2(1.0, 0.0);
            vec2 perp = vec2(-d.y, d.x);
            vec2 off = (perp * aSide * uW * 0.5 - d * uW * 0.5) / uRes * 2.0;
            c0.xy += off * c0.w;
            gl_Position = c0;
          }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uOpacity;
          uniform float uTime, uIntro; uniform vec2 uFade, uFadeC;
          varying vec3 vW; varying float vSeed;
          void main(){
            float a = uOpacity;

            float depth = clamp((vW.x + vW.z - 380.0) / 760.0, 0.0, 1.0);
            a *= smoothstep(0.0, 0.30, uIntro * 1.34 - depth * 0.34);

            vec2 pp = vec2(vW.x - vW.z, 0.5774 * (vW.x + vW.z) - 1.1547 * vW.y);
            float d = length((pp - uFadeC) * vec2(1.0, 1.5));
            a *= 1.0 - smoothstep(uFade.x, uFade.y, d);

            float scanY = mod(uTime * 54.0, 330.0) - 52.0;
            float dy = vW.y - scanY;
            float pulse = exp(-dy * dy / 110.0) + 0.34 * exp(-dy * dy / 1150.0);

            float w = sin((vW.x + vW.z) * 0.016 - uTime * 1.15);
            float glint = pow(max(w, 0.0), 14.0);

            float sh = 0.94 + 0.06 * sin(uTime * 1.9 + vSeed * 41.0);

            vec3 col = uColor * sh + vec3(pulse * 0.36 + glint * 0.15);
            gl_FragColor = vec4(col, a);
          }`
      });
    }

    const EPS = 0.55;

    function makeLines(segs: number[], color?: number, opacity?: number, fade?: number[]) {
      const n = segs.length / 6;
      const pos = new Float32Array(n * 4 * 3);
      const oth = new Float32Array(n * 4 * 3);
      const side = new Float32Array(n * 4);
      const seed = new Float32Array(n * 4);
      const index = new Uint32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const ax = segs[i * 6] + EPS,
          ay = segs[i * 6 + 1] + EPS,
          az = segs[i * 6 + 2] + EPS;
        const bx = segs[i * 6 + 3] + EPS,
          by = segs[i * 6 + 4] + EPS,
          bz = segs[i * 6 + 5] + EPS;
        const v = i * 4;
        const P = [
          [ax, ay, az, bx, by, bz, -1],
          [ax, ay, az, bx, by, bz, 1],
          [bx, by, bz, ax, ay, az, -1],
          [bx, by, bz, ax, ay, az, 1]
        ];
        for (let k = 0; k < 4; k++) {
          pos[(v + k) * 3] = P[k][0];
          pos[(v + k) * 3 + 1] = P[k][1];
          pos[(v + k) * 3 + 2] = P[k][2];
          oth[(v + k) * 3] = P[k][3];
          oth[(v + k) * 3 + 1] = P[k][4];
          oth[(v + k) * 3 + 2] = P[k][5];
          side[v + k] = P[k][6];
          seed[v + k] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        }
        index[i * 6] = v;
        index[i * 6 + 1] = v + 1;
        index[i * 6 + 2] = v + 2;
        index[i * 6 + 3] = v;
        index[i * 6 + 4] = v + 2;
        index[i * 6 + 5] = v + 3;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aOther', new THREE.BufferAttribute(oth, 3));
      g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
      g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      g.setIndex(new THREE.BufferAttribute(index, 1));
      const m = new THREE.Mesh(g, lineMaterial(color, opacity, fade));
      m.frustumCulled = false;
      m.renderOrder = 2;
      return m;
    }

    class Seg {
      a: number[] = [];
      add(p: [number, number, number], q: [number, number, number]) {
        this.a.push(p[0], p[1], p[2], q[0], q[1], q[2]);
      }
      loop(pts: [number, number, number][]) {
        for (let i = 0; i < pts.length; i++) this.add(pts[i], pts[(i + 1) % pts.length]);
      }
      path(pts: [number, number, number][]) {
        for (let i = 0; i < pts.length - 1; i++) this.add(pts[i], pts[i + 1]);
      }
    }

    function rect(x0: number, y0: number, x1: number, y1: number): [number, number][] {
      return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1]
      ];
    }

    function roundRect(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      r: number,
      seg = 5
    ): [number, number][] {
      r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
      const p: [number, number][] = [];
      const corners: [number, number, number, number][] = [
        [x1 - r, y0 + r, -Math.PI / 2, 0],
        [x1 - r, y1 - r, 0, Math.PI / 2],
        [x0 + r, y1 - r, Math.PI / 2, Math.PI],
        [x0 + r, y0 + r, Math.PI, Math.PI * 1.5]
      ];
      for (const [cx, cy, a0, a1] of corners) {
        for (let i = 0; i <= seg; i++) {
          const a = a0 + ((a1 - a0) * i) / seg;
          p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
        }
      }
      return p;
    }

    type Axis = 'x' | 'y' | 'z';
    const MAP: Record<Axis, (a: number, b: number, t: number) => [number, number, number]> = {
      z: (a, b, t) => [a, b, t],
      x: (a, b, t) => [t, b, -a],
      y: (a, b, t) => [a, t, -b]
    };
    const MATRIX: Record<Axis, THREE.Matrix4> = {
      z: new THREE.Matrix4(),
      x: new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(1, 0, 0)
      ),
      y: new THREE.Matrix4().makeBasis(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 1, 0)
      )
    };

    function toShape(pts: [number, number][]) {
      const s = new THREE.Shape();
      s.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      s.closePath();
      return s;
    }

    function prism(
      pts: [number, number][],
      holes: [number, number][][] | null,
      t0: number,
      t1: number,
      axis: Axis,
      material?: THREE.Material
    ) {
      const shape = toShape(pts);
      if (holes) {
        for (const h of holes) {
          const p = new THREE.Path();
          p.moveTo(h[0][0], h[0][1]);
          for (let i = 1; i < h.length; i++) p.lineTo(h[i][0], h[i][1]);
          p.closePath();
          shape.holes.push(p);
        }
      }
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: t1 - t0,
        bevelEnabled: false,
        curveSegments: 4
      });
      g.translate(0, 0, t0);
      g.applyMatrix4(MATRIX[axis]);
      const m = new THREE.Mesh(g, material || matLight);
      root.add(m);
      return m;
    }

    function loft(
      ptsA: [number, number][],
      zA: number,
      ptsB: [number, number][],
      zB: number,
      material?: THREE.Material
    ) {
      const n = ptsA.length;
      const pos: number[] = [];
      const push = (x: number, y: number, z: number) => {
        pos.push(x, y, z);
      };
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        push(ptsA[i][0], ptsA[i][1], zA);
        push(ptsA[j][0], ptsA[j][1], zA);
        push(ptsB[j][0], ptsB[j][1], zB);

        push(ptsA[i][0], ptsA[i][1], zA);
        push(ptsB[j][0], ptsB[j][1], zB);
        push(ptsB[i][0], ptsB[i][1], zB);
      }
      ([[ptsA, zA], [ptsB, zB]] as const).forEach(function (cap) {
        const pts = cap[0];
        const z = cap[1];
        const tri = THREE.ShapeUtils.triangulateShape(
          pts.map((p) => new THREE.Vector2(p[0], p[1])),
          []
        );
        for (const t of tri) {
          push(pts[t[0]][0], pts[t[0]][1], z);
          push(pts[t[1]][0], pts[t[1]][1], z);
          push(pts[t[2]][0], pts[t[2]][1], z);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, material || matLight);
      root.add(m);
      return m;
    }

    function loopAt(seg: Seg, pts: [number, number][], t: number, axis: Axis) {
      const f = MAP[axis];
      seg.loop(pts.map((p) => f(p[0], p[1], t)));
    }

    function railAt(
      seg: Seg,
      pts: [number, number][],
      idxs: number[],
      t0: number,
      t1: number,
      axis: Axis
    ) {
      const f = MAP[axis];
      for (const i of idxs) {
        seg.add(f(pts[i][0], pts[i][1], t0), f(pts[i][0], pts[i][1], t1));
      }
    }

    /* ==================================================================
       GEOMETRY
       ================================================================== */
    const S = new Seg();

    /* ---------- monitor ------------------------------------------------ */
    const BZ_X0 = 612,
      BZ_X1 = 840,
      BZ_Y0 = 13.4,
      BZ_Y1 = 193,
      BZ_R = 7;
    const SC_X0 = 634.5,
      SC_X1 = 817,
      SC_Y0 = 36,
      SC_Y1 = 170,
      SC_R = 3;
    const Z_FRONT = 210,
      Z_GLASS = 203.6,
      Z_SEAM = 184,
      Z_MID = 146.5,
      Z_BACK = 63;

    const caseOuter = roundRect(BZ_X0, BZ_Y0, BZ_X1, BZ_Y1, BZ_R, 10);
    const screenHole = roundRect(SC_X0, SC_Y0, SC_X1, SC_Y1, SC_R, 7);

    prism(caseOuter, [screenHole.slice().reverse()], Z_GLASS, Z_FRONT, 'z', matLight);
    loopAt(S, caseOuter, Z_FRONT, 'z');
    loopAt(S, screenHole, Z_FRONT, 'z');
    loopAt(S, screenHole, Z_GLASS, 'z');

    prism(caseOuter, null, Z_MID, Z_GLASS, 'z', matLight);
    loopAt(S, caseOuter, Z_MID, 'z');
    loopAt(S, caseOuter, Z_SEAM, 'z');

    const REAR_SEG = 10;
    const rearFront = roundRect(BZ_X0, 12.5, BZ_X1, BZ_Y1, BZ_R, REAR_SEG);
    const rearBack = roundRect(BZ_X0, 12.5, BZ_X1, 78.5, BZ_R, REAR_SEG);
    loft(rearFront, Z_MID, rearBack, Z_BACK, matLight);
    loopAt(S, rearBack, Z_BACK, 'z');

    [REAR_SEG + 1, 3 * (REAR_SEG + 1) - 1].forEach(function (i) {
      S.add(
        [rearFront[i][0], rearFront[i][1], Z_MID],
        [rearBack[i][0], rearBack[i][1], Z_BACK]
      );
    });

    /* plinth */
    const PL_X0 = 616,
      PL_X1 = 832,
      PL_Z0 = 76,
      PL_Z1 = 210,
      PL_Y0 = -1.7,
      PL_Y = 13.4;
    const plinthProfile = rect(PL_X0, PL_Y0, PL_X1, PL_Y);
    prism(plinthProfile, null, PL_Z0, PL_Z1, 'z', matDark);
    loopAt(S, plinthProfile, PL_Z1, 'z');
    loopAt(S, plinthProfile, PL_Z0, 'z');
    railAt(S, plinthProfile, [0, 1, 2, 3], PL_Z0, PL_Z1, 'z');

    loopAt(S, roundRect(621.5, 2.0, 667.5, 9.8, 3.2, 7), PL_Z1 + 0.12, 'z');
    loopAt(S, roundRect(624.0, 3.8, 665.0, 8.0, 2.0, 6), PL_Z1 - 1.7, 'z');

    /* vent block on the right cheek */
    const VENT_Z0 = 90,
      VENT_Y0 = 37,
      VENT_PITCH = 15.5,
      VENT_S = 11;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const z0 = VENT_Z0 + c * VENT_PITCH,
          y0 = VENT_Y0 + r * VENT_PITCH;
        loopAt(S, roundRect(-(z0 + VENT_S), y0, -z0, y0 + VENT_S, 1.6, 5), BZ_X1 + 0.1, 'x');
        loopAt(
          S,
          roundRect(-(z0 + VENT_S) + 1.5, y0 + 1.5, -z0 - 1.5, y0 + VENT_S - 1.5, 1.0, 4),
          BZ_X1 + 0.1,
          'x'
        );
      }
    }

    /* ---------- screen -------------------------------------------------- */
    const screenGeo = new THREE.PlaneGeometry(SC_X1 - SC_X0, SC_Y1 - SC_Y0);
    const NROWS = 11;
    const rowData = new Float32Array(NROWS * 4);
    const caret = new THREE.Vector3(0, -1, 0);
    const screenMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uRow: { value: rowData },
        uCaret: { value: caret },
        uSize: { value: new THREE.Vector2(SC_X1 - SC_X0, SC_Y1 - SC_Y0) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec4 uRow[${NROWS}];
        uniform vec3 uCaret;
        uniform vec2 uSize;
        varying vec2 vUv;

        float band(float y, float c, float h){
          return 1.0 - smoothstep(h*0.5, h*0.5+0.85, abs(y-c));
        }
        float ease(float t){ return t*t*(3.0-2.0*t); }
        float run(float x, float x0, float w){
          if(w <= 0.5) return 0.0;
          return smoothstep(x0-0.9, x0+0.3, x) * (1.0 - smoothstep(x0+w-0.7, x0+w+0.7, x));
        }

        void main(){
          vec2 p = vec2((1.0-vUv.x)*uSize.x, (1.0-vUv.y)*uSize.y);
          float c = 0.0666;

          const float PAD = 19.0, ROW0 = 1.5, PITCH = 13.0, BH = 4.0, GAP = 4.0;
          c = mix(c, 0.098, 1.0 - smoothstep(0.35, 1.15, abs(p.x - 15.0)));

          for(int i=0;i<${NROWS};i++){
            vec4 r = uRow[i];
            if(r.y <= 0.5) continue;
            float y0 = ROW0 + float(i)*PITCH;
            float yb = band(p.y, y0+BH*0.5, BH);
            if(yb <= 0.002) continue;
            c = mix(c, 0.112, yb * run(p.x, 6.0, i < 9 ? 4.0 : 7.0));
            float x = PAD + r.x;
            c = mix(c, 0.145, yb * run(p.x, x, r.y));  x += r.y + GAP;
            c = mix(c, 0.145, yb * run(p.x, x, r.z));  x += r.z + GAP;
            c = mix(c, 0.145, yb * run(p.x, x, r.w));
          }

          if(uCaret.y >= 0.0){
            float y0 = ROW0 + uCaret.y*PITCH;
            c = mix(c, 0.66, band(p.y, y0+BH*0.5, BH+0.8)
                           * (1.0 - smoothstep(1.5, 2.3, abs(p.x - uCaret.x)))
                           * step(mod(uTime, 1.06), 0.62));
          }

          float tb = mod(uTime + 1.10, 6.5667) / 2.87;
          if(tb < 1.0){
            float y = -2.0 + tb * (uSize.y + 6.0);
            float xa = smoothstep(4.8, 6.4, p.x) * (1.0 - smoothstep(156.0, 160.0, p.x));
            float dy = p.y - y;
            c += 0.135 * exp(-abs(dy)*0.085) * xa;
            c = mix(c, 0.92, band(p.y, y, 3.4) * xa);
          }

          float ts = mod(uTime, 1.5) / 0.25;
          if(ts < 1.0){
            float y = -3.0 + ease(ts) * (uSize.y + 8.0);
            float dy = p.y - y;
            float g = (dy < 0.0) ? 0.165 * exp(dy*0.051) : 0.060 * exp(-dy*0.118);
            c += g;
            c = mix(c, 0.70, band(p.y, y, 2.2));
          }

          float g = fract(sin(dot(p * 3.7 + vec2(uTime * 61.0, uTime * 37.0), vec2(12.9898, 78.233))) * 43758.5453);
          c += (g - 0.42) * 0.030;
          c *= 0.985 + 0.015 * sin(p.y * 2.1 + uTime * 3.3);

          gl_FragColor = vec4(vec3(max(c, 0.0)), 1.0);
        }`
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set((SC_X0 + SC_X1) / 2, (SC_Y0 + SC_Y1) / 2, Z_GLASS + 0.05);
    root.add(screen);

    /* ---------- keyboard ------------------------------------------------ */
    const KB_X0 = 623,
      KB_X1 = 838,
      KB_Z0 = 252,
      KB_Z1 = 325.5,
      KB_H = 7;
    const kbProfile = roundRect(KB_X0, -KB_Z1, KB_X1, -KB_Z0, 5, 9);
    prism(kbProfile, null, 0, KB_H, 'y', matLight);
    loopAt(S, kbProfile, KB_H, 'y');
    loopAt(S, kbProfile, 0, 'y');
    railAt(S, kbProfile, [0, 10, 20, 30], 0, KB_H, 'y');

    loopAt(S, roundRect(KB_X0 + 5, -(KB_Z1 - 5), KB_X1 - 5, -(KB_Z0 + 5), 3, 7), KB_H + 0.02, 'y');

    const K_X0 = 630,
      K_PX = 13.18,
      K_W = 10.2;
    const K_Z0 = 258.3,
      K_PZ = 12.34,
      K_D = 9.9;
    const NCOL = 15,
      NROW = 5;
    const SPACE_C0 = 3,
      SPACE_C1 = 7;
    interface KeyCell {
      x0: number;
      x1: number;
      z0: number;
      z1: number;
      cx: number;
      cz: number;
      w: number;
      d: number;
      col: number;
      row: number;
    }
    const keyCells: KeyCell[] = [];
    for (let j = 0; j < NROW; j++) {
      for (let i = 0; i < NCOL; i++) {
        if (j === NROW - 1 && i > SPACE_C0 && i <= SPACE_C1) continue;
        const x0 = K_X0 + i * K_PX;
        let x1 = x0 + K_W;
        if (j === NROW - 1 && i === SPACE_C0) x1 = K_X0 + SPACE_C1 * K_PX + K_W;
        const z0 = K_Z0 + j * K_PZ,
          z1 = z0 + K_D;
        keyCells.push({
          x0,
          x1,
          z0,
          z1,
          cx: (x0 + x1) / 2,
          cz: (z0 + z1) / 2,
          w: x1 - x0,
          d: z1 - z0,
          col: i,
          row: j
        });
        loopAt(S, roundRect(x0, -z1, x1, -z0, 1.5, 6), KB_H + 0.04, 'y');
      }
    }

    /* ---------- mouse ---------------------------------------------------- */
    const MS_X = 592,
      MS_Z = 298,
      MS_W = 34,
      MS_D = 70,
      MS_LIP = 2.6,
      MS_WAIST = 9.4,
      MS_TOP = 13.8;
    const MS_CROWN_SX = 0.8,
      MS_CROWN_SZ = 0.88,
      MS_CROWN_K = 3.0;
    function mouseOutline(sx: number, sz: number, k: number): [number, number][] {
      const p: [number, number][] = [];
      const N = 40;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2,
          ca = Math.cos(a);
        const w = (MS_W / 2) * sx * (0.86 + 0.16 * ca);
        p.push([MS_X + Math.sin(a) * w, -(MS_Z + ca * (MS_D / 2) * sz + k)]);
      }
      return p;
    }
    function crownHalf(z: number) {
      const ca = Math.max(-1, Math.min(1, (z - MS_Z - MS_CROWN_K) / ((MS_D / 2) * MS_CROWN_SZ)));
      return (MS_W / 2) * MS_CROWN_SX * (0.86 + 0.16 * ca) * Math.sqrt(Math.max(0, 1 - ca * ca));
    }
    function loftY(
      ptsA: [number, number][],
      yA: number,
      ptsB: [number, number][],
      yB: number,
      material?: THREE.Material
    ) {
      const m = loft(ptsA, yA, ptsB, yB, material);
      m.geometry.applyMatrix4(MATRIX.y);
      return m;
    }
    const msBase = mouseOutline(1.0, 1.0, 0);
    const msWaist = mouseOutline(0.94, 0.96, 1.4);
    const msCrown = mouseOutline(MS_CROWN_SX, MS_CROWN_SZ, MS_CROWN_K);
    prism(msBase, null, 0, MS_LIP, 'y', matLight);
    loftY(msBase, MS_LIP, msWaist, MS_WAIST, matLight);
    loftY(msWaist, MS_WAIST, msCrown, MS_TOP, matLight);
    loopAt(S, msBase, 0, 'y');
    loopAt(S, msBase, MS_LIP, 'y');
    loopAt(S, msCrown, MS_TOP, 'y');

    [10, 30].forEach(function (i) {
      S.add([msBase[i][0], MS_LIP, -msBase[i][1]], [msWaist[i][0], MS_WAIST, -msWaist[i][1]]);
      S.add([msWaist[i][0], MS_WAIST, -msWaist[i][1]], [msCrown[i][0], MS_TOP, -msCrown[i][1]]);
    });

    const MS_SEAM = 300,
      MS_WZ0 = 286.5,
      MS_WZ1 = 295.5,
      MS_CY = MS_TOP + 0.04;
    const msHalf = crownHalf(MS_SEAM) - 1.2;
    S.add([MS_X - msHalf, MS_CY, MS_SEAM], [MS_X + msHalf, MS_CY, MS_SEAM]);
    S.add([MS_X, MS_CY, MS_SEAM], [MS_X, MS_CY, MS_WZ1]);
    S.add([MS_X, MS_CY, MS_WZ0], [MS_X, MS_CY, 274.0]);
    const msWheel = roundRect(MS_X - 2.2, -MS_WZ1, MS_X + 2.2, -MS_WZ0, 2.0, 5);
    prism(msWheel, null, MS_TOP - 1.4, MS_TOP + 1.0, 'y', matLight);
    loopAt(S, msWheel, MS_TOP + 1.0, 'y');
    loopAt(S, msWheel, MS_CY, 'y');

    /* ---------- background blocks --------------------------------------- */
    const D = new Seg();
    const BG_H = 16.5;
    const bgWall = rect(485, -172, 546, -140);
    prism(bgWall, null, 0, BG_H, 'y', matBg);
    loopAt(D, bgWall, BG_H, 'y');
    loopAt(D, bgWall, 0, 'y');
    railAt(D, bgWall, [0, 1, 2, 3], 0, BG_H, 'y');

    const tower = rect(519, -164, 541, -158);
    prism(tower, null, BG_H, 122, 'y', matBgUp);
    loopAt(D, tower, 122, 'y');
    loopAt(D, tower, BG_H, 'y');
    railAt(D, tower, [0, 1, 2, 3], BG_H, 122, 'y');

    const pad = roundRect(523, -246, 553, -218, 2, 6);
    prism(pad, null, 0, 13, 'y', matBg);
    loopAt(D, pad, 13, 'y');
    loopAt(D, pad, 0, 'y');
    railAt(D, pad, [0, 7, 14, 21], 0, 13, 'y');
    loopAt(D, roundRect(529, -240, 547, -224, 3, 7), 13.04, 'y');

    root.add(makeLines(S.a, C_LINE, 1.0));
    root.add(makeLines(D.a, 0x1e1e1e, 1.0));

    /* ---------- technical floor grid ------------------------------------ */
    (function () {
      const G = new Seg();
      const DASH = 6.5,
        GAP = 5.0;
      function dashed(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
        const dx = bx - ax,
          dz = bz - az;
        const L = Math.hypot(dx, dz);
        let t = 0;
        while (t < L) {
          const t2 = Math.min(t + DASH, L);
          G.add([ax + (dx * t) / L, ay, az + (dz * t) / L], [ax + (dx * t2) / L, ay, az + (dz * t2) / L]);
          t = t2 + GAP;
        }
      }
      const XL = [761, 793.5, 826, 858.5, 891, 923.5, 956, 988.5];
      const ZL = [56, 95, 134, 173, 212, 251, 290, 329, 368, 407];
      for (const x of XL) dashed(x, -1.1, 40, x, -1.1, 430);
      for (const z of ZL) dashed(700, -1.1, z, 1060, -1.1, z);
      dashed(640, -1.1, 290, 780, -1.1, 290);
      dashed(620, -1.1, 251, 760, -1.1, 251);
      root.add(makeLines(G.a, C_GRID, 1.0, [130, 265, 570, 600]));

      const T = new Seg();
      const marks = [
        [891, 173],
        [891, 212],
        [891, 251],
        [891, 329],
        [923.5, 251],
        [923.5, 329],
        [858.5, 290],
        [956, 212],
        [826, 329],
        [793.5, 251],
        [891, 368],
        [956, 290]
      ];
      for (const [x, z] of marks) {
        T.add([x - 3.4, -1.0, z - 3.4], [x + 3.4, -1.0, z + 3.4]);
        T.add([x - 3.4, -1.0, z + 3.4], [x + 3.4, -1.0, z - 3.4]);
      }
      T.add([556, -1.0, 250], [556, -1.0, 236]);
      T.add([560, -1.0, 184], [575, -1.0, 184]);
      root.add(makeLines(T.a, 0x242424, 1.0, [140, 275, 570, 600]));
    })();

    /* ------------------------------------------------------------------ */
    /* lit keys + glow */
    /* ------------------------------------------------------------------ */
    function radialTexture(size: number, power: number) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      if (!g) return new THREE.Texture();
      const img = g.createImageData(size, size);
      const h = size / 2;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const d = Math.min(1, Math.hypot(x - h + 0.5, y - h + 0.5) / h);
          const v = Math.pow(1 - d, power);
          const i = (y * size + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(v * 255);
        }
      }
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      return t;
    }
    const glowTex = radialTexture(128, 2.6);

    const keyQuadGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    interface LitKeyItem {
      cell: KeyCell;
      cap: THREE.MeshBasicMaterial;
      glow: THREE.MeshBasicMaterial;
      on: number;
      level: number;
      t: number;
      duty?: number;
      hold?: number;
      rest?: number;
    }
    const litKeys: LitKeyItem[] = [];
    for (const k of keyCells) {
      const capMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const cap = new THREE.Mesh(keyQuadGeo, capMat);
      cap.scale.set(k.w, 1, k.d);
      cap.position.set(k.cx, KB_H + 0.1, k.cz);
      cap.renderOrder = 3;
      root.add(cap);

      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(keyQuadGeo, glowMat);
      const gs = Math.max(k.w, k.d) * 3.4;
      glow.scale.set(k.w > 20 ? gs * 1.7 : gs, 1, gs);
      glow.position.set(k.cx, KB_H + 0.14, k.cz);
      glow.renderOrder = 4;
      root.add(glow);

      litKeys.push({ cell: k, cap: capMat, glow: glowMat, on: 0, level: 0, t: 0 });
    }

    const wheelCapMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const wheelCap = new THREE.Mesh(keyQuadGeo, wheelCapMat);
    wheelCap.scale.set(2.8, 1, 6.4);
    wheelCap.position.set(MS_X, MS_TOP + 1.06, (MS_WZ0 + MS_WZ1) / 2);
    wheelCap.renderOrder = 3;
    root.add(wheelCap);

    const wheelGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      side: THREE.DoubleSide
    });
    const wheelGlow = new THREE.Mesh(keyQuadGeo, wheelGlowMat);
    wheelGlow.scale.set(22, 1, 22);
    wheelGlow.position.set(MS_X, MS_TOP + 1.1, (MS_WZ0 + MS_WZ1) / 2);
    wheelGlow.renderOrder = 4;
    root.add(wheelGlow);

    /* ------------------------------------------------------------------ */
    /* full-frame plate: graded ground behind, film grain in front */
    /* ------------------------------------------------------------------ */
    const fxCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fxQuad = new THREE.PlaneGeometry(2, 2);
    const fxRes = { value: new THREE.Vector2(1, 1) };
    const fxTime = { value: 0 };

    const bgScene = new THREE.Scene();
    bgScene.add(
      new THREE.Mesh(
        fxQuad,
        new THREE.ShaderMaterial({
          uniforms: { uRes: fxRes, uTime: fxTime },
          depthTest: false,
          depthWrite: false,
          vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: `
            uniform vec2 uRes; uniform float uTime;
            void main(){
              vec2 uv = gl_FragCoord.xy / uRes;
              vec2 q = uv - vec2(0.5, 0.56);
              q.x *= uRes.x / uRes.y;
              float r = length(q);
              float v = mix(0.0664, 0.0225, smoothstep(0.04, 0.92, r));
              v += 0.0055 * sin(uv.x * 3.1 + uTime * 0.13) * cos(uv.y * 2.3 - uTime * 0.09);
              vec3 dq = fract(vec3(gl_FragCoord.xyx) * 0.1031);
              dq += dot(dq, dq.yzx + 33.33);
              v += (fract((dq.x + dq.y) * dq.z) - 0.5) / 255.0;
              gl_FragColor = vec4(vec3(v), 1.0);
            }`
        })
      )
    );

    const fxScene = new THREE.Scene();
    fxScene.add(
      new THREE.Mesh(
        fxQuad,
        new THREE.ShaderMaterial({
          uniforms: { uRes: fxRes, uTime: fxTime },
          transparent: true,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: `
            uniform vec2 uRes; uniform float uTime;
            float hash(vec2 p){
              vec3 q = fract(vec3(p.xyx) * 0.1031);
              q += dot(q, q.yzx + 33.33);
              return fract((q.x + q.y) * q.z);
            }
            void main(){
              vec2 fc = gl_FragCoord.xy;
              float t = floor(uTime * 24.0);
              float n = hash(mod(fc + t * vec2(37.0, 61.0), 917.0)) * 0.72
                      + hash(mod(fc * 0.5 + t * vec2(19.0, 7.0) + 11.0, 613.0)) * 0.28;
              n = pow(n, 2.3);
              float band = 0.0035 * pow(max(sin(fc.y * 0.0035 - uTime * 0.7), 0.0), 8.0);
              gl_FragColor = vec4(vec3(n * 0.056 + band), 1.0);
            }`
        })
      )
    );

    /* ------------------------------------------------------------------ */
    /* animation state */
    /* ------------------------------------------------------------------ */
    let seedVal = 1337;
    function rnd() {
      seedVal = (seedVal * 1664525 + 1013904223) & 0x7fffffff;
      return seedVal / 0x7fffffff;
    }

    const LIT: [number, number, number][] = [
      [0, 5, 1.0],
      [0, 6, 0.33],
      [0, 9, 1.0],
      [0, 10, 1.0],
      [1, 4, 1.0],
      [1, 6, 1.0],
      [1, 8, 1.0],
      [1, 9, 0.62],
      [2, 3, 0.3],
      [2, 4, 1.0],
      [2, 5, 1.0],
      [2, 6, 1.0],
      [2, 8, 1.0],
      [2, 10, 1.0],
      [3, 4, 1.0],
      [3, 6, 0.66],
      [3, 7, 1.0],
      [3, 9, 0.34],
      [4, 9, 1.0]
    ];
    const keyByRC: Record<string, LitKeyItem> = {};
    for (const k of litKeys) keyByRC[k.cell.row + '_' + k.cell.col] = k;
    for (const [rw, cl, duty] of LIT) {
      const k = keyByRC[rw + '_' + cl];
      if (!k) continue;
      k.duty = duty;
      k.on = 1;
      k.level = 1;
      k.hold = duty >= 1 ? 1e9 : 0.25 + rnd() * 0.5;
      if (duty >= 1) {
        k.cap.opacity = 0.74;
        k.glow.opacity = 0.16;
      }
    }

    const flickers = litKeys.filter((k) => k.duty === undefined && (k.cell.col <= 2 || k.cell.row === 4));
    function pickFlicker() {
      return flickers[Math.floor(rnd() * flickers.length)];
    }

    let nextStroke = 0;
    const INDENT = [0, 0, 0, 8, 8, 16, 16, 24];
    const TOKEN = [6, 8, 9, 11, 12, 13, 15, 17, 19, 22, 25, 29, 34, 40];
    const ROW_GAP = 4.0,
      ROW_MAX = 150;
    const rowT = new Float32Array(NROWS);
    let purge = 4.0;

    function seedRow(i: number, blankBias?: number) {
      const b = i * 4;
      rowT[i] = 0.25 + rnd() * 1.7;
      if (rnd() < (blankBias || 0.22)) {
        rowData[b] = rowData[b + 1] = rowData[b + 2] = rowData[b + 3] = 0;
        return;
      }
      const ind = INDENT[Math.floor(rnd() * INDENT.length)];
      const n = 1 + Math.floor(rnd() * 3);
      let budget = ROW_MAX - ind;
      rowData[b] = ind;
      for (let k = 0; k < 3; k++) {
        if (k >= n || budget < 12) {
          rowData[b + 1 + k] = 0;
          continue;
        }
        const w = Math.min(TOKEN[Math.floor(rnd() * TOKEN.length)], budget - 6);
        rowData[b + 1 + k] = w;
        budget -= w + ROW_GAP;
      }
    }

    function placeCaret() {
      for (let i = NROWS - 1; i >= 0; i--) {
        if (rowData[i * 4 + 1] <= 0.5) continue;
        let x = 19 + rowData[i * 4];
        for (let k = 0; k < 3; k++) {
          const w = rowData[i * 4 + 1 + k];
          if (w <= 0.5) break;
          x += w + ROW_GAP;
        }
        caret.set(x - ROW_GAP + 2.6, i, 1);
        return;
      }
      caret.set(0, -1, 0);
    }
    for (let i = 0; i < NROWS; i++) {
      seedRow(i);
      rowT[i] = rnd() * 1.7;
    }
    rowData[(NROWS - 1) * 4 + 1] = 0;
    rowData[(NROWS - 2) * 4 + 1] = 0;
    placeCaret();

    /* ------------------------------------------------------------------ */
    /* fit, orbit, run */
    /* ------------------------------------------------------------------ */
    function resize() {
      const container = canvas?.parentElement;
      const W = Math.max(1, container ? container.clientWidth : window.innerWidth);
      const H = Math.max(1, container ? container.clientHeight : window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);

      const aspect = W / H;
      const marginX = aspect < 1 ? 1.12 : 1.1;
      const marginY = 1.46;
      const viewH = Math.max(ART_H * marginY, (ART_W * marginX) / aspect);
      const hh = 0.35355 * viewH;
      const hw = hh * aspect;
      const biasY = aspect < 1 ? 0.13 : 0.055;
      const biasX = Math.min(0.24, Math.max(0, (aspect - 1.0) * 0.34));
      camera.left = -hw * (1 - biasX);
      camera.right = hw * (1 + biasX);
      camera.top = hh * (1 - biasY);
      camera.bottom = -hh * (1 + biasY);
      camera.updateProjectionMatrix();

      lineUniforms.uRes.value.set(W * dpr, H * dpr);
      const inkCss = Math.min(1.2, Math.max(0.75, (0.8 * H) / viewH));
      lineUniforms.uW.value = Math.max(1.0, inkCss * dpr);
      fxRes.value.set(W * dpr, H * dpr);
    }
    window.addEventListener('resize', resize);

    function pointAt(e: PointerEvent | MouseEvent) {
      const container = canvas?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      orb.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      orb.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      orb.tOver = 1;
    }
    window.addEventListener('pointermove', pointAt, { passive: true });
    window.addEventListener('pointerdown', pointAt, { passive: true });
    const onLeave = () => {
      orb.tOver = 0;
    };
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('mouseleave', onLeave);

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let prev = t0;
    let animId = 0;

    function frame(now: number) {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      const k = 1 - Math.pow(0.0016, dt);
      orb.over += (orb.tOver - orb.over) * k;
      orb.x += (orb.tx * orb.over - orb.x) * k;
      orb.y += (orb.ty * orb.over - orb.y) * k;
      placeCamera(reduced ? 0 : t);

      lineUniforms.uTime.value = reduced ? 6.4 : t;
      lineUniforms.uIntro.value = reduced ? 1 : Math.min(1, t / 2.1);
      screenMat.uniforms.uTime.value = reduced ? 0.75 : t;
      if (reduced) {
        wheelCapMat.opacity = 0.31;
        wheelGlowMat.opacity = 0.044;
      }
      fxTime.value = reduced ? 0 : t;

      if (!reduced) {
        purge -= dt;
        const flush = purge <= 0;
        if (flush) purge = 3.2 + rnd() * 3.5;
        for (let i = 0; i < NROWS; i++) {
          rowT[i] -= dt;
          if (flush) {
            seedRow(i, 0.8);
            rowT[i] = 0.1 + i * 0.06 + rnd() * 0.3;
          } else if (rowT[i] <= 0) seedRow(i);
        }
        placeCaret();

        const wb = 0.55 + 0.45 * Math.sin(t * 1.35);
        wheelCapMat.opacity = 0.2 + 0.2 * wb;
        wheelGlowMat.opacity = 0.028 + 0.03 * wb;

        nextStroke -= dt;
        if (nextStroke <= 0) {
          nextStroke = 0.3 + rnd() * 0.75;
          const kk = pickFlicker();
          if (kk) {
            kk.on = 1;
            kk.level = 1;
            kk.hold = 0.1 + rnd() * 0.25;
            kk.t = 0;
          }
        }
        for (const kk of litKeys) {
          if (kk.duty !== undefined && kk.duty >= 1) continue;
          if (kk.on) {
            kk.t += dt;
            const fade = 0.16;
            let v = 1;
            if (kk.t < 0.05) v = kk.t / 0.05;
            else if (kk.hold !== undefined && kk.t > kk.hold) {
              v = Math.max(0, 1 - (kk.t - kk.hold) / fade);
            }
            kk.cap.opacity = 0.74 * v;
            kk.glow.opacity = 0.16 * v;
            if (kk.hold !== undefined && kk.t > kk.hold + fade) {
              kk.on = 0;
              kk.cap.opacity = 0;
              kk.glow.opacity = 0;
              if (kk.duty !== undefined) {
                kk.rest = (1 / kk.duty - 1) * (kk.hold + fade) * (0.5 + rnd());
              }
            }
          } else if (kk.duty !== undefined) {
            kk.rest = (kk.rest === undefined ? 0.4 : kk.rest) - dt;
            if (kk.rest <= 0) {
              kk.on = 1;
              kk.t = 0;
              kk.hold = 0.25 + rnd() * 0.6;
            }
          }
        }
      }

      renderer.autoClear = true;
      renderer.render(bgScene, fxCam);
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.render(fxScene, fxCam);
      renderer.autoClear = true;

      animId = requestAnimationFrame(frame);
    }

    resize();
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointAt);
      window.removeEventListener('pointerdown', pointAt);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('mouseleave', onLeave);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="cathode-gl" />;
}
