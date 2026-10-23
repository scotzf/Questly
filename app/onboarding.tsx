import React, { useState } from "react";
import { KeyboardAvoidingView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../src/store";
import { Button, C, ErrorText, Mascot, Scene, s } from "../src/ui";
export default function Onboarding() {
  const { update } = useStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function begin() {
    setBusy(true);
    try {
      await update((v) => ({
        ...v,
        settings: { ...v.settings, onboarded: true, name: name.trim() },
      }));
      router.replace("/(tabs)");
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
        <Scene />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 24 }}>
          <Mascot size={190} />
        </SafeAreaView>
      </View>
      <SafeAreaView edges={["bottom"]} style={{ padding: 24, gap: 18 }}>
        <Text style={[s.big, { textAlign: "center" }]}>FocusPal</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={40}
          placeholder="Your name"
          placeholderTextColor={C.faint}
          onSubmitEditing={() => void begin()}
          style={[s.input, { textAlign: "center", fontSize: 18, fontWeight: "600" }]}
        />
        <ErrorText message={error} />
        <Button label="Start" icon="arrow-forward" busy={busy} onPress={() => void begin()} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
