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
    VyrdepilBragd.announceBadges('vidfaren', earned || []);
  }

  /** Evaluer merke og vis toast for nye. Trygg å kalle ofte. */
  function evaluateAndAnnounce() {
    announceBadges(Progression.evaluate());
  }

  // ---- Merkegalleri ----
  async function renderBadgeGallery() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;
    grid.setAttribute('aria-busy', 'true');
    await VyrdepilBragd.migrationPromise;
    const earnedIds = VyrdepilStorage.getBragdData().badges.vidfaren || [];
    const definitions = await VyrdepilBragd.getBadgeDefinitions('vidfaren');
    await VyrdepilBragd.renderGameBadges(grid, 'vidfaren', earnedIds);
    const count = document.getElementById('badgeCount');
    if (count) count.textContent = `${earnedIds.length} / ${definitions.length}`;
  }

  function openBadgeGallery() {
    renderBadgeGallery().catch(function () {
      const grid = document.getElementById('badgeGrid');
      if (!grid) return;
      grid.removeAttribute('aria-busy');
      grid.textContent = 'Bragdane kunne ikkje lastast. Prøv att seinare.';
    });
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
