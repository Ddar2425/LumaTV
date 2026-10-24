# Updates in Luma TV

Open **Updates** in the top navigation. Choose **Check for updates**, **Download**, then **Restart & install**. Only checks run automatically on launch; installation waits for the user. Downloads are checked against the release's SHA-512 digest. The installer updates Luma in place and keeps the per-user settings, library paths, and service sessions.

The release repository is https://github.com/Ddar2425/LumaTV. The repository address can be changed once in the Updates page without reinstalling. No GitHub access token is embedded in this application; public releases are downloaded anonymously. Private release repositories are not supported by this UI. This build is unsigned, so Windows may show a publisher notice. Checksums protect against damaged or mismatched downloads; protect the GitHub publishing account because it controls future updates.

Old versions did not contain an updater. They need one initial upgrade to 1.2.0; later published versions can be installed through the app. Updates must first be built and published to GitHub: changing local project files alone does not publish a release.

## Publishing the next version

1. Make and test changes, bump package.json's version, and run `npm install --package-lock-only`.
2. Run `npm test`, then `npm run dist`.
3. On GitHub create a published, non-prerelease release tagged `v<version>` in the LumaTV repository.
4. Attach the matching `Luma-TV-Setup-<version>.exe`, its `.exe.blockmap`, and `latest.yml` from the build output. Keep all three from the same build; upload `latest.yml` last. Publish the release once all uploads finish.
5. In the installed older Luma, open Updates and check. Only higher stable versions are offered; downgrades and prereleases are disabled.

The included GitHub Actions workflow can also build, test, and publish a release when a `v*` tag is pushed. It publishes only this project's installer and metadata. Repository source contains no user settings, cookies, media, node_modules, or account tokens.

The updater downloads the full installer for reliability. It does not auto-install on exit. If a download fails, a checksum fails, GitHub is unavailable, or no release exists, the app shows an error and remains usable. Return to Check for updates to retry. Restart & install closes Luma and opens the installer, then relaunches Luma when finished. An installation error may require running the installer again; Windows can uninstall the app normally.

Automated update tests use a loopback HTTP fixture and a non-executable payload, exercising the actual electron-updater download and checksum logic. Installation is intercepted in test mode. Live upgrade installation should be verified separately.
