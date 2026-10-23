import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { useStore } from "../../src/store";
import {
  LEVEL_XP,
  MILESTONE_XP,
  addHabit,
  chooseBranch,
  daysForPerWeek,
  State,
  newTask,
  startSkill,
  stopSkill,
  toggleMilestone,
} from "../../src/domain";
import { pathLevels, skillById } from "../../src/skills";
import type { Level, Practice, Verify } from "../../src/skills";
import { CATEGORIES, shadow } from "../../src/theme";
import { confirm } from "../../src/confirm";
import {
  Button,
  C,
  Card,
  Check,
  Empty,
  Icon,
  IconButton,
  IconName,
  IconTile,
  Pill,
  Screen,
  haptic,
  s,
} from "../../src/ui";
const MEDALS = ["#CD7F32", "#A8A9AD", "#F5B301", "#38BDF8", "#8B5CF6", "#EF4444"];
const KIND_ICON: Record<Practice["kind"], IconName> = {
  task: "checkbox-outline",
  habit: "repeat",
  session: "calendar-outline",
  duration: "time-outline",
  quantity: "stats-chart-outline",
  assessment: "ribbon-outline",
};
const VERIFY_ICON: Record<Verify, IconName> = {
  self: "person-outline",
  count: "calculator-outline",
  timed: "stopwatch-outline",
  portfolio: "images-outline",
  challenge: "trophy-outline",
};
const practiceMeta = (p: Practice) =>
  [
    p.minutes && `${p.minutes} min`,
    p.target && `${p.target.amount} ${p.target.unit}`,
    p.perWeek && (p.perWeek === 7 ? "daily" : `${p.perWeek}×/wk`),
  ]
    .filter(Boolean)
    .join(" · ");
function Bullets({ icon, color, items }: { icon: IconName; color: string; items: string[] }) {
  return (
    <>
      {items.map((t) => (
        <View key={t} style={[s.row, { gap: 8, alignItems: "flex-start" }]}>
          <Icon name={icon} color={color} size={18} />
          <Text style={[s.body, { flex: 1, color: C.ink }]}>{t}</Text>
        </View>
      ))}
    </>
  );
}
export default function SkillPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update } = useStore();
  const skill = skillById(id);
  const progress = skill ? state.skills[skill.id] : undefined;
  const levels = skill ? pathLevels(skill, progress?.branch) : [];
  const current = levels.find((l) => !progress?.levels[l.id]) ?? levels[levels.length - 1];
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  if (!skill) return <Screen><Empty title="Not found" /></Screen>;
  const area = CATEGORIES[skill.area];
  const level: Level = levels.find((l) => l.id === selected) ?? current;
  const branchChoice = !!skill.branches?.length && skill.levels.every((l) => progress?.levels[l.id]) && !progress?.branch;
  const mark = (key: string) => setAdded((prev) => new Set(prev).add(key));
  /** Adds a level's practices to Tasks, skipping ones already open. */
  const withLevelTasks = (v: State, l: Level): State => {
    const open = new Set(v.tasks.filter((t) => t.skillId === skill.id && !t.completedAt).map((t) => t.title));
    const fresh = l.practice
      .filter((p) => !open.has(p.title))
      .map((p) =>
        newTask(Crypto.randomUUID(), {
          title: p.title,
          category: skill.area,
          skillId: skill.id,
          estimate: p.minutes ?? skill.duration,
          description: p.alternative ? `Easier: ${p.alternative}` : "",
        }),
      );
    return { ...v, tasks: [...v.tasks, ...fresh] };
  };
  const start = () => {
    haptic("success");
    current.practice.forEach((p) => mark(`t-${p.id}`));
    void update((v) => withLevelTasks(startSkill(v, skill.id), current));
  };
  const addAsTask = (p: Practice) => {
    haptic("success");
    mark(`t-${p.id}`);
    void update((v) =>
      startSkill(
        {
          ...v,
          tasks: [
            ...v.tasks,
            newTask(Crypto.randomUUID(), {
              title: p.title,
              category: skill.area,
              skillId: skill.id,
              estimate: p.minutes ?? skill.duration,
              description: p.alternative ? `Easier: ${p.alternative}` : "",
            }),
          ],
        },
        skill.id,
      ),
    );
  };
  const addAsHabit = (p: Practice) => {
    haptic("success");
    mark(`h-${p.id}`);
    void update((v) =>
      startSkill(
        addHabit(v, {
          id: Crypto.randomUUID(),
          title: p.title,
          category: skill.area,
          days: daysForPerWeek(p.perWeek ?? 7),
          log: [],
          createdAt: Date.now(),
          skillId: skill.id,
        }),
        skill.id,
      ),
    );
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: area.pale },
          headerRight: () =>
            progress ? (
              <IconButton
                name="close-circle-outline"
                label="Stop activity"
                color={C.muted}
                onPress={() =>
                  void confirm("Stop this activity?", "Progress is removed.").then(
                    (ok) => (ok ? update((v) => stopSkill(v, skill.id)) : undefined),
                  )
                }
              />
            ) : null,
        }}
      />
      <View style={{ backgroundColor: area.pale, paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 12 }}>
        <View style={[s.row, { gap: 14 }]}>
          <IconTile name={skill.icon as IconName} color={C.white} background={area.color} size={64} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.h1}>{skill.name}</Text>
            <View style={[s.row, { gap: 6, flexWrap: "wrap" }]}>
              <View style={[s.row, { gap: 3 }]}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <View key={n} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n <= skill.difficulty ? area.color : C.white }} />
                ))}
              </View>
              <Pill label={`${skill.duration} min`} icon="time" color={area.color} background={C.white} />
            </View>
          </View>
        </View>
        <Text style={[s.body, { color: C.ink }]}>{skill.description}</Text>
        <View style={[s.row, { gap: 6, flexWrap: "wrap" }]}>
          {skill.benefits.map((b) => (
            <Pill key={b} label={b} icon="checkmark" color={area.color} background={C.white} />
          ))}
        </View>
      </View>
      <Screen>
        {skill.prerequisites.length > 0 && (
          <View style={[s.row, { gap: 6, flexWrap: "wrap", marginBottom: 14 }]}>
            <Icon name="key" color={C.muted} size={16} />
            {skill.prerequisites.map((p) => {
              const pre = skillById(p);
              return pre ? (
                <Pressable key={p} onPress={() => router.push({ pathname: "/skill/[id]", params: { id: pre.id } })}>
                  <Pill label={pre.name} icon="link" color={C.primary} />
                </Pressable>
              ) : (
                <Pill key={p} label={p} color={C.muted} background="#F1F4F9" />
              );
            })}
          </View>
        )}
        {!progress && (
          <Button label="Start" icon="flash" onPress={start} style={{ marginBottom: 18 }} />
        )}
        <View style={{ alignItems: "center", marginBottom: 6 }}>
          {levels.map((l, i) => {
            const done = !!progress?.levels[l.id];
            const isCurrent = l.id === current.id && !done;
            const on = l.id === level.id;
            const medal = MEDALS[i % MEDALS.length];
            return (
              <View key={l.id} style={{ alignItems: "center" }}>
                {i > 0 && <View style={{ width: 4, height: 18, backgroundColor: done || isCurrent ? area.color : C.line }} />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={l.name}
                  onPress={() => {
                    haptic();
                    setSelected(l.id);
                  }}
                  style={({ pressed }) => [
                    s.row,
                    {
                      gap: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      backgroundColor: on ? area.color : C.white,
                      transform: [{ translateX: i % 2 ? 36 : -36 }, { scale: pressed ? 0.96 : 1 }],
                    },
                    shadow,
                  ]}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: done ? C.success : medal, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={done ? "checkmark" : "medal"} color={C.white} size={18} />
                  </View>
                  <Text style={[s.h3, { color: on ? C.white : C.ink }]}>{l.name}</Text>
                </Pressable>
              </View>
            );
          })}
          {branchChoice && (
            <View style={{ alignSelf: "stretch", marginTop: 18, gap: 10 }}>
              <View style={[s.row, { gap: 8, justifyContent: "center" }]}>
                <Icon name="git-branch" color={area.color} />
                <Text style={s.h3}>Choose your path</Text>
              </View>
              <View style={[s.row, { gap: 10, flexWrap: "wrap", justifyContent: "center" }]}>
                {skill.branches!.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      haptic("success");
                      void update((v) => chooseBranch(v, skill.id, b.id));
                    }}
                    style={({ pressed }) => [
                      { width: "30%", minWidth: 100, alignItems: "center", gap: 8, padding: 14, borderRadius: 20, backgroundColor: C.white },
                      shadow,
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <IconTile name={b.icon as IconName} color={area.color} />
                    <Text style={[s.small, { fontWeight: "800", color: C.ink, textAlign: "center" }]}>{b.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {!!skill.branches?.length && !branchChoice && !progress?.branch && (
            <View style={[s.row, { gap: 6, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }]}>
              <Icon name="git-branch" color={C.faint} size={16} />
              {skill.branches.map((b) => (
                <Pill key={b.id} label={b.name} icon="lock-closed" color={C.faint} background="#F1F4F9" />
              ))}
            </View>
          )}
        </View>
        <Card style={{ marginTop: 18, borderTopWidth: 5, borderTopColor: area.color, gap: 12 }}>
          <View style={s.row}>
            <Text style={[s.h2, { flex: 1 }]}>{level.name}</Text>
            <Pill label={`~${level.weeks} wk`} icon="hourglass" color={area.color} />
          </View>
          <View style={[s.row, { gap: 8, alignItems: "flex-start" }]}>
            <Icon name="flag" color={area.color} size={20} />
            <Text style={[s.h3, { flex: 1 }]}>{level.goal}</Text>
          </View>
          <Text style={[s.small, { fontWeight: "800", marginTop: 4 }]}>MILESTONES</Text>
          {level.milestones.map((m) => {
            const done = !!progress?.milestones[m.id];
            return (
              <View key={m.id} style={[s.row, { minHeight: 48 }]}>
                <Check
                  done={done}
                  color={area.color}
                  size={26}
                  onPress={() =>
                    void update((v) => {
                      const next = toggleMilestone(v, skill.id, level.id, level.milestones.map((x) => x.id), m.id);
                      const finished = !v.skills[skill.id]?.levels[level.id] && next.skills[skill.id].levels[level.id];
                      const following = levels[levels.findIndex((l) => l.id === level.id) + 1];
                      // Finishing a level queues the next level's practices in Tasks.
                      return finished && following ? withLevelTasks(next, following) : next;
                    })
                  }
                />
                <Text style={[s.body, { flex: 1, color: C.ink, fontWeight: "600" }, done && { color: C.faint, textDecorationLine: "line-through" }]}>
                  {m.title}
                </Text>
                <Icon name={VERIFY_ICON[m.verify]} color={C.faint} size={18} />
                {!done && <Text style={[s.small, { color: C.gold, fontWeight: "800" }]}>+{MILESTONE_XP}</Text>}
              </View>
            );
          })}
          <View style={[s.row, { gap: 6 }]}>
            <Icon name="trophy" color={C.gold} size={16} />
            <Text style={[s.small, { fontWeight: "700" }]}>Level complete +{LEVEL_XP} XP</Text>
          </View>
          <Text style={[s.small, { fontWeight: "800", marginTop: 6 }]}>PRACTICE</Text>
          {level.practice.map((p) => (
            <View key={p.id} style={[s.row, { minHeight: 52, alignItems: "flex-start", paddingTop: 6 }]}>
              <Icon name={KIND_ICON[p.kind]} color={area.color} size={20} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.body, { color: C.ink, fontWeight: "600" }]}>{p.title}</Text>
                {!!practiceMeta(p) && <Text style={s.small}>{practiceMeta(p)}</Text>}
                {p.alternative && (
                  <Text style={[s.small, { color: area.color }]}>↳ {p.alternative}</Text>
                )}
              </View>
              {(p.perWeek || p.kind === "habit") && (
                <IconButton
                  name={added.has(`h-${p.id}`) ? "checkmark-circle" : "repeat"}
                  label="Add as habit"
                  color={added.has(`h-${p.id}`) ? C.success : area.color}
                  onPress={() => !added.has(`h-${p.id}`) && addAsHabit(p)}
                />
              )}
              <IconButton
                name={added.has(`t-${p.id}`) ? "checkmark-circle" : "add-circle"}
                label="Add as task"
                color={added.has(`t-${p.id}`) ? C.success : area.color}
                onPress={() => !added.has(`t-${p.id}`) && addAsTask(p)}
              />
            </View>
          ))}
        </Card>
        <Card>
          <Bullets icon="bulb" color={C.gold} items={level.tips} />
          <Bullets icon="close-circle" color={C.danger} items={level.mistakes} />
        </Card>
        <Card>
          <Bullets icon="analytics" color={area.color} items={[skill.verification]} />
          {skill.resources && <Bullets icon="book" color={C.primary} items={skill.resources} />}
        </Card>
        {skill.safety && (
          <View style={[s.row, { gap: 8, alignItems: "flex-start", backgroundColor: C.warningPale, borderRadius: 16, padding: 14 }]}>
            <Icon name="shield-checkmark" color={C.warning} />
            <Text style={[s.small, { flex: 1, color: C.ink }]}>{skill.safety}</Text>
          </View>
        )}
      </Screen>
    </>
  );
}
