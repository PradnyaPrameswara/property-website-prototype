/**
 * Icon mapping — BRIX icon-font glyphs → lucide-react (MIGRATION-GUIDE 2.5).
 * The raw site uses 4 proprietary icon fonts whose glyphs are unreadable in
 * code; every icon encountered during component migration is mapped here once
 * and reused. Add entries as new glyphs are identified.
 */
import {
  ArrowUpRight,
  ChevronDown,
  Play,
  Check,
  Plus,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";

export const iconMap = {
  /** `.base-icon-font` inside primary buttons */
  buttonArrow: ArrowUpRight,
  /** `.icon-font-rounded.dropdown-arrow` */
  dropdownArrow: ChevronDown,
  /** video thumbnail play glyph */
  play: Play,
  /** `.filled-icons-font` check marks in feature lists */
  check: Check,
  /** `.circle-button` plus mark */
  plus: Plus,
  /** `.icon-font-social-media` glyphs */
  socialFacebook: Facebook,
  socialInstagram: Instagram,
  socialLinkedin: Linkedin,
  socialYoutube: Youtube,
} as const;

export type IconName = keyof typeof iconMap;
