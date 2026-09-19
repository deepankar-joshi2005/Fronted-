import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as complianceApi from "../../api/compliance.api.js";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Spinner.jsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CHIP = {
  pending: "bg-surface-2 text-text-muted",
  in_progress: "bg-brand-soft text-brand",
  done: "bg-success-bg text-success",
};

// "Compliance calendar view (all clients)" — Module Scope doc, Section 4. Fetches
// just the visible month (padded to full weeks) via dueFrom/dueTo rather than
// relying on the list endpoint's 100-row pagination cap, so it stays correct as
// a firm's task history grows.
export default function ComplianceCalendar({ onSelectTask, refreshKey }) {
  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  useEffect(() => {
    setLoading(true);
    complianceApi
      .listTasks({ dueFrom: gridStart.toISOString(), dueTo: gridEnd.toISOString(), limit: 100 })
      .then(({ data }) => setTasks(data.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime(), refreshKey]);

  const tasksByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const key = format(new Date(t.dueDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return map;
  }, [tasks]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor((d) => subMonths(d, 1))} title="Previous month">
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor((d) => addMonths(d, 1))} title="Next month">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-7 bg-surface-2 text-xs font-semibold text-text-muted">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(key) || [];
              const inMonth = isSameMonth(day, cursor);
              return (
                <div key={key} className={`min-h-[96px] bg-surface p-1.5 ${!inMonth ? "opacity-40" : ""}`}>
                  <p
                    className={`mb-1 flex h-5 w-5 items-center justify-center text-xs font-medium ${
                      isToday(day) ? "rounded-full bg-brand text-white" : "text-text-muted"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="flex flex-col gap-1">
                    {dayTasks.slice(0, 3).map((t) => {
                      const overdue = new Date(t.dueDate) < new Date() && t.status !== "done";
                      return (
                        <button
                          key={t._id}
                          onClick={() => onSelectTask(t)}
                          title={t.title}
                          className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80 ${
                            overdue ? "bg-danger-bg text-danger" : STATUS_CHIP[t.status]
                          }`}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="px-1.5 text-[11px] text-text-muted">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
