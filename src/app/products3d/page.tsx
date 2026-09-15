import Script from "next/script";
import Product3DClient from "./Product3DClient";

export const metadata = {
  title: "3D Products · Scroller",
  description: "Interactive 3D TTShop product lab for Scroller and premium ad production.",
};

export default function Product3DPage() {
  return (
    <>
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />
      <Product3DClient />
    </>
  );
}
