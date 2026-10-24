# Luma TV 1.2.0

**Updates:** open Updates in the top navigation, then Check for updates → Download → Restart & install. It is connected to [Ddar2425/LumaTV releases](https://github.com/Ddar2425/LumaTV/releases). Checks run on launch by default; downloads and installation wait for your choice. See [UPDATES.md](UPDATES.md) for release publishing and troubleshooting.

Run **Luma-TV-Setup-1.2.0.exe** in the parent outputs folder. This Windows x64 installer requires no Node.js installation and adds desktop/Start menu shortcuts. Close the old app before updating. It is unsigned; Windows may show an unrecognized publisher message.

## Inside Luma

Services now open their web interfaces **inside the Luma window**, with Home, Back, and Reload controls. No external browser opens. Escape or Alt+Home returns to Luma; F11 toggles fullscreen. Closing a service stops playback. Each service has its own saved sign-in session inside Luma, separate from Edge/Chrome.

These are embedded web interfaces, not native Samsung/Google TV apps. Windows cannot directly run those TV-platform applications. Installed Windows `.exe`/`.lnk` applications still run separately; arbitrary native programs cannot generally be hosted inside Luma.

This build does not include licensed Widevine integration. Netflix, Disney+, Prime Video, Spotify protected playback and other DRM services are **not guaranteed to play**, even if their interfaces load. Providers can restrict embedded browsers, device certification, sign-in, quality, and playback. Popup-based authentication and Google sign-in may be unavailable. No automatic external-browser fallback is used. See [Widevine integration](https://developers.google.com/widevine/drm/overview) and [Electron for Content Security](https://github.com/castlabs/electron-releases) for the additional DRM integration involved; it is not included in this build.

Service pages keep their own layout and usually need a mouse/keyboard. Luma cannot turn each service into its TV app. Downloads, popup windows, non-HTTP(S) links, camera/microphone and location requests are blocked. Remote services cannot access Node.js or Luma's Windows bridge.

## Library and controls

Apps lets you add HTTP/HTTPS services and Windows application shortcuts. Library lets you choose videos/music for the **built-in player**. Space plays/pauses; left/right seeks ten seconds; Escape returns home. Playback support depends on Chromium codecs. Files stay in their original folders; moved or unsupported files may fail to play. Watch progress and provider catalogs/history are not imported.

In the launcher: arrow keys or Tab move, Enter selects, Escape goes home. Mouse works throughout. A standard-mapped controller can use D-pad/left stick, A and B in the launcher. Controller input is not injected into service pages or the media player; use keyboard/mouse there. Keyboard-emulating USB/Bluetooth remotes work. HDMI-CEC requires separate hardware/software mapping.

## Settings and startup

Settings offers three themes, fullscreen, desktop/minimize, exit, and Start with Windows. Startup is disabled by default. Enabling it writes `LumaTV.vbs` into the current user's Windows Startup folder, launching the installed executable after sign-in. Disable it before uninstalling/moving Luma. You can also press Win+R, enter `shell:startup`, and delete `LumaTV.vbs`. No Windows shell replacement occurs.

Settings and library paths live in `settings.json` in Electron's per-user `luma-tv` data folder (normally `%APPDATA%\luma-tv`). Persistent service cookies/sign-in data live in per-service Chromium sessions under that folder. Removing a shortcut does not clear its session. To clear everything, close Luma and remove its data folder; this deletes shortcuts and signs out services. Luma has no analytics; services have their own privacy practices.

## Source and tests

With Node.js 22.12 or newer, run in this folder:

```powershell
npm ci
node node_modules/electron/install.js
npm start
```

Or double-click `Start Luma.cmd`. The installed executable does not depend on this source folder.

```powershell
npm test
npm run dist
```

Build artifacts go into `work/luma-build` relative to the workspace. Set `LUMA_EXE` to the packaged executable's absolute path before `npm test` to test that build. Tests use a separate configuration and do not enable startup. See `TEST-RESULTS.md`. The installer wizard itself was not run on this PC.

App logos are bundled for offline display. See assets/logos/SOURCES.md for sources and licenses.


