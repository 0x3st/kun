const SPEED = 2.5;
const REAL_DAY_MS = 24 * 60 * 60 * 1000;
const EPOCH_MS = Date.parse("2018-01-01T00:00:00+08:00");
const MONTH_LENGTHS = [37, 36, 37, 36, 37, 36, 37, 36, 37, 36];

function isLeapKunYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function daysInKunYear(year) {
  return isLeapKunYear(year) ? 366 : 365;
}

function chineseNumber(number) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (number < 10) return digits[number];
  if (number === 10) return "十";
  if (number < 20) return `十${digits[number % 10]}`;
  if (number < 100) {
    const tens = Math.floor(number / 10);
    const ones = number % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ""}`;
  }
  return String(number);
}

function yearName(year) {
  return year === 1 ? "坤坤元年" : `坤坤${chineseNumber(year)}年`;
}

function pad(number, length = 2) {
  return String(number).padStart(length, "0");
}

function toBeijingIso(timestamp) {
  return new Date(timestamp + 8 * 60 * 60 * 1000)
    .toISOString()
    .replace("Z", "+08:00");
}

function parseKunDate(timestamp) {
  const realElapsed = timestamp - EPOCH_MS;
  if (realElapsed < 0) return { beforeEpoch: true };

  const totalKunDays = realElapsed / SPEED / REAL_DAY_MS;
  let wholeDays = Math.floor(totalKunDays);
  const dayFraction = totalKunDays - wholeDays;

  let year = 1;
  while (wholeDays >= daysInKunYear(year)) {
    wholeDays -= daysInKunYear(year);
    year++;
  }

  const dayOfYearZeroBased = wholeDays;
  const yearLength = daysInKunYear(year);
  let month = null;
  let day = null;
  let remaining = wholeDays;

  for (let index = 0; index < MONTH_LENGTHS.length; index++) {
    if (remaining < MONTH_LENGTHS[index]) {
      month = index + 1;
      day = remaining + 1;
      break;
    }
    remaining -= MONTH_LENGTHS[index];
  }

  const leapDay = month === null;
  const secondsInDay = dayFraction * 24 * 60 * 60;
  const hour = Math.floor(secondsInDay / 3600);
  const minute = Math.floor((secondsInDay % 3600) / 60);
  const second = Math.floor(secondsInDay % 60);
  const millisecond = Math.floor((secondsInDay - Math.floor(secondsInDay)) * 1000);
  const season = leapDay ? null : Math.ceil(month / 2);

  return {
    beforeEpoch: false,
    year,
    yearName: yearName(year),
    month,
    day,
    leapDay,
    season,
    seasonName: leapDay ? "年终 · 爱坤日" : `第${chineseNumber(season)}坤季`,
    dateText: leapDay
      ? `${yearName(year)} · 爱坤日`
      : `${yearName(year)} · ${chineseNumber(month)}月${chineseNumber(day)}日`,
    hour,
    minute,
    second,
    millisecond,
    time: `${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}`,
    status: leapDay ? "爱坤日" : month % 2 === 1 ? "大坤月" : "小坤月",
    dayProgress: Number((dayFraction * 100).toFixed(6)),
    yearProgress: Number((((dayOfYearZeroBased + dayFraction) / yearLength) * 100).toFixed(6))
  };
}

function jsonResponse(body, status = 200, includeBody = true) {
  return new Response(includeBody ? JSON.stringify(body, null, 2) : null, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isNowEndpoint = url.pathname === "/now" || url.pathname === "/now/";

    if (!isNowEndpoint) return env.ASSETS.fetch(request);

    if (request.method === "OPTIONS") return jsonResponse({}, 204, false);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    const timestamp = Date.now();
    const payload = {
      ok: true,
      api: "kun-calendar",
      version: 1,
      unixMs: timestamp,
      timezone: "Asia/Shanghai",
      beijingTime: toBeijingIso(timestamp),
      kun: parseKunDate(timestamp),
      rules: {
        epoch: "2018-01-01T00:00:00+08:00",
        realSecondsPerKunSecond: SPEED,
        kunHoursPerDay: 24,
        monthsPerYear: 10
      }
    };

    return jsonResponse(payload, 200, request.method !== "HEAD");
  }
};
