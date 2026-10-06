/* Livslina — events.js
 * Hendingsmotor: filtrer kort på vilkår, planlegg 4–5 valkort + styrte
 * særhendingar per skulehalvår, vis modal, bruk effektar.
 */
window.LL = window.LL || {};

LL.events = (function () {
  'use strict';

  let pendingResume = null;

  // ── Vilkårsevaluering ──
  function eligible(ev, state) {
    const w = ev.when || {};
    const round = LL.state.currentRound();
    if (w.rounds && w.rounds.indexOf(round.id) === -1) return false;
    if (w.moped && !state.possessions.moped) return false;
    if (w.noMoped && state.possessions.moped) return false;
    if (w.housing && state.housing !== w.housing) return false;
    if (w.programType && (!state.program || state.program.type !== w.programType)) return false;
    if (w.route && state.trainingRoute !== w.route) return false;
    if (typeof w.moneyAtMost === 'number' && state.stats.money > w.moneyAtMost) return false;
    if (w.flag && !state.flags[w.flag]) return false;
    if (w.notFlag && state.flags[w.notFlag]) return false;
    if (typeof w.minAge === 'number' && state.age < w.minAge) return false;
    if (w.overFrikort && !state.flags.overFrikort) return false;
    if (ev.once && state.flags['ev_' + ev.id]) return false;
    if (state.eventLog && state.eventLog.some(entry => entry.id === ev.id)) return false;
    return true;
  }

  // Planlegg hendingar for halvåret. Lagrar plan på ctx.
  function prepareTerm(state, ctx) {
    const pool = LL.data.getEvents().filter(ev => eligible(ev, state));
    const forced = pool.filter(ev => ev.forced);
    const random = pool.filter(ev => !ev.forced && ev.choices && ev.choices.length > 1);

    const chosen = forced.slice();
    // Fire–fem reelle valkort, i tillegg til særhendingar med berre eitt svar.
    const forcedDecisions = forced.filter(ev => ev.choices && ev.choices.length > 1).length;
    const target = Math.max(forcedDecisions, LL.state.drawInt(4, 5));
    const bag = random.slice();
    while (chosen.filter(ev => ev.choices && ev.choices.length > 1).length < target && bag.length) {
      const pick = weightedPick(bag);
      chosen.push(pick);
      bag.splice(bag.indexOf(pick), 1);
    }
    ctx.decisionTotal = chosen.filter(ev => ev.choices && ev.choices.length > 1).length;
    ctx.decisionShown = 0;

    // Fordel over månadene (tick 1..months)
    const months = ctx.round.months || 6;
    ctx.eventSchedule = {};
    chosen.forEach(ev => {
      let tick = LL.state.drawInt(1, months);
      // unngå kollisjon: skuv framover til ledig tick
      let guard = 0;
      while (ctx.eventSchedule[tick] && guard < months) { tick = (tick % months) + 1; guard++; }
      (ctx.eventSchedule[tick] = ctx.eventSchedule[tick] || []).push(ev);
    });
  }

  function weightedPick(arr) {
    let total = 0;
    arr.forEach(e => total += (e.weight || 1));
    let r = LL.state.draw() * total;
    for (const e of arr) { r -= (e.weight || 1); if (r <= 0) return e; }
    return arr[arr.length - 1];
  }

  // Kalla av ui-playback etter kvar månad. Viser hending om planlagt.
  function checkMonth(state, ctx, tick, resume) {
    const scheduled = ctx.eventSchedule && ctx.eventSchedule[tick] || [];
    const debtEvent = LL.data.getEvents().find(ev => ev.debtTrigger && eligible(ev, state));
    if (debtEvent && !scheduled.includes(debtEvent) && typeof ctx.decisionTotal === 'number') ctx.decisionTotal++;
    const list = debtEvent ? [debtEvent].concat(scheduled) : scheduled;
    if (!list.length) { resume(); return; }
    pendingResume = { list: list.slice(), idx: 0, state, ctx, resume };
    showNext();
  }

  function showNext() {
    const p = pendingResume;
    if (!p || p.idx >= p.list.length) { const r = p ? p.resume : null; pendingResume = null; if (r) r(); return; }
    const ev = p.list[p.idx];
    // Dobbeltsjekk vilkår (flags kan ha endra seg av førre kort)
    if (!eligible(ev, p.state)) { p.idx++; showNext(); return; }
    renderCard(ev, p.state, p.ctx);
  }

  function renderCard(ev, state, ctx) {
    document.getElementById('eventVignette').replaceChildren(LL.artVignette.create(ev.art));
    const meta = document.getElementById('eventMeta');
    if (ev.choices && ev.choices.length > 1 && typeof ctx.decisionTotal === 'number') {
      ctx.decisionShown++;
      const focus = ev.focus || 'Økonomi og trivsel';
      meta.textContent = 'Val ' + ctx.decisionShown + ' av ' + ctx.decisionTotal + ' i ' + ctx.round.label + ' · ' + focus;
    } else {
      meta.textContent = ev.focus ? 'Særhending · ' + ev.focus : 'Særhending i ' + ctx.round.label;
    }
    document.getElementById('eventTitle').textContent = ev.title;
    document.getElementById('eventText').textContent = ev.text;
    const choices = document.getElementById('eventChoices');
    choices.textContent = '';
    ev.choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vp-button vp-button--tool ll-event-choice';
      const lbl = document.createElement('span');
      lbl.className = 'll-event-choice-lbl';
      lbl.textContent = ch.label + priceHint(ch, state);
      btn.appendChild(lbl);
      const socialHint = socialEffectHint(ch, state);
      if (ch.note || socialHint) {
        const note = document.createElement('span');
        note.className = 'll-event-choice-note';
        note.textContent = [ch.note, socialHint].filter(Boolean).join(' · ');
        btn.appendChild(note);
      }
      btn.addEventListener('click', () => choose(ev, ch, state, ctx));
      choices.appendChild(btn);
    });
    LL.main.openModal('eventModal');
    LL.util.hydrate(document.getElementById('eventModal'));
  }

  function priceHint(ch, state) {
    const e = ch.effects || {};
    let amt = 0;
    if (e.insuranceApplies && state.possessions.phoneInsurance) amt = 500;
    else if (e.costKey) amt = LL.data.value(e.costKey);
    else if (e.cost) amt = e.cost;
    if (amt) {
      const label = e.insuranceApplies && state.possessions.phoneInsurance ? ' forsikrings-eigendel' : '';
      return ' — ' + LL.util.kr(amt) + label + (e.costFromSavings ? ' frå sparinga' : '');
    }
    if (e.gain) return ' — +' + LL.util.kr(e.gain);
    if (e.gainKey) return ' — +' + LL.util.kr(LL.data.value(e.gainKey));
    if (e.gainToSavings) return ' — +' + LL.util.kr(e.gainToSavings) + ' på sparinga';
    if (e.savingsToMoney) return ' — flytt opptil ' + LL.util.kr(e.savingsToMoney) + ' frå sparinga';
    return '';
  }

  function socialEffectHint(ch, state) {
    const effect = ch.effects && Number(ch.effects.social);
    if (!(effect > 0)) return '';
    const current = Number(state.stats.social) || 0;
    const gain = Math.min(effect, Math.max(0, 100 - current));
    return gain > 0 ? 'Sosialt +' + gain.toLocaleString('nn-NO', { maximumFractionDigits: 2 }) : 'Sosialmålaren er full';
  }

  function choose(ev, ch, state, ctx) {
    const moneyDelta = applyEffects(state, ch.effects || {}, ctx, ev);
    if (ev.once) state.flags['ev_' + ev.id] = true;
    LL.state.recordBalance(state);
    state.eventLog.push({ round: ctx.round.id, id: ev.id, choice: ch.label, moneyDelta, moneyAfter: state.stats.money, savingsAfter: state.stats.savings });
    ctx.eventLog.push({ id: ev.id, title: ev.title, choice: ch.label, moneyDelta });
    LL.main.closeModal('eventModal');
    LL.storage.saveActive(state);
    pendingResume.idx++;
    setTimeout(showNext, 1500);
  }

  function applyEffects(state, e, ctx, ev) {
    let moneyDelta = 0;

    // Kostnad
    let cost = 0;
    if (e.insuranceApplies && state.possessions.phoneInsurance) cost = 500;
    else if (e.costKey) cost = LL.data.value(e.costKey);
    else if (e.cost) cost = e.cost;
    if (cost) {
      if (e.costFromSavings) {
        const fromSavings = Math.min(state.stats.savings, cost);
        state.stats.savings -= fromSavings;
        state.stats.money -= cost - fromSavings;
      } else {
        state.stats.money -= cost;
      }
      moneyDelta -= cost;
      addCat(ctx.expense, 'events', cost);
    }

    if (e.savingsToMoney) {
      const transfer = Math.min(state.stats.savings, e.savingsToMoney);
      state.stats.savings -= transfer;
      state.stats.money += transfer;
    }

    // Gevinst
    let gain = 0;
    if (e.gainKey) gain = LL.data.value(e.gainKey);
    else if (e.gain) gain = e.gain;
    else if (typeof e.gainToSavings === 'number') gain = e.gainToSavings;
    if (gain) {
      if (e.gainToSavings) state.stats.savings += gain;
      else state.stats.money += gain;
      moneyDelta += gain;
      addCat(ctx.income, 'events', gain);
    }

    // Lønstimar (ekstravakter)
    if (e.wageHoursGain) {
      const wage = e.wageHoursGain * LL.economy.hourlyWage(state);
      state.stats.money += wage; moneyDelta += wage;
      state._yearWage = (state._yearWage || 0) + wage;
      state.totalWage = (state.totalWage || 0) + wage;
      ctx.wageThisTerm += wage;
      addCat(ctx.income, 'wage', wage);
    }

    // Stat-deltaer
    if (typeof e.wellbeing === 'number') LL.state.adjustWellbeing(state, e.wellbeing);
    if (typeof e.energy === 'number') {
      const beforeEnergy = state.stats.energy;
      state.stats.energy = LL.util.clamp(state.stats.energy + e.energy, 0, 100);
      if (ctx && typeof ctx.energyTotal === 'number') ctx.energyTotal += state.stats.energy - beforeEnergy;
    }
    if (typeof e.social === 'number') state.stats.social = LL.util.clamp(state.stats.social + e.social, 0, 100);
    if (typeof e.grades === 'number') state.stats.grades = LL.util.clamp(state.stats.grades + e.grades, 1, 6);

    // Flagg og eigedelar
    if (e.flags) for (const k in e.flags) state.flags[k] = e.flags[k];
    if (e.possessions) for (const k in e.possessions) state.possessions[k] = e.possessions[k];

    // Vendepunkt-logg (store økonomiske val)
    if (Math.abs(moneyDelta) >= 1000) {
      state.decisions.push({
        round: ctx.round.id, id: ev.id, label: ev.title + ': ' + trimChoice(ev, e),
        delta: moneyDelta
      });
    }
    LL.state.recordBalance(state);
    return moneyDelta;
  }

  function trimChoice(ev, effects) {
    const ch = (ev.choices || []).find(c => c.effects === effects);
    return ch ? ch.label : '';
  }

  function addCat(obj, key, val) { obj[key] = (obj[key] || 0) + val; }

  // Sommar-hending (eitt kort). Returnerer true om vist.
  function showSummerEvent(state, ctx, onDone) {
    const round = LL.state.currentRound();
    const pool = LL.data.getSummerEvents().filter(ev => {
      const w = ev.when || {};
      if (w.rounds && w.rounds.indexOf(round.id) === -1) return false;
      if (w.route && state.trainingRoute !== w.route) return false;
      if (ev.once && state.flags['ev_' + ev.id]) return false;
      if (state.eventLog && state.eventLog.some(entry => entry.id === ev.id)) return false;
      return true;
    });
    if (!pool.length) { onDone(); return false; }
    pendingResume = { list: [weightedPick(pool)], idx: 0, state, ctx, resume: onDone };
    showNext();
    return true;
  }

  return { prepareTerm, checkMonth, applyEffects, eligible, showSummerEvent };
})();
