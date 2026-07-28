export interface Region {
  id: number;
  name: string;
  level: 'viloyat' | 'tuman' | 'mahalla';
  parent_id?: number;
}

export interface Agency {
  id: number;
  name: string;
  slug: string;
}

export interface LocationInfo {
  viloyat: string;
  tuman: string;
  mahalla: string;
  address_detail: string;
}

export interface Appeal {
  id: number;
  tracking_code: string;
  text: string;
  summary: string;
  category: string;
  category_label: string;
  agency: Agency;
  priority: 'low' | 'medium' | 'high';
  priority_label: string;
  status: 'new' | 'reviewing' | 'in_progress' | 'done';
  status_label: string;
  classification_source: 'ai_accepted' | 'user_override';
  ai_suggested_category: string;
  ai_confidence: number;
  cosign_count: number;
  has_cosigned: boolean;
  can_cosign: boolean;
  escalated_at: string | null;
  rating_stars: number | null;
  rating_comment?: string | null;
  photo_base64: string | null;
  is_overdue: boolean;
  location: LocationInfo;
  created_at: string;
  deadline_at: string;
}

export interface PublicStats {
  total: number;
  by_status: {
    new: number;
    reviewing: number;
    in_progress: number;
    done: number;
  };
  by_category?: { [key: string]: number };
  by_agency: { [key: string]: number };
  avg_resolution_days: number;
  overdue_count: number;
  ai_classified_percent: number;
}

export interface AgencyPerformance {
  agency_id: number;
  agency: string;
  total: number;
  done: number;
  overdue: number;
  avg_resolution_days: number;
  resolution_rate: number; // 0 to 100
  satisfaction_avg: number; // 0 to 5
}

export interface PublicFeedItem {
  tracking_code: string;
  summary: string;
  category: string;
  category_label: string;
  agency: string;
  status: 'new' | 'reviewing' | 'in_progress' | 'done';
  status_label: string;
  mahalla: string;
  cosign_count: number;
  created_at: string;
}

export interface UserStats {
  total: number;
  by_status: {
    new: number;
    reviewing: number;
    in_progress: number;
    done: number;
  };
  avg_resolution_days: number;
  regional_avg_resolution_days: number;
  cosigned_count: number;
  next_deadline: {
    appeal_id: number;
    tracking_code: string;
    deadline_at: string;
    days_left: number;
  } | null;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  appeal_id: number;
  is_read: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  phone: string;
  full_name: string;
  viloyat_id: number;
  tuman_id: number;
  mahalla_id: number;
  address_detail: string;
}

// Category mappings with color classes (Tailwind CSS custom variable mappings or background tints)
export interface CategoryConfig {
  label: string;
  colorVar: string; // matches custom CSS vars e.g. '--cat-lighting'
  tintColor: string; // Hex color code for display/charts
  iconName: string;
}

export const CATEGORIES: { [key: string]: CategoryConfig } = {
  street_lighting: {
    label: "Ko'cha yoritish",
    colorVar: "var(--cat-lighting)",
    tintColor: "#FBBF24",
    iconName: "Sun"
  },
  water_supply: {
    label: "Ichimlik suvi",
    colorVar: "var(--cat-water)",
    tintColor: "#38BDF8",
    iconName: "Droplet"
  },
  sewerage: {
    label: "Kanalizatsiya",
    colorVar: "var(--cat-sewerage)",
    tintColor: "#6366F1",
    iconName: "Wind"
  },
  waste: {
    label: "Chiqindi va tozalash",
    colorVar: "var(--cat-waste)",
    tintColor: "#4ADE80",
    iconName: "Trash2"
  },
  heating_gas: {
    label: "Gaz va issiqlik",
    colorVar: "var(--cat-gas)",
    tintColor: "#FB923C",
    iconName: "Flame"
  },
  roads: {
    label: "Yo'llarni ta'mirlash",
    colorVar: "var(--cat-roads)",
    tintColor: "#94A3B8",
    iconName: "Construction"
  },
  healthcare: {
    label: "Tibbiyot xizmatlari",
    colorVar: "var(--cat-health)",
    tintColor: "#FB7185",
    iconName: "HeartPulse"
  },
  preschool_education: {
    label: "Bog'cha va maktab",
    colorVar: "var(--cat-school)",
    tintColor: "#C084FC",
    iconName: "GraduationCap"
  },
  public_order: {
    label: "Jamoat tartibi",
    colorVar: "var(--cat-order)",
    tintColor: "#60A5FA",
    iconName: "ShieldAlert"
  },
  other: {
    label: "Boshqa muammolar",
    colorVar: "var(--cat-other)",
    tintColor: "#78716C",
    iconName: "HelpCircle"
  }
};

export const STATUSES = {
  new: { label: "Yangi", color: "var(--st-new)" },
  reviewing: { label: "Ko'rib chiqilmoqda", color: "var(--st-reviewing)" },
  in_progress: { label: "Ijroda", color: "var(--st-progress)" },
  done: { label: "Yakunlangan", color: "var(--st-done)" }
};
