import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { dayKey, startOfDay, toggleTask } from "../../src/domain";
import { CATEGORIES } from "../../src/theme";
import {
  C,
  Card,
  Check,
  Empty,
  Fab,
  Header,
  Icon,
  IconButton,
  Screen,
  WeekStrip,
  date,
  s,
  time,
} from "../../src/ui";
import { useNow } from "../../src/useNow";
type Block = {
  id: string;
  taskId: string;
  at: number;
  end?: number;
  focus: boolean;
};
export default function Calendar() {
  const { state, update } = useStore();
  const now = useNow();
  const [day, setDay] = useState(() => startOfDay(now));
  const key = dayKey(day);
  const task = (id: string) => state.tasks.find((t) => t.id === id);
  const marks = new Set([
    ...state.tasks.filter((t) => t.dueAt && !t.completedAt).map((t) => dayKey(t.dueAt!)),
    ...state.slots.map((x) => dayKey(x.start)),
  ]);
  const blocks: Block[] = [
    ...state.tasks
      .filter((t) => t.dueAt && dayKey(t.dueAt) === key)
      .map((t) => ({ id: t.id, taskId: t.id, at: t.dueAt!, focus: false })),
    ...state.slots
      .filter((x) => dayKey(x.start) === key && task(x.taskId))
      .map((x) => ({ id: x.id, taskId: x.taskId, at: x.start, end: x.end, focus: true })),
  ].sort((a, b) => a.at - b.at);
  const endOfDay = day + 86400000;
  const upcoming = state.tasks
    .filter((t) => !t.completedAt && t.dueAt && t.dueAt >= endOfDay)
    .sort((a, b) => a.dueAt! - b.dueAt!)
    .slice(0, 5);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen padBottom={110}>
        <Header
          title="Calendar"
          right={
            <>
              <IconButton name="today-outline" label="Today" onPress={() => setDay(startOfDay(Date.now()))} />
              <IconButton name="sparkles-outline" label="Plan today" onPress={() => router.push("/plan")} />
            </>
          }
        />
        <Card>
          <WeekStrip selected={day} onSelect={setDay} marks={marks} />
        </Card>
        {blocks.length ? (
          blocks.map((b) => {
            const t = task(b.taskId)!;
            const cat = CATEGORIES[t.category];
            return (
              <View key={b.id} style={[s.row, { alignItems: "stretch", gap: 10, marginBottom: 10 }]}>
                <Text style={[s.small, { width: 62, paddingTop: 14, fontWeight: "600" }]}>
                  {time(b.at)}
                </Text>
                <Pressable
                  onPress={() => router.push({ pathname: "/task/[id]", params: { id: t.id } })}
                  style={({ pressed }) => [
                    s.row,
                    {
                      flex: 1,
                      backgroundColor: b.focus ? C.primaryPale : cat.pale,
                      borderRadius: 16,
                      padding: 14,
                      borderLeftWidth: 4,
                      borderLeftColor: b.focus ? C.primary : cat.color,
                      opacity: t.completedAt ? 0.5 : 1,
                    },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Icon name={b.focus ? "time" : cat.icon} color={b.focus ? C.primary : cat.color} size={18} />
                  <Text style={[s.h3, { flex: 1 }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  {b.end && <Text style={s.small}>{Math.round((b.end - b.at) / 60000)}m</Text>}
                </Pressable>
              </View>
            );
          })
        ) : (
          <Empty title="Free day" />
        )}
        {upcoming.length > 0 && (
          <>
            <Text style={[s.h2, s.section, { marginTop: 18 }]}>Upcoming</Text>
            <Card style={{ gap: 2 }}>
              {upcoming.map((t) => {
                const cat = CATEGORIES[t.category];
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push({ pathname: "/task/[id]", params: { id: t.id } })}
                    style={[s.row, { minHeight: 56 }]}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.h3} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={s.small}>
                        {date(t.dueAt!)} · {time(t.dueAt!)}
                      </Text>
                    </View>
                    <Check
                      done={false}
                      color={cat.color}
                      size={24}
                      onPress={() => void update((v) => toggleTask(v, t.id))}
                    />
                  </Pressable>
                );
              })}
            </Card>
          </>
        )}
      </Screen>
      <Fab onPress={() => router.push({ pathname: "/quick-add", params: { day: String(day) } })} />
    </SafeAreaView>
  );
}
