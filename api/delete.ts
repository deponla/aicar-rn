import { instance } from "./config";
import { SessionResponse } from "@/types/session";

// Sessions
export async function deleteSession(id: string): Promise<SessionResponse> {
  return instance.delete(`v1/sessions/${id}`).then((r) => r.data);
}

export async function deleteAllSessions(): Promise<void> {
  return instance.delete("v1/sessions").then((r) => r.data);
}

// Cars
export async function deleteCar(id: string): Promise<void> {
  return instance.delete(`v1/cars/${id}`).then((r) => r.data);
}
