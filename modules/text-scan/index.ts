import { requireOptionalNativeModule } from "expo";
type TextScanModule = {
  /** JSON array of { text, top, left, height } for each recognised line. */
  recognize(uri: string): Promise<string>;
  /** File URI of an image shared to the app (Share → Questly), returned once. */
  takeSharedImage(): Promise<string | null>;
};
/** Null on platforms without the native module (web, Expo Go). */
export default requireOptionalNativeModule<TextScanModule>("TextScan");
