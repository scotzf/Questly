import React from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import {
  STEP_XP,
  deleteTask,
  stepProgress,
  taskXp,
  toggleStep,
  toggleTask,
} from "../../src/domain";
import { CATEGORIES, PRIORITY } from "../../src/theme";
import {
  Button,
  C,
  Card,
  Check,
  Empty,
  Icon,
  IconButton,
  Pill,
  Ring,
  Screen,
  date,
  s,
  time,
} from "../../src/ui";
import { confirm } from "../../src/confirm";
import { useNow } from "../../src/useNow";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update } = useStore();
  const now = useNow();
  const task = state.tasks.find((t) => t.id === id);
  if (!task)
    return (
      <Screen>
        <Empty title="Not found" action={<Button label="Tasks" onPress={() => router.replace("/(tabs)/tasks")} />} />
      </Screen>
    );
  const cat = CATEGORIES[task.category];
  const overdue = !!task.dueAt && task.dueAt < now && !task.completedAt;
  const pct = stepProgress(task);
  const slots = state.slots.filter((x) => x.taskId === id && x.end > now);
  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: cat.pale },
          headerRight: () => (
            <IconButton
              name="create-outline"
              label="Edit"
              onPress={() => router.push({ pathname: "/editor", params: { id } })}
            />
          ),
        }}
      />
      <View style={{ backgroundColor: cat.pale, paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <View style={[s.row, { alignItems: "flex-start", gap: 16 }]}>
          <View style={{ flex: 1, gap: 10 }}>
            <Pill label={cat.label} icon={cat.icon} color={cat.color} background={C.white} />
            <Text
              style={[
                s.h1,
                !!task.completedAt && { textDecorationLine: "line-through", color: C.muted },
              ]}
            >
              {task.title}
            </Text>
          </View>
          <Ring progress={pct} size={84} stroke={8} color={task.completedAt ? C.success : cat.color} track={C.white}>
            {task.completedAt ? (
              <Icon name="checkmark" color={C.success} size={32} />
            ) : (
              <Text style={[s.h3, { color: cat.color }]}>{Math.round(pct * 100)}%</Text>
            )}
          </Ring>
        </View>
        <View style={[s.row, { flexWrap: "wrap", gap: 8, marginTop: 14 }]}>
          <Pill label={task.priority} icon="flag" color={PRIORITY[task.priority].color} background={C.white} />
          {task.dueAt && (
            <Pill
              label={`${date(task.dueAt)} · ${time(task.dueAt)}`}
              icon="calendar"
              color={overdue ? C.danger : C.ink}
              background={overdue ? C.dangerPale : C.white}
            />
          )}
          {task.reminder !== null && task.dueAt && <Pill label={`${task.reminder}m`} icon="notifications" color={C.ink} background={C.white} />}
          <Pill
            label={`+${taskXp({ ...task, completedAt: task.completedAt ?? now })} XP`}
            icon="star"
            color={C.gold}
            background={C.white}
          />
        </View>
      </View>
      <Screen>
        {task.description ? (
          <Card>
            <Text style={s.body}>{task.description}</Text>
          </Card>
        ) : null}
        {task.steps.length > 0 && (
          <Card style={{ gap: 2 }}>
            {task.steps.map((step) => (
              <Pressable
                key={step.id}
                onPress={() => void update((v) => toggleStep(v, task.id, step.id))}
                style={[s.row, { minHeight: 52 }]}
              >
                <Check done={step.done} color={cat.color} size={24} onPress={() => void update((v) => toggleStep(v, task.id, step.id))} />
                <Text
                  style={[
                    s.body,
                    { flex: 1, color: C.ink, fontWeight: "600" },
                    step.done && { textDecorationLine: "line-through", color: C.faint },
                  ]}
                >
                  {step.title}
                </Text>
                {!step.done && <Text style={[s.small, { color: C.gold, fontWeight: "800" }]}>+{STEP_XP}</Text>}
              </Pressable>
            ))}
          </Card>
        )}
        {slots.map((slot) => (
          <View key={slot.id} style={[s.row, { marginBottom: 10, gap: 8 }]}>
            <Icon name="time-outline" color={C.primary} size={18} />
            <Text style={[s.small, { fontWeight: "600" }]}>
              {date(slot.start)} · {time(slot.start)} – {time(slot.end)}
            </Text>
          </View>
        ))}
        <View style={{ gap: 12, marginTop: 6 }}>
          <Button
            kind={task.completedAt ? "secondary" : "primary"}
            icon={task.completedAt ? "refresh" : "checkmark"}
            label={task.completedAt ? "Reopen" : `Done · +${taskXp({ ...task, completedAt: now })} XP`}
            onPress={() => void update((v) => toggleTask(v, task.id))}
          />
          <Button
            kind="danger"
            icon="trash-outline"
            label="Delete"
            onPress={() =>
              void confirm("Delete this task?", "").then(async (ok) => {
                if (!ok) return;
                await update((v) => deleteTask(v, task.id));
                router.back();
              })
            }
          />
        </View>
      </Screen>
    </>
  );
}
