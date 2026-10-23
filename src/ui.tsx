import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { C, shadow } from "./theme";
import { dayKey, startOfDay, weekDays } from "./domain";
import { useNow } from "./useNow";
export { C } from "./theme";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const haptic = (kind: "success" | "tap" = "tap") =>
  void (
    kind === "success"
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  ).catch(() => {});
export function Icon({
  name,
  color = C.primary,
  size = 22,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconTile({
  name,
  color = C.primary,
  background,
  size = 40,
}: {
  name: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: background ?? color + "1F",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} color={color} size={size * 0.5} />
    </View>
  );
}
export type Mood = "happy" | "calm" | "neutral";
/** Pal: a small cat-robot with a glowing visor. */
export function Mascot({
  size = 92,
  mood = "happy",
}: {
  size?: number;
  mood?: Mood;
}) {
  const glow = "#67E8F9";
  const eye = (x: number) =>
    mood === "neutral" ? (
      <Ellipse key={x} cx={x} cy={53} rx={4.5} ry={6} fill={glow} />
    ) : (
      <Path
        key={x}
        d={
          mood === "happy"
            ? `M${x - 5} 56 Q${x} 48 ${x + 5} 56`
            : `M${x - 5} 52 Q${x} 58 ${x + 5} 52`
        }
        stroke={glow}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    );
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityLabel="Pal"
      accessible
    >
      <Ellipse cx={60} cy={113} rx={30} ry={5} fill="#000" opacity={0.12} />
      <Rect x={36} y={74} width={48} height={36} rx={16} fill="#F3F5FA" stroke="#DCE2EE" strokeWidth={1.5} />
      <Ellipse cx={33} cy={92} rx={7} ry={10} fill="#F3F5FA" stroke="#DCE2EE" strokeWidth={1.5} />
      <Ellipse cx={87} cy={92} rx={7} ry={10} fill="#F3F5FA" stroke="#DCE2EE" strokeWidth={1.5} />
      <Circle cx={60} cy={92} r={6} fill={C.primary} />
      <Circle cx={60} cy={92} r={2.5} fill="#BFD0FF" />
      <Path d="M28 42 L35 12 L54 30 Z" fill="#FAFBFE" stroke="#DCE2EE" strokeWidth={1.5} />
      <Path d="M92 42 L85 12 L66 30 Z" fill="#FAFBFE" stroke="#DCE2EE" strokeWidth={1.5} />
      <Path d="M34 34 L37 21 L46 30 Z" fill="#F9A8D4" />
      <Path d="M86 34 L83 21 L74 30 Z" fill="#F9A8D4" />
      <Rect x={22} y={24} width={76} height={58} rx={28} fill="#FAFBFE" stroke="#DCE2EE" strokeWidth={1.5} />
      <Rect x={31} y={36} width={58} height={34} rx={17} fill="#1C2340" />
      {eye(49)}
      {eye(71)}
      <Path d="M56 62 Q60 66 64 62" stroke={glow} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M20 46 Q20 8 60 8 Q100 8 100 46" stroke={C.primary} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Rect x={13} y={42} width={13} height={26} rx={6.5} fill={C.primary} />
      <Rect x={94} y={42} width={13} height={26} rx={6.5} fill={C.primary} />
    </Svg>
  );
}
/** Layered mountain landscape; `night` is the focus-mode variant. */
export function Scene({
  variant = "dawn",
  style,
}: {
  variant?: "dawn" | "night";
  style?: StyleProp<ViewStyle>;
}) {
  const night = variant === "night";
  const id = `sky-${variant}`;
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 360 400" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {(night
              ? [[0, "#0B1430"], [0.55, "#2A2F6B"], [0.8, "#8E5A86"], [1, "#F2996A"]]
              : [[0, "#8FB8FF"], [0.6, "#D6E6FF"], [1, "#FFE6D3"]]
            ).map(([offset, color]) => (
              <Stop key={offset} offset={offset} stopColor={color as string} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="360" height="400" fill={`url(#${id})`} />
        {night ? (
          <>
            {[
              [40, 40], [90, 80], [150, 30], [210, 70], [300, 45], [330, 110], [20, 130], [250, 120], [120, 140],
            ].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="#fff" opacity={0.8} />
            ))}
            <Circle cx={292} cy={86} r={16} fill="#FDF2D8" opacity={0.9} />
          </>
        ) : (
          <>
            <Circle cx={285} cy={200} r={28} fill="#FFF6DD" opacity={0.95} />
            <Ellipse cx={80} cy={170} rx={36} ry={10} fill="#fff" opacity={0.7} />
            <Ellipse cx={230} cy={150} rx={28} ry={8} fill="#fff" opacity={0.6} />
          </>
        )}
        <Path d="M0 300 L60 245 L110 285 L175 220 L235 275 L295 235 L360 285 L360 400 L0 400Z" fill={night ? "#3A3A73" : "#B7CCF2"} />
        <Path d="M0 330 L55 295 L105 318 L165 280 L225 318 L285 290 L360 322 L360 400 L0 400Z" fill={night ? "#272A5A" : "#8FAEE6"} />
        <Path d="M0 372 Q90 340 180 360 T360 356 L360 400 L0 400Z" fill={night ? "#171B40" : "#6E91D6"} />
      </Svg>
    </View>
  );
}
export function Screen({
  children,
  padBottom = 40,
}: {
  children: React.ReactNode;
  padBottom?: number;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={[s.screen, { paddingBottom: padBottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.container}>{children}</View>
    </ScrollView>
  );
}
export function Header({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={[s.row, { marginBottom: 18, minHeight: 48 }]}>
      <Text style={[s.h1, { flex: 1 }]}>{title}</Text>
      {right}
    </View>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  filled = false,
  color = C.ink,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  filled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: filled ? C.primary : "transparent",
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <Icon name={name} color={filled ? C.white : color} size={22} />
    </Pressable>
  );
}
export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        style,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
type ButtonKind = "primary" | "secondary" | "danger" | "glass";
const buttonColors: Record<ButtonKind, { bg: string; fg: string }> = {
  primary: { bg: C.primary, fg: C.white },
  secondary: { bg: C.primaryPale, fg: C.primary },
  danger: { bg: C.dangerPale, fg: C.danger },
  glass: { bg: C.glass, fg: C.white },
};
export function Button({
  label,
  onPress,
  kind = "primary",
  disabled = false,
  icon,
  busy = false,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  icon?: IconName;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { bg, fg } = buttonColors[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg },
        kind === "primary" && shadow,
        (disabled || busy) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        icon && <Icon name={icon} color={fg} size={20} />
      )}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
  color = C.primary,
  icon,
  dark = false,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: IconName;
  dark?: boolean;
}) {
  const fg = selected ? C.white : dark ? C.white : color;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        s.chip,
        {
          backgroundColor: selected ? color : dark ? C.glass : color + "14",
          borderColor: selected ? color : dark ? C.glassLine : color + "33",
        },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      {icon && <Icon name={icon} color={fg} size={16} />}
      <Text style={{ fontSize: 14, fontWeight: "600", color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Pill({
  label,
  color,
  background,
  icon,
}: {
  label: string;
  color: string;
  background?: string;
  icon?: IconName;
}) {
  return (
    <View
      style={[
        s.row,
        {
          gap: 5,
          alignSelf: "flex-start",
          backgroundColor: background ?? color + "1A",
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
      ]}
    >
      {icon && <Icon name={icon} color={color} size={13} />}
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={[
        s.row,
        { gap: 4, backgroundColor: "#EEF1F7", borderRadius: 14, padding: 4, marginBottom: 18 },
      ]}
    >
      {options.map((o) => (
        <Pressable
          key={o}
          accessibilityRole="tab"
          accessibilityState={{ selected: o === value }}
          onPress={() => {
            haptic();
            onChange(o);
          }}
          style={[
            {
              flex: 1,
              minHeight: 40,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
            },
            o === value && [{ backgroundColor: C.primary }, shadow],
          ]}
        >
          <Text style={{ fontWeight: "700", color: o === value ? C.white : C.muted }}>
            {o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
/** Round checkbox that pops and buzzes when ticked. */
export function Check({
  done,
  onPress,
  color = C.primary,
  size = 26,
}: {
  done: boolean;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      hitSlop={12}
      onPress={() => {
        Animated.sequence([
          Animated.timing(scale, { toValue: 0.7, duration: 80, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start();
        if (!done) haptic("success");
        onPress();
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          backgroundColor: done ? color : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done && <Ionicons name="checkmark" size={size * 0.65} color={C.white} />}
      </Animated.View>
    </Pressable>
  );
}
export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 8, marginBottom: 18 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label ?? props.placeholder}
        placeholderTextColor={C.faint}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Empty({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, gap: 14 }}>
      <Mascot size={110} mood="neutral" />
      <Text style={s.h2}>{title}</Text>
      {action}
    </View>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <View style={[s.row, { gap: 8, marginBottom: 14 }]} accessibilityRole="alert">
      <Icon name="alert-circle" color={C.danger} size={18} />
      <Text style={{ color: C.danger, fontSize: 15, fontWeight: "600" }}>
        {message}
      </Text>
    </View>
  ) : null;
}
export function ProgressBar({
  value,
  color = C.primary,
  track = "#E9EDF5",
  height = 8,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: "hidden" }}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`,
        }}
      />
    </View>
  );
}
/** Circular progress; `progress` runs 0 → 1. */
export function Ring({
  progress,
  size = 260,
  stroke = 10,
  color = C.primary,
  track = C.primaryPale,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - Math.min(1, Math.max(0, progress)))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add task"
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        {
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 22,
          backgroundColor: C.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        shadow,
        { shadowOpacity: 0.3, shadowColor: C.primary },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Icon name="add" color={C.white} size={30} />
    </Pressable>
  );
}
const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Month label + one swipeable-by-arrow week; dots mark busy days. */
export function WeekStrip({
  selected,
  onSelect,
  marks,
}: {
  selected: number;
  onSelect: (day: number) => void;
  marks: Set<string>;
}) {
  const today = dayKey(useNow());
  const days = weekDays(selected);
  const shift = (n: number) => {
    const d = new Date(selected);
    d.setDate(d.getDate() + n);
    onSelect(startOfDay(d.getTime()));
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={[s.row, { marginBottom: 10 }]}>
        <Text style={[s.h3, { flex: 1 }]}>
          {new Date(selected).toLocaleDateString([], { month: "short", year: "numeric" })}
        </Text>
        <IconButton name="chevron-back" label="Previous week" onPress={() => shift(-7)} color={C.muted} />
        <IconButton name="chevron-forward" label="Next week" onPress={() => shift(7)} color={C.muted} />
      </View>
      <View style={[s.row, { justifyContent: "space-between", gap: 0 }]}>
        {days.map((day, i) => {
          const key = dayKey(day);
          const active = key === dayKey(selected);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptic();
                onSelect(day);
              }}
              style={{ alignItems: "center", gap: 6, width: 44 }}
            >
              <Text style={{ fontSize: 12, color: C.faint, fontWeight: "600" }}>
                {WEEKDAY[i]}
              </Text>
              <View
                style={[
                  {
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? C.primary : "transparent",
                  },
                  active && shadow,
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: active ? C.white : key === today ? C.primary : C.ink,
                  }}
                >
                  {new Date(day).getDate()}
                </Text>
              </View>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: marks.has(key) ? C.primary : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
export function Stepper({
  value,
  onChange,
  min,
  max,
  format = String,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  format?: (n: number) => string;
}) {
  return (
    <View style={[s.row, { gap: 4 }]}>
      <IconButton name="remove-circle" label="Less" color={value > min ? C.primary : C.line} onPress={() => value > min && onChange(value - 1)} />
      <Text style={[s.h3, { minWidth: 56, textAlign: "center", fontVariant: ["tabular-nums"] }]}>
        {format(value)}
      </Text>
      <IconButton name="add-circle" label="More" color={value < max ? C.primary : C.line} onPress={() => value < max && onChange(value + 1)} />
    </View>
  );
}
export function Row({
  icon,
  color,
  label,
  onPress,
  right,
}: {
  icon: IconName;
  color: string;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        { minHeight: 60, paddingVertical: 8 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <IconTile name={icon} color={color} size={38} />
      <Text style={[s.h3, { flex: 1 }]}>{label}</Text>
      {right ?? (onPress && <Icon name="chevron-forward" color={C.faint} size={18} />)}
    </Pressable>
  );
}
export const time = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const date = (at: number) =>
  new Date(at).toLocaleDateString([], { month: "short", day: "numeric" });
export const s = StyleSheet.create({
  screen: { padding: 20 },
  container: { width: "100%", maxWidth: 680, alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  h1: { fontSize: 28, fontWeight: "800", color: C.ink, letterSpacing: -0.6 },
  h2: { fontSize: 20, fontWeight: "800", color: C.ink, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: "700", color: C.ink },
  body: { fontSize: 15, lineHeight: 22, color: C.muted },
  small: { fontSize: 13, lineHeight: 18, color: C.muted },
  big: { fontSize: 44, fontWeight: "800", color: C.ink, letterSpacing: -1.2 },
  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    gap: 10,
    ...shadow,
  },
  button: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: { fontSize: 14, fontWeight: "700", color: C.ink },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.ink,
    backgroundColor: "#F1F4F9",
  },
  section: { marginTop: 8, marginBottom: 12 },
});
