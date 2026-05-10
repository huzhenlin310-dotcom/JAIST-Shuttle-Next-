import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  findUpcomingTimes,
  getServiceIdForDate,
  parseTimeToMinutes,
  validateTimetable
} from "../timetable-core.js";

const timetable = JSON.parse(await readFile(new URL("../timetable.tsurugi.json", import.meta.url), "utf8"));

test("parses HH:mm values into minutes", () => {
  assert.equal(parseTimeToMinutes("6:57"), 417);
  assert.equal(parseTimeToMinutes("20:50"), 1250);
});

test("resolves weekday, weekend, and configured public holiday services", () => {
  assert.equal(getServiceIdForDate(new Date("2026-05-11T09:00:00+09:00"), timetable.holidayDates), "weekday");
  assert.equal(getServiceIdForDate(new Date("2026-05-10T09:00:00+09:00"), timetable.holidayDates), "satSunHoliday");
  assert.equal(getServiceIdForDate(new Date("2026-05-06T09:00:00+09:00"), timetable.holidayDates), "satSunHoliday");
});

test("includes a bus that leaves exactly at the current minute", () => {
  const favorite = { stopId: "tsurugi", directionId: "to-jaist" };
  const upcoming = findUpcomingTimes(timetable, favorite, new Date("2026-05-11T06:57:00+09:00"));
  assert.equal(upcoming[0].time, "6:57");
  assert.equal(upcoming[0].minutesUntil, 0);
});

test("finds the next weekday departure between buses", () => {
  const favorite = { stopId: "tsurugi", directionId: "to-jaist" };
  const upcoming = findUpcomingTimes(timetable, favorite, new Date("2026-05-11T06:58:00+09:00"));
  assert.equal(upcoming[0].time, "7:37");
  assert.equal(upcoming[0].minutesUntil, 39);
  assert.equal(upcoming[1].time, "8:16");
});

test("rolls over to the next service day after the final bus", () => {
  const favorite = { stopId: "jaist", directionId: "to-tsurugi" };
  const upcoming = findUpcomingTimes(timetable, favorite, new Date("2026-05-09T21:05:00+09:00"));
  assert.equal(upcoming[0].dateKey, "2026-05-10");
  assert.equal(upcoming[0].time, "7:20");
  assert.equal(upcoming[0].serviceId, "satSunHoliday");
});

test("all trip rows are monotonic in their travel direction", () => {
  assert.deepEqual(validateTimetable(timetable), []);
});
