import SiemaClient from "./SiemaClient";

export const metadata = {
  title: "Siema",
  description: "A full-screen local scroller for downloaded Siema images.",
};

export default function SiemaPage() {
  return <SiemaClient />;
}
