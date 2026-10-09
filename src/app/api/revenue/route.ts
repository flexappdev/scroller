import { getRevenueSnapshot } from "@/lib/revenue/snapshot";

export const dynamic = "force-dynamic";

// When REVENUE_API_TOKEN is set, callers (ABC) must send it as a bearer token
// or ?token=. Without it the endpoint is public, which is fine while it only
// reports configuration and nulls.
function authorised(request: Request) {
  const token = process.env.REVENUE_API_TOKEN?.trim();
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const query = new URL(request.url).searchParams.get("token");
  return header === `Bearer ${token}` || query === token;
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  const probe = new URL(request.url).searchParams.get("probe") !== "0";
  const snapshot = await getRevenueSnapshot({ probe });
  return Response.json(snapshot, {
    headers: { "cache-control": "private, max-age=300" },
  });
}
