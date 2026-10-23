import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import {
  dayKey,
  formatMinutes,
  nextStep,
  progress,
  sortTasks,
  streak,
} from "../../src/domain";
import { CATEGORIES, shadow } from "../../src/theme";
import {
  Button,
  C,
  Card,
  Empty,
  Fab,
  Icon,
  IconButton,
  IconTile,
  Mascot,
  Pill,
  ProgressBar,
  Scene,
  Screen,
  date,
  s,
  time,
} from "../../src/ui";
import { useNow } from "../../src/useNow";
const greeting = (hour: number) =>
  hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
export default function Home() {
  const { state } = useStore();
  const now = useNow();
  const today = dayKey(now);
  const pending = sortTasks(state.tasks.filter((t) => !t.completedAt));
  const next = state.timer
    ? state.tasks.find((t) => t.id === state.timer!.taskId)
    : pending[0];
  const todays = state.tasks.filter(
    (t) =>
      (t.dueAt && dayKey(t.dueAt) === today) ||
      (t.completedAt && dayKey(t.completedAt) === today),
  );
  const doneToday = todays.filter((t) => t.completedAt).length;
  const minutes =
    state.sessions
      .filter((x) => dayKey(x.endedAt) === today)
      .reduce((a, b) => a + b.seconds, 0) / 60;
  const days = streak(state, now);
  const { level } = progress(state);
  const cat = next && CATEGORIES[next.category];
  const step = next && nextStep(next);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen padBottom={110}>
        <View style={[s.row, { marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.body, { fontWeight: "600" }]}>
              {greeting(new Date(now).getHours())}
            </Text>
            <Text style={s.h1}>
              {state.settings.name ? `${state.settings.name}!` : "Hi!"} 👋
            </Text>
            <Text style={s.small}>
              {new Date(now).toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <IconButton name="notifications-outline" label="Notifications" onPress={() => router.push("/notifications")} />
          <IconButton name="stats-chart-outline" label="Statistics" onPress={() => router.push("/stats")} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rewards"
          onPress={() => router.push("/rewards")}
          style={[{ height: 190, borderRadius: 28, overflow: "hidden", marginBottom: 16 }, shadow]}
        >
          <Scene />
          <View style={[s.row, { position: "absolute", top: 14, left: 14, gap: 8 }]}>
            <Pill label={`${days}`} icon="flame" color="#F97316" background="rgba(255,255,255,0.9)" />
            <Pill label={`Lv ${level}`} icon="star" color={C.primary} background="rgba(255,255,255,0.9)" />
          </View>
          <View style={{ position: "absolute", right: 18, bottom: 6 }}>
            <Mascot size={130} mood={doneToday ? "happy" : "neutral"} />
          </View>
        </Pressable>
        {next && cat ? (
          <Card style={{ padding: 20, gap: 12 }}>
            <View style={s.row}>
              <Text style={[s.small, { flex: 1, fontWeight: "700" }]}>
                {state.timer ? "Focusing" : "Next Task"}
              </Text>
              {next.priority === "High" && <Icon name="flag" color={C.danger} size={18} />}
            </View>
            <Pressable onPress={() => router.push({ pathname: "/task/[id]", params: { id: next.id } })}>
              <Text style={[s.h2, { fontSize: 22 }]}>{next.title}</Text>
            </Pressable>
            <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
              <Pill label={cat.label} icon={cat.icon} color={cat.color} />
              <Pill label={`${next.estimate} min`} icon="time-outline" color={C.muted} background="#F1F4F9" />
              {next.dueAt && (
                <Pill
                  label={dayKey(next.dueAt) === today ? time(next.dueAt) : date(next.dueAt)}
                  icon="calendar-outline"
                  color={next.dueAt < now ? C.danger : C.muted}
                  background={next.dueAt < now ? C.dangerPale : "#F1F4F9"}
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
              label={state.timer ? "Resume Focus" : "Start Focus"}
              icon="play"
              onPress={() =>
                router.push(
                  state.timer
                    ? "/(tabs)/focus"
                    : { pathname: "/(tabs)/focus", params: { taskId: next.id } },
                )
              }
            />
          </Card>
        ) : (
          <Card>
            <Empty
              title="All clear"
              action={<Button label="Add task" icon="add" onPress={() => router.push("/quick-add")} />}
            />
          </Card>
        )}
        <Card onPress={() => router.push("/(tabs)/tasks")}>
          <View style={s.row}>
            <Text style={[s.h3, { flex: 1 }]}>Today&apos;s Progress</Text>
            <Text style={[s.h3, { color: C.primary }]}>
              {todays.length ? Math.round((doneToday / todays.length) * 100) : 0}%
            </Text>
          </View>
          <Text style={[s.big, { fontSize: 34 }]}>
            {doneToday}
            <Text style={[s.h2, { color: C.faint }]}> / {todays.length} tasks</Text>
          </Text>
          <ProgressBar value={todays.length ? doneToday / todays.length : 0} color={C.success} height={10} />
        </Card>
        <View style={s.row}>
          <Card style={{ flex: 1 }} onPress={() => router.push("/stats")}>
            <IconTile name="hourglass" color="#8B5CF6" />
            <Text style={s.h2}>{formatMinutes(minutes)}</Text>
            <Text style={s.small}>Focused</Text>
          </Card>
          <Card style={{ flex: 1 }} onPress={() => router.push("/rewards")}>
            <IconTile name="flame" color="#F97316" />
            <Text style={s.h2}>{days} days</Text>
            <Text style={s.small}>Streak</Text>
          </Card>
        </View>
        <Card onPress={() => router.push("/plan")} style={{ flexDirection: "row", alignItems: "center" }}>
          <IconTile name="sparkles" color={C.primary} />
          <Text style={[s.h3, { flex: 1 }]}>Plan my day</Text>
          <Icon name="chevron-forward" color={C.faint} size={18} />
        </Card>
      </Screen>
      <Fab onPress={() => router.push("/quick-add")} />
    </SafeAreaView>
  );
}
