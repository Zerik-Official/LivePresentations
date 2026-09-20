import { apiClient } from "./client";
import { AuthApi } from "./auth.api";
import { ConfigApi } from "./config.api";
import { PresentationsApi } from "./presentations.api";
import { RoomsApi } from "./rooms.api";
import { UploadsApi } from "./uploads.api";

export { apiClient } from "./client";

export const authApi = new AuthApi(apiClient);
export const configApi = new ConfigApi(apiClient);
export const presentationsApi = new PresentationsApi(apiClient);
export const roomsApi = new RoomsApi(apiClient);
export const uploadsApi = new UploadsApi(apiClient);