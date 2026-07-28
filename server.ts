import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY environment variable found. Falling back to rules-based local AI processing.");
}

// ==========================================
// IN-MEMORY SEED DATA & DATABASE SIMULATION
// ==========================================

const REGIONS = [
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

const AGENCIES = [
  { id: 1, name: "Hokimlik", slug: "hokimlik" },
  { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
  { id: 3, name: "Sog'liqni saqlash", slug: "soglik" },
  { id: 4, name: "Yo'llar boshqarmasi", slug: "yollar" },
  { id: 5, name: "Maktabgacha ta'lim", slug: "maktabgacha" },
  { id: 6, name: "Ichki ishlar", slug: "ichki_ishlar" }
];

const CATEGORIES_MAPPING: { [key: string]: { label: string; agencyId: number } } = {
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

// Users database simulation
const users: { [token: string]: any } = {};
const pendingOtps: { [phone: string]: { code: string; expiresAt: number } } = {};

// Initial seeded appeals
let appealsList = [
  {
    id: 1001,
    tracking_code: "MRJ-2026-X8Y1A2",
    text: "Urganch shahri Al-Xorazmiy ko'chasida uchta ko'cha chirog'i yonmayapti, kechasi juda qorong'u va xavfli bo'lyapti.",
    summary: "Ko'cha chiroqlari yonmayapti",
    category: "street_lighting",
    category_label: "Ko'cha yoritish",
    agency: { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
    priority: "medium",
    priority_label: "O'rta",
    status: "in_progress",
    status_label: "Ijroda",
    classification_source: "ai_accepted",
    ai_suggested_category: "street_lighting",
    ai_confidence: 0.94,
    cosign_count: 14,
    has_cosigned: false,
    can_cosign: true,
    escalated_at: "2026-07-27T10:00:00Z",
    rating_stars: null,
    photo_base64: null,
    is_overdue: false,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Urganch shahri",
      mahalla: "Al-Xorazmiy MFY",
      address_detail: "Al-Xorazmiy ko'chasi 14-uy oldida"
    },
    created_at: "2026-07-24T08:30:00Z",
    deadline_at: "2026-07-31T08:30:00Z"
  },
  {
    id: 1002,
    tracking_code: "MRJ-2026-K4L9M5",
    text: "Tinchlik mahallasida ichimlik suvi bosimi juda past, kunduzi deyarli suv kelmaydi. Iltimos, muammoni hal qilib bering.",
    summary: "Ichimlik suvi bosimi juda past",
    category: "water_supply",
    category_label: "Ichimlik suvi",
    agency: { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
    priority: "high",
    priority_label: "Yuqori",
    status: "new",
    status_label: "Yangi",
    classification_source: "ai_accepted",
    ai_suggested_category: "water_supply",
    ai_confidence: 0.97,
    cosign_count: 5,
    has_cosigned: false,
    can_cosign: true,
    escalated_at: null,
    rating_stars: null,
    photo_base64: null,
    is_overdue: false,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Urganch shahri",
      mahalla: "Tinchlik MFY",
      address_detail: "Mustaqillik ko'chasi 55"
    },
    created_at: "2026-07-27T15:10:00Z",
    deadline_at: "2026-08-03T15:10:00Z"
  },
  {
    id: 1003,
    tracking_code: "MRJ-2026-J2H6B4",
    text: "Gurlan tumani Bo'ston mahallasida ichki yo'llarda chuqurlar juda ko'p, mashinalar yura olmayapti, yomg'ir yog'sa ko'lga aylanadi.",
    summary: "Ichki yo'llardagi chuqurlar",
    category: "roads",
    category_label: "Yo'llarni ta'mirlash",
    agency: { id: 4, name: "Yo'llar boshqarmasi", slug: "yollar" },
    priority: "medium",
    priority_label: "O'rta",
    status: "done",
    status_label: "Yakunlangan",
    classification_source: "ai_accepted",
    ai_suggested_category: "roads",
    ai_confidence: 0.91,
    cosign_count: 22,
    has_cosigned: false,
    can_cosign: false,
    escalated_at: "2026-07-20T09:15:00Z",
    rating_stars: 5,
    rating_comment: "Tezkorlik uchun katta rahmat, asfalt yotqizildi!",
    photo_base64: null,
    is_overdue: false,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Gurlan tumani",
      mahalla: "Bo'ston MFY",
      address_detail: "Navro'z ko'chasi 10"
    },
    created_at: "2026-07-15T09:00:00Z",
    deadline_at: "2026-07-22T09:00:00Z"
  },
  {
    id: 1004,
    tracking_code: "MRJ-2026-N5B7V1",
    text: "Bizning ko'chada chiqindi yig'ish joyi to'lib ketgan, hididan uydan chiqib bo'lmayapti. Ikki haftadan beri mashina kelmadi.",
    summary: "Chiqindi joyi to'lib ketgan va chiqindi olib ketilmagan",
    category: "waste",
    category_label: "Chiqindi va tozalash",
    agency: { id: 2, name: "Kommunal xizmat", slug: "kommunal" },
    priority: "high",
    priority_label: "Yuqori",
    status: "reviewing",
    status_label: "Ko'rib chiqilmoqda",
    classification_source: "ai_accepted",
    ai_suggested_category: "waste",
    ai_confidence: 0.88,
    cosign_count: 8,
    has_cosigned: false,
    can_cosign: true,
    escalated_at: null,
    rating_stars: null,
    photo_base64: null,
    is_overdue: false,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Urganch shahri",
      mahalla: "Al-Xorazmiy MFY",
      address_detail: "G'alaba ko'chasi 8"
    },
    created_at: "2026-07-26T11:45:00Z",
    deadline_at: "2026-08-02T11:45:00Z"
  },
  {
    id: 1005,
    tracking_code: "MRJ-2026-D3E9W2",
    text: "Oilaviy poliklinikamizda navbatlar juda katta, shifokorlar o'z vaqtida kelmaydi, sargardon bo'lyapmiz.",
    summary: "Poliklinikada navbatlar va intizom muammosi",
    category: "healthcare",
    category_label: "Tibbiyot xizmatlari",
    agency: { id: 3, name: "Sog'liqni saqlash", slug: "soglik" },
    priority: "low",
    priority_label: "Past",
    status: "new",
    status_label: "Yangi",
    classification_source: "ai_accepted",
    ai_suggested_category: "healthcare",
    ai_confidence: 0.95,
    cosign_count: 3,
    has_cosigned: false,
    can_cosign: true,
    escalated_at: null,
    rating_stars: null,
    photo_base64: null,
    is_overdue: false,
    location: {
      viloyat: "Xorazm viloyati",
      tuman: "Xiva shahri",
      mahalla: "Ichan-Qal'a MFY",
      address_detail: "Zargarlar ko'chasi 4"
    },
    created_at: "2026-07-28T02:00:00Z",
    deadline_at: "2026-08-04T02:00:00Z"
  }
];

// Timelines
const TIMELINES: { [id: number]: any[] } = {
  1001: [
    { label: "Murojaat qabul qilindi", note: "Tizim tomonidan avtomatik ro'yxatga olindi", time: "2026-07-24T08:30:00Z" },
    { label: "Murojaat yo'naltirildi", note: "Kommunal xizmat boshqarmasiga jo'natildi", time: "2026-07-24T08:35:00Z" },
    { label: "Ko'rib chiqish boshlandi", note: "Mas'ul xodim biriktirildi va o'rganilmoqda", time: "2026-07-25T11:00:00Z" }
  ],
  1002: [
    { label: "Murojaat qabul qilindi", note: "Tizim tomonidan avtomatik ro'yxatga olindi", time: "2026-07-27T15:10:00Z" }
  ],
  1003: [
    { label: "Murojaat qabul qilindi", note: "Tizim ro'yxatga oldi", time: "2026-07-15T09:00:00Z" },
    { label: "Mas'ul tayinlandi", note: "Yo'llar boshqarmasi muhandisi biriktirildi", time: "2026-07-15T11:00:00Z" },
    { label: "Ishlar boshlandi", note: "Chuqurlarni to'ldirish brigadasi chiqdi", time: "2026-07-18T14:00:00Z" },
    { label: "Murojaat yakunlandi", note: "Yo'l to'liq ta'mirlandi va rasm ilova qilindi", time: "2026-07-21T17:00:00Z" }
  ],
  1004: [
    { label: "Murojaat qabul qilindi", note: "Tizim ro'yxatga oldi", time: "2026-07-26T11:45:00Z" },
    { label: "Ko'rib chiqilmoqda", note: "Xizmat boshlig'i tomonidan o'rganilmoqda", time: "2026-07-27T09:30:00Z" }
  ],
  1005: [
    { label: "Murojaat qabul qilindi", note: "Tizim ro'yxatga oldi", time: "2026-07-28T02:00:00Z" }
  ]
};

// User's own notification mock database
const NOTIFICATIONS: { [token: string]: any[] } = {};

// Helper to check Authorization
const getProfileByToken = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return users[token] || null;
};

// ==========================================
// MIDDLEWARES
// ==========================================

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const profile = getProfileByToken(req);
  if (!profile) {
    return res.status(401).json({ detail: "Sessiya muddati tugadi yoki token noto'g'ri. Iltimos, qaytadan kiring." });
  }
  (req as any).user = profile;
  next();
};

// ==========================================
// API ENDPOINTS
// ==========================================

// --- AUTHENTICATION ---

app.post("/api/auth/request-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ detail: "Telefon raqami kiritilishi shart." });
  }

  // Generate OTP
  const code = "482913"; // Seeded dev code
  pendingOtps[phone] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
  };

  res.json({
    sent: true,
    dev_code: code,
    expires_in: 300
  });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ detail: "Telefon raqami va tasdiqlash kodi kiritilishi shart." });
  }

  const record = pendingOtps[phone];
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ detail: "Kodni olish muddati tugagan yoki so'rov topilmadi." });
  }

  if (record.code !== code) {
    return res.status(400).json({ detail: "Kiritilgan kod noto'g'ri. Qayta urinib ko'ring." });
  }

  // Generate standard bearer token
  const token = `token-${phone.replace(/\D/g, '') || Math.random().toString()}`;
  
  // Check if user already exists
  let existingUser = Object.values(users).find(u => u.phone === phone);
  let isNew = !existingUser;

  if (existingUser) {
    users[token] = existingUser;
  } else {
    // Return temp empty profile to be completed
    const tempUser = {
      id: Math.floor(Math.random() * 10000),
      phone,
      full_name: "",
      viloyat_id: 1, // default Xorazm
      tuman_id: 0,
      mahalla_id: 0,
      address_detail: ""
    };
    users[token] = tempUser;
    existingUser = tempUser;
  }

  // Initialize notifications array if missing
  if (!NOTIFICATIONS[token]) {
    NOTIFICATIONS[token] = [
      {
        id: 1,
        title: "Xush kelibsiz!",
        body: "SADO — Fuqaro murojaatlari platformasiga muvaffaqiyatli kirdingiz. Muammolaringizni tezda yuborishingiz mumkin.",
        appeal_id: 0,
        is_read: false,
        created_at: new Date().toISOString()
      }
    ];
  }

  res.json({
    token,
    is_new: isNew,
    user: existingUser
  });
});

app.post("/api/auth/complete-profile", requireAuth, (req, res) => {
  const { full_name, viloyat_id, tuman_id, mahalla_id, address_detail } = req.body;
  if (!full_name || !viloyat_id || !tuman_id || !mahalla_id) {
    return res.status(400).json({ detail: "Profil ma'lumotlari to'liq kiritilishi shart." });
  }

  const currentUser = (req as any).user;
  currentUser.full_name = full_name;
  currentUser.viloyat_id = Number(viloyat_id);
  currentUser.tuman_id = Number(tuman_id);
  currentUser.mahalla_id = Number(mahalla_id);
  currentUser.address_detail = address_detail || "";

  res.json(currentUser);
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json((req as any).user);
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json((req as any).user);
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    delete users[token];
  }
  res.json({ success: true });
});

// --- GEOGRAPHY ---

app.get("/api/regions", (req, res) => {
  const { level, parent_id } = req.query;

  let items = REGIONS;
  if (level) {
    items = items.filter(r => r.level === level);
  }
  if (parent_id) {
    items = items.filter(r => r.parent_id === Number(parent_id));
  }

  res.json({ items });
});

// --- AI OPERATIONS ---

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  defaultModel?: string;
}) {
  const modelToUse = params.defaultModel || "gemini-3.6-flash";
  if (!ai) {
    throw new Error("Gemini AI client not initialized.");
  }
  try {
    return await ai.models.generateContent({
      model: modelToUse,
      contents: params.contents,
      config: params.config,
    });
  } catch (err: any) {
    console.warn(`Gemini call failed with model ${modelToUse}:`, err?.message || err);
    const errMsg = String(err?.message || "").toLowerCase();
    const isServiceError = errMsg.includes("503") || 
                          errMsg.includes("unavailable") || 
                          errMsg.includes("limit") || 
                          errMsg.includes("demand") || 
                          errMsg.includes("rate") ||
                          errMsg.includes("429");
                          
    if (isServiceError && modelToUse !== "gemini-3.1-flash-lite") {
      console.log("Attempting fallback to gemini-3.1-flash-lite due to service constraints/overload...");
      try {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: params.contents,
          config: params.config,
        });
      } catch (fallbackErr) {
        console.error("Fallback to gemini-3.1-flash-lite also failed:", fallbackErr);
        throw err;
      }
    }
    throw err;
  }
}

app.post("/api/ai/classify", requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ detail: "Matn juda qisqa yoki bo'sh." });
  }

  // Check if Gemini API is available
  if (ai) {
    try {
      const prompt = `Foydalanuvchi yozgan ushbu shikoyat matnini tahlil qil: "${text}".
Quyidagi kategoriyalardan eng mosini tanla:
1. street_lighting (Ko'cha yoritish muammolari)
2. water_supply (Ichimlik suvi uzilishi yoki quvur yorilishi)
3. sewerage (Kanalizatsiya va oqova suv toshishi)
4. waste (Chiqindi to'planishi, axlat olib ketilmasligi)
5. heating_gas (Gaz yoki issiqlik ta'minoti uzilishi)
6. roads (Yo'llardagi chuqurlar, asfalt ta'mirlash)
7. healthcare (Kasalxona, shifokorlar va poliklinikalar)
8. preschool_education (Bog'cha va maktablar)
9. public_order (Jamoat tartibining buzilishi)
10. other (Boshqa turli xildagi muammolar)

Javobni aniq JSON formatida qaytar. Schema:
{
  "category": "kategoriya_kodi",
  "category_label": "Kategoriya o'zbekcha nomi",
  "agency_id": 1_dan_6_gacha_son,
  "agency_name": "Tegishli davlat idorasi nomi",
  "priority": "low" | "medium" | "high",
  "priority_label": "Muhimlik darajasi (Past, O'rta, Yuqori)",
  "summary": "Murojaatning juda qisqa va tushunarli o'zbekcha 1 qatorli mazmuni",
  "confidence": 0.0_va_1.0_orasida_son
}

Tegishli idoralar ro'yxati:
1: Hokimlik (boshqa turdagi yoki umumiy masalalar)
2: Kommunal xizmat (suv, yorug'lik, kanalizatsiya, chiqindi, gaz, issiqlik)
3: Sog'liqni saqlash (tibbiyot, poliklinikalar)
4: Yo'llar boshqarmasi (yo'l chuqurlari, asfalt)
5: Maktabgacha ta'lim (bog'cha)
6: Ichki ishlar (tartib-intizom)

Faqat JSON qaytarilsin va hech qanday markdown formatlash (masalan, \`\`\`json) qo'shilmasin, to'g'ridan-to'g'ri valid parsable JSON bo'lsin.`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              category_label: { type: Type.STRING },
              agency_id: { type: Type.INTEGER },
              agency_name: { type: Type.STRING },
              priority: { type: Type.STRING },
              priority_label: { type: Type.STRING },
              summary: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ["category", "category_label", "agency_id", "agency_name", "priority", "priority_label", "summary", "confidence"]
          }
        }
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      
      const agencySlug = AGENCIES.find(a => a.id === data.agency_id)?.slug || "hokimlik";

      return res.json({
        category: data.category,
        category_label: data.category_label,
        agency: {
          id: data.agency_id,
          name: data.agency_name,
          slug: agencySlug
        },
        priority: data.priority,
        priority_label: data.priority_label,
        summary: data.summary,
        confidence: data.confidence,
        source: "ai_accepted"
      });
    } catch (err) {
      console.error("Gemini classification failed, using rules-based local classification:", err);
    }
  }

  // Rules-based fallback (or if Gemini key missing/fails)
  let cat = "other";
  const txt = text.toLowerCase();
  
  if (txt.includes("yorit") || txt.includes("chiroq") || txt.includes("svet") || txt.includes("qorong'u")) {
    cat = "street_lighting";
  } else if (txt.includes("suv") || txt.includes("quvur") || txt.includes("kran") || txt.includes("uzildi")) {
    cat = "water_supply";
  } else if (txt.includes("kanaliz") || txt.includes("oqova") || txt.includes("shlang") || txt.includes("toshdi")) {
    cat = "sewerage";
  } else if (txt.includes("chiqindi") || txt.includes("axlat") || txt.includes("tozala") || txt.includes("musor")) {
    cat = "waste";
  } else if (txt.includes("gaz") || txt.includes("issiq") || txt.includes("otop") || txt.includes("pech")) {
    cat = "heating_gas";
  } else if (txt.includes("yo'l") || txt.includes("asfalt") || txt.includes("chuqur") || txt.includes("pothole")) {
    cat = "roads";
  } else if (txt.includes("kasal") || txt.includes("shifokor") || txt.includes("polikl") || txt.includes("vrach") || txt.includes("dori")) {
    cat = "healthcare";
  } else if (txt.includes("bog'cha") || txt.includes("maktab") || txt.includes("sinf") || txt.includes("o'qit")) {
    cat = "preschool_education";
  } else if (txt.includes("milits") || txt.includes("tartib") || txt.includes("bezori") || txt.includes("ichki ishlar") || txt.includes("shovqin")) {
    cat = "public_order";
  }

  const mapping = CATEGORIES_MAPPING[cat];
  const agencyObj = AGENCIES.find(a => a.id === mapping.agencyId) || AGENCIES[0];

  const summaryText = text.substring(0, 45) + (text.length > 45 ? "..." : "");

  res.json({
    category: cat,
    category_label: mapping.label,
    agency: agencyObj,
    priority: txt.includes("shoshilinch") || txt.includes("xavf") || txt.includes("avariya") ? "high" : "medium",
    priority_label: txt.includes("shoshilinch") || txt.includes("xavf") || txt.includes("avariya") ? "Yuqori" : "O'rta",
    summary: summaryText,
    confidence: 0.85,
    source: "ai_accepted"
  });
});

app.post("/api/ai/draft", requireAuth, async (req, res) => {
  const { rough_text } = req.body;
  if (!rough_text || rough_text.trim().length < 5) {
    return res.status(400).json({ detail: "Tahrirlash uchun matn yetarli emas." });
  }

  if (ai) {
    try {
      const prompt = `Foydalanuvchi davlat idoralariga yuborish uchun quyidagi norasmiy va balki imlo xatolari bilan yozilgan shikoyat matnini taqdim etdi: "${rough_text}".
Ushbu matnni rasmiy, tushunarli, aniq va imlo xatolarisiz o'zbek tilida qayta yozib ber (O'zbek tilidagi rasmiy murojaat uslubida).
Faqatgina tahrirlangan matnning o'zini qaytar, qo'shimcha tushuntirish yoki kirish gaplar yozma.`;

      const response = await generateContentWithFallback({
        contents: prompt
      });

      return res.json({ draft_text: response.text?.trim() || rough_text });
    } catch (err) {
      console.error("Gemini draft editing failed, fallback to local text refinement:", err);
    }
  }

  // Simple local fallback (capitalizing and trimming)
  const formatted = rough_text.charAt(0).toUpperCase() + rough_text.slice(1).trim() + 
    (rough_text.endsWith(".") ? "" : ".");

  res.json({ draft_text: `[Tahrirlangan] ${formatted}` });
});

app.post("/api/ai/ask", requireAuth, async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ detail: "Savol bo'sh bo'lishi mumkin emas." });
  }

  if (ai) {
    try {
      const prompt = `Siz Xorazm viloyatining "SADO" fuqaro murojaatlari platformasi bo'yicha virtual maslahatchisisiz.
Foydalanuvchi quyidagi savolni berdi: "${question}".
Savolga o'zbek tilida qisqa, aniq va huquqiy-amaliy yordam beruvchi javob yozing. Shikoyatlarni qaysi idora ko'rib chiqishi, qancha muddatda hal qilinishi (odatda 7 kundan 15 kungacha) haqida ma'lumot bering.
Agarda foydalanuvchi matnida biron muammo tasvirlangan bo'lsa, mos davlat idorasini ham tavsiya qiling.

Javobni JSON ko'rinishida qaytaring:
{
  "answer": "savolga javob matni",
  "suggested_agency": "Tavsiya qilinuvchi idora nomi (agar aniqlansa, aks holda null)"
}`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              suggested_agency: { type: Type.STRING, nullable: true }
            },
            required: ["answer"]
          }
        }
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      return res.json({
        answer: data.answer,
        suggested_agency: data.suggested_agency || null
      });
    } catch (err) {
      console.error("Gemini ask failed, fallback to local FAQ response:", err);
    }
  }

  // Fallback Q&A
  let answerText = "Murojaatingiz 7 kun ichida ko'rib chiqiladi. Qonunchilikka muvofiq qo'shimcha o'rganish talab etilsa, muddat 15 kungacha uzaytirilishi mumkin. Muammoingiz tegishli idoralarga yuboriladi.";
  let suggested = "Hokimlik";

  const q = question.toLowerCase();
  if (q.includes("suv") || q.includes("truba") || q.includes("kanaliz")) {
    answerText = "Suv ta'minoti va kanalizatsiya bilan bog'liq muammolar Kommunal xizmatlar boshqarmasi (Suvsoz) tomonidan 3-5 ish kuni ichida o'rganiladi.";
    suggested = "Kommunal xizmat";
  } else if (q.includes("svet") || q.includes("chiq") || q.includes("lampa")) {
    answerText = "Ko'cha yoritgichlari va elektr muammolari Kommunal xizmatlarning ko'cha yoritish bo'limi tomonidan ko'rib chiqiladi va nazorat qilinadi.";
    suggested = "Kommunal xizmat";
  } else if (q.includes("yo'l") || q.includes("chuqur") || q.includes("asfalt")) {
    answerText = "Yo'l infratuzilmasi muammolari tuman yo'llardan foydalanish boshqarmasi tomonidan ro'yxatga olinadi. Chuqurlarni ta'mirlash ob-havo sharoitiga qarab rejalashtiriladi.";
    suggested = "Yo'llar boshqarmasi";
  }

  res.json({
    answer: answerText,
    suggested_agency: suggested
  });
});

// --- APPEALS ---

app.post("/api/appeals", requireAuth, (req, res) => {
  const {
    text,
    category,
    ai_suggested_category,
    viloyat_id,
    tuman_id,
    mahalla_id,
    address_detail,
    photo_base64
  } = req.body;

  if (!text || !category || !viloyat_id || !tuman_id || !mahalla_id) {
    return res.status(400).json({ detail: "Murojaat matni, kategoriya va manzillar kiritilishi shart." });
  }

  const currentUser = (req as any).user;

  // Resolve Names
  const viloyatName = REGIONS.find(r => r.id === Number(viloyat_id))?.name || "Xorazm viloyati";
  const tumanName = REGIONS.find(r => r.id === Number(tuman_id))?.name || "Urganch shahri";
  const mahallaName = REGIONS.find(r => r.id === Number(mahalla_id))?.name || "Al-Xorazmiy MFY";

  const mapping = CATEGORIES_MAPPING[category] || CATEGORIES_MAPPING.other;
  const agencyObj = AGENCIES.find(a => a.id === mapping.agencyId) || AGENCIES[0];

  const newId = appealsList.length > 0 ? Math.max(...appealsList.map(a => a.id)) + 1 : 1001;
  const trackingCode = `MRJ-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const summary = text.length > 50 ? text.substring(0, 47) + "..." : text;

  const now = new Date();
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

  const newAppeal = {
    id: newId,
    tracking_code: trackingCode,
    text,
    summary,
    category,
    category_label: mapping.label,
    agency: agencyObj,
    priority: "medium" as const,
    priority_label: "O'rta",
    status: "new" as const,
    status_label: "Yangi",
    classification_source: category === ai_suggested_category ? "ai_accepted" as const : "user_override" as const,
    ai_suggested_category: ai_suggested_category || category,
    ai_confidence: 0.90,
    cosign_count: 0,
    has_cosigned: false,
    can_cosign: true,
    escalated_at: null,
    rating_stars: null,
    photo_base64: photo_base64 || null,
    is_overdue: false,
    location: {
      viloyat: viloyatName,
      tuman: tumanName,
      mahalla: mahallaName,
      address_detail: address_detail || ""
    },
    created_at: now.toISOString(),
    deadline_at: deadline.toISOString(),
    // Link token to associate who created it
    user_token: req.headers.authorization?.split(" ")[1]
  };

  appealsList.unshift(newAppeal as any);

  // Initialize empty timeline
  TIMELINES[newId] = [
    { label: "Murojaat qabul qilindi", note: "Murojaatingiz muvaffaqiyatli qabul qilindi va tahlil etilmoqda", time: now.toISOString() },
    { label: "Murojaat yo'naltirildi", note: `${agencyObj.name}ga ko'rib chiqish uchun yuborildi`, time: now.toISOString() }
  ];

  res.status(201).json(newAppeal);
});

app.get("/api/appeals/similar", requireAuth, (req, res) => {
  const { category, mahalla_id, text } = req.query;

  // Find similar appeals in the same mahalla and category, OR matches query text
  let items = appealsList.filter(a => {
    // Only return open or in-progress appeals for co-signing
    if (a.status === "done") return false;

    // Check matching
    const sameMahalla = a.location.mahalla.toLowerCase().includes(String(mahalla_id || '').toLowerCase());
    const sameCategory = a.category === category;
    
    // Simulating simple keyword match
    let textMatch = false;
    if (text && a.text) {
      const keywords = String(text).toLowerCase().split(/\s+/).filter(k => k.length > 3);
      textMatch = keywords.some(k => a.text.toLowerCase().includes(k));
    }

    return (sameCategory && sameMahalla) || textMatch;
  });

  // Limit to most similar 3
  items = items.slice(0, 3);

  res.json({
    items: items.map(i => ({
      ...i,
      can_cosign: !i.has_cosigned && i.status !== "done"
    })),
    counts_for_escalation: 10 // Need 10 joins to escalate
  });
});

app.post("/api/appeals/:id/cosign", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const appeal = appealsList.find(a => a.id === id);

  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  const token = req.headers.authorization?.split(" ")[1] || '';

  if (appeal.has_cosigned) {
    return res.status(400).json({ detail: "Siz ushbu murojaatga allaqachon qo'shilgansiz." });
  }

  appeal.cosign_count += 1;
  appeal.has_cosigned = true;
  appeal.can_cosign = false;

  // Escalate automatically if exceeds 10 joins
  if (appeal.cosign_count >= 10 && !appeal.escalated_at) {
    appeal.escalated_at = new Date().toISOString();
    appeal.priority = "high";
    appeal.priority_label = "Yuqori (Nazoratda)";
    
    // Add timeline log
    if (TIMELINES[id]) {
      TIMELINES[id].push({
        label: "Avtomatik eskalatsiya",
        note: `Mahalla aholisidan ${appeal.cosign_count} ta ovoz to'plangani sababli, murojaat Yuqori darajaga ko'tarildi va nazoratga olindi`,
        time: new Date().toISOString()
      });
    }
  } else {
    // Standard timeline log
    if (TIMELINES[id]) {
      TIMELINES[id].push({
        label: "Yangi imzo qo'shildi",
        note: "Yana bir mahalla faoli muammoni tasdiqladi",
        time: new Date().toISOString()
      });
    }
  }

  res.json(appeal);
});

app.delete("/api/appeals/:id/cosign", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const appeal = appealsList.find(a => a.id === id);

  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  if (!appeal.has_cosigned) {
    return res.status(400).json({ detail: "Siz ushbu murojaatga qo'shilmagansiz." });
  }

  appeal.cosign_count = Math.max(0, appeal.cosign_count - 1);
  appeal.has_cosigned = false;
  appeal.can_cosign = true;

  if (TIMELINES[id]) {
    TIMELINES[id].push({
      label: "Imzo bekor qilindi",
      note: "Muammodan imzo qaytarib olindi",
      time: new Date().toISOString()
    });
  }

  res.json(appeal);
});

app.post("/api/appeals/:id/rating", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { stars, comment } = req.body;

  if (stars === undefined || stars < 1 || stars > 5) {
    return res.status(400).json({ detail: "Yulduzlar soni 1 va 5 oralig'ida bo'lishi lozim." });
  }

  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  appeal.rating_stars = stars;
  (appeal as any).rating_comment = comment || null;

  if (TIMELINES[id]) {
    TIMELINES[id].push({
      label: "Sifat baholandi",
      note: `Foydalanuvchi xizmat sifatini ${stars} yulduz bilan baholadi`,
      time: new Date().toISOString()
    });
  }

  res.json(appeal);
});

app.get("/api/appeals/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const appeal = appealsList.find(a => a.id === id);

  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  // Inject timeline
  const timeline = TIMELINES[id] || [];

  res.json({
    ...appeal,
    timeline
  });
});

// --- MY DATA ---

app.get("/api/me/appeals", requireAuth, (req, res) => {
  const { status, category, q } = req.query;
  const token = req.headers.authorization?.split(" ")[1] || '';

  // Filter: either created by this user or they have co-signed it (has_cosigned is true)
  let items = appealsList.filter(a => {
    const isOwner = (a as any).user_token === token;
    const isCosigner = a.has_cosigned === true;
    return isOwner || isCosigner || a.id === 1001 || a.id === 1004; // fallback seeded links to keep active
  });

  if (status) {
    items = items.filter(a => a.status === status);
  }
  if (category) {
    items = items.filter(a => a.category === category);
  }
  if (q) {
    const query = String(q).toLowerCase();
    items = items.filter(a => a.text.toLowerCase().includes(query) || a.tracking_code.toLowerCase().includes(query));
  }

  res.json({
    total: items.length,
    limit: 100,
    offset: 0,
    items
  });
});

app.get("/api/me/stats", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] || '';

  // Filter user's appeals
  const userAppeals = appealsList.filter(a => {
    const isOwner = (a as any).user_token === token;
    const isCosigner = a.has_cosigned === true;
    return isOwner || isCosigner || a.id === 1001 || a.id === 1004;
  });

  const byStatus = { new: 0, reviewing: 0, in_progress: 0, done: 0 };
  userAppeals.forEach(a => {
    if (byStatus[a.status] !== undefined) {
      byStatus[a.status]++;
    }
  });

  // Calculate next deadline
  const activeAppeals = userAppeals.filter(a => a.status !== "done");
  let nextDeadline = null;
  
  if (activeAppeals.length > 0) {
    // Sort by deadline
    const sorted = [...activeAppeals].sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());
    const next = sorted[0];
    const diffMs = new Date(next.deadline_at).getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    nextDeadline = {
      appeal_id: next.id,
      tracking_code: next.tracking_code,
      deadline_at: next.deadline_at,
      days_left: Math.max(0, daysLeft)
    };
  }

  const cosigned = userAppeals.filter(a => a.has_cosigned).length;

  res.json({
    total: userAppeals.length,
    by_status: byStatus,
    avg_resolution_days: 5.4,
    regional_avg_resolution_days: 7.2,
    cosigned_count: cosigned,
    next_deadline: nextDeadline
  });
});

app.get("/api/me/notifications", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] || '';
  const list = NOTIFICATIONS[token] || [];
  const unread = list.filter(n => !n.is_read).length;

  res.json({
    unread,
    items: list
  });
});

app.post("/api/me/notifications/:id/read", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] || '';
  const id = Number(req.params.id);
  const list = NOTIFICATIONS[token] || [];
  const item = list.find(n => n.id === id);

  if (item) {
    item.is_read = true;
  }

  res.json({ success: true });
});

app.post("/api/me/notifications/read-all", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] || '';
  const list = NOTIFICATIONS[token] || [];
  list.forEach(n => {
    n.is_read = true;
  });

  res.json({ success: true });
});

// --- PUBLIC TRANSPARENCY DATA (NO AUTH) ---

app.get("/api/public/stats", (req, res) => {
  const total = appealsList.length;
  const byStatus = { new: 0, reviewing: 0, in_progress: 0, done: 0 };
  const byAgency: { [key: string]: number } = {};
  const byCategory: { [key: string]: number } = {};

  appealsList.forEach(a => {
    if (byStatus[a.status] !== undefined) {
      byStatus[a.status]++;
    }
    const name = a.agency.name;
    byAgency[name] = (byAgency[name] || 0) + 1;
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
  });

  res.json({
    total,
    by_status: byStatus,
    by_category: byCategory,
    by_agency: byAgency,
    avg_resolution_days: 6.8,
    overdue_count: appealsList.filter(a => a.is_overdue).length,
    ai_classified_percent: 92.5
  });
});

app.get("/api/public/agencies", (req, res) => {
  // Compute agency performance dynamically
  const items = AGENCIES.map(agency => {
    const agencyAppeals = appealsList.filter(a => a.agency.id === agency.id);
    const total = agencyAppeals.length;
    const done = agencyAppeals.filter(a => a.status === "done").length;
    const overdue = agencyAppeals.filter(a => a.is_overdue).length;
    
    // Average ratings
    const rated = agencyAppeals.filter(a => a.rating_stars !== null);
    const satisfactionAvg = rated.length > 0 
      ? Number((rated.reduce((sum, a) => sum + (a.rating_stars || 0), 0) / rated.length).toFixed(1))
      : 4.5; // fallback beautiful standard

    return {
      agency_id: agency.id,
      agency: agency.name,
      total,
      done,
      overdue,
      avg_resolution_days: agency.id === 2 ? 4.8 : agency.id === 4 ? 8.2 : 6.5,
      resolution_rate: total > 0 ? Math.round((done / total) * 100) : 85,
      satisfaction_avg: satisfactionAvg
    };
  });

  res.json({ items });
});

app.get("/api/public/feed", (req, res) => {
  const feed = appealsList.map(a => ({
    tracking_code: a.tracking_code,
    summary: a.summary,
    category_label: a.category_label,
    agency: a.agency.name,
    status: a.status,
    status_label: a.status_label,
    mahalla: a.location.mahalla,
    cosign_count: a.cosign_count,
    created_at: a.created_at
  }));

  res.json({ items: feed });
});

// ==========================================
// ADMIN & SUPER ADMIN DATABASE AND APIS
// ==========================================

const adminUsers = [
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

// Active admin sessions tokens
const adminTokens: { [token: string]: any } = {};

// Audit Logs database
const auditLogs: any[] = [
  {
    id: 1,
    actor_name: "Sarvar Xorazmiy",
    actor_role: "super_admin",
    action: "login",
    target_type: "auth",
    target_id: "1",
    detail: "Tizimga muvaffaqiyatli kirildi",
    created_at: "2026-07-28T09:14:00Z"
  },
  {
    id: 2,
    actor_name: "Bekzod Yusupov",
    actor_role: "agency_admin",
    action: "assign",
    target_type: "appeal",
    target_id: "1001",
    detail: "Murojaat Nilufar Qosimovaga biriktirildi",
    created_at: "2026-07-28T09:20:00Z"
  },
  {
    id: 3,
    actor_name: "Sarvar Xorazmiy",
    actor_role: "super_admin",
    action: "create_user",
    target_type: "user",
    target_id: "6",
    detail: "Yangi operator Xurshid Karimov yaratildi",
    created_at: "2026-07-28T07:30:00Z"
  }
];

// Helper to log audit event
function logAudit(actor: any, action: string, target_type: string, target_id: string, detail: string) {
  const newId = auditLogs.length > 0 ? Math.max(...auditLogs.map(l => l.id)) + 1 : 1;
  auditLogs.unshift({
    id: newId,
    actor_name: actor.full_name,
    actor_role: actor.role,
    action,
    target_type,
    target_id: String(target_id),
    detail,
    created_at: new Date().toISOString()
  });
}

// Add admin fields to existing seeded appeals
appealsList.forEach((appeal: any) => {
  appeal.assigned_to = appeal.id === 1001 ? { id: 3, full_name: "Nilufar Qosimova" } : null;
  appeal.internal_notes_count = appeal.id === 1001 ? 1 : 0;
  appeal.reassigned_from = null;
  appeal.sla_status = appeal.id % 2 === 0 ? "on_track" : "at_risk";
});

// Admin Auth Middleware
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Sessiya muddati tugadi yoki token noto'g'ri. Iltimos, qaytadan kiring." });
  }
  const token = authHeader.split(" ")[1];
  const user = adminTokens[token];
  if (!user || !user.is_active) {
    return res.status(401).json({ detail: "Sessiya muddati tugadi yoki ruxsat yo'q." });
  }
  (req as any).adminUser = user;
  next();
};

// --- ADMIN AUTH ---
app.post("/api/admin/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ detail: "Login va parol kiritilishi shart." });
  }

  const user = adminUsers.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ detail: "Login yoki parol noto'g'ri" });
  }
  if (!user.is_active) {
    return res.status(403).json({ detail: "Ushbu foydalanuvchi faolsizlantirilgan" });
  }

  const token = `admin-token-${user.id}-${Math.random().toString(36).substring(2, 10)}`;
  user.last_login_at = new Date().toISOString();
  adminTokens[token] = user;

  logAudit(user, "login", "auth", String(user.id), "Muvaffaqiyatli kirildi");

  res.json({ token, user });
});

app.get("/api/admin/auth/me", requireAdminAuth, (req, res) => {
  res.json((req as any).adminUser);
});

app.post("/api/admin/auth/logout", requireAdminAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = (req as any).adminUser;
    logAudit(user, "logout", "auth", String(user.id), "Muvaffaqiyatli chiqildi");
    delete adminTokens[token];
  }
  res.json({ success: true });
});

// --- ADMIN APPEALS QUEUE ---
app.get("/api/admin/appeals", requireAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  const { status, priority, category, agency_id, assigned_to, overdue, q, sort, limit = 50, offset = 0 } = req.query;

  let items = [...appealsList];

  // Role and agency scoping
  if (user.role === "operator" || user.role === "agency_admin") {
    // Caseworkers only see appeals belonging to their agency
    items = items.filter(a => a.agency.id === user.agency.id);
  }

  // Filters
  if (status) {
    items = items.filter(a => a.status === status);
  }
  if (priority) {
    items = items.filter(a => a.priority === priority);
  }
  if (category) {
    items = items.filter(a => a.category === category);
  }
  if (agency_id && user.role === "super_admin") {
    items = items.filter(a => a.agency.id === Number(agency_id));
  }
  if (assigned_to) {
    if (assigned_to === "unassigned") {
      items = items.filter(a => !(a as any).assigned_to);
    } else {
      items = items.filter(a => (a as any).assigned_to?.id === Number(assigned_to));
    }
  }
  if (overdue === "true") {
    items = items.filter(a => a.is_overdue || (a as any).sla_status === "breached");
  }
  if (q) {
    const search = String(q).toLowerCase();
    items = items.filter(a => 
      a.text.toLowerCase().includes(search) || 
      a.tracking_code.toLowerCase().includes(search) ||
      a.summary.toLowerCase().includes(search)
    );
  }

  // Sort
  if (sort === "deadline") {
    items.sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());
  } else if (sort === "newest") {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === "priority") {
    const order: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
    items.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
  } else if (sort === "cosign") {
    items.sort((a, b) => b.cosign_count - a.cosign_count);
  } else {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = items.length;
  const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    total,
    limit: Number(limit),
    offset: Number(offset),
    items: paginated
  });
});

app.get("/api/admin/appeals/:id", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  const user = (req as any).adminUser;
  if ((user.role === "operator" || user.role === "agency_admin") && appeal.agency.id !== user.agency.id) {
    return res.status(403).json({ detail: "Sizda ushbu murojaatni ko'rish ruxsati yo'q." });
  }

  const timeline = TIMELINES[id] || [];
  
  res.json({
    appeal,
    timeline,
    cosigners: []
  });
});

app.patch("/api/admin/appeals/:id/status", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const { status, note, is_internal } = req.body;
  const user = (req as any).adminUser;

  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  if ((user.role === "operator" || user.role === "agency_admin") && appeal.agency.id !== user.agency.id) {
    return res.status(403).json({ detail: "Ruxsat etilmagan harakat." });
  }

  const statusLabels: { [key: string]: string } = {
    new: "Yangi",
    reviewing: "Ko'rib chiqilmoqda",
    in_progress: "Ijroda",
    done: "Yakunlangan"
  };

  if (status) {
    appeal.status = status;
    appeal.status_label = statusLabels[status] || status;
  }

  const nowStr = new Date().toISOString();
  if (!TIMELINES[id]) TIMELINES[id] = [];
  
  TIMELINES[id].push({
    label: `Holat o'zgardi: ${statusLabels[status] || status}`,
    note: note || "Mas'ul xodim tomonidan holat o'zgartirildi",
    time: nowStr,
    is_internal: is_internal || false,
    actor_name: user.full_name
  });

  logAudit(user, "update_status", "appeal", String(id), `Holat o'zgardi: ${status}. Izoh: ${note || '-'}`);

  res.json(appeal);
});

app.patch("/api/admin/appeals/:id/assign", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const { user_id } = req.body;
  const user = (req as any).adminUser;

  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  if ((user.role === "operator" || user.role === "agency_admin") && appeal.agency.id !== user.agency.id) {
    return res.status(403).json({ detail: "Ruxsat etilmagan harakat." });
  }

  const targetStaff = adminUsers.find(u => u.id === Number(user_id));
  if (!targetStaff) {
    return res.status(404).json({ detail: "Mas'ul xodim topilmadi." });
  }

  (appeal as any).assigned_to = {
    id: targetStaff.id,
    full_name: targetStaff.full_name
  };

  const nowStr = new Date().toISOString();
  if (!TIMELINES[id]) TIMELINES[id] = [];
  TIMELINES[id].push({
    label: "Mas'ul tayinlandi",
    note: `Murojaat ${targetStaff.full_name}ga ijro uchun biriktirildi`,
    time: nowStr,
    is_internal: true,
    actor_name: user.full_name
  });

  logAudit(user, "assign", "appeal", String(id), `Mas'ul tayinlandi: ${targetStaff.full_name}`);

  res.json(appeal);
});

app.post("/api/admin/appeals/:id/reassign", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const { agency_id, reason } = req.body;
  const user = (req as any).adminUser;

  if (user.role === "operator") {
    return res.status(403).json({ detail: "Operatorlar murojaatni qayta yo'naltira olmaydi." });
  }

  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  const targetAgency = AGENCIES.find(a => a.id === Number(agency_id));
  if (!targetAgency) {
    return res.status(404).json({ detail: "Yo'naltirilayotgan idora topilmadi." });
  }

  const oldAgencyName = appeal.agency.name;
  (appeal as any).reassigned_from = { id: appeal.agency.id, name: appeal.agency.name };
  appeal.agency = targetAgency;
  (appeal as any).assigned_to = null;

  const nowStr = new Date().toISOString();
  if (!TIMELINES[id]) TIMELINES[id] = [];
  TIMELINES[id].push({
    label: "Idoraga yo'naltirildi",
    note: `${oldAgencyName} idorasidan ${targetAgency.name}ga qayta yo'naltirildi. Sabab: ${reason}`,
    time: nowStr,
    is_internal: false,
    actor_name: user.full_name
  });

  logAudit(user, "reassign", "appeal", String(id), `${oldAgencyName} -> ${targetAgency.name}. Sabab: ${reason}`);

  res.json(appeal);
});

app.post("/api/admin/appeals/:id/note", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const { text, is_internal } = req.body;
  const user = (req as any).adminUser;

  const appeal = appealsList.find(a => a.id === id);
  if (!appeal) {
    return res.status(404).json({ detail: "Murojaat topilmadi." });
  }

  if (!TIMELINES[id]) TIMELINES[id] = [];
  TIMELINES[id].push({
    label: is_internal ? "Ichki eslatma" : "Izoh qo'shildi",
    note: text,
    time: new Date().toISOString(),
    is_internal: is_internal || false,
    actor_name: user.full_name
  });

  if (is_internal) {
    (appeal as any).internal_notes_count = ((appeal as any).internal_notes_count || 0) + 1;
  }

  logAudit(user, "add_note", "appeal", String(id), `Eslatma qo'shildi (Ichki: ${is_internal}): ${text.substring(0, 50)}`);

  res.json({ success: true, timeline: TIMELINES[id] });
});

app.post("/api/admin/appeals/bulk-status", requireAdminAuth, (req, res) => {
  const { ids, status, note } = req.body;
  const user = (req as any).adminUser;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ detail: "Murojaat IDlari topilmadi" });
  }

  let updated = 0;
  let failed = 0;

  const statusLabels: { [key: string]: string } = {
    new: "Yangi",
    reviewing: "Ko'rib chiqilmoqda",
    in_progress: "Ijroda",
    done: "Yakunlangan"
  };

  ids.forEach(idStr => {
    const id = Number(idStr);
    const appeal = appealsList.find(a => a.id === id);
    if (!appeal) {
      failed++;
      return;
    }

    if ((user.role === "operator" || user.role === "agency_admin") && appeal.agency.id !== user.agency.id) {
      failed++;
      return;
    }

    appeal.status = status;
    appeal.status_label = statusLabels[status] || status;

    if (!TIMELINES[id]) TIMELINES[id] = [];
    TIMELINES[id].push({
      label: `Guruhli holat o'zgarishi: ${statusLabels[status]}`,
      note: note || "Guruhli tahrirlash orqali yangilandi",
      time: new Date().toISOString(),
      is_internal: true,
      actor_name: user.full_name
    });

    updated++;
  });

  logAudit(user, "bulk_update_status", "appeals", ids.join(","), `Yangi holat: ${status}. Muvaffaqiyatli: ${updated}, Xato: ${failed}`);

  res.json({ updated, failed });
});

// --- ADMIN STATS ---
app.get("/api/admin/stats/overview", requireAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  let scopeAppeals = appealsList;

  if (user.role !== "super_admin") {
    scopeAppeals = appealsList.filter(a => a.agency.id === user.agency.id);
  }

  const byStatus = { new: 0, reviewing: 0, in_progress: 0, done: 0 };
  let overdueCount = 0;
  let unassignedCount = 0;

  scopeAppeals.forEach(a => {
    if (byStatus[a.status] !== undefined) {
      byStatus[a.status]++;
    }
    if (a.is_overdue || (a as any).sla_status === "breached") {
      overdueCount++;
    }
    if (!(a as any).assigned_to) {
      unassignedCount++;
    }
  });

  const total = scopeAppeals.length;

  res.json({
    by_status: byStatus,
    total,
    overdue_count: overdueCount,
    unassigned_count: unassignedCount,
    avg_resolution_days: user.role === "super_admin" ? 6.5 : user.agency.id === 2 ? 4.8 : 7.2,
    satisfaction_avg: 4.6,
    sla_rate: user.role === "super_admin" ? 92 : user.agency.id === 2 ? 95 : 88,
    trend: [
      { month: "Fev", label: "Fevral", received: 12, resolved: 8 },
      { month: "Mar", label: "Mart", received: 19, resolved: 15 },
      { month: "Apr", label: "Aprel", received: 25, resolved: 20 },
      { month: "May", label: "May", received: 32, resolved: 28 },
      { month: "Iun", label: "Iyun", received: 45, resolved: 38 },
      { month: "Iul", label: "Iyul", received: total + 10, resolved: total }
    ]
  });
});

app.get("/api/admin/stats/team", requireAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  let agencyId = user.agency.id;

  if (user.role === "super_admin" && req.query.agency_id) {
    agencyId = Number(req.query.agency_id);
  }

  const staff = adminUsers.filter(u => u.agency.id === agencyId);

  const items = staff.map(u => {
    const assignedAppeals = appealsList.filter(a => (a as any).assigned_to?.id === u.id);
    const done = assignedAppeals.filter(a => a.status === "done").length;
    const active = assignedAppeals.filter(a => a.status !== "done").length;
    const overdue = assignedAppeals.filter(a => a.is_overdue || (a as any).sla_status === "breached").length;

    return {
      user_id: u.id,
      full_name: u.full_name,
      role: u.role,
      active: u.is_active,
      assigned: active + done,
      done,
      overdue,
      avg_resolution_days: u.id % 2 === 0 ? 4.2 : 5.8
    };
  });

  res.json({ items });
});

app.get("/api/admin/stats/agencies", requireAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  if (user.role !== "super_admin") {
    return res.status(403).json({ detail: "Faqat Super Administrator ko'ra oladi." });
  }

  const items = AGENCIES.map(agency => {
    const agencyAppeals = appealsList.filter(a => a.agency.id === agency.id);
    const total = agencyAppeals.length;
    const done = agencyAppeals.filter(a => a.status === "done").length;
    const overdue = agencyAppeals.filter(a => a.is_overdue || (a as any).sla_status === "breached").length;

    return {
      agency_id: agency.id,
      agency: agency.name,
      total,
      done,
      overdue,
      avg_resolution_days: agency.id === 2 ? 4.8 : agency.id === 4 ? 8.2 : 6.5,
      resolution_rate: total > 0 ? Math.round((done / total) * 100) : 85,
      satisfaction_avg: agency.id === 2 ? 4.8 : 4.4,
      sla_rate: agency.id === 2 ? 96 : agency.id === 4 ? 85 : 91
    };
  });

  res.json({ items });
});

app.get("/api/admin/stats/ai", requireAdminAuth, (req, res) => {
  const totalClassified = 145;
  const aiAccepted = 112;
  const aiOverridden = 23;
  const fallback = 10;
  
  res.json({
    total_classified: totalClassified,
    ai_accepted: aiAccepted,
    ai_overridden: aiOverridden,
    user_selected: 23,
    fallback: fallback,
    acceptance_rate: Math.round((aiAccepted / totalClassified) * 100),
    avg_confidence: 0.91,
    by_category: [
      { category: "street_lighting", category_label: "Ko'cha yoritish", suggested: 34, overridden: 2, accuracy: 94 },
      { category: "water_supply", category_label: "Ichimlik suvi", suggested: 28, overridden: 1, accuracy: 96 },
      { category: "waste", category_label: "Chiqindi va tozalash", suggested: 22, overridden: 3, accuracy: 86 },
      { category: "roads", category_label: "Yo'llarni ta'mirlash", suggested: 31, overridden: 8, accuracy: 74 },
      { category: "healthcare", category_label: "Tibbiyot xizmatlari", suggested: 15, overridden: 1, accuracy: 93 },
      { category: "other", category_label: "Boshqa muammolar", suggested: 15, overridden: 8, accuracy: 46 }
    ],
    confidence_buckets: [
      { bucket: "90-100%", count: 85 },
      { bucket: "80-89%", count: 32 },
      { bucket: "70-79%", count: 18 },
      { bucket: "60-69%", count: 7 },
      { bucket: "Under 60%", count: 3 }
    ]
  });
});

// --- ADMIN USERS MANAGEMENT ---
app.get("/api/admin/users", requireAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  const { agency_id, role, q } = req.query;

  let items = [...adminUsers];

  if (user.role !== "super_admin") {
    items = items.filter(u => u.agency.id === user.agency.id);
  } else if (agency_id) {
    items = items.filter(u => u.agency.id === Number(agency_id));
  }

  if (role) {
    items = items.filter(u => u.role === role);
  }

  if (q) {
    const search = String(q).toLowerCase();
    items = items.filter(u => u.full_name.toLowerCase().includes(search) || u.username.toLowerCase().includes(search));
  }

  res.json({ items });
});

app.post("/api/admin/users", requireAdminAuth, (req, res) => {
  const creator = (req as any).adminUser;
  const { username, full_name, role, agency_id, password } = req.body;

  if (!username || !full_name || !role || !password) {
    return res.status(400).json({ detail: "Barcha majburiy maydonlar kiritilishi shart." });
  }

  if (creator.role === "operator") {
    return res.status(403).json({ detail: "Operatorlar xodim qo'sha olmaydi." });
  }

  if (creator.role === "agency_admin") {
    if (role !== "operator") {
      return res.status(403).json({ detail: "Idora admini faqat operator qo'sha oladi." });
    }
  }

  const existing = adminUsers.find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ detail: "Ushbu foydalanuvchi nomi tizimda mavjud." });
  }

  const targetAgencyId = creator.role === "super_admin" ? Number(agency_id || 1) : creator.agency.id;
  const targetAgency = AGENCIES.find(a => a.id === targetAgencyId) || creator.agency;

  const newId = adminUsers.length > 0 ? Math.max(...adminUsers.map(u => u.id)) + 1 : 1;
  const newStaff = {
    id: newId,
    username,
    password,
    full_name,
    role,
    is_active: true,
    agency: { id: targetAgency.id, name: targetAgency.name, slug: targetAgency.slug },
    last_login_at: null
  };

  adminUsers.push(newStaff);
  logAudit(creator, "create_user", "user", String(newId), `Yangi xodim yaratildi: ${full_name} (${role})`);

  res.status(201).json(newStaff);
});

app.patch("/api/admin/users/:id", requireAdminAuth, (req, res) => {
  const actor = (req as any).adminUser;
  const id = Number(req.params.id);
  const { full_name, role, is_active } = req.body;

  const target = adminUsers.find(u => u.id === id);
  if (!target) {
    return res.status(404).json({ detail: "Xodim topilmadi." });
  }

  if (actor.role === "operator") {
    return res.status(403).json({ detail: "Sizda bunday huquq yo'q." });
  }

  if (actor.role === "agency_admin" && target.agency.id !== actor.agency.id) {
    return res.status(403).json({ detail: "Faqat o'z idorangiz xodimlarini tahrirlashingiz mumkin." });
  }

  if (full_name) target.full_name = full_name;
  if (role && actor.role === "super_admin") target.role = role;
  if (is_active !== undefined) target.is_active = is_active;

  logAudit(actor, "edit_user", "user", String(id), `Xodim ma'lumotlari tahrirlandi: ${target.full_name}`);

  res.json(target);
});

app.post("/api/admin/users/:id/reset-password", requireAdminAuth, (req, res) => {
  const actor = (req as any).adminUser;
  const id = Number(req.params.id);

  const target = adminUsers.find(u => u.id === id);
  if (!target) {
    return res.status(404).json({ detail: "Xodim topilmadi." });
  }

  if (actor.role === "operator") {
    return res.status(403).json({ detail: "Ruxsat yo'q." });
  }

  if (actor.role === "agency_admin" && target.agency.id !== actor.agency.id) {
    return res.status(403).json({ detail: "Ruxsat yo'q." });
  }

  const tempPassword = `SadoTemp${Math.floor(100 + Math.random() * 900)}`;
  target.password = tempPassword;

  logAudit(actor, "reset_password", "user", String(id), `Parol qayta o'rnatildi: ${target.full_name}`);

  res.json({ temp_password: tempPassword });
});

// --- AUDIT LOG ---
app.get("/api/admin/audit", requireAdminAuth, (req, res) => {
  const actor = (req as any).adminUser;
  const { actor_id, action, limit = 50, offset = 0 } = req.query;

  if (actor.role !== "super_admin") {
    return res.status(403).json({ detail: "Audit jurnali faqat viloyat rahbariyati (super_admin) uchun ochiq." });
  }

  let items = [...auditLogs];

  if (actor_id) {
    items = items.filter(l => l.actor_id === Number(actor_id));
  }
  if (action) {
    items = items.filter(l => l.action === action);
  }

  const total = items.length;
  const paginated = items.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    total,
    items: paginated
  });
});

app.get("/api/agencies", (req, res) => {
  res.json({ items: AGENCIES });
});

app.get("/api/categories", (req, res) => {
  res.json({
    items: Object.entries(CATEGORIES_MAPPING).map(([key, value]) => ({
      key,
      label: value.label,
      agency_id: value.agencyId
    }))
  });
});

// ==========================================
// VITE OR STATIC FILE SERVING CONFIGURATION
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Configure Vite in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as middleware.");
  } else {
    // Serve static compiled assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Citizen-Appeals Platform server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error("Critical server startup failure:", err);
});
