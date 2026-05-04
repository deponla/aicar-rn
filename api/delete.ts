import { instance } from "./config";
import { SessionResponse } from "@/types/session";

// Sessions
export async function deleteSession(id: string): Promise<SessionResponse> {
  return instance.delete(`v1/sessions/${id}`).then((r) => r.data);
}
