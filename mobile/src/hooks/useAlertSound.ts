import { useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Plays a 3-beep alert tone.
 * Native: expo-av with alert.wav (bypasses iOS silent switch)
 * Web:    Web Audio API oscillator synthesis (no file needed)
 */
export function useAlertSound() {
  // Request audio permissions on mount (Android requires this)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    }).catch((e) => console.warn('[AlertSound] setAudioMode failed:', e));
  }, []);

  // Web Audio API synthesis
  const playWebBeep = useCallback(() => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) { console.warn('[AlertSound] Web Audio not supported'); return; }
      const ctx = new AudioCtx() as AudioContext;

      const beep = (t: number, freq: number, dur: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
        gain.gain.setValueAtTime(0.8, t + dur - 0.03);
        gain.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t);
        osc.stop(t + dur);
      };

      const now = ctx.currentTime;
      beep(now,        880,  0.18);
      beep(now + 0.26, 880,  0.18);
      beep(now + 0.52, 1100, 0.32);
    } catch (e) {
      console.warn('[AlertSound] Web beep failed:', e);
    }
  }, []);

  // Native — create a fresh Sound instance each time (most reliable approach)
  const playNativeSound = useCallback(async () => {
    let sound: Audio.Sound | null = null;
    try {
      const result = await Audio.Sound.createAsync(
        require('../assets/alert.wav'),
        { shouldPlay: true, volume: 1.0, isLooping: false },
      );
      sound = result.sound;
      // Unload after playback completes to free memory
      result.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          result.sound.unloadAsync().catch(() => {});
        }
      });
    } catch (e) {
      console.warn('[AlertSound] Native playback failed:', e);
      sound?.unloadAsync().catch(() => {});
    }
  }, []);

  const playAlertSound = useCallback(() => {
    if (Platform.OS === 'web') {
      playWebBeep();
    } else {
      playNativeSound();
    }
  }, [playWebBeep, playNativeSound]);

  return { playAlertSound };
}
