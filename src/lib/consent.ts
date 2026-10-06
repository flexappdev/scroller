// Google Consent Mode v2 defaults. Runs before gtag.js or adsbygoogle.js load so
// UK/EEA/Swiss visitors start with ads and analytics storage denied until the
// Google-certified CMP (AdSense "Privacy & messaging") records their choice.
// Everyone else defaults to granted. MSB-008 / MSS-011.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
];

export const CONSENT_INIT = `(function(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)},wait_for_update:500});gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});gtag('set','ads_data_redaction',true);})();`;
