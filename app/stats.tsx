import React, { useRef } from "react";
import { Platform, Text, View } from "react-native";
import { Stack } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Svg, { Circle } from "react-native-svg";
import { useStore } from "../src/store";
import {
  CategoryId,
  bestStreak,
  categoryMinutes,
  focusByDay,
  formatMinutes,
  startOfDay,
  streak,
  weekDays,
} from "../src/domain";
import { CATEGORIES, shadow } from "../src/theme";
import {
  C,
  Card,
  Icon,
  IconButton,
  Mascot,
  Pill,
  ProgressBar,
  Screen,
  s,
} from "../src/ui";
import { useNow } from "../src/useNow";
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
function Donut({ parts }: { parts: { color: string; value: number }[] }) {
  const size = 130,
    stroke = 22,
    r = (size - stroke) / 2,
    len = 2 * Math.PI * r;
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const offsets = parts.map((_, i) =>
    parts.slice(0, i).reduce((n, p) => n + (p.value / total) * len, 0),
  );
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF1F7" strokeWidth={stroke} fill="none" />
      {parts.map((p, i) => {
        const seg = (p.value / total) * len;
        return (
          <Circle
            key={p.color}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={p.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${Math.max(0, seg - 3)} ${len}`}
            strokeDashoffset={-offsets[i]}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </Svg>
  );
}
export default function Stats() {
  const { state } = useStore();
  const now = useNow();
  const card = useRef<React.ComponentRef<typeof View>>(null);
  const week = focusByDay(state.sessions, now);
  const lastWeek = focusByDay(state.sessions, now - 7 * 86400000);
  const total = week.reduce((n, d) => n + d.minutes, 0);
  const before = lastWeek.reduce((n, d) => n + d.minutes, 0);
  const delta = before ? Math.round(((total - before) / before) * 100) : null;
  const max = Math.max(30, ...week.map((d) => d.minutes));
  const todayIndex = week.findIndex((d) => d.day === startOfDay(now));
  const [weekStart] = weekDays(now);
  const weekEnd = weekStart + 7 * 86400000;
  const inWeek = (t?: number | null) => !!t && t >= weekStart && t < weekEnd;
  const weekTasks = state.tasks.filter((t) => inWeek(t.dueAt) || inWeek(t.completedAt));
  const weekDone = weekTasks.filter((t) => t.completedAt).length;
  const cats = categoryMinutes(state);
  const catTotal = Object.values(cats).reduce((n, m) => n + (m ?? 0), 0);
  const parts = (Object.keys(CATEGORIES) as CategoryId[])
    .filter((c) => (cats[c] ?? 0) > 0)
    .map((c) => ({ id: c, color: CATEGORIES[c].color, value: cats[c]! }));
  const days = streak(state, now);
  async function share() {
    try {
      const uri = await captureRef(card, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share" });
    } catch {
      // Share sheet dismissed or unavailable — nothing to do.
    }
  }
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            Platform.OS === "web" ? null : (
              <IconButton name="share-social" label="Share" color={C.primary} onPress={() => void share()} />
            ),
        }}
      />
      <Screen>
        <View
          ref={card}
          collapsable={false}
          style={[{ backgroundColor: C.primary, borderRadius: 28, padding: 22, marginBottom: 14, gap: 14, overflow: "hidden" }, shadow]}
        >
          <View style={[s.row, { alignItems: "flex-start" }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: "#C9D6FF", fontWeight: "700" }}>This week</Text>
              <Text style={[s.big, { color: C.white }]}>{formatMinutes(total)}</Text>
              <View style={[s.row, { gap: 6 }]}>
                {delta !== null && (
                  <Pill
                    label={`${delta >= 0 ? "+" : ""}${delta}%`}
                    icon={delta >= 0 ? "trending-up" : "trending-down"}
                    color={delta >= 0 ? "#16A34A" : C.danger}
                    background={C.white}
                  />
                )}
                <Pill label={`${days}`} icon="flame" color="#F97316" background={C.white} />
              </View>
            </View>
            <Mascot size={86} mood={total ? "happy" : "neutral"} />
          </View>
          <View style={[s.row, { alignItems: "flex-end", height: 120, gap: 10 }]}>
            {week.map((d, i) => (
              <View key={d.day} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
                  <View
                    style={{
                      height: `${Math.max(4, (d.minutes / max) * 100)}%`,
                      borderRadius: 8,
                      backgroundColor: i === todayIndex ? C.white : "rgba(255,255,255,0.45)",
                    }}
                  />
                </View>
                <Text style={{ color: i === todayIndex ? C.white : "#C9D6FF", fontSize: 12, fontWeight: "700" }}>
                  {LETTERS[i]}
                </Text>
              </View>
            ))}
          </View>
          <View style={[s.row, { gap: 6 }]}>
            <Icon name="timer" color="#C9D6FF" size={14} />
            <Text style={{ color: "#C9D6FF", fontSize: 12, fontWeight: "700" }}>FocusPal</Text>
          </View>
        </View>
        <Card>
          <View style={s.row}>
            <Text style={[s.h3, { flex: 1 }]}>Tasks</Text>
            <Text style={[s.h3, { color: C.success }]}>
              {weekTasks.length ? Math.round((weekDone / weekTasks.length) * 100) : 0}%
            </Text>
          </View>
          <Text style={[s.big, { fontSize: 32 }]}>
            {weekDone}
            <Text style={[s.h2, { color: C.faint }]}> / {weekTasks.length}</Text>
          </Text>
          <ProgressBar value={weekTasks.length ? weekDone / weekTasks.length : 0} color={C.success} height={10} />
        </Card>
        <View style={s.row}>
          <Card style={{ flex: 1 }}>
            <Icon name="flame" color="#F97316" size={26} />
            <Text style={s.h2}>{days}</Text>
            <Text style={s.small}>Streak</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Icon name="ribbon" color={C.gold} size={26} />
            <Text style={s.h2}>{bestStreak(state)}</Text>
            <Text style={s.small}>Best</Text>
          </Card>
        </View>
        {parts.length > 0 && (
          <Card>
            <Text style={s.h3}>Categories</Text>
            <View style={[s.row, { gap: 20 }]}>
              <Donut parts={parts} />
              <View style={{ flex: 1, gap: 10 }}>
                {parts.map((p) => (
                  <View key={p.id} style={[s.row, { gap: 8 }]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
                    <Text style={[s.body, { flex: 1, color: C.ink }]}>{CATEGORIES[p.id].label}</Text>
                    <Text style={[s.h3, { color: p.color }]}>{Math.round((p.value / catTotal) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}
      </Screen>
    </>
  );
}
