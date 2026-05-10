export const MINUTES_PER_DAY = 24 * 60;

export function parseTimeToMinutes(time) {
  if (typeof time !== "string") {
    throw new TypeError("time must be a HH:mm string");
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time: ${time}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  return hours * 60 + minutes;
}

export function formatMinutesAsTime(minutes) {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getJapanDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    dateKey,
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

export function addDaysToDateKey(dateKey, offsetDays) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function dayOfWeekFromDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function resolveServiceForDateKey(dateKey, holidayDates = [], override = "auto") {
  if (override === "weekday" || override === "satSunHoliday") {
    return override;
  }

  const dayOfWeek = dayOfWeekFromDateKey(dateKey);
  if (dayOfWeek === 0 || dayOfWeek === 6 || holidayDates.includes(dateKey)) {
    return "satSunHoliday";
  }

  return "weekday";
}

export function getServiceIdForDate(date = new Date(), holidayDates = [], override = "auto") {
  const { dateKey } = getJapanDateParts(date);
  return resolveServiceForDateKey(dateKey, holidayDates, override);
}

export function getDirection(timetable, directionId) {
  const direction = timetable.directions.find((item) => item.id === directionId);
  if (!direction) {
    throw new Error(`Unknown direction: ${directionId}`);
  }
  return direction;
}

export function getStop(timetable, stopId) {
  const stop = timetable.stops.find((item) => item.id === stopId);
  if (!stop) {
    throw new Error(`Unknown stop: ${stopId}`);
  }
  return stop;
}

export function getTripsForStop(timetable, { stopId, directionId, serviceId }) {
  return timetable.trips
    .filter((trip) => trip.directionId === directionId && trip.serviceId === serviceId)
    .filter((trip) => typeof trip.timesByStopId[stopId] === "string")
    .sort((a, b) => parseTimeToMinutes(a.timesByStopId[stopId]) - parseTimeToMinutes(b.timesByStopId[stopId]));
}

export function findUpcomingTimes(timetable, favorite, date = new Date(), options = {}) {
  const count = options.count ?? 3;
  const override = options.serviceOverride ?? "auto";
  const lookAheadDays = options.lookAheadDays ?? 14;
  const current = getJapanDateParts(date);
  const results = [];

  for (let offset = 0; offset <= lookAheadDays && results.length < count; offset += 1) {
    const dateKey = addDaysToDateKey(current.dateKey, offset);
    const serviceId = resolveServiceForDateKey(dateKey, timetable.holidayDates, override);
    const trips = getTripsForStop(timetable, {
      stopId: favorite.stopId,
      directionId: favorite.directionId,
      serviceId
    });

    for (const trip of trips) {
      const time = trip.timesByStopId[favorite.stopId];
      const minutes = parseTimeToMinutes(time);
      if (offset === 0 && minutes < current.minutes) {
        continue;
      }

      results.push({
        tripId: trip.id,
        time,
        serviceId,
        dateKey,
        dayOffset: offset,
        minutesUntil: offset * MINUTES_PER_DAY + minutes - current.minutes
      });

      if (results.length >= count) {
        break;
      }
    }
  }

  return results;
}

export function validateTimetable(timetable) {
  const errors = [];

  for (const direction of timetable.directions) {
    const stopOrder = direction.stopIds;
    for (const trip of timetable.trips.filter((item) => item.directionId === direction.id)) {
      let previous = -1;
      for (const stopId of stopOrder) {
        const time = trip.timesByStopId[stopId];
        if (!time) {
          continue;
        }

        const minutes = parseTimeToMinutes(time);
        if (minutes < previous) {
          errors.push(`${trip.id} is not monotonic at ${stopId}`);
        }
        previous = minutes;
      }
    }
  }

  return errors;
}
