import { MoonlitSceneRuntime } from './MoonlitSceneRuntime';
import { ProceduralSceneRuntime } from './ProceduralSceneRuntime';
export { MoonlitSceneRuntime } from './MoonlitSceneRuntime';
export type { SceneRuntimeOptions } from './MoonlitSceneRuntime';

type Runtime = MoonlitSceneRuntime | ProceduralSceneRuntime;
type RuntimeOptions = Omit<import('./MoonlitSceneRuntime').SceneRuntimeOptions, 'canvas'>;

const sceneMode = import.meta.env.VITE_SCENE_MODE === 'procedural' ? 'procedural' : 'glb';

export const createMoonlitWorld = (canvas: HTMLCanvasElement, options: RuntimeOptions = {}): Runtime => {
  const RuntimeClass = sceneMode === 'procedural' ? ProceduralSceneRuntime : MoonlitSceneRuntime;
  return new RuntimeClass({ canvas, ...options });
};
export const updateMoonlitWorld = (runtime: Runtime, progress: number) => runtime.setProgress(progress);
export const disposeMoonlitWorld = (runtime: Runtime) => runtime.dispose();
