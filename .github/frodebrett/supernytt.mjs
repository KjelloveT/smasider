const catalog = 'https://psapi.nrk.no/tv/catalog/series/supernytt/seasons/';

export async function supernyttTopics(period, get = fetch) {
  const months = new Set([period.from, period.through].map(date => date.slice(0, 7).replace('-', '')));
  const results = await Promise.allSettled([...months].map(async month => {
    const response = await get(catalog + month, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const data = await response.json();
    return data._embedded?.instalments ?? [];
  }));
  return results.flatMap(result => result.status === 'fulfilled' ? result.value : []).flatMap(episode => {
    const date = episode.releaseDateOnDemand?.slice(0, 10);
    const title = episode.titles?.title?.trim();
    const summary = episode.titles?.subtitle?.trim();
    if (!date || date < period.from || date > period.through || !title || !summary) return [];
    return [{ date, title: title.slice(0, 120), summary: summary.slice(0, 330) }];
  }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 9);
}
