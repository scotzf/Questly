import React, { useState } from "react";
import { Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, C, Icon, date, time, s } from "./ui";
/** Date pill + time pill; clearing removes both. */
export default function DateField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const [mode, setMode] = useState<"date" | "time" | null>(null);
  const [opened, setOpened] = useState(0);
  const open = (m: "date" | "time") => {
    setOpened(Date.now());
    setMode(m);
  };
  return (
    <View style={[s.row, { gap: 8 }]}>
      <Button
        kind="secondary"
        icon="calendar-outline"
        label={value ? date(value) : "Date"}
        onPress={() => open("date")}
        style={{ flex: 1 }}
      />
      <Button
        kind="secondary"
        icon="time-outline"
        label={value ? time(value) : "Time"}
        onPress={() => open(value ? "time" : "date")}
        style={{ flex: 1 }}
      />
      {value !== null && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear date"
          onPress={() => onChange(null)}
          style={{ width: 44, height: 48, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="close-circle" color={C.faint} />
        </Pressable>
      )}
      {mode && (
        <DateTimePicker
          value={new Date(value ?? opened)}
          mode={mode}
          onChange={(event, d) => {
            if (event.type === "dismissed") {
              setMode(null);
              return;
            }
            if (d) onChange(d.getTime());
            setMode(mode === "date" && value === null ? "time" : null);
          }}
        />
      )}
    </View>
  );
}
