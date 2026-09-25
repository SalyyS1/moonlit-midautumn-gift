import { Vector3 } from 'three';
import type { CameraBeat, CameraKnot } from './types';

const knot = (at: number, p: number[], t: number[], fov: number): CameraKnot => ({ at, position: new Vector3(...p), target: new Vector3(...t), fov });

// Exported Blender coordinates: +Y up, corridor toward -Z. The last camera
// remains in front of the envelope at z=-100 rather than flying past it.
const beat = (id: string, chapterId: string, at: number, pod: string, p: number[], t: number[], fov: number, caption: string, clip?: string, hold?: number): CameraBeat => ({
  id, chapterId, at, pod, caption, clip, hold, position: new Vector3(...p), target: new Vector3(...t), fov,
});

/**
 * Camera beats are deliberately inside the measured pod corridor. They add
 * holds for authored actions without changing the six public chapter IDs.
 * Optional clips can be absent while an art slice is still being built.
 */
export const CAMERA_BEATS: readonly CameraBeat[] = [
  beat('moon-arrival', 'moon', 0, 'pod_moon_approach', [0, 11, 35], [0, 12, 8], 48, 'trăng mở cửa đêm thu'),
  beat('gate-glow', 'gate', .14, 'pod_lunar_gate', [-4, 5, 6], [0, 5, -10], 48, 'cánh cửa cung trăng'),
  beat('cuoi-seat', 'cuoi-hang', .28, 'pod_cuoi_hang', [.2, 2.8, -20], [0, 2.8, -34], 48, 'Cuội ngồi bên gốc đa', 'CUOI_SeatIdle', .55),
  beat('rabbit-pounding', 'cuoi-hang', .34, 'pod_cuoi_hang', [-3.5, 3.2, -24], [-1.8, 2, -34], 50, 'thỏ con giã bánh giầy', 'THO_RabbitA_Pound', .55),
  beat('hang-dance', 'cuoi-hang', .43, 'pod_cuoi_hang', [-2.5, 3.1, -26], [-1.8, 1.9, -34], 52, 'Chị Hằng múa dải lụa', 'HANG_Dance', .6),
  beat('lantern-entrance', 'lanterns', .50, 'pod_lantern_street', [-1.5, 3.1, -31], [-.8, 2, -34], 52, 'rước đèn cùng nhau'),
  beat('fire-hold', 'lanterns', .56, 'pod_lantern_street', [.4, 3, -37], [0, 2.8, -55], 50, 'lửa hồng và đèn lồng lập lòe', 'FIRE_Flame_0_Flicker', .5),
  beat('lan-dance', 'lanterns', .63, 'pod_lantern_street', [-.4, 3.1, -49], [0, 2.8, -63], 49, 'lân sư rộn ràng', 'LAN_Dance', .6),
  beat('lantern-exit', 'lanterns', .68, 'pod_lantern_street', [.3, 3.2, -62], [0, 3.1, -77], 48, 'đèn đưa ta qua cầu'),
  beat('memory-approach', 'memories', .72, 'pod_memories', [.3, 3.2, -62], [0, 3.1, -77], 48, 'những điều anh muốn giữ lại'),
  beat('memory-hold', 'memories', .78, 'pod_memories', [.5, 3, -72], [0, 2.8, -79], 47, 'mỗi ánh đèn là một kỷ niệm'),
  beat('letter-rise', 'letter', .86, 'pod_letter_stage', [1.6, 3.3, -82], [0, 2.9, -100], 48, 'phong thư bước ra từ ánh trăng', 'LetterRise'),
  beat('letter-open', 'letter', .93, 'pod_letter_stage', [1.1, 3.4, -87], [0, 2.8, -100], 46, 'lời hẹn dưới trăng', 'LetterOpen', .8),
  beat('letter-rest', 'letter', 1, 'pod_letter_stage', [.3, 3.4, -94], [0, 2.8, -100], 43, 'lời hẹn dưới trăng'),
];

export const CAMERA_KNOTS: CameraKnot[] = CAMERA_BEATS.map(({ at, position, target, fov, roll }) => ({ at, position, target, fov, roll }));
