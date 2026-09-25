import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const content = await readFile(resolve(root, 'src/content.ts'), 'utf8');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const runtime = await readFile(resolve(root, 'src/scene/MoonlitSceneRuntime.ts'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(root, 'public/assets/manifest.json'), 'utf8'));
const requiredIds = ['moon', 'gate', 'cuoi-hang', 'lanterns', 'memories', 'letter'];
for (const id of requiredIds) if (!content.includes(`id: '${id}'`)) throw new Error(`Thiếu chương ${id}`);
if (!html.includes('id="letter-backdrop"')) throw new Error('Thiếu overlay lá thư');
if (!runtime.includes('class MoonlitSceneRuntime')) throw new Error('Thiếu runtime Three.js');
if (!runtime.includes('ScrollWorldRuntime')) throw new Error('Thiếu runtime camera rail');
if (manifest.world.pods.length !== 6) throw new Error('Manifest phải có sáu pod.');
if (!manifest.world.clips.some((clip) => /idle/i.test(clip)) || !manifest.world.clips.some((clip) => /sway/i.test(clip))) throw new Error('Thiếu animation clip vertical slice.');
if (content.includes('http://') || content.includes('https://')) throw new Error('Nội dung không được gọi URL ngoài');
console.log(`smoke-test: ${requiredIds.length} chapters, ${manifest.world.pods.length} GLB pods, letter overlay, camera rail OK`);
