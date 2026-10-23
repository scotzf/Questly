import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import * as Crypto from "expo-crypto";
import { useStore } from "../src/store";
import { CategoryId, Priority, Step, Task, newTask } from "../src/domain";
import { CATEGORIES, PRIORITY } from "../src/theme";
import {
  Button,
  C,
  Chip,
  ErrorText,
  Icon,
  IconButton,
  haptic,
  s,
} from "../src/ui";
import DateField from "../src/DateField";
import type { ScanDraft } from "../src/scan";
import { confirm } from "../src/confirm";
const DURATIONS = [15, 25, 45, 60, 90, 120];
const REMINDERS: [string, number][] = [
  ["At time", 0],
  ["5 min", 5],
  ["15 min", 15],
  ["30 min", 30],
  ["1 hour", 60],
];
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, marginBottom: 22 }}>
      <Text style={s.label}>{title}</Text>
      {children}
    </View>
  );
}
export default function Editor() {
  const { id, title: titleParam, draft: draftParam } = useLocalSearchParams<{
    id?: string;
    title?: string;
    draft?: string;
  }>();
  const { state, update } = useStore();
  const task = state.tasks.find((t) => t.id === id);
  // A scanned screenshot arrives as a prefilled draft (see src/scan.ts).
  const [scanned] = useState(() => (draftParam ? (JSON.parse(draftParam) as ScanDraft) : null));
  const navigation = useNavigation();
  const [title, setTitle] = useState(task?.title ?? scanned?.title ?? titleParam ?? "");
  const [description, setDescription] = useState(task?.description ?? scanned?.description ?? "");
  const [category, setCategory] = useState<CategoryId>(task?.category ?? scanned?.category ?? "study");
  const [dueAt, setDueAt] = useState(task?.dueAt ?? scanned?.dueAt ?? null);
  const [estimate, setEstimate] = useState(task?.estimate ?? 25);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "Medium");
  const [reminder, setReminder] = useState<number | null>(task?.reminder ?? null);
  const [steps, setSteps] = useState<Step[]>(
    () =>
      task?.steps ??
      (scanned?.steps ?? []).map((title) => ({ id: Crypto.randomUUID(), title, done: false })),
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const snapshot = JSON.stringify({ title, description, category, dueAt, estimate, priority, reminder, steps });
  const [original] = useState(snapshot);
  const dirty = snapshot !== original || !!draft.trim() || (!!scanned && !task);
  usePreventRemove((dirty || busy) && !saved, ({ data }) => {
    if (busy) return;
    void confirm("Discard changes?", "").then((ok) => {
      if (ok) navigation.dispatch(data.action);
    });
  });
  useEffect(() => {
    if (saved) router.back();
  }, [saved]);
  function addStep() {
    if (!draft.trim()) return;
    haptic();
    setSteps([...steps, { id: Crypto.randomUUID(), title: draft.trim(), done: false }]);
    setDraft("");
  }
  function move(i: number, by: number) {
    const next = [...steps];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setSteps(next);
  }
  async function save() {
    if (busy) return;
    setError("");
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    if (dueAt && dueAt < Date.now() && !task?.dueAt && !(await confirm("Date has passed", "Keep it?")))
      return;
    setBusy(true);
    try {
      const now = Date.now();
      const allSteps = draft.trim()
        ? [...steps, { id: Crypto.randomUUID(), title: draft.trim(), done: false }]
        : steps;
      const fields = {
        title: title.trim(),
        description: description.trim(),
        category,
        dueAt,
        estimate,
        priority,
        reminder: dueAt ? reminder : null,
        steps: allSteps,
      };
      const next: Task = task
        ? { ...task, ...fields, updatedAt: now }
        : newTask(Crypto.randomUUID(), fields, now);
      await update((v) => ({
        ...v,
        tasks: task ? v.tasks.map((t) => (t.id === task.id ? next : t)) : [...v.tasks, next],
      }));
      haptic("success");
      setSaved(true);
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const cat = CATEGORIES[category];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.row, { paddingHorizontal: 12, paddingVertical: 8 }]}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
        <View style={[s.row, { flex: 1, justifyContent: "center", gap: 6 }]}>
          {scanned && <Icon name="scan" color={C.primary} size={18} />}
          <Text style={s.h3}>{task ? "Edit Task" : "New Task"}</Text>
        </View>
        <Button label="Save" busy={busy} onPress={() => void save()} style={{ minHeight: 40, paddingVertical: 8 }} />
      </View>
      <ScrollView contentContainerStyle={[s.screen, { paddingBottom: 60 }]} keyboardShouldPersistTaps="handled">
        <View style={s.container}>
          <View style={[s.card, { borderLeftWidth: 5, borderLeftColor: cat.color }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Task name"
              placeholderTextColor={C.faint}
              maxLength={160}
              autoFocus={!task}
              style={{ fontSize: 22, fontWeight: "800", color: C.ink, minHeight: 44 }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Notes"
              placeholderTextColor={C.faint}
              multiline
              maxLength={4000}
              style={{ fontSize: 15, color: C.muted, minHeight: 40 }}
            />
          </View>
          <ErrorText message={error} />
          <Section title="Category">
            <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
              {(Object.keys(CATEGORIES) as CategoryId[]).map((c) => (
                <Chip
                  key={c}
                  label={CATEGORIES[c].label}
                  icon={CATEGORIES[c].icon}
                  color={CATEGORIES[c].color}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
          </Section>
          <Section title="Date & Time">
            <DateField value={dueAt} onChange={setDueAt} />
          </Section>
          <Section title="Duration">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DURATIONS.map((m) => (
                <Chip key={m} label={m < 60 ? `${m}m` : `${m / 60}h`.replace(".5h", "h 30m")} selected={estimate === m} onPress={() => setEstimate(m)} />
              ))}
            </ScrollView>
          </Section>
          <Section title="Priority">
            <View style={[s.row, { gap: 8 }]}>
              {(["Low", "Medium", "High"] as const).map((p) => (
                <Chip
                  key={p}
                  label={p}
                  icon="flag"
                  color={PRIORITY[p].color}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                />
              ))}
            </View>
          </Section>
          {dueAt !== null && (
            <View style={[s.card, { gap: 12 }]}>
              <View style={s.row}>
                <Icon name="notifications" color={C.primary} />
                <Text style={[s.h3, { flex: 1 }]}>Reminder</Text>
                <Switch
                  accessibilityLabel="Reminder"
                  value={reminder !== null}
                  trackColor={{ true: C.primary, false: C.line }}
                  onValueChange={(on) => setReminder(on ? 15 : null)}
                />
              </View>
              {reminder !== null && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {REMINDERS.map(([label, m]) => (
                    <Chip key={m} label={label} selected={reminder === m} onPress={() => setReminder(m)} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}
          <Section title={`Subtasks${steps.length ? ` · ${steps.filter((x) => x.done).length}/${steps.length}` : ""}`}>
            <View style={[s.card, { gap: 0, paddingVertical: 6 }]}>
              {steps.map((step, i) => (
                <View key={step.id} style={[s.row, { minHeight: 52, gap: 6 }]}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: step.done }}
                    onPress={() =>
                      setSteps(steps.map((x) => (x.id === step.id ? { ...x, done: !x.done } : x)))
                    }
                    hitSlop={8}
                  >
                    <Icon name={step.done ? "checkmark-circle" : "ellipse-outline"} color={step.done ? C.success : cat.color} />
                  </Pressable>
                  <TextInput
                    value={step.title}
                    onChangeText={(v) => setSteps(steps.map((x) => (x.id === step.id ? { ...x, title: v } : x)))}
                    style={[s.body, { flex: 1, color: C.ink }]}
                  />
                  {i > 0 && <IconButton name="chevron-up" label="Move up" color={C.faint} onPress={() => move(i, -1)} />}
                  {i < steps.length - 1 && <IconButton name="chevron-down" label="Move down" color={C.faint} onPress={() => move(i, 1)} />}
                  <IconButton name="close" label="Remove" color={C.faint} onPress={() => setSteps(steps.filter((x) => x.id !== step.id))} />
                </View>
              ))}
              <View style={[s.row, { minHeight: 52, gap: 6 }]}>
                <Icon name="add-circle" color={cat.color} />
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={addStep}
                  blurOnSubmit={false}
                  returnKeyType="next"
                  placeholder="Add subtask"
                  placeholderTextColor={C.faint}
                  style={[s.body, { flex: 1, color: C.ink }]}
                />
              </View>
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
