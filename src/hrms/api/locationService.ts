import axiosInstance from "./axiosInstance";

export interface State {
  _id: string;
  name: string;
  code: string;
}

export interface District {
  _id: string;
  name: string;
  code: string;
}

export const locationService = {
  getStates: async (): Promise<State[]> => {
    const response = await axiosInstance.get("/states");
    return response.data;
  },
  getDistricts: async (stateId: string): Promise<District[]> => {
    if (!stateId) return [];
    const response = await axiosInstance.get(`/states/${stateId}/districts`);
    return response.data;
  },
};
