import React from "react";
import { View } from "react-native";
import { C } from "./ui";
export default function DateField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const local = value
    ? new Date(value - new Date(value).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
  return (
    <View>
      <input
        aria-label="Date and time"
        type="datetime-local"
        value={local}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value).getTime() : null)
        }
        style={{
          padding: 14,
          borderRadius: 14,
          border: "none",
          fontSize: 16,
          color: C.ink,
          background: "#F1F4F9",
          minHeight: 24,
        }}
      />
    </View>
  );
}
