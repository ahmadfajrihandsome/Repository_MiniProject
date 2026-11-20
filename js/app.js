/* ============================================================
   app.js — Todo Lists Dashboard
   Single-file Vanilla JS: StorageService, ThemeModule,
   GreetingModule, TimerModule, TodoModule, LinksModule
   ============================================================ */

"use strict";

/* ============================================================
   StorageService
   ============================================================ */

const StorageService = (function () {
  const keys = {
    THEME: "dashboard_theme",
    NAME: "dashboard_name",
    POMODORO_DURATION: "dashboard_pomodoro_duration",
    TASKS: "dashboard_tasks",
    LINKS: "dashboard_links",
  };

  /**
   * Read a value from localStorage. If the stored JSON is corrupt,
   * re-writes the default value and returns it (Req 12.3).
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  function get(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (_) {
      // SyntaxError from JSON.parse or any other error — re-initialise
      try {
        localStorage.setItem(key, JSON.stringify(defaultValue));
      } catch (_ignored) {
        // SecurityError / QuotaExceededError — ignore
      }
      return defaultValue;
    }
  }

  /**
   * Write a value to localStorage as JSON.
   * Fails silently on SecurityError / QuotaExceededError.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // SecurityError / QuotaExceededError — fail silently
    }
  }

  return { get, set, keys };
})();

/* ============================================================
   ThemeModule
   ============================================================ */

const ThemeModule = (function () {
  const LIGHT = "light";
  const DARK = "dark";

  /**
   * Read saved theme and apply it to <html> synchronously.
   * Must run before any other render (Req 11.3).
   */
  function init() {
    const saved = StorageService.get(StorageService.keys.THEME, LIGHT);
    _apply(saved === DARK ? DARK : LIGHT);
    _updateToggleIcon();
  }

  /** Flip between light and dark, persist. */
  function toggle() {
    const next = current() === LIGHT ? DARK : LIGHT;
    _apply(next);
    StorageService.set(StorageService.keys.THEME, next);
    _updateToggleIcon();
  }

  /** @returns {"light"|"dark"} */
  function current() {
    return document.documentElement.dataset.theme === DARK ? DARK : LIGHT;
  }

  function _apply(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function _updateToggleIcon() {
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = current() === DARK ? "☀️" : "🌙";
  }

  return { init, toggle, current };
})();

/* ============================================================
   GreetingModule
   ============================================================ */

const GreetingModule = (function () {
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  /**
   * Map an hour (0–23) to a time-of-day greeting string.
   * Bands: 05–11 Morning, 12–17 Afternoon, 18–20 Evening, 00–04 and 21–23 Night.
   * @param {number} hour
   * @returns {string}
   */
  function _getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night";
  }

  /**
   * Format a Date to "HH:MM" (zero-padded, 24-hour).
   * @param {Date} date
   * @returns {string}
   */
  function _formatTime(date) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  /**
   * Format a Date to "Day, DD Month YYYY".
   * @param {Date} date
   * @returns {string}
   */
  function _formatDate(date) {
    const day = WEEKDAYS[date.getDay()];
    const dd = String(date.getDate()).padStart(2, "0");
    const month = MONTHS[date.getMonth()];
    const yyyy = date.getFullYear();
    return `${day}, ${dd} ${month} ${yyyy}`;
  }

  /**
   * Recalculate and re-render time, date, and greeting.
   */
  function refresh() {
    const timeEl = document.getElementById("greeting-time");
    const dateEl = document.getElementById("greeting-date");
    const greetEl = document.getElementById("greeting-text");
    if (!timeEl || !dateEl || !greetEl) return;

    try {
      const now = new Date();
      const greeting = _getGreeting(now.getHours());
      const name = StorageService.get(StorageService.keys.NAME, "");
      const displayGreeting = name ? `${greeting}, ${name}` : greeting;

      greetEl.textContent = displayGreeting;
      timeEl.textContent = _formatTime(now);
      dateEl.textContent = _formatDate(now);
    } catch (_) {
      timeEl.textContent = "Time unavailable";
      dateEl.textContent = "";
      greetEl.textContent = "Welcome";
    }
  }

  /**
   * Initialise the greeting widget.
   * @param {string} savedName
   */
  function init(savedName) {
    // Pre-fill the name input with the saved name
    const nameInput = document.getElementById("name-input");
    if (nameInput && savedName) nameInput.value = savedName;

    refresh();
    setInterval(refresh, 60000);

    // Wire name form
    const form = document.getElementById("name-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = document.getElementById("name-input");
        const result = setName(input ? input.value : "");
        const errorEl = document.getElementById("name-error");
        if (errorEl) errorEl.textContent = result.ok ? "" : result.error;
        if (result.ok) refresh();
      });
    }
  }

  /**
   * Validate and persist a name.
   * @param {string} name
   * @returns {{ ok: boolean, error?: string }}
   */
  function setName(name) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed.length === 0) {
      return { ok: false, error: "Name cannot be empty." };
    }
    if (trimmed.length > 50) {
      return { ok: false, error: "Name must be 50 characters or fewer." };
    }
    if (!/^[\x20-\x7E]{1,50}$/.test(trimmed)) {
      return { ok: false, error: "Name may only contain printable characters." };
    }
    StorageService.set(StorageService.keys.NAME, trimmed);
    return { ok: true };
  }

  return { init, setName, refresh, _getGreeting, _formatTime, _formatDate };
})();

/* ============================================================
   TimerModule
   ============================================================ */

const TimerModule = (function () {
  // Internal state
  let _duration = 25;         // minutes
  let _remainingMs = 25 * 60 * 1000;
  let _startTimestamp = null; // Date.now() when last started
  let _intervalId = null;
  let _state = "idle";        // "idle" | "running" | "paused"
  let _pendingDuration = null; // new duration queued while running

  /**
   * Validate and optionally persist a duration in minutes.
   * @param {number} minutes
   * @returns {{ ok: boolean, error?: string }}
   */
  function setDuration(minutes) {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
      return { ok: false, error: "Duration must be a whole number between 1 and 60." };
    }

    StorageService.set(StorageService.keys.POMODORO_DURATION, minutes);

    if (_state === "running") {
      // Preserve current countdown; apply at next session (Req 4.7)
      _pendingDuration = minutes;
    } else {
      _duration = minutes;
      _pendingDuration = null;
      _remainingMs = minutes * 60 * 1000;
      _updateDisplay(_remainingMs);
    }
    return { ok: true };
  }

  /**
   * Initialise with a saved or default duration.
   * @param {number} duration
   */
  function init(duration) {
    _duration = Number.isInteger(duration) && duration >= 1 && duration <= 60 ? duration : 25;
    _remainingMs = _duration * 60 * 1000;
    _state = "idle";
    _intervalId = null;

    _updateDisplay(_remainingMs);
    _syncButtons(_state);

    // Wire buttons
    const startBtn = document.getElementById("timer-start");
    const stopBtn = document.getElementById("timer-stop");
    const resetBtn = document.getElementById("timer-reset");
    if (startBtn) startBtn.addEventListener("click", start);
    if (stopBtn) stopBtn.addEventListener("click", stop);
    if (resetBtn) resetBtn.addEventListener("click", reset);

    // Wire duration form
    const durationForm = document.getElementById("duration-form");
    if (durationForm) {
      durationForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = document.getElementById("duration-input");
        const val = input ? parseInt(input.value, 10) : NaN;
        const result = setDuration(val);
        const errorEl = document.getElementById("duration-error");
        if (errorEl) errorEl.textContent = result.ok ? "" : result.error;
        if (result.ok && input) input.value = "";
      });
    }
  }

  function start() {
    if (_state === "running") return;
    _startTimestamp = Date.now() - (_duration * 60 * 1000 - _remainingMs);
    _state = "running";
    _syncButtons(_state);
    _hideNotification();
    _intervalId = setInterval(_tick, 500); // tick every 500ms for responsiveness
  }

  function stop() {
    if (_state !== "running") return;
    clearInterval(_intervalId);
    _intervalId = null;
    _state = "paused";
    _syncButtons(_state);
  }

  function reset() {
    clearInterval(_intervalId);
    _intervalId = null;
    _state = "idle";

    // Apply any pending duration change
    if (_pendingDuration !== null) {
      _duration = _pendingDuration;
      _pendingDuration = null;
    }

    _remainingMs = _duration * 60 * 1000;
    _updateDisplay(_remainingMs);
    _syncButtons(_state);
    _hideNotification();
  }

  function _tick() {
    const elapsed = Date.now() - _startTimestamp;
    const totalMs = _duration * 60 * 1000;
    const remaining = totalMs - elapsed;

    if (remaining <= 0) {
      clearInterval(_intervalId);
      _intervalId = null;
      _state = "idle";
      _remainingMs = 0;
      _updateDisplay(0);
      _syncButtons(_state);
      _alert();

      // Apply pending duration for next session
      if (_pendingDuration !== null) {
        _duration = _pendingDuration;
        _pendingDuration = null;
        _remainingMs = _duration * 60 * 1000;
        _updateDisplay(_remainingMs);
      }
      return;
    }

    _remainingMs = remaining;
    _updateDisplay(remaining);
  }

  /**
   * Update the MM:SS display.
   * @param {number} ms
   */
  function _updateDisplay(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    const el = document.getElementById("timer-display");
    if (el) el.textContent = `${mm}:${ss}`;
    // Update SVG ring
    const ring = document.getElementById("timer-ring-fill");
    if (ring) {
      const totalMs = _duration * 60 * 1000;
      const fraction = totalMs > 0 ? Math.max(0, Math.min(1, ms / totalMs)) : 0;
      const circumference = 326.73;
      ring.style.strokeDashoffset = String(circumference * (1 - fraction));
    }
  }

  /**
   * Enable/disable Start, Stop, Reset per state machine.
   * @param {"running"|"paused"|"idle"} state
   */
  function _syncButtons(state) {
    const startBtn = document.getElementById("timer-start");
    const stopBtn = document.getElementById("timer-stop");
    const resetBtn = document.getElementById("timer-reset");
    if (!startBtn || !stopBtn || !resetBtn) return;

    if (state === "running") {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      resetBtn.disabled = false;
    } else {
      // idle or paused
      startBtn.disabled = false;
      stopBtn.disabled = true;
      resetBtn.disabled = false;
    }
  }

  /**
   * Play an AudioContext beep and show a visual notification (Req 3.6).
   */
  function _alert() {
    // Visual notification
    const notif = document.getElementById("timer-notification");
    if (notif) notif.classList.remove("hidden");

    // Audio beep — falls back to visual-only if AudioContext is unavailable
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.0);
    } catch (_) {
      // AudioContext unavailable — visual-only is already shown
    }
  }

  function _hideNotification() {
    const notif = document.getElementById("timer-notification");
    if (notif) notif.classList.add("hidden");
  }

  return { init, start, stop, reset, setDuration, _updateDisplay, _syncButtons, _alert, _tick };
})();

/* ============================================================
   TodoModule
   ============================================================ */

const TodoModule = (function () {
  let _tasks = [];

  /**
   * Generate a unique ID using crypto.randomUUID() with a fallback.
   * @returns {string}
   */
  function _generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /**
   * Persist current tasks to storage.
   */
  function _save() {
    StorageService.set(StorageService.keys.TASKS, _tasks);
  }

  /**
   * Add a task. Returns { ok, error? }.
   * @param {string} text
   * @returns {{ ok: boolean, error?: string }}
   */
  function addTask(text) {
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (trimmed.length === 0) {
      return { ok: false, error: "Task description cannot be empty." };
    }
    if (trimmed.length > 200) {
      return { ok: false, error: "Task description must be 200 characters or fewer." };
    }
    const task = { id: _generateId(), text: trimmed, completed: false };
    _tasks.push(task);
    _save();
    _render();
    return { ok: true };
  }

  /**
   * Toggle completion state of a task.
   * @param {string} id
   */
  function toggleTask(id) {
    const task = _tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    _save();
    _render();
  }

  /**
   * Delete a task.
   * @param {string} id
   */
  function deleteTask(id) {
    _tasks = _tasks.filter((t) => t.id !== id);
    _save();
    _render();
  }

  /**
   * Edit a task's text. Returns { ok, error? }.
   * @param {string} id
   * @param {string} newText
   * @returns {{ ok: boolean, error?: string }}
   */
  function editTask(id, newText) {
    const trimmed = typeof newText === "string" ? newText.trim() : "";
    if (trimmed.length === 0) {
      return { ok: false, error: "Task description cannot be empty." };
    }
    if (trimmed.length > 200) {
      return { ok: false, error: "Task description must be 200 characters or fewer." };
    }
    const task = _tasks.find((t) => t.id === id);
    if (!task) return { ok: false, error: "Task not found." };
    task.text = trimmed;
    _save();
    _render();
    return { ok: true };
  }

  /**
   * Build HTML string for a single task item.
   * @param {{ id: string, text: string, completed: boolean }} task
   * @returns {string}
   */
  function _renderTask(task) {
    const escapedText = _escapeHtml(task.text);
    const doneClass = task.completed ? " todo-item__text--done" : "";
    const checked = task.completed ? " checked" : "";
    return `
      <li class="todo-item" data-id="${_escapeAttr(task.id)}">
        <input
          type="checkbox"
          class="todo-item__checkbox"
          aria-label="Mark complete"
          data-action="toggle"
          data-id="${_escapeAttr(task.id)}"
          ${checked}
        />
        <span class="todo-item__text${doneClass}">${escapedText}</span>
        <div class="todo-item__actions">
          <button class="btn btn--small btn--secondary" data-action="edit" data-id="${_escapeAttr(task.id)}" aria-label="Edit task">Edit</button>
          <button class="btn btn--small btn--danger" data-action="delete" data-id="${_escapeAttr(task.id)}" aria-label="Delete task">✕</button>
        </div>
      </li>`;
  }

  /**
   * Rebuild the task list in the DOM.
   */
  function _render() {
    const list = document.getElementById("todo-list");
    if (!list) return;
    if (_tasks.length === 0) {
      list.innerHTML = `<li class="todo-empty">No tasks remaining.</li>`;
      return;
    }
    list.innerHTML = _tasks.map(_renderTask).join("");
  }

  /**
   * Initialise with a saved task array and wire events.
   * @param {Array} tasks
   */
  function init(tasks) {
    _tasks = Array.isArray(tasks) ? tasks : [];
    _render();

    // Wire add form
    const form = document.getElementById("todo-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = document.getElementById("todo-input");
        const result = addTask(input ? input.value : "");
        const errorEl = document.getElementById("todo-error");
        if (errorEl) errorEl.textContent = result.ok ? "" : result.error;
        if (result.ok && input) {
          input.value = "";
          input.focus();
        } else if (!result.ok && input) {
          input.focus();
        }
      });
    }

    // Event delegation on the list
    const list = document.getElementById("todo-list");
    if (list) {
      list.addEventListener("click", function (e) {
        const target = e.target;
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) return;

        if (action === "toggle") {
          toggleTask(id);
        } else if (action === "delete") {
          deleteTask(id);
        } else if (action === "edit") {
          _enterEditMode(id);
        } else if (action === "confirm-edit") {
          _confirmEdit(id);
        } else if (action === "cancel-edit") {
          _render(); // discard and re-render
        }
      });
    }
  }

  /** Replace a task's display with an inline edit form. */
  function _enterEditMode(id) {
    const task = _tasks.find((t) => t.id === id);
    if (!task) return;

    const listItem = document.querySelector(`[data-id="${CSS.escape(id)}"].todo-item`);
    if (!listItem) return;

    const escapedId = _escapeAttr(id);
    const escapedText = _escapeHtml(task.text);

    listItem.innerHTML = `
      <div class="todo-item__edit-row">
        <input
          type="text"
          class="input"
          id="edit-input-${escapedId}"
          value="${escapedText}"
          maxlength="200"
          aria-label="Edit task text"
        />
        <button class="btn btn--small btn--primary" data-action="confirm-edit" data-id="${escapedId}">Save</button>
        <button class="btn btn--small btn--secondary" data-action="cancel-edit" data-id="${escapedId}">Cancel</button>
      </div>`;

    const editInput = document.getElementById(`edit-input-${id}`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }

  /** Read and confirm an inline edit. */
  function _confirmEdit(id) {
    const editInput = document.getElementById(`edit-input-${id}`);
    const newText = editInput ? editInput.value : "";
    const result = editTask(id, newText);
    if (!result.ok) {
      // Show error inline — re-render will clear edit mode on success
      if (editInput) editInput.classList.add("input--error");
    }
  }

  /** HTML-escape a string for safe insertion via innerHTML. */
  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Attribute-escape (same set is sufficient here). */
  function _escapeAttr(str) {
    return _escapeHtml(str);
  }

  return {
    init,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    _render,
    _renderTask,
    _save,
    _generateId,
  };
})();

/* ============================================================
   LinksModule
   ============================================================ */

const LinksModule = (function () {
  const MAX_LINKS = 20;
  let _links = [];

  /**
   * Validate that a URL starts with http:// or https:// and parses cleanly.
   * @param {string} url
   * @returns {boolean}
   */
  function _validateUrl(url) {
    if (typeof url !== "string") return false;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Persist current links to storage.
   */
  function _save() {
    StorageService.set(StorageService.keys.LINKS, _links);
  }

  /**
   * Add a quick link. Returns { ok, error? }.
   * @param {string} label
   * @param {string} url
   * @returns {{ ok: boolean, error?: string }}
   */
  function addLink(label, url) {
    const trimmedLabel = typeof label === "string" ? label.trim() : "";
    const trimmedUrl = typeof url === "string" ? url.trim() : "";

    if (trimmedLabel.length === 0 || trimmedLabel.length > 50) {
      return { ok: false, error: "Label must be 1–50 characters.", field: "label" };
    }
    if (!_validateUrl(trimmedUrl)) {
      return { ok: false, error: "URL must start with http:// or https:// and be a valid address.", field: "url" };
    }
    if (_links.length >= MAX_LINKS) {
      return { ok: false, error: "Maximum of 20 links reached.", field: "cap" };
    }
    _links.push({ label: trimmedLabel, url: trimmedUrl });
    _save();
    _render();
    return { ok: true };
  }

  /**
   * Delete a link by matching both label and url.
   * @param {string} label
   * @param {string} url
   */
  function deleteLink(label, url) {
    _links = _links.filter((l) => !(l.label === label && l.url === url));
    _save();
    _render();
  }

  /**
   * Build HTML string for a single link item.
   * @param {{ label: string, url: string }} link
   * @returns {string}
   */
  function _renderLink(link) {
    const escapedLabel = _escapeHtml(link.label);
    const escapedUrl = _escapeAttr(link.url);
    return `
      <div class="link-item">
        <a
          class="link-item__btn"
          href="${escapedUrl}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open ${escapedLabel}"
        >${escapedLabel}</a>
        <button
          class="link-item__delete"
          data-action="delete"
          data-label="${escapedLabel}"
          data-url="${escapedUrl}"
          aria-label="Delete ${escapedLabel}"
        >✕</button>
      </div>`;
  }

  /**
   * Rebuild the links panel in the DOM.
   */
  function _render() {
    const container = document.getElementById("links-list");
    if (!container) return;
    if (_links.length === 0) {
      container.innerHTML = `<p class="links-empty">No quick links saved yet.</p>`;
      return;
    }
    container.innerHTML = _links.map(_renderLink).join("");
  }

  /**
   * Initialise with saved links and wire events.
   * @param {Array} links
   */
  function init(links) {
    _links = Array.isArray(links) ? links : [];
    _render();

    // Wire add form
    const form = document.getElementById("links-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const labelInput = document.getElementById("link-label-input");
        const urlInput = document.getElementById("link-url-input");
        const labelErrorEl = document.getElementById("link-label-error");
        const urlErrorEl = document.getElementById("link-url-error");
        const capErrorEl = document.getElementById("link-cap-error");

        // Clear previous errors
        if (labelErrorEl) labelErrorEl.textContent = "";
        if (urlErrorEl) urlErrorEl.textContent = "";
        if (capErrorEl) capErrorEl.textContent = "";

        const result = addLink(
          labelInput ? labelInput.value : "",
          urlInput ? urlInput.value : ""
        );

        if (result.ok) {
          if (labelInput) labelInput.value = "";
          if (urlInput) urlInput.value = "";
        } else {
          if (result.field === "label" && labelErrorEl) labelErrorEl.textContent = result.error;
          else if (result.field === "url" && urlErrorEl) urlErrorEl.textContent = result.error;
          else if (result.field === "cap" && capErrorEl) capErrorEl.textContent = result.error;
        }
      });
    }

    // Event delegation for delete
    const container = document.getElementById("links-list");
    if (container) {
      container.addEventListener("click", function (e) {
        const target = e.target;
        if (target.dataset.action === "delete") {
          deleteLink(target.dataset.label, target.dataset.url);
        }
      });
    }
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function _escapeAttr(str) {
    return _escapeHtml(str);
  }

  return {
    init,
    addLink,
    deleteLink,
    _render,
    _renderLink,
    _save,
    _validateUrl,
  };
})();

/* ============================================================
   Initialisation Sequence (DOMContentLoaded)
   Theme is applied first, before any widget renders (Req 11.3).
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Theme — must run before any widget renders to prevent flash
  ThemeModule.init();

  // Wire theme toggle button
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", ThemeModule.toggle);

  // 2. Greeting
  const savedName = StorageService.get(StorageService.keys.NAME, "");
  GreetingModule.init(savedName);

  // 3. Timer
  const savedDuration = StorageService.get(StorageService.keys.POMODORO_DURATION, 25);
  TimerModule.init(savedDuration);

  // 4. Todos
  const savedTasks = StorageService.get(StorageService.keys.TASKS, []);
  TodoModule.init(savedTasks);

  // 5. Links
  const savedLinks = StorageService.get(StorageService.keys.LINKS, []);
  LinksModule.init(savedLinks);

  // 6. Daily Motivation Streak
  StreakModule.init();
});

/* ============================================================
   StreakModule — Daily visit streak + motivational quotes
   ============================================================ */

const StreakModule = (function () {

  const QUOTES = [
    { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your only limit is your mind.", author: "Unknown" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Dream big. Work hard. Stay focused.", author: "Unknown" },
    { text: "Learn from yesterday, live for today, hope for tomorrow.", author: "Albert Einstein" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Success doesn't come from what you do occasionally, it comes from what you do consistently.", author: "Marie Forleo" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Strive for progress, not perfection.", author: "Unknown" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Be the change you wish to see in this school.", author: "SMK Wikrama Spirit" }
  ];

  const SK = {
    STREAK:    'wk_streak_count',
    LAST_VISIT:'wk_streak_last',
    Q_INDEX:   'wk_quote_index',
    Q_SEEN:    'wk_quote_seen'
  };

  let _streak  = 1;
  let _qIndex  = 0;
  let _qSeen   = 0;

  function _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function _updateStreak() {
    const today    = _todayStr();
    const last     = StorageService.get(SK.LAST_VISIT, null);
    let   streak   = StorageService.get(SK.STREAK, 0);

    if (last === null) {
      streak = 1;
    } else if (last === today) {
      // already visited today — no change
    } else {
      const yesterday = new Date(new Date() - 86400000);
      const yStr = yesterday.getFullYear() + '-' +
                   String(yesterday.getMonth()+1).padStart(2,'0') + '-' +
                   String(yesterday.getDate()).padStart(2,'0');
      streak = last === yStr ? streak + 1 : 1;
    }

    StorageService.set(SK.STREAK, streak);
    StorageService.set(SK.LAST_VISIT, today);
    _streak = streak;
  }

  function _pickDailyQuote() {
    const today = _todayStr();
    const stored = StorageService.get(SK.LAST_VISIT + '_qdate', null);
    if (stored !== today) {
      _qIndex = Math.floor(Math.random() * QUOTES.length);
      StorageService.set(SK.Q_INDEX, _qIndex);
      StorageService.set(SK.LAST_VISIT + '_qdate', today);
      _qSeen = 1;
      StorageService.set(SK.Q_SEEN, 1);
    } else {
      _qIndex = StorageService.get(SK.Q_INDEX, 0);
      _qSeen  = StorageService.get(SK.Q_SEEN,  1);
    }
  }

  function _renderStreak() {
    const countEl = document.getElementById('streak-count');
    if (countEl) countEl.textContent = _streak;

    const milestone = document.getElementById('streak-milestone');
    if (!milestone) return;
    if (_streak === 7) {
      milestone.textContent = '🏆 7-day streak! Keep it up!';
      milestone.classList.remove('hidden');
    } else if (_streak === 30) {
      milestone.textContent = '🥇 30-day streak! You are unstoppable!';
      milestone.classList.remove('hidden');
    } else if (_streak === 100) {
      milestone.textContent = '👑 100-day streak! Legend!';
      milestone.classList.remove('hidden');
    } else {
      milestone.classList.add('hidden');
    }
  }

  function _renderQuote(animate) {
    const textEl   = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const fillEl   = document.getElementById('quote-progress-fill');
    if (!textEl || !authorEl) return;

    const q = QUOTES[_qIndex % QUOTES.length];

    function doRender() {
      textEl.textContent   = q.text;
      authorEl.textContent = '— ' + q.author;
      if (fillEl) {
        const pct = Math.min(100, Math.round((_qSeen / QUOTES.length) * 100));
        fillEl.style.width = pct + '%';
      }
      textEl.classList.remove('fading');
    }

    if (animate) {
      textEl.classList.add('fading');
      setTimeout(doRender, 300);
    } else {
      doRender();
    }
  }

  function _nextQuote() {
    _qIndex = (_qIndex + 1) % QUOTES.length;
    _qSeen  = Math.min(_qSeen + 1, QUOTES.length);
    StorageService.set(SK.Q_INDEX, _qIndex);
    StorageService.set(SK.Q_SEEN,  _qSeen);
    _renderQuote(true);
  }

  function init() {
    _updateStreak();
    _pickDailyQuote();
    _renderStreak();
    _renderQuote(false);

    const nextBtn = document.getElementById('quote-next');
    if (nextBtn) nextBtn.addEventListener('click', _nextQuote);
  }

  return { init };
})();

/* ============================================================
   Background canvas — subtle floating particles
   ============================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.5 + Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -0.15 - Math.random() * 0.25,
      alpha: 0.08 + Math.random() * 0.14
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 55 }, makeParticle);
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  function getColor() {
    return document.documentElement.dataset.theme === 'dark'
      ? '245,200,0'
      : '26,58,143';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const col = getColor();
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + col + ',' + p.alpha + ')';
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    }
    requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();