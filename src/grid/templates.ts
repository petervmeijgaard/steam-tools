import { type Slot } from "./compose-grid.ts";
import gameBoy from "./templates/game-boy.png";
import gameBoyAdvance from "./templates/game-boy-advance.png";
import nintendoDs from "./templates/nintendo-ds.png";
import nintendoGamecube from "./templates/nintendo-gamecube.png";
import playstation from "./templates/playstation.png";
import playstation2 from "./templates/playstation-2.png";
import psp from "./templates/psp.png";
import steam from "./templates/steam.png";
import wii from "./templates/wii.png";
import xbox from "./templates/xbox.png";

export type Template = {
  name: string;
  src: string;
  slot: Slot;
};

/**
 * The platform templates, in picker order. Each Slot is the bounding rectangle
 * of that template's clear opening, measured from the shipped PNG in grid pixels
 * from the top-left. PlayStation 2's Slot is the white strip. Steam is selected
 * when the tool opens.
 */
export const templates: readonly Template[] = [
  { name: "Game Boy", src: gameBoy, slot: { x: 16, y: 112, width: 559, height: 768 } },
  { name: "Game Boy Advance", src: gameBoyAdvance, slot: { x: 14, y: 162, width: 561, height: 718 } },
  { name: "Nintendo DS", src: nintendoDs, slot: { x: 14, y: 162, width: 561, height: 718 } },
  { name: "Nintendo GameCube", src: nintendoGamecube, slot: { x: 14, y: 88, width: 565, height: 792 } },
  { name: "PlayStation", src: playstation, slot: { x: 14, y: 116, width: 561, height: 764 } },
  { name: "PlayStation 2", src: playstation2, slot: { x: 16, y: 112, width: 196, height: 770 } },
  { name: "PSP", src: psp, slot: { x: 13, y: 83, width: 561, height: 797 } },
  { name: "Steam", src: steam, slot: { x: 3, y: 90, width: 580, height: 795 } },
  { name: "Wii", src: wii, slot: { x: 13, y: 53, width: 561, height: 827 } },
  { name: "Xbox", src: xbox, slot: { x: 14, y: 97, width: 561, height: 783 } },
];

const steamTemplate = templates.find((template) => template.name === "Steam");
if (!steamTemplate) throw new Error("Steam template is missing");

export const initialTemplate = steamTemplate;
