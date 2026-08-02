"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeaderNav } from "@/components/HeaderNav";
import { Footer } from "@/components/Footer";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface Task {
  id: string;
  taskType: "task_based" | "goal_based";
  taskName: string | null;
  taskDescription: string | null;
  goalMetric: "daily_steps" | "calories_burn" | "min_sleep" | null;
  goalTarget: string | null;
  freqIntervalDays: number | null;
  isActive: boolean;
  createdAt: string;
}

interface DietPlan {
  id: string;
  title: string | null;
  status: string;
  dailySchedule: any;
  nutritionalTargets: any;
  healthGoals: string[];
  aiRationale: string | null;
  doctorNotes: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface HistoryEntry {
  id: string;
  periodDate: string;
  isDone: boolean;
  actualValue: string | null;
}

const METRIC_LABELS: Record<string, string> = {
  daily_steps: "Daily Steps",
  calories_burn: "Calories Burned",
  min_sleep: "Sleep (minutes)",
};

const METRIC_ICONS: Record<string, string> = {
  daily_steps: "directions_walk",
  calories_burn: "local_fire_department",
  min_sleep: "bedtime",
};

export default function TasksDietPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [view, setView] = useState<"tasks" | "diet">("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskHistories, setTaskHistories] = useState<Record<string, HistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user?.onboardingComplete === false) router.push("/onboarding");
  }, [status, session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        fetch("/api/tasks/my"),
        fetch("/api/diet/my"),
      ]);
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (dRes.ok) setDietPlans((await dRes.json()).dietPlans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchHistory = async (taskId: string) => {
    setHistoryLoading(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/history`);
      if (res.ok) {
        const data = await res.json();
        setTaskHistories((prev) => ({ ...prev, [taskId]: data.history || [] }));
      }
    } finally {
      setHistoryLoading(null);
    }
  };

  const toggleExpand = (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      if (!taskHistories[taskId]) fetchHistory(taskId);
    }
  };

  const markDone = async (taskId: string, isDone: boolean) => {
    setMarkingDone(taskId);
    try {
      const endpoint = isDone ? "done" : "undone";
      const res = await fetch(`/api/tasks/${taskId}/${endpoint}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update task");
      showToast(isDone ? "Task marked as done! ✓" : "Task unmarked.");
      // Refresh history
      fetchHistory(taskId);
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setMarkingDone(null);
    }
  };

  const syncHistory = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/tasks/sync-history/${session?.user?.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      showToast("Goal tasks synced with wearable data!");
      // Refresh task history for expanded task
      if (expandedTask) fetchHistory(expandedTask);
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSyncing(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const getTodayStatus = (taskId: string) => {
    const history = taskHistories[taskId] || [];
    return history.find((h) => h.periodDate === todayStr);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F4EF] font-sans">
        <HeaderNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#8C6B1F]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-bold text-[#787363] uppercase tracking-wider">Loading your health plan...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.isActive);
  const taskBasedTasks = activeTasks.filter((t) => t.taskType === "task_based");
  const goalBasedTasks = activeTasks.filter((t) => t.taskType === "goal_based");
  const latestDiet = dietPlans[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#1C1B18] font-sans antialiased">
      <HeaderNav />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl text-white flex items-center gap-2 transition-all ${
          toast.ok ? "bg-emerald-600" : "bg-red-600"
        }`}>
          <MaterialIcon name={toast.ok ? "check_circle" : "error"} className="text-sm" />
          {toast.msg}
        </div>
      )}

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1C1B18] via-[#2A2925] to-[#1C1B18] text-[#FAF9F5] border border-[#3E3A32] p-7 rounded-[32px] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Your Health Plan</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Tasks & Diet</h1>
            <p className="text-xs text-white/50">Assigned by your doctor • Track your daily goals</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Stats Pills */}
            <div className="flex gap-2">
              <span className="text-[10px] font-bold uppercase bg-white/10 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <MaterialIcon name="task_alt" className="text-xs text-emerald-400" />
                {activeTasks.length} Active Tasks
              </span>
              <span className="text-[10px] font-bold uppercase bg-white/10 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <MaterialIcon name="restaurant" className="text-xs text-amber-400" />
                {dietPlans.length} Diet Plan{dietPlans.length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Sync button */}
            <button
              onClick={syncHistory}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              <MaterialIcon name="sync" className={`text-sm ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Goals"}
            </button>
          </div>
        </section>

        {/* View Toggle */}
        <div className="flex gap-1 bg-white border border-[#E6E1D3] rounded-2xl p-1 shadow-xs">
          <button
            onClick={() => setView("tasks")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
              view === "tasks"
                ? "bg-[#1C1B18] text-white shadow-sm"
                : "text-[#787363] hover:text-[#1C1B18]"
            }`}
          >
            <MaterialIcon name="task_alt" className="text-sm" />
            Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setView("diet")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
              view === "diet"
                ? "bg-[#1C1B18] text-white shadow-sm"
                : "text-[#787363] hover:text-[#1C1B18]"
            }`}
          >
            <MaterialIcon name="restaurant" className="text-sm" />
            Diet Plan ({dietPlans.length})
          </button>
        </div>

        {/* ─── TASKS VIEW ─── */}
        {view === "tasks" && (
          <div className="space-y-6">

            {activeTasks.length === 0 && (
              <div className="bg-white border border-[#E6E1D3] rounded-3xl p-12 text-center space-y-3">
                <MaterialIcon name="task_alt" className="text-5xl text-[#E6E1D3] block" />
                <h3 className="font-serif text-lg font-bold text-[#1C1B18]">No tasks assigned yet</h3>
                <p className="text-xs text-[#787363]">Your doctor will assign tasks here. Check back soon.</p>
              </div>
            )}

            {/* Task-Based Tasks */}
            {taskBasedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <MaterialIcon name="check_box" className="text-xs text-emerald-600" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#787363]">Manual Tasks</h2>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Tick when done</span>
                </div>
                <div className="space-y-3">
                  {taskBasedTasks.map((task) => {
                    const todayEntry = getTodayStatus(task.id);
                    const isDoneToday = todayEntry?.isDone || false;
                    const isExpanded = expandedTask === task.id;
                    const isMarking = markingDone === task.id;

                    return (
                      <div key={task.id} className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-xs ${
                        isDoneToday ? "border-emerald-200" : "border-[#E6E1D3]"
                      }`}>
                        <div className="flex items-center gap-4 p-4">
                          {/* Checkbox */}
                          <button
                            onClick={() => {
                              if (!taskHistories[task.id]) fetchHistory(task.id);
                              markDone(task.id, !isDoneToday);
                            }}
                            disabled={isMarking}
                            className={`w-10 h-10 rounded-xl flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                              isDoneToday
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-[#E6E1D3] hover:border-emerald-400 text-transparent hover:text-emerald-300 bg-white"
                            } ${isMarking ? "opacity-50" : ""}`}
                          >
                            <MaterialIcon name="check" className="text-base" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${isDoneToday ? "line-through text-[#A8A28E]" : "text-[#1C1B18]"}`}>
                              {task.taskName}
                            </p>
                            {task.taskDescription && (
                              <p className="text-[10px] text-[#787363] mt-0.5 truncate">{task.taskDescription}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isDoneToday && (
                              <span className="text-[9px] font-bold uppercase px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full">Done today</span>
                            )}
                            <button
                              onClick={() => {
                                toggleExpand(task.id);
                                if (!taskHistories[task.id]) fetchHistory(task.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#F6F4EF] text-[#787363] transition-all cursor-pointer"
                              title="View history"
                            >
                              <MaterialIcon name={isExpanded ? "expand_less" : "history"} className="text-sm" />
                            </button>
                          </div>
                        </div>

                        {/* History Drawer */}
                        {isExpanded && (
                          <div className="border-t border-[#F6F4EF] px-4 py-3 bg-[#FAF9F5]">
                            <p className="text-[9px] font-bold uppercase text-[#787363] mb-2">Completion History (last 20 days)</p>
                            {historyLoading === task.id ? (
                              <p className="text-xs text-[#787363]">Loading...</p>
                            ) : !taskHistories[task.id] || taskHistories[task.id].length === 0 ? (
                              <p className="text-xs text-[#787363]">No history yet. Start by ticking the task today!</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {taskHistories[task.id].slice(0, 20).map((h) => (
                                  <div key={h.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border ${
                                    h.isDone ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[#F6F4EF] border-[#E6E1D3] text-[#A8A28E]"
                                  }`}>
                                    <MaterialIcon name={h.isDone ? "check" : "close"} className="text-xs" />
                                    {h.periodDate === todayStr ? "Today" : h.periodDate}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Goal-Based Tasks */}
            {goalBasedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
                    <MaterialIcon name="track_changes" className="text-xs text-violet-600" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#787363]">Goal Tracking</h2>
                  <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">Auto-tracked from wearable</span>
                </div>
                <div className="space-y-3">
                  {goalBasedTasks.map((task) => {
                    const history = taskHistories[task.id] || [];
                    const todayEntry = history.find((h) => h.periodDate === todayStr);
                    const isExpanded = expandedTask === task.id;
                    const metricLabel = METRIC_LABELS[task.goalMetric || ""] || task.goalMetric;
                    const metricIcon = METRIC_ICONS[task.goalMetric || ""] || "monitoring";
                    const completedDays = history.filter((h) => h.isDone).length;
                    const totalDays = history.length;
                    const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

                    return (
                      <div key={task.id} className="bg-white border border-[#E6E1D3] rounded-2xl overflow-hidden shadow-xs">
                        <div className="flex items-center gap-4 p-4">
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                            todayEntry?.isDone ? "bg-violet-500 text-white" : "bg-violet-50 border border-violet-200 text-violet-600"
                          }`}>
                            <MaterialIcon name={metricIcon} className="text-base" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#1C1B18]">{metricLabel}</p>
                              <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full">
                                Target: {task.goalTarget}
                              </span>
                            </div>
                            {task.taskDescription && (
                              <p className="text-[10px] text-[#787363] mt-0.5">{task.taskDescription}</p>
                            )}
                            {/* Progress bar */}
                            {totalDays > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 bg-[#F0EDE4] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-500 rounded-full transition-all"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-[#787363]">{completedDays}/{totalDays} days</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-[#787363] uppercase">Every</p>
                              <p className="text-xs font-bold text-[#1C1B18]">{task.freqIntervalDays}d</p>
                            </div>
                            {todayEntry?.isDone && (
                              <span className="text-[9px] font-bold uppercase px-2 py-1 bg-violet-50 border border-violet-200 text-violet-700 rounded-full">✓ Met</span>
                            )}
                            <button
                              onClick={() => toggleExpand(task.id)}
                              className="p-1.5 rounded-lg hover:bg-[#F6F4EF] text-[#787363] transition-all cursor-pointer"
                            >
                              <MaterialIcon name={isExpanded ? "expand_less" : "expand_more"} className="text-sm" />
                            </button>
                          </div>
                        </div>

                        {/* Today's value if available */}
                        {todayEntry?.actualValue && (
                          <div className="px-4 pb-3 flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase text-[#787363]">Today:</span>
                            <span className="text-xs font-bold text-violet-700">{todayEntry.actualValue} / {task.goalTarget}</span>
                            <div className="flex-1 h-1 bg-violet-100 rounded-full overflow-hidden ml-1">
                              <div
                                className="h-full bg-violet-500 rounded-full"
                                style={{ width: `${Math.min(100, (parseFloat(todayEntry.actualValue) / parseFloat(task.goalTarget || "1")) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* History Drawer */}
                        {isExpanded && (
                          <div className="border-t border-[#F6F4EF] px-4 py-3 bg-[#FAF9F5]">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[9px] font-bold uppercase text-[#787363]">History (auto-synced from wearable)</p>
                              {historyLoading === task.id && (
                                <svg className="animate-spin h-3 w-3 text-[#8C6B1F]" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                            </div>
                            {!taskHistories[task.id] || taskHistories[task.id].length === 0 ? (
                              <p className="text-xs text-[#787363]">No history yet. Tap "Sync Goals" to sync wearable data.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {taskHistories[task.id].slice(0, 20).map((h) => (
                                  <div key={h.id} className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl text-[9px] font-bold border ${
                                    h.isDone ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-[#F6F4EF] border-[#E6E1D3] text-[#A8A28E]"
                                  }`}>
                                    <MaterialIcon name={h.isDone ? "check" : "close"} className="text-xs" />
                                    <span>{h.periodDate === todayStr ? "Today" : h.periodDate.slice(5)}</span>
                                    {h.actualValue && <span className="opacity-60">{h.actualValue}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── DIET VIEW ─── */}
        {view === "diet" && (
          <div className="space-y-5">
            {dietPlans.length === 0 && (
              <div className="bg-white border border-[#E6E1D3] rounded-3xl p-12 text-center space-y-3">
                <MaterialIcon name="restaurant" className="text-5xl text-[#E6E1D3] block" />
                <h3 className="font-serif text-lg font-bold text-[#1C1B18]">No diet plan yet</h3>
                <p className="text-xs text-[#787363]">Your doctor will generate a personalized AI diet plan for you. Check back soon.</p>
              </div>
            )}

            {dietPlans.map((plan, idx) => (
              <div key={plan.id} className={`bg-white border rounded-3xl overflow-hidden shadow-xs ${
                idx === 0 ? "border-[#8C6B1F]/30" : "border-[#E6E1D3]"
              }`}>
                {/* Plan Header */}
                <div className={`p-5 ${idx === 0 ? "bg-gradient-to-r from-[#FAF6E8] to-white" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-base font-bold text-[#1C1B18]">{plan.title || "Diet Plan"}</h3>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-[#8C6B1F] text-white rounded-full">Latest</span>
                        )}
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          plan.status === "AI_GENERATED" ? "bg-amber-100 text-amber-700" :
                          plan.status === "DOCTOR_VERIFIED" ? "bg-emerald-100 text-emerald-700" :
                          plan.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {plan.status === "AI_GENERATED" ? "✨ AI Generated" : plan.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#787363]">
                        Created {new Date(plan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {plan.startDate && ` • ${plan.startDate} → ${plan.endDate || "ongoing"}`}
                      </p>
                    </div>
                  </div>

                  {/* Health Goals */}
                  {plan.healthGoals && plan.healthGoals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {plan.healthGoals.map((goal: string, i: number) => (
                        <span key={i} className="text-[9px] font-bold px-2.5 py-1 bg-[#FAF6E8] border border-[#E6E1D3] text-[#8C6B1F] rounded-full flex items-center gap-1">
                          <MaterialIcon name="favorite" className="text-xs" />
                          {goal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nutritional Targets */}
                {plan.nutritionalTargets && (
                  <div className="px-5 py-4 border-t border-[#F6F4EF]">
                    <p className="text-[9px] font-bold uppercase text-[#787363] mb-3">Daily Nutritional Targets</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {Object.entries(plan.nutritionalTargets).map(([key, val]: any) => (
                        <div key={key} className="bg-[#FAF9F5] border border-[#F0EDE4] rounded-xl p-2.5 text-center">
                          <p className="text-[8px] font-bold uppercase text-[#787363] leading-tight">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="text-sm font-bold text-[#1C1B18] mt-1">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Schedule */}
                {plan.dailySchedule && (
                  <div className="px-5 py-4 border-t border-[#F6F4EF]">
                    <p className="text-[9px] font-bold uppercase text-[#787363] mb-3">Daily Meal Schedule</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(plan.dailySchedule).map(([mealKey, info]: any) => (
                        <div key={mealKey} className="bg-[#FAF9F5] border border-[#F0EDE4] rounded-2xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-[#8C6B1F]">
                              {mealKey.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            {info.time && (
                              <span className="text-[9px] font-bold text-[#787363] bg-white border border-[#E6E1D3] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <MaterialIcon name="schedule" className="text-xs" />
                                {info.time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#1C1B18] leading-relaxed">
                            {Array.isArray(info.meals) ? info.meals.join(", ") : info.meals}
                          </p>
                          {info.notes && (
                            <p className="text-[9px] text-[#787363] mt-1.5 italic border-t border-[#F0EDE4] pt-1.5">{info.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Rationale */}
                {plan.aiRationale && (
                  <div className="px-5 py-4 border-t border-[#F6F4EF] bg-[#FAF9F5]/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center">
                        <MaterialIcon name="auto_awesome" className="text-xs text-amber-600" />
                      </div>
                      <p className="text-[9px] font-bold uppercase text-[#787363]">AI Clinical Rationale</p>
                    </div>
                    <p className="text-xs text-[#1C1B18] leading-relaxed">{plan.aiRationale}</p>
                  </div>
                )}

                {/* Doctor Notes */}
                {plan.doctorNotes && (
                  <div className="px-5 py-4 border-t border-[#F6F4EF]">
                    <div className="flex items-center gap-2 mb-2">
                      <MaterialIcon name="medical_services" className="text-sm text-[#1C5396]" />
                      <p className="text-[9px] font-bold uppercase text-[#787363]">Doctor Notes</p>
                    </div>
                    <p className="text-xs text-[#1C1B18] leading-relaxed">{plan.doctorNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
