# Luma TV 1.1 validation — October 23, 2026

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
