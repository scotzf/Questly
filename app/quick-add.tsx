import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import TextScan from "../modules/text-scan";
import { scanImage } from "../src/scanImage";
import { detectSkill } from "../src/skills";
import * as Crypto from "expo-crypto";
import { useStore } from "../src/store";
import { CategoryId, dayKey, newTask, startOfDay } from "../src/domain";
import { CATEGORIES, PRIORITY } from "../src/theme";
import { C, Chip, ErrorText, Icon, IconButton, date, haptic, s } from "../src/ui";
const at = (day: number, hour: number) => {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};
export default function QuickAdd() {
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const { update } = useStore();
  const [today] = useState(() => startOfDay(Date.now()));
  const tomorrow = startOfDay(today + 36 * 3600000);
  const picked = dayParam ? Number(dayParam) : null;
  const days: [string, number | null][] = [
    ["Today", today],
    ["Tomorrow", tomorrow],
    ...(picked && picked !== today && picked !== tomorrow
      ? ([[date(picked), picked]] as [string, number][])
      : []),
    ["Someday", null],
  ];
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("study");
  const [areaPicked, setAreaPicked] = useState(false);
  const [day, setDay] = useState<number | null>(picked ?? today);
  const [high, setHigh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanError, setScanError] = useState("");
  async function scan(source: "camera" | "library") {
    if (!TextScan || busy) return;
    setScanError("");
    if (source === "camera" && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
      setScanError("Camera blocked");
      return;
    }
    const pick = await (source === "camera"
      ? ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 1 })
      : ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 1 }));
    if (pick.canceled) return;
    setBusy(true);
    try {
      await scanImage(pick.assets[0].uri, true);
      haptic("success");
    } catch {
      setScanError("No text found");
    } finally {
      setBusy(false);
    }
  }
  async function add() {
    if (!title.trim() || busy) return;
    setBusy(true);
    const nextHour = Math.min(23, new Date().getHours() + 1);
    const dueAt =
      day === null ? null : at(day, dayKey(day) === dayKey(today) ? nextHour : 9);
    try {
      await update((v) => ({
        ...v,
        tasks: [
          ...v.tasks,
          newTask(Crypto.randomUUID(), {
            title: title.trim(),
            category,
            dueAt,
            priority: high ? "High" : "Medium",
          }),
        ],
      }));
      haptic("success");
      router.back();
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Pressable
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={{ flex: 1, backgroundColor: "rgba(17,24,39,0.45)" }}
      />
      <View
        style={{
          backgroundColor: C.white,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          paddingBottom: 28,
          gap: 14,
        }}
      >
        <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: C.line }} />
        <View style={s.row}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              const area = detectSkill(v)?.area;
              if (!areaPicked && area) setCategory(area);
            }}
            onSubmitEditing={() => void add()}
            returnKeyType="done"
            placeholder="New task"
            placeholderTextColor={C.faint}
            maxLength={160}
            style={{ flex: 1, fontSize: 22, fontWeight: "700", color: C.ink, minHeight: 52 }}
          />
          <IconButton
            name={high ? "flag" : "flag-outline"}
            label="High priority"
            color={high ? PRIORITY.High.color : C.faint}
            onPress={() => {
              haptic();
              setHigh(!high);
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add"
            disabled={!title.trim() || busy}
            onPress={() => void add()}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: title.trim() ? C.primary : C.line,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}
          >
            <Icon name="arrow-up" color={C.white} size={24} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
          {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => (
            <Chip
              key={id}
              label={CATEGORIES[id].label}
              icon={CATEGORIES[id].icon}
              color={CATEGORIES[id].color}
              selected={category === id}
              onPress={() => {
                setAreaPicked(true);
                setCategory(id);
              }}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
          {days.map(([label, value]) => (
            <Chip
              key={label}
              label={label}
              icon={value === null ? "infinite" : "calendar-outline"}
              color={C.ink}
              selected={day === value}
              onPress={() => setDay(value)}
            />
          ))}
        </ScrollView>
        <ErrorText message={scanError} />
        <View style={s.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace({ pathname: "/editor", params: { title } })}
            style={[s.row, { gap: 6, flex: 1, minHeight: 44 }]}
          >
            <Icon name="options-outline" color={C.primary} size={18} />
            <Text style={{ color: C.primary, fontWeight: "700" }}>More</Text>
          </Pressable>
          {TextScan && (
            <>
              <IconButton name="camera" label="Scan with camera" color={C.primary} onPress={() => void scan("camera")} />
              <IconButton name="image" label="Scan a screenshot" color={C.primary} onPress={() => void scan("library")} />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
