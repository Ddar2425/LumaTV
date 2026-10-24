# Luma TV validation — October 23, 2026

## Version 1.2.0: in-app updates

The full application suite and new updater suite passed against the packaged executable. Updater tests covered available/current/missing releases, persisted preferences, no automatic download, SHA-512 verification, corrupted download rejection, and blocking installation before a verified download.

The live GitHub release was published at https://github.com/Ddar2425/LumaTV/releases/tag/v1.2.0 with installer, blockmap and latest.yml. A separate probe identifying as version 1.1.1 detected version 1.2.0, downloaded the actual published installer, and passed its SHA-512 integrity check. The probe intercepted installation rather than executing it.

The real installer was then run silently on this PC and exited successfully. The installed application reported version 1.2.0 and its Updates menu checked the live GitHub source, reporting the latest published version. Screenshot: outputs/updates-menu.png. The installer wizard was not exercised interactively.

## Version 1.1: embedded apps

Tests passed on Windows with Electron 45.0.0 and Playwright 1.64.1:

- Saved shortcuts, URL protocol rejection, themes across reloads, keyboard focus and fullscreen.
- Virtual standard-mapped controller move/select/back.
- Native picker imports, removal and cancellation using controlled dialog results.
- An actual HTTP test service hosted inside a correctly sized WebContentsView in the single Luma window.
- Service isolation: neither Node.js require nor the launcher bridge was available to it.
- Popup blocking and closing/destroying the service view on Home.
- A real generated PCM audio file reaching playable ready state in the built-in player, then Escape returning home.
- No launcher renderer exceptions.

The same suite passed against the packaged executable. An unsigned x64 installer was generated; its wizard was not run. Tests did not enable startup, open external browsers, or access subscription accounts.

Unverified: physical remotes/controllers, Windows sign-in startup, real provider authentication and DRM playback. Embedded service interfaces are web interfaces, not native TV applications. Installed Windows programs continue to run separately.
