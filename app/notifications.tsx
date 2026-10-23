import React, { useState } from "react";
import { Linking, Platform, Switch, Text } from "react-native";
import { useStore } from "../src/store";
import { Settings } from "../src/domain";
import { requestReminders } from "../src/reminders";
import { Button, C, Card, Empty, Row, Screen, Stepper, s } from "../src/ui";
const hour = (h: number) => `${h}:00`;
const TYPES: [keyof Settings["notify"], string, string, React.ComponentProps<typeof Row>["icon"]][] = [
  ["tasks", "Task reminders", "#3B82F6", "alarm"],
  ["deadlines", "Deadlines", "#EF4444", "flag"],
  ["focus", "Focus sessions", "#10B981", "timer"],
  ["daily", "Daily summary", "#8B5CF6", "today"],
];
export default function Notifications() {
  const { state, update } = useStore();
  const [denied, setDenied] = useState(false);
  const set = (patch: Partial<Settings>) =>
    void update((v) => ({ ...v, settings: { ...v.settings, ...patch } }));
  if (Platform.OS === "web") return <Empty title="Phone only" />;
  const on = state.settings.reminders;
  return (
    <Screen>
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Row
          icon="notifications"
          color={C.primary}
          label="Reminders"
          right={
            <Switch
              accessibilityLabel="Reminders"
              value={on}
              trackColor={{ true: C.primary, false: C.line }}
              onValueChange={async (next) => {
                setDenied(false);
                if (next && !(await requestReminders())) {
                  setDenied(true);
                  return;
                }
                set({ reminders: next });
              }}
            />
          }
        />
      </Card>
      {denied && (
        <Button
          kind="secondary"
          icon="settings-outline"
          label="Allow in settings"
          onPress={() => void Linking.openSettings().catch(() => {})}
          style={{ marginBottom: 14 }}
        />
      )}
      {on && (
        <>
          <Card style={{ gap: 0, paddingVertical: 6 }}>
            {TYPES.map(([key, label, color, icon]) => (
              <Row
                key={key}
                icon={icon}
                color={color}
                label={label}
                right={
                  <Switch
                    accessibilityLabel={label}
                    value={state.settings.notify[key]}
                    trackColor={{ true: C.primary, false: C.line }}
                    onValueChange={(v) => set({ notify: { ...state.settings.notify, [key]: v } })}
                  />
                }
              />
            ))}
          </Card>
          <Text style={[s.h2, s.section]}>Quiet Hours</Text>
          <Card style={{ gap: 0, paddingVertical: 6 }}>
            <Row
              icon="moon"
              color="#6366F1"
              label="From"
              right={<Stepper value={state.settings.quietStart} min={0} max={23} format={hour} onChange={(n) => set({ quietStart: n })} />}
            />
            <Row
              icon="sunny"
              color="#F59E0B"
              label="To"
              right={<Stepper value={state.settings.quietEnd} min={0} max={23} format={hour} onChange={(n) => set({ quietEnd: n })} />}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
