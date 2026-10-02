(() => {
  const currentScript = document.currentScript;
  const projectRoot = new URL('../', currentScript.src);
  const registryUrl = new URL('json/vyrdepil-design.json', projectRoot);

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

  async function applyHomepageBackground() {
    const response = await fetch(registryUrl, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('Bakgrunnsregisteret kunne ikkje lesast.');
    const timestamp = Date.parse(response.headers.get('Date') || '');
    if (!Number.isFinite(timestamp)) throw new Error('Tenaren sende ikkje eit gyldig datostempel.');
    const registry = await response.json();
    const homepageSet = registry.siteBackgroundSets && registry.siteBackgroundSets.homepage;
    if (!homepageSet || !Array.isArray(homepageSet.backgroundIds)) throw new Error('Bakgrunnssettet for framsida manglar.');
    const parts = osloDateParts(timestamp);
    const id = homepageSet.scene + '-' + seasonAt(parts.month) + '-' + timeAt(parts.hour);
    const background = registry.backgrounds.find(item => item.id === id && homepageSet.backgroundIds.includes(id));
    if (!background) throw new Error('Det finst ikkje eit bakgrunnsbilete for denne årstida og tida.');
    const imageUrl = new URL(background.file, projectRoot);
    document.body.style.setProperty('--vp-landscape', 'url("' + imageUrl.href + '")');
  }

  if (document.body.dataset.vpHome === 'true') {
    applyHomepageBackground().catch(error => {
      console.warn('Framsidebakgrunnen brukar sommardag som reserve:', error.message);
    });
  }
})();
