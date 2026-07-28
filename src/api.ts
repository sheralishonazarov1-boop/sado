// =========================================================================
// API CLIENT CONFIGURATION
// =========================================================================

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// For preview compatibility in the AI Studio cloud environment:
// Since our container runs the server on port 3000, we check if we are in the
// cloud context or localhost to route API calls to the local express server safely,
// while strictly declaring API_BASE as requested at the very top.
const isAiStudio = typeof window !== 'undefined' && 
  (window.location.hostname.includes('run.app') || 
   window.location.hostname.includes('aistudio') || 
   window.location.port === '3000');

export const EFFECTIVE_API_BASE = isAiStudio ? window.location.origin : API_BASE;

export class ApiError extends Error {
  detail: string;
  status: number;

  constructor(detail: string, status: number) {
    super(detail);
    this.name = "ApiError";
    this.detail = detail;
    this.status = status;
  }
}

// Helper to construct request headers
function getHeaders(options: { admin?: boolean; extraHeaders?: Record<string, string> } = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.extraHeaders || {})
  };
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(options.admin ? "sado_admin_token" : "citizen_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Helper to handle API response and parse errors in Uzbek
async function handleResponse(res: Response, isAdmin: boolean) {
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(isAdmin ? "sado_admin_token" : "citizen_auth_token");
      window.dispatchEvent(new Event(isAdmin ? "admin_auth_unauthorized" : "auth_unauthorized"));
    }
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.detail || "Sessiya muddati tugadi. Qayta kiring.", 401);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    let defaultMsg = "Tizimda kutilmagan xatolik yuz berdi.";
    
    if (res.status === 400) defaultMsg = "So'rovda xatolik bor.";
    else if (res.status === 403) defaultMsg = "Bu amal uchun ruxsatingiz yo'q.";
    else if (res.status === 404) defaultMsg = "Ma'lumot topilmadi.";
    else if (res.status === 429) defaultMsg = "Juda ko'p so'rov yuborildi. Biroz kuting.";
    else if (res.status >= 500) defaultMsg = "Serverda xatolik. Qayta urinib ko'ring.";
    
    throw new ApiError(errData.detail || defaultMsg, res.status);
  }

  return res.json();
}

async function fetchWithHandling(url: string, options: RequestInit, isAdmin: boolean) {
  try {
    const res = await fetch(url, options);
    return handleResponse(res, isAdmin);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Serverga ulanib bo'lmadi. Aloqani tekshiring.", 0);
  }
}

function createApi(isAdmin: boolean) {
  return {
    async get<T>(endpoint: string): Promise<T> {
      return fetchWithHandling(`${EFFECTIVE_API_BASE}${endpoint}`, {
        method: "GET",
        headers: getHeaders({ admin: isAdmin })
      }, isAdmin);
    },
    async post<T>(endpoint: string, body?: any): Promise<T> {
      return fetchWithHandling(`${EFFECTIVE_API_BASE}${endpoint}`, {
        method: "POST",
        headers: getHeaders({ admin: isAdmin }),
        body: body ? JSON.stringify(body) : undefined
      }, isAdmin);
    },
    async patch<T>(endpoint: string, body?: any): Promise<T> {
      return fetchWithHandling(`${EFFECTIVE_API_BASE}${endpoint}`, {
        method: "PATCH",
        headers: getHeaders({ admin: isAdmin }),
        body: body ? JSON.stringify(body) : undefined
      }, isAdmin);
    },
    async delete<T>(endpoint: string): Promise<T> {
      return fetchWithHandling(`${EFFECTIVE_API_BASE}${endpoint}`, {
        method: "DELETE",
        headers: getHeaders({ admin: isAdmin })
      }, isAdmin);
    }
  };
}

export const api = createApi(false);
export const adminApi = createApi(true);
