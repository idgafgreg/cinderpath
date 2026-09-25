# Design references and implementation sources

Reviewed September 2026. No assets or source code were copied from the reference games.

- [Imangi: Temple Run 2](https://imangistudios.com/thegames/temple-run-2/) describes running, jumping, turning, sliding, and varied environments. Cinderpath uses a compact lane / jump / slide vocabulary and environment changes, while retaining its own lantern fiction and procedural art.
- [SYBO: Subway Surfers on Google Play](https://play.google.com/store/apps/details?id=com.kiloo.subwaysurf) provides the official reference for a fast swipe-based runner, vivid presentation, and collectible-driven play. Cinderpath’s progression deliberately uses earned currency without purchases or ads.
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) informed the manifest, install icons, standalone display, relative scope, and HTTPS deployment requirement. Installation UI varies by browser/platform.
- [MDN: PWA caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) informed the offline shell and versioned cache lifecycle.
- [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) informed the pixel-ratio cap and render-cost controls. Cinderpath additionally bounds transient particles and procedural objects.

The game-design decisions above are our interpretation of the reference experiences. They are not evidence that Cinderpath has comparable retention or production quality; that requires real player testing.
