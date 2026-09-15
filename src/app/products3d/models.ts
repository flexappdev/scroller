export type Product3DModel = {
  id: string;
  name: string;
  category: string;
  hook: string;
  builder: "charger" | "projector" | "nano" | "cube" | "monitor" | "buds" | "tracker" | "printer" | "translate" | "hub";
};

export const PRODUCT_MODELS: Product3DModel[] = [
  { id: "01_anker_100w_smart_charger", name: "Anker 100W Smart Display Charger", category: "Smart charger", hook: "100W. Power you can see.", builder: "charger" },
  { id: "02_hy300_pro_projector", name: "HY300 Pro Mini Projector", category: "Projector", hook: "Your wall is now a cinema.", builder: "projector" },
  { id: "03_anker_nano_10k_45w", name: "Anker Nano 10K 45W Retractable Power Bank", category: "Power bank", hook: "The cable is inside.", builder: "nano" },
  { id: "04_anker_3in1_cube", name: "Anker 3-in-1 Cube with MagSafe", category: "3-in-1 charger", hook: "This cube charges three.", builder: "cube" },
  { id: "05_arzopa_a1_monitor", name: "ARZOPA A1 15.6 Portable Monitor", category: "Portable monitor", hook: "One cable. Two screens.", builder: "monitor" },
  { id: "06_cmf_buds_2", name: "CMF Buds 2", category: "ANC earbuds", hook: "The city. Muted.", builder: "buds" },
  { id: "07_eufy_smarttrack_card", name: "eufy SmartTrack Card", category: "Tracker", hook: "Your wallet can call for help.", builder: "tracker" },
  { id: "08_niimbot_b1", name: "NIIMBOT B1 Label Printer", category: "Label printer", hook: "Chaos. Meet labels.", builder: "printer" },
  { id: "09_ai_translation_earbuds", name: "AI Translation Earbuds", category: "Translation earbuds", hook: "You speak. I hear.", builder: "translate" },
  { id: "10_anker_555_hub", name: "Anker 555 USB-C Hub (8-in-1)", category: "USB-C hub", hook: "One port. Eight possibilities.", builder: "hub" },
];
