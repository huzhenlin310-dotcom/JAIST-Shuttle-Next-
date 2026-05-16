import {
  addDaysToDateKey,
  findUpcomingTimes,
  formatMinutesAsTime,
  getDirection,
  getJapanDateParts,
  getServiceIdForDate,
  getStop,
  MINUTES_PER_DAY,
  parseTimeToMinutes,
  resolveServiceForDateKey
} from "./timetable-core.js";

const STORAGE_KEYS = {
  favorites: "jaist-bus:favorites:v1",
  reminders: "jaist-bus:reminders:v1",
  serviceOverride: "jaist-bus:service-override:v1",
  language: "jaist-bus:language:v1"
};

const SUPPORTED_LANGUAGES = ["ja", "en", "zh"];
const REMINDER_LEAD_MINUTES = 10;

const TRANSLATIONS = {
  ja: {
    documentTitle: "JAIST Shuttle Next",
    documentDescription: "JAIST Shuttle 鶴来線 次のバス検索 PWA",
    appTitle: "次のバス",
    mainNav: "メインナビゲーション",
    languageSwitch: "言語切り替え",
    tabs: {
      home: "次のバス",
      settings: "よく使う",
      timetable: "時刻表",
      reminders: "通知"
    },
    home: {
      serviceKicker: "運行日",
      loading: "自動判定中",
      serviceOverride: "運行日の切り替え",
      serviceStatus: "{service} · {mode}"
    },
    override: {
      auto: "自動",
      manual: "手動"
    },
    service: {
      weekday: "平日",
      satSunHoliday: "土日祝"
    },
    directions: {
      "to-jaist": "JAIST 行き",
      "to-tsurugi": "鶴来駅 行き"
    },
    settings: {
      kicker: "よく使う停留所",
      title: "停留所と方面"
    },
    forms: {
      stop: "停留所",
      direction: "方面",
      note: "メモ",
      notePlaceholder: "例：朝の通学",
      addFavorite: "追加",
      serviceDay: "運行日",
      departureTime: "出発時刻",
      addReminder: "通知を追加"
    },
    empty: {
      title: "よく使う停留所がありません",
      body: "追加すると、ホームに次のバスと後続便が表示されます。",
      action: "停留所を追加"
    },
    cards: {
      routeLabel: "乗車区間",
      departureLabel: "次の発車",
      delayNote: "交通状況により遅れる場合があります。現地の運行状況を確認してください。"
    },
    actions: {
      up: "上へ",
      down: "下へ",
      remove: "削除"
    },
    timetable: {
      kicker: "鶴来線",
      title: "全時刻表",
      revision: "データ改訂日 {date}",
      source: "出典",
      sourceLink: "JAIST 公式PDF",
      trip: "便"
    },
    reminders: {
      kicker: "出発前通知",
      title: "通知",
      enableNotifications: "通知を有効にする",
      permissionGranted: "ブラウザー通知は有効です。登録した便の出発10分前に通知します。",
      permissionPrompt: "通知を有効にすると、登録した便の出発10分前に知らせます。",
      permissionDenied: "通知がブロックされています。ブラウザー設定で許可してください。",
      permissionUnsupported: "このブラウザーは通知に対応していません。",
      emptyTitle: "通知がありません",
      emptyBody: "停留所、方面、時刻を選ぶと、出発10分前に通知します。",
      repeatNote: "該当する運行日に毎回通知します。",
      nextNotification: "次回通知 {day} {time}",
      departure: "出発 {time}",
      noTimes: "この条件の便はありません"
    },
    notifications: {
      title: "バスがまもなく到着します",
      body: "{stop} {time}発、{destination}行きのバスが約10分後に到着します。"
    },
    days: {
      today: "今日",
      tomorrow: "明日",
      inDays: "{count}日後"
    },
    countdown: {
      now: "今すぐ",
      minutes: "{count}分",
      hours: "{hours}時間",
      hoursMinutes: "{hours}時間{minutes}分"
    },
    errors: {
      fetchTimetable: "内蔵時刻表を読み込めません",
      fatalTitle: "起動できません"
    }
  },
  zh: {
    documentTitle: "JAIST Shuttle Next",
    documentDescription: "JAIST Shuttle 鶴来线下一班车查询 PWA",
    appTitle: "下一班车",
    mainNav: "主导航",
    languageSwitch: "语言切换",
    tabs: {
      home: "下一班",
      settings: "常用",
      timetable: "时刻表",
      reminders: "提醒"
    },
    home: {
      serviceKicker: "服务日",
      loading: "自动判定中",
      serviceOverride: "服务日覆盖",
      serviceStatus: "{service} · {mode}"
    },
    override: {
      auto: "自动",
      manual: "手动"
    },
    service: {
      weekday: "平日",
      satSunHoliday: "土日祝"
    },
    directions: {
      "to-jaist": "去 JAIST",
      "to-tsurugi": "去 鶴来駅"
    },
    settings: {
      kicker: "常用站点",
      title: "站点和方向"
    },
    forms: {
      stop: "站点",
      direction: "方向",
      note: "备注",
      notePlaceholder: "例：早上去学校",
      addFavorite: "添加常用",
      serviceDay: "服务日",
      departureTime: "发车时间",
      addReminder: "添加提醒"
    },
    empty: {
      title: "还没有常用站点",
      body: "添加后，首页会直接显示下一班车和后续班次。",
      action: "添加常用站点"
    },
    cards: {
      routeLabel: "乘车区间",
      departureLabel: "最近发车",
      delayNote: "交通情况可能导致延迟，请以现场运行情况为准。"
    },
    actions: {
      up: "上移",
      down: "下移",
      remove: "删除"
    },
    timetable: {
      kicker: "鶴来线",
      title: "完整时刻表",
      revision: "数据修订日 {date}",
      source: "来源",
      sourceLink: "JAIST 官方 PDF",
      trip: "班次"
    },
    reminders: {
      kicker: "发车前通知",
      title: "提醒",
      enableNotifications: "开启通知",
      permissionGranted: "浏览器通知已开启。已添加的班次会在发车前 10 分钟提醒。",
      permissionPrompt: "开启通知后，已添加的班次会在发车前 10 分钟提醒。",
      permissionDenied: "通知已被浏览器阻止，请在浏览器设置中允许通知。",
      permissionUnsupported: "当前浏览器不支持通知。",
      emptyTitle: "还没有提醒",
      emptyBody: "选择站点、方向和发车时间后，会在发车前 10 分钟提醒。",
      repeatNote: "会在每个对应服务日重复提醒。",
      nextNotification: "下次提醒 {day} {time}",
      departure: "{time} 发车",
      noTimes: "这个条件下没有班次"
    },
    notifications: {
      title: "班车马上到达",
      body: "{stop} {time} 开往 {destination} 的班车还有 10 分钟到达。"
    },
    days: {
      today: "今日",
      tomorrow: "明日",
      inDays: "{count}天后"
    },
    countdown: {
      now: "现在",
      minutes: "{count}分钟",
      hours: "{hours}小时",
      hoursMinutes: "{hours}小时{minutes}分"
    },
    errors: {
      fetchTimetable: "无法读取内置时刻表",
      fatalTitle: "无法启动"
    }
  },
  en: {
    documentTitle: "JAIST Shuttle Next",
    documentDescription: "JAIST Shuttle Tsurugi line next bus lookup PWA",
    appTitle: "Next Bus",
    mainNav: "Main navigation",
    languageSwitch: "Language",
    tabs: {
      home: "Next",
      settings: "Favorites",
      timetable: "Timetable",
      reminders: "Alerts"
    },
    home: {
      serviceKicker: "Service Day",
      loading: "Detecting automatically",
      serviceOverride: "Service day override",
      serviceStatus: "{service} · {mode}"
    },
    override: {
      auto: "Auto",
      manual: "Manual"
    },
    service: {
      weekday: "Weekday",
      satSunHoliday: "Sat/Sun/Holiday"
    },
    directions: {
      "to-jaist": "To JAIST",
      "to-tsurugi": "To Tsurugi Station"
    },
    settings: {
      kicker: "Favorite Stops",
      title: "Stop and Direction"
    },
    forms: {
      stop: "Stop",
      direction: "Direction",
      note: "Note",
      notePlaceholder: "e.g. Morning commute",
      addFavorite: "Add Favorite",
      serviceDay: "Service Day",
      departureTime: "Departure Time",
      addReminder: "Add Alert"
    },
    empty: {
      title: "No favorite stops yet",
      body: "Add one to show the next bus and later departures on the home screen.",
      action: "Add Favorite Stop"
    },
    cards: {
      routeLabel: "Route",
      departureLabel: "Next Departure",
      delayNote: "Traffic conditions may cause delays. Check the current service status at the stop."
    },
    actions: {
      up: "Up",
      down: "Down",
      remove: "Remove"
    },
    timetable: {
      kicker: "Tsurugi Line",
      title: "Full Timetable",
      revision: "Data revised {date}",
      source: "Source",
      sourceLink: "JAIST official PDF",
      trip: "Trip"
    },
    reminders: {
      kicker: "Departure Alert",
      title: "Alerts",
      enableNotifications: "Enable Notifications",
      permissionGranted: "Browser notifications are enabled. Saved trips will notify you 10 minutes before departure.",
      permissionPrompt: "Enable notifications to be alerted 10 minutes before saved departures.",
      permissionDenied: "Notifications are blocked. Allow them in your browser settings to receive alerts.",
      permissionUnsupported: "This browser does not support notifications.",
      emptyTitle: "No alerts yet",
      emptyBody: "Choose a stop, direction, and departure time to get an alert 10 minutes before it leaves.",
      repeatNote: "Repeats on each matching service day.",
      nextNotification: "Next alert {day} {time}",
      departure: "Departs {time}",
      noTimes: "No trips match this selection"
    },
    notifications: {
      title: "Bus arriving soon",
      body: "The {time} bus from {stop} to {destination} arrives in about 10 minutes."
    },
    days: {
      today: "Today",
      tomorrow: "Tomorrow",
      inDays: "In {count} days"
    },
    countdown: {
      now: "Now",
      minutes: "{count} min",
      hours: "{hours} hr",
      hoursMinutes: "{hours} hr {minutes} min"
    },
    errors: {
      fetchTimetable: "Unable to load the bundled timetable",
      fatalTitle: "Unable to start"
    }
  }
};

const state = {
  timetable: null,
  favorites: [],
  reminders: [],
  activeView: "home",
  serviceOverride: "auto",
  tableDirection: "to-jaist",
  tableService: "weekday",
  language: "ja"
};

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  clockLabel: document.querySelector("#clockLabel"),
  languageButtons: document.querySelectorAll("[data-language]"),
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  serviceButtons: document.querySelectorAll("[data-service-override]"),
  favoritesList: document.querySelector("#favoritesList"),
  emptyFavoritesTemplate: document.querySelector("#emptyFavoritesTemplate"),
  favoriteForm: document.querySelector("#favoriteForm"),
  stopSelect: document.querySelector("#stopSelect"),
  directionSelect: document.querySelector("#directionSelect"),
  nicknameInput: document.querySelector("#nicknameInput"),
  settingsList: document.querySelector("#settingsList"),
  tableDirectionSelect: document.querySelector("#tableDirectionSelect"),
  tableServiceSelect: document.querySelector("#tableServiceSelect"),
  timetableMeta: document.querySelector("#timetableMeta"),
  timetableTable: document.querySelector("#timetableTable"),
  reminderForm: document.querySelector("#reminderForm"),
  reminderStopSelect: document.querySelector("#reminderStopSelect"),
  reminderDirectionSelect: document.querySelector("#reminderDirectionSelect"),
  reminderServiceSelect: document.querySelector("#reminderServiceSelect"),
  reminderTimeSelect: document.querySelector("#reminderTimeSelect"),
  remindersList: document.querySelector("#remindersList"),
  emptyRemindersTemplate: document.querySelector("#emptyRemindersTemplate"),
  notificationStatus: document.querySelector("#notificationStatus"),
  enableNotificationsButton: document.querySelector("#enableNotificationsButton"),
  homeTitle: document.querySelector("#homeTitle")
};

bootstrap();

async function bootstrap() {
  try {
    state.language = loadLanguage();
    state.timetable = await fetchTimetable();
    state.favorites = loadFavorites();
    state.reminders = loadReminders();
    state.serviceOverride = loadServiceOverride();

    bindEvents();
    render();
    registerServiceWorker();
    window.setInterval(renderTimeSensitiveViews, 30_000);
  } catch (error) {
    renderFatalError(error);
  }
}

async function fetchTimetable() {
  const response = await fetch("./timetable.tsurugi.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(t("errors.fetchTimetable"));
  }
  return response.json();
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveView(tab.dataset.view));
  });

  elements.serviceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.serviceOverride = button.dataset.serviceOverride;
      localStorage.setItem(STORAGE_KEYS.serviceOverride, state.serviceOverride);
      render();
    });
  });

  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.language = button.dataset.language;
      localStorage.setItem(STORAGE_KEYS.language, state.language);
      render();
    });
  });

  elements.favoriteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addFavorite();
  });

  elements.reminderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    addReminder();
    await requestNotificationPermission();
    render();
  });

  [
    elements.reminderStopSelect,
    elements.reminderDirectionSelect,
    elements.reminderServiceSelect
  ].forEach((select) => {
    select.addEventListener("change", populateReminderTimeOptions);
  });

  elements.enableNotificationsButton.addEventListener("click", async () => {
    await requestNotificationPermission();
    renderReminders();
  });

  elements.settingsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const { action, favoriteId } = button.dataset;
    if (action === "remove") {
      state.favorites = state.favorites.filter((favorite) => favorite.id !== favoriteId);
    }
    if (action === "up" || action === "down") {
      moveFavorite(favoriteId, action === "up" ? -1 : 1);
    }
    persistFavorites();
    render();
  });

  elements.remindersList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-reminder-action]");
    if (!button) {
      return;
    }

    if (button.dataset.reminderAction === "remove") {
      state.reminders = state.reminders.filter((reminder) => reminder.id !== button.dataset.reminderId);
      persistReminders();
      renderReminders();
    }
  });

  elements.tableDirectionSelect.addEventListener("change", () => {
    state.tableDirection = elements.tableDirectionSelect.value;
    renderTimetable();
  });

  elements.tableServiceSelect.addEventListener("change", () => {
    state.tableService = elements.tableServiceSelect.value;
    renderTimetable();
  });

  document.body.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-settings]")) {
      setActiveView("settings");
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function setActiveView(view) {
  state.activeView = view;
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  });
  elements.views.forEach((section) => {
    section.classList.toggle("is-active", section.id === `${view}View`);
  });
  renderTimeSensitiveViews();
}

function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadReminders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.reminders) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((reminder) => {
      try {
        const isWellFormed = Boolean(
          reminder?.id &&
            reminder.stopId &&
            reminder.directionId &&
            ["weekday", "satSunHoliday"].includes(reminder.serviceId) &&
            reminder.time &&
            Number.isFinite(parseTimeToMinutes(reminder.time))
        );
        if (!isWellFormed || !state.timetable) {
          return isWellFormed;
        }

        return getReminderTimeOptions({
          stopId: reminder.stopId,
          directionId: reminder.directionId,
          serviceId: reminder.serviceId
        }).includes(reminder.time);
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function loadServiceOverride() {
  const value = localStorage.getItem(STORAGE_KEYS.serviceOverride);
  return ["auto", "weekday", "satSunHoliday"].includes(value) ? value : "auto";
}

function loadLanguage() {
  const stored = localStorage.getItem(STORAGE_KEYS.language);
  if (SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  const browserLanguage = navigator.language?.toLowerCase() || "";
  if (browserLanguage.startsWith("zh")) {
    return "zh";
  }
  if (browserLanguage.startsWith("en")) {
    return "en";
  }
  return "ja";
}

function persistFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
}

function persistReminders() {
  localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(state.reminders));
}

function addFavorite() {
  const favorite = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    stopId: elements.stopSelect.value,
    directionId: elements.directionSelect.value,
    nickname: elements.nicknameInput.value.trim()
  };

  state.favorites.push(favorite);
  persistFavorites();
  elements.nicknameInput.value = "";
  setActiveView("home");
  render();
}

function addReminder() {
  const reminder = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    stopId: elements.reminderStopSelect.value,
    directionId: elements.reminderDirectionSelect.value,
    serviceId: elements.reminderServiceSelect.value,
    time: elements.reminderTimeSelect.value,
    lastNotifiedKey: ""
  };

  if (!reminder.stopId || !reminder.directionId || !reminder.serviceId || !reminder.time) {
    return;
  }

  const alreadyExists = state.reminders.some(
    (item) =>
      item.stopId === reminder.stopId &&
      item.directionId === reminder.directionId &&
      item.serviceId === reminder.serviceId &&
      item.time === reminder.time
  );
  if (alreadyExists) {
    return;
  }

  state.reminders.push(reminder);
  persistReminders();
}

function moveFavorite(favoriteId, delta) {
  const index = state.favorites.findIndex((favorite) => favorite.id === favoriteId);
  if (index === -1) {
    return;
  }

  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= state.favorites.length) {
    return;
  }

  const [item] = state.favorites.splice(index, 1);
  state.favorites.splice(nextIndex, 0, item);
}

function populateFormControls() {
  const selectedStop = elements.stopSelect.value || state.timetable.stops[0]?.id;
  const selectedDirection = elements.directionSelect.value || "to-jaist";
  const selectedReminderStop = elements.reminderStopSelect.value || state.timetable.stops[0]?.id;
  const selectedReminderDirection = elements.reminderDirectionSelect.value || "to-jaist";
  const selectedReminderService = elements.reminderServiceSelect.value || "weekday";
  const selectedReminderTime = elements.reminderTimeSelect.value;

  elements.stopSelect.innerHTML = state.timetable.stops
    .map((stop) => `<option value="${stop.id}">${escapeHtml(formatStopOption(stop))}</option>`)
    .join("");
  elements.directionSelect.innerHTML = ["to-jaist", "to-tsurugi"]
    .map((directionId) => `<option value="${directionId}">${escapeHtml(directionLabel(directionId))}</option>`)
    .join("");
  elements.tableDirectionSelect.innerHTML = ["to-jaist", "to-tsurugi"]
    .map((directionId) => `<option value="${directionId}">${escapeHtml(directionLabel(directionId))}</option>`)
    .join("");
  elements.tableServiceSelect.innerHTML = ["weekday", "satSunHoliday"]
    .map((serviceId) => `<option value="${serviceId}">${escapeHtml(serviceLabel(serviceId))}</option>`)
    .join("");
  elements.reminderStopSelect.innerHTML = state.timetable.stops
    .map((stop) => `<option value="${stop.id}">${escapeHtml(formatStopOption(stop))}</option>`)
    .join("");
  elements.reminderDirectionSelect.innerHTML = ["to-jaist", "to-tsurugi"]
    .map((directionId) => `<option value="${directionId}">${escapeHtml(directionLabel(directionId))}</option>`)
    .join("");
  elements.reminderServiceSelect.innerHTML = ["weekday", "satSunHoliday"]
    .map((serviceId) => `<option value="${serviceId}">${escapeHtml(serviceLabel(serviceId))}</option>`)
    .join("");

  elements.stopSelect.value = selectedStop;
  elements.directionSelect.value = selectedDirection;
  elements.reminderStopSelect.value = selectedReminderStop;
  elements.reminderDirectionSelect.value = selectedReminderDirection;
  elements.reminderServiceSelect.value = selectedReminderService;
  populateReminderTimeOptions(selectedReminderTime);
}

function populateReminderTimeOptions(preferredTime = elements.reminderTimeSelect.value) {
  const times = getReminderTimeOptions({
    stopId: elements.reminderStopSelect.value,
    directionId: elements.reminderDirectionSelect.value,
    serviceId: elements.reminderServiceSelect.value
  });

  if (times.length === 0) {
    elements.reminderTimeSelect.innerHTML = `<option value="">${t("reminders.noTimes")}</option>`;
    elements.reminderTimeSelect.value = "";
    return;
  }

  elements.reminderTimeSelect.innerHTML = times
    .map((time) => `<option value="${escapeHtml(time)}">${escapeHtml(time)}</option>`)
    .join("");
  elements.reminderTimeSelect.value = times.includes(preferredTime) ? preferredTime : times[0];
}

function getReminderTimeOptions({ stopId, directionId, serviceId }) {
  const times = state.timetable.trips
    .filter((trip) => trip.directionId === directionId && trip.serviceId === serviceId)
    .map((trip) => trip.timesByStopId[stopId])
    .filter(Boolean);

  return [...new Set(times)].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

function render() {
  applyTranslations();
  populateFormControls();
  elements.languageButtons.forEach((button) => {
    const isSelected = button.dataset.language === state.language;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  elements.serviceButtons.forEach((button) => {
    const isSelected = button.dataset.serviceOverride === state.serviceOverride;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  elements.tableDirectionSelect.value = state.tableDirection;
  elements.tableServiceSelect.value = state.tableService;

  renderTimeSensitiveViews();
  renderSettings();
  renderTimetable();
}

function applyTranslations(root = document) {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : state.language;
  document.title = t("documentTitle");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("documentDescription"));

  const textTargets = root.querySelectorAll("[data-i18n]");
  textTargets.forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  const placeholderTargets = root.querySelectorAll("[data-i18n-placeholder]");
  placeholderTargets.forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  const ariaTargets = root.querySelectorAll("[data-i18n-aria-label]");
  ariaTargets.forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  document.querySelector(".language-switch")?.setAttribute("aria-label", t("languageSwitch"));
}

function t(path, values = {}) {
  const translation = readTranslation(TRANSLATIONS[state.language], path) ?? readTranslation(TRANSLATIONS.ja, path) ?? path;
  return String(translation).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function readTranslation(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function serviceLabel(serviceId) {
  return t(`service.${serviceId}`);
}

function directionLabel(directionId) {
  return t(`directions.${directionId}`);
}

function formatStopOption(stop) {
  return state.language === "en" ? `${stop.labelEn} / ${stop.labelJa}` : `${stop.labelJa} / ${stop.labelEn}`;
}

function stopPrimaryLabel(stop) {
  return state.language === "en" ? stop.labelEn : stop.labelJa;
}

function stopSecondaryLabel(stop) {
  return state.language === "en" ? stop.labelJa : stop.labelEn;
}

function renderTimeSensitiveViews() {
  renderClock();
  renderHome();
  checkDueReminders();
  renderReminders();
}

function renderClock() {
  const parts = getJapanDateParts();
  elements.todayLabel.textContent = formatShortDate(parts.dateKey);
  elements.clockLabel.textContent = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function renderHome() {
  const serviceId = getServiceIdForDate(new Date(), state.timetable.holidayDates, state.serviceOverride);
  const overrideLabel = state.serviceOverride === "auto" ? t("override.auto") : t("override.manual");
  elements.homeTitle.textContent = t("home.serviceStatus", {
    service: serviceLabel(serviceId),
    mode: overrideLabel
  });

  if (state.favorites.length === 0) {
    const fragment = elements.emptyFavoritesTemplate.content.cloneNode(true);
    applyTranslations(fragment);
    elements.favoritesList.replaceChildren(fragment);
    return;
  }

  const cards = state.favorites.map((favorite) => renderFavoriteCard(favorite));
  elements.favoritesList.replaceChildren(...cards);
}

function renderFavoriteCard(favorite) {
  const stop = getStop(state.timetable, favorite.stopId);
  const direction = getDirection(state.timetable, favorite.directionId);
  const destination = getStop(state.timetable, direction.stopIds[direction.stopIds.length - 1]);
  const upcoming = findUpcomingTimes(state.timetable, favorite, new Date(), {
    count: 3,
    serviceOverride: state.serviceOverride
  });
  const next = upcoming[0];

  const card = document.createElement("article");
  card.className = "favorite-card";

  const stopPrimary = escapeHtml(stopPrimaryLabel(stop));
  const destinationPrimary = escapeHtml(stopPrimaryLabel(destination));
  const stopSecondary = escapeHtml(stopSecondaryLabel(stop));
  const destinationSecondary = escapeHtml(stopSecondaryLabel(destination));
  const note = favorite.nickname ? `<span class="favorite-note">${escapeHtml(favorite.nickname)}</span>` : "";
  const upcomingItems = upcoming
    .slice(1)
    .map((item) => `<li>${formatDayOffset(item.dayOffset)} ${item.time}</li>`)
    .join("");

  card.innerHTML = `
    <div class="primary-schedule">
      <div class="route-stack">
        <div class="route-label">${t("cards.routeLabel")}</div>
        <h3 class="route-title">
          <span>${stopPrimary}</span>
          <span class="route-arrow" aria-hidden="true">→</span>
          <span>${destinationPrimary}</span>
        </h3>
        <div class="route-subtitle">${stopSecondary} → ${destinationSecondary}</div>
      </div>
      <div class="departure-stack">
        <div class="departure-label">${t("cards.departureLabel")}</div>
        <p class="next-time">${next.time}</p>
        <div class="countdown">${formatCountdown(next.minutesUntil)}</div>
      </div>
    </div>
    <div class="secondary-info">
      <span class="service-badge">${formatDayOffset(next.dayOffset)} · ${serviceLabel(next.serviceId)}</span>
      <span class="direction-badge">${directionLabel(direction.id)}</span>
      ${note}
    </div>
    <ul class="upcoming">${upcomingItems}</ul>
    <p class="meta-line">${t("cards.delayNote")}</p>
  `;

  return card;
}

function renderSettings() {
  if (state.favorites.length === 0) {
    elements.settingsList.innerHTML = "";
    return;
  }

  elements.settingsList.innerHTML = state.favorites
    .map((favorite, index) => {
      const stop = getStop(state.timetable, favorite.stopId);
      const title = favorite.nickname || stopPrimaryLabel(stop);
      return `
        <article class="manage-item">
          <div class="manage-main">
            <div class="manage-title">${escapeHtml(title)}</div>
            <div class="favorite-subtitle">${escapeHtml(formatStopOption(stop))} · ${escapeHtml(directionLabel(favorite.directionId))}</div>
          </div>
          <div class="manage-actions">
            <button class="icon-action" type="button" data-action="up" data-favorite-id="${favorite.id}" ${index === 0 ? "disabled" : ""}>${t("actions.up")}</button>
            <button class="icon-action" type="button" data-action="down" data-favorite-id="${favorite.id}" ${index === state.favorites.length - 1 ? "disabled" : ""}>${t("actions.down")}</button>
            <button class="danger-action" type="button" data-action="remove" data-favorite-id="${favorite.id}">${t("actions.remove")}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderReminders() {
  renderNotificationStatus();

  if (state.reminders.length === 0) {
    const fragment = elements.emptyRemindersTemplate.content.cloneNode(true);
    applyTranslations(fragment);
    elements.remindersList.replaceChildren(fragment);
    return;
  }

  elements.remindersList.innerHTML = state.reminders
    .map((reminder) => renderReminderItem(reminder))
    .join("");
}

function renderReminderItem(reminder) {
  const stop = getStop(state.timetable, reminder.stopId);
  const direction = getDirection(state.timetable, reminder.directionId);
  const destination = getStop(state.timetable, direction.stopIds[direction.stopIds.length - 1]);
  const nextOccurrence = findNextReminderOccurrence(reminder);
  const nextLabel = nextOccurrence
    ? t("reminders.nextNotification", {
        day: formatDayOffset(nextOccurrence.dayOffset),
        time: nextOccurrence.notifyTime
      })
    : t("reminders.repeatNote");

  return `
    <article class="manage-item reminder-item">
      <div class="manage-main">
        <div class="manage-title">${escapeHtml(stopPrimaryLabel(stop))} → ${escapeHtml(stopPrimaryLabel(destination))}</div>
        <div class="favorite-subtitle">${escapeHtml(stopSecondaryLabel(stop))} → ${escapeHtml(stopSecondaryLabel(destination))}</div>
        <div class="reminder-badges">
          <span class="status-badge">${escapeHtml(reminder.time)}</span>
          <span class="service-badge">${escapeHtml(serviceLabel(reminder.serviceId))}</span>
          <span class="direction-badge">${escapeHtml(directionLabel(direction.id))}</span>
        </div>
        <p class="meta-line">${escapeHtml(t("reminders.repeatNote"))}</p>
      </div>
      <div class="reminder-side">
        <div class="reminder-next">${escapeHtml(nextLabel)}</div>
        <div class="favorite-subtitle">${escapeHtml(t("reminders.departure", { time: reminder.time }))}</div>
        <button class="danger-action" type="button" data-reminder-action="remove" data-reminder-id="${escapeHtml(reminder.id)}">${t("actions.remove")}</button>
      </div>
    </article>
  `;
}

function renderNotificationStatus() {
  if (!("Notification" in window)) {
    elements.notificationStatus.textContent = t("reminders.permissionUnsupported");
    elements.enableNotificationsButton.disabled = true;
    return;
  }

  const permission = Notification.permission;
  if (permission === "granted") {
    elements.notificationStatus.textContent = t("reminders.permissionGranted");
    elements.enableNotificationsButton.classList.add("is-hidden");
    elements.enableNotificationsButton.disabled = true;
    return;
  }

  elements.enableNotificationsButton.classList.remove("is-hidden");
  elements.enableNotificationsButton.disabled = permission === "denied";
  elements.notificationStatus.textContent =
    permission === "denied" ? t("reminders.permissionDenied") : t("reminders.permissionPrompt");
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

function checkDueReminders(date = new Date()) {
  if (!("Notification" in window) || Notification.permission !== "granted" || state.reminders.length === 0) {
    return;
  }

  const current = getJapanDateParts(date);
  const serviceId = resolveServiceForDateKey(current.dateKey, state.timetable.holidayDates);
  let changed = false;

  for (const reminder of state.reminders) {
    if (reminder.serviceId !== serviceId) {
      continue;
    }

    const departureMinutes = parseTimeToMinutes(reminder.time);
    const notifyMinutes = departureMinutes - REMINDER_LEAD_MINUTES;
    if (notifyMinutes < 0 || current.minutes < notifyMinutes || current.minutes > departureMinutes) {
      continue;
    }

    const notificationKey = reminderNotificationKey(reminder, current.dateKey);
    if (reminder.lastNotifiedKey === notificationKey) {
      continue;
    }

    showReminderNotification(reminder);
    reminder.lastNotifiedKey = notificationKey;
    changed = true;
  }

  if (changed) {
    persistReminders();
  }
}

function findNextReminderOccurrence(reminder, date = new Date()) {
  const current = getJapanDateParts(date);
  const departureMinutes = parseTimeToMinutes(reminder.time);
  const notifyMinutes = departureMinutes - REMINDER_LEAD_MINUTES;
  if (notifyMinutes < 0) {
    return null;
  }

  for (let offset = 0; offset <= 21; offset += 1) {
    const dateKey = addDaysToDateKey(current.dateKey, offset);
    const serviceId = resolveServiceForDateKey(dateKey, state.timetable.holidayDates);
    if (serviceId !== reminder.serviceId) {
      continue;
    }

    const minutesUntilNotify = offset * MINUTES_PER_DAY + notifyMinutes - current.minutes;
    if (minutesUntilNotify >= 0) {
      return {
        dateKey,
        dayOffset: offset,
        notifyTime: formatMinutesAsTime(notifyMinutes),
        minutesUntilNotify
      };
    }
  }

  return null;
}

function showReminderNotification(reminder) {
  const stop = getStop(state.timetable, reminder.stopId);
  const direction = getDirection(state.timetable, reminder.directionId);
  const destination = getStop(state.timetable, direction.stopIds[direction.stopIds.length - 1]);
  const title = t("notifications.title");
  const options = {
    body: t("notifications.body", {
      stop: stopPrimaryLabel(stop),
      time: reminder.time,
      destination: stopPrimaryLabel(destination)
    }),
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: `jaist-bus:${reminderNotificationKey(reminder, getJapanDateParts().dateKey)}`,
    data: { url: location.href }
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if ("showNotification" in registration) {
          return registration.showNotification(title, options);
        }
        return new Notification(title, options);
      })
      .catch(() => new Notification(title, options));
    return;
  }

  new Notification(title, options);
}

function reminderNotificationKey(reminder, dateKey) {
  return `${dateKey}:${reminder.stopId}:${reminder.directionId}:${reminder.serviceId}:${reminder.time}`;
}

function renderTimetable() {
  const direction = getDirection(state.timetable, state.tableDirection);
  const trips = state.timetable.trips.filter(
    (trip) => trip.directionId === state.tableDirection && trip.serviceId === state.tableService
  );
  const stops = direction.stopIds.map((stopId) => getStop(state.timetable, stopId));

  elements.timetableMeta.innerHTML = `
    ${t("timetable.revision", { date: state.timetable.revisionDate })} ·
    ${t("timetable.source")} <a href="${state.timetable.sourceUrl}" target="_blank" rel="noreferrer">${t("timetable.sourceLink")}</a>
  `;

  elements.timetableTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>${t("timetable.trip")}</th>
          ${stops.map((stop) => `<th>${escapeHtml(stopPrimaryLabel(stop))}<br>${escapeHtml(stopSecondaryLabel(stop))}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${trips
          .map(
            (trip, index) => `
              <tr>
                <td>${index + 1}</td>
                ${stops.map((stop) => `<td>${trip.timesByStopId[stop.id] || ""}</td>`).join("")}
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function formatDayOffset(offset) {
  if (offset === 0) {
    return t("days.today");
  }
  if (offset === 1) {
    return t("days.tomorrow");
  }
  return t("days.inDays", { count: offset });
}

function formatCountdown(minutes) {
  if (minutes <= 0) {
    return t("countdown.now");
  }
  if (minutes < 60) {
    return t("countdown.minutes", { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? t("countdown.hours", { hours }) : t("countdown.hoursMinutes", { hours, minutes: mins });
}

function formatShortDate(dateKey) {
  const serviceId = resolveServiceForDateKey(dateKey, state.timetable?.holidayDates || [], state.serviceOverride);
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)} ${serviceLabel(serviceId)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFatalError(error) {
  document.body.innerHTML = `
    <main class="app-shell">
      <div class="empty-state">
        <h1>${t("errors.fatalTitle")}</h1>
        <p>${escapeHtml(error.message)}</p>
      </div>
    </main>
  `;
}
