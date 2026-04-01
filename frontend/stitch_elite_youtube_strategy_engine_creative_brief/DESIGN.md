# Design System Specification: High-Fidelity Tactical Intelligence

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Instrument"**

This design system is not a collection of web pages; it is a high-performance tactical interface designed for elite creators. It rejects the "template" aesthetic in favor of a cinematic, functional instrument—reminiscent of high-end aerospace HUDs or professional color-grading suites. 

To achieve a "Vercel/Linear" level of polish, we move beyond the flat grid. We utilize **intentional asymmetry**, where data-heavy modules are balanced by expansive negative space, and **tonal depth**, where elements are not "on top" of a background, but rather "emerging" from the shadows. The interface should feel like a matte charcoal obsidian monolith, illuminated by high-precision laser pulses.

---

## 2. Colors & Surface Architecture

The palette is rooted in the depth of `surface` (#131313) and `surface_container_lowest` (#0E0E0E), creating a "Stealth Tech" foundation that allows the `primary` (#FFB4A8) and `secondary` accents to feel like light-emitting diodes.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Layout boundaries must be defined through:
*   **Background Shifts:** Use `surface_container_low` (#1C1B1B) against a `surface` (#131313) background.
*   **Spectral Transitions:** Use a 1px "Ghost Border" (see Section 4) or a subtle gradient bleed.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers. Each layer deeper into the logic (e.g., a modal inside a panel inside a page) should shift in tonal value:
*   **Base Layer:** `surface` (#131313)
*   **Sectional Containers:** `surface_container_low` (#1C1B1B)
*   **Interactive Cards:** `surface_container` (#201F1F)
*   **High-Intensity Modules:** `surface_container_high` (#2A2A2A)

### The Glass & Gradient Rule
To achieve cinematic depth, use `surface_bright` (#3A3939) with a `backdrop-filter: blur(20px)` at 40% opacity for floating navigation or overlays. This "High-Refraction Blur" ensures the UI feels integrated into a 3D space rather than flatly pasted.

---

## 3. Typography: Tactical Precision

The typography system is a juxtaposition of aggressive authority and hyper-precise data readout.

*   **The Aggressor (Display & Headline):** `Space Grotesk Bold`. Use this for high-level YouTube strategy metrics and section titles. The wide stance and geometric tension convey dominance and "Elite" positioning.
*   **The Operator (Title, Body, Labels):** `Inter` or `Geist`. This is for the "functional instrument" aspect. Use `label-sm` (0.6875rem) for technical metadata to mimic the look of high-end hardware labels.

**Hierarchy Strategy:**
*   **Display LG (3.5rem):** Reserved for singular, "North Star" metrics (e.g., Projected Views).
*   **Headline SM (1.5rem):** Used for module headers, always in `Space Grotesk`.
*   **Label MD (0.75rem):** Used for micro-copy and data captions, often set to `uppercase` with `letter-spacing: 0.05em`.

---

## 4. Elevation & Depth

### The Layering Principle
Forget drop shadows for standard components. Depth is achieved via **Tonal Layering**. Place a `surface_container_lowest` card inside a `surface_container_high` module to create a "recessed" or "carved" look, making the data feel embedded in the hardware.

### Ambient Shadows
For floating elements (Modals/Popovers), use a "Laser-Tinted Shadow":
*   **Color:** `#000000` at 40% opacity.
*   **Spread:** Extra-diffused (e.g., `box-shadow: 0 20px 50px rgba(0,0,0,0.5)`).
*   **Secondary Shadow:** Add a 1px inner stroke of `outline_variant` (#603E39) at 10% opacity to define the top edge.

### The "Ghost Border" Fallback
Where separation is critical for accessibility, use a `1px` border using the `outline_variant` token at **15% opacity**. This creates a "micro-border" that only appears under certain light conditions, maintaining the stealth aesthetic.

---

## 5. Components

### Buttons: High-Intent Actions
*   **Primary (Precision Laser):** Solid `secondary_container` (#970100) with `on_secondary` (#690100) text. These should feel like "Launch" buttons. Use `rounded-sm` (0.125rem) for a sharp, technical feel.
*   **Secondary (Tactical):** Glassmorphism style. `surface_variant` at 20% opacity with a 1px Ghost Border. 
*   **States:** On hover, primary buttons should emit a `5px` outer glow using the `primary` (#FFB4A8) color at 20% opacity.

### Input Fields & Search
*   **Base:** `surface_container_lowest` (#0E0E0E).
*   **Active State:** The bottom border transforms into a 1px `primary` pulse. 
*   **Typography:** All user input uses `Inter` to ensure legibility in high-density data environments.

### Cards & Intelligence Modules
*   **Structure:** No dividers. Use `Spacing 8` (1.75rem) to separate content groups.
*   **Spectral Polish:** Add a subtle linear gradient to the background of cards: `linear-gradient(135deg, surface_container, surface_container_lowest)`.

### Chips & Pulse Indicators
*   **Status:** For "Live" or "AI Processing," use the `Precision Laser` red (#FF0000) with a `ping` animation.
*   **Metadata Chips:** `rounded-full`, background `surface_container_highest`, text `label-sm`.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme white space (`Spacing 20` or `24`) between major content blocks to create an "Editorial" feel.
*   **DO** use `surface_container_highest` for hover states on list items to create a "flashlight" effect.
*   **DO** keep corner radii sharp. Use `sm` (0.125rem) or `md` (0.375rem) for most tactical elements.

### Don't
*   **DON'T** use pure white (#FFFFFF). Use `on_surface` (#E5E2E1) to maintain the matte, low-light environment.
*   **DON'T** use standard 1px solid borders to separate sidebar from main content; use a tonal shift from `surface` to `surface_container_low`.
*   **DON'T** use rounded corners (`xl` or `full`) for tactical data cards; keep them sharp (`sm`) to imply precision and technical rigor.