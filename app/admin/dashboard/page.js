import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken
} from "../../../src/lib/auth.js";
import AdminDashboard from "../../../src/components/AdminDashboard.js";

export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    redirect("/admin");
  }

  return <AdminDashboard />;
}
