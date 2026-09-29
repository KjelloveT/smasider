(function () {
    'use strict';

    const Model = window.Forteljingskart.Model;

    function render(form, node, story, ui, callbacks) {
        if (node.isEnd) return;

        const settings = ui.el('section', 'route-settings');
        settings.appendChild(ui.el('h3', '', 'Korleis skal lesaren gå vidare?'));
        const modeSelect = document.createElement('select');
        [
            ['manual', 'Lesaren vel sjølv'],
            ['random', 'Tilfeldig val'],
            ['dice', 'Trilling med terning']
        ].forEach(function (choice) {
            const option = document.createElement('option');
            option.value = choice[0];
            option.textContent = choice[1];
            option.disabled = choice[0] === 'dice' && node.routes.length > 20;
            modeSelect.appendChild(option);
        });
        modeSelect.value = node.selectionMode;
        modeSelect.addEventListener('change', function () {
            if (!Model.setSelectionMode(node, modeSelect.value)) return;
            callbacks.onStateChange('selection-mode');
        });
        settings.appendChild(ui.field('Valmåte', modeSelect, 'selection-mode'));

        if (node.selectionMode === 'random') {
            settings.appendChild(ui.el('p', 'helper-text', 'Historia vel eit vegval automatisk. Vekttala er relative: vekt 2 gjev dobbelt så stor sjanse som vekt 1. Vel ei vekt frå 1 til 1000.'));
        } else if (node.selectionMode === 'dice') {
            const dieSelect = document.createElement('select');
            Model.dieSizes.forEach(function (sides) {
                const option = document.createElement('option');
                option.value = String(sides);
                option.textContent = sides + '-sidig terning (D' + sides + ')';
                option.disabled = sides < node.routes.length;
                dieSelect.appendChild(option);
            });
            dieSelect.value = String(node.dieSize);
            dieSelect.addEventListener('change', function () {
                if (!Model.setDieSize(node, dieSelect.value)) return;
                callbacks.onStateChange('die-size');
            });
            settings.appendChild(ui.field('Terning', dieSelect, 'die-size'));
            settings.appendChild(ui.el('p', 'helper-text', 'Lesaren trillar ein fysisk terning og skriv inn kastet. Vekttala avgjer kor mange sider kvart vegval får. Vel ei vekt frå 1 til 1000.'));
            if (node.routes.length > 20) {
                settings.appendChild(ui.el('p', 'inline-message', 'Terning kan berre fordelast på opptil 20 vegval. Byt valmåte eller reduser talet på vegval.'));
            }
        }

        const routes = ui.el('section', 'routes');
        const routeHeading = ui.el('div', 'route-heading');
        routeHeading.appendChild(ui.el('h3', '', 'Vegval'));
        const addRouteButton = ui.button('Legg til vegval', '', function () {
            const route = Model.addRoute(node);
            if (!route) return;
            callbacks.onRouteAdded();
        });
        if (node.selectionMode === 'dice' && node.routes.length >= 20) {
            addRouteButton.disabled = true;
            addRouteButton.title = 'Byt valmåte for å leggje til fleire enn 20 vegval.';
        }
        routeHeading.appendChild(addRouteButton);
        routes.appendChild(routeHeading);

        if (node.routes.length === 0) {
            routes.appendChild(ui.el('p', 'no-routes', 'Ingen vegval enno.'));
        }

        const routePreviews = new Map();
        const roundingNote = node.selectionMode === 'dice'
            ? ui.el('p', 'helper-text', 'Vektene kan ikkje delast heilt nøyaktig på denne terningen. Fordelinga under rundar til heile sider.')
            : null;
        if (roundingNote) {
            roundingNote.hidden = true;
            routes.appendChild(roundingNote);
        }

        function updateDistribution() {
            if (node.selectionMode !== 'dice') return;
            const outcomes = Model.getDieOutcomes(node.routes, node.dieSize);
            routePreviews.forEach(function (preview, routeId) {
                const outcome = outcomes.find(function (item) { return item.routeId === routeId; });
                preview.textContent = outcome
                    ? (outcome.first === outcome.last ? 'Kast ' + outcome.first : 'Kast ' + outcome.first + '–' + outcome.last)
                    : 'Ingen terningfordeling';
            });
            roundingNote.hidden = !outcomes.length || Model.dieWeightsAreExact(node.routes, node.dieSize);
        }

        node.routes.forEach(function (route, index) {
            const row = ui.el('div', 'route-row');
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.maxLength = 100;
            labelInput.value = route.label;
            labelInput.className = 'route-label';
            labelInput.addEventListener('input', function () {
                route.label = labelInput.value;
                callbacks.onValueChange();
            });
            row.appendChild(ui.field('Tekst på valet', labelInput, 'route-label-' + index));

            const targetSelect = document.createElement('select');
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Vel målsteget';
            targetSelect.appendChild(placeholder);
            story.nodes.forEach(function (target) {
                const option = document.createElement('option');
                option.value = target.id;
                option.textContent = target.title || 'Utan tittel';
                targetSelect.appendChild(option);
            });
            targetSelect.value = route.targetId;
            targetSelect.setAttribute('aria-label', 'Mål for vegval ' + (index + 1));
            targetSelect.addEventListener('change', function () {
                route.targetId = targetSelect.value;
                callbacks.onValueChange();
            });
            row.appendChild(ui.field('Gå til steg', targetSelect, 'route-target-' + index));

            if (node.selectionMode !== 'manual') {
                const weightInput = document.createElement('input');
                weightInput.type = 'number';
                weightInput.min = '1';
                weightInput.max = '1000';
                weightInput.step = '1';
                weightInput.value = String(route.weight);
                weightInput.inputMode = 'numeric';
                weightInput.setAttribute('aria-label', 'Relativ vekt for vegval ' + (index + 1));
                const preview = ui.el('p', 'route-weight-outcome');
                routePreviews.set(route.id, preview);
                weightInput.addEventListener('input', function () {
                    const value = Number(weightInput.value);
                    if (!Number.isInteger(value) || value < 1 || value > 1000) return;
                    route.weight = value;
                    updateDistribution();
                    callbacks.onValueChange();
                });
                weightInput.addEventListener('change', function () {
                    route.weight = Model.normalizeWeight(weightInput.value);
                    weightInput.value = String(route.weight);
                    updateDistribution();
                    callbacks.onValueChange();
                });
                const weightField = ui.field('Relativ vekt', weightInput, 'route-weight-' + index);
                if (node.selectionMode === 'dice') weightField.appendChild(preview);
                row.appendChild(weightField);
            }

            row.appendChild(ui.button('Slett vegval', 'danger-button', function () {
                node.routes = node.routes.filter(function (item) { return item.id !== route.id; });
                callbacks.onStateChange();
            }));
            routes.appendChild(row);
        });
        updateDistribution();
        form.append(settings, routes);
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.RoutingEditor = { render: render };
})();
