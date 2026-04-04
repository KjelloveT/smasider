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

        /* Desks within a group are adjacent (no gap) */
        const groupW = 2 * DESK_W;
        const groupRows = Math.ceil(perGroup / 2);
        const groupH = groupRows * DESK_H;
        const gapBetweenGroups = GAP * 2;
        const totalW = groupsPerRow * groupW + (groupsPerRow - 1) * gapBetweenGroups;
        const startX = Math.max(MARGIN, Math.floor((canvasW - totalW) / 2 / CELL) * CELL);

        let studentIdx = 0;
        for (let g = 0; g < nGroups; g++) {
            const gRow = Math.floor(g / groupsPerRow);
            const gCol = g % groupsPerRow;
            const gx = startX + gCol * (groupW + gapBetweenGroups);
            const gy = MARGIN + gRow * (groupH + gapBetweenGroups);

            const inGroup = Math.min(perGroup, n - studentIdx);
            for (let s = 0; s < inGroup; s++) {
                const side = s % 2;
                const row = Math.floor(s / 2);
                positions.push({
                    x: gx + side * DESK_W,
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
        const innerMargin = MARGIN + CELL;

        const topSlots = Math.max(2, Math.ceil(n * 0.4));
        const sideSlots = n - topSlots;
        const leftSlots = Math.ceil(sideSlots / 2);
        const rightSlots = sideSlots - leftSlots;

        const topTotalW = topSlots * DESK_W + (topSlots - 1) * GAP;
        const topStartX = Math.max(innerMargin, Math.floor((canvasW - topTotalW) / 2 / CELL) * CELL);

        for (let i = 0; i < topSlots && positions.length < n; i++) {
            positions.push({
                x: topStartX + i * (DESK_W + GAP),
                y: MARGIN
            });
        }

        const topEndX = topStartX + topTotalW;
        for (let i = 0; i < leftSlots && positions.length < n; i++) {
            positions.push({
                x: topStartX - CELL,
                y: MARGIN + DESK_H + GAP + i * (DESK_H + GAP)
            });
        }

        for (let i = 0; i < rightSlots && positions.length < n; i++) {
            positions.push({
                x: topEndX - DESK_W + CELL,
                y: MARGIN + DESK_H + GAP + i * (DESK_H + GAP)
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
            const bottomY = topY + DESK_H + GAP / 2;

            for (let s = 0; s < inTable; s++) {
                const side = s < perSide ? 0 : 1;
                const idx = side === 0 ? s : s - perSide;
                positions.push({
                    x: startX + idx * DESK_W,
                    y: side === 0 ? topY : bottomY
                });
            }
        }
        return positions;
    }

    function wall(n, canvasW, canvasH) {
        const positions = [];
        const wallGap = GAP;

        const perWall = Math.ceil(n / 3);
        const leftN = Math.min(perWall, n);
        const topN = Math.min(perWall, n - leftN);
        const rightN = n - leftN - topN;

        for (let i = 0; i < leftN; i++) {
            positions.push({
                x: MARGIN,
                y: MARGIN + i * (DESK_H + wallGap)
            });
        }

        for (let i = 0; i < topN; i++) {
            positions.push({
                x: MARGIN + DESK_W + GAP * 2 + i * (DESK_W + wallGap),
                y: MARGIN
            });
        }

        for (let i = 0; i < rightN; i++) {
            positions.push({
                x: canvasW - MARGIN - DESK_W,
                y: MARGIN + i * (DESK_H + wallGap)
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
            default:          return rows(n, canvasW, canvasH);
        }
    }

    return { generate };
})();
