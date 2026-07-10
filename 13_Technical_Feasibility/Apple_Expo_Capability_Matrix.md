# Apple and Expo Capability Matrix

Status: Technical research, directional  
Version: 1.0  
Reviewed: 2026-07-10

## Purpose

This document separates product ambition from verified platform capability. It is based on current official Apple and Expo documentation and must be rechecked before implementation because platform APIs, review rules, and Expo support change.

## Executive conclusion

Momentum's core experience is technically feasible, but not entirely inside Expo Go.

- **Expo Go** is suitable for an early visual and interaction prototype using explicit input and labelled mock context.
- **An Expo development build** is the practical minimum for a real iOS prototype using calendar access and custom native capabilities.
- **Native iOS code and extensions** are required for HealthKit, Foundation Models, App Intents, widgets, and Live Activities unless maintained third-party modules fully cover the exact need.
- Momentum must not be designed around unrestricted access to Apple Intelligence, Focus status, messages, mail, WhatsApp, or private system-wide context. Those capabilities do not exist as a general context feed for third-party apps.

Momentum does not require Cursor or another specific editor. Codex can maintain the code and native configuration in this repository. EAS Build can create iOS device builds in the cloud from Windows; a paid Apple Developer account is required to sign builds installed on a physical iPhone. Native app extensions are supported through Expo/EAS configuration, although Continuous Native Generation support for extensions is currently described by Expo as experimental and should be revalidated before use.

## Capability matrix

| Capability | Expo Go | Expo development build | Native iOS work | MVP recommendation |
|---|---:|---:|---:|---|
| React Native UI, motion, local mock state | Yes | Yes | No | Use immediately for interaction prototyping |
| Explicit active intent | Yes | Yes | No | Core of first prototype |
| Foreground approximate/current location | Generally yes with `expo-location` | Yes | No for basic use | Add only after permission-by-value flow is designed |
| Background location | Limited and platform-dependent in Expo Go | Yes with configuration and review implications | Possibly | Exclude from MVP |
| Calendar event access | No; current `expo-calendar` is unsupported in Expo Go | Yes | EventKit underneath | Consider after active-intent prototype; full read access is sensitive |
| Add calendar event | No in current Expo Go | Yes | EventKit underneath | Later convenience, not core Understanding |
| Apple Maps handoff | Yes through a URL/link | Yes | No for basic handoff | Use for route-based Capsule |
| Embedded native map | Possible through supported mapping libraries | Yes | Depends on chosen library | Not needed for first vertical slice |
| WeatherKit | Not as a native WeatherKit entitlement in Expo Go | Possible through native integration or a secure REST service | Entitlement or backend token service | Later; prototype with labelled mock weather |
| HealthKit | No | Possible with a native module and HealthKit capability | Yes | Exclude from first prototype; validate product eligibility first |
| Local notifications | Limited prototype support | Yes | Usually no custom Swift needed | Later, only for bounded user-authorized cues |
| Remote notifications | No production-parity support in Expo Go | Yes | Certificates/configuration required | Not needed for first interaction |
| Live Activities | No | Possible only with widget extension/native support | Yes: ActivityKit + WidgetKit/SwiftUI | Later Capsule enhancement, not MVP dependency |
| Home/Lock Screen widgets | No custom extension in Expo Go | Possible with native extension tooling | Yes: WidgetKit/SwiftUI | Later Now surface |
| App Intents / Siri / Shortcuts | No custom native intents | Possible with native implementation | Yes: App Intents | Later active-entry shortcut |
| Focus integration | No general Focus-state feed | Native app can expose its own Focus Filter behavior | Yes: App Intents Focus APIs | Do not treat Focus as readable global context |
| Apple Foundation Models | No | Possible only on supported OS/devices through native framework | Yes: Swift Foundation Models | Later optional phrasing/tool layer, never sole decision authority |
| Photos/camera chosen by user | Supported through Expo modules | Yes | No for basic selection/capture | Optional Memory feature later |
| Mail, Messages, WhatsApp content | No general cross-app read access | No general cross-app read access | Not a normal public iOS capability | Out of scope |

## Detailed findings

### Expo Go versus development builds

Expo describes Expo Go as a fixed native playground. It cannot load arbitrary native code that was not bundled into Expo Go. Production-grade apps generally move to a development build when they need native libraries, app extensions, entitlements, universal links, or production notification behavior.

Current Expo documentation specifically marks `expo-calendar` as unsupported in Expo Go and requires a development build.

Implication:

> Build the first visual interaction in Expo Go if speed matters, but move to a development build before claiming any real Apple-context prototype.

Official sources:

- [Expo: Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Calendar](https://docs.expo.dev/versions/latest/sdk/calendar/)

### Calendar

Expo Calendar can interact with system calendars, events, and reminders in a development build. On current iOS versions, reading calendars and events requires full calendar access; write-only permission can add events without reading them.

Important product boundary:

- Momentum can minimize what it processes after access, for example by deriving occupied intervals locally and discarding titles.
- The system permission is still full calendar read access when Momentum needs to inspect events. Momentum must not describe that as a special OS-level “free/busy only” permission unless Apple adds one.
- Event titles, notes, attendees, and locations should not be used merely because the API returns them.

Official sources:

- [Expo Calendar permissions](https://docs.expo.dev/versions/latest/sdk/calendar/)
- [Apple EventKit UI](https://developer.apple.com/documentation/eventkitui)

### Location

`expo-location` supports foreground location. Background behavior has additional limitations, configuration, permission, and review consequences. The first product does not need continuous background tracking.

Recommendation:

- ask for approximate or foreground location only when the person requests a nearby experience;
- do not collect continuous location to detect moments;
- make location-free experiences first-class.

Official source:

- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

### Apple Maps handoff

Apple supports map links for showing a place or directions. Momentum can open Apple Maps with a destination and transport preference without becoming a navigation app.

Limitations:

- opening Maps does not guarantee arrival or completion;
- return state must not be invented;
- precise behavior should be tested on real devices.

Official source:

- [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html)

### WeatherKit

Native WeatherKit requires the WeatherKit entitlement. The REST API requires authenticated requests using a signed developer token, and private keys must not be distributed in the app. Apple also requires attribution when weather data is displayed or used under its terms.

Implications:

- a React Native client should not contain the private WeatherKit key;
- either create a secure service for REST token handling or add a native WeatherKit bridge;
- weather-derived Experience Promises require freshness and attribution;
- the first prototype should use labelled mock conditions.

Official sources:

- [WeatherKit entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.weatherkit)
- [WeatherKit REST authentication](https://developer.apple.com/documentation/WeatherKitRESTAPI/request-authentication-for-weatherkit-rest-api)
- [WeatherKit attribution](https://developer.apple.com/documentation/weatherkit/weatherattribution)

### HealthKit

HealthKit requires a native capability, purpose strings, and fine-grained authorization per data type. Apple recommends requesting access only when clearly connected to health or fitness functionality. Apple also states that apps without health and fitness functionality should not request HealthKit access.

Privacy behavior matters technically: an app cannot simply assume that an empty read means a person has no data; authorization protections can make denied or limited access appear as missing results.

Implications:

- HealthKit cannot be a silent general-energy sensor;
- Momentum must first establish a legitimate, visible health/fitness use case;
- explicit self-reported capacity is the correct first-product substitute;
- HealthKit should be evaluated as a later bounded capability for workout or recovery experiences, not the foundation of all recommendations.

Official sources:

- [Apple: Authorizing access to health data](https://developer.apple.com/documentation/HealthKit/authorizing-access-to-health-data)
- [Apple HIG: HealthKit](https://developer.apple.com/design/human-interface-guidelines/healthkit)
- [Apple: Configuring HealthKit access](https://developer.apple.com/documentation/Xcode/configuring-healthkit-access)

### Live Activities and widgets

Live Activities require an iOS widget extension with SwiftUI/WidgetKit UI and ActivityKit lifecycle code. A Live Activity cannot directly access the network or receive location updates; the app or push notifications must update it. Apple documents a combined 4 KB limit for static and dynamic activity data.

Implications:

- Live Activities are native extension work, not an Expo Go feature;
- they are suitable only when glanceable live state materially reduces phone use;
- they should not be assumed necessary for a walking Capsule;
- a simple timer or Maps handoff may be better for the first product.

Official sources:

- [Apple: Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
- [Apple ActivityKit](https://developer.apple.com/documentation/activitykit)

### App Intents, Siri, Shortcuts, and Focus

App Intents expose an app's own actions and entities to Siri, Shortcuts, Spotlight, widgets, and Apple Intelligence. This makes a future “I have one hour” App Intent plausible.

Focus integration does not mean Momentum can freely inspect all system Focus context. Apple provides mechanisms for an app to define its own Focus Filter behavior when the user configures it.

Implications:

- an App Intent is a promising later entry point for active intent;
- Focus should not be listed as a general context source in the MVP;
- both require native Swift integration.

Official sources:

- [Apple App Intents](https://developer.apple.com/documentation/appintents/)
- [Apple Focus and App Intents](https://developer.apple.com/documentation/appintents/focus)

### Apple Intelligence and Foundation Models

Apple's Foundation Models framework gives native apps structured access to on-device language models on supported devices when Apple Intelligence is enabled and the model is available. It supports language understanding, guided structured generation, and tool calling.

It is not a system-wide personal-context API. Momentum must provide the permitted context and tools itself. Model availability, supported device, language, OS version, prompt behavior, and context limits require graceful fallback.

Recommended role:

- phrase or refine an Experience Promise from verified structured facts;
- interpret concise active intent into a bounded structure;
- call Momentum-owned tools for verified candidates;
- never decide permissions, fabricate live facts, or replace deterministic feasibility and safety filtering.

Official sources:

- [Apple Foundation Models](https://developer.apple.com/documentation/FoundationModels)
- [Apple: Adding intelligent app features](https://developer.apple.com/documentation/foundationmodels/adding-intelligent-app-features-with-generative-models)
- [Foundation Models updates](https://developer.apple.com/documentation/Updates/FoundationModels)

## Claims Momentum must not make

Until a later technical test proves otherwise, do not claim that Momentum can:

- understand all Apple on-device information;
- read a calendar using only free/busy permission;
- know who is physically with the user;
- read Mail, Messages, WhatsApp, or Notes as a background personal context stream;
- know the current Focus mode as unrestricted context;
- detect emotional or recovery state from Apple Intelligence;
- automatically know that a route was completed after opening Maps;
- receive live location directly inside a Live Activity;
- use Foundation Models on every iPhone or when Apple Intelligence is disabled.

## Architectural direction

The safest future architecture is capability-based:

> explicit input and local app state → permitted platform adapters → normalized context facts → deterministic feasibility → comparative selection → optional model-assisted language → Experience Capsule → trusted system handoff

Every platform adapter must have:

- a permission and purpose boundary;
- source and freshness metadata;
- a no-permission fallback;
- a revocation path;
- a test showing that its value exceeds its privacy and complexity cost.
