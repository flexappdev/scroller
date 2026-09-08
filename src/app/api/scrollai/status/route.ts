import { getScrollAIStatus } from "@/lib/scrollai/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getScrollAIStatus(), {
    headers: { "cache-control": "no-store" },
  });
}
