import React from "react";
import { Text } from "react-native";
import { useStore } from "../src/store";
import { Settings } from "../src/domain";
import { GoalPicker } from "../src/GoalPicker";
import { Card, Row, Screen, Stepper, s } from "../src/ui";
const hour = (h: number) => `${h}:00`;
export default function Goal() {
  const { state, update } = useStore();
  const set = (patch: Partial<Settings>) =>
    void update((v) => ({ ...v, settings: { ...v.settings, ...patch } }));
  const { dayStart, dayEnd, dailyGoal } = state.settings;
  return (
    <Screen>
      <GoalPicker value={dailyGoal} onChange={(n) => set({ dailyGoal: n })} />
      <Text style={[s.h2, s.section, { marginTop: 24 }]}>Study Hours</Text>
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Row
          icon="sunny"
          color="#F59E0B"
          label="Start"
          right={<Stepper value={dayStart} min={0} max={dayEnd - 1} format={hour} onChange={(n) => set({ dayStart: n })} />}
        />
        <Row
          icon="moon"
          color="#6366F1"
          label="End"
          right={<Stepper value={dayEnd} min={dayStart + 1} max={24} format={hour} onChange={(n) => set({ dayEnd: n })} />}
        />
      </Card>
    </Screen>
  );
}
