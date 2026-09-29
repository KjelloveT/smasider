(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const Layout = window.Forteljingskart.GraphLayout;
    const NODE_WIDTH = Layout.nodeWidth;
    const NODE_HEIGHT = Layout.nodeHeight;

    function element(name, attributes, text) {
        const node = document.createElementNS(SVG_NS, name);
        Object.keys(attributes || {}).forEach(function (key) {
            node.setAttribute(key, attributes[key]);
        });
        if (text != null) node.textContent = text;
        return node;
    }

    function shorten(text, limit) {
        const value = String(text || '').replace(/\s+/g, ' ').trim();
        return value.length > limit ? value.slice(0, limit - 1).trimEnd() + '…' : value;
    }

    function wrap(text, limit, maxLines) {
        const words = String(text || '').trim().split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';
        words.forEach(function (originalWord) {
            let word = originalWord;
            if (word.length > limit) {
                if (line) {
                    lines.push(line);
                    line = '';
                }
                while (word.length > limit) {
                    lines.push(word.slice(0, limit));
                    word = word.slice(limit);
                }
            }
            const next = line ? line + ' ' + word : word;
            if (next.length > limit && line) {
                lines.push(line);
                line = word;
            } else {
                line = next;
            }
        });
        if (line) lines.push(line);
        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = shorten(lines[maxLines - 1], limit - 1) + '…';
        }
        return lines;
    }

    function render(svg, story, selectedId, warnings, onSelect) {
        const layout = Layout.compute(story);
        const warningNodes = new Set(warnings.filter(function (warning) {
            return warning.nodeId;
        }).map(function (warning) { return warning.nodeId; }));
        const routeGroups = new Map();
        layout.routes.forEach(function (edge) {
            if (!routeGroups.has(edge.source.id)) routeGroups.set(edge.source.id, []);
            routeGroups.get(edge.source.id).push(edge);
        });

        while (svg.firstChild) svg.removeChild(svg.firstChild);
        svg.setAttribute('width', layout.width);
        svg.setAttribute('height', layout.height);
        svg.setAttribute('viewBox', '0 0 ' + layout.width + ' ' + layout.height);
        svg.appendChild(element('title', {}, 'Flytkart for ' + (story.title || 'forteljinga')));
        svg.appendChild(element('desc', {}, 'Historia går ovanfrå og ned. Tilbakekoplingar og hopp går rundt stega i eigne baner. Vel eit steg for å redigere det.'));

        const defs = element('defs');
        const marker = element('marker', {
            id: 'story-arrow',
            viewBox: '0 0 10 10',
            refX: '9',
            refY: '5',
            markerWidth: '7',
            markerHeight: '7',
            orient: 'auto-start-reverse'
        });
        marker.appendChild(element('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'arrow-head' }));
        defs.appendChild(marker);
        svg.appendChild(defs);

        if (layout.orphans.length) {
            const firstOrphan = layout.positions.get(layout.orphans[0].id);
            svg.appendChild(element('text', {
                x: firstOrphan.x,
                y: firstOrphan.y - 12,
                class: 'orphan-label'
            }, 'Ikkje nåbare frå starten'));
        }

        const crossingSegments = [];
        layout.routes.forEach(function (edge) {
            const sourcePoint = layout.positions.get(edge.source.id);
            const sourceEdges = routeGroups.get(edge.source.id) || [];
            const sourceIndex = sourceEdges.indexOf(edge);
            let points;
            let edgeClass = 'graph-edge';
            let labelX;
            let labelY;

            if (!edge.target) {
                const sourcePort = Layout.bottomPort(sourcePoint, sourceIndex, sourceEdges.length);
                points = [sourcePort, { x: sourcePort.x, y: edge.sourceY }];
                const path = element('path', {
                    d: Layout.linePath(points),
                    class: 'graph-edge is-incomplete'
                });
                svg.appendChild(path);
                Layout.segments(points).forEach(function (segment) {
                    crossingSegments.push({ routeId: edge.route.id, segment: segment });
                });
                svg.appendChild(element('circle', {
                    cx: sourcePort.x,
                    cy: edge.sourceY,
                    r: '7',
                    class: 'missing-target'
                }));
                labelX = sourcePort.x + 13;
                labelY = edge.sourceY - 7;
            } else if (edge.adjacent) {
                const targetPoint = layout.positions.get(edge.target.id);
                const targetPort = Layout.topPort(targetPoint, edge.targetIndex, edge.targetCount);
                const sourcePort = Layout.bottomPort(sourcePoint, sourceIndex, sourceEdges.length);
                points = [
                    sourcePort,
                    { x: sourcePort.x, y: edge.channelY },
                    { x: targetPort.x, y: edge.channelY },
                    targetPort
                ];
                const path = element('path', {
                    d: Layout.linePath(points),
                    class: edgeClass,
                    'marker-end': 'url(#story-arrow)'
                });
                path.appendChild(element('title', {}, edge.route.label || 'Vegval utan tekst'));
                svg.appendChild(path);
                Layout.segments(points).forEach(function (segment) {
                    crossingSegments.push({ routeId: edge.route.id, segment: segment });
                });
                labelX = Math.round((sourcePort.x + targetPort.x) / 2);
                labelY = edge.channelY - 7;
            } else {
                const targetPoint = layout.positions.get(edge.target.id);
                const targetPort = Layout.topPort(targetPoint, edge.targetIndex, edge.targetCount);
                const sourcePort = Layout.bottomPort(sourcePoint, sourceIndex, sourceEdges.length);
                points = [
                    sourcePort,
                    { x: sourcePort.x, y: edge.lane.sourceY },
                    { x: edge.lane.x, y: edge.lane.sourceY },
                    { x: edge.lane.x, y: edge.lane.targetY },
                    { x: targetPort.x, y: edge.lane.targetY },
                    targetPort
                ];
                edgeClass += ' is-routed';
                const path = element('path', {
                    d: Layout.linePath(points),
                    class: edgeClass,
                    'marker-end': 'url(#story-arrow)'
                });
                path.appendChild(element('title', {}, (edge.route.label || 'Vegval utan tekst') + ' — tilbakekopling eller hopp'));
                svg.appendChild(path);
                labelX = edge.lane.x + 8;
                labelY = edge.lane.sourceY - 7;
                Layout.segments(points).forEach(function (segment) {
                    crossingSegments.push({ routeId: edge.route.id, segment: segment });
                });
            }

            const isRouted = Boolean(edge.target && !edge.adjacent);
            const isIncomplete = !edge.target;
            const edgeSuffix = edge.source.selectionMode !== 'manual' ? ' · ×' + edge.route.weight : '';
            const edgeLimit = (isRouted ? 28 : 24) - edgeSuffix.length;
            svg.appendChild(element('text', {
                x: labelX,
                y: labelY,
                class: 'graph-edge-label' + (isRouted ? ' is-routed-label' : ''),
                'text-anchor': isRouted || isIncomplete ? 'start' : 'middle'
            }, shorten(edge.route.label || 'Utan tekst', edgeLimit) + edgeSuffix));
        });

        const crossings = new Map();
        for (let firstIndex = 0; firstIndex < crossingSegments.length; firstIndex += 1) {
            for (let secondIndex = firstIndex + 1; secondIndex < crossingSegments.length; secondIndex += 1) {
                const first = crossingSegments[firstIndex];
                const second = crossingSegments[secondIndex];
                if (first.routeId === second.routeId) continue;
                const crossing = Layout.crossingBetween(first.segment, second.segment);
                if (crossing) crossings.set(Math.round(crossing.x) + ':' + Math.round(crossing.y), crossing);
            }
        }
        crossings.forEach(function (crossing) {
            svg.appendChild(element('circle', {
                cx: crossing.x,
                cy: crossing.y,
                r: '5',
                class: 'edge-crossing-gap'
            }));
            svg.appendChild(element('path', {
                d: 'M ' + (crossing.x - 5) + ' ' + crossing.y +
                    ' Q ' + crossing.x + ' ' + (crossing.y - 7) + ' ' + (crossing.x + 5) + ' ' + crossing.y,
                class: 'edge-crossing-bridge'
            }));
        });

        story.nodes.forEach(function (node) {
            const point = layout.positions.get(node.id);
            const isStart = node.id === story.startNodeId;
            const group = element('g', {
                class: 'graph-node' +
                    (node.id === selectedId ? ' is-selected' : '') +
                    (node.isEnd ? ' is-end' : '') +
                    (warningNodes.has(node.id) ? ' has-warning' : '') +
                    (isStart ? ' is-start' : ''),
                transform: 'translate(' + point.x + ' ' + point.y + ')',
                role: 'button',
                tabindex: '0',
                'aria-label': (node.title || 'Utan tittel') + (isStart ? ', startsteg' : '') + (node.isEnd ? ', slutt' : '') +
                    (node.selectionMode === 'random' ? ', tilfeldig val' : node.selectionMode === 'dice' ? ', terningstyrte vegval' : '') +
                    (node.image ? ', har bilete' : '') +
                    ', ' + node.routes.length + ' vegval',
                'aria-pressed': node.id === selectedId ? 'true' : 'false'
            });
            group.appendChild(element('rect', { width: NODE_WIDTH, height: NODE_HEIGHT }));

            const badges = [];
            if (isStart) badges.push('START');
            if (node.isEnd) badges.push('SLUTT');
            if (node.selectionMode === 'random') badges.push('TILFELDIG');
            if (node.selectionMode === 'dice') badges.push('TERNING');
            if (node.image) badges.push('BILETE');
            group.appendChild(element('text', { x: '13', y: '22', class: 'graph-node-meta' }, badges.join(' · ') || 'STEG'));
            group.appendChild(element('text', { x: NODE_WIDTH - 12, y: '22', class: 'graph-node-count', 'text-anchor': 'end' }, node.routes.length + ' vegval'));

            wrap(node.title || 'Utan tittel', 26, 2).forEach(function (line, index) {
                group.appendChild(element('text', {
                    x: '13',
                    y: 48 + index * 19,
                    class: 'graph-node-title'
                }, line));
            });

            if (node.body.trim()) {
                wrap(node.body, 31, 2).forEach(function (line, index) {
                    group.appendChild(element('text', {
                        x: '13',
                        y: 91 + index * 16,
                        class: 'graph-node-preview'
                    }, line));
                });
            }

            group.addEventListener('click', function () { onSelect(node.id); });
            group.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onSelect(node.id);
            });
            svg.appendChild(group);
        });
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.Graph = { render: render };
})();
