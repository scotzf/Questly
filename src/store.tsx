import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { applyFreezes, dayXp, initialState, progress, State } from "./domain";
import { loadState, saveState } from "./storage";
import { syncReminders } from "./reminders";
import { syncWidget } from "./widget";
type Store = {
  state: State;
  ready: boolean;
  error: string;
  notice: string;
  clearNotice: () => void;
  retry: () => void;
  update: (fn: (s: State) => State) => Promise<void>;
  /** Latest XP gain, for the "+XP" toast; `id` changes on every gain. */
  gain: Gain | null;
};
export type Gain = { id: number; xp: number; goal: boolean };
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gain, setGain] = useState<Gain | null>(null);
  const queue = useRef(Promise.resolve());
  const reminderQueue = useRef(Promise.resolve());
  function refreshReminders(next: State) {
    syncWidget(next);
    reminderQueue.current = reminderQueue.current
      .catch(() => {})
      .then(() => syncReminders(next))
      .catch(() =>
        setNotice("Reminders blocked"),
      );
  }
  function load() {
    void loadState()
      .then(async (saved) => {
        // Missed days are covered by streak freezes the moment the app opens.
        const value = applyFreezes(saved);
        if (value !== saved) await saveState(value);
        ref.current = value;
        setState(value);
        setReady(true);
        refreshReminders(value);
      })
      .catch(() =>
        setError("Couldn't load your data"),
      );
  }
  function retry() {
    setError("");
    load();
  }
  useEffect(load, []);
  function update(fn: (s: State) => State) {
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        const prev = ref.current;
        const next = fn(prev);
        await saveState(next);
        ref.current = next;
        const xp = progress(next).xp - progress(prev).xp;
        if (xp > 0) {
          const now = Date.now();
          const goal = next.settings.dailyGoal;
          setGain({ id: now, xp, goal: dayXp(prev, now) < goal && dayXp(next, now) >= goal });
        }
        setState(next);
        refreshReminders(next);
      });
    queue.current = job;
    return job;
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        error,
        notice,
        clearNotice: () => setNotice(""),
        retry,
        gain,
        update,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
