/* Lokale relasjonar, hushaldsavtalar og ei uttrykkeleg vald barnelinje. */
window.LL = window.LL || {};
LL.phase2Family = (function () {
  'use strict';
  const data = () => LL.data.getAdult().family;
  const empty = () => ({ partner: null, lease: false, cohabitConsent: false, childConsent: false,
    friend: false, friendFollowed: false, invited: [], strain: 0, last: '', pregnancy: null, child: null, care: 'shared' });
  const current = s => s.adult.household || empty();
  const name = id => data().people[id]?.name || '';
  const monthKey = (s, index = 0) => s.adult.year * 12 + index;

  function normalize(s, draft) {
    const f = current(s), input = draft || {};
    const mode = ['own', 'friends', 'household'].includes(input.time) ? input.time : 'own';
    return {
      time: mode, meet: input.meet === true,
      action: ['keep', 'join', 'separate', 'end'].includes(input.action) ? input.action : f.lease && !f.partner ? 'separate' : 'keep',
      talk: input.talk === true, child: ['plan', 'wait'].includes(input.child) ? input.child : 'keep',
      startMonth: Math.max(0, Math.min(11, Math.trunc(Number(input.startMonth) || 0))),
      leave: [0, 3, 6].includes(Number(input.leave)) ? Number(input.leave) : (f.pregnancy?.leave ?? f.child?.leave ?? 3),
      care: ['shared', 'player', 'other'].includes(input.care) ? input.care : f.care,
      childcare: input.childcare !== false
    };
  }

  function sharing(s, p) {
    const f = current(s);
    if (!LL.phase2Housing.option(p.housing).shareable || ['separate', 'end'].includes(p.family.action)) return false;
    return p.family.action === 'join' || f.lease;
  }

  function issue(s, p) {
    const f = current(s), input = p.family;
    if (input.action === 'join' && (!f.partner || !f.cohabitConsent)) return 'Snakk med partnaren om å bu saman før du planlegg delt leige.';
    if (input.action === 'join' && !LL.phase2Housing.option(p.housing).shareable) return 'Vel ei leilegheit som kan delast under Bustad.';
    if (input.action === 'end' && !f.partner) return 'Vel ei hushaldsendring som passar for den noverande situasjonen.';
    if (input.child === 'plan' && (!f.partner || !f.childConsent || f.child || f.pregnancy || input.action === 'end')) {
      return 'Snakk med partnaren og bli samde før du stadfestar ein plan om barn.';
    }
    if (input.child === 'wait' && f.pregnancy && f.pregnancy.start < monthKey(s)) return 'Barnet er alt venta. Du kan justere permisjon og omsorg.';
    return '';
  }

  function timeline(s, p) {
    const f = current(s), plan = p.family, bills = data().bills;
    if (f.child) return { ...f.child, born: true };
    if (f.pregnancy && (plan.child !== 'wait' || f.pregnancy.start < monthKey(s))) return f.pregnancy;
    if (plan.child !== 'plan' || issue(s, p)) return null;
    const start = monthKey(s, plan.startMonth);
    const earnings = s.adult.reports.at(-1)?.totals.wage || 0;
    return { start, due: start + bills.mutualDelay, coParent: f.partner, leave: plan.leave,
      earned: earnings >= bills.forecastMinimumAnnualWage, previousWage: earnings / 12 };
  }

  function monthly(s, p, index, wage) {
    const f = current(s), bills = data().bills;
    const time = monthKey(s, index), row = timeline(s, p);
    const share = sharing(s, p);
    if (!row || time < row.start) return { share, wage, benefit: 0, childCost: 0, effort: 0 };
    const age = time - row.due;
    if (age < 0) return { share, wage, benefit: 0, childCost: age === -1 ? bills.prebirth : 0, effort: .13 };
    const isApart = !f.partner || p.family.action === 'end';
    const care = p.family.care;
    const fraction = !isApart || care === 'shared' ? .55 : care === 'player' ? 1 : .20;
    const takesLeave = age < p.family.leave && care !== 'other';
    const replacement = row.earned ? Math.min(wage, row.previousWage) * bills.leaveShare : 0;
    const allowance = age > 0 ? (isApart && care === 'player' ? bills.singleBenefit : bills.benefit * fraction) : 0;
    const grant = age === 0 && !row.earned && care !== 'other' ? bills.lump * fraction : 0;
    const childcare = p.family.childcare && age >= 18 ? bills.childcare : 0;
    const items = (age < 12 ? bills.childInfant : bills.childToddler) + childcare + (age === 0 ? bills.birthEquipment : 0);
    return { share, wage: takesLeave ? replacement : wage, parental: takesLeave ? replacement : 0, benefit: allowance + grant, childCost: Math.round(items * fraction),
      effort: (age < 6 && takesLeave ? .85 : .48) * fraction, age, childcare, takesLeave };
  }

  function start(s, p) {
    const f = current(s);
    s.adult.household = f;
    if (p.family.action === 'end') deliver(s, 'partner-end');
    f.lease = sharing(s, p);
    f.care = p.family.care;
    if (p.family.child === 'wait' && f.pregnancy?.start >= monthKey(s)) {
      f.pregnancy = null;
      f.last = 'De vart samde om å vente med planen om barn.';
    }
    if (p.family.child === 'plan' && !f.pregnancy && !f.child) {
      f.pregnancy = timeline(s, p);
      f.last = 'De stadfesta tidspunktet for planen om barn.';
    }
  }

  function advance(s, p, index) {
    const f = current(s), n = monthKey(s, index);
    if (!f.pregnancy) return;
    if (f.pregnancy.start === n) {
      f.last = 'Den avtalte familieplanen er i gang.';
      s.adult.run.notes.push(f.last);
    }
    if (f.pregnancy.due === n && !f.child) {
      f.child = f.pregnancy;
      f.pregnancy = null;
      f.last = 'Barnet kom i den planlagde månaden.';
      s.adult.run.notes.push(f.last);
    }
  }

  function deliver(s, action) {
    const f = current(s);
    s.adult.household = f;
    const rememberInvite = id => { if (!f.invited.includes(id)) f.invited.push(id); };
    if (action === 'friend-keep' || action === 'friend-new') {
      f.friend = true;
      f.last = action === 'friend-keep' ? 'Du heldt avtalen med Maja.' : 'Du fann ein ny kveld med Maja.';
    } else if (action === 'friend-follow') {
      f.friendFollowed = true;
      f.last = 'Du og Maja fann tid til å halde kontakten.';
    } else if (action === 'partner-start' || action === 'partner-maja') {
      f.partner = action === 'partner-start' ? 'sam' : 'maja';
      rememberInvite(f.partner);
      f.strain = 0;
      f.last = 'Du og ' + name(f.partner) + ' valde å prøve eit forhold.';
    } else if (action === 'partner-friend' || action === 'maja-friend') {
      const id = action === 'partner-friend' ? 'sam' : 'maja';
      rememberInvite(id);
      f.last = 'Du og ' + name(id) + ' held fram som vener.';
    } else if (action === 'cohabit-yes' || action === 'cohabit-wait') {
      f.cohabitConsent = action === 'cohabit-yes';
      f.last = f.cohabitConsent ? 'De vart samde om å sjå på delt leige.' : 'De held fram med kvar dykkar bustad.';
    } else if (action === 'child-yes' || action === 'child-wait') {
      f.childConsent = action === 'child-yes';
      f.last = f.childConsent ? 'De vart samde om å sjå på ein plan om barn.' : 'De vart samde om å vente med barn.';
    } else if (action === 'partner-repair') {
      f.strain = 0;
      f.last = 'De avtalte ei praktisk endring som gir meir tid saman.';
    } else if (action === 'partner-end') {
      f.partner = null;
      f.cohabitConsent = false;
      f.childConsent = false;
      f.strain = 0;
      if (f.pregnancy?.start >= monthKey(s, s.adult.run?.month || 0)) f.pregnancy = null;
      f.last = 'Forholdet tok slutt. De kan planleggje bustad og eventuelle omsorgsavtalar i årsplanen.';
    }
  }

  function finish(s, p) {
    const f = current(s);
    if (!f.partner) return;
    f.strain = p.family.time === 'household' ? Math.max(0, f.strain - 1) : f.strain + 1;
  }

  function schedule(s, p) {
    const f = current(s), yearStart = monthKey(s);
    const requests = [];
    const row = timeline(s, p);
    if (row && row.due <= yearStart + 11) {
      const age = yearStart - row.due;
      const month = Math.max(2, row.due - yearStart + 1);
      requests.push({ id: age >= 18 ? 'familie-barnehage' : age >= 12 ? 'familie-lesestund' : 'familie-trilletur', month });
      if (month + 2 <= 12) {
        if (!f.partner) requests.push({ id: 'familie-delt-omsorg', month: month + 2 });
        else if (age < 6) requests.push({ id: 'familie-ven-stotte', month: month + 2 });
      }
    }
    if (f.partner && f.strain >= 2) requests.push({ id: f.strain >= 3 ? 'familie-slutt' : 'familie-avstand', month: 7 });
    if (f.partner && p.family.talk && !row && !f.childConsent) requests.push({ id: 'familie-plan-barn', month: 8 });
    if (f.partner && !f.lease && !f.cohabitConsent) requests.push({ id: 'familie-bu-saman', month: 5 });
    const candidates = (s.seed % 2 === 0 ? ['sam', 'maja'] : ['maja', 'sam']).filter(id => !f.invited.includes(id));
    if (!f.partner && p.family.meet && candidates.length) requests.push({ id: 'familie-' + candidates[0], month: 8 });
    if (!f.friend) requests.push({ id: 'familie-ven', month: 2 });
    else if (!f.friendFollowed) requests.push({ id: 'familie-ven-oppfolging', month: 3 });
    return requests.slice(0, 2);
  }

  function migrate(s) {
    const f = { ...empty(), ...s.adult.household };
    if ((f.partner && !name(f.partner)) || !Array.isArray(f.invited) || f.invited.some(id => !name(id)) || !Number.isFinite(f.strain)) throw new Error('Ugyldig relasjonshistorikk i lagringa.');
    for (const row of [f.pregnancy, f.child].filter(Boolean)) {
      if (!Number.isInteger(row.start) || row.start < 0 || !Number.isInteger(row.due) || row.due <= row.start || !name(row.coParent) || !Number.isFinite(row.previousWage)) throw new Error('Ugyldig familieplan i lagringa.');
    }
    s.adult.household = f;
  }

  return { current, name, monthKey, normalize, issue, sharing, timeline, monthly, start, advance, deliver, finish, schedule, migrate };
})();
