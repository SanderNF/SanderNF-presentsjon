// Photo album — reads album/album.json and renders photos from album/photos/
(() => {
  const C = window.SITE_CONFIG;
  const ALBUM_DIR = "album/";
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = C[el.dataset.bind]));
  $("#year").textContent = new Date().getFullYear();

  let photos = [], visible = [], activeTag = "all", current = 0;

  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  fetch(ALBUM_DIR + "album.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => {
      document.title = `${data.title || "Photo album"} — ${C.name}`;
      if (data.title) $("#album-title").textContent = data.title;
      if (data.description) $("#album-desc").textContent = data.description;
      // newest first; photos without a date go last
      photos = (data.photos || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      renderFilters();
      render();
    })
    .catch((err) => {
      $("#gallery").innerHTML = `<pre class="album-error">error: could not load ${ALBUM_DIR}album.json (${esc(err.message)})\n\n` +
        (location.protocol === "file:"
          ? `browsers block loading JSON from file://. serve the folder instead:\n  $ python3 -m http.server 8000\n  → http://localhost:8000/album.html`
          : `check that the file exists and is valid JSON.`) + `</pre>`;
    });

  function renderFilters() {
    const tags = ["all", ...new Set(photos.flatMap((p) => p.tags || []))];
    $("#filters").innerHTML = tags
      .map((t) => `<button class="chip${t === activeTag ? " on" : ""}" data-tag="${esc(t)}">#${esc(t)}</button>`)
      .join("");
  }

  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    activeTag = btn.dataset.tag;
    renderFilters();
    render();
  });

  function render() {
    visible = activeTag === "all" ? photos : photos.filter((p) => (p.tags || []).includes(activeTag));
    $("#count").textContent = `${visible.length} item${visible.length === 1 ? "" : "s"}`;
    $("#gallery").innerHTML = visible
      .map((p, i) => `
        <button class="photo" data-i="${i}" aria-label="Open ${esc(p.title || p.file)}">
          <img src="${esc(ALBUM_DIR + "photos/" + p.file)}" alt="${esc(p.title || "")}" loading="lazy" />
          <span class="photo-info">
            <b>${esc(p.title || p.file)}</b>
            <small>${[p.location, p.date && fmtDate(p.date)].filter(Boolean).map(esc).join(" · ")}</small>
          </span>
        </button>`)
      .join("");
  }

  // ---------- lightbox ----------
  const lb = $("#lightbox");
  let lastFocus = null;

  function open(i) {
    current = (i + visible.length) % visible.length;
    const p = visible[current];
    resetZoom(false);
    $("#lb-img").src = ALBUM_DIR + "photos/" + p.file;
    $("#lb-img").alt = p.title || "";
    const rows = [
      ["date", p.date && fmtDate(p.date)],
      ["location", p.location],
      ["camera", p.camera],
      ["lens", p.lens],
      ["focal", p["focal-length"]],
      ["aperture", p.apature || p.aperture],
      ["shutter", p.ss],
      ["iso", p.iso],
    ].filter(([, v]) => v && v !== "unknown");
    $("#lb-meta").innerHTML =
      `<h3>${esc(p.title || p.file)}</h3>` +
      (p.description ? `<p>${esc(p.description)}</p>` : "") +
      (rows.length ? `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "") +
      (p.tags?.length ? `<div class="tags">${p.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : "") +
      `<small class="lb-pos">[${current + 1}/${visible.length}]</small>`;
    if (lb.hidden) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = "hidden"; $("#lb-close").focus(); }
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    lastFocus?.focus();
  }

  $("#gallery").addEventListener("click", (e) => {
    const card = e.target.closest(".photo");
    if (card) open(+card.dataset.i);
  });
  $("#lb-close").addEventListener("click", close);
  $("#lb-prev").addEventListener("click", () => open(current - 1));
  $("#lb-next").addEventListener("click", () => open(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") open(current - 1);
    if (e.key === "ArrowRight") open(current + 1);
    if (e.key === "+" || e.key === "=") zoomBy(1.5);
    if (e.key === "-") zoomBy(1 / 1.5);
    if (e.key === "0") resetZoom();
  });

  // ---------- zoom & pan ----------
  const stage = $("#lb-stage"), img = $("#lb-img");
  const MIN = 1, MAX = 8;
  let scale = 1, tx = 0, ty = 0;
  const pointers = new Map();
  let pinchStart = null, dragStart = null;

  // magnifier lens (Vencord ImageZoom style): hold the mouse button on the photo
  // scroll while holding = lens zoom, shift + scroll = lens size
  const lens = $("#lens");
  // lens diameter as a fraction of the viewport's shorter side (like CSS vmin),
  // so it covers the same share of the screen on phones, laptops and big monitors
  let lensOn = false, lensZoom = 3, lensVmin = 0.7, lensAt = [0, 0];
  const lensPx = () => lensVmin * Math.min(innerWidth, innerHeight);
  function drawLens() {
    const [x, y] = lensAt;
    const r = img.getBoundingClientRect();
    const px = x - r.left, py = y - r.top;   // cursor position on the displayed image
    const lensSize = lensPx();
    Object.assign(lens.style, {
      width: `${lensSize}px`, height: `${lensSize}px`,
      left: `${x - lensSize / 2}px`, top: `${y - lensSize / 2}px`,
      backgroundImage: `url("${img.currentSrc || img.src}")`,
      backgroundSize: `${r.width * lensZoom}px ${r.height * lensZoom}px`,
      backgroundPosition: `${lensSize / 2 - px * lensZoom}px ${lensSize / 2 - py * lensZoom}px`,
    });
    $("#lens-level").textContent = `${lensZoom.toFixed(1)}×`;
  }
  function showLens(x, y) {
    lensOn = true; lensAt = [x, y];
    lens.hidden = false; stage.classList.add("magnifying");
    drawLens();
  }
  function hideLens() {
    lensOn = false;
    lens.hidden = true; stage.classList.remove("magnifying");
  }

  function apply() {
    // keep the image covering the stage — no panning past its edges
    const maxX = (img.offsetWidth * (scale - 1)) / 2, maxY = (img.offsetHeight * (scale - 1)) / 2;
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    stage.classList.toggle("zoomed", scale > 1);
    $("#zoom-level").textContent = `${Math.round(scale * 100)}%`;
  }
  // zoom to `next`, keeping the point (cx, cy) — relative to the image centre — fixed on screen
  function zoomTo(next, cx = 0, cy = 0) {
    next = Math.max(MIN, Math.min(MAX, next));
    tx = cx - (cx - tx) * (next / scale);
    ty = cy - (cy - ty) * (next / scale);
    scale = next;
    apply();
  }
  const zoomBy = (f, cx, cy) => zoomTo(scale * f, cx, cy);
  function resetZoom(animate = true) {
    if (!animate) img.style.transition = "none";
    scale = 1; tx = ty = 0;
    apply();
    if (!animate) requestAnimationFrame(() => (img.style.transition = ""));
  }
  // pointer position relative to the centre of the image's untransformed box
  function rel(x, y) {
    const r = stage.getBoundingClientRect();
    return [x - (r.left + r.width / 2), y - (r.top + r.height / 2)];
  }

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (lensOn) {
      if (e.shiftKey) lensVmin = Math.max(0.15, Math.min(1.2, lensVmin * Math.exp(-(e.deltaY || e.deltaX) * 0.002)));
      else lensZoom = Math.max(1.5, Math.min(12, lensZoom * Math.exp(-e.deltaY * 0.003)));
      return drawLens();
    }
    zoomBy(Math.exp(-e.deltaY * 0.0025), ...rel(e.clientX, e.clientY));
  }, { passive: false });

  stage.addEventListener("dblclick", (e) => {
    if (scale > 1) resetZoom();
    else zoomTo(2.5, ...rel(e.clientX, e.clientY));
  });

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), scale };
      dragStart = null;
    } else if (pointers.size === 1) {
      dragStart = { x: e.clientX, y: e.clientY, tx, ty };
    }
    // not zoomed in: holding the button shows the magnifier; a second finger switches to pinch
    if (pointers.size === 1 && scale === 1 && e.button === 0) showLens(e.clientX, e.clientY);
    else hideLens();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (lensOn) { lensAt = [e.clientX, e.clientY]; return drawLens(); }
    if (pinchStart && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = rel((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      stage.classList.add("dragging");
      zoomTo(pinchStart.scale * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinchStart.dist), ...mid);
    } else if (dragStart && scale > 1) {
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      stage.classList.add("dragging");
      tx = dragStart.tx + dx; ty = dragStart.ty + dy;
      apply();
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    hideLens();
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 1) {
      const [[x, y]] = pointers.values();
      dragStart = { x, y, tx, ty };   // continue panning with the remaining finger
    } else if (pointers.size === 0) {
      dragStart = null;
      stage.classList.remove("dragging");
    }
  }
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  // zoom buttons: a tap zooms one step, press-and-hold keeps zooming until released
  function holdToZoom(btn, step, perSecond) {
    let timer = null, frame = null, last = 0;
    const loop = (t) => {
      if (last) zoomBy(Math.pow(perSecond, (t - last) / 1000));
      last = t;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      clearTimeout(timer); cancelAnimationFrame(frame);
      timer = frame = null; last = 0;
      stage.classList.remove("dragging");
    };
    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      btn.setPointerCapture(e.pointerId);
      zoomBy(step);
      timer = setTimeout(() => {
        stage.classList.add("dragging");   // disables the CSS transition for smooth continuous zoom
        frame = requestAnimationFrame(loop);
      }, 350);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => btn.addEventListener(ev, stop));
    // keyboard activation (Enter/Space) still zooms one step
    btn.addEventListener("click", (e) => { if (e.detail === 0) zoomBy(step); });
    btn.addEventListener("contextmenu", (e) => e.preventDefault()); // no long-press menu on touch
  }
  holdToZoom($("#zoom-in"), 1.5, 3);
  holdToZoom($("#zoom-out"), 1 / 1.5, 1 / 3);
  $("#zoom-reset").addEventListener("click", () => resetZoom());
  addEventListener("resize", () => !lb.hidden && apply());
})();
