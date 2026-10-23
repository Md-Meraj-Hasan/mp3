# GitHub folder guide

Keep these files/folders at the repository root:

- `index.html` — Capacitor entry page; redirects to `video-player.html`.
- `video-player.html` — video library UI; references `./style.css` and `./app.js`.
- `style.css` — stylesheet used by the player page.
- `app.js` — player logic and native Capacitor bridge calls.
- `video-controls-preview.html` — visual reference/standalone browser preview only.
- `package.json`, `vite.config.js`, `capacitor.config.json` — project/build configuration.
- `scripts/` — `integrate-native-media.cjs`, `strip-internet-permission.cjs`, `verify-web-assets.cjs`.
- `android-native/` — all five Kotlin source files.
- `.github/workflows/build-apk.yml` — GitHub Actions APK build workflow.

The native integration script copies the Kotlin files from `android-native/` into the package folder containing the generated `MainActivity`, registers the plugins, adds Media3 dependencies, and declares the native activity/service in the manifest.

Note: `video-controls-preview.html` is a browser prototype. The APK's actual full-screen video controls are drawn by `android-native/NativeVideoPlayerActivity.kt`, so matching the preview's appearance requires a separate native UI styling/layout update; simply connecting source paths does not make those two interfaces visually identical.


**Playback-engine warning:** the supplied native source files are Media3/ExoPlayer-based. The path connections are fixed, but this package does not convert the engine to LibVLC.
