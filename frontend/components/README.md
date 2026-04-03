# Component Architecture

This folder follows a feature-oriented structure to keep UI logic easy to navigate and maintain.

## Folder Structure

```
components/
├── context/           # React Context providers and global state
├── screens/           # Screen-specific components grouped by feature
├── shared/            # Reusable components used across multiple screens
└── ui/                # Basic UI widgets and low-level building blocks
```

## Guidelines

1. Place screen components in `screens/{feature}/`.
2. Place cross-screen reusable components in `shared/`.
3. Place atomic/presentational widgets in `ui/`.
4. Keep one component per file and use descriptive file names.
5. Update all import paths when moving files.

## Import Example

```jsx
import { useRole } from '../../components/context/RoleContext';
import UserHome from '../../components/screens/user/home';
```