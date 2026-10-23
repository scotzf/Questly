import { State } from "./domain";
export async function requestReminders() {
  return false;
}
export async function syncReminders(_state: State) {
  /* Native reminders require an Android or iOS build. */
}
export function listenForReminder(_open: (id: string) => void) {
  return () => {};
}
