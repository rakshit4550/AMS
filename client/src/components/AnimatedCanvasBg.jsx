import React, { useEffect, useRef } from "react";

/**
 * Full-page galaxy background — polished existing layers only (no extra gimmicks).
 */
const AnimatedCanvasBg = ({ className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false });
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;
    let paused = false;
    let mobile = false;

    const mouse = {
      x: 0.5,
      y: 0.4,
      tx: 0.5,
      ty: 0.4,
      inside: false,
      down: false,
      energy: 0,
    };

    const ripples = [];
    const sparks = [];
    const trails = [];

    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const makeFarStars = (n) =>
      Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.3, 1.15),
        a: rand(0.28, 0.78),
        tw: rand(0, Math.PI * 2),
        tws: rand(0.55, 1.7),
      }));

    const makeNearStars = (n) =>
      Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.85, 2.7),
        a: rand(0.55, 1),
        tw: rand(0, Math.PI * 2),
        tws: rand(1, 2.5),
        hue: Math.random(),
        spike: Math.random() > 0.8,
      }));

    const makeArmStars = (n) =>
      Array.from({ length: n }, () => {
        const arm = (Math.random() * 4) | 0;
        return {
          arm,
          p: Math.random(),
          jitter: rand(-0.045, 0.045),
          r: rand(0.5, 2.2),
          bright: Math.random(),
          tw: rand(0, Math.PI * 2),
        };
      });

    const makeDrifters = (n) =>
      Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: rand(0.0012, 0.0042) * (Math.random() > 0.5 ? 1 : -1),
        vy: rand(-0.001, 0.001),
        r: rand(0.7, 2.3),
        a: rand(0.45, 0.95),
        trail: rand(8, 20),
      }));

    let farStars = makeFarStars(280);
    let nearStars = makeNearStars(90);
    let armStars = makeArmStars(440);
    let drifters = makeDrifters(40);
    let shootingStars = [];

    const nebulaClouds = [
      { x: 0.52, y: 0.42, rx: 0.7, ry: 0.3, rot: -0.45, c: [125, 85, 220], a: 0.34 },
      { x: 0.4, y: 0.4, rx: 0.46, ry: 0.23, rot: -0.4, c: [35, 195, 235], a: 0.28 },
      { x: 0.64, y: 0.44, rx: 0.44, ry: 0.21, rot: -0.5, c: [235, 65, 145], a: 0.26 },
      { x: 0.32, y: 0.48, rx: 0.38, ry: 0.17, rot: -0.35, c: [75, 115, 255], a: 0.22 },
      { x: 0.72, y: 0.36, rx: 0.34, ry: 0.15, rot: -0.55, c: [185, 95, 255], a: 0.2 },
      { x: 0.5, y: 0.42, rx: 0.28, ry: 0.13, rot: -0.45, c: [255, 195, 135], a: 0.17 },
    ];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      mobile = w < 768;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      farStars = makeFarStars(mobile ? 160 : 300);
      nearStars = makeNearStars(mobile ? 50 : 95);
      armStars = makeArmStars(mobile ? 260 : 480);
      drifters = makeDrifters(mobile ? 24 : 42);
    };

    const onMove = (e) => {
      mouse.tx = e.clientX / Math.max(w, 1);
      mouse.ty = e.clientY / Math.max(h, 1);
      mouse.inside = true;
      mouse.energy = Math.min(1, mouse.energy + 0.08);

      if (Math.random() > 0.42) {
        trails.push({
          x: mouse.tx,
          y: mouse.ty,
          life: 1,
          vx: rand(-0.001, 0.001),
          vy: rand(-0.001, 0.001),
          r: rand(1, 3),
        });
      }
    };

    const onLeave = () => {
      mouse.inside = false;
    };

    const onDown = (e) => {
      mouse.down = true;
      mouse.tx = e.clientX / Math.max(w, 1);
      mouse.ty = e.clientY / Math.max(h, 1);
      mouse.energy = 1;
      ripples.push({ x: mouse.tx, y: mouse.ty, life: 0, max: 1.4 });

      for (let i = 0; i < (mobile ? 14 : 26); i += 1) {
        const ang = rand(0, Math.PI * 2);
        const sp = rand(0.004, 0.018);
        sparks.push({
          x: mouse.tx,
          y: mouse.ty,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 1,
          c: Math.random() > 0.5 ? "cyan" : "magenta",
        });
      }
    };

    const onUp = () => {
      mouse.down = false;
    };

    const galaxyCenter = () => ({
      x: 0.52 + (mouse.x - 0.5) * 0.03,
      y: 0.42 + (mouse.y - 0.5) * 0.02,
    });

    const attract = (nx, ny, strength = 1) => {
      if (!mouse.inside && mouse.energy < 0.05) {
        return { x: nx * w, y: ny * h, pull: 0, dist: 1 };
      }
      const dx = nx - mouse.x;
      const dy = ny - mouse.y;
      const distPx = Math.hypot(dx * w, dy * h);
      const radius = Math.min(w, h) * (mouse.down ? 0.42 : 0.28);
      const d = distPx / Math.max(radius, 1);
      const falloff = Math.exp(-d * d * 2.2);
      const pull =
        falloff * strength * (0.04 + mouse.energy * 0.1) * (mouse.down ? 2.2 : 1);
      return {
        x: (nx - dx * pull) * w,
        y: (ny - dy * pull) * h,
        pull,
        dist: d,
      };
    };

    const drawDeepSpace = () => {
      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.9,
      );
      g.addColorStop(0, "#10183a");
      g.addColorStop(0.35, "#080e22");
      g.addColorStop(0.7, "#040812");
      g.addColorStop(1, "#02040a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const drawFarStars = () => {
      farStars.forEach((s) => {
        s.tw += 0.03 * s.tws;
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(s.tw));
        const pt = attract(s.x, s.y, 0.35);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(pt.x, pt.y, s.r, s.r);
      });
      ctx.globalAlpha = 1;
    };

    const drawNebulaBand = () => {
      const c = galaxyCenter();
      nebulaClouds.forEach((cloud, i) => {
        const breathe = 0.92 + 0.08 * Math.sin(t * 0.25 + i);
        const cx =
          (cloud.x + (mouse.x - 0.5) * 0.04 + Math.sin(t * 0.12 + i) * 0.01) * w;
        const cy =
          (cloud.y + (mouse.y - 0.5) * 0.03 + Math.cos(t * 0.1 + i) * 0.01) * h;
        const rx = cloud.rx * Math.max(w, h) * breathe;
        const ry = cloud.ry * Math.max(w, h) * breathe;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cloud.rot + Math.sin(t * 0.08 + i) * 0.03);
        const [r, g, b] = cloud.c;
        const a = cloud.a * (0.88 + mouse.energy * 0.32);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${a * 0.45})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.scale(rx, ry);
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.translate(c.x * w, c.y * h);
      ctx.rotate(-0.45);
      const lane = ctx.createLinearGradient(0, -h * 0.08, 0, h * 0.08);
      lane.addColorStop(0, "rgba(180,160,255,0)");
      lane.addColorStop(0.5, "rgba(200,190,255,0.09)");
      lane.addColorStop(1, "rgba(180,160,255,0)");
      ctx.fillStyle = lane;
      ctx.fillRect(-w * 0.9, -h * 0.08, w * 1.8, h * 0.16);
      ctx.restore();
    };

    const drawSpiralGalaxy = () => {
      const c = galaxyCenter();
      const cx = c.x * w;
      const cy = c.y * h;
      const scale = Math.min(w, h);
      const arms = 4;
      const rot = t * 0.1;

      const coreR = scale * 0.34;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, "rgba(255,255,255,0.95)");
      core.addColorStop(0.08, "rgba(255, 240, 200, 0.72)");
      core.addColorStop(0.22, "rgba(200, 160, 255, 0.48)");
      core.addColorStop(0.45, "rgba(90, 110, 220, 0.24)");
      core.addColorStop(0.7, "rgba(40, 60, 160, 0.1)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      const bloom = coreR * (1.12 + 0.08 * Math.sin(t * 2.1));
      const bloomG = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloom);
      bloomG.addColorStop(0, "rgba(255,180,255,0.13)");
      bloomG.addColorStop(0.5, "rgba(80,200,255,0.09)");
      bloomG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloomG;
      ctx.beginPath();
      ctx.arc(cx, cy, bloom, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.45 + rot * 0.2);
      for (let i = 0; i < 6; i += 1) {
        const y = (i - 2.5) * scale * 0.035;
        const dust = ctx.createLinearGradient(-scale * 0.75, y, scale * 0.75, y);
        dust.addColorStop(0, "rgba(0,0,0,0)");
        dust.addColorStop(0.5, `rgba(2,4,12,${0.2 + i * 0.02})`);
        dust.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = dust;
        ctx.fillRect(-scale * 0.75, y - scale * 0.014, scale * 1.5, scale * 0.028);
      }
      ctx.restore();

      armStars.forEach((s) => {
        s.tw += 0.055;
        const p = s.p;
        const ang =
          p * Math.PI * 3.6 +
          (s.arm * (Math.PI * 2)) / arms +
          rot +
          s.jitter * 4;
        const rad = p * scale * 0.78;
        const nx = (cx + Math.cos(ang) * rad * (1 + s.jitter)) / w;
        const ny = (cy + Math.sin(ang) * rad * 0.42 * (1 + s.jitter * 0.5)) / h;
        const pt = attract(nx, ny, 0.9 + s.bright * 0.5);

        const alpha =
          (1 - p * 0.5) *
          (0.4 + s.bright * 0.6) *
          (0.55 + 0.45 * Math.sin(s.tw));
        const size = s.r * (1.15 - p * 0.35) * (1 + pt.pull * 12);

        if (s.bright > 0.55) {
          const halo = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size * 6);
          const col =
            s.arm % 2 === 0
              ? `rgba(120, 210, 255, ${alpha * 0.4})`
              : `rgba(255, 130, 210, ${alpha * 0.35})`;
          halo.addColorStop(0, col);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(size, 0.45), 0, Math.PI * 2);
        ctx.fillStyle =
          s.arm % 2 === 0
            ? `rgba(220, 240, 255, ${alpha})`
            : `rgba(255, 225, 245, ${alpha})`;
        ctx.fill();
      });
    };

    const drawDrifters = () => {
      drifters.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy + Math.sin(t * 2 + d.x * 10) * 0.00015;
        if (d.x > 1.08) d.x = -0.05;
        if (d.x < -0.08) d.x = 1.05;
        if (d.y > 1.08) d.y = -0.05;
        if (d.y < -0.08) d.y = 1.05;

        const pt = attract(d.x, d.y, 1.2);
        const tx = pt.x - d.vx * w * d.trail;
        const ty = pt.y - d.vy * h * d.trail;
        const g = ctx.createLinearGradient(pt.x, pt.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${d.a})`);
        g.addColorStop(1, "rgba(125,211,252,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(d.r * 0.7, 0.8);
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.a})`;
        ctx.fill();
      });
    };

    const drawNearStars = () => {
      nearStars.forEach((s) => {
        s.tw += 0.04 * s.tws;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
        const pt = attract(s.x, s.y, 1.1);
        const boost =
          mouse.inside && pt.dist < 0.35 ? 1 + (1 - pt.dist) * 1.4 : 1;
        const r = s.r * boost;

        const col =
          s.hue > 0.66
            ? `rgba(180,220,255,${s.a * tw})`
            : s.hue > 0.33
              ? `rgba(255,245,220,${s.a * tw})`
              : `rgba(255,200,230,${s.a * tw})`;

        if (s.spike || boost > 1.3) {
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.strokeStyle = col.replace(/[\d.]+\)$/, `${0.25 * tw * boost})`);
          ctx.lineWidth = 0.8;
          const len = r * 6 * boost;
          ctx.beginPath();
          ctx.moveTo(-len, 0);
          ctx.lineTo(len, 0);
          ctx.moveTo(0, -len);
          ctx.lineTo(0, len);
          ctx.stroke();
          ctx.restore();
        }

        const halo = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 4);
        halo.addColorStop(0, col);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.7 * tw})`;
        ctx.fill();
      });
    };

    const drawHoverLens = () => {
      if (!mouse.inside && mouse.energy < 0.05) return;

      const px = mouse.x * w;
      const py = mouse.y * h;
      const e = mouse.energy * (mouse.down ? 1.35 : 1);
      const R = Math.min(w, h) * (0.16 + e * 0.14);

      const well = ctx.createRadialGradient(px, py, 0, px, py, R * 2.4);
      well.addColorStop(0, `rgba(255,255,255,${0.2 * e})`);
      well.addColorStop(0.15, `rgba(120, 220, 255, ${0.16 * e})`);
      well.addColorStop(0.35, `rgba(180, 80, 220, ${0.12 * e})`);
      well.addColorStop(0.6, `rgba(20, 30, 80, ${0.1 * e})`);
      well.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = well;
      ctx.beginPath();
      ctx.arc(px, py, R * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(px, py);
      for (let ring = 0; ring < 3; ring += 1) {
        const rr = R * (0.45 + ring * 0.28);
        const spin = t * (1.2 - ring * 0.25) * (ring % 2 ? -1 : 1);
        ctx.rotate(spin);
        ctx.strokeStyle = `rgba(${ring === 1 ? "94,234,212" : "196,181,253"}, ${0.45 * e})`;
        ctx.lineWidth = 1.5 - ring * 0.3;
        ctx.beginPath();
        for (let i = 0; i <= 6; i += 1) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr * 0.92;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.rotate(-spin);
      }

      for (let i = 0; i < 6; i += 1) {
        const ang = t * 1.8 + (i * Math.PI * 2) / 6;
        const rr = R * (0.55 + (i % 3) * 0.15);
        const sx = Math.cos(ang) * rr;
        const sy = Math.sin(ang) * rr * 0.9;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
        sg.addColorStop(0, "#fff");
        sg.addColorStop(
          0.35,
          i % 2 ? "rgba(56, 255, 230, 0.95)" : "rgba(255, 100, 220, 0.95)",
        );
        sg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 0.2);
      const flare = ctx.createLinearGradient(-R * 2, 0, R * 2, 0);
      flare.addColorStop(0, "rgba(255,255,255,0)");
      flare.addColorStop(0.5, `rgba(255,255,255,${0.35 * e})`);
      flare.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = flare;
      ctx.fillRect(-R * 2, -1.2, R * 4, 2.4);
      const flare2 = ctx.createLinearGradient(0, -R * 2, 0, R * 2);
      flare2.addColorStop(0, "rgba(180,220,255,0)");
      flare2.addColorStop(0.5, `rgba(180,220,255,${0.28 * e})`);
      flare2.addColorStop(1, "rgba(180,220,255,0)");
      ctx.fillStyle = flare2;
      ctx.fillRect(-1.2, -R * 2, 2.4, R * 4);
      ctx.restore();
    };

    const drawRipples = () => {
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i];
        r.life += 0.02;
        if (r.life >= r.max) {
          ripples.splice(i, 1);
          continue;
        }
        const p = r.life / r.max;
        const radius = p * Math.min(w, h) * 0.45;
        ctx.strokeStyle = `rgba(94, 234, 212, ${(1 - p) * 0.55})`;
        ctx.lineWidth = 2.5 * (1 - p);
        ctx.beginPath();
        ctx.arc(r.x * w, r.y * h, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(232, 121, 249, ${(1 - p) * 0.4})`;
        ctx.beginPath();
        ctx.arc(r.x * w, r.y * h, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawSparks = () => {
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const px = s.x * w;
        const py = s.y * h;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 8);
        g.addColorStop(0, "#fff");
        g.addColorStop(
          0.4,
          s.c === "cyan" ? "rgba(45,212,191,0.9)" : "rgba(232,121,249,0.9)",
        );
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = s.life;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const drawTrails = () => {
      for (let i = trails.length - 1; i >= 0; i -= 1) {
        const tr = trails[i];
        tr.x += tr.vx;
        tr.y += tr.vy;
        tr.life -= 0.035;
        if (tr.life <= 0) {
          trails.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(165, 243, 252, ${tr.life * 0.55})`;
        ctx.beginPath();
        ctx.arc(tr.x * w, tr.y * h, tr.r * tr.life, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trails.length > 80) trails.splice(0, trails.length - 80);
    };

    const drawShootingStars = () => {
      const maxShots = mobile ? 2 : 3;
      if (shootingStars.length < maxShots && Math.random() < 0.025) {
        const left = Math.random() > 0.35;
        shootingStars.push({
          x: left ? rand(-0.05, 0.3) : rand(0.7, 1.05),
          y: rand(0.02, 0.55),
          vx: left ? rand(0.018, 0.035) : -rand(0.018, 0.035),
          vy: rand(0.008, 0.02),
          life: 0,
          max: rand(0.45, 0.9),
          ww: rand(2, 3.2),
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i -= 1) {
        const shot = shootingStars[i];
        shot.life += 0.028;
        shot.x += shot.vx;
        shot.y += shot.vy;
        const p = shot.life / shot.max;
        if (p >= 1) {
          shootingStars.splice(i, 1);
          continue;
        }
        const x = shot.x * w;
        const y = shot.y * h;
        const g = ctx.createLinearGradient(
          x,
          y,
          x - shot.vx * w * 12,
          y - shot.vy * h * 12,
        );
        g.addColorStop(0, `rgba(255,255,255,${0.98 * (1 - p)})`);
        g.addColorStop(0.35, `rgba(125, 211, 252, ${0.65 * (1 - p)})`);
        g.addColorStop(0.7, `rgba(232, 121, 249, ${0.25 * (1 - p)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = shot.ww;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - shot.vx * w * 11, y - shot.vy * h * 11);
        ctx.stroke();

        const hg = ctx.createRadialGradient(x, y, 0, x, y, 10);
        hg.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - p)})`);
        hg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawVignette = () => {
      const vig = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        Math.min(w, h) * 0.2,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.85,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.7, "rgba(0,0,0,0.12)");
      vig.addColorStop(1, "rgba(0,0,0,0.52)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    };

    const draw = () => {
      if (paused) {
        raf = requestAnimationFrame(draw);
        return;
      }

      t += 0.03;
      mouse.x += (mouse.tx - mouse.x) * 0.14;
      mouse.y += (mouse.ty - mouse.y) * 0.14;
      mouse.energy *= mouse.inside ? 0.988 : 0.93;
      mouse.energy = clamp(mouse.energy, 0, 1);

      drawDeepSpace();
      drawFarStars();
      drawNebulaBand();
      drawSpiralGalaxy();
      drawNearStars();
      drawDrifters();
      drawShootingStars();
      drawTrails();
      drawHoverLens();
      drawRipples();
      drawSparks();
      drawVignette();

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", () => {
      paused = document.hidden;
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 h-[100dvh] w-screen ${className}`}
      aria-hidden
    />
  );
};

export default AnimatedCanvasBg;
