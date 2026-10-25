/**
 * Audio Alarm Utility using Web Audio API
 * Generates an alarm alert sound sequence when a task or operational checkpoint is marked Completed.
 */
export const playAlarmSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime;

    // Distinct multi-frequency alarm alert pattern (alternating emergency chime: 980Hz - 1320Hz - 980Hz - 1320Hz - 1568Hz)
    const alarmBeeps = [
      { f: 980, t: 0.0, d: 0.12 },
      { f: 1320, t: 0.14, d: 0.14 },
      { f: 980, t: 0.32, d: 0.12 },
      { f: 1320, t: 0.46, d: 0.14 },
      { f: 1568, t: 0.64, d: 0.28 },
    ];

    alarmBeeps.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startTime + t);

      gain.gain.setValueAtTime(0, startTime + t);
      gain.gain.linearRampToValueAtTime(0.35, startTime + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + t);
      osc.stop(startTime + t + d);
    });
  } catch (err) {
    console.warn('Audio alert not supported or blocked by browser policy:', err);
  }
};
