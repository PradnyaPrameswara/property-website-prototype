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
  Mail,
  Phone,
  MapPin,
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
  /** contact pages: email channel glyph */
  email: Mail,
  /** contact pages: phone channel glyph */
  phone: Phone,
  /** contact pages: office/location glyph */
  location: MapPin,
} as const;

export type IconName = keyof typeof iconMap;

// NOTE: brand/social glyphs (`.icon-font-social-media`) are NOT in lucide
// (brand icons were removed in lucide v1) — use `components/site/SocialIcon.astro`
// with inline SVG paths (Simple Icons, CC0) instead.
