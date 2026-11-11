import test from "node:test";
import assert from "node:assert/strict";
import { createSampleTasks, filterTasks, normalizeTask, isOverdue, summarizeTasks, STATUSES } from "../lib/task-model.mjs";

test("sample tasks use valid, unique identifiers and statuses", () => {
  const tasks = createSampleTasks(new Date("2026-11-11T10:00:00.000Z"));
  assert.equal(tasks.length, 9);
  assert.equal(new Set(tasks.map(task => task.id)).size, tasks.length);
  assert.ok(tasks.every(task => STATUSES.some(status => status.id === task.status)));
});

test("normalizeTask rejects invalid data and applies safe defaults", () => {
  assert.equal(normalizeTask({ id: "a", title: " " }), null);
  const normalized = normalizeTask({ id: "a", title: " Task ", project: "bad", status: "bad", priority: "bad" });
  assert.equal(normalized.title, "Task");
  assert.equal(normalized.status, "backlog");
  assert.equal(normalized.project, "platform");
  assert.equal(normalized.priority, "medium");
});

test("filters combine query, project and priority", () => {
  const tasks = createSampleTasks(new Date("2026-11-11T10:00:00.000Z"));
  const matches = filterTasks(tasks, { query: "accessibility", project: "design-system", priority: "high" });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].assignee, "LA");
});

test("overdue excludes completed work", () => {
  assert.equal(isOverdue({ status: "in-progress", dueDate: "2026-11-10" }, "2026-11-11"), true);
  assert.equal(isOverdue({ status: "done", dueDate: "2026-11-10" }, "2026-11-11"), false);
});

test("summary accurately handles empty and non-empty collections", () => {
  assert.deepEqual(summarizeTasks([]), { total: 0, done: 0, active: 0, overdue: 0, progress: 0 });
  const summary = summarizeTasks(createSampleTasks(new Date("2026-11-11T10:00:00.000Z")), "2026-11-11");
  assert.equal(summary.total, 9);
  assert.equal(summary.done, 2);
  assert.equal(summary.active, 3);
  assert.equal(summary.overdue, 1);
  assert.equal(summary.progress, 22);
});
