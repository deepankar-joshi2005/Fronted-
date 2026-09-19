import { ROLES } from "../config/roles.js";
import * as businessClientApi from "../api/businessClient.api.js";

// Business Client Admin/Employee have no reason to see CA-Management's own UI —
// their whole job lives in HRMS, so anywhere this role turns up authenticated
// in CA-Management should hand off to HRMS instead of showing a CA-Management
// page first.
export const BUSINESS_CLIENT_ROLES = [ROLES.BUSINESS_CLIENT_ADMIN, ROLES.BUSINESS_CLIENT_EMPLOYEE];

// Same origin, proxied through to the HRMS dev server — see vite.config.ts's
// "/hrms-app" rule. Must match HRMS's own router basename.
export const HRMS_BASE_PATH = "/hrms-app";

// Fetches a fresh HRMS session token for the current Business Client user and
// hard-redirects into HRMS. Resolves to false (without redirecting) if the
// token couldn't be issued — e.g. HRMS provisioning isn't done yet — so the
// caller can fall back to its own "still being set up" / retry UI.
export async function redirectToHrms() {
  try {
    const { data } = await businessClientApi.getMyHrmsSsoToken();
    window.location.href = `${HRMS_BASE_PATH}/sso?token=${encodeURIComponent(data.data.token)}`;
    return true;
  } catch {
    return false;
  }
}
