(function () {
    'use strict';

    const NODE_WIDTH = 238;
    const NODE_HEIGHT = 138;
    const COLUMN_GAP = 92;
    const LANE_GAP = 24;
    const PAD = 36;
    const ROUTE_LABEL_WIDTH = 220;

    function compute(story) {
        const byId = new Map(story.nodes.map(function (node) { return [node.id, node]; }));
        const rank = new Map();
        const start = byId.get(story.startNodeId);
        if (start) {
            rank.set(start.id, 0);
            const pending = [start.id];
            for (let index = 0; index < pending.length; index += 1) {
                const id = pending[index];
                const node = byId.get(id);
                node.routes.forEach(function (route) {
                    if (!byId.has(route.targetId) || rank.has(route.targetId)) return;
                    rank.set(route.targetId, rank.get(id) + 1);
                    pending.push(route.targetId);
                });
            }
        }

        const reachable = story.nodes.filter(function (node) { return rank.has(node.id); });
        const orphans = story.nodes.filter(function (node) { return !rank.has(node.id); });
        const maxReachableRank = reachable.reduce(function (max, node) { return Math.max(max, rank.get(node.id)); }, 0);
        const orphanRank = maxReachableRank + 1;
        orphans.forEach(function (node) { rank.set(node.id, orphanRank); });

        const routes = [];
        story.nodes.forEach(function (source) {
            source.routes.forEach(function (route, sourceIndex) {
                const target = byId.get(route.targetId) || null;
                const sourceRank = rank.get(source.id) || 0;
                const targetRank = target ? rank.get(target.id) : null;
                routes.push({
                    source: source,
                    route: route,
                    sourceIndex: sourceIndex,
                    target: target,
                    adjacent: Boolean(target && targetRank === sourceRank + 1),
                    sourceY: null,
                    channelY: null,
                    lane: null,
                    targetLaneIndex: 0,
                    targetLaneCount: 1,
                    targetIndex: 0,
                    targetCount: 1
                });
            });
        });

        const adjacentByRank = new Map();
        const incomingRoutes = new Map();
        const sourceGapByRank = new Map();
        const targetGapByRank = new Map();
        const specialRoutes = [];
        routes.forEach(function (edge) {
            const sourceRank = rank.get(edge.source.id) || 0;
            if (edge.target) {
                if (!incomingRoutes.has(edge.target.id)) incomingRoutes.set(edge.target.id, []);
                incomingRoutes.get(edge.target.id).push(edge);
            }
            if (edge.adjacent) {
                if (!adjacentByRank.has(sourceRank)) adjacentByRank.set(sourceRank, []);
                adjacentByRank.get(sourceRank).push(edge);
            } else {
                if (!sourceGapByRank.has(sourceRank)) sourceGapByRank.set(sourceRank, []);
                sourceGapByRank.get(sourceRank).push(edge);
                if (!edge.target) return;
                const targetRank = rank.get(edge.target.id) || 0;
                if (!targetGapByRank.has(targetRank)) targetGapByRank.set(targetRank, []);
                targetGapByRank.get(targetRank).push(edge);
                specialRoutes.push(edge);
            }
        });

        adjacentByRank.forEach(function (edges, layer) {
            const sourceGapCount = (sourceGapByRank.get(layer) || []).length;
            edges.forEach(function (edge, index) {
                edge.channelIndex = index;
                edge.channelCount = edges.length;
                edge.sourceGapCount = sourceGapCount;
            });
        });
        incomingRoutes.forEach(function (edges) {
            edges.forEach(function (edge, index) {
                edge.targetIndex = index;
                edge.targetCount = edges.length;
            });
        });
        sourceGapByRank.forEach(function (edges) {
            edges.forEach(function (edge, index) {
                edge.sourceGapIndex = index;
                edge.sourceGapCount = edges.length;
            });
        });
        targetGapByRank.forEach(function (edges) {
            edges.forEach(function (edge, index) {
                edge.targetLaneIndex = index;
                edge.targetLaneCount = edges.length;
            });
        });

        const nodesByRank = new Map();
        story.nodes.forEach(function (node) {
            const layer = rank.get(node.id) || 0;
            if (!nodesByRank.has(layer)) nodesByRank.set(layer, []);
            nodesByRank.get(layer).push(node);
        });
        const maxRank = Array.from(nodesByRank.keys()).reduce(function (max, layer) { return Math.max(max, layer); }, 0);
        const maxColumns = Array.from(nodesByRank.values()).reduce(function (max, nodes) { return Math.max(max, nodes.length); }, 1);
        const contentWidth = maxColumns * NODE_WIDTH + (maxColumns - 1) * COLUMN_GAP;
        const maxNodeRight = PAD + contentWidth;

        const topRoutes = targetGapByRank.get(0) || [];
        let y = PAD + 20 + topRoutes.length * LANE_GAP;
        const rankY = new Map();
        for (let layer = 0; layer <= maxRank; layer += 1) {
            rankY.set(layer, y);
            if (layer === maxRank) continue;
            const outgoingChannels = (sourceGapByRank.get(layer) || []).length;
            const directChannels = (adjacentByRank.get(layer) || []).length;
            const incomingChannels = (targetGapByRank.get(layer + 1) || []).length;
            const gap = 24 + (outgoingChannels + directChannels + incomingChannels) * LANE_GAP;
            y += NODE_HEIGHT + gap;
        }

        const positions = new Map();
        nodesByRank.forEach(function (nodes, layer) {
            const layerWidth = nodes.length * NODE_WIDTH + (nodes.length - 1) * COLUMN_GAP;
            const startX = PAD + (contentWidth - layerWidth) / 2;
            nodes.forEach(function (node, index) {
                positions.set(node.id, {
                    x: startX + index * (NODE_WIDTH + COLUMN_GAP),
                    y: rankY.get(layer),
                    rank: layer
                });
            });
        });

        const laneStartX = maxNodeRight + LANE_GAP;
        specialRoutes.forEach(function (edge, index) {
            const sourcePoint = positions.get(edge.source.id);
            const targetPoint = positions.get(edge.target.id);
            edge.lane = {
                x: laneStartX + index * LANE_GAP,
                index: index
            };
            edge.sourceY = sourcePoint.y + NODE_HEIGHT + 8 + edge.sourceGapIndex * LANE_GAP;
            edge.lane.sourceY = edge.sourceY;
            edge.lane.targetY = targetPoint.y - 8 - edge.targetLaneIndex * LANE_GAP;
        });
        routes.filter(function (edge) { return !edge.target; }).forEach(function (edge) {
            const sourcePoint = positions.get(edge.source.id);
            edge.sourceY = sourcePoint.y + NODE_HEIGHT + 8 + edge.sourceGapIndex * LANE_GAP;
        });
        adjacentByRank.forEach(function (edges, layer) {
            const sourceGapCount = (sourceGapByRank.get(layer) || []).length;
            const sourcePoint = positions.get(edges[0].source.id);
            edges.forEach(function (edge) {
                edge.channelY = sourcePoint.y + NODE_HEIGHT + 8 + sourceGapCount * LANE_GAP + edge.channelIndex * LANE_GAP;
            });
        });

        const nodeMaxY = Array.from(positions.values()).reduce(function (max, point) {
            return Math.max(max, point.y + NODE_HEIGHT);
        }, PAD);
        const routeMaxY = routes.reduce(function (max, edge) {
            return Math.max(max, edge.sourceY || 0, edge.lane ? edge.lane.targetY : 0);
        }, nodeMaxY);
        const hasIncompleteRoutes = routes.some(function (edge) { return !edge.target; });
        const specialWidth = specialRoutes.length
            ? specialRoutes.length * LANE_GAP + ROUTE_LABEL_WIDTH
            : (hasIncompleteRoutes ? ROUTE_LABEL_WIDTH : 0);

        return {
            positions: positions,
            byId: byId,
            orphans: orphans,
            maxRank: maxRank,
            routes: routes,
            width: maxNodeRight + specialWidth + PAD,
            height: routeMaxY + PAD
        };
    }

    function bottomPort(point, index, count) {
        return {
            x: point.x + NODE_WIDTH * ((index + 1) / (count + 1)),
            y: point.y + NODE_HEIGHT
        };
    }

    function topPort(point, index, count) {
        return {
            x: point.x + NODE_WIDTH * ((index + 1) / (count + 1)),
            y: point.y
        };
    }

    function linePath(points) {
        return points.map(function (point, index) {
            return (index === 0 ? 'M ' : 'L ') + point.x + ' ' + point.y;
        }).join(' ');
    }

    function segments(points) {
        const result = [];
        for (let index = 0; index < points.length - 1; index += 1) {
            result.push({ a: points[index], b: points[index + 1] });
        }
        return result;
    }

    function crossingBetween(first, second) {
        const firstHorizontal = first.a.y === first.b.y;
        const secondHorizontal = second.a.y === second.b.y;
        if (firstHorizontal === secondHorizontal) return null;

        const horizontal = firstHorizontal ? first : second;
        const vertical = firstHorizontal ? second : first;
        const x = vertical.a.x;
        const y = horizontal.a.y;
        const horizontalMin = Math.min(horizontal.a.x, horizontal.b.x);
        const horizontalMax = Math.max(horizontal.a.x, horizontal.b.x);
        const verticalMin = Math.min(vertical.a.y, vertical.b.y);
        const verticalMax = Math.max(vertical.a.y, vertical.b.y);
        if (x <= horizontalMin + 5 || x >= horizontalMax - 5) return null;
        if (y <= verticalMin + 5 || y >= verticalMax - 5) return null;
        return { x: x, y: y };
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.GraphLayout = {
        compute: compute,
        bottomPort: bottomPort,
        topPort: topPort,
        linePath: linePath,
        segments: segments,
        crossingBetween: crossingBetween,
        nodeWidth: NODE_WIDTH,
        nodeHeight: NODE_HEIGHT
    };
})();
