# Device Testing Runbook

Status: Approved procedure (ADR-062; generator section amended by ADR-063)  
Version: 1.1  
Date: 2026-07-24

This runbook describes the first real-device test session of Momentum on the Founder's iPhone, and the daily workflow afterwards. Development happens on Windows, so iOS builds run in the cloud through EAS Build. This procedure records configuration and steps only; it does not change application code.

## Why EAS Build and not Expo Go

Momentum pins exact native module versions and depends on their behavior:

- `react-native-reanimated` 4.3.1 with `react-native-worklets` 0.8.3 (spring physics, Living Canvas);
- `react-native-maps` 1.27.2 with an OpenStreetMap `UrlTile` overlay (route map preview, ADR-061);
- `expo-image-picker` (photos in memories, ADR-061).

Expo Go ships its own built-in versions of native modules. Those versions can differ from the pinned ones, so behavior in Expo Go would not prove behavior of the real app — and `react-native-maps` is not part of Expo Go at all. An EAS development build compiles exactly the dependency set from `package.json` into an installable app with the Expo dev client inside (`expo-dev-client` is already a dependency). ADR-009 made this decision in principle; ADR-062 activates it now that the Founder holds an Apple Developer account.

## One-time setup (Founder only)

These steps require interactive accounts and credentials and are deliberately not automated:

1. Create a free Expo account at https://expo.dev (email signup).
2. In the repository root, log in once:

   ```text
   npx eas-cli login
   ```

3. Apple linking: on the first `eas build` run, EAS interactively asks for the Apple ID and two-factor authentication code of the Apple Developer account, then automatically creates and stores the distribution certificate, the App ID (`com.wjansmaw.momentum`), and the provisioning profile in the EAS credentials store. The Apple Team ID is read automatically from the account login; it does not need to be configured by hand. The repository already carries an EAS `projectId` in `app.json` (`extra.eas.projectId`); the first build attaches to that project.
4. Register the iPhone as an allowed test device:

   ```text
   npx eas-cli device:create
   ```

   This shows a QR code and a registration link. Open it on the iPhone (camera or Safari) and follow the Apple profile installation prompt. The device's UDID is added to the Apple Developer account and EAS includes it in the provisioning profile. Without this step, a development build cannot be installed on the phone.

## Running the first build

From the repository root:

```text
npx eas-cli build --profile development --platform ios
```

The `development` profile in `eas.json` sets `developmentClient: true` and `distribution: "internal"`: the cloud build compiles the app with the dev client and signs it for the registered devices only. What happens in the cloud: EAS checks out the repository, runs `npm ci`, runs the Expo prebuild step that generates the native iOS project from `app.json` (bundle identifier `com.wjansmaw.momentum`, permission texts, config plugins), compiles with Xcode, and signs the resulting `.ipa` with the managed credentials. A build typically takes 15–30 minutes on the free plan queue.

When the build finishes, the download link appears in the terminal output and in the EAS dashboard (expo.dev → project → Builds). EAS also emails the link to the account owner. The `cli.appVersionSource: "remote"` setting in `eas.json` lets EAS track the app version and build number centrally; the first build syncs the version from `app.json` automatically.

## Installing on the iPhone

1. Open the build link on the iPhone in Safari and tap Install. iOS installs the app outside the App Store through the internal-distribution profile.
2. The first launch is blocked until the developer certificate is trusted: Settings → General → VPN & Device Management → trust the Founder's developer certificate.
3. Open Momentum. The dev client starts and shows the connection screen.

## Daily use after the first install

1. On the PC, in the repository root:

   ```text
   npx expo start --dev-client
   ```

2. Make sure the iPhone and the PC are on the same wifi network. The app connects to the development server over the LAN. Windows Firewall must allow inbound traffic to the Metro port (8081); approve the prompt on first run or add a rule manually.
3. JavaScript changes reload on the phone without a new cloud build. A new EAS build is only needed when native dependencies, `app.json` native configuration, or config plugins change (ADR-009).
4. If the LAN connection is unreliable, `npx expo start --dev-client --tunnel` works over any network at lower speed.

## The AI generator from the phone

How the app picks the generator URL (from `src/product/generativeExperience.ts`):

- The app calls the generator only when a URL is configured. `EXPO_PUBLIC_MOMENTUM_GENERATOR_URL` wins; otherwise a web-only default of `http://127.0.0.1:8787/v1/experience-drafts` applies. On a native build (iPhone) there is no default, so without configuration `generatorUrl` is undefined.

**(a) Default on the phone: everything works offline.** With no URL configured, the app uses local synthesis from approved building blocks (status "Lokale synthese"). Generation fails silently back to this local path whenever the server is unreachable, so the first device session needs no server at all and no API key on the phone.

**(b) Live Kimi generation from the phone requires three things on the PC side:**

1. The generator server must bind to the LAN instead of loopback: `MOMENTUM_GENERATOR_HOST=0.0.0.0` (default is `127.0.0.1`, which is unreachable from the phone), with `MOMENTUM_GENERATOR_PROVIDER=moonshot` and `MOONSHOT_API_KEY` in the server-only environment (never in the app, never committed). Windows Firewall must allow inbound TCP on `MOMENTUM_GENERATOR_PORT` (default 8787).
2. The app must know the PC's LAN address: set `EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=http://<PC-LAN-IP>:8787/v1/experience-drafts` in the environment when starting `npx expo start --dev-client`. Expo inlines `EXPO_PUBLIC_*` variables into the JavaScript bundle at start time, so the variable must be present before the dev server starts; changing it requires a dev-server restart, not a new cloud build.
3. The native app identifies itself explicitly. Since ADR-063 the app sends the fixed header `X-Momentum-Client: native` on every generator call from a native build. The server admits requests without an `Origin` header only when that header matches exactly; requests without Origin and without (or with a wrong) header still receive `403 origin_not_allowed`. The browser path is unchanged: browser calls carry an Origin and are governed by `MOMENTUM_ALLOWED_ORIGINS` only.

**Working procedure (ADR-063, home network only):**

1. Find the PC's LAN address (`ipconfig`, look for the IPv4 address of the wifi adapter, for example `192.168.1.50`).
2. Start the generator on the PC, bound to the LAN. Windows PowerShell:

   ```powershell
   $env:MOMENTUM_GENERATOR_HOST = "0.0.0.0"
   $env:MOMENTUM_GENERATOR_PROVIDER = "moonshot"
   # MOONSHOT_API_KEY comes from your own uncommitted env file, never typed into git-tracked files
   npm run generator
   ```

   git-bash:

   ```bash
   MOMENTUM_GENERATOR_HOST=0.0.0.0 MOMENTUM_GENERATOR_PROVIDER=moonshot npm run generator
   ```

3. Allow inbound TCP on port 8787 in Windows Firewall (approve the prompt on first run, or: Windows Security → Firewall & network protection → Advanced settings → Inbound Rules → New Rule → Port → TCP 8787, Private networks only).
4. Start the dev server with the generator URL pointing at the PC's LAN address. PowerShell:

   ```powershell
   $env:EXPO_PUBLIC_MOMENTUM_GENERATOR_URL = "http://192.168.1.50:8787/v1/experience-drafts"
   npx expo start --dev-client
   ```

   git-bash:

   ```bash
   EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=http://192.168.1.50:8787/v1/experience-drafts npx expo start --dev-client
   ```

   Expo inlines `EXPO_PUBLIC_*` variables into the JavaScript bundle at start time, so the variable must be present before the dev server starts; changing it requires a dev-server restart, not a new cloud build.
5. On the iPhone the generator status should read "AI-synthese actief". If the server is unreachable the app falls back silently to "Lokale synthese", so a failed connection never breaks the session.

For a key-free rehearsal of the whole chain, replace step 2 with `MOMENTUM_GENERATOR_HOST=0.0.0.0 npm run generator:fixture`; the status then reads "Demonstratiesynthese" and no API key is involved.

**Boundary:** this procedure is for the Founder's own home network only. The header is explicit client identification, not authentication — anyone on the same network could send it. The service therefore never belongs on the public internet in this form; public deployment with real authentication remains a separate release blocker on the roadmap and requires its own ADR (Generator Service Runbook, production prerequisites).

Never place an API key or shared secret in the app (Generator Service Runbook).

## Costs

EAS Build's free plan includes a limited number of cloud builds per month with shared queue priority; building more frequently requires a paid EAS plan (Expo Production or higher). Because JavaScript-only changes flow through the development server without a new build, the expected usage is a handful of builds per month — one per native dependency or configuration change — which fits the free allowance. The Apple Developer Program membership ($99/year) is already paid and unaffected by this choice.

## First-session success checklist

The first session on the iPhone counts as successful when the Founder can confirm all of the following on the device itself:

1. Momentum launches and shows Now; navigation between surfaces (Now, Prepare, Discover, Remember/Life Book) works with the native-stack transitions.
2. Haptics fire on the interactions that define them (invitation acceptance, capsule steps).
3. The matches carousel on Now scrolls and loops back to the first card.
4. A route map preview renders in Prepare/route cards with OpenStreetMap tiles (requires internet on the phone).
5. A photo can be attached to a Life Book memory through `expo-image-picker` and stays on the device.
6. The generator status reads "Lokale synthese" and a locally synthesized suggestion appears — confirming the offline fallback works end to end on real hardware.

Report any deviation with the device model, iOS version, and the step number above before proposing fixes.
