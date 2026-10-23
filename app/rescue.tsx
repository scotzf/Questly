import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../src/store";
import { nextStep, sortTasks } from "../src/domain";
import { Button, C, Card, Icon, Mascot, Screen, s } from "../src/ui";
const answers = {
  Overwhelmed: {
    icon: "layers-outline",
    title: "Just 2 minutes.",
  },
  "Not sure how": {
    icon: "help-circle-outline",
    title: "Pick one tiny step.",
  },
  Distracted: {
    icon: "notifications-off-outline",
    title: "Do Not Disturb, then 5 minutes.",
  },
  Tired: {
    icon: "cafe-outline",
    title: "Water. Short break.",
  },
} as const;
export default function Rescue() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { state } = useStore();
  const [choice, setChoice] = useState<keyof typeof answers | null>(null);
  const task =
    state.tasks.find((t) => t.id === taskId && !t.completedAt) ??
    sortTasks(state.tasks.filter((t) => !t.completedAt))[0];
  const answer = choice ? answers[choice] : null;
  return (
    <Screen>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Mascot size={110} />
      </View>
      <View
        style={[
          s.row,
          { flexWrap: "wrap", justifyContent: "center", marginBottom: 24 },
        ]}
      >
        {(Object.keys(answers) as (keyof typeof answers)[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: choice === key }}
            onPress={() => setChoice(key)}
            style={[
              s.chip,
              { width: "47%", gap: 6, paddingVertical: 16 },
              choice === key && { backgroundColor: C.primary, borderColor: C.primary },
            ]}
          >
            <Icon
              name={answers[key].icon}
              color={choice === key ? C.white : C.primary}
            />
            <Text
              style={{
                fontWeight: "600",
                color: choice === key ? C.white : C.ink,
              }}
            >
              {key}
            </Text>
          </Pressable>
        ))}
      </View>
      {answer && (
        <Card style={{ backgroundColor: C.primaryPale }}>
          <Text style={s.h2}>{answer.title}</Text>
          {choice !== "Tired" && task && (
            <>
              <Text style={[s.small, { fontWeight: "700", color: C.primary }]}>{task.title}</Text>
              {nextStep(task) && <Text style={s.h3}>{nextStep(task)}</Text>}
            </>
          )}
          {choice === "Tired" ? (
            <>
              <Button
                label="Take a break"
                icon="cafe-outline"
                onPress={() => router.replace("/(tabs)")}
              />
              <Button
                kind="secondary"
                icon="calendar-outline"
                label="Replan"
                onPress={() => router.replace("/plan")}
              />
            </>
          ) : task ? (
            <>
              <Button
                icon="arrow-forward"
                label="Open task"
                onPress={() =>
                  router.replace({ pathname: "/task/[id]", params: { id: task.id } })
                }
              />
              {choice === "Not sure how" && (
                <Button
                kind="secondary"
                  icon="create-outline"
                  label="Edit steps"
                  onPress={() =>
                    router.replace({
                      pathname: "/editor",
                      params: { id: task.id },
                    })
                  }
                />
              )}
            </>
          ) : (
            <Button
              icon="add"
              label="Add task"
              onPress={() => router.replace("/editor")}
            />
          )}
        </Card>
      )}
    </Screen>
  );
}
