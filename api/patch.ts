import { DevicePermissions } from "@/types/device";
import { UserGetResponse, UserUpdateRequest } from "@/types/user";
import { CarResponse, UpdateCarRequest } from "@/types/car";
import { instance } from "./config";

export async function patchUsers(
  id: string,
  d: UserUpdateRequest,
): Promise<UserGetResponse> {
  return instance.patch(`v1/users/${id}`, d).then((r) => r.data);
}

// Devices
export async function patchDevicePermissions(
  deviceId: string,
  permissions: DevicePermissions,
): Promise<void> {
  return instance
    .patch(`v1/devices/${deviceId}`, { permissions })
    .then((r) => r.data);
}

// Cars
export async function patchCar(
  id: string,
  payload: UpdateCarRequest,
): Promise<CarResponse> {
  return instance.patch(`v1/cars/${id}`, payload).then((r) => r.data);
}
