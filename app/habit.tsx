import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { useStore } from "../src/store";
import { CategoryId, addHabit } from "../src/domain";
import { detectSkill } from "../src/skills";
import { CATEGORIES } from "../src/theme";
import { Button, C, Chip, IconButton, haptic, s } from "../src/ui";
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
export default function NewHabit() {
  const { update } = useStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("wellness");
  const [picked, setPicked] = useState(false);
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [busy, setBusy] = useState(false);
  const onTitle = (v: string) => {
    setTitle(v);
    const area = detectSkill(v)?.area;
    if (!picked && area) setCategory(area);
  };
  async function save() {
    if (!title.trim() || !days.length || busy) return;
    setBusy(true);
    try {
      await update((v) =>
        addHabit(v, {
          id: Crypto.randomUUID(),
          title: title.trim(),
          category,
          days: [...days].sort(),
          log: [],
          createdAt: Date.now(),
        }),
      );
      haptic("success");
      router.back();
    } finally {
      setBusy(false);
    }
  }
  const area = CATEGORIES[category];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.row, { paddingHorizontal: 12, paddingVertical: 8 }]}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
        <Text style={[s.h3, { flex: 1, textAlign: "center" }]}>New Habit</Text>
        <Button label="Save" busy={busy} disabled={!title.trim() || !days.length} onPress={() => void save()} style={{ minHeight: 40, paddingVertical: 8 }} />
      </View>
      <ScrollView contentContainerStyle={[s.screen, { gap: 22 }]} keyboardShouldPersistTaps="handled">
        <View style={[s.card, { borderLeftWidth: 5, borderLeftColor: area.color }]}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={onTitle}
            placeholder="Drink 8 glasses of water"
            placeholderTextColor={C.faint}
            maxLength={80}
            style={{ fontSize: 22, fontWeight: "800", color: C.ink, minHeight: 44 }}
          />
        </View>
        <View style={[s.row, { justifyContent: "space-between", gap: 0 }]}>
          {DAYS.map((d, i) => {
            const on = days.includes(i);
            return (
              <Pressable
                key={i}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  haptic();
                  setDays(on ? days.filter((x) => x !== i) : [...days, i]);
                }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? area.color : C.white,
                  borderWidth: 1,
                  borderColor: on ? area.color : C.line,
                }}
              >
                <Text style={{ fontWeight: "800", color: on ? C.white : C.muted }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
          {(Object.keys(CATEGORIES) as CategoryId[]).map((c) => (
            <Chip
              key={c}
              label={CATEGORIES[c].label}
              icon={CATEGORIES[c].icon}
              color={CATEGORIES[c].color}
              selected={category === c}
              onPress={() => {
                setPicked(true);
                setCategory(c);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
