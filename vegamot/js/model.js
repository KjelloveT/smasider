(function () {
    'use strict';

    const APP_ID = 'vegamot';
    const VERSION = 3;
    const DIE_SIZES = [6, 4, 8, 10, 12, 20];

    function makeId(prefix) {
        return window.Vy ? Vy.uuid(prefix) : prefix + '-' + Date.now().toString(36);
    }

    function normalizeWeight(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 1;
        return Math.max(1, Math.min(1000, Math.floor(number)));
    }

    function suggestDieSize(routeCount) {
        if (routeCount <= 6) return 6;
        return DIE_SIZES.find(function (sides) { return sides >= routeCount; }) || null;
    }

    function createNode(title) {
        return {
            id: makeId('step'),
            title: title || 'Nytt steg',
            body: '',
            image: null,
            isEnd: false,
            selectionMode: 'manual',
            dieSize: 6,
            routes: []
        };
    }

    function createStory() {
        const firstNode = createNode('Start');
        return {
            app: APP_ID,
            version: VERSION,
            id: makeId('story'),
            title: 'Ny forteljing',
            startNodeId: firstNode.id,
            settings: { allowBack: false },
            nodes: [firstNode]
        };
    }

    function normalizeStory(value) {
        if (!value || (value.app !== APP_ID && value.app !== 'forteljingskart') || !Array.isArray(value.nodes)) return createStory();

        const nodes = value.nodes.map(function (node) {
            const routes = Array.isArray(node && node.routes) ? node.routes.map(function (route) {
                return {
                    id: String(route && route.id || makeId('route')),
                    label: String(route && route.label || ''),
                    targetId: route && typeof route.targetId === 'string' ? route.targetId : '',
                    weight: normalizeWeight(route && route.weight)
                };
            }) : [];
            const requestedDieSize = Number(node && node.dieSize);
            const dieSize = DIE_SIZES.indexOf(requestedDieSize) >= 0
                ? requestedDieSize
                : (suggestDieSize(routes.length) || 6);
            const selectionMode = ['manual', 'random', 'dice'].indexOf(node && node.selectionMode) >= 0
                ? node.selectionMode
                : 'manual';
            const imageValue = node && node.image;
            const imageType = imageValue && ['image/png', 'image/jpeg'].indexOf(imageValue.type) >= 0
                ? imageValue.type
                : '';
            const image = imageValue && typeof imageValue.assetId === 'string' && imageValue.assetId && imageType
                ? {
                    assetId: imageValue.assetId.slice(0, 120),
                    name: String(imageValue.name || '').slice(0, 180),
                    alt: String(imageValue.alt || '').slice(0, 500),
                    type: imageType,
                    width: Math.max(1, Math.min(20000, Math.round(Number(imageValue.width) || 1))),
                    height: Math.max(1, Math.min(20000, Math.round(Number(imageValue.height) || 1)))
                }
                : null;

            return {
                id: String(node && node.id || makeId('step')),
                title: String(node && typeof node.title === 'string' ? node.title : 'Utan tittel'),
                body: String(node && typeof node.body === 'string' ? node.body : ''),
                image: image,
                isEnd: Boolean(node && node.isEnd),
                selectionMode: selectionMode,
                dieSize: selectionMode === 'dice' && routes.length <= 20 && dieSize < routes.length
                    ? (suggestDieSize(routes.length) || 20)
                    : dieSize,
                routes: routes
            };
        });

        if (nodes.length === 0) nodes.push(createNode('Start'));
        const startNodeId = nodes.some(function (node) { return node.id === value.startNodeId; })
            ? value.startNodeId
            : nodes[0].id;

        return {
            app: APP_ID,
            version: VERSION,
            id: String(value.id || makeId('story')),
            title: String(typeof value.title === 'string' ? value.title : 'Ny forteljing'),
            startNodeId: startNodeId,
            settings: { allowBack: Boolean(value.settings && value.settings.allowBack) },
            nodes: nodes
        };
    }

    function findNode(story, nodeId) {
        return story.nodes.find(function (node) { return node.id === nodeId; }) || null;
    }

    function addNode(story) {
        const node = createNode('Nytt steg');
        story.nodes.push(node);
        return node;
    }

    function addRoute(node) {
        if (node.isEnd || (node.selectionMode === 'dice' && node.routes.length >= 20)) return null;
        const route = { id: makeId('route'), label: '', targetId: '', weight: 1 };
        node.routes.push(route);
        if (node.selectionMode === 'dice' && node.dieSize < node.routes.length) {
            node.dieSize = suggestDieSize(node.routes.length) || 20;
        }
        return route;
    }

    function deleteNode(story, nodeId) {
        if (story.nodes.length < 2) return false;
        story.nodes = story.nodes.filter(function (node) { return node.id !== nodeId; });
        story.nodes.forEach(function (node) {
            node.routes = node.routes.filter(function (route) { return route.targetId !== nodeId; });
        });
        if (story.startNodeId === nodeId) story.startNodeId = story.nodes[0].id;
        return true;
    }

    function setEnd(node, isEnd) {
        if (isEnd && node.routes.length > 0) return false;
        node.isEnd = Boolean(isEnd);
        return true;
    }

    function setSelectionMode(node, mode) {
        if (['manual', 'random', 'dice'].indexOf(mode) < 0) return false;
        if (mode === 'dice' && node.routes.length > 20) return false;
        if (mode === 'dice' && node.selectionMode !== 'dice') {
            node.dieSize = suggestDieSize(node.routes.length) || (node.routes.length ? 20 : 6);
        }
        node.selectionMode = mode;
        return true;
    }

    function setDieSize(node, sides) {
        const size = Number(sides);
        if (DIE_SIZES.indexOf(size) < 0 || node.routes.length > size) return false;
        node.dieSize = size;
        return true;
    }

    function getDieOutcomes(routes, sides) {
        if (!Array.isArray(routes) || routes.length === 0 || routes.length > sides || DIE_SIZES.indexOf(Number(sides)) < 0) {
            return [];
        }

        const totalWeight = routes.reduce(function (sum, route) { return sum + normalizeWeight(route.weight); }, 0);
        const quotas = routes.map(function (route) { return Number(sides) * normalizeWeight(route.weight) / totalWeight; });
        const counts = quotas.map(function (quota) { return Math.max(1, Math.floor(quota)); });
        let assigned = counts.reduce(function (sum, count) { return sum + count; }, 0);

        while (assigned > sides) {
            const candidates = counts.map(function (count, index) {
                return { index: index, surplus: count - quotas[index] };
            }).filter(function (candidate) { return counts[candidate.index] > 1; });
            if (!candidates.length) return [];
            candidates.sort(function (a, b) { return b.surplus - a.surplus || b.index - a.index; });
            counts[candidates[0].index] -= 1;
            assigned -= 1;
        }

        while (assigned < sides) {
            const candidates = counts.map(function (count, index) {
                return { index: index, deficit: quotas[index] - count };
            });
            candidates.sort(function (a, b) { return b.deficit - a.deficit || a.index - b.index; });
            counts[candidates[0].index] += 1;
            assigned += 1;
        }

        let first = 1;
        return routes.map(function (route, index) {
            const last = first + counts[index] - 1;
            const result = {
                route: route,
                routeId: route.id,
                first: first,
                last: last,
                count: counts[index]
            };
            first = last + 1;
            return result;
        });
    }

    function dieWeightsAreExact(routes, sides) {
        const outcomes = getDieOutcomes(routes, sides);
        if (!outcomes.length) return false;
        const totalWeight = routes.reduce(function (sum, route) { return sum + normalizeWeight(route.weight); }, 0);
        return outcomes.every(function (outcome) {
            return outcome.count * totalWeight === Number(sides) * normalizeWeight(outcome.route.weight);
        });
    }

    function routeForRoll(routes, sides, roll) {
        const value = Number(roll);
        if (!Number.isInteger(value) || value < 1 || value > sides) return null;
        const outcome = getDieOutcomes(routes, sides).find(function (item) {
            return value >= item.first && value <= item.last;
        });
        return outcome ? outcome.route : null;
    }

    function chooseWeightedRoute(routes, random) {
        if (!Array.isArray(routes) || routes.length === 0) return null;
        const totalWeight = routes.reduce(function (sum, route) { return sum + normalizeWeight(route.weight); }, 0);
        let ticket = (typeof random === 'function' ? random() : Math.random()) * totalWeight;
        for (let index = 0; index < routes.length; index += 1) {
            ticket -= normalizeWeight(routes[index].weight);
            if (ticket < 0) return routes[index];
        }
        return routes[routes.length - 1];
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.Model = {
        appId: APP_ID,
        version: VERSION,
        dieSizes: DIE_SIZES.slice(),
        normalizeStory: normalizeStory,
        normalizeWeight: normalizeWeight,
        suggestDieSize: suggestDieSize,
        getDieOutcomes: getDieOutcomes,
        dieWeightsAreExact: dieWeightsAreExact,
        routeForRoll: routeForRoll,
        chooseWeightedRoute: chooseWeightedRoute,
        createStory: createStory,
        findNode: findNode,
        addNode: addNode,
        addRoute: addRoute,
        deleteNode: deleteNode,
        setEnd: setEnd,
        setSelectionMode: setSelectionMode,
        setDieSize: setDieSize
    };
})();
