/* stopwords.js — høgfrekvente funksjonsord for nynorsk, bokmål og engelsk.
   Unionen av alle tre listene blir brukt som standard. Stoppord blir framleis
   viste i ordlista, men er avslegne — brukaren kan slå kvart ord på att.
   Merk: kryss-språklege kollisjonar finst (t.d. bokmål «men» = engelsk «men»). */
(function (root) {
  'use strict';

  const NN = [
    'og', 'i', 'eg', 'det', 'som', 'på', 'dei', 'å', 'er', 'til', 'han', 'ho', 'ikkje',
    'ein', 'eit', 'ei', 'du', 'vi', 'me', 'de', 'den', 'denne', 'dette', 'desse',
    'var', 'vere', 'vert', 'vart', 'blir', 'bli', 'blei', 'vore', 'har', 'hadde', 'ha',
    'kan', 'kunne', 'skal', 'skulle', 'vil', 'ville', 'må', 'måtte', 'av', 'for', 'med',
    'om', 'at', 'alle', 'andre', 'anna', 'noko', 'nokon', 'nokre', 'kva', 'kven', 'kvar',
    'korleis', 'kvifor', 'når', 'då', 'no', 'her', 'der', 'hit', 'dit', 'opp', 'ned',
    'ut', 'inn', 'inne', 'ute', 'over', 'under', 'mellom', 'mot', 'frå', 'etter', 'før',
    'sidan', 'men', 'eller', 'viss', 'dersom', 'fordi', 'så', 'slik', 'slike', 'sjølv',
    'berre', 'også', 'òg', 'enn', 'meir', 'mest', 'mykje', 'mange', 'fleire', 'flest',
    'få', 'færre', 'lite', 'liten', 'litt', 'stor', 'store', 'større', 'størst',
    'heile', 'heilt', 'svært', 'veldig', 'godt', 'god', 'gode', 'betre', 'best',
    'same', 'sin', 'si', 'sitt', 'sine', 'min', 'mi', 'mitt', 'mine', 'din', 'di',
    'ditt', 'dine', 'vår', 'vårt', 'våre', 'hans', 'hennar', 'deira', 'oss', 'dykk',
    'deg', 'meg', 'seg', 'kor', 'både', 'kvarandre', 'gjennom', 'hjå', 'ved', 'utan',
    'blant', 'ifølgje', 'gjere', 'gjer', 'gjorde', 'gjort', 'får', 'fekk', 'fått',
    'ta', 'tek', 'tok', 'teke', 'kome', 'kjem', 'kom', 'gå', 'går', 'gjekk', 'gått',
    'sei', 'seier', 'sa', 'sagt', 'sjå', 'ser', 'såg', 'sett', 'vere', 'verte',
    'ho', 'honom', 'henne', 'noka', 'nokor', 'inga', 'ingen', 'inkje', 'ingenting',
    'alt', 'altså', 'difor', 'derfor', 'dermed', 'likevel', 'allereie', 'alltid',
    'aldri', 'ofte', 'gong', 'gongen', 'gonger', 'kanskje', 'truleg', 'nett', 'nettopp',
    'medan', 'ulik', 'ulike', 'ulikt', 'fyrste', 'første', 'finst', 'fanst',
    'nytta', 'nyttar', 'nytte', 'rundt', 'seinare', 'anten', 'dømes', 'mellom'
  ];

  const NB = [
    'og', 'i', 'jeg', 'det', 'at', 'en', 'et', 'ei', 'den', 'til', 'er', 'som', 'på',
    'de', 'med', 'han', 'hun', 'av', 'ikke', 'der', 'så', 'var', 'meg', 'seg', 'men',
    'ett', 'har', 'om', 'vi', 'min', 'mitt', 'ha', 'hadde', 'hun', 'nå', 'over', 'da',
    'ved', 'fra', 'du', 'ut', 'sin', 'dem', 'oss', 'opp', 'man', 'kan', 'hans', 'hvor',
    'eller', 'hva', 'skal', 'selv', 'sjøl', 'her', 'alle', 'vil', 'bli', 'ble', 'blitt',
    'blir', 'kunne', 'inn', 'når', 'være', 'kom', 'noen', 'noe', 'ville', 'dere', 'som',
    'deres', 'kun', 'ja', 'etter', 'ned', 'skulle', 'denne', 'for', 'deg', 'si', 'sine',
    'sitt', 'mot', 'å', 'meget', 'hvorfor', 'dette', 'disse', 'uten', 'hvordan', 'ingen',
    'din', 'ditt', 'blei', 'dei', 'mye', 'mange', 'flere', 'flest', 'mer', 'mest',
    'hele', 'helt', 'svært', 'veldig', 'godt', 'god', 'gode', 'bedre', 'best', 'samme',
    'mine', 'dine', 'vår', 'vårt', 'våre', 'hennes', 'både', 'gjennom', 'hos', 'blant',
    'ifølge', 'gjøre', 'gjør', 'gjorde', 'gjort', 'får', 'fikk', 'fått', 'ta', 'tar',
    'tok', 'tatt', 'komme', 'kommer', 'gå', 'går', 'gikk', 'gått', 'sier', 'sa', 'sagt',
    'se', 'ser', 'sett', 'vært', 'altså', 'derfor', 'dermed', 'likevel', 'allerede',
    'alltid', 'aldri', 'ofte', 'gang', 'gangen', 'ganger', 'kanskje', 'bare', 'også',
    'enn', 'liten', 'litt', 'stor', 'store', 'større', 'størst', 'annet', 'annen', 'andre',
    'mens', 'ulik', 'ulike', 'ulikt', 'første', 'finnes', 'fantes', 'rundt', 'senere',
    'enten', 'eksempel', 'mellom'
  ];

  const EN = [
    'the', 'of', 'and', 'a', 'an', 'to', 'in', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'am', 'you', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she',
    'they', 'them', 'him', 'his', 'her', 'hers', 'their', 'theirs', 'we', 'us', 'our',
    'ours', 'me', 'my', 'mine', 'your', 'yours', 'for', 'on', 'with', 'as', 'at', 'by',
    'from', 'up', 'down', 'out', 'off', 'about', 'into', 'onto', 'over', 'under',
    'after', 'before', 'between', 'through', 'during', 'above', 'below', 'again',
    'further', 'then', 'once', 'not', 'no', 'nor', 'but', 'or', 'if', 'because', 'so',
    'than', 'too', 'there', 'here', 'when', 'where', 'why', 'how', 'what', 'who',
    'whom', 'which', 'whose', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'much', 'many', 'other', 'others', 'some', 'such', 'only', 'own', 'same', 'very',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having', 'get',
    'gets', 'got', 'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came',
    'say', 'says', 'said', 'see', 'sees', 'saw', 'seen', 'make', 'makes', 'made',
    'also', 'just', 'even', 'still', 'now', 'always', 'never', 'often', 'maybe',
    'perhaps', 'yes', 'one', 'two', 'first', 'last', 'new', 'old', 'good', 'well',
    'while', 'until', 'since', 'against', 'within', 'without', 'upon', 'though',
    'although', 'however', 'therefore', 'thus', 'etc'
  ];

  let cachedAll = null;

  root.OrdskoddeStopwords = {
    nn: NN,
    nb: NB,
    en: EN,
    all() {
      if (!cachedAll) cachedAll = new Set([...NN, ...NB, ...EN]);
      return cachedAll;
    }
  };
})(window);
