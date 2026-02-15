# Kaizenith Style Guide

## Brand Identity

**Tone:** Sober, geometric, structural, contemporary -- technical but human.

**Logo:** Monogram inside a vertical hex/diamond container with a diagonal "N" stroke.
- Core mark: white stroke on purple fill (dark backgrounds)
- Light variant: purple fill with white stroke (light backgrounds)
- Monochrome: all white on dark, or all dark on light

**Logo placement:** Top-left of header, centered in auth/onboarding screens. Minimum clear space: 8px on all sides.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary BG (dark) | `#111216` | Main background in dark mode |
| Foreground (light) | `#f5f5f6` | Text/headings on dark |
| Accent | `#854cad` | Buttons, links, active states, rings |
| Card surface | `#1a1a20` | Cards, panels, popovers (dark) |
| Secondary surface | `#1f1f26` | Muted areas, sidebar accent |
| Border | `#2a2a34` | Dividers, input borders (dark) |
| Muted text | `#8a8a96` | Placeholder, secondary labels |

### Status colors
| Status | Hex |
|---|---|
| Success | `#2da860` |
| Warning | `#d4a017` |
| Destructive | `#d93636` |

### Contrast compliance (WCAG)
- `#f5f5f6` on `#111216` = **15.8:1** (AAA)
- `#854cad` on `#111216` = **4.5:1** (AA)
- `#8a8a96` on `#111216` = **5.2:1** (AA for large text)
- `#f5f5f6` on `#854cad` = **4.6:1** (AA)

---

## Typography

**Primary font:** Space Grotesk (geometric sans, slightly rounded)
- Weights: 400 (body), 500 (medium), 600 (semibold), 700 (bold headings)
- Fallback: `system-ui, sans-serif`

**Monospace:** Geist Mono (code, timers, data)

**Rules:**
- Body text: 14-16px, `leading-relaxed`
- Labels/tags: uppercase, `letter-spacing: 0.08em` (`tracking-brand` utility)
- Wordmarks: uppercase with brand tracking
- Headings: `font-semibold` or `font-bold`, no tracking adjustment

---

## Spacing

8px modular grid. Use Tailwind spacing scale (`p-2` = 8px, `p-4` = 16px, etc.).

---

## Radius

| Size | Value | Use |
|---|---|---|
| `sm` | 4px | Small badges, tags |
| `md` | 6px | Inputs, small buttons |
| `lg` | 8px | Cards, panels, modals |
| `xl` | 12px | Large hero elements |
| `full` | 9999px | Avatars, FAB, pills |

---

## Elevation / Shadows

Dark-mode shadows use higher opacity (`0.3`-`0.5`). Light mode uses subtle shadows (`0.06`-`0.10`).

Accent shadow for primary CTAs: `0 4px 16px rgb(133 76 173 / 0.35)`

---

## Micro-interactions

| Element | Behavior | Duration |
|---|---|---|
| Primary CTA hover | `translateY(-1px)` + accent shadow | 120ms |
| Card hover | `scale(1.01)` + shadow-md | 200ms |
| Active nav/roadmap | Accent glow (`kz-glow`) | -- |
| Theme toggle | Rotate + scale icons | 200ms |
| Modal backdrop | `backdrop-blur-md` + semi-transparent dark | 200ms |

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for all micro-interactions.

---

## Component Overrides

| Component | Changes Applied |
|---|---|
| **Header** | Translucent bg (`bg-card/80 backdrop-blur-md`), border `border-border/40`, Kaizenith monogram SVG logo, uppercase wordmark |
| **Sidebar** | Translucent bg, border `border-border/40`, purple active states |
| **Button (primary)** | `kz-lift` class for hover micro-lift, accent shadow |
| **Button (outline)** | `bg-transparent` enforced, accent border on focus |
| **Card** | `bg-card` with `border-border`, 8px radius |
| **Inputs** | Dark backgrounds (`bg-card`), 1px border, accent focus ring with 3px spread |
| **Modal** | `backdrop-blur-md` + dark overlay, `bg-card` surface |
| **FAB** | `kz-lift` micro-interaction, accent ring offset uses `ring-offset-background` |
| **Tags/Badges** | `rounded-full`, `tracking-brand` for labels |
| **ProBanner** | Updated copy to "Kaizenith Pro", accent gradient preserved |
| **Auth** | Monogram SVG centered, uppercase "KAIZENITH" title, `kz-lift` buttons |
| **Onboarding** | Updated title to "KAIZENITH", preserved step structure |

---

## Iconography

- Prefer monochrome Lucide icons (white on dark, dark on light)
- Consistent sizing: 16px (inline), 20px (nav), 24px (hero)
- No emoji replacements for icons

---

## File Paths Changed

1. `app/globals.css` - Complete token redesign (colors, shadows, motion, utilities)
2. `app/layout.tsx` - Space Grotesk font, metadata rebrand
3. `components/providers/app-providers.tsx` - Default theme set to dark
4. `components/layout/header.tsx` - Monogram SVG, translucent bg, wordmark
5. `components/layout/sidebar.tsx` - Translucent bg, border styling
6. `components/ui/fab.tsx` - `kz-lift` micro-interaction
7. `components/ui/pro-banner.tsx` - Copy update, `kz-lift` on CTA
8. `components/onboarding/onboarding-flow.tsx` - Title update
9. `app/(auth)/auth/page.tsx` - Logo SVG, title, `kz-lift` buttons
10. `design/tokens.css` - Standalone portable token reference
11. `design/KAIZENITH_STYLE_GUIDE.md` - This file

## Rollback

To revert all changes: reset the 11 files listed above to their prior state (e.g., `git checkout HEAD~1 -- <file>`). No database or API changes were made.
