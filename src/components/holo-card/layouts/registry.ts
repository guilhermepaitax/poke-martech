import type { CardFrame } from "@/lib/value-objects/card";
import type { ComponentType } from "react";
import type { HoloCardFaceProps } from "../holo-card.types";
import { HoloCardBasic } from "./basic";
import { HoloCardEx } from "./ex";

const CARD_LAYOUTS = {
  basic: HoloCardBasic,
  ex: HoloCardEx,
} satisfies Record<CardFrame, ComponentType<HoloCardFaceProps>>;

export { CARD_LAYOUTS };
