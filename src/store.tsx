import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { initialState, State } from "./domain";
import { loadState, saveState } from "./storage";
import { syncReminders } from "./reminders";
type Store = {
  state: State;
  ready: boolean;
  error: string;
  notice: string;
  clearNotice: () => void;
  retry: () => void;
  update: (fn: (s: State) => State) => Promise<void>;
};
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const queue = useRef(Promise.resolve());
  const reminderQueue = useRef(Promise.resolve());
  function refreshReminders(next: State) {
    reminderQueue.current = reminderQueue.current
      .catch(() => {})
      .then(() => syncReminders(next))
      .catch(() =>
        setNotice("Reminders blocked"),
      );
  }
  function load() {
    void loadState()
      .then((value) => {
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
        const next = fn(ref.current);
        await saveState(next);
        ref.current = next;
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
        update,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
