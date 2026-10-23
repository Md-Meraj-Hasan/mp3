# Audio/Video navigation and native audio URI fix

Changes in this update:
- Video bottom-navigation label changed from Library to Video.
- Playlist heading changes between Audio and Videos based on active mode.
- Device scan results are filtered by audio/video MIME type or common file extension to avoid MP3 files appearing in the video list.
- Android `content://` audio URIs use the registered `MerajMediaPlayer` native Media3 plugin instead of attempting to load the URI into the WebView `<audio>` element.
- Native audio pause/resume, playback speed, repeat-one, and seekbar state synchronization are connected to the existing plugin methods.

Files changed: `app.js`, `video-player.html`.

Please push this project to GitHub and let GitHub Actions build it. This source update has been syntax-checked with `node --check`; it has not been built or tested on a physical Android device in this environment.
