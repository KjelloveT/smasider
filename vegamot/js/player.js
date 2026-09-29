(function () {
    'use strict';

    const Model = window.Forteljingskart.Model;

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function button(text, action, className) {
        const classes = ['vp-button'];
        if (className) classes.push(className);
        if ((className || '').includes('danger')) classes.push('vp-button--danger');
        const control = el('button', classes.join(' '), text);
        control.type = 'button';
        control.addEventListener('click', action);
        return control;
    }

    function findNode(story, id) {
        return Model.findNode(story, id);
    }

    function routeLabel(story, route, index) {
        const label = route.label.trim();
        if (label) return label;
        const target = findNode(story, route.targetId);
        return target ? 'Gå vidare til «' + (target.title || 'Utan tittel') + '»' : 'Vegval ' + (index + 1);
    }

    function open(story, container, onExit) {
        const history = [{ nodeId: story.startNodeId, outcomeText: '' }];
        let imageUrl = '';
        let renderToken = 0;

        function clearImageUrl() {
            renderToken += 1;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            imageUrl = '';
        }

        function exit() {
            clearImageUrl();
            container.hidden = true;
            if (typeof onExit === 'function') onExit();
        }

        function restart() {
            history.length = 0;
            history.push({ nodeId: story.startNodeId, outcomeText: '' });
            render(true);
        }

        function stepBack() {
            if (!story.settings.allowBack || history.length < 2) return;
            history.pop();
            render(true);
        }

        function choose(route, outcomeText) {
            if (!findNode(story, route.targetId)) return false;
            history.push({ nodeId: route.targetId, outcomeText: outcomeText });
            render(true);
            return true;
        }

        function render(moveFocus) {
            clearImageUrl();
            while (container.firstChild) container.removeChild(container.firstChild);
            const currentRender = renderToken;
            const visit = history[history.length - 1];
            const current = findNode(story, visit.nodeId);
            const page = el('div', 'reader-page');
            const header = el('header', 'reader-header');
            const identity = el('div', 'reader-identity');
            identity.append(
                el('p', 'reader-kicker', 'Lesemodus'),
                el('h1', '', story.title || 'Forteljing utan tittel')
            );
            const headerActions = el('div', 'reader-header-actions');
            headerActions.append(
                button('Til redigering', exit),
                button('Start på nytt', restart)
            );
            header.append(identity, headerActions);
            page.appendChild(header);

            if (!current) {
                page.appendChild(el('p', 'reader-message', 'Historia manglar eit gyldig startsteg. Gå tilbake til redigering for å rette henne.'));
                container.appendChild(page);
                return;
            }

            const article = el('article', 'reader-story-step');
            article.appendChild(el('p', 'reader-position', 'Steg ' + history.length));
            if (visit.outcomeText) article.appendChild(el('p', 'reader-outcome', visit.outcomeText));
            const heading = el('h2', 'reader-step-title', current.title || 'Utan tittel');
            heading.tabIndex = -1;
            article.appendChild(heading);
            if (current.image) {
                const illustration = el('img', 'reader-illustration');
                illustration.alt = current.image.alt || '';
                illustration.hidden = true;
                article.appendChild(illustration);
                const imageStatus = el('p', 'reader-message');
                imageStatus.hidden = true;
                imageStatus.setAttribute('role', 'status');
                article.appendChild(imageStatus);
                VyrdepilStorage.getGameAsset('vegamot', current.image.assetId).then(function (asset) {
                    if (currentRender !== renderToken || !illustration.isConnected) return;
                    if (!asset) {
                        imageStatus.hidden = false;
                        imageStatus.textContent = 'Biletet manglar. Opne ei lagra forteljingspakke for å hente det att.';
                        return;
                    }
                    imageUrl = URL.createObjectURL(asset.blob);
                    illustration.src = imageUrl;
                    illustration.hidden = false;
                }).catch(function () {
                    if (currentRender !== renderToken || !illustration.isConnected) return;
                    imageStatus.hidden = false;
                    imageStatus.textContent = 'Klarte ikkje å lese biletet frå denne maskina.';
                });
            }
            if (current.body.trim()) article.appendChild(el('p', 'reader-text', current.body));

            if (story.settings.allowBack && history.length > 1) {
                article.appendChild(button('Gå eitt steg tilbake', stepBack, 'reader-back-button'));
            }

            if (current.isEnd) {
                const end = el('div', 'reader-ending');
                end.appendChild(el('h3', '', 'Slutt'));
                end.appendChild(el('p', '', 'Du har kome til ei avslutning på historia.'));
                end.appendChild(button('Les på nytt frå starten', restart));
                article.appendChild(end);
            } else {
                const validRoutes = current.routes.filter(function (route) {
                    return Boolean(findNode(story, route.targetId));
                });
                if (current.selectionMode === 'random') {
                    if (current.routes.length) {
                        const action = el('section', 'reader-choice-area');
                        action.appendChild(el('h3', '', 'Tilfeldig vegval'));
                        action.appendChild(el('p', '', 'Historia trekkjer eitt av vegvala.'));
                        const status = el('p', 'reader-message');
                        status.setAttribute('role', 'status');
                        status.hidden = true;
                        action.appendChild(button('Trekk eit tilfeldig vegval', function () {
                            const route = Model.chooseWeightedRoute(current.routes);
                            const label = routeLabel(story, route, current.routes.indexOf(route));
                            if (!choose(route, 'Tilfeldig val: ' + label)) {
                                status.hidden = false;
                                status.textContent = 'Vegvalet «' + label + '» manglar eit mål. Gå til redigering for å fullføre historia.';
                            }
                        }, 'reader-choice'));
                        action.appendChild(status);
                        article.appendChild(action);
                    } else {
                        article.appendChild(el('p', 'reader-message', 'Dette steget har ingen vegval enno. Gå tilbake til redigering for å fullføre historia.'));
                    }
                } else if (current.selectionMode === 'dice') {
                    const outcomes = Model.getDieOutcomes(current.routes, current.dieSize);
                    if (outcomes.length) {
                        const action = el('section', 'reader-choice-area');
                        action.appendChild(el('h3', '', 'Trilling med terning'));
                        action.appendChild(el('p', '', 'Kast ein ' + current.dieSize + '-sidig terning (D' + current.dieSize + ') og skriv inn talet.'));
                        const mapping = el('ol', 'reader-route-map');
                        outcomes.forEach(function (outcome, index) {
                            const range = outcome.first === outcome.last
                                ? 'Kast ' + outcome.first
                                : 'Kast ' + outcome.first + '–' + outcome.last;
                            mapping.appendChild(el('li', '', range + ': ' + routeLabel(story, outcome.route, index)));
                        });
                        action.appendChild(mapping);

                        const dieForm = el('form', 'reader-die-form');
                        dieForm.noValidate = true;
                        const rollInput = document.createElement('input');
                        rollInput.type = 'number';
                        rollInput.min = '1';
                        rollInput.max = String(current.dieSize);
                        rollInput.step = '1';
                        rollInput.required = true;
                        rollInput.inputMode = 'numeric';
                        rollInput.setAttribute('aria-label', 'Terningkast frå 1 til ' + current.dieSize);
                        const rollId = 'reader-die-roll';
                        dieForm.appendChild(el('label', 'vp-label', 'Terningkast (1–' + current.dieSize + ')'));
                        rollInput.classList.add('vp-input');
                        dieForm.lastChild.htmlFor = rollId;
                        rollInput.id = rollId;
                        dieForm.appendChild(rollInput);
                        const status = el('p', 'reader-message');
                        status.setAttribute('role', 'status');
                        status.hidden = true;
                        dieForm.appendChild(status);
                        const submitRoll = el('button', 'vp-button vp-button--primary', 'Bruk terningkastet');
                        submitRoll.type = 'submit';
                        dieForm.appendChild(submitRoll);
                        dieForm.addEventListener('submit', function (event) {
                            event.preventDefault();
                            const roll = Number(rollInput.value);
                            if (!Number.isInteger(roll) || roll < 1 || roll > current.dieSize) {
                                status.hidden = false;
                                status.textContent = 'Skriv eit heilt tal frå 1 til ' + current.dieSize + '.';
                                rollInput.focus();
                                return;
                            }
                            const route = Model.routeForRoll(current.routes, current.dieSize, roll);
                            if (!route) {
                                status.hidden = false;
                                status.textContent = 'Dette kastet har ikkje eit vegval. Gå til redigering for å rette fordelinga.';
                                return;
                            }
                            const label = routeLabel(story, route, current.routes.indexOf(route));
                            if (!choose(route, 'Du fekk ' + roll + ' på D' + current.dieSize + '. Vegval: ' + label)) {
                                status.hidden = false;
                                status.textContent = 'Vegvalet «' + label + '» manglar eit mål. Gå til redigering for å fullføre historia.';
                            }
                        });
                        article.appendChild(dieForm);
                    } else {
                        article.appendChild(el('p', 'reader-message', 'Terningen kan ikkje fordelast på desse vegvala enno. Gå tilbake til redigering og bruk høgst 20 vegval.'));
                    }
                } else if (validRoutes.length) {
                    const choices = el('section', 'reader-choice-area');
                    choices.appendChild(el('h3', '', 'Kva vil du gjere?'));
                    const list = el('div', 'reader-choices');
                    validRoutes.forEach(function (route) {
                        const label = routeLabel(story, route, current.routes.indexOf(route));
                        list.appendChild(button(label, function () {
                            choose(route, 'Du valde: ' + label);
                        }, 'reader-choice'));
                    });
                    choices.appendChild(list);
                    article.appendChild(choices);
                } else {
                    article.appendChild(el('p', 'reader-message', 'Denne greina har ingen veg vidare enno. Gå tilbake til redigering for å fullføre henne.'));
                }
            }

            page.appendChild(article);
            container.appendChild(page);
            if (moveFocus) {
                const newHeading = container.querySelector('.reader-step-title');
                if (newHeading) newHeading.focus();
            }
        }

        render(true);
    }

    window.Forteljingskart = window.Forteljingskart || {};
    window.Forteljingskart.Player = { open: open };
})();
