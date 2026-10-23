import { Pressable, Text, View } from "react-native";
import { useRef } from "react";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { router } from "expo-router";
import { Task, deleteTask, toggleTask } from "./domain";
import { useStore } from "./store";
import { CATEGORIES, PRIORITY } from "./theme";
import { C, Check, Icon, Pill, date, haptic, s, time } from "./ui";
function Action({ icon, color, align }: { icon: "checkmark" | "trash"; color: string; align: "flex-start" | "flex-end" }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color,
        borderRadius: 18,
        marginBottom: 12,
        justifyContent: "center",
        alignItems: align,
        paddingHorizontal: 24,
      }}
    >
      <Icon name={icon} color={C.white} size={26} />
    </View>
  );
}
/** Category-tinted task row. Swipe right = done, left = delete. */
export default function TaskCard({
  task,
  now,
  showTime = false,
}: {
  task: Task;
  now: number;
  showTime?: boolean;
}) {
  const { update, state } = useStore();
  const cat = CATEGORIES[task.category];
  const overdue = !!task.dueAt && task.dueAt < now && !task.completedAt;
  const locked = state.timer?.taskId === task.id;
  const done = task.steps.filter((x) => x.done).length;
  const swipe = useRef<SwipeableMethods>(null);
  return (
    <Swipeable
      ref={swipe}
      enabled={!locked}
      friction={1.6}
      leftThreshold={70}
      rightThreshold={70}
      renderLeftActions={() => <Action icon="checkmark" color={C.success} align="flex-start" />}
      renderRightActions={() => <Action icon="trash" color={C.danger} align="flex-end" />}
      onSwipeableOpen={(direction) => {
        haptic("success");
        swipe.current?.close();
        void update((v) =>
          direction === "right" ? toggleTask(v, task.id) : deleteTask(v, task.id),
        );
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={task.title}
        onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}
        style={({ pressed }) => [
          s.row,
          {
            backgroundColor: task.completedAt ? C.white : cat.pale,
            borderRadius: 18,
            padding: 14,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: cat.color,
          },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={[
              s.h3,
              !!task.completedAt && { textDecorationLine: "line-through", color: C.faint },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={[s.row, { gap: 6, flexWrap: "wrap" }]}>
            <Pill label={cat.label} color={cat.color} background={C.white} icon={cat.icon} />
            {task.dueAt && (showTime || overdue) && (
              <Pill
                label={showTime && !overdue ? time(task.dueAt) : date(task.dueAt)}
                color={overdue ? C.danger : C.muted}
                background={C.white}
                icon={overdue ? "alert-circle" : "time-outline"}
              />
            )}
            {task.steps.length > 0 && (
              <Pill label={`${done}/${task.steps.length}`} color={C.muted} background={C.white} icon="list" />
            )}
            {task.priority === "High" && !task.completedAt && (
              <Icon name="flag" color={PRIORITY.High.color} size={16} />
            )}
          </View>
        </View>
        {!locked && (
          <Check
            done={!!task.completedAt}
            color={cat.color}
            onPress={() => void update((v) => toggleTask(v, task.id))}
          />
        )}
      </Pressable>
    </Swipeable>
  );
}
