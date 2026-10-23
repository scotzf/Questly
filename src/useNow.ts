import { useEffect, useState } from "react";
import { AppState } from "react-native";
/** Current time, refreshed on an interval and when the app returns. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener("change", () => setNow(Date.now()));
    return () => {
      clearInterval(i);
      sub.remove();
    };
  }, [intervalMs]);
  return now;
}
