/* ══════════════════════════════════════
   LAYOUTS.JS — Møbleringsmalar
   Generates desk positions for N students
   ══════════════════════════════════════ */

const Layouts = (() => {
    const CELL = 40;
    const DESK_W = 80;
    const DESK_H = 40;
    const GAP = CELL;
    const MARGIN = CELL * 3;

    function rows(n, canvasW, canvasH) {
        const cols = Math.min(6, Math.ceil(Math.sqrt(n)));
        const positions = [];
        const totalW = cols * DESK_W + (cols - 1) * GAP;
        const startX = Math.max(MARGIN, Math.floor((canvasW - totalW) / 2 / CELL) * CELL);
        let x = startX, y = MARGIN;

        for (let i = 0; i < n; i++) {
            positions.push({ x, y });
            x += DESK_W + GAP;
            if ((i + 1) % cols === 0) {
                x = startX;
                y += DESK_H + GAP * 1.5;
            }
        }
        return positions;
    }

    function pairs(n, canvasW, canvasH) {
        const pairsPerRow = Math.min(4, Math.ceil(n / 2 / Math.ceil(n / 8)));
        const positions = [];
        const pairW = DESK_W * 2;
        const pairGap = GAP * 2;
        const totalW = pairsPerRow * pairW + (pairsPerRow - 1) * pairGap;
        const startX = Math.max(MARGIN, Math.floor((canvasW - totalW) / 2 / CELL) * CELL);
        let col = 0, row = 0;

        for (let i = 0; i < n; i++) {
            const pairIdx = Math.floor(col / 2);
            const side = col % 2;
            const x = startX + pairIdx * (pairW + pairGap) + side * DESK_W;
            const y = MARGIN + row * (DESK_H + GAP * 1.5);
            positions.push({ x, y });

            col++;
            if (col >= pairsPerRow * 2) {
                col = 0;
                row++;
            }
        }
        return positions;
    }

    function groups(n, canvasW, canvasH, perGroup) {
        perGroup = perGroup || 4;
        const nGroups = Math.ceil(n / perGroup);
        const groupsPerRow = Math.min(4, Math.ceil(Math.sqrt(nGroups)));
        const positions = [];

        /* 
           Groups are always 2 rows deep to avoid chair clashing.
           Row 0 (top): Chairs face UP (180 deg)
           Row 1 (bottom): Chairs face DOWN (0 deg)
        */
        const rowsInGroup = 2;
        
        let studentIdx = 0;
        for (let g = 0; g < nGroups; g++) {
            const inGroup = Math.min(perGroup, n - studentIdx);
            const colsInGroup = Math.ceil(inGroup / rowsInGroup);
            
            const groupW = colsInGroup * DESK_W;
            const groupH = rowsInGroup * DESK_H;
            const gapBetweenGroups = GAP * 3;
            
            const gRow = Math.floor(g / groupsPerRow);
            const gCol = g % groupsPerRow;
            
            // Re-calculate startX for the whole row of groups to center them
            const totalRowW = groupsPerRow * (colsInGroup * DESK_W) + (groupsPerRow - 1) * gapBetweenGroups;
            const startX = Math.max(MARGIN, Math.floor((canvasW - totalRowW) / 2 / CELL) * CELL);
            
            const gx = startX + gCol * (groupW + gapBetweenGroups);
            const gy = MARGIN + gRow * (groupH + gapBetweenGroups);

            for (let s = 0; s < inGroup; s++) {
                const row = s % rowsInGroup; // Alternating rows
                const col = Math.floor(s / rowsInGroup);
                
                positions.push({
                    x: gx + col * DESK_W,
                    y: gy + row * DESK_H,
                    rotation: row === 0 ? 180 : 0
                });
                studentIdx++;
            }
        }
        return positions;
    }

    function horseshoe(n, canvasW, canvasH) {
        const positions = [];
        const topSlots = Math.max(2, Math.ceil(n * 0.4));
        const sideSlots = n - topSlots;
        const leftSlots = Math.ceil(sideSlots / 2);
        const rightSlots = sideSlots - leftSlots;

        // Visual dimensions for rotated desks (40x80)
        const sideH = Math.max(leftSlots, rightSlots) * (DESK_W + GAP);
        const topW = topSlots * (DESK_W + GAP) - GAP;
        
        const startX = Math.floor((canvasW - topW) / 2 / CELL) * CELL;
        const startY = Math.floor((canvasH - sideH) / 2 / CELL) * CELL;

        // Top row (facing DOWN into room)
        for (let i = 0; i < topSlots && positions.length < n; i++) {
            positions.push({
                x: startX + i * (DESK_W + GAP),
                y: startY,
                rotation: 180
            });
        }

        // Left side (facing RIGHT into room)
        for (let i = 0; i < leftSlots && positions.length < n; i++) {
            positions.push({
                x: startX - DESK_H - GAP,
                y: startY + DESK_H + GAP + i * (DESK_W + GAP),
                rotation: 90
            });
        }

        // Right side (facing LEFT into room)
        for (let i = 0; i < rightSlots && positions.length < n; i++) {
            positions.push({
                x: startX + topW + GAP,
                y: startY + DESK_H + GAP + i * (DESK_W + GAP),
                rotation: 270
            });
        }

        return positions;
    }

    function longtable(n, canvasW, canvasH) {
        const positions = [];
        const seatsPerTable = Math.min(10, Math.max(4, Math.ceil(n / 2)));
        const nTables = Math.ceil(n / seatsPerTable);

        for (let t = 0; t < nTables; t++) {
            const inTable = Math.min(seatsPerTable, n - t * seatsPerTable);
            const perSide = Math.ceil(inTable / 2);
            const tableW = perSide * DESK_W;
            const startX = Math.max(MARGIN, Math.floor((canvasW - tableW) / 2 / CELL) * CELL);
            const topY = MARGIN + t * (DESK_H * 2 + GAP * 4);
            const bottomY = topY + DESK_H; // Adjacent desks

            for (let s = 0; s < inTable; s++) {
                const side = s < perSide ? 0 : 1;
                const idx = side === 0 ? s : s - perSide;
                positions.push({
                    x: startX + idx * DESK_W,
                    y: side === 0 ? topY : bottomY,
                    rotation: side === 0 ? 180 : 0 // Top row faces down, bottom row faces up
                });
            }
        }
        return positions;
    }

    function wall(n, canvasW, canvasH) {
        const positions = [];
        const wallGap = GAP;

        const perSide = Math.ceil(n / 3);
        const leftN = Math.min(perSide, n);
        const topN = Math.min(perSide, n - leftN);
        const rightN = n - leftN - topN;

        // Left wall (facing wall/LEFT, chair on RIGHT)
        for (let i = 0; i < leftN; i++) {
            positions.push({
                x: CELL, 
                y: MARGIN + i * (DESK_W + wallGap),
                rotation: 270
            });
        }

        // Top wall (facing wall/UP, chair at BOTTOM)
        for (let i = 0; i < topN; i++) {
            positions.push({
                x: MARGIN + i * (DESK_W + wallGap),
                y: CELL,
                rotation: 0
            });
        }

        // Right wall (facing wall/RIGHT, chair on LEFT)
        for (let i = 0; i < rightN; i++) {
            positions.push({
                x: canvasW - DESK_H - CELL,
                y: MARGIN + i * (DESK_W + wallGap),
                rotation: 90
            });
        }

        return positions;
    }

    function circle(n, canvasW, canvasH) {
        const positions = [];
        const centerX = Math.floor(canvasW / 2 / CELL) * CELL;
        const centerY = Math.floor(canvasH / 2 / CELL) * CELL;
        const radius = Math.min(canvasW, canvasH) * 0.35;

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const rawX = centerX + radius * Math.cos(angle) - DESK_W / 2;
            const rawY = centerY + radius * Math.sin(angle) - DESK_H / 2;
            
            // Student faces center.
            // rot 0   = chair at bottom -> faces UP
            // rot 90  = chair at visual left -> faces RIGHT
            // rot 180 = chair at top -> faces DOWN
            // rot 270 = chair at visual right -> faces LEFT
            
            // Direction from desk center to circle center
            const dirX = centerX - (rawX + DESK_W / 2);
            const dirY = centerY - (rawY + DESK_H / 2);
            
            let rot = 0;
            if (Math.abs(dirX) > Math.abs(dirY)) {
                // Horizontal dominant
                rot = dirX > 0 ? 90 : 270;
            } else {
                // Vertical dominant
                rot = dirY > 0 ? 180 : 0;
            }

            positions.push({ 
                x: Math.round(rawX / CELL) * CELL, 
                y: Math.round(rawY / CELL) * CELL,
                rotation: rot
            });
        }
        return positions;
    }

    function generate(type, n, canvasW, canvasH, perGroup) {
        switch (type) {
            case 'rows':      return rows(n, canvasW, canvasH);
            case 'pairs':     return pairs(n, canvasW, canvasH);
            case 'groups':    return groups(n, canvasW, canvasH, perGroup);
            case 'horseshoe': return horseshoe(n, canvasW, canvasH);
            case 'longtable': return longtable(n, canvasW, canvasH);
            case 'wall':      return wall(n, canvasW, canvasH);
            case 'circle':    return circle(n, canvasW, canvasH);
            default:          return rows(n, canvasW, canvasH);
        }
    }

    return { generate };
})();
