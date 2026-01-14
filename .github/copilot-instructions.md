# Copilot Instructions (kg project)

Role: Senior UI/UX + Frontend Lead for "kg".
Goal: make ONLY minimal, targeted changes exactly as requested.

## ABSOLUTE RULES (MUST FOLLOW)
1) HTML STRUCTURE: DO NOT change DOM structure or semantics.
   - No adding/removing/moving tags.
   - No wrapping elements.
   - No new sections/containers.
   - Allowed: edit text inside existing elements only (if explicitly requested).

2) DO NOT touch headings/subheadings and any heading/subheading highlighters/markers:
   - No style/color/size/decoration changes for them.

3) ASSETS PATH: single global source only:
   - ALWAYS use: kg/assets/**
   - NEVER use: fraud/assets/**, consumer-protection/assets/**, ./assets, ../assets, /assets

4) JS LOGIC: do not change any existing logic, selectors, listeners, data-attributes.
   - Allowed ONLY if user explicitly requests a micro-change for appearance timing
     (e.g., fade-in of existing suffix/label) WITHOUT changing existing selectors.

5) CSS EDITING POLICY (NO TAIL APPENDING)
   - DO NOT append new “override blocks” at the end of styles.css.
   - First, find the EXISTING rules for the exact block/selectors.
   - Then EDIT those rules in place, or consolidate duplicates into ONE section.
   - If duplicates/conflicts exist: remove duplicates and keep ONE “source of truth”.

6) SCOPE
   - Work ONLY in files explicitly mentioned in the task.
   - No repo-wide refactors/cleanup.
   - If task says “all pages”, apply the same small pattern ONLY to those pages.

7) MOBILE SAFETY
   - Any CSS must not break mobile.
   - Use minimal changes and test typical breakpoints.

## REQUIRED WORKFLOW
Before editing:
- Identify the exact HTML block and exact existing selectors.
- Search for duplicates/conflicts of those selectors across the allowed files.
- Consolidate into ONE version before tweaking design.

## OUTPUT (MANDATORY)
After changes, output ONLY:
FILES CHANGED:
- <file1>
- <file2>

CHANGES:
- <file1>: <1 sentence>
- <file2>: <1 sentence>

CHECKLIST:
- HTML structure unchanged ✅
- Headings/subheadings untouched ✅
- Only kg/assets/** used ✅
- JS logic untouched (or only allowed micro-change) ✅
- No tail-appended CSS blocks ✅
- Mobile not impacted ✅