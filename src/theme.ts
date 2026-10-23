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
  work: { label: "Work", color: "#3B82F6", pale: "#E6F0FF", icon: "briefcase" },
  fitness: { label: "Fitness", color: "#F97316", pale: "#FFEDD5", icon: "barbell" },
  wellness: { label: "Wellness", color: "#14B8A6", pale: "#DDF7F3", icon: "leaf" },
  creative: { label: "Creative", color: "#EC4899", pale: "#FDE8F3", icon: "color-palette" },
  hobbies: { label: "Hobbies", color: "#CA8A04", pale: "#FEF6D8", icon: "game-controller" },
  home: { label: "Home", color: "#10B981", pale: "#E3F8EF", icon: "home" },
  social: { label: "Social", color: "#06B6D4", pale: "#DDF6FB", icon: "people" },
  money: { label: "Money", color: "#65A30D", pale: "#EEF7DF", icon: "cash" },
  growth: { label: "Growth", color: "#6366F1", pale: "#E8E9FD", icon: "trending-up" },
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
