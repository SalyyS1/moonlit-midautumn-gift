export type ScrollProgressSource = Pick<Window, 'scrollY' | 'innerHeight' | 'addEventListener' | 'removeEventListener'> & {
  document: Document;
};

export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function readProgress(source: ScrollProgressSource): number {
  const maxScroll = Math.max(1, source.document.documentElement.scrollHeight - source.innerHeight);
  return clampProgress(source.scrollY / maxScroll);
}

export class ScrollController {
  private readonly onScroll = () => this.onChange(readProgress(this.source));

  constructor(
    private readonly source: ScrollProgressSource,
    private readonly onChange: (progress: number) => void,
  ) {}

  start() {
    this.source.addEventListener('scroll', this.onScroll, { passive: true });
    this.source.addEventListener('resize', this.onScroll);
    this.onChange(readProgress(this.source));
  }

  dispose() {
    this.source.removeEventListener('scroll', this.onScroll);
    this.source.removeEventListener('resize', this.onScroll);
  }
}
