export type ReadableReason = 'reduced' | 'error' | 'requested';

const readableMessages: Record<ReadableReason, string> = {
  reduced: 'Thiết bị đang bật giảm chuyển động nên câu chuyện mở ở chế độ đọc. Em có thể bật 3D bên dưới, rồi cuộn để bay vào đêm trăng.',
  error: 'Trải nghiệm 3D chưa mở được. Em có thể thử lại, hoặc đọc trọn câu chuyện bên dưới.',
  requested: 'Em đang ở chế độ đọc. Khi muốn tiếp tục chuyến bay, hãy bật 3D rồi cuộn để đi qua từng khung cảnh.',
};

/** Keep the motion preference visible and reversible without changing device settings. */
export class ViewModeControls {
  private readable = true;
  private readonly header = document.querySelector<HTMLButtonElement>('#view-mode-button')!;
  private readonly enter = document.querySelector<HTMLButtonElement>('#enter-3d-button')!;
  private readonly panel = document.querySelector<HTMLElement>('#webgl-fallback')!;
  private readonly message = document.querySelector<HTMLElement>('#view-mode-message')!;
  private readonly story = document.querySelector<HTMLElement>('#static-story')!;

  constructor(onEnter3D: () => void, onRead: () => void) {
    // The methods below reveal controls only after their correct initial state is known.
    this.header.addEventListener('click', () => this.readable ? onEnter3D() : onRead());
    this.enter.addEventListener('click', onEnter3D);
  }

  showReadable(reason: ReadableReason): void {
    this.readable = true;
    this.header.textContent = reason === 'error' ? 'Thử lại 3D' : 'Bật 3D';
    this.header.title = 'Bật trải nghiệm 3D và cuộn để khám phá';
    this.header.hidden = false;
    this.message.textContent = readableMessages[reason];
    this.panel.hidden = false;
    this.enter.hidden = false;
    this.story.classList.add('has-view-mode-choice');
  }

  showCinematic(loading = false): void {
    this.readable = false;
    this.header.textContent = 'Chế độ đọc';
    this.header.title = loading ? 'Chuyển sang chế độ đọc trong khi 3D đang tải' : 'Đọc câu chuyện không có chuyển động';
    this.header.hidden = false;
    this.panel.hidden = true;
    this.enter.hidden = true;
    this.story.classList.remove('has-view-mode-choice');
  }
}
