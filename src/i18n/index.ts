/**
 * i18n entry point. Usage:
 *   import { t } from "@i18n";
 *   t("home.hero.title")
 *   t("progress.percent", { value: 42 })
 *
 * Interpolation replaces `{name}` tokens. Missing keys return the key itself in
 * dev (so gaps are visible) rather than throwing.
 */
import { LOCALE } from "../config/site";
import { strings as enUS, type StringKey } from "./en-US";

type Dictionary = Record<string, string>;

const dictionaries: Record<string, Dictionary> = {
  "en-US": enUS,
};

function getDictionary(loc: string): Dictionary {
  return dictionaries[loc] ?? dictionaries[LOCALE.primary]!;
}

export type Vars = Record<string, string | number>;

export function translate(key: StringKey, vars?: Vars, loc: string = LOCALE.primary): string {
  const dict = getDictionary(loc);
  const template = dict[key] ?? enUS[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

/** Short alias. */
export const t = translate;

export { LOCALE };
export type { StringKey };
export * from "./format";
