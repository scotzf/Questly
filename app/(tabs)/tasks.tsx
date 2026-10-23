import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import {
  Task,
  TaskStatus,
  dayKey,
  sortTasks,
  startOfDay,
  stepProgress,
  taskStatus,
  toggleStep,
  toggleTask,
} from "../../src/domain";
import TaskCard from "../../src/TaskCard";
import HabitRow from "../../src/HabitRow";
import { CATEGORIES } from "../../src/theme";
import {
  Button,
  C,
  Card,
  Check,
  Chip,
  Empty,
  Field,
  Header,
  Icon,
  IconButton,
  Pill,
  ProgressBar,
  Screen,
  Segmented,
  WeekStrip,
  haptic,
  s,
  time,
} from "../../src/ui";
import { useNow } from "../../src/useNow";
const VIEWS = ["Timeline", "Board", "Diagram", "Habits"] as const;
export default function Tasks() {
  const { state } = useStore();
  const now = useNow();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Timeline");
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const tasks = state.tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen padBottom={40}>
        <Header
          title="Tasks"
          right={
            <>
              <IconButton
                name={searching ? "close" : "search"}
                label="Search"
                onPress={() => {
                  setSearching(!searching);
                  setSearch("");
                }}
              />
              <IconButton name="add" label="Add task" filled onPress={() => router.push("/quick-add")} />
            </>
          }
        />
        {searching && <Field placeholder="Search" value={search} onChangeText={setSearch} autoFocus />}
        <Segmented options={VIEWS} value={view} onChange={setView} />
        {view === "Habits" ? (
          <Habits now={now} />
        ) : !state.tasks.length ? (
          <Empty
            title="No tasks"
            action={<Button label="Add task" icon="add" onPress={() => router.push("/quick-add")} />}
          />
        ) : view === "Timeline" ? (
          <Timeline tasks={tasks} now={now} />
        ) : view === "Board" ? (
          <Board tasks={tasks} />
        ) : (
          <Diagram tasks={tasks} />
        )}
      </Screen>
    </SafeAreaView>
  );
}
function TimeRow({ task, now, label }: { task: Task; now: number; label: string }) {
  return (
    <View style={[s.row, { alignItems: "flex-start", gap: 10 }]}>
      <Text style={[s.small, { width: 58, paddingTop: 16, fontWeight: "600" }]}>{label}</Text>
      <View style={{ flex: 1 }}>
        <TaskCard task={task} now={now} />
      </View>
    </View>
  );
}
function Group({ title, color, count }: { title: string; color: string; count: number }) {
  return (
    <View style={[s.row, { gap: 8, marginTop: 6, marginBottom: 10 }]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={s.h3}>{title}</Text>
      <Pill label={String(count)} color={color} />
    </View>
  );
}
function Timeline({ tasks, now }: { tasks: Task[]; now: number }) {
  const [day, setDay] = useState(() => startOfDay(now));
  const key = dayKey(day);
  const isToday = key === dayKey(now);
  const marks = new Set(tasks.filter((t) => t.dueAt && !t.completedAt).map((t) => dayKey(t.dueAt!)));
  const onDay = tasks
    .filter((t) => t.dueAt && dayKey(t.dueAt) === key)
    .sort((a, b) => a.dueAt! - b.dueAt!);
  const overdue = isToday
    ? sortTasks(tasks.filter((t) => !t.completedAt && t.dueAt && t.dueAt < startOfDay(now)))
    : [];
  const anytime = isToday ? sortTasks(tasks.filter((t) => !t.completedAt && !t.dueAt)) : [];
  return (
    <>
      <WeekStrip selected={day} onSelect={setDay} marks={marks} />
      {overdue.length > 0 && (
        <>
          <Group title="Overdue" color={C.danger} count={overdue.length} />
          {overdue.map((t) => (
            <TaskCard key={t.id} task={t} now={now} />
          ))}
        </>
      )}
      {onDay.map((t) => (
        <TimeRow key={t.id} task={t} now={now} label={time(t.dueAt!)} />
      ))}
      {anytime.length > 0 && (
        <>
          <Group title="Anytime" color={C.primary} count={anytime.length} />
          {anytime.map((t) => (
            <TaskCard key={t.id} task={t} now={now} />
          ))}
        </>
      )}
      {!overdue.length && !onDay.length && !anytime.length && <Empty title="Free day" />}
    </>
  );
}
const COLUMNS: [TaskStatus, string, string][] = [
  ["todo", "To Do", C.primary],
  ["doing", "In Progress", C.warning],
  ["done", "Completed", C.success],
];
function Board({ tasks }: { tasks: Task[] }) {
  const { update } = useStore();
  return (
    <>
      {COLUMNS.map(([status, title, color]) => {
        const items = sortTasks(tasks.filter((t) => taskStatus(t) === status));
        return (
          <Card key={status} style={{ gap: 4 }}>
            <Group title={title} color={color} count={items.length} />
            {items.map((t) => {
              const cat = CATEGORIES[t.category];
              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.push({ pathname: "/task/[id]", params: { id: t.id } })}
                  style={[s.row, { minHeight: 52 }]}
                >
                  <Check
                    done={!!t.completedAt}
                    color={cat.color}
                    size={24}
                    onPress={() => void update((v) => toggleTask(v, t.id))}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      s.body,
                      { flex: 1, color: C.ink, fontWeight: "600" },
                      !!t.completedAt && { color: C.faint, textDecorationLine: "line-through" },
                    ]}
                  >
                    {t.title}
                  </Text>
                  <Pill label={cat.label} color={cat.color} />
                </Pressable>
              );
            })}
          </Card>
        );
      })}
    </>
  );
}
function Diagram({ tasks }: { tasks: Task[] }) {
  const { update } = useStore();
  const withSteps = tasks.filter((t) => t.steps.length);
  const [picked, setPicked] = useState<string | null>(null);
  const task = withSteps.find((t) => t.id === picked) ?? withSteps[0];
  if (!task)
    return (
      <Empty
        title="No subtasks"
        action={<Button label="New task" icon="add" onPress={() => router.push("/editor")} />}
      />
    );
  const cat = CATEGORIES[task.category];
  const half = Math.ceil(task.steps.length / 2);
  const columns = [task.steps.slice(0, half), task.steps.slice(half)].filter((c) => c.length);
  const done = task.steps.filter((x) => x.done).length;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
        {withSteps.map((t) => (
          <Chip
            key={t.id}
            label={t.title}
            color={CATEGORIES[t.category].color}
            selected={t.id === task.id}
            onPress={() => setPicked(t.id)}
          />
        ))}
      </ScrollView>
      <Card style={{ gap: 14 }}>
        <Pressable onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}>
          <Text style={s.h2}>{task.title}</Text>
        </Pressable>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={stepProgress(task)} color={cat.color} height={10} />
          </View>
          <Text style={[s.h3, { color: cat.color }]}>
            {done}/{task.steps.length}
          </Text>
        </View>
        <View style={{ alignItems: "center", marginTop: 6 }}>
          <View style={[s.row, { gap: 6, backgroundColor: cat.color, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Icon name={cat.icon} color={C.white} size={16} />
            <Text style={{ color: C.white, fontWeight: "800" }} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
          <View style={{ width: 2, height: 18, backgroundColor: cat.color + "55" }} />
          {columns.length > 1 && (
            <View style={{ height: 2, alignSelf: "stretch", marginHorizontal: "25%", backgroundColor: cat.color + "55" }} />
          )}
          <View style={[s.row, { alignItems: "flex-start", alignSelf: "stretch", gap: 8 }]}>
            {columns.map((col, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: 2, height: 14, backgroundColor: cat.color + "55" }} />
                <View style={{ alignSelf: "stretch" }}>
                  <View
                    style={{
                      position: "absolute",
                      left: 13,
                      top: 14,
                      bottom: 14,
                      width: 2,
                      backgroundColor: cat.color + "33",
                    }}
                  />
                  {col.map((step) => (
                    <Pressable
                      key={step.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: step.done }}
                      onPress={() => {
                        if (!step.done) haptic("success");
                        void update((v) => toggleStep(v, task.id, step.id));
                      }}
                      style={[s.row, { gap: 8, minHeight: 48 }]}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: step.done ? C.success : cat.color + "66",
                          backgroundColor: step.done ? C.success : C.white,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {step.done && <Icon name="checkmark" color={C.white} size={16} />}
                      </View>
                      <Text
                        style={[
                          s.small,
                          { flex: 1, color: step.done ? C.faint : C.ink, fontWeight: "600" },
                        ]}
                        numberOfLines={2}
                      >
                        {step.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </>
  );
}
function Habits({ now }: { now: number }) {
  const { state } = useStore();
  const habits = state.habits.filter((h) => !h.archived);
  return (
    <>
      {habits.length ? (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {habits.map((h) => (
            <HabitRow key={h.id} habit={h} now={now} />
          ))}
        </Card>
      ) : (
        <Empty title="No habits" />
      )}
      <Button kind="secondary" label="New habit" icon="repeat" onPress={() => router.push("/habit")} />
    </>
  );
}
