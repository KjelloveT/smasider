(function (root) {
    'use strict';

    const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const CONTENT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
    const P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main';
    const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    let zipPromise = null;

    function cleanText(value) {
        const unmatchedHigh = new RegExp('[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])', 'g');
        const unmatchedLow = new RegExp('(^|[^\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]', 'g');
        return String(value == null ? '' : value)
            .replace(/\r\n?/g, '\n')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
            .replace(unmatchedHigh, '')
            .replace(unmatchedLow, '$1');
    }

    function xml(value) {
        return cleanText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function relationship(id, type, target, mode) {
        return '<Relationship Id="' + id + '" Type="' + type + '" Target="' + xml(target) + '"' +
            (mode ? ' TargetMode="' + mode + '"' : '') + '/>';
    }

    function relationshipsXml(items) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="' + PKG_REL_NS + '">' + items.join('') + '</Relationships>';
    }

    function contentTypes(slideCount, media) {
        const hasPng = media.some(function (item) { return item.type === 'image/png'; });
        const hasJpeg = media.some(function (item) { return item.type === 'image/jpeg'; });
        let overrides = '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
            '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>' +
            '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
            '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
            '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
            '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
            '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
        for (let index = 1; index <= slideCount; index += 1) {
            overrides += '<Override PartName="/ppt/slides/slide' + index + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
        }
        const imageTypes = (hasPng ? '<Default Extension="png" ContentType="image/png"/>' : '') +
            (hasJpeg ? '<Default Extension="jpg" ContentType="image/jpeg"/>' : '');
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Types xmlns="' + CONTENT_NS + '"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' + imageTypes + overrides + '</Types>';
    }

    function presentationXml(slideCount) {
        let slideIds = '';
        for (let index = 1; index <= slideCount; index += 1) {
            slideIds += '<p:sldId id="' + (255 + index) + '" r:id="rId' + (index + 1) + '"/>';
        }
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:presentation xmlns:a="' + A_NS + '" xmlns:r="' + REL_NS + '" xmlns:p="' + P_NS + '">' +
            '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
            '<p:sldIdLst>' + slideIds + '</p:sldIdLst>' +
            '<p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>' +
            '<p:notesSz cx="6858000" cy="9144000"/>' +
            '<p:defaultTextStyle><a:defPPr><a:defRPr lang="nn-NO"/></a:defPPr></p:defaultTextStyle>' +
            '</p:presentation>';
    }

    function presentationRelationships(slideCount) {
        const items = [relationship('rId1', REL_NS + '/slideMaster', 'slideMasters/slideMaster1.xml')];
        for (let index = 1; index <= slideCount; index += 1) {
            items.push(relationship('rId' + (index + 1), REL_NS + '/slide', 'slides/slide' + index + '.xml'));
        }
        items.push(relationship('rId' + (slideCount + 2), REL_NS + '/presProps', 'presProps.xml'));
        return relationshipsXml(items);
    }

    function presentationPropertiesXml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:presentationPr xmlns:p="' + P_NS + '"/>';
    }

    function groupTree() {
        return '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
            '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
            '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
    }

    function slideMasterXml() {
        const colorMap = '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:sldMaster xmlns:a="' + A_NS + '" xmlns:r="' + REL_NS + '" xmlns:p="' + P_NS + '">' +
            '<p:cSld name="Blank"><p:spTree>' + groupTree() + '</p:spTree></p:cSld>' + colorMap +
            '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>' +
            '<p:txStyles><p:titleStyle><a:lvl1pPr/></p:titleStyle><p:bodyStyle><a:lvl1pPr/></p:bodyStyle><p:otherStyle><a:lvl1pPr/></p:otherStyle></p:txStyles>' +
            '</p:sldMaster>';
    }

    function slideLayoutXml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<p:sldLayout xmlns:a="' + A_NS + '" xmlns:r="' + REL_NS + '" xmlns:p="' + P_NS + '" type="blank" preserve="1">' +
            '<p:cSld name="Blank"><p:spTree>' + groupTree() + '</p:spTree></p:cSld>' +
            '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
    }

    function themeXml() {
        const line = '<a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>';
        const fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
        const effect = '<a:effectStyle><a:effectLst/></a:effectStyle>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<a:theme xmlns:a="' + A_NS + '" name="Vyrdepil"><a:themeElements>' +
            '<a:clrScheme name="Vyrdepil"><a:dk1><a:srgbClr val="18212B"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>' +
            '<a:dk2><a:srgbClr val="435160"/></a:dk2><a:lt2><a:srgbClr val="F3F5F7"/></a:lt2>' +
            '<a:accent1><a:srgbClr val="0757A6"/></a:accent1><a:accent2><a:srgbClr val="377A3B"/></a:accent2>' +
            '<a:accent3><a:srgbClr val="A35B00"/></a:accent3><a:accent4><a:srgbClr val="657483"/></a:accent4>' +
            '<a:accent5><a:srgbClr val="C8D0D8"/></a:accent5><a:accent6><a:srgbClr val="536170"/></a:accent6>' +
            '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="7030A0"/></a:folHlink></a:clrScheme>' +
            '<a:fontScheme name="Arial"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/></a:majorFont>' +
            '<a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme>' +
            '<a:fmtScheme name="Vyrdepil"><a:fillStyleLst>' + fill +
            '<a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:solidFill>' +
            '<a:solidFill><a:schemeClr val="phClr"><a:tint val="25000"/><a:satMod val="200000"/></a:schemeClr></a:solidFill></a:fillStyleLst>' +
            '<a:lnStyleLst>' + line + line + line + '</a:lnStyleLst>' +
            '<a:effectStyleLst>' + effect + effect + effect + '</a:effectStyleLst>' +
            '<a:bgFillStyleLst>' + fill +
            '<a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill>' +
            '<a:solidFill><a:schemeClr val="phClr"><a:tint val="90000"/><a:satMod val="150000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst>' +
            '</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';
    }

    function coreProperties(story) {
        const now = new Date().toISOString();
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
            'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<dc:title>' + xml(story.title || 'Forteljing') + '</dc:title><dc:creator>Vyrdepil</dc:creator>' +
            '<cp:lastModifiedBy>Vyrdepil</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
            '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>';
    }

    function appProperties(slideCount) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
            'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
            '<Application>Vyrdepil Vegamot</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat>' +
            '<Slides>' + slideCount + '</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop>' +
            '<Company>Vyrdepil</Company><AppVersion>16.0000</AppVersion></Properties>';
    }

    function loadJSZip() {
        if (root.JSZip) return Promise.resolve(root.JSZip);
        if (zipPromise) return zipPromise;
        zipPromise = new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.src = '../_libs/jszip/jszip.min.js';
            script.onload = function () {
                if (root.JSZip) resolve(root.JSZip);
                else {
                    zipPromise = null;
                    reject(new Error('JSZip blei ikkje tilgjengeleg.'));
                }
            };
            script.onerror = function () {
                script.remove();
                zipPromise = null;
                reject(new Error('Fekk ikkje lasta pakkaren for PowerPoint-fila.'));
            };
            document.head.appendChild(script);
        });
        return zipPromise;
    }

    function create(story, slideParts, media) {
        const files = Array.isArray(media) ? media : [];
        return loadJSZip().then(function (JSZip) {
            const zip = new JSZip();
            zip.file('[Content_Types].xml', contentTypes(slideParts.length, files));
            zip.folder('_rels').file('.rels', relationshipsXml([
                relationship('rId1', REL_NS + '/officeDocument', 'ppt/presentation.xml'),
                relationship('rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml'),
                relationship('rId3', REL_NS + '/extended-properties', 'docProps/app.xml')
            ]));
            zip.folder('docProps').file('core.xml', coreProperties(story));
            zip.folder('docProps').file('app.xml', appProperties(slideParts.length));

            const ppt = zip.folder('ppt');
            ppt.file('presentation.xml', presentationXml(slideParts.length));
            ppt.file('presProps.xml', presentationPropertiesXml());
            ppt.folder('_rels').file('presentation.xml.rels', presentationRelationships(slideParts.length));
            ppt.folder('slideMasters').file('slideMaster1.xml', slideMasterXml());
            ppt.folder('slideMasters').folder('_rels').file('slideMaster1.xml.rels', relationshipsXml([
                relationship('rId1', REL_NS + '/slideLayout', '../slideLayouts/slideLayout1.xml'),
                relationship('rId2', REL_NS + '/theme', '../theme/theme1.xml')
            ]));
            ppt.folder('slideLayouts').file('slideLayout1.xml', slideLayoutXml());
            ppt.folder('slideLayouts').folder('_rels').file('slideLayout1.xml.rels', relationshipsXml([
                relationship('rId1', REL_NS + '/slideMaster', '../slideMasters/slideMaster1.xml')
            ]));
            ppt.folder('theme').file('theme1.xml', themeXml());

            const slides = ppt.folder('slides');
            const slideRels = slides.folder('_rels');
            slideParts.forEach(function (part) {
                slides.file('slide' + part.number + '.xml', part.xml);
                slideRels.file('slide' + part.number + '.xml.rels', part.rels);
            });
            if (files.length) {
                const mediaFolder = ppt.folder('media');
                files.forEach(function (item) { mediaFolder.file(item.fileName, item.blob); });
            }
            return zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            });
        });
    }

    root.Forteljingskart = root.Forteljingskart || {};
    root.Forteljingskart.PptxPackage = {
        cleanText: cleanText,
        xml: xml,
        relationship: relationship,
        relationshipsXml: relationshipsXml,
        loadJSZip: loadJSZip,
        create: create
    };
})(window);
