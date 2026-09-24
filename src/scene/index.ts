import { MoonlitSceneRuntime } from './MoonlitSceneRuntime';
export { MoonlitSceneRuntime } from './MoonlitSceneRuntime';
export type { SceneRuntimeOptions } from './MoonlitSceneRuntime';

export const createMoonlitWorld = (canvas: HTMLCanvasElement, options: Omit<import('./MoonlitSceneRuntime').SceneRuntimeOptions, 'canvas'> = {}) => new MoonlitSceneRuntime({ canvas, ...options });
export const updateMoonlitWorld = (runtime: MoonlitSceneRuntime, progress: number) => runtime.setProgress(progress);
export const disposeMoonlitWorld = (runtime: MoonlitSceneRuntime) => runtime.dispose();
