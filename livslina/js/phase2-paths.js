/* Karrierevegar, fagfelt, yrkesroller og år som opnar eit nytt løp. */
window.LL = window.LL || {};
LL.phase2Paths = (function () {
  'use strict';
  const FIELDS = {
    'bygg-anlegg': 'bygg', elektro: 'industri', 'teknologi-industri': 'industri',
    'helse-oppvekst': 'helse', 'restaurant-mat': 'service', naturbruk: 'natur',
    'salg-service-reiseliv': 'service', 'frisor-blomster-interior': 'service',
    'handverk-design': 'kultur', 'it-medieproduksjon': 'data'
  };
  const RHYTHMS = {
    day: { label: 'Arbeid på dagtid', load: .85 },
    early: { label: 'Tidlege vakter', load: .95 },
    shift: { label: 'Turnus eller skift', load: 1.1 }
  };
  const SCIENCE = {
    hing: 'Matematikk R1 og R2 og fysikk 1',
    bio: 'Matematikk R1 eller S1 og S2, og eitt av fysikk 1, kjemi 1 eller biologi 1',
    merod: 'Matematikk R1 eller S1 og S2, fysikk 1 og kjemi 1 og 2'
  };

  function merge(base, catalogue, life) {
    if (catalogue.app !== 'livslina' || catalogue.version !== 1 || life.app !== 'livslina' || life.version !== 1) {
      throw new Error('Fleire vegar har eit ukjent dataformat.');
    }
    return {
      ...base,
      fields: catalogue.fields,
      routes: base.routes.map(item => ({ ...item, ...catalogue.core[item.id] })).concat(catalogue.routes),
      housing: base.housing.map(item => ({ ...item, ...life.housingChanges?.[item.id] })).concat(life.housing),
      sources: base.sources.concat(catalogue.sources, life.sources),
      events: base.events.concat(life.events),
      admissions: { ...base.admissions, examples: { ...base.admissions.examples, ...catalogue.examples } },
      transport: life.transport, family: life.family, extraYears: life.extraYears
    };
  }

  function category(s, item) {
    if (item.kind === 'job' || item.kind === 'study' && LL.phase2State.progress(s, item.id).graduated) return 'work';
    return item.kind === 'study' ? 'study' : 'year';
  }

  function field(s, item) {
    return item.field === 'fagbrev' ? FIELDS[s.adult.qualifications.trade] || 'service' : item.field;
  }

  function tradeRoute(s) {
    const trade = s.adult.qualifications.trade;
    if (!trade) return null;
    const routes = LL.data.getAdult().routes;
    return routes.find(item => item.kind === 'job' && item.program === trade) || LL.phase2State.route('eige-fag');
  }

  function qualification(s, item) {
    const a = s.adult, progress = LL.phase2State.progress(s, item.id);
    if (item.kind === 'study') {
      if (progress.graduated || progress.years > 0) return '';
      if (item.education === 'fagskule') return item.programs.includes(a.qualifications.trade) ? '' : 'Dette fagskuleløpet krev eit relevant fagbrev.';
      if (!a.qualifications.study) return 'Du treng studiekompetanse. Påbygg kan opne dette studiet.';
      if (item.science && !a.qualifications.science) return 'Du treng ' + SCIENCE[item.science] + '. Sjå «Ta særkrav i realfag».';
    }
    if (item.kind === 'bridge' && a.qualifications.study) return 'Du har alt studiekompetanse.';
    if (item.experience === 'folk' && progress.graduated) return 'Du har fullført denne folkehøgskulelinja.';
    if (item.experience === 'science' && !a.qualifications.study) return 'Ta påbygg før realfagsløpet.';
    if (item.experience === 'science' && a.qualifications.science) return 'Du har alt fullført realfagsløpet.';
    if (item.experience === 'retake' && !a.qualifications.study) return 'Ta påbygg for å få studiekompetanse fyrst.';
    if (item.program === 'other') return a.qualifications.trade ? '' : 'Du treng eit fagbrev.';
    return !item.program || item.program === a.qualifications.trade ? '' : 'Dette arbeidet krev eit fagbrev frå det aktuelle faget.';
  }

  function roles(s, item) {
    if (category(s, item) !== 'work') return [];
    const years = LL.phase2State.progress(s, item.id).workYears || 0;
    return (item.roles || []).filter(role => years >= (role.experience || 0));
  }

  function role(s, item, id) {
    const choices = roles(s, item);
    return choices.find(work => work.id === id) || choices[0] || null;
  }

  function rhythm(work) { return RHYTHMS[work?.rhythm] || RHYTHMS.day; }

  function otherRoutes(item, occupation) {
    if (!occupation) return [];
    return LL.data.getAdult().routes.filter(route => route !== item &&
      route.roles?.some(work => work.occupation === occupation));
  }

  function change(s, next) {
    const current = LL.phase2State.route(s.adult.routeId) || (s.adult.year === 0 ? tradeRoute(s) : null);
    if (!current || current.id === next.id || category(s, current) === 'year') return null;
    const currentLabel = LL.phase2State.label(s, current.id, s.adult.plan?.roleId);
    const nextLabel = LL.phase2State.label(s, next.id);
    if (!s.adult.routeId) return 'Du vel «' + nextLabel + '» for dette året. Fagbrevet blir med vidare, og du kan velje arbeid i faget seinare.';
    return 'Du går frå «' + currentLabel + '» til «' + nextLabel + '». Fullførte år og kvalifikasjonar frå det førre løpet er lagra.';
  }

  function studyCost(s, route, plan, index) {
    const options = LL.data.getAdult().extraYears;
    if (route.experience === 'folk') {
      const regular = index < 10;
      return { tuition: regular ? options.folk.internat + (plan.folkActivities === 'extra' ? options.folk.activities : 0) : 0,
        loan: regular && plan.borrow ? options.folk.loan : 0, board: regular };
    }
    if (route.experience === 'travel' && index < plan.travelMonths) {
      const cost = options.travel;
      return { travel: cost.food + cost.bed + cost.insurance + cost.local + (index === 0 ? cost.start : index === plan.travelMonths - 1 ? cost.end : 0), travelling: true };
    }
    if (['retake', 'science'].includes(route.experience)) {
      const cost = options[route.experience];
      return { exam: (index === 0 ? cost.preparation : 0) + (index === 8 ? cost.exam : 0) };
    }
    return {};
  }

  return { merge, category, field, tradeRoute, qualification, roles, role, rhythm, otherRoutes, change, studyCost };
})();
