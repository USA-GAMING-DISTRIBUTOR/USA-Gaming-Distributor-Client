# Storybook (evaluation + setup guide)

This is an optional developer experience add-on to document and test UI primitives in isolation.

We recommend adopting Storybook only if your team plans to iterate on UI frequently or share a component library.

## Why Storybook here
- Document UI primitives in `src/components/common/*` and modular panels
- Test states (loading, empty, error) visually
- Catch regression with Storybook tests (CSF + interactions)

## Tech choice
- Storybook 8 (Builder Vite) for React + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`) works out of the box when using the app’s Vite config

## Install (optional)
Run these commands to add Storybook (optional and not required for app builds):

```powershell
# Add Storybook core packages (React + Vite builder)
npm i -D @storybook/react @storybook/addon-essentials @storybook/addon-interactions @storybook/test @storybook/addon-a11y @storybook/addon-themes @storybook/builder-vite

# Types for Node testing utilities (optional)
npm i -D @types/node
```

## Initialize files
Create the following files if you adopt Storybook:

```
.storybook/
  main.ts
  preview.ts
src/components/common/
  Button.stories.tsx
  Modal.stories.tsx
```

Example `.storybook/main.ts`:
```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
export default config;
```

Example `.storybook/preview.ts`:
```ts
import type { Preview } from '@storybook/react';
import '../src/index.css'; // Tailwind v4 via @tailwindcss/vite plugin

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    actions: { argTypesRegex: '^on.*' },
    a11y: { element: '#root' },
    layout: 'padded',
  },
};
export default preview;
```

Example story for `Button` (`src/components/common/Button.stories.tsx`):
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Common/Button',
  args: { children: 'Click me' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
```

## Scripts (optional)
Add to `package.json` if you proceed:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

## Notes
- Keep stories co-located with components for discoverability.
- Prefer CSF stories over MDX initially; add MDX when documenting complex flows.
- Use `@storybook/addon-interactions` for simple behavioral checks; keep heavy tests in Vitest.
