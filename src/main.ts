import './styles.css';
import { chapters } from './content';
import { createMoonlitWorld, updateMoonlitWorld, disposeMoonlitWorld } from './scene';

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Không tìm thấy ${selector}.`);
  return element;
}
const canvas = must<HTMLCanvasElement>('#moon-canvas');
const track = must<HTMLDivElement>('#story-track');
const copy = must<HTMLDivElement>('#chapter-copy');
const nav = must<HTMLElement>('#chapter-nav');
const readout = must<HTMLSpanElement>('#progress-readout');
const cue = must<HTMLDivElement>('#scroll-cue');
const soundButton = must<HTMLButtonElement>('#sound-button');
const letterBackdrop = must<HTMLDivElement>('#letter-backdrop');
const letterClose = must<HTMLButtonElement>('#letter-close');
const letterAction = must<HTMLButtonElement>('#letter-action');
const fallback = must<HTMLDivElement>('#webgl-fallback');
const story = must<HTMLElement>('#story');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let world: ReturnType<typeof createMoonlitWorld> | null = null;
try {
  world = createMoonlitWorld(canvas, { reducedMotion: prefersReducedMotion.matches });
} catch (error) {
  console.warn('WebGL unavailable; using the semantic story fallback.', error);
  canvas.hidden = true;
  fallback.hidden = false;
  document.body.classList.add('no-webgl');
}
let lastChapter = -1;
let audioContext: AudioContext | null = null;
let lastTrigger: HTMLElement | null = null;

track.style.height = `${chapters.length * 110}vh`;

chapters.forEach((chapter, index) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'chapter-dot';
  item.dataset.chapter = String(index);
  item.setAttribute('aria-label', `Đi tới chương ${index + 1}: ${chapter.label}`);
  item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><i></i>`;
  item.addEventListener('click', () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: maxScroll * ((index + 0.5) / chapters.length), behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
  });
  nav.appendChild(item);
});

function clamp(value: number, min = 0, max = 1): number { return Math.min(max, Math.max(min, value)); }

function getProgress(): number {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return clamp(window.scrollY / maxScroll);
}

function activeChapter(progress: number): number {
  return Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
}

function paintCopy(progress: number): void {
  const chapterIndex = activeChapter(progress);
  const chapter = chapters[chapterIndex];
  const chapterStart = chapterIndex / chapters.length;
  const local = clamp((progress - chapterStart) * chapters.length);
  const opacity = chapterIndex === 0
    ? clamp(1 - local * 1.6, 0.45, 1)
    : chapterIndex === chapters.length - 1
      ? clamp(local * 2, 0.45, 1)
      : clamp(1 - Math.abs(local - 0.5) * 2.5, 0.45, 1);
  copy.style.setProperty('--copy-opacity', String(opacity));
  copy.style.setProperty('--copy-y', `${(0.5 - local) * 12}px`);
  const chapterChanged = chapterIndex !== lastChapter;
  if (chapterChanged) {
    copy.innerHTML = `
      <span class="chapter-number">${String(chapterIndex + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}</span>
      <span class="chapter-eyebrow" style="--chapter-accent:${chapter.accent}">${chapter.eyebrow}</span>
      <h1>${chapter.title}</h1>
      <p>${chapter.body}</p>
      <div class="copy-rule" style="--chapter-accent:${chapter.accent}"></div>
      ${chapterIndex === chapters.length - 1 ? '<button class="open-letter" id="open-letter" type="button">Mở lá thư <span>↗</span></button>' : ''}
    `;
    readout.textContent = `${String(chapterIndex + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    nav.querySelectorAll<HTMLButtonElement>('.chapter-dot').forEach((dot, index) => dot.classList.toggle('is-active', index === chapterIndex));
    cue.querySelector('span')!.textContent = chapter.hint;
    if (chapterIndex === chapters.length - 1) {
      document.querySelector<HTMLButtonElement>('#open-letter')?.addEventListener('click', (event) => {
        lastTrigger = event.currentTarget as HTMLElement;
        letterBackdrop.hidden = false;
        story.setAttribute('aria-hidden', 'true');
        letterClose.focus();
      });
    }
    playTone(chapterIndex);
    lastChapter = chapterIndex;
  }
  cue.classList.toggle('is-hidden', progress > 0.035);
}

function frame(): void {
  const progress = getProgress();
  if (world) updateMoonlitWorld(world, progress);
  paintCopy(progress);
  requestAnimationFrame(frame);
}

function playTone(index: number): void {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = [392, 440, 523, 659, 523, 392][index];
  oscillator.type = 'sine';
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);
}

soundButton.addEventListener('click', async () => {
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();
    const enabled = soundButton.getAttribute('aria-pressed') !== 'true';
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.textContent = enabled ? 'Âm thanh bật' : 'Âm thanh tắt';
    if (!enabled) { await audioContext.suspend(); return; }
    playTone(activeChapter(getProgress()));
  } catch (error) {
    console.warn('Audio is unavailable; the story remains silent.', error);
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.textContent = 'Âm thanh không khả dụng';
  }
});

function closeLetter(): void {
  letterBackdrop.hidden = true;
  story.removeAttribute('aria-hidden');
  lastTrigger?.focus();
}
letterClose.addEventListener('click', closeLetter);
letterAction.addEventListener('click', () => { closeLetter(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); });
letterBackdrop.addEventListener('click', (event) => { if (event.target === letterBackdrop) closeLetter(); });
document.addEventListener('keydown', (event) => {
  if (letterBackdrop.hidden) return;
  if (event.key === 'Escape') { closeLetter(); return; }
  if (event.key !== 'Tab') return;
  const focusable = Array.from(letterBackdrop.querySelectorAll<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute('disabled'));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

window.addEventListener('beforeunload', () => { if (world) disposeMoonlitWorld(world); audioContext?.close(); });
paintCopy(0);
frame();
