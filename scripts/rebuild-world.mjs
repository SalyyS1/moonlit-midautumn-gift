import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function findBlender() {
  if (process.env.BLENDER_PATH) return process.env.BLENDER_PATH;
  const command = spawnSync('blender', ['--version'], { encoding: 'utf8', windowsHide: true });
  if (!command.error && command.status === 0) return 'blender';
  if (process.platform === 'win32') {
    // Reuse a local portable/install build; never download executables implicitly.
    for (const base of [join(homedir(), 'Tools'), join(process.env.ProgramFiles || 'C:/Program Files', 'Blender Foundation')]) {
      if (!existsSync(base)) continue;
      for (const entry of readdirSync(base).filter(name => /^blender/i.test(name)).sort().reverse()) {
        const candidate = join(base, entry, 'blender.exe');
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  throw new Error('Blender is unavailable. Set BLENDER_PATH to a Blender 4.x executable or add blender to PATH.');
}

const executable = findBlender();
const args = ['--background', '--python-exit-code', '1', '--python', resolve('art/blender/build-environment.py'), '--'];
if (!process.argv.includes('--render')) args.push('--skip-renders');
console.log(`Rebuilding world from Blender source with ${executable}`);
const result = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
