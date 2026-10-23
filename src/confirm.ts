import { Alert, Platform } from "react-native";
export function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web")
    return Promise.resolve(
      window.confirm(message ? `${title}\n\n${message}` : title),
    );
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message || undefined,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirm", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
