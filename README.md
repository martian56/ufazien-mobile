# Ufazien Mobile

**Academic tools and community for UFAZ students.**

Ufazien helps students track their academic progress: calculate GPA across grading systems, build weighted average schemas, read and write blog posts, and manage their profile — all from a single mobile app.

---

## Features

- **GPA Calculator** — Enter semester or yearly averages across three grading systems (UFAZ 20-point, Azerbaijan 100-point, direct 4.0 GPA) with real-time conversion and auto-save.
- **Average Calculator** — Create custom weighted-average schemas, share them publicly, and track grades per field with debounced auto-save.
- **Blog** — Browse, search, filter, like, and bookmark posts. Write comments with nested replies. Follow authors.
- **Dashboard** — Profile summary, stats (GPA, credits, followers), quick actions, and notification feed.
- **Settings** — Profile editing, avatar upload, academic preferences, notification controls, password setup for OAuth users, and security options.
- **Authentication** — Email/password and Google OAuth (PKCE flow) with JWT token management and automatic refresh.

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)

### Install

```bash
npm install
```

### Run

```bash
npm start            # Start Expo dev server (scan QR with Expo Go)
npm run dev          # Start with development client (local native build)
npm run android      # Launch on Android emulator
npm run ios          # Launch on iOS simulator
npm run web          # Launch in browser
```

### Lint and Format

```bash
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format
npm run format:check # Check formatting without changes
```

---

## Build

Ufazien uses [EAS Build](https://docs.expo.dev/build/introduction/) for native builds.

| Profile       | Distribution | Notes                     |
| ------------- | ------------ | ------------------------- |
| `development` | Internal     | Dev client with debugging |
| `preview`     | Internal     | Testable APK / IPA        |
| `production`  | Store        | Auto-incremented version  |

```bash
npx eas build --profile preview --platform android
npx eas build --profile production --platform all
```

---

## Project Structure

```
app/                    # Screens (file-based routing via expo-router)
├── (tabs)/             # Bottom tab navigation (Home, GPA, Average, Blog, Settings)
├── auth/               # Login and signup screens
├── blog/[id].tsx       # Dynamic blog detail
├── _layout.tsx         # Root stack with theme and nav bar config
components/ui/          # Design system primitives (Button, Card, Input, Avatar, Badge, ...)
config/api.ts           # Axios client with auth interceptor and token refresh
constants/theme.ts      # Color tokens, shadows, radii, dark mode
contexts/AuthContext.tsx # Auth state, login, signup, Google OAuth
hooks/                  # useDebounce, useToast, useColorScheme, useThemeColor
utils/                  # GPA conversion logic, major/year formatting
```

---

## Built With

[![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo Router](https://img.shields.io/badge/Expo%20Router-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)

---

## API

The app connects to `https://api.ufazien.com/api`. Key endpoint groups:

| Group             | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `/auth/`          | Login, signup, Google OAuth, token refresh, user profile |
| `/gpa/`           | Input state, statistics, calculations, GPA updates       |
| `/average/`       | Schema CRUD, grade updates, public schema discovery      |
| `/blog/`          | Posts, categories, comments, likes, bookmarks            |
| `/notifications/` | Notification list and unread count                       |
| `/feedback/`      | Submit feedback and view history                         |
| `/hosting/`       | Subscription, websites, databases                        |

---

## Contributing

Contributions are welcome. Please open an issue for bugs or feature ideas, then submit a pull request.

---

## Contributors

<a href="https://github.com/martian56/ufazien-mobile/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=martian56/ufazien-mobile" />
</a>

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
