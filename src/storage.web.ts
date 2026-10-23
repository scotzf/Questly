import { initialState, State, withDefaults } from "./domain";
// Browser preview only. Android/iOS use the SQLite implementation.
export async function loadState(): Promise<State> {
  const raw = localStorage.getItem("focuspal.v1");
  return raw ? withDefaults(JSON.parse(raw)) : initialState();
}
export async function saveState(state: State) {
  localStorage.setItem("focuspal.v1", JSON.stringify(state));
}
