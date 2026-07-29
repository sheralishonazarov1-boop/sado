// seed.ts — all reference/domain data plus the realistic seed-data generator for SADO.
// Regenerated fresh every server startup (dates are always relative to "now", so
// the demo never looks stale no matter which morning it actually runs).

// ==========================================
// STATIC REFERENCE DATA (moved from server.ts so this module is self-contained
// and can be imported by server.ts without a circular dependency)
// ==========================================

export const REGIONS = [
  { id: 1, name: "Xorazm viloyati", level: "viloyat" },

  // Tumans
  { id: 11, name: "Urganch shahri", level: "tuman", parent_id: 1 },
  { id: 12, name: "Xiva shahri", level: "tuman", parent_id: 1 },
  { id: 13, name: "Gurlan tumani", level: "tuman", parent_id: 1 },
  { id: 14, name: "Shovot tumani", level: "tuman", parent_id: 1 },
  { id: 15, name: "Qo'shko'pir tumani", level: "tuman", parent_id: 1 },

  // Mahallalar for Urganch shahri
  { id: 101, name: "Al-Xorazmiy MFY", level: "mahalla", parent_id: 11 },
  { id: 102, name: "Jaloliddin Manguberdi MFY", level: "mahalla", parent_id: 11 },
  { id: 103, name: "Tinchlik MFY", level: "mahalla", parent_id: 11 },
  { id: 104, name: "Obod Mahalla MFY", level: "mahalla", parent_id: 11 },

  // Mahallalar for Xiva shahri
  { id: 111, name: "Ichan-Qal'a MFY", level: "mahalla", parent_id: 12 },
  { id: 112, name: "Kaltaminor MFY", level: "mahalla", parent_id: 12 },
  { id: 113, name: "Polvon yop MFY", level: "mahalla", parent_id: 12 },

  // Mahallalar for Gurlan tumani
  { id: 121, name: "Bo'ston MFY", level: "mahalla", parent_id: 13 },
  { id: 122, name: "Vatanparvar MFY", level: "mahalla", parent_id: 13 }
];

export const AGENCIES = [
  { id: 1, name: "Hokimlik", slug: "hokimlik" },
  { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
  { id: 3, name: "Sog'liqni saqlash", slug: "soglik" },
  { id: 4, name: "Yo'llar boshqarmasi", slug: "yollar" },
  { id: 5, name: "Maktabgacha ta'lim", slug: "maktabgacha" },
  { id: 6, name: "Ichki ishlar", slug: "ichki_ishlar" }
];

export const CATEGORIES_MAPPING: { [key: string]: { label: string; agencyId: number } } = {
  street_lighting: { label: "Ko'cha yoritish", agencyId: 2 }, // Kommunal xizmat
  water_supply: { label: "Ichimlik suvi", agencyId: 2 }, // Kommunal xizmat
  sewerage: { label: "Kanalizatsiya", agencyId: 2 }, // Kommunal xizmat
  waste: { label: "Chiqindi va tozalash", agencyId: 2 }, // Kommunal xizmat
  heating_gas: { label: "Gaz va issiqlik", agencyId: 2 }, // Kommunal xizmat
  roads: { label: "Yo'llarni ta'mirlash", agencyId: 4 }, // Yo'llar boshqarmasi
  healthcare: { label: "Tibbiyot xizmatlari", agencyId: 3 }, // Sog'liqni saqlash
  preschool_education: { label: "Bog'cha va maktab", agencyId: 5 }, // Maktabgacha ta'lim
  public_order: { label: "Jamoat tartibi", agencyId: 6 }, // Ichki ishlar
  other: { label: "Boshqa muammolar", agencyId: 1 } // Hokimlik
};

export const adminUsers = [
  {
    id: 1,
    username: "super.admin",
    password: "super123",
    full_name: "Sarvar Xorazmiy",
    role: "super_admin",
    is_active: true,
    agency: { id: 1, name: "Hokimlik", slug: "hokimlik" },
    last_login_at: "2026-07-28T09:14:00Z"
  },
  {
    id: 2,
    username: "kommunal.admin",
    password: "admin123",
    full_name: "Bekzod Yusupov",
    role: "agency_admin",
    is_active: true,
    agency: { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
    last_login_at: "2026-07-28T09:10:00Z"
  },
  {
    id: 3,
    username: "kommunal.operator",
    password: "operator123",
    full_name: "Nilufar Qosimova",
    role: "operator",
    is_active: true,
    agency: { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
    last_login_at: "2026-07-28T08:05:00Z"
  },
  {
    id: 4,
    username: "soglik.admin",
    password: "admin123",
    full_name: "Dilnoza Karimova",
    role: "agency_admin",
    is_active: true,
    agency: { id: 3, name: "Sog'liqni saqlash", slug: "soglik" },
    last_login_at: "2026-07-27T14:20:00Z"
  },
  {
    id: 5,
    username: "yollar.admin",
    password: "admin123",
    full_name: "Jasur Ergashiv",
    role: "agency_admin",
    is_active: true,
    agency: { id: 4, name: "Yo'llar boshqarmasi", slug: "yollar" },
    last_login_at: "2026-07-28T07:15:00Z"
  },
  {
    id: 6,
    username: "yollar.operator",
    password: "operator123",
    full_name: "Xurshid Karimov",
    role: "operator",
    is_active: true,
    agency: { id: 4, name: "Yo'llar boshqarmasi", slug: "yollar" },
    last_login_at: "2026-07-28T07:30:00Z"
  }
];

// Rules-based keyword classifier — the deterministic fallback used whenever
// Gemini is unavailable, and reused here so seeded appeals are categorised the
// same way the live system would categorise them.
export function classifyByKeywords(text: string): { category: string; priority: "high" | "medium" } {
  const txt = text.toLowerCase();
  let category = "other";

  if (txt.includes("yorit") || txt.includes("chiroq") || txt.includes("svet") || txt.includes("qorong'u")) {
    category = "street_lighting";
  } else if (txt.includes("suv") || txt.includes("quvur") || txt.includes("kran") || txt.includes("uzildi")) {
    category = "water_supply";
  } else if (txt.includes("kanaliz") || txt.includes("oqova") || txt.includes("shlang") || txt.includes("toshdi")) {
    category = "sewerage";
  } else if (txt.includes("chiqindi") || txt.includes("axlat") || txt.includes("tozala") || txt.includes("musor")) {
    category = "waste";
  } else if (txt.includes("gaz") || txt.includes("issiq") || txt.includes("otop") || txt.includes("pech")) {
    category = "heating_gas";
  } else if (txt.includes("yo'l") || txt.includes("asfalt") || txt.includes("chuqur") || txt.includes("pothole")) {
    category = "roads";
  } else if (txt.includes("kasal") || txt.includes("shifokor") || txt.includes("polikl") || txt.includes("vrach") || txt.includes("dori")) {
    category = "healthcare";
  } else if (txt.includes("bog'cha") || txt.includes("maktab") || txt.includes("sinf") || txt.includes("o'qit")) {
    category = "preschool_education";
  } else if (txt.includes("milits") || txt.includes("tartib") || txt.includes("bezori") || txt.includes("ichki ishlar") || txt.includes("shovqin")) {
    category = "public_order";
  }

  const priority: "high" | "medium" = (txt.includes("shoshilinch") || txt.includes("xavf") || txt.includes("avariya")) ? "high" : "medium";

  return { category, priority };
}

// ==========================================
// GENERATOR INTERNALS
// ==========================================

const NOW = new Date();

const PRIORITY_DAYS: { [k: string]: number } = { high: 3, medium: 7, low: 14 };
const PRIORITY_LABELS: { [k: string]: string } = { high: "Yuqori", medium: "O'rta", low: "Past" };
const STATUS_LABELS: { [k: string]: string } = { new: "Yangi", reviewing: "Ko'rib chiqilmoqda", in_progress: "Ijroda", done: "Yakunlangan" };

const NAMES = [
  "Aziz Karimov", "Sardor Yusupov", "Bekzod Rahimov", "Javlon Tursunov", "Otabek Ne'matov",
  "Sherzod Yoldashev", "Farrux Abdullayev", "Ulug'bek Xolmatov", "Jasur Ergashev", "Sanjar Ibragimov",
  "Dilnoza Yusupova", "Gulnora Sattorova", "Zarina Matyoqubova", "Malika Eshonqulova", "Shahnoza Rustamova",
  "Feruza Abdurahimova", "Madina Tojiboyeva", "Kamola Nazarova", "Sitora Jo'rayeva", "Bahodir Nurmatov",
  "Alisher Zokirov", "Davron Sodiqov", "Rustam Qodirov", "Hasan Yusupov", "Nodira Sharipova",
  "Gulbahor Tosheva", "Mavluda Karimova", "Iroda Xudoyberdiyeva", "Odina Rashidova"
];

const STREET_NAMES = [
  "Al-Xorazmiy", "Mustaqillik", "Navro'z", "G'alaba", "Zargarlar", "Amir Temur", "Beruniy",
  "Navoiy", "Istiqlol", "Do'stlik", "Bunyodkor", "Yoshlik", "Mirzo Ulug'bek"
];

const MAHALLA_TUMAN_PAIRS = REGIONS
  .filter(r => r.level === "mahalla")
  .map(m => ({
    mahalla: m.name,
    tuman: REGIONS.find(t => t.id === (m as any).parent_id)!.name
  }));

const SIGNATURE_TEMPLATES = [
  " Murojaatchi: {name}, aloqa uchun telefon: {phone}.",
  " ({name}, tel: {phone})",
  " Xabar bergan fuqaro — {name}, {phone}."
];

// 3 templates per category x 10 categories = 30. Each is worded so the keyword
// classifier above lands on the intended category — verified at generation time
// (see the console.warn check in generateComplaintText).
const TEMPLATES: { category: string; texts: string[] }[] = [
  { category: "street_lighting", texts: [
    "{street} ko'chasida chiroqlar bir necha kundan beri yonmayapti, kechasi juda qorong'u va xavfli bo'lib qolgan.",
    "{mahalla} hududidagi ustunlardagi svet lampalari kuygan, mahalla aholisi kechqurun yura olmayapti.",
    "{street} ko'chasi bo'ylab yorug'lik yo'q, bolalar maktabdan qorong'uda qaytishga majbur bo'lmoqda."
  ]},
  { category: "water_supply", texts: [
    "{mahalla} hududida ichimlik suvi bosimi juda past, kranlardan kunlab suv oqmayapti.",
    "{street} ko'chasi yashovchilari uch kundan beri suv muammosidan aziyat chekmoqda, hovlimizga suv umuman kelmayapti.",
    "Kvartiramizdagi kranlarda suv bosimi kuchsiz, ertalab suv butunlay to'xtab qolyapti."
  ]},
  { category: "sewerage", texts: [
    "{mahalla} hududida kanalizatsiya to'lib, ko'chaga oqova chiqib ketmoqda, hid juda yoqimsiz.",
    "{street} ko'chasida kanalizatsiya tizimi ishlamay qolgan, hovlilarga iflos oqova yoyilmoqda.",
    "Mahallamizda kanalizatsiya avariyasi yuz bergan, ko'p kundan beri oqova hidi butun ko'chaga tarqalmoqda."
  ]},
  { category: "waste", texts: [
    "{mahalla} hududida chiqindi konteynerlari ikki haftadan beri bo'shatilmagan, atrofga yoqimsiz hid tarqalmoqda.",
    "{street} ko'chasi bo'ylab axlat yig'ilib qolgan, mashina kelib olib ketmayapti.",
    "Ko'cha bo'ylab musor sochilib yotibdi, hech kim tozalamayapti, bolalar o'ynashga chiqolmayapti."
  ]},
  { category: "heating_gas", texts: [
    "{mahalla} hududida gaz bosimi keskin pasaygan, pechda ovqat pishirib bo'lmayapti.",
    "{street} ko'chasi yashovchilarining uylariga gaz umuman kelmayapti, issiqlik ta'minoti butunlay uzilgan.",
    "Qish kunlarida gaz taqchilligi tufayli xonalarimiz sovuq, pech yoqishga gaz yetmayapti."
  ]},
  { category: "roads", texts: [
    "{street} ko'chasi yo'lida katta chuqurlar paydo bo'lgan, mashinalar zo'rg'a o'tmoqda.",
    "{mahalla} hududidagi asfalt yo'llar butunlay yorilib ketgan, yomg'ir yog'sa ko'lmaklar hosil bo'ladi.",
    "Ichki yo'llarimizda chuqurlar ko'payib ketgan, piyodalar ham mashinalar ham qiynalmoqda."
  ]},
  { category: "healthcare", texts: [
    "{mahalla} hududidagi oilaviy poliklinikada navbatlar juda katta, shifokorlar o'z vaqtida kelmayapti.",
    "Tumanimizdagi kasalxonada dori-darmon yetishmovchiligi kuchaygan, bemorlar qiynalmoqda.",
    "{street} ko'chasi yaqinidagi tibbiyot punktida vrach doimiy ishlamayapti, aholi boshqa hududga borishga majbur."
  ]},
  { category: "preschool_education", texts: [
    "{mahalla} hududidagi bog'cha binosi qishda isitilmayapti, bolalar sovuqda o'tirishga majbur.",
    "Maktabimizdagi sinf xonalari juda eskirgan, o'qituvchilar sharoit yo'qligidan shikoyat qilmoqda.",
    "{street} ko'chasidagi bog'chada joy yetishmovchiligi bor, navbatga yozilgan bolalar qabul qilinmayapti."
  ]},
  { category: "public_order", texts: [
    "{mahalla} hududida kechalari shovqin-suron ko'p, tartib buzilmoqda, uxlab bo'lmayapti.",
    "{street} ko'chasida bezorilik holatlari kuchaygan, ichki ishlar xodimlari tez-tez chaqirilishi kerak.",
    "Mahallamizda jamoat tartibi buzilib, kechqurunlari mast kishilar shovqin solmoqda."
  ]},
  { category: "other", texts: [
    "{mahalla} hududidagi bog' skameykalari singan, bolalar o'ynash uchun joy yo'q, ta'mirlash kerak.",
    "{street} ko'chasi atrofida egasiz itlar ko'payib ketgan, aholi xavfsizligiga tahdid solmoqda.",
    "{mahalla} hududidagi bozorda narx-nazorati yo'q, sotuvchilar noto'g'ri o'lchov ishlatmoqda, tekshiruv o'tkazilishi kerak."
  ]}
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if (r < it.weight) return it.value;
    r -= it.weight;
  }
  return items[items.length - 1].value;
}

// Skews toward small values (recent dates) instead of a flat uniform spread.
function recentDaysAgo(maxDays: number): number {
  return Math.floor(Math.pow(Math.random(), 2) * maxDays);
}

function makePhone(): string {
  const codes = ["90", "91", "93", "94", "95", "97", "98", "99"];
  const code = randChoice(codes);
  const p1 = String(randInt(100, 999));
  const p2 = String(randInt(10, 99));
  const p3 = String(randInt(10, 99));
  return `+998 ${code} ${p1} ${p2} ${p3}`;
}

function makeTrackingCode(year: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[randInt(0, chars.length - 1)];
  return `MRJ-${year}-${code}`;
}

function pickDifferentCategory(base: string): string {
  const cats = Object.keys(CATEGORIES_MAPPING).filter(c => c !== base);
  return randChoice(cats);
}

function pickPriority(): "high" | "medium" | "low" {
  return weightedPick([
    { value: "high" as const, weight: 20 },
    { value: "medium" as const, weight: 55 },
    { value: "low" as const, weight: 25 }
  ]);
}

function pickClassificationSource(): "ai_accepted" | "ai_overridden" | "user_selected" | "fallback" {
  return weightedPick([
    { value: "ai_accepted" as const, weight: 78 },
    { value: "ai_overridden" as const, weight: 9 },
    { value: "user_selected" as const, weight: 8 },
    { value: "fallback" as const, weight: 5 }
  ]);
}

function pickRatingStars(): number {
  return weightedPick([
    { value: 5, weight: 45 },
    { value: 4, weight: 30 },
    { value: 3, weight: 15 },
    { value: 2, weight: 10 }
  ]);
}

function pickAssignedTo(agencyId: number): { id: number; full_name: string } | null {
  const staff = adminUsers.filter(u => u.agency.id === agencyId && (u.role === "operator" || u.role === "agency_admin"));
  if (staff.length === 0) return null;
  const chosen = randChoice(staff);
  return { id: chosen.id, full_name: chosen.full_name };
}

function generateComplaintText(): { text: string; category: string; mahalla: string; tuman: string; street: string; houseNo: number } {
  const group = randChoice(TEMPLATES);
  const raw = randChoice(group.texts);
  const street = randChoice(STREET_NAMES);
  const pair = randChoice(MAHALLA_TUMAN_PAIRS);
  const houseNo = randInt(1, 130);

  let text = raw.replace(/\{street\}/g, street).replace(/\{mahalla\}/g, pair.mahalla);

  if (Math.random() < 0.75) {
    const name = randChoice(NAMES);
    const phone = makePhone();
    const sig = randChoice(SIGNATURE_TEMPLATES).replace("{name}", name).replace("{phone}", phone);
    text += sig;
  }

  const derived = classifyByKeywords(text).category;
  if (derived !== group.category) {
    console.warn(`[seed] template/category mismatch: expected ${group.category}, classifier says ${derived}: "${text}"`);
  }

  return { text, category: derived, mahalla: pair.mahalla, tuman: pair.tuman, street, houseNo };
}

function buildTimeline(
  createdAt: Date,
  status: string,
  resolvedAt: Date | null,
  assignedTo: { id: number; full_name: string } | null,
  agencyName: string,
  rating: number | null
): any[] {
  const entries: any[] = [];
  entries.push({ label: "Murojaat qabul qilindi", note: "Tizim tomonidan avtomatik ro'yxatga olindi", time: createdAt.toISOString(), is_internal: false, actor_name: "Tizim" });
  entries.push({ label: "Murojaat yo'naltirildi", note: `${agencyName}ga ko'rib chiqish uchun yuborildi`, time: new Date(createdAt.getTime() + 30 * 60000).toISOString(), is_internal: false, actor_name: "Tizim" });

  if (status === "new") return entries;

  const reviewTime = new Date(createdAt.getTime() + randInt(1, 2) * 24 * 60 * 60 * 1000);
  entries.push({ label: "Ko'rib chiqish boshlandi", note: "Mas'ul xodim tomonidan o'rganilmoqda", time: reviewTime.toISOString(), is_internal: Math.random() < 0.3, actor_name: assignedTo?.full_name || "Mas'ul xodim" });

  if (status === "reviewing") return entries;

  let lastTime = reviewTime;
  if (assignedTo) {
    const assignTime = new Date(reviewTime.getTime() + randInt(1, 2) * 24 * 60 * 60 * 1000);
    entries.push({ label: "Mas'ul tayinlandi", note: `Murojaat ${assignedTo.full_name}ga ijro uchun biriktirildi`, time: assignTime.toISOString(), is_internal: true, actor_name: assignedTo.full_name });
    lastTime = assignTime;
  }

  const progressTime = new Date(lastTime.getTime() + randInt(1, 3) * 24 * 60 * 60 * 1000);
  entries.push({ label: "Ishlar boshlandi", note: "Ijro jarayoni boshlandi", time: progressTime.toISOString(), is_internal: false, actor_name: assignedTo?.full_name || "Mas'ul xodim" });

  if (status === "in_progress") return entries;

  const doneTime = resolvedAt || NOW;
  entries.push({ label: "Murojaat yakunlandi", note: "Muammo hal qilindi", time: doneTime.toISOString(), is_internal: false, actor_name: assignedTo?.full_name || "Mas'ul xodim" });

  if (rating !== null) {
    entries.push({ label: "Sifat baholandi", note: `Foydalanuvchi xizmat sifatini ${rating} yulduz bilan baholadi`, time: new Date(doneTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), is_internal: false, actor_name: "Fuqaro" });
  }

  return entries;
}

function buildAppeal(id: number, status: "new" | "reviewing" | "in_progress" | "done", opts?: { forceOverdue?: boolean }): { appeal: any; timeline: any[] } {
  const { text, category, mahalla, tuman, street, houseNo } = generateComplaintText();
  const mapping = CATEGORIES_MAPPING[category];
  const agencyObj = AGENCIES.find(a => a.id === mapping.agencyId) || AGENCIES[0];

  const priority = pickPriority();
  const source = pickClassificationSource();

  let aiSuggestedCategory = category;
  let confidence: number;
  switch (source) {
    case "ai_accepted":
      confidence = randFloat(0.85, 0.99);
      break;
    case "ai_overridden":
      aiSuggestedCategory = pickDifferentCategory(category);
      confidence = randFloat(0.45, 0.75);
      break;
    case "user_selected":
      confidence = randFloat(0.5, 0.8);
      break;
    default: // fallback
      confidence = randFloat(0.3, 0.5);
  }

  const maxDaysAgo = status === "new" ? 20 : status === "reviewing" ? 45 : status === "in_progress" ? 90 : 180;
  const daysAgo = opts?.forceOverdue ? randInt(25, 60) : recentDaysAgo(maxDaysAgo);
  const createdAt = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  createdAt.setHours(randInt(7, 20), randInt(0, 59), 0, 0);

  const deadline = new Date(createdAt.getTime() + PRIORITY_DAYS[priority] * 24 * 60 * 60 * 1000);

  let isOverdue = status !== "done" && deadline.getTime() < NOW.getTime();
  if (opts?.forceOverdue && !isOverdue) {
    deadline.setTime(NOW.getTime() - randInt(1, 5) * 24 * 60 * 60 * 1000);
    isOverdue = true;
  } else if (!opts?.forceOverdue && isOverdue) {
    // Only the ~12 explicitly forced appeals should read as overdue. An older
    // open appeal whose original priority window has lapsed reads as having
    // been extended/reprioritised rather than silently breached.
    deadline.setTime(NOW.getTime() + randInt(1, 10) * 24 * 60 * 60 * 1000);
    isOverdue = false;
  }

  let resolvedAt: Date | null = null;
  if (status === "done") {
    // Weighted around the SLA deadline itself (not the full creation-to-now
    // window) so most done appeals resolve on time and only a minority breach —
    // otherwise anything created long ago would almost always look "late" purely
    // from having a wide window to pick a random resolution day from.
    const target = PRIORITY_DAYS[priority];
    const resolveDays = Math.random() < 0.8
      ? randInt(1, Math.max(1, target))
      : target + randInt(1, 10);
    resolvedAt = new Date(createdAt.getTime() + resolveDays * 24 * 60 * 60 * 1000);
    if (resolvedAt.getTime() > NOW.getTime()) resolvedAt = new Date(NOW.getTime());
  }

  let slaStatus: "on_track" | "at_risk" | "breached";
  if (status === "done") {
    slaStatus = resolvedAt! > deadline ? "breached" : "on_track";
  } else if (isOverdue) {
    slaStatus = "breached";
  } else {
    const remaining = deadline.getTime() - NOW.getTime();
    const total = Math.max(1, deadline.getTime() - createdAt.getTime());
    slaStatus = (remaining / total) < 0.2 ? "at_risk" : "on_track";
  }

  const assignedTo = status !== "new" && Math.random() < 0.6 ? pickAssignedTo(agencyObj.id) : null;
  const internalNotesCount = assignedTo && Math.random() < 0.4 ? randInt(1, 3) : 0;
  const cosignCount = Math.random() < 0.25 ? randInt(1, 3) : 0;
  const ratingStars = status === "done" && Math.random() < 0.7 ? pickRatingStars() : null;

  const appeal = {
    id,
    tracking_code: makeTrackingCode(createdAt.getFullYear()),
    text,
    summary: text.length > 50 ? text.substring(0, 47) + "..." : text,
    category,
    category_label: mapping.label,
    agency: agencyObj,
    priority,
    priority_label: PRIORITY_LABELS[priority],
    status,
    status_label: STATUS_LABELS[status],
    classification_source: source,
    ai_suggested_category: aiSuggestedCategory,
    ai_confidence: Number(confidence.toFixed(2)),
    cosign_count: cosignCount,
    has_cosigned: false,
    can_cosign: status !== "done",
    escalated_at: null,
    rating_stars: ratingStars,
    photo_base64: null,
    is_overdue: isOverdue,
    sla_status: slaStatus,
    assigned_to: assignedTo,
    internal_notes_count: internalNotesCount,
    reassigned_from: null,
    location: {
      viloyat: "Xorazm viloyati",
      tuman,
      mahalla,
      address_detail: `${street} ko'chasi ${houseNo}-uy`
    },
    created_at: createdAt.toISOString(),
    deadline_at: deadline.toISOString()
  };

  const timeline = buildTimeline(createdAt, status, resolvedAt, assignedTo, agencyObj.name, ratingStars);

  return { appeal, timeline };
}

function buildCentrepiece(id: number): { appeal: any; timeline: any[] } {
  const category = "street_lighting";
  const mapping = CATEGORIES_MAPPING[category];
  const agencyObj = AGENCIES.find(a => a.id === mapping.agencyId)!;

  const text = "Urganch shahri Al-Xorazmiy ko'chasida uchta ko'cha chirog'i yonmayapti, kechasi juda qorong'u va xavfli bo'lyapti. Murojaatchi: Aziz Karimov, aloqa uchun telefon: +998 93 162 67 78.";

  const createdAt = new Date(NOW.getTime() - 18 * 24 * 60 * 60 * 1000);
  createdAt.setHours(8, 30, 0, 0);

  const priority = "high";
  const deadline = new Date(createdAt.getTime() + PRIORITY_DAYS[priority] * 24 * 60 * 60 * 1000);
  const isOverdue = deadline.getTime() < NOW.getTime();
  const assignedTo = { id: 3, full_name: "Nilufar Qosimova" };
  const escalatedAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  const appeal = {
    id,
    tracking_code: makeTrackingCode(createdAt.getFullYear()),
    text,
    summary: "Ko'cha chiroqlari yonmayapti",
    category,
    category_label: mapping.label,
    agency: agencyObj,
    priority,
    priority_label: "Yuqori (Nazoratda)",
    status: "in_progress",
    status_label: STATUS_LABELS.in_progress,
    classification_source: "ai_accepted",
    ai_suggested_category: category,
    ai_confidence: 0.94,
    cosign_count: 14,
    has_cosigned: false,
    can_cosign: false,
    escalated_at: escalatedAt.toISOString(),
    rating_stars: null,
    photo_base64: null,
    is_overdue: isOverdue,
    sla_status: isOverdue ? "breached" : "at_risk",
    assigned_to: assignedTo,
    internal_notes_count: 2,
    reassigned_from: null,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Urganch shahri",
      mahalla: "Al-Xorazmiy MFY",
      address_detail: "Al-Xorazmiy ko'chasi 14-uy oldida"
    },
    created_at: createdAt.toISOString(),
    deadline_at: deadline.toISOString()
  };

  const timeline = [
    { label: "Murojaat qabul qilindi", note: "Tizim tomonidan avtomatik ro'yxatga olindi", time: createdAt.toISOString(), is_internal: false, actor_name: "Tizim" },
    { label: "Murojaat yo'naltirildi", note: "Kommunal xizmat boshqarmasiga jo'natildi", time: new Date(createdAt.getTime() + 30 * 60000).toISOString(), is_internal: false, actor_name: "Tizim" },
    { label: "Ko'rib chiqish boshlandi", note: "Mas'ul xodim biriktirildi va o'rganilmoqda", time: new Date(createdAt.getTime() + 24 * 60 * 60000).toISOString(), is_internal: false, actor_name: "Nilufar Qosimova" },
    { label: "Mas'ul tayinlandi", note: "Murojaat Nilufar Qosimovaga ijro uchun biriktirildi", time: new Date(createdAt.getTime() + 25 * 60 * 60000).toISOString(), is_internal: true, actor_name: "Bekzod Yusupov" },
    { label: "Avtomatik eskalatsiya", note: "Mahalla aholisidan 14 ta ovoz to'plangani sababli, murojaat Yuqori darajaga ko'tarildi va nazoratga olindi", time: escalatedAt.toISOString(), is_internal: false, actor_name: "Tizim" }
  ];

  return { appeal, timeline };
}

function buildCosignedExtra(id: number, status: "new" | "reviewing" | "in_progress"): { appeal: any; timeline: any[] } {
  const built = buildAppeal(id, status);
  built.appeal.cosign_count = randInt(3, 5);
  return built;
}

function buildAuditLogs(appeals: any[], timelines: { [id: number]: any[] }): any[] {
  type Candidate = { actor_name: string; actor_role: string; action: string; target_type: string; target_id: string; detail: string; created_at: string };
  const candidates: Candidate[] = [];

  appeals.forEach(a => {
    const tl = timelines[a.id] || [];
    tl.forEach((entry: any) => {
      if (entry.is_internal) {
        const staff = adminUsers.find(u => u.full_name === entry.actor_name);
        candidates.push({
          actor_name: entry.actor_name,
          actor_role: staff?.role || "operator",
          action: entry.label.includes("tayinlandi") ? "assign" : "update_status",
          target_type: "appeal",
          target_id: String(a.id),
          detail: entry.note,
          created_at: entry.time
        });
      }
    });
  });

  adminUsers.forEach(u => {
    candidates.push({
      actor_name: u.full_name,
      actor_role: u.role,
      action: "login",
      target_type: "auth",
      target_id: String(u.id),
      detail: "Tizimga muvaffaqiyatli kirildi",
      created_at: u.last_login_at
    });
  });

  const picked = shuffle(candidates).slice(0, 60);
  picked.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return picked.map((c, idx) => ({ id: idx + 1, ...c }));
}

function buildSeedData() {
  const timelines: { [id: number]: any[] } = {};

  const centre = buildCentrepiece(1001);
  timelines[1001] = centre.timeline;

  const extra1 = buildCosignedExtra(1002, "new");
  const extra2 = buildCosignedExtra(1003, "reviewing");
  const extra3 = buildCosignedExtra(1004, "in_progress");
  timelines[1002] = extra1.timeline;
  timelines[1003] = extra2.timeline;
  timelines[1004] = extra3.timeline;

  // Remaining counts after the 4 hand-placed narrative appeals, so totals land
  // exactly on 120 new / 68 reviewing / 45 in_progress / 89 done = 322 overall.
  const bulkCounts: { status: "new" | "reviewing" | "in_progress" | "done"; count: number }[] = [
    { status: "new", count: 119 },
    { status: "reviewing", count: 67 },
    { status: "in_progress", count: 43 },
    { status: "done", count: 89 }
  ];

  // Non-done bulk ids run 1005..1233 (229 ids) — pick exactly 12 of them to be
  // forced overdue/breached.
  const nonDoneIds: number[] = [];
  let cursor = 1005;
  bulkCounts.forEach(b => {
    if (b.status !== "done") {
      for (let i = 0; i < b.count; i++) nonDoneIds.push(cursor + i);
    }
    cursor += b.count;
  });
  const forcedOverdueIds = new Set(shuffle(nonDoneIds).slice(0, 12));

  const bulkAppeals: any[] = [];
  let id = 1005;
  bulkCounts.forEach(b => {
    for (let i = 0; i < b.count; i++) {
      const { appeal, timeline } = buildAppeal(id, b.status, { forceOverdue: forcedOverdueIds.has(id) });
      bulkAppeals.push(appeal);
      timelines[id] = timeline;
      id++;
    }
  });

  let appeals = [centre.appeal, extra1.appeal, extra2.appeal, extra3.appeal, ...bulkAppeals];
  appeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const auditLogs = buildAuditLogs(appeals, timelines);

  return { appealsList: appeals, TIMELINES: timelines, auditLogs };
}

const generated = buildSeedData();

export const appealsList = generated.appealsList;
export const TIMELINES = generated.TIMELINES;
export const auditLogs = generated.auditLogs;
