# Vortex — Android app

A lightweight native Android wrapper (WebView) around **vortex.sarl**. It grants
camera + microphone (so calls work), handles file uploads (so posting works),
keeps Vortex navigation in-app, opens external links in the browser, and maps the
hardware back button to in-app history.

## Get the APK (no tools needed)

Every push to `android/` runs the **Build Vortex APK** GitHub Action, which
compiles the app on GitHub's runners and attaches `vortex.apk` to the
**`android-latest`** release. Download it there, open it on your phone, and allow
"install from unknown sources" when prompted.

You can also trigger it manually: GitHub → Actions → *Build Vortex APK* → **Run workflow**.

## Build it yourself

Open the `android/` folder in Android Studio and press Run, or from a machine with
the Android SDK:

```bash
cd android
gradle assembleDebug     # or ./gradlew assembleDebug if you add a wrapper
# APK: app/build/outputs/apk/debug/app-debug.apk
```

## Notes

- Debug-signed, so it installs by sideloading (not via Play Store).
- `minSdk 23` (Android 6+), `targetSdk 34`. No AndroidX dependencies.
- To point it at a different URL, edit `START_URL`/`HOST` in
  `app/src/main/java/sarl/vortex/app/MainActivity.java`.
