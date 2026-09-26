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
A 600×900 image with transparent regions, shipped with the tool, through which the artwork shows. It is decorative only: a border, gradient, texture, or vignette — never text, a logo, or a badge, so the resulting grid stays within Steamworks' asset rules.
_Avoid_: frame, layout, skin, overlay

**Fit**:
How artwork is scaled into the grid's 2:3 frame when its own aspect ratio differs. Either it fills the frame and the overflow is cropped, or it fits entirely inside the frame and the gaps are left empty.
_Avoid_: resize, scale mode, crop mode
