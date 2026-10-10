(function (root) {
  'use strict';
  function create(context) {
    const master = context.createGain(), music = context.createGain(), effects = context.createGain();
    const compressor = context.createDynamicsCompressor(), highpass = context.createBiquadFilter();
    compressor.threshold.value = -18; compressor.knee.value = 14; compressor.ratio.value = 3;
    compressor.attack.value = .008; compressor.release.value = .2;
    highpass.type = 'highpass'; highpass.frequency.value = 45;
    // Eigen deterministisk stereoimpuls: tidlege refleksjonar og mjuk hallhale.
    const reverb = context.createConvolver(), length = Math.ceil(context.sampleRate * 1.65);
    const impulse = context.createBuffer(2, length, context.sampleRate), random = Vy.rng(197041);
    for (let channel = 0; channel < 2; channel++) {
      const values = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) values[i] = (random() * 2 - 1) * Math.exp(-7 * i / length) * .11;
      [.031, .047, .071, .113].forEach((delay, i) => { values[Math.floor((delay + channel * .007) * context.sampleRate)] += .55 / (i + 1); });
    }
    reverb.buffer = impulse;
    const wet = context.createGain(); wet.gain.value = .19;
    music.connect(compressor); effects.connect(compressor); music.connect(reverb); effects.connect(reverb); reverb.connect(wet); wet.connect(compressor);
    compressor.connect(highpass); highpass.connect(master); master.connect(context.destination);
    master.gain.value = .68; music.gain.value = .65; effects.gain.value = .8;
    return { master, music, effects, instruments: root.Fykefuga.Instruments.create(context, music, effects) };
  }
  root.Fykefuga.Mixer = { create };
})(window);
