import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  HABIT_XP,
  Habit,
  deleteHabit,
  habitDoneOn,
  habitDueOn,
  habitStreak,
  toggleHabit,
} from "./domain";
import { useStore } from "./store";
import { CATEGORIES } from "./theme";
import { confirm } from "./confirm";
import { C, Check, Icon, Pill, s } from "./ui";
const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
/** One habit: today's check-in, scheduled weekdays and its own streak. Long-press to delete. */
export default function HabitRow({ habit, now }: { habit: Habit; now: number }) {
  const { update } = useStore();
  const area = CATEGORIES[habit.category];
  const due = habitDueOn(habit, now);
  const done = habitDoneOn(habit, now);
  const streak = habitStreak(habit, now);
  return (
    <Pressable
      onPress={() => habit.skillId && router.push({ pathname: "/skill/[id]", params: { id: habit.skillId } })}
      onLongPress={() =>
        void confirm("Delete this habit?", "").then((ok) =>
          ok ? update((v) => deleteHabit(v, habit.id)) : undefined,
        )
      }
      style={[s.row, { minHeight: 60, opacity: due || done ? 1 : 0.5 }]}
    >
      {due || done ? (
        <Check done={done} color={area.color} onPress={() => void update((v) => toggleHabit(v, habit.id))} />
      ) : (
        <Icon name="moon-outline" color={C.faint} size={26} />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={[s.h3, done && { color: C.faint, textDecorationLine: "line-through" }]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        <View style={[s.row, { gap: 3 }]}>
          {LETTERS.map((l, i) => (
            <Text
              key={i}
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: habit.days.includes(i) ? area.color : C.line,
                width: 12,
                textAlign: "center",
              }}
            >
              {l}
            </Text>
          ))}
        </View>
      </View>
      {streak > 0 && <Pill label={String(streak)} icon="flame" color="#F97316" />}
      {due && !done && <Text style={[s.small, { color: C.gold, fontWeight: "800" }]}>+{HABIT_XP}</Text>}
    </Pressable>
  );
}
