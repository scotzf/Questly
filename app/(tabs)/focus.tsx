import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { useStore } from "../../src/store";
import { elapsed, remaining, sortTasks } from "../../src/domain";
import { CATEGORIES } from "../../src/theme";
import {
  Button,
  C,
  Chip,
  ErrorText,
  Icon,
  IconName,
  Mascot,
  Ring,
  Scene,
  haptic,
  s,
} from "../../src/ui";
import { useNow } from "../../src/useNow";
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const DURATIONS = [5, 15, 25, 45, 60, 90];
const white = { color: C.white };
function GlassButton({
  icon,
  label,
  onPress,
  big = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  big?: boolean;
}) {
  const size = big ? 76 : 58;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: big ? C.white : C.glass,
        borderWidth: big ? 0 : 1,
        borderColor: C.glassLine,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      {icon === "add" ? (
        <Text style={{ color: C.white, fontWeight: "800", fontSize: 16 }}>+5</Text>
      ) : (
        <Icon name={icon} color={big ? C.night : C.white} size={big ? 32 : 24} />
      )}
    </Pressable>
  );
}
export default function Focus() {
  const { taskId, minutes: requested } = useLocalSearchParams<{
    taskId?: string;
    minutes?: string;
  }>();
  const { state, update } = useStore();
  const [selected, setSelected] = useState(taskId ?? "");
  const [minutes, setMinutes] = useState(
    Number(requested ?? state.settings.focusMinutes),
  );
  const now = useNow(1000);
  const focused = useIsFocused();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(false);
  const [note, setNote] = useState("");
  const [stepDone, setStepDone] = useState(false);
  const [finished, setFinished] = useState<number | null>(null);
  // New route params (e.g. "Start" from another screen) reset the setup.
  const [params, setParams] = useState({ taskId, requested });
  if (params.taskId !== taskId || params.requested !== requested) {
    setParams({ taskId, requested });
    if (taskId) setSelected(taskId);
    if (requested) setMinutes(Number(requested));
    setFinished(null);
  }
  const timer = state.timer;
  const active = sortTasks(state.tasks.filter((t) => !t.completedAt));
  const task = timer
    ? state.tasks.find((t) => t.id === timer.taskId)
    : (active.find((t) => t.id === selected) ?? active[0]);
  const color = task ? CATEGORIES[task.category].color : C.primary;
  const left = timer ? remaining(timer, now) : 0;
  const reviewing = !!timer && (summary || left === 0);
  const currentStep = task?.steps.find((s) => s.id === timer?.stepId);
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    if (!task) return;
    await run(async () => {
      const t = Date.now();
      await update((v) => {
        if (v.timer) throw new Error("An active timer already exists");
        return {
          ...v,
          timer: {
            id: Crypto.randomUUID(),
            taskId: task.id,
            stepId: task.steps.find((s) => !s.done)?.id ?? null,
            plannedSeconds: minutes * 60,
            remainingSeconds: minutes * 60,
            endsAt: t + minutes * 60000,
            startedAt: t,
          },
        };
      });
      haptic("success");
      setSummary(false);
      setFinished(null);
      setNote("");
      setStepDone(false);
    });
  }
  /** Pauses when running, resumes when paused. */
  function toggle() {
    return run(() =>
      update((v) => ({
        ...v,
        timer: v.timer
          ? {
              ...v.timer,
              remainingSeconds: remaining(v.timer),
              endsAt:
                v.timer.endsAt === null
                  ? Date.now() + v.timer.remainingSeconds * 1000
                  : null,
            }
          : null,
      })),
    );
  }
  function extend() {
    return run(() =>
      update((v) => ({
        ...v,
        timer: v.timer
          ? {
              ...v.timer,
              plannedSeconds: v.timer.plannedSeconds + 300,
              remainingSeconds: v.timer.remainingSeconds + 300,
              endsAt: v.timer.endsAt === null ? null : v.timer.endsAt + 300000,
            }
          : null,
      })),
    );
  }
  async function review() {
    if (!timer) return;
    await run(async () => {
      await update((v) => ({
        ...v,
        timer: v.timer
          ? { ...v.timer, remainingSeconds: remaining(v.timer), endsAt: null }
          : null,
      }));
      setSummary(true);
    });
  }
  async function keepGoing() {
    await toggle();
    setSummary(false);
  }
  async function finish() {
    if (!timer) return;
    const seconds = elapsed(timer);
    await run(async () => {
      await update((v) => {
        if (!v.timer || v.sessions.some((s) => s.id === timer.id)) return v;
        return {
          ...v,
          timer: null,
          sessions: [
            ...v.sessions,
            {
              id: timer.id,
              taskId: timer.taskId,
              seconds,
              endedAt: Date.now(),
              note: note.trim(),
            },
          ],
          tasks: v.tasks.map((t) =>
            t.id === timer.taskId && stepDone
              ? {
                  ...t,
                  updatedAt: Date.now(),
                  steps: t.steps.map((s) =>
                    s.id === timer.stepId ? { ...s, done: true } : s,
                  ),
                }
              : t,
          ),
        };
      });
      haptic("success");
      setSummary(false);
      setFinished(seconds);
    });
  }
  const ringValue = timer
    ? reviewing
      ? elapsed(timer, now)
      : left
    : minutes * 60;
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <StatusBar style={focused ? "light" : "dark"} />
      <Scene variant="night" />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.screen, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
          <View style={[s.container, { flexGrow: 1 }]}>
            <View style={[s.row, { marginBottom: 14 }]}>
              <Text style={[s.h1, white, { flex: 1 }]}>Focus Mode</Text>
              {!timer && task && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Stuck?"
                  onPress={() => router.push({ pathname: "/rescue", params: { taskId: task.id } })}
                  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                >
                  <Icon name="heart-outline" color={C.white} />
                </Pressable>
              )}
            </View>
            {!timer && finished === null && active.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {active.map((t) => (
                  <Chip
                    key={t.id}
                    dark
                    label={t.title}
                    icon={CATEGORIES[t.category].icon}
                    color={CATEGORIES[t.category].color}
                    selected={t.id === task?.id}
                    onPress={() => setSelected(t.id)}
                  />
                ))}
              </ScrollView>
            )}
            {timer && task && (
              <View style={{ alignSelf: "center" }}>
                <Chip dark label={task.title} icon={CATEGORIES[task.category].icon} color={color} />
              </View>
            )}
            <ErrorText message={error} />
            {finished !== null && !timer ? (
              <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
                <Mascot size={150} mood="happy" />
                <Text style={[s.big, white, { fontSize: 56 }]}>
                  +{Math.max(1, Math.round(finished / 60))}m
                </Text>
                <Icon name="checkmark-circle" color={C.success} size={36} />
                <View style={{ alignSelf: "stretch", gap: 12, marginTop: 20 }}>
                  <Button label="Home" icon="home" onPress={() => router.replace("/(tabs)")} />
                  <Button kind="glass" label="Again" icon="refresh" onPress={() => setFinished(null)} />
                </View>
              </View>
            ) : !task ? (
              <View style={{ alignItems: "center", paddingVertical: 60, gap: 18 }}>
                <Mascot size={140} mood="neutral" />
                <Button label="Add task" icon="add" onPress={() => router.push("/quick-add")} />
              </View>
            ) : (
              <>
                <View style={{ alignItems: "center", paddingTop: 26, paddingBottom: 6 }}>
                  <Ring
                    progress={timer ? (reviewing ? 1 : 1 - left / timer.plannedSeconds) : 0}
                    size={260}
                    stroke={9}
                    color={color}
                    track={C.glass}
                  >
                    {timer?.endsAt === null && !reviewing && (
                      <Text style={[s.small, white, { fontWeight: "800", letterSpacing: 2 }]}>PAUSED</Text>
                    )}
                    <Text
                      accessibilityRole="timer"
                      style={{ fontSize: 62, fontWeight: "300", color: C.white, fontVariant: ["tabular-nums"] }}
                    >
                      {clock(ringValue)}
                    </Text>
                    {currentStep && !reviewing && (
                      <Text style={[s.small, { color: "#C7D2FE", maxWidth: 180, textAlign: "center" }]} numberOfLines={1}>
                        {currentStep.title}
                      </Text>
                    )}
                  </Ring>
                  <View style={{ marginTop: -10 }}>
                    <Mascot size={110} mood={reviewing ? "happy" : timer ? "calm" : "neutral"} />
                  </View>
                </View>
                {reviewing && timer ? (
                  <View style={{ gap: 12 }}>
                    {currentStep && !currentStep.done && (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: stepDone }}
                        onPress={() => setStepDone(!stepDone)}
                        style={[s.row, { backgroundColor: C.glass, borderRadius: 16, padding: 14 }]}
                      >
                        <Icon name={stepDone ? "checkmark-circle" : "ellipse-outline"} color={stepDone ? C.success : C.white} />
                        <Text style={[s.h3, white, { flex: 1 }]}>{currentStep.title}</Text>
                      </Pressable>
                    )}
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="Note"
                      placeholderTextColor="#A5B4FC"
                      multiline
                      maxLength={2000}
                      style={[s.input, { backgroundColor: C.glass, color: C.white, minHeight: 70, textAlignVertical: "top" }]}
                    />
                    <Button label="Save" icon="checkmark" busy={busy} onPress={() => void finish()} />
                    {left > 0 && (
                      <Button kind="glass" label="Keep going" icon="play" disabled={busy} onPress={() => void keepGoing()} />
                    )}
                  </View>
                ) : timer ? (
                  <View style={[s.row, { justifyContent: "center", gap: 28, marginTop: 8 }]}>
                    <GlassButton icon="add" label="Add 5 minutes" onPress={() => void extend()} />
                    <GlassButton
                      big
                      icon={timer.endsAt === null ? "play" : "pause"}
                      label={timer.endsAt === null ? "Resume" : "Pause"}
                      onPress={() => void toggle()}
                    />
                    <GlassButton icon="stop" label="Finish" onPress={() => void review()} />
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    <View style={[s.row, { flexWrap: "wrap", justifyContent: "center", gap: 8 }]}>
                      {DURATIONS.map((n) => (
                        <Chip key={n} dark label={`${n}m`} color={color} selected={minutes === n} onPress={() => setMinutes(n)} />
                      ))}
                    </View>
                    <Button label="Start" icon="play" busy={busy} onPress={() => void start()} />
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
