import { requireOptionalNativeModule } from "expo";
type QuestlyWidgetModule = {
  /** JSON snapshot: { streak, coins, level, xp, goal, next, dayStart }. */
  update(json: string): Promise<void>;
  /** Asks the launcher to add the widget; false if unsupported. */
  requestPin(): Promise<boolean>;
};
/** Null on platforms without the native module (web, Expo Go). */
export default requireOptionalNativeModule<QuestlyWidgetModule>("QuestlyWidget");
