<div align="center">
  <img src="assets/images/icon.png" alt="Ufazien" width="100" />

  <h1>Ufazien Mobile</h1>

  <p><strong>The all-in-one academic companion for UFAZ students.</strong></p>

  <p>GPA Calculator &nbsp;&middot;&nbsp; Weighted Averages &nbsp;&middot;&nbsp; Campus Blog &nbsp;&middot;&nbsp; Academic Profile</p>

  <br />

[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/martian56/ufazien-mobile/ci.yml?label=CI&style=flat-square)](https://github.com/martian56/ufazien-mobile/actions)
[![Version](https://img.shields.io/badge/version-1.4.0-blue?style=flat-square)]()
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square)]()
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)

  <br />

  <p>
    <a href="#features">Features</a> &nbsp;&middot;&nbsp;
    <a href="#quick-start">Quick Start</a> &nbsp;&middot;&nbsp;
    <a href="#architecture">Architecture</a> &nbsp;&middot;&nbsp;
    <a href="#built-with">Built With</a> &nbsp;&middot;&nbsp;
    <a href="#contributing">Contributing</a>
  </p>

  <br />
</div>

---

## Features

|                | Feature                | Description                                                                                                                                                    |
| :------------: | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| :mortar_board: | **GPA Calculator**     | Semester and yearly averages across three grading systems — UFAZ (0-20), Azerbaijan (0-100), and direct GPA (0-4.0) — with real-time conversion and auto-save. |
|  :bar_chart:   | **Average Calculator** | Create custom weighted-average schemas, share them publicly, and track grades per field with debounced auto-save.                                              |
|  :newspaper:   | **Campus Blog**        | Browse, search, filter, like, and bookmark posts. Write comments with nested replies. Follow authors.                                                          |
|    :house:     | **Dashboard**          | Profile summary, stats (GPA, credits, followers), quick actions, and notification feed with relative timestamps.                                               |
|     :gear:     | **Settings**           | Profile editing, avatar upload, academic preferences, notification controls, and security options.                                                             |
|     :lock:     | **Authentication**     | Email/password and Google OAuth with PKCE flow, JWT token management, and automatic refresh.                                                                   |
|    :cloud:     | **Hosting**            | View subscription, manage websites and databases from the app.                                                                                                 |

---

## Quick Start

```bash
git clone https://github.com/martian56/ufazien-mobile.git
cd ufazien-mobile
npm install
npm start
```

> Scan the QR code with **Expo Go**, or press **a** for Android / **i** for iOS.

For native development builds:

```bash
npm run dev          # Start with dev client
npm run android      # Android emulator
npm run ios          # iOS simulator
```

---

## Architecture

```
app/                        Screens (file-based routing via expo-router)
├── (tabs)/                 Bottom tab navigation
│   ├── index.tsx              Home / Dashboard
│   ├── gpa-calculator.tsx     GPA Calculator
│   ├── average-calculator.tsx Weighted Average Calculator
│   ├── blog.tsx               Blog Feed
│   └── settings.tsx           Settings (6 sub-tabs)
├── auth/                   Login & Signup
├── blog/[id].tsx           Blog Detail (dynamic route)
├── _layout.tsx             Root stack with theme config
components/ui/              Design system (Button, Card, Input, Avatar, Badge, ...)
config/api.ts               Axios client with auth interceptor + token refresh
constants/theme.ts          Color tokens, shadows, radii, dark mode
contexts/AuthContext.tsx     Auth state, login, signup, Google OAuth
hooks/                      useDebounce, useToast, useColorScheme
utils/                      GPA conversion, major/year formatting
```

<details>
<summary><strong>API Endpoints</strong></summary>

| Group             | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `/auth/`          | Login, signup, Google OAuth, token refresh, user profile |
| `/gpa/`           | Input state, statistics, calculations, GPA updates       |
| `/average/`       | Schema CRUD, grade updates, public schema discovery      |
| `/blog/`          | Posts, categories, comments, likes, bookmarks            |
| `/notifications/` | Notification list and unread count                       |
| `/feedback/`      | Submit feedback and view history                         |
| `/hosting/`       | Subscription, websites, databases                        |

Base URL: `https://api.ufazien.com/api`

</details>

---

## Build

Ufazien uses [EAS Build](https://docs.expo.dev/build/introduction/) for native builds.

| Profile       | Distribution | Notes                     |
| :------------ | :----------- | :------------------------ |
| `development` | Internal     | Dev client with debugging |
| `preview`     | Internal     | Testable APK / IPA        |
| `production`  | Store        | Auto-incremented version  |

```bash
npx eas build --profile preview --platform android
npx eas build --profile production --platform all
```

Releases are triggered automatically by pushing a version tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## Built With

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Expo Router](https://img.shields.io/badge/Expo_Router-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)]()
[![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)]()

---

## Scripts

| Command                | Description             |
| :--------------------- | :---------------------- |
| `npm start`            | Start Expo dev server   |
| `npm run dev`          | Start with dev client   |
| `npm run android`      | Run on Android emulator |
| `npm run ios`          | Run on iOS simulator    |
| `npm run web`          | Run in browser          |
| `npm run lint`         | ESLint check            |
| `npm run lint:fix`     | Auto-fix lint issues    |
| `npm run format`       | Prettier format         |
| `npm run format:check` | Check formatting        |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community guidelines.

---

## Contributors

<a href="https://github.com/martian56/ufazien-mobile/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=martian56/ufazien-mobile" />
</a>

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=martian56/ufazien-mobile&type=Date)](https://star-history.com/#martian56/ufazien-mobile&Date)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
