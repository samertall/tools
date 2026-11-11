import { STATUSES, PROJECTS, createSampleTasks, normalizeTask, filterTasks, summarizeTasks, isOverdue } from "./lib/task-model.mjs";

const STORAGE_KEY = "samer-taskflow-v1";
const VIEW_KEY = "samer-taskflow-view";
const els = {
  board: document.getElementById("board-content"),
  list: document.getElementById("list-content"),
  project: document.getElementById("project-filter"),
  priority: document.getElementById("priority-filter"),
  search: document.getElementById("task-search"),
  modal: document.getElementById("modal-backdrop"),
  form: document.getElementById("task-form"),
  toast: document.getElementById("toast")
};

let tasks = readTasks();
let view = readView();
let lastFocus = null;
let toastTimer = null;

function readTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.map(normalizeTask).filter(Boolean).slice(0, 1000);
    }
  } catch { /* A blocked or corrupt browser store must not prevent rendering. */ }
  return createSampleTasks();
}

function readView() {
  try { return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "board"; }
  catch { return "board"; }
}

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch { notify("Your browser cannot save changes. Export your tasks to keep a copy."); }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function getProject(value) {
  return PROJECTS.find(project => project.id === value) || PROJECTS[0];
}

function notify(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 3500);
}

function setStats() {
  const { total, active, done, overdue, progress } = summarizeTasks(tasks);
  document.getElementById("stat-total").textContent = String(total);
  document.getElementById("stat-active").textContent = String(active);
  document.getElementById("stat-complete").textContent = String(done);
  document.getElementById("stat-overdue").textContent = String(overdue);
  document.getElementById("nav-task-count").textContent = String(total);
  document.getElementById("progress-number").textContent = progress + "%";
  document.getElementById("progress-fill").style.width = progress + "%";
  document.getElementById("progress-description").textContent = done + " of " + total + " tasks completed";
}

function currentFilters() {
  return { query: els.search.value, project: els.project.value, priority: els.priority.value };
}

function renderCard(task) {
  const project = getProject(task.project);
  const overdue = isOverdue(task);
  return '<button type="button" class="task-card" draggable="true" data-edit="' + escapeHTML(task.id) +
    '" aria-label="Edit task: ' + escapeHTML(task.title) + '">' +
    '<div class="task-card-top"><span class="priority-badge ' + escapeHTML(task.priority) + '">' + escapeHTML(task.priority) +
    ' priority</span><span class="task-menu" aria-hidden="true">···</span></div>' +
    '<h4>' + escapeHTML(task.title) + '</h4>' +
    '<p>' + escapeHTML(task.description || "No description yet") + '</p>' +
    '<div class="task-card-footer"><span class="mini-project ' + escapeHTML(project.color) +
    '" title="' + escapeHTML(project.label) + '"></span><span class="task-due' + (overdue ? " overdue" : "") +
    '">' + (overdue ? "⚑ " : "◷ ") + escapeHTML(formatDate(task.dueDate)) + '</span>' +
    '<span class="task-avatar" aria-label="Assignee ' + escapeHTML(task.assignee) + '">' +
    escapeHTML(task.assignee) + '</span></div></button>';
}

function renderBoard(visible) {
  els.board.innerHTML = STATUSES.map(status => {
    const group = visible.filter(task => task.status === status.id);
    return '<section class="kanban-column" data-status="' + status.id + '" aria-label="' + escapeHTML(status.label) + '">' +
      '<div class="column-title"><h3><span class="status-dot ' + status.id + '"></span>' +
      escapeHTML(status.label) + '</h3><span class="status-count">' + group.length + '</span></div>' +
      '<div class="column-cards">' + (group.length ? group.map(renderCard).join("") :
      '<div class="empty-column">Drop a task here or create one to get started.</div>') + '</div></section>';
  }).join("");
}

function renderList(visible) {
  if (!visible.length) {
    els.list.innerHTML = '<div class="no-results">No tasks match these filters. Try a different search or create a new task.</div>';
    return;
  }
  els.list.innerHTML = '<table class="task-table"><thead><tr><th scope="col">TASK</th><th scope="col">PROJECT</th>' +
    '<th scope="col">STATUS</th><th scope="col">PRIORITY</th><th scope="col">DUE</th><th scope="col">OWNER</th></tr></thead><tbody>' +
    visible.map(task => {
      const project = getProject(task.project);
      return '<tr><td class="table-task"><button type="button" data-edit="' + escapeHTML(task.id) + '">' +
        escapeHTML(task.title) + '</button></td><td><span class="mini-project ' + escapeHTML(project.color) +
        '" style="display:inline-block;margin-right:6px"></span>' + escapeHTML(project.label) + '</td>' +
        '<td class="table-status">' + escapeHTML(STATUSES.find(status => status.id === task.status)?.label || "Backlog") +
        '</td><td><span class="priority-badge ' + escapeHTML(task.priority) + '">' + escapeHTML(task.priority) +
        '</span></td><td class="' + (isOverdue(task) ? "table-overdue" : "") + '">' + escapeHTML(formatDate(task.dueDate)) +
        '</td><td>' + escapeHTML(task.assignee) + '</td></tr>';
    }).join("") + '</tbody></table>';
}

function render() {
  setStats();
  const visible = filterTasks(tasks, currentFilters());
  document.getElementById("visible-count").textContent = visible.length + (visible.length === 1 ? " task" : " tasks");
  const listActive = view === "list";
  els.board.hidden = listActive;
  els.list.hidden = !listActive;
  const boardButton = document.getElementById("view-board");
  const listButton = document.getElementById("view-list");
  boardButton.classList.toggle("active", !listActive);
  listButton.classList.toggle("active", listActive);
  boardButton.setAttribute("aria-pressed", String(!listActive));
  listButton.setAttribute("aria-pressed", String(listActive));
  if (listActive) renderList(visible);
  else renderBoard(visible);
  document.querySelectorAll(".project-link").forEach(item =>
    item.classList.toggle("selected", item.dataset.project === els.project.value));
}

function openModal(id = "") {
  lastFocus = document.activeElement;
  const task = tasks.find(item => item.id === id);
  els.form.reset();
  document.getElementById("task-id").value = task?.id || "";
  document.getElementById("task-title").value = task?.title || "";
  document.getElementById("task-description").value = task?.description || "";
  document.getElementById("task-project").value = task?.project || (els.project.value === "all" ? "platform" : els.project.value);
  document.getElementById("task-status").value = task?.status || "backlog";
  document.getElementById("task-priority").value = task?.priority || "medium";
  document.getElementById("task-due").value = task?.dueDate || "";
  document.getElementById("task-assignee").value = task?.assignee || "ST";
  document.getElementById("modal-heading").textContent = task ? "Edit task" : "Create a task";
  document.getElementById("delete-task").hidden = !task;
  els.modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("task-title").focus();
}

function closeModal() {
  els.modal.hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

function saveTask(event) {
  event.preventDefault();
  const data = new FormData(els.form);
  const priorId = String(data.get("id") || "");
  const id = priorId || (globalThis.crypto?.randomUUID?.() || "task-" + Date.now());
  const prior = tasks.find(task => task.id === priorId);
  const candidate = normalizeTask({
    id,
    title: data.get("title"),
    description: data.get("description"),
    project: data.get("project"),
    status: data.get("status"),
    priority: data.get("priority"),
    dueDate: data.get("dueDate"),
    assignee: data.get("assignee"),
    createdAt: prior?.createdAt || new Date().toISOString()
  });
  if (!candidate) {
    document.getElementById("task-title").focus();
    return;
  }
  tasks = prior ? tasks.map(task => task.id === priorId ? candidate : task) : [candidate, ...tasks];
  saveTasks();
  render();
  closeModal();
  notify(prior ? "Task updated successfully" : "Task added to your board");
}

function deleteTask() {
  const id = document.getElementById("task-id").value;
  if (!id) return;
  if (!window.confirm("Remove this task from your local workspace?")) return;
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
  closeModal();
  notify("Task removed");
}

function exportTasks() {
  const blob = new Blob([JSON.stringify({ format: "taskflow-v1", exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "taskflow-export-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify("Your task export is ready");
}

function setView(nextView) {
  view = nextView;
  try { localStorage.setItem(VIEW_KEY, nextView); } catch {}
  render();
}

function setProjectFilter(project) {
  els.project.value = project;
  render();
  document.getElementById("board").scrollIntoView({ behavior: "smooth", block: "start" });
  document.body.classList.remove("nav-open");
  document.getElementById("mobile-nav").setAttribute("aria-expanded", "false");
}

function setupEvents() {
  document.getElementById("current-date").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  for (const id of ["add-task-primary"]) document.getElementById(id).addEventListener("click", () => openModal());
  document.getElementById("view-board").addEventListener("click", () => setView("board"));
  document.getElementById("view-list").addEventListener("click", () => setView("list"));
  for (const control of [els.search, els.project, els.priority]) control.addEventListener(control === els.search ? "input" : "change", render);
  document.getElementById("export-data").addEventListener("click", exportTasks);
  for (const id of ["cancel-task", "close-modal"]) document.getElementById(id).addEventListener("click", closeModal);
  document.getElementById("delete-task").addEventListener("click", deleteTask);
  els.form.addEventListener("submit", saveTask);
  els.modal.addEventListener("click", event => { if (event.target === els.modal) closeModal(); });
  document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    if (edit) openModal(edit.dataset.edit);
    const project = event.target.closest(".project-link");
    if (project) setProjectFilter(project.dataset.project);
  });
  document.querySelectorAll('[data-nav="overview"],[data-nav="board"],[data-nav="projects"]').forEach(item => {
    item.addEventListener("click", event => {
      if (item.dataset.nav === "projects") {
        event.preventDefault();
        setProjectFilter("all");
      }
      document.body.classList.remove("nav-open");
      document.getElementById("mobile-nav").setAttribute("aria-expanded", "false");
    });
  });
  const mobileNav = document.getElementById("mobile-nav");
  mobileNav.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
    mobileNav.setAttribute("aria-expanded", String(document.body.classList.contains("nav-open")));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!els.modal.hidden) closeModal();
      else document.body.classList.remove("nav-open");
      return;
    }
    if (!els.modal.hidden) {
      if (event.key === "Tab") {
        const controls = [...els.modal.querySelectorAll('button:not([hidden]),input:not([type="hidden"]),textarea,select')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if (!editing && (event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)))) {
      event.preventDefault();
      els.search.focus();
    } else if (!editing && event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      openModal();
    }
  });
  let draggedId = "";
  els.board.addEventListener("dragstart", event => {
    const card = event.target.closest("[data-edit]");
    if (!card) return;
    draggedId = card.dataset.edit;
    event.dataTransfer.setData("text/plain", draggedId);
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });
  els.board.addEventListener("dragend", () => {
    draggedId = "";
    els.board.querySelectorAll(".dragging,.drag-over").forEach(item => item.classList.remove("dragging", "drag-over"));
  });
  els.board.addEventListener("dragover", event => {
    const column = event.target.closest("[data-status]");
    if (!column) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    els.board.querySelectorAll(".drag-over").forEach(item => { if (item !== column) item.classList.remove("drag-over"); });
    column.classList.add("drag-over");
  });
  els.board.addEventListener("drop", event => {
    const column = event.target.closest("[data-status]");
    if (!column) return;
    event.preventDefault();
    const id = draggedId || event.dataTransfer.getData("text/plain");
    if (!tasks.some(task => task.id === id)) return;
    tasks = tasks.map(task => task.id === id ? { ...task, status: column.dataset.status } : task);
    saveTasks();
    render();
    draggedId = "";
    notify("Task moved to " + (STATUSES.find(status => status.id === column.dataset.status)?.label || "column"));
  });
}

setupEvents();
render();
