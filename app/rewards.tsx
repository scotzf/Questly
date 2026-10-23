import React from "react";
import { Text, View } from "react-native";
import { useStore } from "../src/store";
import { XP_PER_LEVEL, achievements, progress } from "../src/domain";
import { shadow } from "../src/theme";
import {
  C,
  Card,
  Icon,
  IconName,
  IconTile,
  Mascot,
  Pill,
  ProgressBar,
  Scene,
  Screen,
  s,
} from "../src/ui";
const TINTS = ["#3B82F6", "#F97316", "#06B6D4", "#F59E0B", "#8B5CF6"];
export default function Rewards() {
  const { state } = useStore();
  const { coins, level, levelXp } = progress(state);
  const list = achievements(state);
  const earned = list.filter((a) => a.value >= a.goal).length;
  return (
    <Screen>
      <View style={[{ height: 250, borderRadius: 28, overflow: "hidden", marginBottom: 16, padding: 20 }, shadow]}>
        <Scene />
        <View style={s.row}>
          <View style={[s.row, { gap: 8, flex: 1 }]}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}>
              <Icon name="star" color={C.white} size={18} />
            </View>
            <Text style={[s.big, { fontSize: 38 }]}>{coins.toLocaleString()}</Text>
          </View>
          <Pill label={`Level ${level}`} icon="ribbon" color={C.primary} background="rgba(255,255,255,0.92)" />
        </View>
        <View style={{ position: "absolute", alignSelf: "center", bottom: 44 }}>
          <Mascot size={130} mood="happy" />
        </View>
        <View style={{ position: "absolute", left: 20, right: 20, bottom: 16, gap: 4 }}>
          <ProgressBar value={levelXp / XP_PER_LEVEL} color={C.primary} track="rgba(255,255,255,0.7)" height={12} />
          <Text style={[s.small, { color: C.ink, fontWeight: "700", textAlign: "center" }]}>
            {levelXp} / {XP_PER_LEVEL} XP
          </Text>
        </View>
      </View>
      <View style={[s.row, s.section]}>
        <Text style={[s.h2, { flex: 1 }]}>Achievements</Text>
        <Pill label={`${earned}/${list.length}`} icon="trophy" color={C.gold} />
      </View>
      {list.map((a, i) => {
        const done = a.value >= a.goal;
        const tint = TINTS[i % TINTS.length];
        return (
          <Card key={a.id} style={[s.row, { opacity: done ? 1 : 0.95 }]}>
            <IconTile name={a.icon as IconName} color={done ? tint : C.faint} size={46} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.h3}>{a.title}</Text>
              <ProgressBar value={a.value / a.goal} color={done ? C.success : tint} />
            </View>
            {done ? (
              <Icon name="checkmark-circle" color={C.success} size={28} />
            ) : (
              <Text style={[s.small, { fontWeight: "700" }]}>
                {a.value}/{a.goal}
              </Text>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
