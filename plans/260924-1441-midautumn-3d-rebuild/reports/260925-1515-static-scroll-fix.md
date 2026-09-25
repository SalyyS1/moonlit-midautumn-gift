# Static scroll report and correction

User reported that localhost looked entirely static, with no camera motion.

## Cause

The real Windows/browser preference reports reduced motion. The application silently selected reading mode, disposed or skipped the 3D runtime, and hid the canvas. Scrolling the HTML remained possible, but no WebGL frames were rendered. The prior cinematic browser checks forced no-preference and therefore did not represent this machine's default experience.

## Change

- Explain why reading mode is active.
- Add a prominent “Bật trải nghiệm 3D” action and persistent header mode control.
- Respect the system default until the visitor explicitly chooses 3D.
- Preserve that explicit choice in `?view=3d` through reloads; reading mode removes it.
- Retry failed 3D loading through the same visible controls.
- Preserve audio opt-in, abort/disposal and modal background isolation.

Camera geometry and scroll mapping were already working and were not changed for this fix.

## Verification

`npm test`: 16/16 pass. Typecheck and production build pass. Code review found no blocking defect.

Targeted browser suite: 6/6 pass, zero page exceptions. Both the actual system-default CTA flow and a fresh `?view=3d` link work while the browser continues to report reduced motion.

The targeted production browser regression uses real mouse-wheel events, not debug seeks. Progress changes from 0 to approximately 0.409, the view changes from moon to garden, reverse wheel returns to the opening, and returning to reading stops rendering. Tests also cover reload, default live preference changes, asset failure/retry, 320px controls and letter focus.

Run `npm run test:view-mode` with the freshly built localhost preview running. Raw results and before/after images: `work/static-scroll-debug/fixed/`; original reproduction: `work/static-scroll-debug/report.json`.

The previously recorded art, storyboard and release-performance gaps remain open.
