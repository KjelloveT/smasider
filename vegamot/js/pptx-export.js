(function (root) {
    'use strict';

    const Model = root.Forteljingskart.Model;
    const Package = root.Forteljingskart.PptxPackage;
    const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    const IMAGE_REL = REL_NS + '/image';
    const EMU_PER_INCH = 914400;
    const ROUTES_PER_MENU_PAGE = 8;

    function emu(inches) {
        return Math.round(inches * EMU_PER_INCH);
    }

    function splitText(value, limit) {
        const source = Package.cleanText(value);
        if (!source) return [''];
        const pages = [];
        let current = '';

        function appendLine(line) {
            if (line.length > limit) {
                if (current) pages.push(current);
                current = '';
                let remaining = line;
                while (remaining.length > limit) {
                    let cut = remaining.lastIndexOf(' ', limit);
                    if (cut < limit * 0.55) cut = limit;
                    pages.push(remaining.slice(0, cut).trimEnd());
                    remaining = remaining.slice(cut).trimStart();
                }
                current = remaining;
                return;
            }
            if (!current) {
                current = line;
            } else if ((current + '\n' + line).length <= limit) {
                current += '\n' + line;
            } else {
                pages.push(current);
                current = line;
            }
        }

        source.split('\n').forEach(appendLine);
        if (current || !pages.length) pages.push(current);
        return pages;
    }

    function chunk(values, size) {
        const result = [];
        for (let index = 0; index < values.length; index += size) {
            result.push(values.slice(index, index + size));
        }
        return result;
    }

    function makePlan(story) {
        const slides = [{ type: 'cover', number: 1 }];
        const byNode = new Map();
        story.nodes.forEach(function (node, nodeIndex) {
            const body = node.body.trim() ? node.body : '';
            const bodyParts = splitText(body, 700);
            const contentSlides = [];
            bodyParts.forEach(function (part, partIndex) {
                const descriptor = {
                    type: 'node', node: node, nodeIndex: nodeIndex,
                    part: part, partIndex: partIndex, partCount: bodyParts.length,
                    number: slides.length + 1
                };
                contentSlides.push(descriptor.number);
                slides.push(descriptor);
            });

            const routePages = !node.isEnd && node.routes.length > ROUTES_PER_MENU_PAGE
                ? chunk(node.routes, ROUTES_PER_MENU_PAGE)
                : [];
            const choiceSlides = [];
            routePages.forEach(function (routes, pageIndex) {
                const descriptor = {
                    type: 'choices', node: node, nodeIndex: nodeIndex, routes: routes,
                    pageIndex: pageIndex, pageCount: routePages.length,
                    number: slides.length + 1
                };
                choiceSlides.push(descriptor.number);
                slides.push(descriptor);
            });
            byNode.set(node.id, { contentSlides: contentSlides, choiceSlides: choiceSlides });
        });
        return { slides: slides, byNode: byNode };
    }

    function textParagraph(text, options) {
        const align = options.align || 'l';
        const runStyle = '<a:rPr lang="nn-NO" sz="' + (options.fontSize || 20) * 100 + '"' +
            (options.bold ? ' b="1"' : '') + (options.underline ? ' u="sng"' : '') + '>' +
            '<a:solidFill><a:srgbClr val="' + Package.xml(options.color || '18212B') + '"/></a:solidFill>' +
            '<a:latin typeface="Arial"/></a:rPr>';
        const content = text === '' ? '' : '<a:r>' + runStyle + '<a:t xml:space="preserve">' + Package.xml(text) + '</a:t></a:r>';
        return '<a:p><a:pPr algn="' + align + '"><a:buNone/></a:pPr>' + content +
            '<a:endParaRPr lang="nn-NO" sz="' + (options.fontSize || 20) * 100 + '"/></a:p>';
    }

    function slideShape(id, text, box, options, linkRid, action) {
        const name = Package.xml(options.name || 'Tekst ' + id);
        const click = linkRid
            ? '<a:hlinkClick r:id="' + linkRid + '" action="ppaction://hlinksldjump"/>'
            : (action ? '<a:hlinkClick action="' + Package.xml(action) + '"/>' : '');
        const fill = options.fill
            ? '<a:solidFill><a:srgbClr val="' + options.fill + '"/></a:solidFill>'
            : '<a:noFill/>';
        const line = options.line
            ? '<a:ln w="12700"><a:solidFill><a:srgbClr val="' + options.line + '"/></a:solidFill></a:ln>'
            : '<a:ln><a:noFill/></a:ln>';
        const paras = Package.cleanText(text).split('\n').map(function (part) {
            return textParagraph(part, options);
        }).join('');
        const inset = emu(options.inset == null ? 0.03 : options.inset);
        return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + name + '">' + click +
            '</p:cNvPr><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
            '<p:spPr><a:xfrm><a:off x="' + emu(box.x) + '" y="' + emu(box.y) + '"/><a:ext cx="' + emu(box.w) + '" cy="' + emu(box.h) + '"/></a:xfrm>' +
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' + fill + line + '</p:spPr>' +
            '<p:txBody><a:bodyPr wrap="square" lIns="' + inset + '" tIns="' + inset + '" rIns="' + inset + '" bIns="' + inset + '" anchor="' + (options.anchor || 'ctr') + '"><a:normAutofit/></a:bodyPr>' +
            '<a:lstStyle/>' + paras + '</p:txBody></p:sp>';
    }

    function fitImage(image, box) {
        const ratio = image.width / image.height;
        let width = box.w;
        let height = width / ratio;
        if (height > box.h) {
            height = box.h;
            width = height * ratio;
        }
        return { x: box.x + (box.w - width) / 2, y: box.y + (box.h - height) / 2, w: width, h: height };
    }

    function pictureShape(id, image, box, relationId) {
        const name = Package.xml(image.name || 'Bilete til steget');
        const description = Package.xml(image.alt || '');
        return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="' + name + '" descr="' + description + '"/>' +
            '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
            '<p:blipFill><a:blip r:embed="' + relationId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
            '<p:spPr><a:xfrm><a:off x="' + emu(box.x) + '" y="' + emu(box.y) + '"/><a:ext cx="' + emu(box.w) + '" cy="' + emu(box.h) + '"/></a:xfrm>' +
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
    }

    function modeNote(node) {
        if (node.selectionMode === 'random') {
            return 'PowerPoint trekkjer ikkje vegval automatisk. Vel ei grein manuelt. Vekttala viser korleis sjansen er fordelt.';
        }
        if (node.selectionMode === 'dice') {
            return 'Trill ein ' + node.dieSize + '-sidig terning. Kastområda viser kva veg du skal velje.';
        }
        return 'Vel kva du vil gjere.';
    }

    function routeText(story, node, route, index) {
        const target = Model.findNode(story, route.targetId);
        const label = route.label.trim() || (target ? 'Gå vidare til «' + (target.title || 'Utan tittel') + '»' : 'Vegval ' + (index + 1));
        if (node.selectionMode === 'random') return label + ' (vekt ' + route.weight + ')';
        if (node.selectionMode === 'dice') {
            const outcome = Model.getDieOutcomes(node.routes, node.dieSize).find(function (item) { return item.routeId === route.id; });
            if (outcome) {
                const roll = outcome.first === outcome.last ? String(outcome.first) : outcome.first + '–' + outcome.last;
                return 'Kast ' + roll + ': ' + label;
            }
        }
        return label;
    }

    function addRouteChoices(addText, story, node, routes, slideMap, firstLine, startY, columns) {
        const rows = Math.ceil(routes.length / columns);
        const rowHeight = columns === 1 ? 0.55 : 0.46;
        const gap = columns === 1 ? 0.06 : 0.04;
        const columnWidth = columns === 1 ? 11.6 : 5.68;
        routes.forEach(function (route, index) {
            const targetSlide = slideMap.get(route.targetId);
            const label = routeText(story, node, route, node.routes.indexOf(route)) + (targetSlide ? '' : ' (manglar mål)');
            const column = columns === 1 ? 0 : Math.floor(index / rows);
            const row = columns === 1 ? index : index % rows;
            addText(label, {
                x: 0.72 + column * (columnWidth + 0.26),
                y: startY + row * (rowHeight + gap),
                w: columnWidth,
                h: rowHeight
            }, { fontSize: 17, color: '0563C1', underline: Boolean(targetSlide), anchor: 'ctr', name: firstLine + ' ' + (index + 1) }, targetSlide || null);
        });
    }

    function makeSlide(descriptor, story, plan, mediaByNode) {
        const slideRels = [Package.relationship('rId1', REL_NS + '/slideLayout', '../slideLayouts/slideLayout1.xml')];
        let nextRelId = 2;
        let shapeId = 2;
        let shapes = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
            '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
        const slideMap = new Map();
        plan.byNode.forEach(function (value, id) {
            slideMap.set(id, value.contentSlides[0]);
        });
        const startSlide = slideMap.get(story.startNodeId) || 2;

        function addText(text, box, options, targetSlide, action) {
            let relationId = null;
            if (targetSlide) {
                relationId = 'rId' + nextRelId;
                nextRelId += 1;
                slideRels.push(Package.relationship(relationId, REL_NS + '/slide', 'slide' + targetSlide + '.xml'));
            }
            shapes += slideShape(shapeId, text, box, options || {}, relationId, action);
            shapeId += 1;
        }

        function addImage(image, box) {
            const imageBox = fitImage(image, box);
            const relationId = 'rId' + nextRelId;
            nextRelId += 1;
            slideRels.push(Package.relationship(relationId, IMAGE_REL, '../media/' + image.fileName));
            shapes += pictureShape(shapeId, image, imageBox, relationId);
            shapeId += 1;
        }

        function addFooter() {
            if (story.settings && story.settings.allowBack) {
                addText('Gå tilbake', { x: 0.72, y: 7.12, w: 2.2, h: 0.22 },
                    { fontSize: 12, color: '0563C1', underline: true, anchor: 'ctr', name: 'Gå tilbake' }, null,
                    'ppaction://hlinkshowjump?jump=lastslideviewed');
            }
            addText('Start på nytt', { x: 10.55, y: 7.12, w: 2.05, h: 0.22 },
                { fontSize: 12, color: '0563C1', underline: true, align: 'r', anchor: 'ctr', name: 'Start på nytt' }, startSlide);
        }

        if (descriptor.type === 'cover') {
            addText(story.title || 'Forteljing', { x: 0.85, y: 2.15, w: 11.65, h: 1.05 },
                { fontSize: 40, bold: true, align: 'ctr', anchor: 'ctr', name: 'Tittel' });
            addText('Ei interaktiv forteljing med ' + story.nodes.length + ' steg.',
                { x: 1.2, y: 3.45, w: 10.95, h: 0.55 },
                { fontSize: 20, color: '435160', align: 'ctr', anchor: 'ctr', name: 'Kort omtale' });
            if (story.nodes.some(function (node) { return node.selectionMode === 'random'; })) {
                addText('Tilfeldige val blir ikkje trekte automatisk i PowerPoint. Vel ei grein manuelt.',
                    { x: 1.1, y: 4.22, w: 11.15, h: 0.55 },
                    { fontSize: 16, color: '435160', align: 'ctr', anchor: 'ctr', name: 'Info om tilfeldige val' });
            }
            addText('Start historia', { x: 4.7, y: 5.35, w: 3.95, h: 0.72 },
                { fontSize: 21, bold: true, color: '0563C1', underline: true, align: 'ctr', anchor: 'ctr', name: 'Start historia' }, startSlide);
        } else if (descriptor.type === 'node') {
            const node = descriptor.node;
            addText(story.title || 'Forteljing', { x: 0.72, y: 0.2, w: 8.8, h: 0.3 },
                { fontSize: 12, color: '536170', anchor: 'ctr', name: 'Forteljingstittel' });
            const kicker = descriptor.partCount > 1
                ? 'STEG ' + (descriptor.nodeIndex + 1) + ' · DEL ' + (descriptor.partIndex + 1) + ' AV ' + descriptor.partCount
                : (node.isEnd ? 'SLUTT' : 'STEG ' + (descriptor.nodeIndex + 1));
            addText(kicker, { x: 0.72, y: 0.57, w: 3.3, h: 0.25 },
                { fontSize: 12, bold: true, color: '536170', anchor: 'ctr', name: 'Stegnummer' });
            addText(node.title || 'Utan tittel', { x: 0.72, y: 0.83, w: 11.9, h: 0.65 },
                { fontSize: 32, bold: true, anchor: 'ctr', name: 'Stegtittel' });
            const illustration = descriptor.partIndex === 0 ? mediaByNode.get(node.id) : null;
            if (descriptor.part) {
                const textBox = illustration
                    ? { x: 0.82, y: 1.62, w: 7.1, h: 2.68 }
                    : { x: 0.82, y: 1.62, w: 11.7, h: descriptor.partCount > 1 ? 4.5 : 2.68 };
                addText(descriptor.part, textBox,
                    { fontSize: 21, anchor: 't', name: 'Forteljingstekst' });
            }
            if (illustration) {
                addImage(illustration, descriptor.part
                    ? { x: 8.25, y: 1.62, w: 4.05, h: 2.68 }
                    : { x: 2.1, y: 1.62, w: 9.1, h: 2.75 });
            }

            if (descriptor.partIndex + 1 < descriptor.partCount) {
                const nextSlide = plan.byNode.get(node.id).contentSlides[descriptor.partIndex + 1];
                addText('Les vidare', { x: 9.6, y: 6.57, w: 2.9, h: 0.45 },
                    { fontSize: 18, bold: true, color: '0563C1', underline: true, align: 'r', anchor: 'ctr', name: 'Les vidare' }, nextSlide);
            } else if (!node.isEnd && node.routes.length > ROUTES_PER_MENU_PAGE) {
                const choicesSlide = plan.byNode.get(node.id).choiceSlides[0];
                addText(modeNote(node), { x: 0.82, y: 4.42, w: 11.7, h: 0.55 },
                    { fontSize: 15, color: '435160', anchor: 'ctr', name: 'Valinstruks' });
                addText('Sjå vegvala', { x: 0.82, y: 5.13, w: 4.2, h: 0.52 },
                    { fontSize: 19, bold: true, color: '0563C1', underline: true, anchor: 'ctr', name: 'Sjå vegvala' }, choicesSlide);
            } else if (!node.isEnd && node.routes.length) {
                addText(modeNote(node), { x: 0.82, y: 4.35, w: 11.7, h: 0.42 },
                    { fontSize: 15, color: '435160', anchor: 'ctr', name: 'Valinstruks' });
                addText('Vel eit vegval', { x: 0.82, y: 4.73, w: 4.0, h: 0.3 },
                    { fontSize: 17, bold: true, anchor: 'ctr', name: 'Vegval' });
                addRouteChoices(addText, story, node, node.routes, slideMap, 'Vegval', 5.04, 2);
            } else if (node.isEnd) {
                addText('Slutt på historia', { x: 0.82, y: 4.85, w: 5.5, h: 0.45 },
                    { fontSize: 21, bold: true, color: '377A3B', anchor: 'ctr', name: 'Slutt' });
            } else {
                addText('Dette steget har ingen vegval vidare.', { x: 0.82, y: 4.62, w: 8.8, h: 0.42 },
                    { fontSize: 17, color: 'A35B00', anchor: 'ctr', name: 'Ingen vegval' });
            }
            if (descriptor.partIndex > 0) {
                const previousSlide = plan.byNode.get(node.id).contentSlides[descriptor.partIndex - 1];
                addText('Førre side', { x: 0.82, y: 6.57, w: 2.9, h: 0.45 },
                    { fontSize: 16, color: '0563C1', underline: true, anchor: 'ctr', name: 'Førre side' }, previousSlide);
            }
            addFooter();
        } else {
            const node = descriptor.node;
            addText(story.title || 'Forteljing', { x: 0.72, y: 0.2, w: 8.8, h: 0.3 },
                { fontSize: 12, color: '536170', anchor: 'ctr', name: 'Forteljingstittel' });
            addText('VEGVAL ' + (descriptor.pageIndex + 1) + ' AV ' + descriptor.pageCount,
                { x: 0.72, y: 0.57, w: 4.2, h: 0.25 },
                { fontSize: 12, bold: true, color: '536170', anchor: 'ctr', name: 'Sideinformasjon' });
            addText(node.title || 'Utan tittel', { x: 0.72, y: 0.83, w: 11.9, h: 0.65 },
                { fontSize: 30, bold: true, anchor: 'ctr', name: 'Stegtittel' });
            addText(modeNote(node), { x: 0.82, y: 1.58, w: 11.7, h: 0.48 },
                { fontSize: 16, color: '435160', anchor: 'ctr', name: 'Valinstruks' });
            addRouteChoices(addText, story, node, descriptor.routes, slideMap, 'Vegval', 2.25, 2);
            addText('Til steget', { x: 0.82, y: 6.57, w: 2.9, h: 0.45 },
                { fontSize: 16, color: '0563C1', underline: true, anchor: 'ctr', name: 'Til steget' },
                plan.byNode.get(node.id).contentSlides[plan.byNode.get(node.id).contentSlides.length - 1]);
            if (descriptor.pageIndex + 1 < descriptor.pageCount) {
                addText('Fleire vegval', { x: 9.3, y: 6.57, w: 3.2, h: 0.45 },
                    { fontSize: 16, color: '0563C1', underline: true, align: 'r', anchor: 'ctr', name: 'Fleire vegval' },
                    plan.byNode.get(node.id).choiceSlides[descriptor.pageIndex + 1]);
            }
            addFooter();
        }

        const slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:sld xmlns:a="' + A_NS + '" xmlns:r="' + REL_NS + '" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
            '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>' +
            '<p:spTree>' + shapes + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
        return {
            xml: slideXml,
            rels: Package.relationshipsXml(slideRels)
        };
    }

    function build(story) {
        const images = story.nodes.filter(function (node) { return Boolean(node.image); });
        return Promise.all(images.map(function (node, index) {
            return VyrdepilStorage.getGameAsset('vegamot', node.image.assetId).then(function (asset) {
                if (!asset || !asset.blob) throw new Error('Eit bilete i historia finst ikkje på denne maskina.');
                const ext = node.image.type === 'image/png' ? 'png' : node.image.type === 'image/jpeg' ? 'jpg' : '';
                if (!ext) throw new Error('PowerPoint støttar ikkje dette biletformatet.');
                return {
                    nodeId: node.id,
                    fileName: 'image' + (index + 1) + '.' + ext,
                    name: node.image.name,
                    alt: node.image.alt,
                    type: node.image.type,
                    width: node.image.width,
                    height: node.image.height,
                    blob: asset.blob
                };
            });
        })).then(function (media) {
            const mediaByNode = new Map(media.map(function (image) { return [image.nodeId, image]; }));
            const plan = makePlan(story);
            const parts = plan.slides.map(function (descriptor) {
                const part = makeSlide(descriptor, story, plan, mediaByNode);
                return { number: descriptor.number, xml: part.xml, rels: part.rels };
            });
            return Package.create(story, parts, media);
        });
    }

    root.Forteljingskart = root.Forteljingskart || {};
    root.Forteljingskart.PptxExport = { build: build };
})(window);
