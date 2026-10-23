import React from "react";
import { Text, View } from "react-native";
import { useStore } from "../src/store";
import { Settings } from "../src/domain";
import { Card, Chip, Row, Screen, Stepper, s } from "../src/ui";
const hour = (h: number) => `${h}:00`;
export default function FocusSettings() {
  const { state, update } = useStore();
  const set = (patch: Partial<Settings>) =>
    void update((v) => ({ ...v, settings: { ...v.settings, ...patch } }));
  const { dayStart, dayEnd, focusMinutes } = state.settings;
  return (
    <Screen>
      <Text style={[s.h2, s.section]}>Session</Text>
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 22 }]}>
        {[15, 25, 45, 60, 90].map((m) => (
          <Chip key={m} label={`${m}m`} icon="timer-outline" selected={focusMinutes === m} onPress={() => set({ focusMinutes: m })} />
        ))}
      </View>
      <Text style={[s.h2, s.section]}>Study Hours</Text>
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
