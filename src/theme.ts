import { Platform, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import type { CategoryId } from "./domain";
type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const C = {
  bg: "#F5F7FB",
  white: "#FFFFFF",
  ink: "#111827",
  muted: "#6B7280",
  faint: "#9CA3AF",
  line: "#E8ECF3",
  primary: "#3366FF",
  primaryPale: "#EAF0FF",
  success: "#22C55E",
  successPale: "#E3F8EA",
  danger: "#EF4444",
  dangerPale: "#FDECEC",
  warning: "#F59E0B",
  warningPale: "#FEF3DC",
  gold: "#F5B301",
  night: "#0E1630",
  glass: "rgba(255,255,255,0.14)",
  glassLine: "rgba(255,255,255,0.22)",
};
export const CATEGORIES: Record<
  CategoryId,
  { label: string; color: string; pale: string; icon: IconName }
> = {
  study: { label: "Study", color: "#8B5CF6", pale: "#F1EBFF", icon: "school" },
  project: { label: "Project", color: "#3B82F6", pale: "#E6F0FF", icon: "folder" },
  journalism: {
    label: "Journalism",
    color: "#EC4899",
    pale: "#FDE8F3",
    icon: "newspaper",
  },
  personal: {
    label: "Personal",
    color: "#10B981",
    pale: "#E3F8EF",
    icon: "person",
  },
  other: { label: "Other", color: "#F59E0B", pale: "#FEF3DC", icon: "pricetag" },
};
export const PRIORITY = {
  Low: { color: "#22C55E" },
  Medium: { color: "#F59E0B" },
  High: { color: "#EF4444" },
} as const;
export const shadow: ViewStyle = Platform.select({
  web: { boxShadow: "0 6px 20px rgba(31,42,68,0.08)" } as ViewStyle,
  default: {
    shadowColor: "#1F2A44",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
})!;
