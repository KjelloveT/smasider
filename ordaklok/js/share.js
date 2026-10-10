/* Ordaklok-adapter: bevarer #d/#dz og eldre ?d/?dz-lenkjer. */
(function (root) {
  'use strict';
  function buildShareUrl(list) {
    const base = location.origin + location.pathname.replace(/[^/]+$/, '') + 'index.html';
    return VyrdepilShare.buildUrl(list, base);
  }
  function readParams() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    return hash.has('d') || hash.has('dz') ? hash : new URLSearchParams(location.search);
  }
  function scrubLegacyQuery() {
    const search = new URLSearchParams(location.search);
    if (!search.has('d') && !search.has('dz')) return;
    search.delete('d'); search.delete('dz');
    const rest = search.toString();
    history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  }
  root.OrdaklokShare = {
    encodeList: VyrdepilShare.encode,
    decodeFromParams: VyrdepilShare.decodeFromParams,
    buildShareUrl, readParams, scrubLegacyQuery
  };
})(window);
