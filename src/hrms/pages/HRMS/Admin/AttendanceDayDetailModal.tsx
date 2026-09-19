/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import Loader from "../Loader";

const API_BASE = import.meta.env.VITE_API_URL;

interface PunchLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface DayDetail {
  date: string;
  user: { _id: string; name: string; role: string };
  punchIn: string | null;
  punchOut: string | null;
  punchInLocation: PunchLocation | null;
  punchOutLocation: PunchLocation | null;
  breaks: { start: string; end?: string; duration?: number }[];
  totalBreakSeconds: number;
  totalWorkSeconds: number;
  classification: {
    status: string;
    isProvisional: boolean;
    workedHours: number;
    requiredHoursFullDay: number;
    requiredHoursHalfDay: number;
    isLate: boolean;
    lateByMinutes: number;
    earlyExitByMinutes: number;
    overtimeHours: number;
    reason: string;
  };
  source: "PUNCH" | "REQUEST";
  approvedBy: { _id: string; name: string } | null;
  approvedAt: string | null;
  sourceRequest: { _id: string; type: string; reason: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  FULL_DAY: "bg-green-100 text-green-700 border-green-300",
  LATE_FULL_DAY: "bg-amber-100 text-amber-700 border-amber-300",
  HALF_DAY: "bg-blue-100 text-blue-700 border-blue-300",
  LATE_HALF_DAY: "bg-orange-100 text-orange-700 border-orange-300",
  ABSENT: "bg-red-100 text-red-700 border-red-300",
  ON_LEAVE: "bg-indigo-100 text-indigo-700 border-indigo-300",
  HOLIDAY: "bg-gray-100 text-gray-600 border-gray-300",
  WEEKLY_OFF: "bg-gray-100 text-gray-600 border-gray-300",
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

interface Props {
  userId: string;
  userName: string;
  date: string;
  onClose: () => void;
}

export default function AttendanceDayDetailModal({ userId, userName, date, onClose }: Props) {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/attendance/day-detail/${userId}/${date}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setDetail(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance day detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [userId, date]);

  const formatTime = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

  const formatDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const mapUrl = (loc: PunchLocation) => `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
  const mapEmbedUrl = (loc: PunchLocation) =>
    `https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`;
  const locationLabel = (loc: PunchLocation) =>
    loc.address || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-xs text-gray-500">{formatDate(date)}</p>
          </div>
          {detail && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                STATUS_STYLES[detail.classification.status] || "bg-gray-100 text-gray-600 border-gray-300"
              }`}
            >
              {STATUS_LABELS[detail.classification.status] || detail.classification.status}
            </span>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-4">
        {loading && (
          <div className="py-10 flex justify-center">
            <Loader />
          </div>
        )}

        {!loading && detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Work Hours</p>
                <p className="font-semibold text-gray-800">
                  {detail.classification.workedHours}h{detail.classification.isProvisional ? " (so far)" : ""}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Break Time</p>
                <p className="font-semibold text-gray-800">{Math.round((detail.totalBreakSeconds || 0) / 60)}m</p>
              </div>
            </div>

            {(detail.punchIn || detail.punchOut) && (
              <div className="space-y-3">
                {detail.punchIn && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Punch In</p>
                    <p className="font-semibold text-gray-800">{formatTime(detail.punchIn)}</p>
                    {detail.punchInLocation && (
                      <>
                        <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-orange-500" />
                          {locationLabel(detail.punchInLocation)}
                        </p>
                        <div className="mt-2 rounded-md overflow-hidden border border-gray-200" style={{ height: 130 }}>
                          <iframe
                            title="Punch-in location"
                            src={mapEmbedUrl(detail.punchInLocation)}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                          />
                        </div>
                        <a
                          href={mapUrl(detail.punchInLocation)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-orange-600 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                      </>
                    )}
                  </div>
                )}

                {detail.punchOut && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Punch Out</p>
                    <p className="font-semibold text-gray-800">{formatTime(detail.punchOut)}</p>
                    {detail.punchOutLocation && (
                      <>
                        <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-orange-500" />
                          {locationLabel(detail.punchOutLocation)}
                        </p>
                        <div className="mt-2 rounded-md overflow-hidden border border-gray-200" style={{ height: 130 }}>
                          <iframe
                            title="Punch-out location"
                            src={mapEmbedUrl(detail.punchOutLocation)}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                          />
                        </div>
                        <a
                          href={mapUrl(detail.punchOutLocation)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-orange-600 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {detail.breaks && detail.breaks.length > 0 && (
              <div>
                <p className="text-gray-500 font-medium mb-1">Breaks</p>
                <div className="space-y-1">
                  {detail.breaks.map((b, i) => (
                    <div key={i} className="flex justify-between bg-gray-50 rounded px-2 py-1 text-xs">
                      <span>
                        {formatTime(b.start)} → {b.end ? formatTime(b.end) : "ongoing"}
                      </span>
                      <span className="text-gray-500">{b.duration ? `${Math.round(b.duration / 60)}m` : "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1">
              <p className="text-gray-500 font-medium mb-1">Why this status</p>
              <p className="bg-gray-50 p-2 rounded text-gray-700 border text-xs">{detail.classification.reason}</p>
            </div>

            {detail.source === "REQUEST" && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Set via an approved regularization request</p>
                {detail.approvedBy && (
                  <p>
                    Approved by {detail.approvedBy.name}
                    {detail.approvedAt ? ` on ${new Date(detail.approvedAt).toLocaleString()}` : ""}
                  </p>
                )}
                {detail.sourceRequest && (
                  <p className="mt-1 italic">
                    "{detail.sourceRequest.reason}" ({detail.sourceRequest.type})
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !detail && (
          <p className="text-sm text-gray-400 text-center py-8">Could not load details for this day.</p>
        )}
        </div>

        <div className="text-right px-6 py-4 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
