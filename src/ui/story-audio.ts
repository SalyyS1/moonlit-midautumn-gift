export class StoryAudio {
  private context: AudioContext | null = null;
  private busy = false;
  private revision = 0;

  constructor(private readonly button: HTMLButtonElement, private readonly chapter: () => number) {
    button.hidden = false;
    button.addEventListener('click', () => void this.toggle());
  }

  playTone(index: number): void {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = [392, 440, 523, 659, 523, 392][index] ?? 392;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.035, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .48);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now); oscillator.stop(now + .5);
  }

  private async toggle(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const revision = ++this.revision;
    try {
      if (!this.context) this.context = new AudioContext();
      const enabled = this.button.getAttribute('aria-pressed') !== 'true';
      if (enabled) await this.context.resume(); else await this.context.suspend();
      if (revision !== this.revision) return;
      this.button.setAttribute('aria-pressed', String(enabled));
      this.button.textContent = enabled ? 'Âm thanh bật' : 'Âm thanh tắt';
      if (enabled) this.playTone(this.chapter());
    } catch (error) {
      console.warn('Audio is unavailable; the story remains silent.', error);
      this.button.setAttribute('aria-pressed', 'false');
      this.button.textContent = 'Âm thanh không khả dụng';
    } finally { this.busy = false; }
  }

  suspendForPageHide(): void {
    ++this.revision;
    this.button.setAttribute('aria-pressed', 'false');
    this.button.textContent = 'Âm thanh tắt';
    if (this.context && this.context.state !== 'closed') {
      void this.context.suspend().catch((error) => console.warn('Audio could not be suspended.', error));
    }
  }

  dispose(): void {
    ++this.revision;
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
  }
}
