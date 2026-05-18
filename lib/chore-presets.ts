import type { DayOfWeek } from "./types";

export const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const WEEKDAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];

export type PresetCategory = "routine" | "study" | "health" | "hobby";

export type PresetChore = {
  title: string;
  icon: string;
  points: number;
  recurrence: DayOfWeek[];
  category: PresetCategory;
};

export type AgeBracket = "4-6" | "7-10" | "11-13" | "14+";

export const BRACKETS: { key: AgeBracket; label: string; tagline: string }[] = [
  { key: "4-6",   label: "Ages 4–6",   tagline: "Routines & little wins" },
  { key: "7-10",  label: "Ages 7–10",  tagline: "School + healthy habits" },
  { key: "11-13", label: "Ages 11–13", tagline: "Study, sport, responsibility" },
  { key: "14+",   label: "Ages 14+",   tagline: "Self-driven schedule" },
];

export const AGE_PRESETS: Record<AgeBracket, PresetChore[]> = {
  "4-6": [
    { title: "Brush teeth (morning)",   icon: "🪥", points: 10, recurrence: ALL_DAYS, category: "health" },
    { title: "Brush teeth (night)",     icon: "🌙", points: 10, recurrence: ALL_DAYS, category: "health" },
    { title: "Tidy toys",               icon: "🧸", points: 10, recurrence: ALL_DAYS, category: "routine" },
    { title: "Eat veggies at dinner",   icon: "🥦", points: 10, recurrence: ALL_DAYS, category: "health" },
    { title: "Bedtime by 9pm",          icon: "😴", points: 10, recurrence: ALL_DAYS, category: "routine" },
    { title: "Wash hands before meals", icon: "🧼", points: 5,  recurrence: ALL_DAYS, category: "health" },
    { title: "Help set the table",      icon: "🍽️", points: 10, recurrence: ALL_DAYS, category: "routine" },
  ],
  "7-10": [
    { title: "Brush teeth twice",         icon: "🪥", points: 10, recurrence: ALL_DAYS, category: "health" },
    { title: "Make bed",                  icon: "🛏️", points: 10, recurrence: ALL_DAYS, category: "routine" },
    { title: "Read 15 min",               icon: "📚", points: 15, recurrence: ALL_DAYS, category: "study" },
    { title: "Homework done",             icon: "✏️", points: 20, recurrence: WEEKDAYS, category: "study" },
    { title: "Pack school bag",           icon: "🎒", points: 10, recurrence: WEEKDAYS, category: "routine" },
    { title: "Tidy room",                 icon: "🧹", points: 15, recurrence: ALL_DAYS, category: "routine" },
    { title: "30 min outdoor play",       icon: "🏃", points: 15, recurrence: ALL_DAYS, category: "health" },
    { title: "Practice instrument",       icon: "🎵", points: 20, recurrence: WEEKDAYS, category: "hobby" },
    { title: "Bedtime by 9:30pm",         icon: "🌙", points: 10, recurrence: ALL_DAYS, category: "routine" },
  ],
  "11-13": [
    { title: "Homework done",                icon: "✏️", points: 20, recurrence: WEEKDAYS, category: "study" },
    { title: "Read 30 min",                  icon: "📚", points: 20, recurrence: ALL_DAYS, category: "study" },
    { title: "Exercise / sport",             icon: "🏃", points: 25, recurrence: ALL_DAYS, category: "health" },
    { title: "Practice instrument",          icon: "🎵", points: 20, recurrence: WEEKDAYS, category: "hobby" },
    { title: "Tidy room",                    icon: "🧹", points: 15, recurrence: ALL_DAYS, category: "routine" },
    { title: "Help with a household chore",  icon: "🧺", points: 15, recurrence: ALL_DAYS, category: "routine" },
    { title: "Pack school bag night before", icon: "🎒", points: 10, recurrence: WEEKDAYS, category: "routine" },
    { title: "Bedtime by 10pm",              icon: "🌙", points: 10, recurrence: ALL_DAYS, category: "routine" },
  ],
  "14+": [
    { title: "Study session (60 min)",      icon: "✏️", points: 25, recurrence: ALL_DAYS, category: "study" },
    { title: "Exercise / gym",              icon: "💪", points: 25, recurrence: ALL_DAYS, category: "health" },
    { title: "Read 30 min",                 icon: "📚", points: 20, recurrence: ALL_DAYS, category: "study" },
    { title: "Help with a household chore", icon: "🧺", points: 15, recurrence: ALL_DAYS, category: "routine" },
    { title: "Practice skill / hobby",      icon: "🎯", points: 25, recurrence: WEEKDAYS, category: "hobby" },
    { title: "Sleep by 11pm",               icon: "🌙", points: 10, recurrence: ALL_DAYS, category: "routine" },
  ],
};
