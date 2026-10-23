import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import {
  balance,
  dayKey,
  isFrozen,
  dayXp,
  ensureQuests,
  habitDueOn,
  nextStep,
  progress,
  quests,
  sortTasks,
  startOfDay,
  streak,
  taskXp,
  toggleTask,
  xpByDay,
} from "../../src/domain";
import { CATEGORIES, shadow } from "../../src/theme";
import {
  Button,
  C,
  Card,
  Empty,
  Fab,
  Icon,
  IconName,
  IconTile,
  Mascot,
  Pill,
  ProgressBar,
  Ring,
  Scene,
  Screen,
  date,
  s,
  time,
} from "../../src/ui";
import { useNow } from "../../src/useNow";
import HabitRow from "../../src/HabitRow";
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
export default function Home() {
  const { state, update } = useStore();
  const now = useNow();
  const goal = state.settings.dailyGoal;
  const today = dayXp(state, now);
  const days = streak(state, now);
  const { level } = progress(state);
  const coins = balance(state);
  const week = xpByDay(state, now);
  const daily = quests(state, now);
  const next = sortTasks(state.tasks.filter((t) => !t.completedAt))[0];
  const cat = next && CATEGORIES[next.category];
  const step = next && nextStep(next);
  const reached = today >= goal;
  const key = dayKey(now);
  // Today's quests are chosen once, the first time Home shows that day.
  useEffect(() => {
    void update((v) => ensureQuests(v));
  }, [key, update]);
  const habitsToday = state.habits.filter((h) => habitDueOn(h, now));
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen padBottom={110}>
        <View style={[s.row, { marginBottom: 14, gap: 8 }]}>
          <Pressable onPress={() => router.push("/stats")} style={{ flex: 1 }}>
            <Text style={s.h1}>{state.settings.name || "Hi"} 👋</Text>
          </Pressable>
          <View style={[s.row, { gap: 6, alignItems: "flex-start" }]}>
            <Pill label={String(days)} icon="flame" color="#F97316" />
            <Pressable onPress={() => router.push("/shop")}>
              <Pill label={coins.toLocaleString()} icon="ellipse" color={C.gold} />
            </Pressable>
            <Pill label={`Lv ${level}`} icon="star" color={C.primary} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Statistics"
          onPress={() => router.push("/stats")}
          style={[{ height: 200, borderRadius: 28, overflow: "hidden", marginBottom: 16 }, shadow]}
        >
          <Scene />
          <View style={[s.row, { flex: 1, paddingHorizontal: 22, justifyContent: "space-between" }]}>
            <Ring
              progress={today / goal}
              size={124}
              stroke={12}
              color={reached ? C.success : C.primary}
              track="rgba(255,255,255,0.75)"
            >
              {reached ? (
                <Icon name="checkmark" color={C.success} size={44} />
              ) : (
                <>
                  <Text style={[s.h1, { fontSize: 30 }]}>{today}</Text>
                  <Text style={[s.small, { color: C.ink, fontWeight: "700" }]}>/ {goal} XP</Text>
                  <Text style={[s.small, { color: C.ink }]}>today</Text>
                </>
              )}
            </Ring>
            <Mascot size={140} mood={reached ? "happy" : today ? "calm" : "neutral"} />
          </View>
        </Pressable>
        <Card style={[s.row, { justifyContent: "space-between", gap: 0, paddingVertical: 14 }]}>
          {week.map((d, i) => {
            const isToday = d.day === startOfDay(now);
            const frozen = isFrozen(state, d.day);
            const active = d.xp > 0;
            return (
              <View key={d.day} style={{ alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "#FFEDD5" : frozen ? "#E0F2FE" : "#F1F4F9",
                    borderWidth: isToday ? 2 : 0,
                    borderColor: "#F97316",
                  }}
                >
                  <Icon
                    name={active ? "flame" : frozen ? "snow" : "flame-outline"}
                    color={active ? "#F97316" : frozen ? "#0EA5E9" : C.faint}
                    size={20}
                  />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: isToday ? "#F97316" : C.faint }}>
                  {LETTERS[i]}
                </Text>
              </View>
            );
          })}
        </Card>
        <Card>
          <View style={s.row}>
            <Text style={[s.h3, { flex: 1 }]}>Daily Quests</Text>
            <Icon name="gift" color={C.gold} />
          </View>
          {daily.map((q) => {
            const done = q.value >= q.goal;
            return (
              <View key={q.id} style={[s.row, { minHeight: 52 }]}>
                <IconTile name={q.icon as IconName} color={done ? C.success : C.gold} size={38} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[s.body, { color: C.ink, fontWeight: "700" }]}>{q.title}</Text>
                  <Text style={s.small}>{q.detail}</Text>
                  <ProgressBar value={q.value / q.goal} color={done ? C.success : C.gold} />
                </View>
                {done ? (
                  <Icon name="checkmark-circle" color={C.success} size={26} />
                ) : (
                  <Text style={[s.small, { fontWeight: "800", width: 44, textAlign: "right" }]}>
                    {q.value}/{q.goal}
                  </Text>
                )}
              </View>
            );
          })}
        </Card>
        {habitsToday.length > 0 && (
          <Card style={{ gap: 0, paddingVertical: 6 }}>
            <View style={[s.row, { paddingTop: 8 }]}>
              <Text style={[s.h3, { flex: 1 }]}>Habits</Text>
              <Icon name="repeat" color={C.primary} />
            </View>
            {habitsToday.map((h) => (
              <HabitRow key={h.id} habit={h} now={now} />
            ))}
          </Card>
        )}
        {next && cat ? (
          <Card style={{ borderLeftWidth: 5, borderLeftColor: cat.color }}>
            <Text style={[s.small, { fontWeight: "700" }]}>Up Next</Text>
            <Pressable onPress={() => router.push({ pathname: "/task/[id]", params: { id: next.id } })}>
              <Text style={[s.h2, { fontSize: 22 }]}>{next.title}</Text>
            </Pressable>
            <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
              <Pill label={cat.label} icon={cat.icon} color={cat.color} />
              {next.dueAt && (
                <Pill
                  label={dayKey(next.dueAt) === dayKey(now) ? time(next.dueAt) : date(next.dueAt)}
                  icon="calendar-outline"
                  color={next.dueAt < now ? C.danger : C.muted}
                  background={next.dueAt < now ? C.dangerPale : "#F1F4F9"}
                />
              )}
              {next.steps.length > 0 && (
                <Pill
                  label={`${next.steps.filter((x) => x.done).length}/${next.steps.length}`}
                  icon="list"
                  color={C.muted}
                  background="#F1F4F9"
                />
              )}
            </View>
            {step && (
              <View style={[s.row, { gap: 8 }]}>
                <Icon name="arrow-forward-circle" color={cat.color} size={20} />
                <Text style={[s.body, { flex: 1, color: C.ink }]}>{step}</Text>
              </View>
            )}
            <Button
              label={`Done · +${taskXp({ ...next, completedAt: now })} XP`}
              icon="checkmark"
              onPress={() => void update((v) => toggleTask(v, next.id))}
            />
          </Card>
        ) : (
          <Card>
            <Empty title="All clear" />
          </Card>
        )}
      </Screen>
      <Fab onPress={() => router.push("/quick-add")} />
    </SafeAreaView>
  );
}
