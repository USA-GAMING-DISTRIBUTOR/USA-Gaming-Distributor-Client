# UI Style Guide (lightweight)

This doc outlines conventions for building consistent UI in this project.

## Design tokens (implicit)
- Spacing: Tailwind utility scale (e.g., p-2, p-3, gap-2, gap-4)
- Colors: Prefer Tailwind palette; semantic choices via context classes (success/warn/error)
- Typography: Use default Tailwind font sizing; avoid inline styles

## Components
- Common primitives live in `src/components/common/*` (Button, Input, Modal, Pagination, Loader)
- Domain components live near their feature folders (e.g., `src/components/platforms/*`)

## Props & naming
- Prefer explicit prop names (avoid boolean pairs like `primary`/`secondary`, use `variant`)
- Type props precisely; avoid `any`
- Keep components pure; side effects via hooks in containers

## Accessibility
- Button / clickable: use native `<button>` where possible
- Provide `aria-label` for icon-only buttons
- Keyboard focus visible; avoid removing outlines without proper replacements

## States
- Loading: use `Loader` or `TableSkeleton`
- Empty: show friendly message, optional action hint
- Error: use `ErrorDisplay` with concise, human-readable text

## Layout
- Use responsive Tailwind classes (`sm:`, `md:`, `lg:`) where needed
- Keep consistent paddings/margins across panels

## Testing
- Visual states can be documented (optionally) with Storybook
- Behavioral tests live in Vitest; test reducers, selectors, and mapping functions
