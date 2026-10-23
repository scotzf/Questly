import React from "react";
import { Pressable, Text, View } from "react-native";
import { shadow } from "./theme";
import { C, Icon, IconName, IconTile, haptic, s } from "./ui";
export const GOALS: [string, number, IconName, string][] = [
  ["Casual", 10, "leaf", "#10B981"],
  ["Regular", 30, "walk", "#3B82F6"],
  ["Serious", 50, "bicycle", "#8B5CF6"],
  ["Intense", 80, "rocket", "#EF4444"],
];
export function GoalPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {GOALS.map(([label, xp, icon, color]) => {
        const on = value === xp;
        return (
          <Pressable
            key={xp}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              haptic();
              onChange(xp);
            }}
            style={({ pressed }) => [
              s.row,
              {
                backgroundColor: C.white,
                borderRadius: 18,
                padding: 14,
                borderWidth: 2,
                borderColor: on ? color : "transparent",
              },
              shadow,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <IconTile name={icon} color={color} size={42} />
            <Text style={[s.h3, { flex: 1 }]}>{label}</Text>
            <Text style={[s.h3, { color: on ? color : C.faint }]}>{xp} XP</Text>
            {on && <Icon name="checkmark-circle" color={color} />}
          </Pressable>
        );
      })}
    </View>
  );
}
