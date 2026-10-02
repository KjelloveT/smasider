(function () {
    'use strict';

    const Model = window.Forteljingskart.Model;

    function analyse(story) {
        const nodes = story.nodes;
        const byId = new Map(nodes.map(function (node) { return [node.id, node]; }));
        const warnings = [];
        const reachable = new Set();
        const start = byId.get(story.startNodeId);

        if (!start) {
            warnings.push({ code: 'missing-start', message: 'Historia manglar eit startsteg.' });
        } else {
            const pending = [start.id];
            while (pending.length) {
                const id = pending.pop();
                if (reachable.has(id)) continue;
                reachable.add(id);
                const node = byId.get(id);
                if (!node) continue;
                node.routes.forEach(function (route) {
                    if (byId.has(route.targetId)) pending.push(route.targetId);
                });
            }
        }

        const endings = new Set(nodes.filter(function (node) {
            return node.isEnd && node.routes.length === 0;
        }).map(function (node) { return node.id; }));

        const incoming = new Map(nodes.map(function (node) { return [node.id, []]; }));
        nodes.forEach(function (node) {
            node.routes.forEach(function (route) {
                if (incoming.has(route.targetId)) incoming.get(route.targetId).push(node.id);
            });
        });
        const canReachEnd = new Set(endings);
        const towardStart = Array.from(endings);
        for (let index = 0; index < towardStart.length; index += 1) {
            (incoming.get(towardStart[index]) || []).forEach(function (sourceId) {
                if (canReachEnd.has(sourceId)) return;
                canReachEnd.add(sourceId);
                towardStart.push(sourceId);
            });
        }

        if (endings.size === 0) {
            warnings.push({ code: 'no-endings', message: 'Historia har ingen steg som er merkt som slutt.' });
        }

        nodes.forEach(function (node) {
            if (!reachable.has(node.id)) {
                warnings.push({
                    code: 'unreachable', nodeId: node.id,
                    message: 'Steget «' + (node.title || 'Utan tittel') + '» kan ikkje nåast frå starten.'
                });
            }

            if (node.isEnd && node.routes.length > 0) {
                warnings.push({
                    code: 'end-has-routes', nodeId: node.id,
                    message: 'Sluttsteget «' + (node.title || 'Utan tittel') + '» har framleis vegval.'
                });
            } else if (!node.isEnd && node.routes.length === 0) {
                warnings.push({
                    code: 'no-route', nodeId: node.id,
                    message: 'Steget «' + (node.title || 'Utan tittel') + '» har ingen veg vidare og er ikkje merkt som slutt.'
                });
            }

            node.routes.forEach(function (route) {
                if (!byId.has(route.targetId)) {
                    warnings.push({
                        code: 'missing-target', nodeId: node.id,
                        message: 'Eit vegval frå «' + (node.title || 'Utan tittel') + '» manglar eit mål.'
                    });
                } else if (endings.size > 0 && !canReachEnd.has(route.targetId)) {
                    warnings.push({
                        code: 'route-cannot-reach-end', nodeId: node.id,
                        message: 'Vegvalet «' + (route.label.trim() || 'utan tekst') + '» frå «' +
                            (node.title || 'Utan tittel') + '» fører ikkje til eit merkt sluttsteg.'
                    });
                }
                if (!route.label.trim()) {
                    warnings.push({
                        code: 'missing-label', nodeId: node.id,
                        message: 'Eit vegval frå «' + (node.title || 'Utan tittel') + '» manglar tekst.'
                    });
                }
            });

            if (endings.size > 0 && !canReachEnd.has(node.id)) {
                warnings.push({
                    code: 'cannot-reach-end', nodeId: node.id,
                    message: 'Frå «' + (node.title || 'Utan tittel') + '» finst det ingen veg til eit merkt sluttsteg.'
                });
            }

            if (node.selectionMode === 'dice' && node.routes.length > 0) {
                if (node.routes.length > node.dieSize) {
                    warnings.push({
                        code: 'too-many-dice-routes', nodeId: node.id,
                        message: 'Steget «' + (node.title || 'Utan tittel') + '» har fleire vegval enn terningen har sider.'
                    });
                } else if (!Model.dieWeightsAreExact(node.routes, node.dieSize)) {
                    warnings.push({
                        code: 'rounded-dice-weights', nodeId: node.id,
                        message: 'Terningvektene i «' + (node.title || 'Utan tittel') + '» blir avrunda til heile sider. Sjå fordelinga ved vegvala.'
                    });
                }
            }
        });

        return warnings;
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.Validator = { analyse: analyse };
})();
