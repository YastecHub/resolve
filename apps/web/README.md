# web

The analyst dashboard. Right now it holds the design system and its gallery; the product screens come next.

```
pnpm --filter web dev
```

| Route     | What it shows                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------- |
| `/`       | Design gallery: foundations, controls, status, cards, data viz, trace, overlays, product patterns |
| `/brand`  | Brand mark and lockups                                                                            |
| `/tokens` | Every token with its light and dark value                                                         |
| `/icons`  | Every semantic icon key                                                                           |

```
app/
  styles/tokens.css   design tokens (colour, type, radius, motion, utilities)
  components/ui/      primitives: button, dialog, tabs, pills, meters, table pagination…
  components/         product components: shell, decision card, trace, cases table, charts, Adire
  design/             the gallery sections
  brand/              brand page sections
  lib/                helpers: icons, theme, formatting, labels
```

Icons are Hugeicons through Iconify, used only through `AppIcon` and the semantic keys in `app/lib/icons.ts`. `pnpm --filter web icons:check` verifies every name resolves; `pnpm --filter web build:prod` bundles them offline.

Visual rules are in [docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md).
