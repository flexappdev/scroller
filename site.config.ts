import { defineSite } from "@fleet/scroller";

export const site = defineSite({
  id: "scroller",
  brand: {
    name: "Scroller",
    accent: "#ec4899",
    themeDefault: "dark",
  },
  sources: ["wiki", "wikivoyage", "youtube", "github", "prompt", "amazon", "image", "site", "app"],
  nav: [
    { id: "home", label: "Home", href: "/" },
    { id: "explore", label: "Explore", href: "/explore" },
    { id: "create", label: "Create", href: "/create" },
    { id: "saved", label: "Saved", href: "/saved" },
    { id: "me", label: "Me", href: "/me" },
  ],
  baseUrl: "https://scroller-psi.vercel.app",
});
