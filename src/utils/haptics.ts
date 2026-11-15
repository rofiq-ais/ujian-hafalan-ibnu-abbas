/**
 * Haptic Feedback utility using Web Vibration API (navigator.vibrate)
 * Memberikan respon sentuhan getar halus pada smartphone / touchscreen
 * saat asatidz menyimak dan menginput nilai ujian hafalan.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        // Getaran sangat halus (15ms) untuk SK, Tahsin, tombol navigasi
        navigator.vibrate(15);
        break;
      case 'medium':
        // Getaran terasa (35ms) untuk Salah Besar (SB)
        navigator.vibrate(35);
        break;
      case 'heavy':
        // Getaran tegas (55ms) untuk reset/hapus
        navigator.vibrate(55);
        break;
      case 'success':
        // Ritme ganda sukses [25ms, jeda 40ms, 30ms] untuk simpan cicilan / final
        navigator.vibrate([25, 40, 30]);
        break;
      case 'warning':
        // Ritme peringatan [40ms, jeda 50ms, 40ms]
        navigator.vibrate([40, 50, 40]);
        break;
      case 'error':
        // Ritme kesalahan [60ms, jeda 40ms, 60ms]
        navigator.vibrate([60, 40, 60]);
        break;
    }
  } catch {
    // Abaikan jika browser membatasi Web Vibration API
  }
}
