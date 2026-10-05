(function () {
  "use strict";

  const stage = document.getElementById("layout-stage");
  if (!stage) return;

  const bedBase = { x: 276, y: 232 };
  const deskBase = { x: 108, y: 226 };
  const bedAxis = { x: 80, y: -85 };
  const bedWidthAxis = { x: 56, y: 16 };

  const assets = {
    bed: {
      "bed-simple": { label: "Enkel seng", canvas: "192 × 128", file: "items/bed-simple.png", flipX: true },
      "bed-upgraded": { label: "God seng", canvas: "192 × 128", file: "items/bed-upgraded.png", flipX: false }
    },
    desk: {
      "desk-simple": {
        label: "Skrivebord", file: "items/desk-simple.png", w: 96, canvasW: 160, h: 112, depth: 36, visibleBottom: 96,
        mounts: { monitor: { x: 87, y: 47 }, lamp: { x: 60, y: 44 }, controller: { x: 115, y: 52 } }
      },
      "desk-gaming": {
        label: "Større skrivebord", file: "items/desk-gaming.png", w: 128, canvasW: 192, h: 128, depth: 44, visibleBottom: 119,
        mounts: { monitor: { x: 96, y: 60 }, lamp: { x: 59, y: 87 }, controller: { x: 143, y: 91 } }
      }
    }
  };

  const elements = {
    bedSelect: document.getElementById("bed-select"),
    footprintSelect: document.getElementById("bed-footprint-select"),
    deskSelect: document.getElementById("desk-select"),
    guideButton: document.getElementById("toggle-guides"),
    bedWidth: document.getElementById("bed-footprint-readout"),
    deskWidth: document.getElementById("desk-width-readout"),
    lampPosition: document.getElementById("lamp-readout"),
    monitorPosition: document.getElementById("monitor-readout"),
    controllerPosition: document.getElementById("controller-readout"),
    towerPosition: document.getElementById("tower-readout"),
    status: document.getElementById("layout-status"),
    bedLabel: document.getElementById("guide-bed-label"),
    deskLabel: document.getElementById("guide-desk-label"),
    details: document.getElementById("mount-details"),
    sprites: {
      bed: document.getElementById("sprite-bed"),
      pillow: document.getElementById("sprite-pillow"),
      throw: document.getElementById("sprite-throw"),
      desk: document.getElementById("sprite-desk"),
      monitor: document.getElementById("sprite-monitor"),
      lamp: document.getElementById("sprite-lamp"),
      controller: document.getElementById("sprite-controller"),
      tower: document.getElementById("sprite-tower")
    },
    guides: {
      bedFootprint: document.getElementById("guide-bed-footprint"),
      deskFootprint: document.getElementById("guide-desk-footprint"),
      bedAxis: document.getElementById("guide-bed-axis"),
      bedPivot: document.getElementById("guide-bed-pivot"),
      deskPivot: document.getElementById("guide-desk-pivot"),
      monitor: document.getElementById("guide-monitor-mount"),
      lamp: document.getElementById("guide-lamp-mount"),
      controller: document.getElementById("guide-controller-mount"),
      tower: document.getElementById("guide-tower-mount"),
      pillow: document.getElementById("guide-pillow-mount"),
      throw: document.getElementById("guide-throw-mount"),
      bedPivotLabel: document.getElementById("label-bed-pivot"),
      deskPivotLabel: document.getElementById("label-desk-pivot"),
      monitorLabel: document.getElementById("label-monitor"),
      lampLabel: document.getElementById("label-lamp"),
      pillowLabel: document.getElementById("label-pillow"),
      throwLabel: document.getElementById("label-throw"),
      controllerLabel: document.getElementById("label-controller"),
      towerLabel: document.getElementById("label-tower"),
      controllerLine: document.getElementById("guide-controller-line"),
      towerLine: document.getElementById("guide-tower-line")
    }
  };

  function bedPoint(t, cross, wide) {
    const origin = { x: wide ? bedBase.x - 18 : bedBase.x, y: bedBase.y };
    const lengthFactor = wide ? 1.16 : 1;
    const widthFactor = wide ? 1.14 : 1;
    return {
      x: origin.x + bedAxis.x * t * lengthFactor + bedWidthAxis.x * cross * widthFactor,
      y: origin.y + bedAxis.y * t * lengthFactor + bedWidthAxis.y * cross * widthFactor
    };
  }

  function deskPoint(u, v, desk) {
    return {
      x: deskBase.x + (u - 0.5) * desk.w - (1 - v) * 12,
      y: deskBase.y - desk.depth * (1 - v)
    };
  }

  function deskMountPoint(mount, deskOrigin) {
    return { x: deskOrigin.x + mount.x, y: deskOrigin.y + mount.y };
  }

  function setSprite(element, source, box, flipX) {
    if (!element) return;
    element.setAttribute("href", source);
    element.setAttribute("x", String(Math.round(box.x * 100) / 100));
    element.setAttribute("y", String(Math.round(box.y * 100) / 100));
    element.setAttribute("width", String(Math.round(box.w * 100) / 100));
    element.setAttribute("height", String(Math.round(box.h * 100) / 100));
    if (flipX) {
      element.setAttribute("transform", `translate(${Math.round((box.x * 2 + box.w) * 100) / 100} 0) scale(-1 1)`);
    } else {
      element.removeAttribute("transform");
    }
  }

  function placeSpriteAtAnchor(element, source, anchor, size, anchorPoint, flipX) {
    setSprite(element, source, {
      x: anchor.x - size.w * anchorPoint.x,
      y: anchor.y - size.h * anchorPoint.y,
      w: size.w,
      h: size.h
    }, flipX);
  }

  function setPolygon(element, points) {
    if (element) element.setAttribute("points", points.map((point) => point.map((n) => Math.round(n)).join(",")).join(" "));
  }

  function setCircle(element, point) {
    if (!element) return;
    element.setAttribute("cx", String(Math.round(point.x)));
    element.setAttribute("cy", String(Math.round(point.y)));
  }

  function setLabel(element, point, text, dy) {
    if (!element) return;
    element.setAttribute("x", String(Math.round(point.x)));
    element.setAttribute("y", String(Math.round(point.y + (dy || 0))));
    element.textContent = text;
  }

  function setLine(element, first, second) {
    if (!element) return;
    element.setAttribute("x1", String(Math.round(first.x)));
    element.setAttribute("y1", String(Math.round(first.y)));
    element.setAttribute("x2", String(Math.round(second.x)));
    element.setAttribute("y2", String(Math.round(second.y)));
  }

  function polygonsOverlap(first, second) {
    for (const polygon of [first, second]) {
      for (let index = 0; index < polygon.length; index += 1) {
        const current = polygon[index];
        const next = polygon[(index + 1) % polygon.length];
        const axis = { x: -(next.y - current.y), y: next.x - current.x };
        const project = (points) => points.map((point) => point.x * axis.x + point.y * axis.y);
        const firstProjection = project(first);
        const secondProjection = project(second);
        const firstMin = Math.min(...firstProjection);
        const firstMax = Math.max(...firstProjection);
        const secondMin = Math.min(...secondProjection);
        const secondMax = Math.max(...secondProjection);
        if (firstMax <= secondMin || secondMax <= firstMin) return false;
      }
    }
    return true;
  }

  function render() {
    const bedId = elements.bedSelect.value;
    const deskId = elements.deskSelect.value;
    const wideBed = elements.footprintSelect.value === "wide";
    const bed = assets.bed[bedId];
    const desk = assets.desk[deskId];
    const bedOrigin = { x: wideBed ? bedBase.x - 18 : bedBase.x, y: bedBase.y };

    const bedSpriteSize = { w: 192, h: 128 };
    const bedSpritePivot = { x: 56, y: 112 };
    setSprite(elements.sprites.bed, bed.file, {
      x: bedOrigin.x - bedSpritePivot.x,
      y: bedOrigin.y - bedSpritePivot.y,
      ...bedSpriteSize
    }, bed.flipX);

    const deskOrigin = {
      x: deskBase.x - desk.canvasW / 2,
      y: deskBase.y - desk.visibleBottom
    };
    setSprite(elements.sprites.desk, desk.file, { x: deskOrigin.x, y: deskOrigin.y, w: desk.canvasW, h: desk.h });

    const screenMount = deskMountPoint(desk.mounts.monitor, deskOrigin);
    const lampMount = deskMountPoint(desk.mounts.lamp, deskOrigin);
    const controllerMount = deskMountPoint(desk.mounts.controller, deskOrigin);
    placeSpriteAtAnchor(elements.sprites.monitor, "items/monitor.png", screenMount, { w: 68, h: 50 }, { x: 0.52, y: 0.84 });
    placeSpriteAtAnchor(elements.sprites.lamp, "items/desk-lamp.png", lampMount, { w: 40, h: 60 }, { x: 0.54, y: 0.77 });
    placeSpriteAtAnchor(elements.sprites.controller, "items/game-controller.png", controllerMount, { w: 29, h: 22 }, { x: 0.50, y: 0.875 });

    const towerSize = { w: 44, h: 56 };
    const towerLeft = deskBase.x + desk.w / 2 + 4;
    const towerTop = deskBase.y - towerSize.h;
    const towerMount = { x: towerLeft + towerSize.w / 2, y: deskBase.y };
    setSprite(elements.sprites.tower, "items/computer-tower.png", {
      x: towerLeft, y: towerTop, ...towerSize
    });

    const bedFootprintLength = wideBed ? 129 : 111;
    const bedHalfWidth = wideBed ? 0.57 : 0.50;
    const bedFar = {
      x: bedOrigin.x + bedAxis.x * bedFootprintLength / 111,
      y: bedOrigin.y + bedAxis.y * bedFootprintLength / 111
    };
    const bedSide = { x: bedWidthAxis.x * bedHalfWidth, y: bedWidthAxis.y * bedHalfWidth };
    const bedCorners = [
      { x: bedOrigin.x + bedSide.x, y: bedOrigin.y + bedSide.y },
      { x: bedFar.x + bedSide.x, y: bedFar.y + bedSide.y },
      { x: bedFar.x - bedSide.x, y: bedFar.y - bedSide.y },
      { x: bedOrigin.x - bedSide.x, y: bedOrigin.y - bedSide.y }
    ];
    setPolygon(elements.guides.bedFootprint, bedCorners.map((point) => [point.x, point.y]));

    const deskCorners = [
      deskPoint(0, 0, desk),
      deskPoint(1, 0, desk),
      deskPoint(1, 1, desk),
      deskPoint(0, 1, desk)
    ];
    setPolygon(elements.guides.deskFootprint, deskCorners.map((point) => [point.x, point.y]));

    const towerFootprint = [
      { x: towerLeft, y: towerTop },
      { x: towerLeft + towerSize.w, y: towerTop },
      { x: towerLeft + towerSize.w, y: deskBase.y },
      { x: towerLeft, y: deskBase.y }
    ];
    const towerCollision = polygonsOverlap(towerFootprint, bedCorners) || polygonsOverlap(towerFootprint, deskCorners);
    const pillowMount = bedPoint(0.72, -0.10, wideBed);
    const throwMount = bedPoint(0.30, -0.12, wideBed);
    const bedHead = { x: bedFar.x, y: bedFar.y };

    placeSpriteAtAnchor(elements.sprites.pillow, "items/pillow.png", pillowMount, { w: 50, h: 44 }, { x: 0.50, y: 0.50 });
    placeSpriteAtAnchor(elements.sprites.throw, "items/bed-throw.png", throwMount, { w: 72, h: 43 }, { x: 0.50, y: 0.50 });

    setLine(elements.guides.bedAxis, bedOrigin, bedHead);
    setCircle(elements.guides.bedPivot, bedOrigin);
    setCircle(elements.guides.deskPivot, { x: deskBase.x, y: deskBase.y });
    setCircle(elements.guides.monitor, screenMount);
    setCircle(elements.guides.lamp, lampMount);
    setCircle(elements.guides.controller, controllerMount);
    elements.guides.tower.setAttribute("x", String(Math.round(towerLeft)));
    elements.guides.tower.setAttribute("y", String(Math.round(towerTop)));
    elements.guides.tower.setAttribute("width", String(towerSize.w));
    elements.guides.tower.setAttribute("height", String(towerSize.h));
    elements.guides.tower.classList.toggle("mount-collision", towerCollision);
    setCircle(elements.guides.pillow, pillowMount);
    setCircle(elements.guides.throw, throwMount);

    setLabel(elements.bedLabel, { x: bedOrigin.x + bedAxis.x * 0.45, y: bedOrigin.y + bedAxis.y * 0.45 }, `SENG · ${wideBed ? "større plass" : bed.canvas}`, 0);
    setLabel(elements.deskLabel, { x: deskBase.x, y: deskBase.y - desk.depth * 0.55 }, `PULT · ${desk.w} px`, 0);
    setLabel(elements.guides.bedPivotLabel, bedOrigin, "pivot seng", 11);
    setLabel(elements.guides.deskPivotLabel, { x: deskBase.x, y: deskBase.y }, "pivot pult", 11);
    setLabel(elements.guides.monitorLabel, screenMount, "skjerm", -5);
    setLabel(elements.guides.lampLabel, lampMount, "lampe", -5);
    setLabel(elements.guides.controllerLabel, controllerMount, "kontroll · mål?", -5);
    setLabel(elements.guides.towerLabel, { x: towerMount.x, y: towerMount.y - 50 }, "tårn · mål?", -4);
    setLabel(elements.guides.pillowLabel, pillowMount, "pute", -5);
    setLabel(elements.guides.throwLabel, throwMount, "pledd", 10);
    setLine(elements.guides.controllerLine, controllerMount, { x: deskBase.x + desk.w / 2 - 10, y: deskBase.y - desk.depth });
    setLine(elements.guides.towerLine, { x: towerLeft, y: towerMount.y - 28 }, { x: deskBase.x + desk.w / 2, y: deskBase.y - 4 });

    elements.deskWidth.textContent = `${desk.w} logiske pikslar`;
    elements.lampPosition.textContent = `x ${Math.round(lampMount.x)} · følgjer venstresida`;
    elements.monitorPosition.textContent = `x ${Math.round(screenMount.x)} · held midten`;
    elements.controllerPosition.textContent = `x ${Math.round(controllerMount.x)} · følgjer høgresida`;
    elements.towerPosition.textContent = `x ${Math.round(towerMount.x)} · golvfeste ved sida`;
    elements.bedWidth.textContent = wideBed ? "224 × 144 · simulert" : "192 × 128";
    elements.status.textContent = towerCollision
      ? "Tårnfesta kolliderer med ei reservert flate. Layouten må då foreslå ei kontrollert omplassering eller seie at kombinasjonen ikkje får plass — aldri leggje ting oppå kvarandre."
      : wideBed
      ? "Den større sengeplassen flyttar pivoten for å få klaring til høgre vegg. Pute og pledd flyttar seg med dei lokale festa; rombiletet blir ikkje skalert."
      : deskId === "desk-gaming"
        ? "Den breiare pulten held senteret. Lampa flyttar seg mot venstrekanten, skjermen held midten, og kontroll- og tårnfesta flyttar seg mot høgre."
      : "Møblane er monterte i same romscene. Byt variant for å sjå feste og tilbehøyr følgje rett møbel.";
    elements.details.classList.toggle("details-visible", elements.guideButton.getAttribute("aria-pressed") === "true");
  }

  elements.bedSelect.addEventListener("change", render);
  elements.footprintSelect.addEventListener("change", render);
  elements.deskSelect.addEventListener("change", render);
  elements.guideButton.addEventListener("click", function () {
    const visible = elements.guideButton.getAttribute("aria-pressed") !== "true";
    elements.guideButton.setAttribute("aria-pressed", String(visible));
    elements.guideButton.textContent = visible ? "Skjul feste-ID-ar" : "Vis feste-ID-ar";
    render();
  });

  render();
}());
