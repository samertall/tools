export const STATUSES = Object.freeze([
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In progress" },
  { id: "review", label: "In review" },
  { id: "done", label: "Done" }
]);

export const PROJECTS = Object.freeze([
  { id: "platform", label: "Platform redesign", color: "violet" },
  { id: "website", label: "Website launch", color: "blue" },
  { id: "design-system", label: "Design system", color: "mint" }
]);

const addDays = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next.toISOString().slice(0, 10);
};

export function createSampleTasks(now = new Date()) {
  const examples = [
    ["Map onboarding friction points", "Prioritize the screens with the highest drop-off.", "platform", "in-progress", "high", -1, "ST"],
    ["Review responsive header patterns", "Prepare mobile navigation options for QA.", "design-system", "review", "medium", 2, "AM"],
    ["Document success metrics", "Agree on adoption and activation signals.", "platform", "backlog", "medium", 5, "ST"],
    ["Update component accessibility", "Check labels, keyboard paths and focus states.", "design-system", "in-progress", "high", 1, "LA"],
    ["Finalize landing page content", "Approve benefit-led copy and metadata.", "website", "done", "low", -3, "ST"],
    ["Run navigation usability tests", "Collect feedback from five pilot participants.", "website", "review", "high", 3, "JM"],
    ["Create release checklist", "Include regression, analytics and rollback steps.", "website", "backlog", "low", 8, "ST"],
    ["Audit empty and error states", "Align the UI with accessible status messaging.", "platform", "in-progress", "medium", 4, "AM"],
    ["Publish new spacing tokens", "Share changelog with all product teams.", "design-system", "done", "low", -2, "LA"]
  ];
  return examples.map(([title, description, project, status, priority, offset, assignee], index) => ({
    id: `sample-${index + 1}`,
    title,
    description,
    project,
    status,
    priority,
    dueDate: addDays(now, offset),
    assignee,
    createdAt: now.toISOString()
  }));
}

export function normalizeTask(input) {
  const statuses = new Set(STATUSES.map(s => s.id));
  const projects = new Set(PROJECTS.map(p => p.id));
  const string = value => typeof value === "string" ? value.trim() : "";
  const id = string(input?.id);
  const title = string(input?.title).slice(0, 120);
  if (!id || !title) return null;
  return {
    id,
    title,
    description: string(input.description).slice(0, 1000),
    project: projects.has(input.project) ? input.project : "platform",
    status: statuses.has(input.status) ? input.status : "backlog",
    priority: ["high", "medium", "low"].includes(input.priority) ? input.priority : "medium",
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(string(input.dueDate)) ? input.dueDate : "",
    assignee: string(input.assignee).slice(0, 3).toUpperCase() || "ST",
    createdAt: string(input.createdAt) || new Date().toISOString()
  };
}

export function isOverdue(task, today = new Date().toISOString().slice(0, 10)) {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate < today);
}

export function filterTasks(tasks, { query = "", project = "all", priority = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return tasks.filter(task =>
    (project === "all" || task.project === project) &&
    (priority === "all" || task.priority === priority) &&
    (!needle || `${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(needle))
  );
}

export function summarizeTasks(tasks, today = new Date().toISOString().slice(0, 10)) {
  const total = tasks.length;
  const done = tasks.filter(task => task.status === "done").length;
  const active = tasks.filter(task => task.status === "in-progress").length;
  const overdue = tasks.filter(task => isOverdue(task, today)).length;
  return { total, done, active, overdue, progress: total ? Math.round((done / total) * 100) : 0 };
}
