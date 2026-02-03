# Responsive Fix Report

## Root cause
- Mobile menu styles were limited to <=899px while the burger remains visible at 900–1099px, so the menu opened in JS but stayed hidden in CSS.
- A nested selector inside a `@media (min-width: 900px)` block produced invalid CSS in some browsers, causing partial rule drops on smaller widths.

## Fixes
- Expanded mobile menu CSS coverage to <=1099px and kept desktop nav for >=1100px.
- Restored valid CSS structure by moving `.kg-hero-accent` into its own rule inside the 900px+ media query.
- Added explicit <=899px burger styling to keep the control visible and interactive on mobile.
- Updated Playwright visual coverage list to match the required breakpoint set.

## Verification
- Viewports covered: 360x800, 390x800, 428x900, 480x900, 768x1024, 834x1112, 899x1000, 900x1000, 937x1020, 1024x900, 1099x900, 1100x900, 1200x900, 1410x1007.
- Command: start local server (for example python3 -m http.server 8088) then run npm run visual:test.
- Outputs: screenshots and metrics JSON in tests/artifacts/after; console echoes VISUAL_METRICS for quick inspection.
