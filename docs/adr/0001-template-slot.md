# A template places artwork in a declared Slot

Templates used to be transparent overlays. Artwork was fitted to the whole 600×900 grid, and the tool did not know where a template was transparent, so it could not place artwork into a window that was not the full grid. Each template now has one Slot, an axis-aligned rectangle in grid pixels. Artwork is fitted into the Slot. The template is painted over the grid and may overlap the Slot's edge. Positioning uses the Slot, not the template's transparency.

The template image is a PNG file shipped with the tool, not an image drawn in code. Each template also has configuration that places its Slot inside that PNG. Adding a template is adding the file and that configuration.

Inferring the hole from alpha was rejected because alpha has no aspect to fit to. A mask or a non-rectangular hole was rejected because fit and pan stop being obvious.

Border and Corners stay as choices, but they take the same shape as every other template: a PNG file plus configuration for the Slot, not pixels drawn in code. There is one compositing path. Border's Slot is its inner opening. Corners' Slot is the full grid. Fit and pan target the Slot. A transparent window that does not match its Slot is an authoring mistake; the tool does not reconcile the two. A Slot does not allow text, a logo, or a badge on a template. That exclusion stands so a grid stays safe to use, even though a rectangle could have held a logo. Pixels of a Slot that the artwork does not cover stay transparent. There is no backing and no flat fill.
