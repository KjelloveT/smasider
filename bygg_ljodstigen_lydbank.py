#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Byggjer lydspritene til Ljodstigen frå råopptaka.

    python bygg_ljodstigen_lydbank.py [--stemme <id>] [bank ...]

Les WAV-filer frå  _kjelder/ljodstigen-lyd/<stemme>/<bank>/<id>.wav
og skriv           ljodstigen/lyd/<stemme>/<bank>.mp3  +  <bank>.json

Standardstemma er «vyrde-20261014». Ligg råopptaka rett under
_kjelder/ljodstigen-lyd/<bank>/ utan stemmemappe, blir dei lesne der òg,
slik det var før stemmepakkane kom.

Éin MP3 per bank i staden for 213 småfiler: seks bankar i staden
for hundrevis, som betyr noko på skule-wifi.

HEILE RÅOPPTAKET BLIR BEVART. Ingen terskel, stilldeteksjon eller trimming
får fjerne svake konsonantopningar eller utklinging. Legg 80 ms luft før,
140 ms etter og 100 ms mellom klippa. Berre den tilførte stilla blir fada.
Styrken blir delvis jamna, med -1 dBFS som tak.

MP3 er valt framfor Opus fordi iPad er utbreidd i norske klasserom og
Safari sin Opus-støtte er for fersk. 64 kbps mono: desse klippa er
læremateriell der det å skilje /f/ frå /v/ er sjølve poenget, og heile
banken er kring 1,7 MB ferdig pakka.
"""
import array
import io
import json
import math
import os
import sys
import wave
import subprocess

ROT = os.path.dirname(os.path.abspath(__file__))
KJELDE = os.path.join(ROT, '_kjelder', 'ljodstigen-lyd')
LYD = os.path.join(ROT, 'ljodstigen', 'lyd')
MANIFEST = os.path.join(LYD, 'manifest.json')
STEMMER = os.path.join(LYD, 'stemmer.json')
STANDARD_STEMME = 'vyrde-20261014'

BANKS = ('fonem', 'namn', 'ord', 'ros', 'lydgrupper', 'setningar')

LEAD_MS = 80        # ekstra luft; heile originalen kjem etter henne
TAIL_MS = 140       # ekstra luft etter heile originalen
GAP_MS = 100        # isolerer naboklippa, òg ved MP3-forskyving
HEAD_MS = 100
FADE_MS = 5         # berre i den tilførte stilla
PEAK_CEIL = 0.891   # -1 dBFS
ALIGN = 0.5         # kor langt mot median-RMS vi flyttar (0 = ikkje, 1 = heilt)
BITRATE = 64


# ── WAV inn ──────────────────────────────────────────────────────

def read_wav(path):
    w = wave.open(path, 'rb')
    if w.getsampwidth() != 2:
        raise SystemExit('%s: berre 16-bits WAV er støtta' % path)
    n, fr, ch = w.getnframes(), w.getframerate(), w.getnchannels()
    a = array.array('h')
    a.frombytes(w.readframes(n))
    w.close()
    if ch == 2:                       # mikse ned om nokon leverer stereo
        a = array.array('h', [(a[i] + a[i + 1]) // 2 for i in range(0, len(a) - 1, 2)])
    return a, fr


def rms(a):
    if not len(a):
        return 0.0
    return math.sqrt(sum(v * v for v in a) / len(a)) / 32768.0


def peak(a):
    return (max(abs(v) for v in a) / 32768.0) if len(a) else 0.0


def trim(a, fr):
    """Bakoverkompatibelt namn: bevar ALT, og legg til tryggingsmargin."""
    return silence(fr, LEAD_MS) + a + silence(fr, TAIL_MS)


def fade(a, fr):
    n = min(int(fr * FADE_MS / 1000), len(a) // 2)
    for i in range(n):
        g = i / n
        a[i] = int(a[i] * g)
        a[-1 - i] = int(a[-1 - i] * g)
    return a


def gain(a, g):
    out = array.array('h', bytes(len(a) * 2))
    for i, v in enumerate(a):
        x = int(v * g)
        out[i] = 32767 if x > 32767 else (-32768 if x < -32768 else x)
    return out


def silence(fr, ms):
    return array.array('h', bytes(int(fr * ms / 1000) * 2))


# ── Bygg éin bank ────────────────────────────────────────────────

def kjeldemappe(stemme, bank):
    """Med stemmemappe om ho finst, elles rett under banken."""
    med = os.path.join(KJELDE, stemme, bank)
    if os.path.isdir(med):
        return med
    utan = os.path.join(KJELDE, bank)
    return utan if os.path.isdir(utan) else None


def build(bank, manifest, stemme, verbose=True):
    src = kjeldemappe(stemme, bank)
    if not src:
        return None, 'mappa finst ikkje'

    ids = sorted(manifest.get(bank, {}))
    have = {f[:-4] for f in os.listdir(src) if f.lower().endswith('.wav')}
    missing = [i for i in ids if i not in have]
    extra = sorted(have - set(ids))
    ids = [i for i in ids if i in have]
    if not ids:
        return None, 'ingen wav-filer som står i manifestet'

    clips, rate = [], None
    for cid in ids:
        a, fr = read_wav(os.path.join(src, cid + '.wav'))
        if rate is None:
            rate = fr
        elif fr != rate:
            raise SystemExit('%s har %d Hz, resten har %d Hz' % (cid, fr, rate))
        clips.append([cid, fade(trim(a, fr), fr)])

    # Delvis styrkejamning mot medianen.
    levels = sorted(rms(c[1]) for c in clips)
    median = levels[len(levels) // 2]
    adjusted = 0
    for c in clips:
        r = rms(c[1])
        if r <= 0:
            continue
        g = (median / r) ** ALIGN
        # Aldri over taket: heller for svak enn forvrengd.
        p = peak(c[1])
        if p * g > PEAK_CEIL:
            g = PEAK_CEIL / p
        if abs(20 * math.log10(g)) > 0.3:
            c[1] = gain(c[1], g)
            adjusted += 1

    # Skøyt saman og noter kvar kvart klipp ligg.
    out = silence(rate, HEAD_MS)
    gap = silence(rate, GAP_MS)
    offsets = {}
    for cid, a in clips:
        start = len(out) / rate
        out.extend(a)
        offsets[cid] = [round(start, 4), round(len(a) / rate, 4)]
        out.extend(gap)

    mp3 = encode(out, rate)

    ut = os.path.join(LYD, stemme)
    os.makedirs(ut, exist_ok=True)
    target = os.path.join(ut, bank + '.mp3')
    if os.path.exists(target) and open(target, 'rb').read() != mp3:
        raise SystemExit('Lydmappa er versjonspinna og kan ikkje skrivast over. Bruk --stemme <ny-id> og oppdater stemmer.json.')
    with open(target, 'wb') as f:
        f.write(mp3)
    with open(os.path.join(ut, bank + '.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'app': 'ljodstigen', 'version': 1, 'bank': bank, 'voice': stemme,
                   'rate': rate, 'gapMs': GAP_MS, 'leadMs': LEAD_MS, 'tailMs': TAIL_MS,
                   'preservesSource': True, 'clips': offsets},
                  f, ensure_ascii=False, indent=1)
        f.write('\n')

    if verbose:
        print('  %-6s %2d klipp  %5.1f s  %6.1f kB  (%d justerte i styrke)'
              % (bank, len(clips), len(out) / rate, len(mp3) / 1024, adjusted))
        if missing:
            print('         manglar enno: %s' % ', '.join(missing))
        if extra:
            print('         ligg i mappa men ikkje i manifestet: %s' % ', '.join(extra))
    return len(clips), None


def encode(samples, rate):
    # Same sjølv-hosta kodar som Lydskurd/Ljodbanken; ingen installasjon.
    return subprocess.check_output(
        ['node', os.path.join(ROT, 'bygg_ljodstigen_mp3.cjs'), str(rate)],
        input=samples.tobytes())


def main():
    if not os.path.exists(MANIFEST):
        raise SystemExit('Manifestet manglar. Køyr lag_ljodstigen_lydliste.py først.')
    manifest = json.load(open(MANIFEST, encoding='utf-8'))['banks']

    args = sys.argv[1:]
    stemme = STANDARD_STEMME
    if '--stemme' in args:
        i = args.index('--stemme')
        if i + 1 >= len(args):
            raise SystemExit('--stemme treng eit namn, t.d. --stemme kjellove')
        stemme = args[i + 1]
        del args[i:i + 2]

    want = args or BANKS
    print('Byggjer stemma «%s»' % stemme)
    total = 0
    for bank in want:
        if bank not in BANKS:
            print('  ukjend bank: %s' % bank)
            continue
        n, err = build(bank, manifest, stemme)
        if err:
            print('  %-6s hoppa over — %s' % (bank, err))
        else:
            total += n
    print('%d klipp bygde til ljodstigen/lyd/%s/' % (total, stemme))
    varsle_om_registeret(stemme)


def varsle_om_registeret(stemme):
    """Ei stemme som ikkje står i stemmer.json blir aldri vist i appen."""
    try:
        reg = json.load(open(STEMMER, encoding='utf-8'))
    except Exception:
        print('  MERK: lyd/stemmer.json finst ikkje, appen finn ingen stemmer.')
        return
    if not any(v.get('id') == stemme for v in reg.get('voices', [])):
        print('  MERK: «%s» står ikkje i lyd/stemmer.json og blir ikkje'
              ' vald i appen før han er ført opp der.' % stemme)


if __name__ == '__main__':
    main()
