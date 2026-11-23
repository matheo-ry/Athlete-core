import { vibrate } from '@/core/native';

// El aviso con la app abierta: un pitido corto y una vibración (D-123). Con la
// pantalla apagada o en otra app, el aviso es la notificación del móvil.

let audio: AudioContext | null = null;

function beep(): void {
  try {
    audio ??= new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.4);
  } catch {
    // Sin audio disponible (algunos navegadores y los tests): el aviso sigue
    // por la vibración y la notificación.
  }
}

export function ringRestAlarm(options: { sound: boolean; vibration: boolean }): void {
  if (options.sound) {
    beep();
  }
  if (options.vibration) {
    void vibrate();
  }
}
