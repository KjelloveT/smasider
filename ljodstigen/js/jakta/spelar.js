/* ══════════════════════════════════════════════
   SPELAR.JS — Den valde figuren i Bokstavjakta

   Profilen vel SVG-figuren. Kroppen, armane og hovudet er teikna saman,
   medan same enkle squash, vipp og blyantsving gjev liv til alle ti.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const FART = 300;
  const HOPPKRAFT = 720;
  const COYOTE_MS = 110;
  const BUFFER_MS = 160;
  const SVING_MS = 260;

  function lag(scene, x, y, opts) {
    opts = opts || {};
    const avatarId = opts.avatar || 'sirkel';
    const storleik = opts.storleik || 44;
    const kropp = scene.physics.add.sprite(x, y, 'ljod-avatar-' + avatarId);
    kropp.setDisplaySize(storleik, storleik * 1.32);
    /* SVG-en har 128 pikslar med gjennomsiktig luft kring figuren. */
    kropp.body.setSize(76, 116).setOffset(26, 6);
    kropp.setCollideWorldBounds(true);
    kropp.setDepth(20);

    const blyant = scene.add.image(x, y, 'kenney', 'item_pencil');
    blyant.setDisplaySize(storleik * 0.26, storleik * 0.62);
    blyant.setDepth(22).setOrigin(0.5, 0.9);

    const s = {
      kropp: kropp,
      blyant: blyant,
      svingar: 0,
      storleik: storleik,
      retning: 1,
      strekk: 1,
      vipp: 0,
      gangfase: 0,
      sistPaaGrunn: -1e9,
      sistHoppTrykt: -1e9,
      trygg: { x: x, y: y },
      onHopp: null,
      onLanding: null
    };

    s.oppdater = function (tid, delta, inn) {
      const k = s.kropp;
      const paaBakken = k.body.blocked.down || k.body.touching.down;
      const akse = Math.max(-1, Math.min(1, inn.akse || 0));
      k.setVelocityX(akse * FART);
      if (akse < -0.05) s.retning = -1;
      else if (akse > 0.05) s.retning = 1;

      if (paaBakken) {
        if (s.sistPaaGrunn < tid - 60 && s.onLanding) s.onLanding();
        s.sistPaaGrunn = tid;
        s.trygg = { x: k.x, y: k.y };
      }
      if (inn.hoppTrykt) s.sistHoppTrykt = tid;
      if ((tid - s.sistPaaGrunn) <= COYOTE_MS && (tid - s.sistHoppTrykt) <= BUFFER_MS) {
        k.setVelocityY(-HOPPKRAFT);
        s.sistPaaGrunn = -1e9;
        s.sistHoppTrykt = -1e9;
        s.strekk = 1.18;
        if (s.onHopp) s.onHopp();
      }
      if (!inn.hopp && k.body.velocity.y < -200) k.setVelocityY(-200);
      teikn(delta, akse, paaBakken);
    };

    function teikn(delta, akse, paaBakken) {
      const k = s.kropp;
      const fart = Math.abs(k.body.velocity.x);
      const d = Math.min(delta, 50) / 16.7;
      const maal = paaBakken ? 1 : 1.08;
      s.strekk += (maal - s.strekk) * 0.16 * d;
      k.setDisplaySize(s.storleik / s.strekk, s.storleik * 1.32 * s.strekk);
      if (paaBakken && fart > 8) {
        s.gangfase += (0.16 + fart / 2600) * d;
        s.vipp += (Math.sin(s.gangfase * 4) * 0.10 - s.vipp) * 0.3 * d;
      } else {
        s.vipp += (0 - s.vipp) * 0.16 * d;
      }
      k.setRotation(s.vipp + (paaBakken ? 0 : k.body.velocity.x / 6000));
      k.setFlipX(s.retning < 0);

      /* Blyanten følgjer armen som ligg i den retninga figuren ser. */
      const svev = paaBakken ? Math.sin(s.gangfase * 4) * 3 : -6;
      s.blyant.x = k.x + s.retning * s.storleik * 0.43;
      s.blyant.y = k.y + s.storleik * 0.12 + svev;
      s.blyant.setVisible(k.visible);
      s.blyant.setFlipX(s.retning < 0);
      if (s.svingar > 0) {
        s.svingar = Math.max(0, s.svingar - delta);
        const p = 1 - s.svingar / SVING_MS;
        s.blyant.setAngle(-30 * s.retning + Math.sin(p * Math.PI) * 110 * s.retning);
      } else {
        s.blyant.setAngle(-30 * s.retning);
      }
    }

    s.bergOmFalt = function (grense) {
      if (s.kropp.y <= grense) return false;
      s.kropp.setPosition(s.trygg.x, s.trygg.y - 8);
      s.kropp.setVelocity(0, 0);
      s.blyant.setPosition(s.trygg.x, s.trygg.y);
      return true;
    };
    s.sving = function () { s.svingar = SVING_MS; };
    s.riv = function () {
      s.blyant.destroy();
      s.kropp.destroy();
    };
    return s;
  }

  root.JaktaSpelar = {
    lag: lag, FART: FART, HOPPKRAFT: HOPPKRAFT,
    COYOTE_MS: COYOTE_MS, BUFFER_MS: BUFFER_MS
  };
})(window);
