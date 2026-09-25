import { beatCopy, chapters } from '../content';
import { worldBeats, worldManifest } from '../scene/manifest';
import { clampProgress } from '../scene/ScrollController';
import { escapeHtml, must } from './dom';

// Resolve markers by id so camera timing and copy cannot silently diverge.
const starts = chapters.map((chapter) => {
  const marker = worldManifest.timeline.find((item) => item.id === chapter.id);
  if (!marker) throw new Error(`Thiếu mốc câu chuyện: ${chapter.id}`);
  return marker.at;
});

const beats = worldBeats.length ? worldBeats : chapters.map((chapter, at) => ({ id: chapter.id, chapterId: chapter.id, at: at / Math.max(1, chapters.length - 1), caption: '' }));
const beatCaption = (index: number): BeatCaption => {
  const beat = beats[index] ?? beats[0];
  const authored = beatCopy.find(copy => copy.id === beat?.id);
  return { label: authored?.label ?? beat?.caption ?? '', detail: authored?.detail ?? '' };
};
type BeatCaption = { label: string; detail: string };
export const LETTER_REVEAL_RESET_PROGRESS = .82;
export function shouldResetLetterReveal(progress: number): boolean {
  return clampProgress(progress) < LETTER_REVEAL_RESET_PROGRESS;
}

export function activeBeat(progress: number): number {
  const value = clampProgress(progress);
  let index = 0;
  beats.forEach((beat, candidate) => { if (value >= beat.at) index = candidate; });
  return index;
}

export function activeChapter(progress: number): number {
  let index = 0;
  starts.forEach((start, candidate) => { if (progress >= start) index = candidate; });
  return index;
}

export function chapterTarget(index: number): number {
  const start = starts[index] ?? 0;
  if (index === 0) return 0;
  // Damping approaches its target asymptotically; cross the marker explicitly.
  return Math.min(1, start + Math.min(.006, ((starts[index + 1] ?? 1) - start) / 4));
}

type OverlayOptions = {
  openLetter: (trigger: HTMLElement) => void;
  onChapter: (index: number) => void;
  isReadable: () => boolean;
  reducedMotion: () => boolean;
};

export class StoryOverlay {
  private readonly copy = must<HTMLDivElement>('#chapter-copy');
  private readonly nav = must<HTMLElement>('#chapter-nav');
  private readonly readout = must<HTMLSpanElement>('#progress-readout');
  private readonly cue = must<HTMLDivElement>('#scroll-cue');
  private readonly track = must<HTMLDivElement>('#story-track');
  private copyTimer = 0;
  private lastChapter = -1;
  private lastBeat = -1;
  private letterRevealed = false;
  progress = 0;

  constructor(private readonly options: OverlayOptions) {
    this.track.style.height = `${Math.max(1, chapters.length - 1) * 125 + 100}vh`;
    chapters.forEach((chapter, index) => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'chapter-dot'; item.dataset.chapter = String(index);
      item.setAttribute('aria-label', `Đi tới chương ${index + 1}: ${chapter.label}`);
      item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><i aria-hidden="true"></i>`;
      item.addEventListener('click', () => this.jumpTo(index));
      this.nav.appendChild(item);

      // Enhance existing semantic HTML, which remains complete without scripts.
      const article = must<HTMLElement>(`#static-${chapter.id}`);
      article.style.setProperty('--chapter-accent', chapter.accent);
      article.querySelector('h2')!.textContent = chapter.title;
      article.querySelector('.static-index')!.textContent = `${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')} · ${chapter.eyebrow}`;
      article.querySelector('.static-body')!.textContent = chapter.body;
    });
    const staticLetter = must<HTMLButtonElement>('#static-letter-button');
    staticLetter.hidden = false;
    staticLetter.addEventListener('click', () => options.openLetter(staticLetter));
  }

  jumpTo(index: number): void {
    const boundedIndex = Math.min(chapters.length - 1, Math.max(0, index));
    if (this.options.isReadable()) {
      must<HTMLElement>(`#static-${chapters[boundedIndex].id}`).scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: maxScroll * chapterTarget(boundedIndex), behavior: this.options.reducedMotion() ? 'auto' : 'smooth' });
  }

  paint(progress: number): void {
    this.progress = clampProgress(progress);
    if (shouldResetLetterReveal(this.progress)) this.resetLetterReveal();
    const index = activeChapter(this.progress);
    const local = clampProgress((this.progress - starts[index]) / Math.max(.01, (starts[index + 1] ?? 1) - starts[index]));
    this.copy.style.setProperty('--copy-y', `${(0.5 - local) * 10}px`);
    if (index !== this.lastChapter) this.renderChapter(index);
    this.renderBeat(activeBeat(this.progress));
    this.cue.classList.toggle('is-hidden', this.progress > .035);
  }

  revealLetter(): void {
    this.letterRevealed = true;
    this.copy.classList.add('letter-is-revealed');
    this.copy.querySelector<HTMLElement>('.letter-auto-reveal')?.replaceChildren('Lá thư đã mở · đọc lời nhắn cuối cùng');
  }

  /**
   * Let a reverse scroll replay the envelope beat. The runtime emits progress
   * continuously, so this state must be cleared independently of a chapter
   * change (otherwise the final chapter renders as already opened forever).
   */
  private resetLetterReveal(): void {
    if (!this.letterRevealed) return;
    this.letterRevealed = false;
    this.copy.classList.remove('letter-is-revealed');
    this.copy.querySelector<HTMLElement>('.letter-auto-reveal')?.replaceChildren('Lá thư đang tìm đến…');
  }

  private renderChapter(index: number): void {
    const chapter = chapters[index];
    window.clearTimeout(this.copyTimer);
    const paint = () => {
      this.copy.innerHTML = `
        <span class="chapter-number">${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}</span>
        <span class="chapter-eyebrow">${escapeHtml(chapter.eyebrow)}</span>
        <span class="beat-caption" id="beat-caption" aria-live="polite"></span>
        <h2>${escapeHtml(chapter.title)}</h2><p>${escapeHtml(chapter.body)}</p>
        <div class="copy-rule"></div>
        ${index === chapters.length - 1 ? `<p class="letter-auto-reveal" aria-live="polite">${this.letterRevealed ? 'Lá thư đã mở · đọc lời nhắn cuối cùng' : 'Lá thư đang tìm đến…'}</p><button class="open-letter" id="open-letter" type="button">Mở lá thư <span aria-hidden="true">↗</span></button>` : ''}`;
      this.copy.classList.toggle('has-memories', chapter.id === 'memories');
      this.copy.style.setProperty('--chapter-accent', chapter.accent);
      this.copy.classList.remove('is-changing');
      this.copy.querySelector<HTMLButtonElement>('#open-letter')?.addEventListener('click', (event) => this.options.openLetter(event.currentTarget as HTMLElement));
      this.lastBeat = -1;
      this.renderBeat(activeBeat(this.progress));
    };
    // The final letter chapter is the target of an automatic reveal event. It
    // must be in the DOM before that event opens the dialog, even when the
    // previous chapter is still fading out after a direct seek.
    if (this.lastChapter < 0 || this.options.reducedMotion() || chapter.id === 'letter') paint();
    else {
      this.copy.classList.add('is-changing');
      this.copyTimer = window.setTimeout(paint, 160);
    }
    this.readout.textContent = `${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    this.nav.querySelectorAll<HTMLButtonElement>('.chapter-dot').forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
      if (dotIndex === index) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    const hint = this.cue.querySelector('span');
    if (hint) hint.textContent = chapter.hint;
    this.options.onChapter(index);
    this.lastChapter = index;
  }

  private renderBeat(index: number): void {
    if (index === this.lastBeat) return;
    const target = this.copy.querySelector<HTMLElement>('#beat-caption');
    if (!target) return;
    const caption = beatCaption(index);
    target.textContent = caption.detail ? `${caption.label} · ${caption.detail}` : caption.label;
    this.lastBeat = index;
  }

  dispose(): void { window.clearTimeout(this.copyTimer); }
}
