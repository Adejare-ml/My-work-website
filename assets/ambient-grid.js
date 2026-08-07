/* ============================================================
   terminal-editorial v5 — ambient depth grid
   A quiet field of periwinkle points receding into the ink
   canvas: slow z-drift ("breathing"), gentle depth-weighted
   tilt toward the pointer. Zero dependencies, WebGL1, a single
   gl.POINTS draw call. Mounts nothing unless every gate passes;
   unmounts live if prefers-reduced-motion flips on.
   Classic script, so it also works over file://.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    cols: 56,
    rows: 32,
    layers: 5,          /* points = cols × rows × layers (~9k) */
    /* 0.105 is the accessibility ceiling: above it a lit point core
       composites the ink canvas light enough that --muted body labels
       drop under 4.5:1 (WCAG AA). Presence that would have come from
       more alpha comes from a larger, softer point instead. */
    opacity: 0.10,
    driftSpeed: 0.032,  /* z cycles per second (~31s per full pass) */
    tiltMaxDeg: 5,      /* pointer parallax cap */
    pointSize: 3.6,     /* compensates for the capped alpha */
    /* Scroll dolly. Negative so scrolling down walks the camera forward
       into the field. ~9100px of scroll per full z-pass — about a tenth
       of a pass per viewport, which sits right at the threshold of
       conscious notice. This is what makes the layer register at all:
       visitors notice relative movement, not alpha, and alpha is capped
       above for contrast. Too large and it reads as a screensaver. */
    dollyPerPx: -0.00011,
    dprCap: 1.5,
    minViewport: 768
  };

  /* z runs 0 (near) → 1 (far) and wraps; both wrap edges fade to
     zero so the loop is seamless. Tilt shifts near points most. */
  var VERT =
    'attribute vec3 a_pos;' +
    'uniform float u_phase;' +
    'uniform vec2  u_tilt;' +
    'uniform float u_dpr;' +
    'uniform float u_size;' +
    'varying float v_fade;' +
    'void main() {' +
    '  float z = fract(a_pos.z + u_phase);' +
    '  float persp = 1.0 / (0.35 + z * 2.2);' +
    '  vec2 p = a_pos.xy * persp + u_tilt * (1.0 - z);' +
    '  v_fade = smoothstep(0.0, 0.18, z) * (1.0 - smoothstep(0.72, 1.0, z));' +
    '  gl_Position = vec4(p, 0.0, 1.0);' +
    '  gl_PointSize = clamp(u_size * persp * u_dpr, 1.0, 7.0 * u_dpr);' +
    '}';

  /* #a7b5f2, premultiplied — the only color this layer knows */
  var FRAG =
    'precision mediump float;' +
    'uniform float u_opacity;' +
    'varying float v_fade;' +
    'void main() {' +
    '  float a = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));' +
    '  a *= v_fade * u_opacity;' +
    '  gl_FragColor = vec4(vec3(0.6549, 0.7098, 0.9490) * a, a);' +
    '}';

  var rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = null;

  /* Reduced motion is NOT a gate: the layer still mounts and paints
     a single static frame, so those visitors get the depth without
     the drift. The rest are capability gates. */
  function gatesPass() {
    if (window.matchMedia('(pointer: coarse)').matches) return false;
    if (window.innerWidth < CONFIG.minViewport) return false;
    return true;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  function buildGrid() {
    var n = CONFIG.cols * CONFIG.rows * CONFIG.layers;
    var arr = new Float32Array(n * 3);
    var i = 0;
    for (var l = 0; l < CONFIG.layers; l++) {
      for (var r = 0; r < CONFIG.rows; r++) {
        for (var c = 0; c < CONFIG.cols; c++) {
          /* regular grid spanning ±1.5 clip units with slight jitter
             so it reads organic rather than printed */
          arr[i++] = ((c / (CONFIG.cols - 1)) * 2 - 1) * 1.5 + (Math.random() - 0.5) * 0.06;
          arr[i++] = ((r / (CONFIG.rows - 1)) * 2 - 1) * 1.5 + (Math.random() - 0.5) * 0.06;
          arr[i++] = Math.random();
        }
      }
    }
    return arr;
  }

  /* Measure the element, not the window: CSS sizes the canvas to the
     initial containing block, which excludes the scrollbar. Using
     innerWidth here would stretch the field by the scrollbar's width. */
  function resize() {
    if (!state) return;
    var dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    var w = state.canvas.clientWidth || window.innerWidth;
    var h = state.canvas.clientHeight || window.innerHeight;
    state.canvas.width = Math.round(w * dpr);
    state.canvas.height = Math.round(h * dpr);
    state.gl.viewport(0, 0, state.canvas.width, state.canvas.height);
    state.gl.uniform1f(state.uDpr, dpr);
  }

  function draw() {
    var s = state;
    var gl = s.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(s.uPhase, s.phase);
    gl.uniform2f(s.uTilt, s.tilt[0], s.tilt[1]);
    gl.uniform1f(s.uOpacity, CONFIG.opacity);
    gl.uniform1f(s.uSize, CONFIG.pointSize);
    gl.drawArrays(gl.POINTS, 0, s.count);
  }

  /* Redraw budget. This is a full-viewport fixed layer, so every draw
     makes the compositor re-blend the whole screen — that composite, not
     the single POINTS call, is the cost. Skipping a draw leaves the layer
     undamaged and the frame costs nothing. 24ms sits between a 60Hz single
     (16.7ms) and double (33.3ms) frame, so 60Hz lands cleanly on 30fps and
     high-refresh panels fall to ~36fps. At this drift speed the difference
     is invisible. */
  var MIN_MS = 24;

  function frame(ts) {
    var s = state;
    if (!s) return;
    s.raf = requestAnimationFrame(frame);
    if (s.last && ts - s.last < MIN_MS) return;
    var dt = s.last ? Math.min((ts - s.last) / 1000, 0.1) : 0;
    s.last = ts;
    s.drift = (s.drift + dt * CONFIG.driftSpeed) % 1;
    /* same dt-correct filter as the tilt, so an anchor jump eases in
       over ~a fifth of a second instead of whipping */
    s.dolly += (s.dollyTo - s.dolly) * (1 - Math.exp(-dt / 0.2));
    /* wrapped JS-side so u_phase never grows large enough to cost
       float precision on a long page */
    s.phase = ((s.drift + s.dolly) % 1 + 1) % 1;
    var k = Math.tan(CONFIG.tiltMaxDeg * Math.PI / 180);
    /* dt-correct smoothing: a 0.2s time constant reproduces the old
       per-frame 0.08 exactly at 60Hz, but no longer tracks the refresh
       rate — so the redraw cap above cannot stretch the parallax, and
       1-exp() stays in [0,1) for any dt so it can never overshoot */
    var a = 1 - Math.exp(-dt / 0.2);
    s.tilt[0] += (s.target[0] * k - s.tilt[0]) * a;
    s.tilt[1] += (s.target[1] * k - s.tilt[1]) * a;
    draw();
  }

  function init() {
    if (state) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'ambient-grid';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: 'low-power'
      });
    } catch (e) { gl = null; }
    if (!gl) return; /* no WebGL — the page is complete without this layer */

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var grid = buildGrid();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    state = {
      canvas: canvas,
      gl: gl,
      count: grid.length / 3,
      uPhase: gl.getUniformLocation(prog, 'u_phase'),
      uTilt: gl.getUniformLocation(prog, 'u_tilt'),
      uDpr: gl.getUniformLocation(prog, 'u_dpr'),
      uSize: gl.getUniformLocation(prog, 'u_size'),
      uOpacity: gl.getUniformLocation(prog, 'u_opacity'),
      /* phase = drift + dolly, tracked apart. Scroll maps ABSOLUTELY to
         dollyTo rather than accumulating deltas, so scrolling back up
         retraces the camera exactly instead of drifting. */
      phase: 0,
      drift: Math.random(), /* different entry point each visit */
      dolly: 0,
      dollyTo: 0,
      last: 0,
      tilt: [0, 0],
      target: [0, 0],
      raf: 0,
      onMove: function (e) {
        if (!state) return;
        state.target[0] = (e.clientX / window.innerWidth) * 2 - 1;
        state.target[1] = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      onScroll: function () {
        if (state) state.dollyTo = window.scrollY * CONFIG.dollyPerPx;
      },
      /* no preventDefault: the context is gone, so let it drop and
         rebuild from scratch once the GPU process has settled */
      onLost: function () {
        destroy();
        setTimeout(evaluate, 1000);
      }
    };

    canvas.addEventListener('webglcontextlost', state.onLost);
    document.body.prepend(canvas);
    resize();

    if (rmQuery.matches) {
      draw(); /* one still frame: depth without drift */
      return;
    }
    window.addEventListener('mousemove', state.onMove, { passive: true });
    window.addEventListener('scroll', state.onScroll, { passive: true });
    state.onScroll(); /* adopt the restored scroll position, don't ease from 0 */
    state.dolly = state.dollyTo;
    state.raf = requestAnimationFrame(frame);
  }

  function destroy() {
    if (!state) return;
    var s = state;
    state = null;
    cancelAnimationFrame(s.raf);
    window.removeEventListener('mousemove', s.onMove);
    window.removeEventListener('scroll', s.onScroll);
    s.canvas.removeEventListener('webglcontextlost', s.onLost);
    var lose = s.gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    if (s.canvas.parentNode) s.canvas.parentNode.removeChild(s.canvas);
  }

  /* rebuild rather than patch when the motion preference flips, so
     the static-frame and animated modes never half-apply */
  function evaluate(rebuild) {
    if (rebuild) destroy();
    if (gatesPass()) { if (!state) init(); }
    else destroy();
  }

  /* Uniform-driven values apply on the next draw; anything that
     changes the geometry or the gates rebuilds. Used by motion-lab. */
  var LIVE = { opacity: 1, driftSpeed: 1, tiltMaxDeg: 1, pointSize: 1, dollyPerPx: 1 };

  function set(patch) {
    var rebuild = false;
    Object.keys(patch || {}).forEach(function (key) {
      if (!(key in CONFIG) || CONFIG[key] === patch[key]) return;
      if (!LIVE[key]) rebuild = true;
      CONFIG[key] = patch[key];
    });
    if (rebuild) evaluate(true);
    else if (state && !state.raf) draw(); /* static mode needs a repaint */
  }

  window.AmbientGrid = { init: init, destroy: destroy, set: set };

  var onPrefChange = function () { evaluate(true); };
  if (rmQuery.addEventListener) rmQuery.addEventListener('change', onPrefChange);
  else if (rmQuery.addListener) rmQuery.addListener(onPrefChange);

  document.addEventListener('visibilitychange', function () {
    if (!state || rmQuery.matches) return; /* static mode has no loop */
    if (document.hidden) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.last = 0;
    } else if (!state.raf) {
      state.raf = requestAnimationFrame(frame);
    }
  });

  var resizePending = false;
  window.addEventListener('resize', function () {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(function () {
      resizePending = false;
      evaluate();           /* viewport gate may have flipped */
      if (!state) return;
      resize();
      if (!state.raf) draw(); /* resizing clears the static frame */
    });
  });

  evaluate();
})();
