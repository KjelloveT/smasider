/* ══════════════════════════════════════════════
   LANDKJENNING — Progresjon-UI: merkegalleri + toast
   Mønster lånt frå heimsank/js/progression-ui.js.
   ══════════════════════════════════════════════ */

const ProgressionUI = (function () {

  /* Kort melding — sjå Vy.toast() i js/vyrdepil-util.js. Låg tidlegare her i
     eiga utgåve; flytta til fellesmodulen så rettingar treffer alle verktøya,
     og fordi den gamle stilen fylte flata med --accent og fall under
     kontrastkravet for faste lyse flater (AGENTS.md §3.2). */
  function toast(msg, icon, kind) {
    return Vy.toast(msg, { icon: icon, kind: kind });
  }

  function announceBadges(earned) {
    VyrdepilBragd.recordBadges('vidfaren', earned || []);
    (earned || []).forEach(b => toast('Ny bragd: ' + b.name, b.ico, 'badge'));
  }

  /** Evaluer merke og vis toast for nye. Trygg å kalle ofte. */
  function evaluateAndAnnounce() {
    announceBadges(Progression.evaluate());
  }

  // ---- Merkegalleri ----
  function renderBadgeGallery() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;
    grid.setAttribute('aria-busy', 'true');
    const earnedIds = Progression.BADGES.filter(b => Progression.hasBadge(b.id)).map(b => b.id);
    VyrdepilBragd.renderGameBadges(grid, 'vidfaren', earnedIds).catch(() => grid.removeAttribute('aria-busy'));

    const count = document.getElementById('badgeCount');
    if (count) {
      const earned = Progression.BADGES.filter(b => Progression.hasBadge(b.id)).length;
      count.textContent = `${earned} / ${Progression.BADGES.length}`;
    }
  }

  function openBadgeGallery() {
    renderBadgeGallery();
    Vy.openModal(document.getElementById('badgeModal'));
  }
  function closeBadgeGallery() {
    Vy.closeModal(document.getElementById('badgeModal'));
  }

  return {
    toast, announceBadges, evaluateAndAnnounce,
    renderBadgeGallery, openBadgeGallery, closeBadgeGallery
  };
})();

if (typeof window !== 'undefined') {
  window.ProgressionUI = ProgressionUI;
  window.openBadgeGallery = ProgressionUI.openBadgeGallery;
  window.closeBadgeGallery = ProgressionUI.closeBadgeGallery;
}
