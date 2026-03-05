// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/GroundDecor.js
// Decorative ground layer: trees, bushes,
// flowers, lamps, fountain — scales with
// house level (1–10)
// ═══════════════════════════════════════════

const BuildingGroundDecor = {

  svg(cx, cy, fw, fh, hLvl) {
    const parts = [];
    const lv = Math.max(1, hLvl || 1);

    // Derive fence boundary from cx/cy/fw/fh
    const fl = cx - fw / 2;
    const ft = cy - fh / 2;
    const fr = cx + fw / 2;
    const fb = cy + fh / 2;

    // ── Helper: pixel tree ────────────────────────────────────
    const tree = (x, y, h, trunkCol, leafCol, leafR) => {
      parts.push('<rect x="' + (x-3) + '" y="' + (y-h*0.3) + '" width="6" height="' + (h*0.35) + '" fill="' + trunkCol + '" rx="2"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-h*0.3) + '" r="' + leafR + '" fill="' + leafCol + '"/>');
    };

    // ── Helper: rock cluster ──────────────────────────────────
    const rock = (x, y, r, col) => {
      parts.push('<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r*1.4) + '" ry="' + (r*0.7) + '" fill="' + col + '" opacity="0.85"/>');
    };

    // ── Helper: lamp post ─────────────────────────────────────
    const lamp = (x, y) => {
      parts.push('<rect x="' + (x-2) + '" y="' + (y-40) + '" width="4" height="42" fill="#5a5060" rx="2"/>');
      parts.push('<rect x="' + (x-8) + '" y="' + (y-44) + '" width="16" height="6" fill="#4a4058" rx="2"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-47) + '" r="7" fill="#ffd600" opacity="0.9" filter="url(#glow-yellow)"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-47) + '" r="14" fill="rgba(255,214,0,0.12)" filter="url(#glow-yellow)"/>');
    };

    // ── Helper: decorative bush ───────────────────────────────
    const bush = (x, y, col) => {
      parts.push('<circle cx="' + (x-7) + '" cy="' + y + '" r="8" fill="' + col + '"/>');
      parts.push('<circle cx="' + (x+7) + '" cy="' + y + '" r="8" fill="' + col + '"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-5) + '" r="9" fill="' + col + '"/>');
    };

    // ── Helper: flower ────────────────────────────────────────
    const flower = (x, y, col) => {
      parts.push('<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + col + '" opacity="0.9"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y+1) + '" r="2" fill="#ffd600" opacity="0.8"/>');
      parts.push('<line x1="' + x + '" y1="' + (y+4) + '" x2="' + x + '" y2="' + (y+14) + '" stroke="#2a5010" stroke-width="1.5"/>');
    };

    // ─────────────────────────────────────────────────────────────────
    // LV1: bare wasteland — dead trees and rocks
    // ─────────────────────────────────────────────────────────────────
    if (lv >= 1) {
      tree(cx - fw*0.42, cy - fh*0.44, 50, '#3a2a10', '#2a2010', 14);
      tree(cx + fw*0.42, cy - fh*0.44, 46, '#3a2a10', '#252010', 12);
      rock(cx - fw*0.38, cy + fh*0.40, 10, '#3a3830');
      rock(cx + fw*0.38, cy + fh*0.38, 8,  '#353432');
      rock(cx - fw*0.10, cy + fh*0.44, 7,  '#302e2c');
    }

    // LV2+: small bushes appear near house
    if (lv >= 2) {
      bush(cx - fw*0.14, cy - fh*0.08, '#1e4010');
      bush(cx + fw*0.14, cy - fh*0.08, '#1e3a0e');
      rock(cx + fw*0.20, cy + fh*0.44, 9, '#3a3830');
    }

    // LV3+: live trees, paths more defined
    if (lv >= 3) {
      tree(cx - fw*0.44, cy + fh*0.28, 52, '#5a3a18', '#1e4010', 18);
      tree(cx + fw*0.44, cy + fh*0.22, 48, '#5a3a18', '#244a12', 16);
      parts.push('<rect x="' + (cx-fw*0.06) + '" y="' + (cy+fh*0.42) + '" width="8" height="6" fill="#4a4238" rx="1"/>');
      parts.push('<rect x="' + (cx+fw*0.06) + '" y="' + (cy+fh*0.42) + '" width="8" height="6" fill="#4a4238" rx="1"/>');
    }

    // LV4+: more trees, garden corner begins
    if (lv >= 4) {
      tree(cx - fw*0.42, cy - fh*0.14, 60, '#5a3a18', '#1e4a0e', 20);
      tree(cx + fw*0.42, cy - fh*0.14, 56, '#5a3a18', '#234e10', 18);
      flower(cx - fw*0.18, cy + fh*0.28, '#ff8a80');
      flower(cx - fw*0.14, cy + fh*0.28, '#ff6b6b');
      flower(cx + fw*0.16, cy + fh*0.28, '#ffd600');
      for (let sx = 80; sx < 900; sx += 30) {
        parts.push('<rect x="' + (sx+2) + '" y="' + (cy + fh*0.44+2) + '" width="18" height="6" fill="#4a4038" rx="1" opacity="0.7"/>');
      }
    }

    // LV5+: symmetrical tree avenue flanking path
    if (lv >= 5) {
      [
        { x: cx - 68, y: cy + fh*0.14 },
        { x: cx + 68, y: cy + fh*0.14 },
        { x: cx - 68, y: cy + fh*0.26 },
        { x: cx + 68, y: cy + fh*0.26 },
      ].forEach(tp => tree(tp.x, tp.y, 58, '#5a3a18', '#1e5010', 20));
      bush(cx - fw*0.18, cy - fh*0.34, '#1a4a0c');
      bush(cx + fw*0.18, cy - fh*0.34, '#1a4a0c');
    }

    // LV6+: rich garden — flowers, taller trees, tended borders
    if (lv >= 6) {
      const flowerCols = ['#ff6b6b','#ffd600','#ff9a3c','#a0e060','#80c0ff','#f080ff'];
      for (let i = 0; i < 6; i++) {
        flower(cx - 80 + i * 28, cy + fh*0.38, flowerCols[i % flowerCols.length]);
        flower(cx + 80 - i * 28, cy + fh*0.38, flowerCols[(i+2) % flowerCols.length]);
      }
      tree(cx - fw*0.42, cy - fh*0.40, 74, '#5a3a18', '#1a5c0e', 26);
      tree(cx + fw*0.42, cy - fh*0.40, 70, '#5a3a18', '#1e5c10', 24);
      for (let bx = fl + 80; bx < fr - 80; bx += 48) {
        if (Math.abs(bx - cx) > 60) {
          bush(bx, fb - 28, '#1e4a10');
        }
      }
    }

    // LV7+: lamp posts, ornamental pond
    if (lv >= 7) {
      lamp(cx - 36, cy + fh*0.08);
      lamp(cx + 36, cy + fh*0.08);
      lamp(cx - 36, cy + fh*0.28);
      lamp(cx + 36, cy + fh*0.28);
      const pdx = cx + 222, pdy = cy + 200;
      parts.push('<ellipse cx="' + pdx + '" cy="' + pdy + '" rx="36" ry="26" fill="none" stroke="#3a7a50" stroke-width="4"/>');
      parts.push('<ellipse cx="' + pdx + '" cy="' + pdy + '" rx="26" ry="16" fill="rgba(30,80,110,0.5)"/>');
      parts.push('<circle cx="' + (pdx+10) + '" cy="' + (pdy-5) + '" r="6" fill="#2a6020" opacity="0.9"/>');
      parts.push('<circle cx="' + (pdx-10) + '" cy="' + (pdy+4) + '" r="5" fill="#2a6020" opacity="0.8"/>');
      parts.push('<circle cx="' + (pdx+10) + '" cy="' + (pdy-5) + '" r="2" fill="#ff6060" opacity="0.8"/>');
    }

    // LV8+: sculpted hedges, flower rings, extra lamps
    if (lv >= 8) {
      [
        { x: fl + 68, y: ft + 68 },
        { x: fr - 68, y: ft + 68 },
        { x: fl + 68, y: fb - 68 },
        { x: fr - 68, y: fb - 68 },
      ].forEach(hc => {
        parts.push('<rect x="' + (hc.x-16) + '" y="' + (hc.y-16) + '" width="32" height="32" fill="#1a4a0c" rx="4"/>');
        parts.push('<rect x="' + (hc.x-12) + '" y="' + (hc.y-12) + '" width="24" height="24" fill="#244e10" rx="3"/>');
        parts.push('<circle cx="' + hc.x + '" cy="' + hc.y + '" r="8" fill="#2a5810"/>');
      });
      const houseX2 = cx, houseY2 = cy - fh * 0.26;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const rx = houseX2 + Math.cos(ang) * 80;
        const ry = houseY2 + Math.sin(ang) * 60;
        flower(rx, ry, ['#ff6b6b','#ffd600','#ff9a3c','#f080ff'][i % 4]);
      }
      lamp(cx - fw*0.26, cy - fh*0.06);
      lamp(cx + fw*0.26, cy - fh*0.06);
    }

    // LV9+: fountain in courtyard, radial trees
    if (lv >= 9) {
      const fnx = cx, fny = cy + fh*0.14;
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="24" fill="#2a4a3a" opacity="0.8"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="18" fill="rgba(30,80,110,0.7)"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="6" fill="#4a8a8a"/>');
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI/2 + Math.PI/4;
        const jx = fnx + Math.cos(ang) * 10;
        const jy = fny + Math.sin(ang) * 10;
        parts.push('<line x1="' + jx + '" y1="' + jy + '" x2="' + (jx + Math.cos(ang)*6) + '" y2="' + (jy - 10) + '" stroke="#80c0e0" stroke-width="2" opacity="0.8"/>');
        parts.push('<circle cx="' + (jx + Math.cos(ang)*6) + '" cy="' + (jy-10) + '" r="2" fill="#a0d0f0" opacity="0.7" filter="url(#glow-blue)"/>');
      }
      [
        { x: fnx - 60, y: fny }, { x: fnx + 60, y: fny },
        { x: fnx, y: fny - 50 }, { x: fnx, y: fny + 50 },
      ].forEach(rt => tree(rt.x, rt.y, 42, '#4a3014', '#1e5c10', 14));
    }

    // LV10: ultimate estate — enhanced fountain, neon trim, full gardens
    if (lv >= 10) {
      const fnx = cx, fny = cy + fh*0.14;
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="32" fill="none" stroke="#4a7a6a" stroke-width="3"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="8" fill="#60a0a0" filter="url(#glow-blue)"/>');
      parts.push('<line x1="' + (cx - 28) + '" y1="' + (cy - fh*0.44) + '" x2="' + (cx - 28) + '" y2="' + (cy + fh*0.44) + '" stroke="rgba(100,200,255,0.18)" stroke-width="3"/>');
      parts.push('<line x1="' + (cx + 28) + '" y1="' + (cy - fh*0.44) + '" x2="' + (cx + 28) + '" y2="' + (cy + fh*0.44) + '" stroke="rgba(100,200,255,0.18)" stroke-width="3"/>');
      [
        { x: fl+70, y: ft+70 }, { x: fr-70, y: ft+70 },
        { x: fl+70, y: fb-70 }, { x: fr-70, y: fb-70 },
      ].forEach(ct => tree(ct.x, ct.y, 80, '#4a3014', '#1a6010', 30));
      for (let i = 0; i < 20; i++) {
        flower(fl + 80 + i * 40, cy - fh*0.46, ['#ff6b6b','#ffd600','#f080ff','#80c0ff','#ff9a3c'][i%5]);
      }
    }

    return '<g>' + parts.join('') + '</g>';
  },

};
