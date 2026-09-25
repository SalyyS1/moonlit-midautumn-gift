import { chapters } from './content';
import { createMoonlitWorld, updateMoonlitWorld, disposeMoonlitWorld } from './scene';
import { readProgress, ScrollController, clampProgress } from './scene/ScrollController';
import { LetterDialog } from './ui/letter-dialog';
import { StoryOverlay, activeChapter } from './ui/story-overlay';
import { StoryAudio } from './ui/story-audio';
import { ViewModeControls } from './ui/view-mode-controls';
import { must } from './ui/dom';

type Runtime = ReturnType<typeof createMoonlitWorld>;
const canvas = must<HTMLCanvasElement>('#moon-canvas');
const poster = must<HTMLImageElement>('#scene-poster');
const fallback = must<HTMLDivElement>('#webgl-fallback');
const story = must<HTMLElement>('#story');
const staticStory = must<HTMLElement>('#static-story');
const status = must<HTMLDivElement>('#world-status');
const statusText = must<HTMLSpanElement>('#world-status-text');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let world: Runtime | null = null;
let worldFailed = false;
let readable = true;
let requestedReadable = location.hash.startsWith('#static-');
// An explicit in-page choice overrides the OS default for this URL, including reloads.
let cinematicRequested = !requestedReadable && new URLSearchParams(location.search).get('view') === '3d';
let targetProgress = 0;
let pageActive = true;
let automaticLetterShown = false;

const dialog = new LetterDialog(
  () => readable ? must<HTMLButtonElement>('#static-letter-button') : document.querySelector<HTMLButtonElement>('#open-letter') ?? story,
  () => overlay.jumpTo(chapters.length - 1),
);
const audio = new StoryAudio(must<HTMLButtonElement>('#sound-button'), () => activeChapter(overlay.progress));
const overlay = new StoryOverlay({
  openLetter: (trigger) => dialog.open(trigger),
  onChapter: (index) => audio.playTone(index),
  isReadable: () => readable,
  reducedMotion: () => prefersReducedMotion.matches,
});
const viewMode = new ViewModeControls(enterCinematic, enterReading);

function enterCinematic(): void {
  requestedReadable = false;
  cinematicRequested = true;
  worldFailed = false;
  automaticLetterShown = false;
  const url = new URL(location.href);
  url.searchParams.set('view', '3d'); url.hash = 'story';
  history.replaceState(null, '', url);
  window.scrollTo({ top: 0, behavior: 'instant' });
  bootWorld();
  story.focus({ preventScroll: true });
}

function enterReading(focus = true): void {
  requestedReadable = true;
  cinematicRequested = false;
  const url = new URL(location.href);
  url.searchParams.delete('view'); url.hash = 'static-story';
  history.replaceState(null, '', url);
  showReadable('requested', focus);
}

function stopWorld(): void {
  const previous = world;
  world = null;
  if (previous) disposeMoonlitWorld(previous);
}

function showReadable(reason: 'reduced' | 'error' | 'requested', focus = false): void {
  readable = true;
  stopWorld();
  canvas.hidden = true;
  poster.hidden = false;
  status.hidden = true;
  viewMode.showReadable(reason);
  document.body.classList.add('is-readable');
  staticStory.classList.remove('is-sr-only');
  const staticLetterButton = must<HTMLButtonElement>('#static-letter-button');
  staticLetterButton.tabIndex = 0;
  if (focus) {
    staticStory.scrollIntoView({ behavior: 'auto', block: 'start' });
    staticStory.focus({ preventScroll: true });
  }
}

function setStatus(message: string, progress?: number): void {
  if (readable || !pageActive) return;
  status.hidden = false;
  statusText.textContent = message;
  if (typeof progress === 'number') status.style.setProperty('--loading-progress', String(clampProgress(progress)));
}

function onScroll(): void {
  if (readable || !pageActive) return;
  targetProgress = readProgress(window);
  if (world) updateMoonlitWorld(world, targetProgress);
  else overlay.paint(targetProgress);
}

function bootWorld(): void {
  if (!pageActive || (prefersReducedMotion.matches && !cinematicRequested) || world || worldFailed || requestedReadable) return;
  readable = false;
  canvas.hidden = false;
  poster.hidden = false;
  fallback.hidden = true;
  staticStory.classList.add('is-sr-only');
  must<HTMLButtonElement>('#static-letter-button').tabIndex = -1;
  document.body.classList.remove('is-readable');
  viewMode.showCinematic(true);
  try {
    setStatus('Đang mở cung trăng…');
    const created = createMoonlitWorld(canvas, { reducedMotion: false });
    // A synchronous error event may already have switched the page to reading.
    if (readable || worldFailed) disposeMoonlitWorld(created);
    else { world = created; onScroll(); }
  } catch (error) {
    console.warn('WebGL unavailable; using the semantic story fallback.', error);
    worldFailed = true;
    showReadable('error');
  }
}

canvas.addEventListener('world-loading', (event) => {
  const { loaded = 0, total = 0 } = (event as CustomEvent<{ loaded?: number; total?: number }>).detail ?? {};
  setStatus(total ? `Đang dựng cung trăng · ${Math.round(clampProgress(loaded / total) * 100)}%` : 'Đang dựng cung trăng…', total ? loaded / total : undefined);
});
canvas.addEventListener('world-ready', () => {
  if (readable || !pageActive) return;
  status.hidden = true;
  poster.hidden = true;
  viewMode.showCinematic();
});
canvas.addEventListener('world-progress', (event) => {
  if (readable || !pageActive || !world) return;
  const detail = (event as CustomEvent<{ progress?: number; beatId?: string }>).detail ?? {};
  if (typeof detail.progress === 'number' && detail.progress < .82) automaticLetterShown = false;
  overlay.paint(detail.progress ?? targetProgress);
});
canvas.addEventListener('letter-reveal', () => {
  if (readable || !pageActive || automaticLetterShown) return;
  automaticLetterShown = true;
  overlay.revealLetter();
  // Keep the accessible modal as the same reading surface used by the
  // explicit button, but make the cinematic path discover it automatically.
  const trigger = document.querySelector<HTMLElement>('#open-letter') ?? story;
  window.setTimeout(() => {
    if (!readable && pageActive && !dialog.isOpen) dialog.open(trigger);
  }, 0);
});
canvas.addEventListener('world-error', (event) => {
  if (readable || !pageActive) return;
  const detail = (event as CustomEvent<{ message?: string }>).detail ?? {};
  console.warn(detail.message ?? '3D world failed to load.');
  worldFailed = true;
  showReadable('error');
});

must<HTMLAnchorElement>('#skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  enterReading();
});
must<HTMLAnchorElement>('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  if (readable) {
    staticStory.scrollIntoView({ behavior: 'auto', block: 'start' });
    staticStory.focus({ preventScroll: true });
  } else {
    overlay.jumpTo(0);
    story.focus({ preventScroll: true });
  }
  history.replaceState(null, '', readable ? '#static-story' : '#story');
});

// A screen-reader user can enter the semantic story without traversing the 3D UI.
staticStory.addEventListener('focusin', () => {
  if (!readable) enterReading(false);
});
document.addEventListener('keydown', (event) => {
  if (readable || dialog.isOpen || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, summary, [contenteditable], [role="button"]')) return;
  const direction = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 0;
  if (!direction) return;
  event.preventDefault();
  overlay.jumpTo(activeChapter(overlay.progress) + direction);
});

function syncMotionMode(): void {
  if (requestedReadable) showReadable('requested');
  else if (prefersReducedMotion.matches && !cinematicRequested) showReadable('reduced');
  else if (!worldFailed) bootWorld();
}
prefersReducedMotion.addEventListener('change', syncMotionMode);
const scrollController = new ScrollController(window, onScroll);
document.body.classList.add('has-js');
overlay.paint(0);
syncMotionMode();
scrollController.start();
window.addEventListener('pagehide', (event) => {
  pageActive = false;
  scrollController.dispose();
  stopWorld();
  if (event.persisted) audio.suspendForPageHide();
  else { overlay.dispose(); dialog.dispose(); audio.dispose(); }
});
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  pageActive = true;
  syncMotionMode();
  scrollController.start();
});
