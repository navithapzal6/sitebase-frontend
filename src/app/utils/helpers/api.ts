const BASE_URL = "https://m4dgflgn-8080.inc1.devtunnels.ms/api/v1/".replace(/\/+$/, "")

const API_ENDPOINTS = {
  LOGIN: "login",
  REGISTER: "signup",
  LOGOUT: "logout",

  ADD_CLIENT: "clients",
  CLIENT_LIST: "clients_list",
  GET_CLIENT_BY_ID: "get-client-by-id",

  NEW_LEDGER: "new_ledger",
  LEDGER_LIST: "ledger_list",
  GET_LEDGER_BY_ID: "get-ledger-by-id",
  DELETE_LEDGER: "delete_ledger",

  NEW_MATERIAL: "new_material",
  MATERIAL_LIST: "materials_list",
  GET_MATERIAL_BY_ID: "get-material-by-id",

  ADD_EQUIPMENT: "new_equipment",
  EQUIPMENT_LIST: "equipment_list",

  ADD_MACHINERY: "new_machinery",
  MACHINERY_LIST: "machinery_list",
  GET_MACHINERY_BY_ID: "get-machinery-by-id",

  ADD_WAREHOUSE: "new_warehouse",
  WAREHOUSE_LIST: "warehouse_list",

  ADD_PROJECT: "new_project",
  PROJECT_LIST: "project_list",
  PROJECT_DETAIL: "project_detail",
  DELETE_PROJECT: "delete_project",

  ADD_STAFF: "new_staff",
  STAFF_LIST: "staff_list",
  STAFF_DETAIL: "staff_detail",
  DELETE_STAFF: "delete_staff",

  USER_MANAGEMENT_LIST: "user_management_list",
  SAVE_USER: "save_user",
  PERMISSION_CATALOG: "permission_catalog",
  USER_ACCESS_DETAILS: "user_access_details",
  SAVE_USER_ACCESS: "save_user_access",

  DELETE_CLIENT: "delete_client",
  DELETE_MATERIAL: "delete-material",
  DELETE_EQUIPMENT: "delete-equipment",
  DELETE_MACHINERY: "delete-machinery",
  DELETE_WAREHOUSE: "delete-warehouse",
  CLIENT_DETAIL: "client_detail",
} as const;

type EndpointKey = keyof typeof API_ENDPOINTS;

interface ApiResponse {
  success?: boolean;
  status?: boolean | string;
  message?: string;
  token?: string;
  user?: any;
  data?: any;
  total_count?: number;
  count?: number;
  limit?: number;
  page_no?: number;
  totalPages?: number;
  total_pages?: number;
}

// ==================== SESSION MANAGEMENT ====================

export const clearSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

export const getSession = () => {
  if (typeof window !== "undefined") {
    return {
      user: localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!)
        : null,
    };
  }

  return {
    user: null,
  };
};

const handleSessionExpiry = (_status: number, _endpoint: EndpointKey) => {
};

// ==================== POST API ====================

const SENSITIVE_KEYS = new Set([
  "password",
  "new_password",
  "confirm_password",
  "reenter_password",
  "activation_code",
  "temporary_password",
  "access_token",
  "token",
]);

const redactSensitive = (value: any): any => {
  if (Array.isArray(value)) return value.map(redactSensitive);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase())
          ? "[REDACTED]"
          : redactSensitive(nestedValue),
      ]),
    );
  }

  return value;
};

const inFlightReadRequests = new Map<string, Promise<ApiResponse>>();

const isReadOnlyPostEndpoint = (endpoint: EndpointKey): boolean => {
  return (
    endpoint.endsWith("_LIST") ||
    endpoint.startsWith("GET_") ||
    endpoint.endsWith("_DETAIL")
  );
};

const normalizeRequestValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(normalizeRequestValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((normalized, key) => {
        normalized[key] = normalizeRequestValue(value[key]);
        return normalized;
      }, {});
  }

  return value;
};

const createReadRequestKey = (
  endpoint: EndpointKey,
  body: any,
): string => {
  return `${endpoint}:${JSON.stringify(normalizeRequestValue(body))}`;
};

export const postAPI = async (
  endpoint: EndpointKey,
  body: any = {},
  isAuthRequired: boolean = false,
): Promise<ApiResponse> => {
  const fullUrl = `${BASE_URL}/${API_ENDPOINTS[endpoint]}`;
  const finalBody = body;

  const shouldDedupe = isReadOnlyPostEndpoint(endpoint);
  const requestKey = shouldDedupe
    ? createReadRequestKey(endpoint, finalBody)
    : null;

  if (requestKey) {
    const existingRequest = inFlightReadRequests.get(requestKey);

    if (existingRequest) {
      return existingRequest;
    }
  }

  const request = (async (): Promise<ApiResponse> => {
    console.group(`🌐 API Request: ${endpoint}`);
    console.log("Full URL:", fullUrl);
    console.log(
      "Payload:",
      JSON.stringify(redactSensitive(finalBody), null, 2),
    );
    console.log("Auth Required:", isAuthRequired);
    console.groupEnd();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(fullUrl, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(finalBody),
      });

      const data: ApiResponse = await res.json().catch(() => ({}));

      console.group(`📥 API Response: ${endpoint}`);
      console.log("Status:", res.status);
      console.log("Response Body:", redactSensitive(data));
      console.groupEnd();

      if (!res.ok) {
        handleSessionExpiry(res.status, endpoint);
        throw new Error(
          data.message || `HTTP Error ${res.status}`,
        );
      }

      return data;
    } catch (error: any) {
      console.warn(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  })();

  if (requestKey) {
    inFlightReadRequests.set(requestKey, request);

    const clearInFlightRequest = () => {
      if (inFlightReadRequests.get(requestKey) === request) {
        inFlightReadRequests.delete(requestKey);
      }
    };

    request.then(clearInFlightRequest, clearInFlightRequest);
  }

  return request;
};

