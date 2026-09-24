# Asset guide

The first public build intentionally uses procedural Three.js geometry and text placeholders. This keeps the repository small, reproducible, and safe to publish before personal photos are supplied.

## Replace the memory cards

1. Add three optimized images under `public/assets/memories/`.
2. Replace the card materials in `src/scene/MoonlitSceneRuntime.ts` or add a typed image map in `src/content.ts`.
3. Keep personal names, dates, and captions in `src/content.ts` and the letter body in `index.html`.
4. Run `npm run typecheck`, `npm test`, and `npm run build` before committing.

No runtime asset may depend on an external URL. Do not commit private photos until you intend them to be public.
