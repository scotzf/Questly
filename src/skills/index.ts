import type { AreaId, Level, Skill } from "./types";
import { TAXONOMY } from "./taxonomy";
import { FITNESS } from "./content/fitness";
import { SPORTS } from "./content/sports";
import { EDUCATION } from "./content/education";
import { MENTAL } from "./content/mental";
import { HEALTH } from "./content/health";
import { SPIRITUAL } from "./content/spiritual";
import { RESTORATIVE } from "./content/restorative";
import { INTELLECT } from "./content/intellect";
import { READING } from "./content/reading";
import { SCIENCE } from "./content/science";
import { DEVELOPMENT } from "./content/development";
import { PRODUCTIVITY } from "./content/productivity";
import { LANGUAGE } from "./content/language";
import { FINANCE } from "./content/finance";
import { SOCIAL } from "./content/social";
import { VOLUNTEERING } from "./content/volunteering";
import { CAREER } from "./content/career";
import { TECH } from "./content/tech";
import { BUSINESS } from "./content/business";
import { LEADERSHIP } from "./content/leadership";
import { ARTS } from "./content/arts";
import { MUSIC } from "./content/music";
import { MEDIA } from "./content/media";
import { CULTURE } from "./content/culture";
import { RECREATION } from "./content/recreation";
import { NATURE } from "./content/nature";
import { TRAVEL } from "./content/travel";
import { FOOD } from "./content/food";
import { LEISURE } from "./content/leisure";
import { COMPETITIVE } from "./content/competitive";
import { HOUSEHOLD } from "./content/household";
import { CARE } from "./content/care";
import { DIY } from "./content/diy";
import { ADMIN } from "./content/admin";
import { ANIMALS } from "./content/animals";
export * from "./types";
export { TAXONOMY };
/** Every authored skill. New content files are appended here. */
export const SKILLS: Skill[] = [...FITNESS, ...SPORTS, ...EDUCATION, ...MENTAL, ...HEALTH, ...SPIRITUAL, ...RESTORATIVE, ...INTELLECT, ...READING, ...SCIENCE, ...DEVELOPMENT, ...PRODUCTIVITY, ...LANGUAGE, ...FINANCE, ...SOCIAL, ...VOLUNTEERING, ...CAREER, ...TECH, ...BUSINESS, ...LEADERSHIP, ...ARTS, ...MUSIC, ...MEDIA, ...CULTURE, ...RECREATION, ...NATURE, ...TRAVEL, ...FOOD, ...LEISURE, ...COMPETITIVE, ...HOUSEHOLD, ...CARE, ...DIY, ...ADMIN, ...ANIMALS];
const byId = new Map(SKILLS.map((s) => [s.id, s]));
export const skillById = (id: string | undefined) => (id ? byId.get(id) : undefined);
export const categoriesInArea = (area: AreaId) =>
  TAXONOMY.filter((c) => c.area === area && SKILLS.some((s) => s.category === c.id));
export const skillsInCategory = (category: string) => SKILLS.filter((s) => s.category === category);
/** Main levels, then the chosen branch's levels. */
export const pathLevels = (skill: Skill, branch?: string | null): Level[] => [
  ...skill.levels,
  ...(skill.branches?.find((b) => b.id === branch)?.levels ?? []),
];
const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const INDEX = SKILLS.map((s) => ({
  skill: s,
  re: new RegExp(`\\b(${s.keywords.map(escape).join("|")})s?\\b`, "i"),
}));
/** Best-matching skill for free text ("leg day at the gym" → Strength Training). */
export const detectSkill = (text: string): Skill | undefined =>
  INDEX.find((x) => x.re.test(text))?.skill;
