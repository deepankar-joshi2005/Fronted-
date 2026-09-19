import axiosInstance from "./axiosInstance";

export const analyticsService = {
  async startAccess(resourceId: string, grade?: string, className?: string) {
    const res = await axiosInstance.post("/analytics/access/start", { resourceId, grade, className });
    return res.data.data as { sessionIndex: number; logId: string };
  },

  async heartbeat(resourceId: string, sessionIndex: number, deltaSeconds = 5) {
    await axiosInstance.post("/analytics/access/heartbeat", { resourceId, sessionIndex, deltaSeconds });
  },

  async endAccess(resourceId: string, sessionIndex: number, totalDurationSeconds?: number) {
    await axiosInstance.post("/analytics/access/end", { resourceId, sessionIndex, totalDurationSeconds });
  },

  async videoProgress(params: {
    resourceId: string;
    sessionIndex: number;
    playedDeltaSeconds?: number;
    lastPositionSeconds?: number;
    totalDurationSeconds?: number;
    completed?: boolean;
  }) {
    await axiosInstance.post("/analytics/video/progress", params);
  },
};

export default analyticsService;


