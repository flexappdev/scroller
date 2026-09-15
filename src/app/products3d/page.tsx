import Script from "next/script";
import Product3DClient from "./Product3DClient";

export const metadata = {
  title: "3D Products · Scroller",
  description: "Interactive 3D TTShop product lab for Scroller and premium ad production.",
};

export default function Product3DPage() {
  return (
    <>
      <Script id="ttshop-three" type="module" strategy="afterInteractive">
        {`import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/+esm"; window.THREE = THREE; window.dispatchEvent(new Event("ttshop-three-ready"));`}
      </Script>
      <Product3DClient />
    </>
  );
}
