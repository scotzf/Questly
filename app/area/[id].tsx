import React from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { categoriesInArea, skillsInCategory } from "../../src/skills";
import type { AreaId } from "../../src/skills";
import { CATEGORIES, shadow } from "../../src/theme";
import { C, Icon, IconName, IconTile, Pill, Screen, s } from "../../src/ui";
export default function Area() {
  const { id } = useLocalSearchParams<{ id: AreaId }>();
  const { state } = useStore();
  const area = CATEGORIES[id] ?? CATEGORIES.growth;
  return (
    <>
      <Stack.Screen options={{ title: area.label, headerStyle: { backgroundColor: area.pale } }} />
      <Screen>
        {categoriesInArea(id).map((cat) => (
          <View key={cat.id} style={{ marginBottom: 18 }}>
            <View style={[s.row, { gap: 8, marginBottom: 10 }]}>
              <Icon name={cat.icon as IconName} color={area.color} size={20} />
              <Text style={s.h2}>{cat.name}</Text>
            </View>
            {skillsInCategory(cat.id).map((skill) => {
              const training = !!state.skills[skill.id];
              const levels = skill.levels.length + (skill.branches?.length ? 1 : 0);
              return (
                <Pressable
                  key={skill.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/skill/[id]", params: { id: skill.id } })}
                  style={({ pressed }) => [
                    s.row,
                    { backgroundColor: C.white, borderRadius: 20, padding: 14, marginBottom: 10 },
                    shadow,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <IconTile name={skill.icon as IconName} color={area.color} size={48} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.h3}>{skill.name}</Text>
                    <View style={[s.row, { gap: 6 }]}>
                      <View style={[s.row, { gap: 3 }]}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <View
                            key={n}
                            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: n <= skill.difficulty ? area.color : C.line }}
                          />
                        ))}
                      </View>
                      <Pill label={`${levels} levels`} icon="podium" color={C.muted} background="#F1F4F9" />
                      {skill.branches && <Pill label={`${skill.branches.length} paths`} icon="git-branch" color={C.muted} background="#F1F4F9" />}
                    </View>
                  </View>
                  {training ? (
                    <Icon name="flash" color={area.color} />
                  ) : (
                    <Icon name="chevron-forward" color={C.faint} size={18} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Screen>
    </>
  );
}
