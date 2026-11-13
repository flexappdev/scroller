import { ImageResponse } from "next/og";
import { appIconDataUri } from "@/lib/app-icon";

// PNG app icons for the web manifest: /app-icon/192, /app-icon/512 and
// /app-icon/maskable (512, full-bleed for Android adaptive icons).
const VARIANTS: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  maskable: { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ variant: string }> }) {
  const variant = VARIANTS[(await params).variant];
  if (!variant) return new Response("Not found", { status: 404 });
  const { size, maskable } = variant;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={appIconDataUri({ maskable })} width={size} height={size} alt="" />,
    { width: size, height: size },
  );
}
