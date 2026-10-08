(() => {
  const currentScript = document.currentScript;
  const projectRoot = new URL('../', currentScript.src);
  const registryUrl = new URL('json/vyrdepil-design.json', projectRoot);
  let backgroundDataPromise;

  const seasonAt = month => {
    if (month === 12 || month <= 2) return 'vinter';
    if (month <= 5) return 'var';
    if (month <= 8) return 'sommar';
    return 'haust';
  };

  const timeAt = hour => {
    if (hour < 6) return 'natt';
    if (hour < 12) return 'morgon';
    if (hour < 18) return 'dag';
    return 'kveld';
  };

  function osloDateParts(timestamp) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', month: 'numeric', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(timestamp));
    return Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
  }

  function loadBackgroundData() {
    if (!backgroundDataPromise) {
      backgroundDataPromise = fetch(registryUrl, { cache: 'no-store', credentials: 'omit' }).then(async response => {
        if (!response.ok) throw new Error('Bakgrunnsregisteret kunne ikkje lesast.');
        const timestamp = Date.parse(response.headers.get('Date') || '');
        if (!Number.isFinite(timestamp)) throw new Error('Tenaren sende ikkje eit gyldig datostempel.');
        return { registry: await response.json(), timestamp };
      }).catch(error => {
        backgroundDataPromise = null;
        throw error;
      });
    }
    return backgroundDataPromise;
  }

  async function applyBackgroundSet(setId, root = document.body) {
    const { registry, timestamp } = await loadBackgroundData();
    const backgroundSet = registry.siteBackgroundSets && registry.siteBackgroundSets[setId];
    if (!backgroundSet || !Array.isArray(backgroundSet.backgroundIds)) throw new Error(`Bakgrunnssettet ${setId} manglar.`);
    const parts = osloDateParts(timestamp);
    const id = backgroundSet.scene + '-' + seasonAt(parts.month) + '-' + timeAt(parts.hour);
    const background = registry.backgrounds.find(item => item.id === id && backgroundSet.backgroundIds.includes(id));
    if (!background) throw new Error('Det finst ikkje eit bakgrunnsbilete for denne årstida og tida.');
    const imageUrl = new URL(background.file, projectRoot);
    root.style.setProperty('--vp-landscape', 'url("' + imageUrl.href + '")');
    return background;
  }

  window.VyrdepilHomeBackground = { apply: applyBackgroundSet };

  if (document.body.dataset.vpHome === 'true') {
    applyBackgroundSet('homepage').catch(error => {
      console.warn('Framsidebakgrunnen brukar sommardag som reserve:', error.message);
    });
  }
})();
