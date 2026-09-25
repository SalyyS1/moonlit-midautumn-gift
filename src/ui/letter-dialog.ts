import { letter } from '../content';
import { must } from './dom';

export class LetterDialog {
  private readonly backdrop = must<HTMLDivElement>('#letter-backdrop');
  private readonly closeButton = must<HTMLButtonElement>('#letter-close');
  private trigger: HTMLElement | null = null;
  private background: { element: HTMLElement; inert: boolean }[] = [];

  constructor(private readonly fallbackFocus: () => HTMLElement, onConfirm: () => void) {
    must<HTMLElement>('#letter-title').textContent = `Gửi ${letter.recipient}`;
    must<HTMLElement>('.letter-sign').textContent = `— ${letter.sender}`;
    const body = must<HTMLElement>('.letter-body');
    body.replaceChildren(...letter.paragraphs.map((text) => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
    const staticTitle = must<HTMLElement>('#static-letter-title');
    staticTitle.textContent = `Gửi ${letter.recipient}`;
    must<HTMLElement>('.static-letter-content').replaceChildren(staticTitle, ...[...letter.paragraphs, `— ${letter.sender}`].map((text) => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
    this.closeButton.addEventListener('click', () => this.close());
    must<HTMLButtonElement>('#letter-action').addEventListener('click', () => { this.close(); onConfirm(); });
    this.backdrop.addEventListener('click', (event) => { if (event.target === this.backdrop) this.close(); });
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('focusin', this.onFocusIn);
  }

  get isOpen(): boolean { return !this.backdrop.hidden; }

  open(trigger: HTMLElement): void {
    if (this.isOpen) return;
    this.trigger = trigger;
    this.backdrop.hidden = false;
    document.body.classList.add('modal-open');
    this.closeButton.focus({ preventScroll: true });
    // Isolate every branch outside the dialog, including the fixed header and skip link.
    let branch: HTMLElement = this.backdrop;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch && !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(sibling.tagName)) {
          this.background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.backdrop.hidden = true;
    document.body.classList.remove('modal-open');
    this.background.forEach(({ element, inert }) => { element.inert = inert; });
    this.background = [];
    // The animated copy can replace its trigger while the letter is open.
    const replacement = this.trigger?.id ? document.getElementById(this.trigger.id) : null;
    // Prefer the current semantic fallback. When the OS toggles reduced
    // motion while this dialog is open, the animated trigger can still be
    // connected but no longer represents the active reading surface.
    const fallback = this.fallbackFocus();
    const target = this.canRestoreFocus(fallback) ? fallback : this.canFocus(this.trigger) ? this.trigger : replacement;
    target?.focus({ preventScroll: true });
    // Restoring inert branches can cause a browser focus update at the end of
    // the key event. Re-assert the semantic target in the next microtask so a
    // motion-mode change cannot leave focus on <body>.
    if (target) queueMicrotask(() => {
      if (document.activeElement !== target && this.canRestoreFocus(target)) target.focus({ preventScroll: true });
    });
    this.trigger = null;
  }

  private canFocus(element: HTMLElement | null): boolean {
    return Boolean(element?.isConnected && !element.closest('[inert], [hidden]') && element.getClientRects().length);
  }

  private canRestoreFocus(element: HTMLElement | null): boolean {
    return Boolean(element?.isConnected && !element.matches(':disabled') && !element.closest('[inert], [hidden]'));
  }

  private readonly onFocusIn = (event: FocusEvent): void => {
    if (this.isOpen && event.target instanceof Node && !this.backdrop.contains(event.target)) this.closeButton.focus({ preventScroll: true });
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key !== 'Tab') return;
    const items = Array.from(this.backdrop.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.matches(':disabled') && this.canFocus(element));
    const first = items[0]; const last = items[items.length - 1];
    if (!first || !last) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  dispose(): void {
    this.close();
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('focusin', this.onFocusIn);
  }
}
