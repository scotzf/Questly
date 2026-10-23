import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { State } from "./domain";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function requestReminders() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("study", {
      name: "Study reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return (await Notifications.requestPermissionsAsync()).granted;
}
export async function syncReminders(state: State) {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => n.identifier.startsWith("focuspal-"))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!state.settings.reminders) return;
  if (!(await Notifications.getPermissionsAsync()).granted)
    throw new Error("Notifications are disabled in device settings.");
  const { notify, quietStart, quietEnd } = state.settings;
  const quiet = (at: number) => {
    const h = new Date(at).getHours();
    return quietStart > quietEnd
      ? h >= quietStart || h < quietEnd
      : h >= quietStart && h < quietEnd;
  };
  const events: { id: string; taskId: string; at: number; body: string }[] =
    notify.focus
      ? state.slots.map((s) => ({
          id: s.id,
          taskId: s.taskId,
          at: s.start,
          body: "Focus time",
        }))
      : [];
  if (state.timer?.endsAt)
    events.push({
      id: `timer-${state.timer.id}`,
      taskId: state.timer.taskId,
      at: state.timer.endsAt,
      body: "Session done",
    });
  for (const t of state.tasks.filter((t) => !t.completedAt && t.dueAt)) {
    if (notify.tasks && t.reminder !== null)
      events.push({
        id: `task-${t.id}`,
        taskId: t.id,
        at: t.dueAt! - t.reminder * 60000,
        body: t.reminder ? `In ${t.reminder} min` : "Now",
      });
    if (notify.deadlines)
      events.push({
        id: `due-${t.id}`,
        taskId: t.id,
        at: t.dueAt! - 15 * 60000,
        body: "Due in 15 min",
      });
  }
  if (notify.daily)
    await Notifications.scheduleNotificationAsync({
      identifier: "focuspal-daily",
      content: {
        title: "Today",
        body: `${state.tasks.filter((t) => !t.completedAt).length} tasks open`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
        channelId: "study",
      },
    });
  for (const event of events
    .filter((e) => e.at > Date.now() && (e.id.startsWith("timer-") || !quiet(e.at)))
    .sort((a, b) => a.at - b.at)
    .slice(0, 50)) {
    const task = state.tasks.find(
      (t) => t.id === event.taskId && !t.completedAt,
    );
    if (!task) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `focuspal-${event.id}`,
      content: {
        title: task.title,
        body: event.body,
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(event.at),
        channelId: "study",
      },
    });
  }
}
export function listenForReminder(open: (id: string) => void) {
  const handle = (r: Notifications.NotificationResponse | null) => {
    const id = r?.notification.request.content.data?.taskId;
    if (typeof id === "string") open(id);
  };
  void Notifications.getLastNotificationResponseAsync().then(handle);
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
