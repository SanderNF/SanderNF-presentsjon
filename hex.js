// Animated hexagon background — shared by every page with <canvas id="hexbg">
(() => {
  const $ = (sel) => document.querySelector(sel);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // hexagon colours follow the flag preset (theme.js)
  let lineRgb = "0, 255, 163", fillRgb = "0, 212, 255";
  const readColours = () => {
    const cs = getComputedStyle(document.documentElement);
    // a preset with its own background colour (--hex-*) colours the hexagons too; otherwise the accents
    lineRgb = cs.getPropertyValue("--hex-rgb").trim() || cs.getPropertyValue("--accent-rgb").trim() || lineRgb;
    fillRgb = cs.getPropertyValue("--hex-fill-rgb").trim() || cs.getPropertyValue("--accent-2-rgb").trim() || fillRgb;
  };
  readColours();
  window.SNF_FLAG?.onChange(() => { readColours(); if (reducedMotion) draw(); });
  const cv = $("#hexbg"), ctx = cv.getContext("2d");
  const R = 30;                       // hex radius (px) — change for bigger/smaller cells
  const W = R * 1.5, H = Math.sqrt(3) * R;
  let hexes = [], mouse = { x: -1e4, y: -1e4 }, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hexes = [];
    for (let c = -1; c * W < innerWidth + R; c++)
      for (let r = -1; r * H < innerHeight + H; r++)
        hexes.push({ x: c * W, y: r * H + (c % 2 ? H / 2 : 0), glow: 0 });
  }
  function hexPath(x, y, rad) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
    }
    ctx.closePath();
  }
  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const h of hexes) {
      if (Math.random() < 0.0006) h.glow = 1;          // random pulse
      const d = Math.hypot(h.x - mouse.x, h.y - mouse.y);
      const near = Math.max(0, 1 - d / 220);           // cursor glow
      const g = Math.max(h.glow, near);
      hexPath(h.x, h.y, R - 2);
      ctx.strokeStyle = `rgba(${lineRgb}, ${0.06 + g * 0.55})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (g > 0.05) {
        ctx.fillStyle = `rgba(${fillRgb}, ${g * 0.08})`;
        ctx.fill();
      }
      h.glow *= 0.97;
    }
    if (!reducedMotion) requestAnimationFrame(draw);
  }
  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });
  addEventListener("resize", resize);
  resize();
  draw();
})();
