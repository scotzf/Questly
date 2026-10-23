import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { initialState, progress } from "../../src/domain";
import { confirm } from "../../src/confirm";
import { C, Card, Header, Icon, Mascot, Pill, Row, Screen, s } from "../../src/ui";
export default function More() {
  const { state, update } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.settings.name);
  const { level, coins } = progress(state);
  function saveName() {
    setEditing(false);
    if (name.trim() !== state.settings.name)
      void update((v) => ({ ...v, settings: { ...v.settings, name: name.trim() } }));
  }
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen>
        <Header title="Profile" />
        <Card style={[s.row, { gap: 16 }]}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: C.primaryPale,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mascot size={64} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {editing ? (
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                onBlur={saveName}
                onSubmitEditing={saveName}
                maxLength={40}
                placeholder="Name"
                placeholderTextColor={C.faint}
                style={[s.h2, { padding: 0 }]}
              />
            ) : (
              <Pressable onPress={() => setEditing(true)} style={[s.row, { gap: 6 }]}>
                <Text style={s.h2}>{state.settings.name || "Name"}</Text>
                <Icon name="pencil" color={C.faint} size={14} />
              </Pressable>
            )}
            <View style={[s.row, { gap: 6 }]}>
              <Pill label={`Level ${level}`} icon="star" color={C.primary} />
              <Pill label={coins.toLocaleString()} icon="ellipse" color={C.gold} />
            </View>
          </View>
        </Card>
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Row icon="stats-chart" color="#3B82F6" label="Statistics" onPress={() => router.push("/stats")} />
          <Row icon="trophy" color="#F59E0B" label="Rewards" onPress={() => router.push("/rewards")} />
          <Row icon="sparkles" color="#8B5CF6" label="Plan today" onPress={() => router.push("/plan")} />
        </Card>
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Row icon="timer" color="#10B981" label="Focus settings" onPress={() => router.push("/focus-settings")} />
          <Row icon="notifications" color="#EC4899" label="Notifications" onPress={() => router.push("/notifications")} />
          <Row icon="heart" color="#EF4444" label="Stuck?" onPress={() => router.push("/rescue")} />
        </Card>
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Row
            icon="trash"
            color={C.danger}
            label="Delete all data"
            onPress={() =>
              void confirm("Delete everything?", "Can't be undone.").then(async (ok) => {
                if (!ok) return;
                await update(() => initialState());
                router.replace("/onboarding");
              })
            }
          />
        </Card>
      </Screen>
    </SafeAreaView>
  );
}
