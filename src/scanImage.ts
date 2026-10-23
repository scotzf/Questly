import { router } from "expo-router";
import TextScan from "../modules/text-scan";
import { parseScan } from "./scan";
import { detectSkill } from "./skills";
/** Reads an image on-device and opens the editor prefilled with the result. */
export async function scanImage(uri: string, replace = false) {
  if (!TextScan) throw new Error("Scanning needs the Android app");
  const draft = parseScan(JSON.parse(await TextScan.recognize(uri)), new Date(), (text) =>
    detectSkill(text)?.area,
  );
  const route = { pathname: "/editor", params: { draft: JSON.stringify(draft) } } as const;
  if (replace) router.replace(route);
  else router.push(route);
}
