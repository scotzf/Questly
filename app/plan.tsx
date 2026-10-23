import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../src/store";
import { proposePlan } from "../src/domain";
import { CATEGORIES } from "../src/theme";
import {
  Pill,
  Button,
  C,
  Card,
  Empty,
  ErrorText,
  Icon,
  Screen,
  s,
  time,
} from "../src/ui";
export default function Plan() {
  const { state, update } = useStore();
  const plan = useMemo(() => proposePlan(state), [state]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setBusy(true);
    try {
      if (plan.slots.some((x) => x.start < Date.now() - 60000)) {
        setError("Plan is out of date. Reopen it.");
        return;
      }
      await update((v) => ({
        ...v,
        slots: [...v.slots.filter((x) => x.start < Date.now()), ...plan.slots],
      }));
      router.back();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={[s.row, { marginBottom: 20 }]}>
        <Pill
          icon="time-outline"
          color={C.primary}
          label={`${state.settings.dayStart}:00 – ${state.settings.dayEnd}:00`}
        />
      </View>
      {plan.slots.map((slot) => {
        const task = state.tasks.find((t) => t.id === slot.taskId);
        const cat = CATEGORIES[task?.category ?? "growth"];
        return (
          <View key={slot.id} style={[s.row, { marginBottom: 10, alignItems: "stretch" }]}>
            <Text style={[s.small, { width: 62, paddingTop: 14, fontWeight: "600" }]}>
              {time(slot.start)}
            </Text>
            <View
              style={[
                s.row,
                {
                  flex: 1,
                  backgroundColor: cat.pale,
                  borderRadius: 16,
                  padding: 14,
                  borderLeftWidth: 4,
                  borderLeftColor: cat.color,
                },
              ]}
            >
              <Icon name={cat.icon} color={cat.color} size={18} />
              <Text style={[s.h3, { flex: 1 }]} numberOfLines={1}>
                {task?.title}
              </Text>
              <Text style={s.small}>{(slot.end - slot.start) / 60000}m</Text>
            </View>
          </View>
        );
      })}
      {plan.unplanned.map((u) => (
        <Pressable
          key={u.taskId}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/task/[id]", params: { id: u.taskId } })
          }
        >
          <Card style={{ backgroundColor: C.warningPale, borderWidth: 0 }}>
            <View style={s.row}>
              <Icon name="alert-circle-outline" color={C.gold} />
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>
                  {state.tasks.find((t) => t.id === u.taskId)?.title}
                </Text>
                <Text style={s.small}>
                  {u.reason} · {u.minutes} min left over
                </Text>
              </View>
              <Icon name="chevron-forward" color={C.muted} />
            </View>
          </Card>
        </Pressable>
      ))}
      {!plan.slots.length && !plan.unplanned.length && (
        <Empty title="All planned" />
      )}
      <ErrorText message={error} />
      {plan.slots.length > 0 && (
        <Button
          label="Use this plan"
          icon="checkmark"
          busy={busy}
          onPress={() => void accept()}
        />
      )}
    </Screen>
  );
}
