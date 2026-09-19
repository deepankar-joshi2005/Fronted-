/** @format */

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Play,  LogIn, LogOut, Coffee, MapPin,  } from "lucide-react";
import Loader from "../../Loader";

const API = import.meta.env.VITE_API_URL;

interface PunchLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface AttendanceLog {
  date: string;
  punchIn?: string;
  punchOut?: string;
  punchInLocation?: PunchLocation | null;
  punchOutLocation?: PunchLocation | null;
  breakTime: number; // seconds
  workTime: number; // seconds
  status?: string;
  reason?: string;
}

const mapUrl = (loc: PunchLocation) => `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
const mapEmbedUrl = (loc: PunchLocation) => `https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`;
const locationLabel = (loc: PunchLocation) => loc.address || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;

const STATUS_STYLES: Record<string, string> = {
  FULL_DAY: "bg-green-100 text-green-700",
  LATE_FULL_DAY: "bg-amber-100 text-amber-700",
  HALF_DAY: "bg-blue-100 text-blue-700",
  LATE_HALF_DAY: "bg-orange-100 text-orange-700",
  ABSENT: "bg-red-100 text-red-700",
  ON_LEAVE: "bg-indigo-100 text-indigo-700",
  HOLIDAY: "bg-gray-100 text-gray-600",
  WEEKLY_OFF: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  FULL_DAY: "Full Day",
  LATE_FULL_DAY: "Late — Full Day",
  HALF_DAY: "Half Day",
  LATE_HALF_DAY: "Late — Half Day",
  ABSENT: "Absent",
  ON_LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  WEEKLY_OFF: "Weekly Off",
};

export default function MarkAttendance() {
  const token = localStorage.getItem("token");

  /* ================= STATE ================= */

  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const [isWorking, setIsWorking] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [loading,setLoading]=useState(true);

  // Source of truth for the live timer: real timestamps, not an incrementing
  // counter. Re-derived every tick so the clock is correct no matter when
  // the page is (re)loaded (nav away/back, logout/login, refresh, etc.)
  const punchInAtRef = useRef<Date | null>(null);
  const persistedBreakSecondsRef = useRef(0);
  const currentBreakStartRef = useRef<Date | null>(null);

  const tickTimer = useRef<NodeJS.Timeout | null>(null);

  /* ================= AXIOS ================= */

  const api = axios.create({
    baseURL: API,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  /* ================= TIMER EFFECT ================= */

  const recomputeTimers = () => {
    const punchInAt = punchInAtRef.current;
    if (!punchInAt) return;

    const now = Date.now();
    const ongoingBreakSeconds = currentBreakStartRef.current
      ? Math.floor((now - currentBreakStartRef.current.getTime()) / 1000)
      : 0;

    const totalBreak = persistedBreakSecondsRef.current + ongoingBreakSeconds;
    const elapsedSincePunchIn = Math.floor((now - punchInAt.getTime()) / 1000);

    setBreakSeconds(totalBreak);
    setWorkingSeconds(Math.max(0, elapsedSincePunchIn - totalBreak));
  };

  useEffect(() => {
    if (!isWorking) return;

    recomputeTimers();
    tickTimer.current = setInterval(recomputeTimers, 1000);

    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorking, onBreak]);

  /* ================= HELPERS ================= */

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  /* ================= FETCH HISTORY ================= */

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    const res = await api.get("/attendance/me");

    const records: AttendanceLog[] = res.data.map((a: any) => ({
      date: a.date,
      punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString() : undefined,
      punchOut: a.punchOut
        ? new Date(a.punchOut).toLocaleTimeString()
        : undefined,
      punchInLocation: a.punchInLocation || null,
      punchOutLocation: a.punchOutLocation || null,
      breakTime: a.totalBreakSeconds,
      workTime: a.totalWorkSeconds,
      status: a.classification?.status,
      reason: a.classification?.reason,
    }));

    setHistory(records);
    setLoading(false);

    const today = new Date().toISOString().split("T")[0];
    const todayRecord = res.data.find((a: any) => a.date === today);

    if (todayRecord) {
      setTodayLog({
        date: todayRecord.date,
        punchIn: todayRecord.punchIn
          ? new Date(todayRecord.punchIn).toLocaleTimeString()
          : undefined,
        punchOut: todayRecord.punchOut
          ? new Date(todayRecord.punchOut).toLocaleTimeString()
          : undefined,
        punchInLocation: todayRecord.punchInLocation || null,
        punchOutLocation: todayRecord.punchOutLocation || null,
        breakTime: todayRecord.totalBreakSeconds,
        workTime: todayRecord.totalWorkSeconds,
        status: todayRecord.classification?.status,
        reason: todayRecord.classification?.reason,
      });

      persistedBreakSecondsRef.current = todayRecord.totalBreakSeconds || 0;

      const lastBreak =
        todayRecord.breaks && todayRecord.breaks.length > 0
          ? todayRecord.breaks[todayRecord.breaks.length - 1]
          : null;
      const isOnBreak = !!(lastBreak && !lastBreak.end);
      setOnBreak(isOnBreak);
      currentBreakStartRef.current = isOnBreak ? new Date(lastBreak.start) : null;

      if (todayRecord.punchIn && !todayRecord.punchOut) {
        // Still punched in: anchor the timer to the real punch-in time so
        // it always reflects actual elapsed time, not a counter that
        // restarts from whatever was last saved.
        punchInAtRef.current = new Date(todayRecord.punchIn);
        setIsWorking(true);
        recomputeTimers();
      } else {
        // Punched out (or never punched in): show the final saved totals.
        punchInAtRef.current = null;
        setWorkingSeconds(todayRecord.totalWorkSeconds || 0);
        setBreakSeconds(todayRecord.totalBreakSeconds || 0);
      }
    }
  };

  /* ================= ACTIONS ================= */

const punchIn = async () => {
  const res = await api.post("/attendance/punch-in");
  const attendance = res.data.attendance;

  const now = new Date(attendance.punchIn).toLocaleTimeString();

  // Anchor the live timer to the server's punch-in timestamp.
  punchInAtRef.current = new Date(attendance.punchIn);
  persistedBreakSecondsRef.current = 0;
  currentBreakStartRef.current = null;

  // 🔹 1️⃣ today log set
  setTodayLog({
    date: new Date().toLocaleDateString(),
    punchIn: now,
    breakTime: 0,
    workTime: 0,
  });

  // 🔹 2️⃣ 👇 YAHI ADD KARNA THA (TABLE ENTRY KE LIYE)
  setHistory((prev) => {
    const exists = prev.find((h) => h.date === new Date().toLocaleDateString());
    if (exists) return prev;

    return [
      {
        date: new Date().toLocaleDateString(),
        punchIn: now,
        breakTime: 0,
        workTime: 0,
      },
      ...prev,
    ];
  });

  // 🔹 3️⃣ working start
  setIsWorking(true);
};


  const punchOut = async () => {
    const res = await api.post("/attendance/punch-out");
    const attendance = res.data.attendance;

    setIsWorking(false);
    setOnBreak(false);
    punchInAtRef.current = null;
    currentBreakStartRef.current = null;

    setWorkingSeconds(attendance.totalWorkSeconds || 0);
    setBreakSeconds(attendance.totalBreakSeconds || 0);

    const updated = {
      ...todayLog!,
      punchOut: new Date(attendance.punchOut).toLocaleTimeString(),
      breakTime: attendance.totalBreakSeconds || 0,
      workTime: attendance.totalWorkSeconds || 0,
    };

    setTodayLog(updated);
   setHistory((prev) =>
     prev.map((h) =>
       h.date === todayLog?.date
         ? {
             ...h,
             punchOut: updated.punchOut,
             workTime: updated.workTime,
           }
         : h
     )
   );

   // Pull the real policy-computed status (full/half/absent/late) for today
   // now that punch-out has landed — the punch-out response itself doesn't
   // carry the classification, only /attendance/me does.
   fetchAttendance();
  };

  const startBreak = async () => {
    const res = await api.post("/attendance/break/start");
    const attendance = res.data.attendance;
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    currentBreakStartRef.current = new Date(lastBreak.start);
    setOnBreak(true);
  };

  const endBreak = async () => {
    const res = await api.post("/attendance/break/end");
    const attendance = res.data.attendance;

    persistedBreakSecondsRef.current = attendance.totalBreakSeconds || 0;
    currentBreakStartRef.current = null;
    setOnBreak(false);
    setHistory((prev) =>
      prev.map((h) =>
        h.date === todayLog?.date ? { ...h, breakTime: attendance.totalBreakSeconds || 0 } : h
      )
    );
  };

  if(loading)return<Loader/>;
  /* ================= UI ================= */

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT PANEL ================= */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="font-medium mb-2">Timesheet</h2>

            <div className="w-40 h-40 mx-auto rounded-full border-4 border-gray-200 flex items-center justify-center text-xl font-semibold">
              {formatTime(workingSeconds)}
            </div>

            <div className="mt-6 flex justify-center gap-3">
              {!todayLog && (
                <button
                  onClick={punchIn}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2"
                >
                  <LogIn size={16} /> Punch In
                </button>
              )}

              {todayLog && !todayLog.punchOut && (
                <>
                  <button
                    onClick={punchOut}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <LogOut size={16} /> Punch Out
                  </button>

                  {!onBreak ? (
                    <button
                      onClick={startBreak}
                      className="px-4 py-2 bg-yellow-400 text-black rounded-lg flex items-center gap-2"
                    >
                      <Coffee size={16} /> Break
                    </button>
                  ) : (
                    <button
                      onClick={endBreak}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
                    >
                      <Play size={16} /> End Break
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Break Time: {formatTime(breakSeconds)}
            </div>
          </div>

          {/* ================= TODAY ACTIVITY ================= */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-medium mb-3">Today Activity</h3>

            {!todayLog && (
              <p className="text-sm text-gray-500">Not punched in yet</p>
            )}

            {todayLog && (
              <div className="text-sm space-y-3">
                <div>
                  <p>✅ Punch In: {todayLog.punchIn}</p>
                  {todayLog.punchInLocation && (
                    <>
                      <p className="text-xs text-gray-500 flex items-start gap-1 mt-0.5">
                        <MapPin size={11} className="mt-0.5 shrink-0 text-orange-500" />
                        {locationLabel(todayLog.punchInLocation)}
                      </p>
                      <div className="mt-1.5 rounded-md overflow-hidden border" style={{ height: 100 }}>
                        <iframe
                          title="Punch-in location"
                          src={mapEmbedUrl(todayLog.punchInLocation)}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                        />
                      </div>
                    </>
                  )}
                </div>

                {onBreak && <p>☕ On Break</p>}

                {todayLog.punchOut && (
                  <div>
                    <p>🚪 Punch Out: {todayLog.punchOut}</p>
                    {todayLog.punchOutLocation && (
                      <>
                        <p className="text-xs text-gray-500 flex items-start gap-1 mt-0.5">
                          <MapPin size={11} className="mt-0.5 shrink-0 text-orange-500" />
                          {locationLabel(todayLog.punchOutLocation)}
                        </p>
                        <div className="mt-1.5 rounded-md overflow-hidden border" style={{ height: 100 }}>
                          <iframe
                            title="Punch-out location"
                            src={mapEmbedUrl(todayLog.punchOutLocation)}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {todayLog?.punchOut && todayLog.status && (
              <div className="mt-3 pt-3 border-t">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    STATUS_STYLES[todayLog.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[todayLog.status] || todayLog.status}
                </span>
                {todayLog.reason && (
                  <p className="text-xs text-gray-500 mt-2">{todayLog.reason}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2">Punch In</th>
                <th className="p-2">Punch Out</th>
                <th className="p-2">Break</th>
                <th className="p-2">Work</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{h.date}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1">
                      {h.punchIn}
                      {h.punchInLocation && (
                        <a
                          href={mapUrl(h.punchInLocation)}
                          target="_blank"
                          rel="noreferrer"
                          title={locationLabel(h.punchInLocation)}
                          className="text-orange-500 hover:text-orange-600"
                        >
                          <MapPin size={12} />
                        </a>
                      )}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1">
                      {h.punchOut}
                      {h.punchOutLocation && (
                        <a
                          href={mapUrl(h.punchOutLocation)}
                          target="_blank"
                          rel="noreferrer"
                          title={locationLabel(h.punchOutLocation)}
                          className="text-orange-500 hover:text-orange-600"
                        >
                          <MapPin size={12} />
                        </a>
                      )}
                    </span>
                  </td>
                  <td className="p-2">{formatTime(h.breakTime)}</td>
                  <td className="p-2">{formatTime(h.workTime)}</td>
                  <td className="p-2 text-center">
                    {h.status ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          STATUS_STYLES[h.status] || "bg-gray-100 text-gray-600"
                        }`}
                        title={h.reason}
                      >
                        {STATUS_LABELS[h.status] || h.status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No attendance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
