/* AVATARS-3D.JS — fargar og hovudpynt på den animerte minifiguren */
(function (root) {
  'use strict';

  function palette(id) {
    return root.LjodAvatar.get(id).palette;
  }

  function rgb(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
  }

  function colour(id, r, g, b, joint) {
    const p = palette(id);
    const body = rgb(p.body), accent = rgb(p.accent), skin = rgb(p.skin);
    const headDark = joint === 6 && r < 90 && g < 90 && b < 100;
    const skinTone = r > 100 && r < 210 && r > g * 1.22 && g > b * 1.12;
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 25 || Math.max(r, g, b) < 55;
    const orange = r > 210 && g > 105 && b < 165;
    const target = headDark ? body : (skinTone ? skin : (neutral ? [r, g, b] : (orange ? accent : body)));
    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const shade = headDark ? 0.48 : (neutral ? 1 : Math.max(0.72, Math.min(1.16, 0.74 + brightness * 0.42)));
    return [target[0] * shade / 255, target[1] * shade / 255, target[2] * shade / 255];
  }

  function append(id, pos, nor, far, ledd, vekt) {
    const avatar = root.LjodAvatar.get(id);
    const p = avatar.palette;
    const body = rgb(p.body), accent = rgb(p.accent);
    const light = [247, 244, 232];

    function vertex(point, normal, colourValue) {
      pos.push(point[0], point[1], point[2]);
      nor.push(normal[0], normal[1], normal[2]);
      far.push(colourValue[0] / 255, colourValue[1] / 255, colourValue[2] / 255);
      ledd.push(6, 0, 0, 0);
      vekt.push(1, 0, 0, 0);
    }

    function triangle(a, b, c, colourValue, centre) {
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      const length = Math.hypot(n[0], n[1], n[2]) || 1;
      n = [n[0] / length, n[1] / length, n[2] / length];
      if (centre) {
        const middle = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
        const outward = (middle[0] - centre[0]) * n[0] + (middle[1] - centre[1]) * n[1] + (middle[2] - centre[2]) * n[2];
        if (outward < 0) { const swap = b; b = c; c = swap; n = [-n[0], -n[1], -n[2]]; }
      }
      vertex(a, n, colourValue);
      vertex(b, n, colourValue);
      vertex(c, n, colourValue);
    }

    function octahedron(cx, cy, cz, rx, ry, rz, colourValue) {
      const centre = [cx, cy, cz];
      const top = [cx, cy + ry, cz], bottom = [cx, cy - ry, cz];
      const right = [cx + rx, cy, cz], left = [cx - rx, cy, cz];
      const front = [cx, cy, cz + rz], back = [cx, cy, cz - rz];
      [[top, right, front], [top, front, left], [top, left, back], [top, back, right],
       [bottom, front, right], [bottom, left, front], [bottom, back, left], [bottom, right, back]]
        .forEach(function (face) { triangle(face[0], face[1], face[2], colourValue, centre); });
    }

    function cone(base, tip, radius, colourValue) {
      const axis = [tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]];
      const length = Math.hypot(axis[0], axis[1], axis[2]) || 1;
      const direction = [axis[0] / length, axis[1] / length, axis[2] / length];
      const reference = Math.abs(direction[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let u = [direction[1] * reference[2] - direction[2] * reference[1], direction[2] * reference[0] - direction[0] * reference[2], direction[0] * reference[1] - direction[1] * reference[0]];
      const uLength = Math.hypot(u[0], u[1], u[2]) || 1;
      u = [u[0] / uLength, u[1] / uLength, u[2] / uLength];
      const v = [direction[1] * u[2] - direction[2] * u[1], direction[2] * u[0] - direction[0] * u[2], direction[0] * u[1] - direction[1] * u[0]];
      const ring = [];
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        ring.push([base[0] + radius * (u[0] * Math.cos(angle) + v[0] * Math.sin(angle)),
                   base[1] + radius * (u[1] * Math.cos(angle) + v[1] * Math.sin(angle)),
                   base[2] + radius * (u[2] * Math.cos(angle) + v[2] * Math.sin(angle))]);
      }
      const middle = [base[0] + axis[0] * 0.45, base[1] + axis[1] * 0.45, base[2] + axis[2] * 0.45];
      for (let i = 0; i < ring.length; i++) triangle(ring[i], ring[(i + 1) % ring.length], tip, colourValue, middle);
    }

    function leaf(a, b, colourValue) {
      const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + 0.025];
      const sideA = [middle[0] - 0.035, middle[1], middle[2]];
      const sideB = [middle[0] + 0.035, middle[1], middle[2]];
      triangle(a, sideA, b, colourValue);
      triangle(a, b, sideB, colourValue);
    }

    function star(cx, cy, cz, radius, colourValue) {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? radius * 0.44 : radius;
        points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, cz]);
      }
      const centre = [cx, cy, cz];
      for (let i = 0; i < points.length; i++) triangle(centre, points[i], points[(i + 1) % points.length], colourValue);
    }

    switch (avatar.accessory) {
      case 'leaf':
        cone([0, 0.63, 0], [0, 0.83, 0], 0.012, accent);
        leaf([0, 0.70, 0], [-0.15, 0.79, 0], body);
        leaf([0, 0.74, 0], [0.15, 0.84, 0], body);
        break;
      case 'antenna':
        cone([0, 0.63, 0], [0, 0.82, 0], 0.016, light);
        octahedron(0, 0.85, 0, 0.055, 0.055, 0.055, accent);
        octahedron(-0.22, 0.56, 0, 0.05, 0.05, 0.05, accent);
        octahedron(0.22, 0.56, 0, 0.05, 0.05, 0.05, accent);
        break;
      case 'mushroom':
        octahedron(0, 0.71, 0, 0.28, 0.09, 0.23, body);
        octahedron(-0.12, 0.73, 0.21, 0.035, 0.035, 0.02, light);
        octahedron(0.09, 0.76, 0.20, 0.03, 0.03, 0.02, light);
        break;
      case 'star':
        star(0, 0.79, 0.02, 0.14, accent);
        break;
      case 'helmet':
        octahedron(0, 0.56, 0, 0.27, 0.22, 0.25, light);
        octahedron(0, 0.57, 0.245, 0.19, 0.075, 0.035, [132, 214, 223]);
        octahedron(0, 0.76, 0, 0.045, 0.045, 0.045, accent);
        break;
      case 'cloud':
        octahedron(-0.13, 0.71, 0, 0.13, 0.12, 0.12, light);
        octahedron(0.02, 0.76, 0, 0.15, 0.15, 0.14, light);
        octahedron(0.16, 0.71, 0, 0.12, 0.11, 0.12, light);
        break;
      case 'horns':
        cone([-0.14, 0.63, 0], [-0.23, 0.79, 0], 0.05, light);
        cone([0.14, 0.63, 0], [0.23, 0.79, 0], 0.05, light);
        break;
      case 'comet':
        octahedron(0.10, 0.76, 0, 0.075, 0.075, 0.075, accent);
        leaf([0.03, 0.73, -0.01], [-0.22, 0.67, -0.01], [238, 118, 87]);
        leaf([0.02, 0.76, 0.01], [-0.18, 0.80, 0.01], light);
        break;
      case 'fern':
        cone([0, 0.63, 0], [0, 0.84, 0], 0.012, accent);
        leaf([0, 0.68, 0], [-0.16, 0.76, 0], body);
        leaf([0, 0.72, 0], [0.15, 0.81, 0], body);
        leaf([0, 0.77, 0], [-0.11, 0.86, 0], body);
        break;
      case 'crystal':
        octahedron(0, 0.78, 0, 0.10, 0.18, 0.10, accent);
        break;
    }
  }

  root.LjodAvatar3D = { colour: colour, append: append };
})(window);