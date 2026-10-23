import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { SKILLS, pathLevels, skillById } from "../../src/skills";
import type { AreaId } from "../../src/skills";
import { CATEGORIES, shadow } from "../../src/theme";
import { C, Header, Icon, IconName, IconTile, Ring, Screen, s } from "../../src/ui";
export default function Skills() {
  const { state } = useStore();
  const training = Object.entries(state.skills)
    .map(([id, p]) => ({ skill: skillById(id), p }))
    .filter((x) => x.skill);
  const areas = (Object.keys(CATEGORIES) as AreaId[]).filter((a) => SKILLS.some((sk) => sk.area === a));
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen>
        <Header title="Activities" />
        {training.length > 0 && (
          <>
            <Text style={[s.h3, { marginBottom: 10 }]}>In progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {training.map(({ skill, p }) => {
                const area = CATEGORIES[skill!.area];
                const levels = pathLevels(skill!, p.branch);
                const done = levels.filter((l) => p.levels[l.id]).length;
                const current = levels.find((l) => !p.levels[l.id]);
                return (
                  <Pressable
                    key={skill!.id}
                    onPress={() => router.push({ pathname: "/skill/[id]", params: { id: skill!.id } })}
                    style={({ pressed }) => [
                      { width: 150, backgroundColor: C.white, borderRadius: 22, padding: 14, gap: 8, alignItems: "center" },
                      shadow,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Ring progress={done / levels.length} size={70} stroke={7} color={area.color} track={area.pale}>
                      <Icon name={skill!.icon as IconName} color={area.color} size={28} />
                    </Ring>
                    <Text style={[s.h3, { textAlign: "center" }]} numberOfLines={1}>
                      {skill!.name}
                    </Text>
                    <Text style={[s.small, { fontWeight: "700", color: area.color }]} numberOfLines={1}>
                      {current ? current.name : "Mastered"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
        <View style={[s.row, { flexWrap: "wrap", gap: 12 }]}>
          {areas.map((id) => {
            const area = CATEGORIES[id];
            const count = SKILLS.filter((sk) => sk.area === id).length;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/area/[id]", params: { id } })}
                style={({ pressed }) => [
                  { width: "47%", backgroundColor: area.pale, borderRadius: 22, padding: 16, gap: 10 },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <IconTile name={area.icon} color={C.white} background={area.color} size={46} />
                <Text style={s.h3}>{area.label}</Text>
                <Text style={[s.small, { fontWeight: "700", color: area.color }]}>{count} activities</Text>
              </Pressable>
            );
          })}
        </View>
      </Screen>
    </SafeAreaView>
  );
}
