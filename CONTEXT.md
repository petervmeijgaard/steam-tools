# Steam Tools

A site of small tools for working with Steam artwork. Each tool takes something the user already has and produces something Steam can display.

## Language

**Grid**:
The 600×900, 2:3 image a tool produces for a game's library tile. It is the same asset Valve calls the Library Capsule, which is what Big Picture mode and the desktop library display. The name comes from SteamGridDB, where this is the "Steam Vertical" grid.
_Avoid_: capsule, library asset, cover, cover art, box art

**Artwork**:
The image a user supplies to be composited into a grid. It may be a game's existing art, a screenshot, a render, or anything else — the tool does not know or care which.
_Avoid_: cover art, capsule, source image, upload

**Template**:
A 600×900 decorative image shipped with the tool. It has one Slot, and the artwork shows through its transparent regions. It never carries text, a logo, or a badge.
_Avoid_: frame, layout, skin, overlay

**Slot**:
The axis-aligned rectangle, in grid pixels measured from the top-left, inside the grid, where a template places artwork. Artwork is fitted into the Slot, not into the whole grid. A template has one.
_Avoid_: portal, place, hole, window, viewport, frame

**Fit**:
How artwork is scaled into a Slot when its own aspect ratio differs. Either it fills the Slot and the overflow is cropped, or it fits entirely inside the Slot and the uncovered pixels stay transparent.
_Avoid_: resize, scale mode, crop mode
