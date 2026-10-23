import { Tabs, Redirect } from "expo-router";
import { Icon, IconName } from "../../src/ui";
import { C } from "../../src/theme";
import { useStore } from "../../src/store";
const TABS: [string, string, IconName, IconName][] = [
  ["index", "Home", "home-outline", "home"],
  ["tasks", "Tasks", "checkbox-outline", "checkbox"],
  ["focus", "Focus", "timer-outline", "timer"],
  ["calendar", "Calendar", "calendar-outline", "calendar"],
  ["more", "More", "ellipsis-horizontal-circle-outline", "ellipsis-horizontal-circle"],
];
export default function TabsLayout() {
  const { state } = useStore();
  if (!state.settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
          elevation: 12,
          shadowColor: "#1F2A44",
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {TABS.map(([name, title, icon, active]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? active : icon} color={typeof color === "string" ? color : C.primary} size={24} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
