import Script from "next/script";
import { GA_ID, isAnalyticsEnabled } from "@/lib/analytics";

export function GoogleAnalytics() {
  if (!isAnalyticsEnabled()) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true, anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
