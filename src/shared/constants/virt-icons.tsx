import amazing from "@/assets/icon/virts/amazing.webp";
import arizona from "@/assets/icon/virts/arizona.webp";
import blackRussia from "@/assets/icon/virts/black-russia.webp";
import grand from "@/assets/icon/virts/grand.webp";
import gta from "@/assets/icon/virts/gta.webp";
import majestic from "@/assets/icon/virts/majestic.webp";
import matryoshka from "@/assets/icon/virts/matreshka.webp";
import province from "@/assets/icon/virts/Province.webp";
import radmir from "@/assets/icon/virts/radmir.webp";

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
