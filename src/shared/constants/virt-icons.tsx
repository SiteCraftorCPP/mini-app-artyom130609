import amazing from "@/assets/icon/virts/amazing.jpg";
import arizona from "@/assets/icon/virts/arizona.jpg";
import blackRussia from "@/assets/icon/virts/black-russia.jpg";
import grand from "@/assets/icon/virts/grand.jpg";
import gta from "@/assets/icon/virts/gta.jpg";
import majestic from "@/assets/icon/virts/majestic.jpg";
import matryoshka from "@/assets/icon/virts/matreshka.jpg";
import province from "@/assets/icon/virts/province.jpg";
import radmir from "@/assets/icon/virts/radmir.jpg";

export const VIRTS_ICONS = {
  "black-russia": blackRussia,
  "matryoshka-rp": matryoshka,
  "arizona-rp": arizona,
  "gta-v-rp": gta,
  "majestic-rp": majestic,
  "grand-mobile-rp": grand,
  "province-rp": province,
  "radmir-rp": radmir,
  "amazing-rp": amazing,
} as const;

export type VirtProjectIconKey = keyof typeof VIRTS_ICONS;
