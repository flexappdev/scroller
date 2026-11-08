import { ImageResponse } from "next/og";
import { appIconDataUri } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so use the full-bleed variant.
export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={appIconDataUri({ maskable: true })} width={180} height={180} alt="" />,
    size,
  );
}
