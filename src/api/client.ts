import { Platform } from "react-native";

let baseUrl = "";
let sessionCookie = "";
export function configureApi(url: string, cookie = "") {
  baseUrl = url.replace(/\/$/, "");
  sessionCookie = cookie;
}
export function normalizeServerUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Nhập địa chỉ HTTP/HTTPS của Snowmilk.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Nhập địa chỉ HTTP/HTTPS của Snowmilk.");
  return url.origin;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function fetchFromServer(url: string, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (error) {
    // Expo native fetch wraps transport errors in Error, including cancellation.
    if (
      options.signal?.aborted ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw new ApiError(
        "Yêu cầu bị gián đoạn hoặc quá thời gian. Hãy thử lại.",
        0,
      );
    throw new ApiError(
      "Không kết nối được Snowmilk. Kiểm tra máy chủ đã chạy, địa chỉ API và mạng Wi-Fi.",
      0,
    );
  }
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    raw?: boolean;
    serverUrl?: string;
    cookie?: string;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), options.timeoutMs ?? 20000);
  const cancel = () => abort.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) abort.abort();
  const target = options.serverUrl ?? baseUrl;
  const cookie = options.cookie ?? sessionCookie;
  try {
    const response = await fetchFromServer(target + path, {
      method: options.method ?? "GET",
      signal: abort.signal,
      credentials: Platform.OS === "web" ? "include" : "omit",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(Platform.OS !== "web"
          ? {
              Origin: target,
              ...(cookie ? { Cookie: cookie } : {}),
            }
          : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success === false) {
      const fields = result?.errors?.fieldErrors as
        Record<string, string[]> | undefined;
      const detail = fields
        ? Object.values(fields).flat().filter(Boolean).join("\n")
        : "";
      throw new ApiError(
        detail ||
          result?.message ||
          (response.status === 401
            ? "Máy chủ Snowmilk yêu cầu xác thực truy cập."
            : "Không thể tải dữ liệu (" + response.status + ")."),
        response.status,
      );
    }
    if (!result)
      throw new Error(
        "API không trả về dữ liệu JSON. Kiểm tra địa chỉ máy chủ.",
      );
    return (options.raw ? result : result.data) as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
export async function signIn(
  email: string,
  password: string,
  serverUrl = baseUrl,
) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 20000);
  try {
    const response = await fetchFromServer(serverUrl + "/api/auth/sign-in/email", {
      method: "POST",
      signal: abort.signal,
      credentials: Platform.OS === "web" ? "include" : "omit",
      headers: {
        "Content-Type": "application/json",
        ...(Platform.OS !== "web" ? { Origin: serverUrl } : {}),
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message ?? "Đăng nhập thất bại.");
    const cookies = response.headers.get("set-cookie") ?? "";
    const match = cookies.match(
      /((?:__Secure-)?bep-nha-ne\.session_token=[^;,\s]+)/,
    );
    if (Platform.OS !== "web" && !match)
      throw new Error("Máy chủ chưa trả cookie phiên đăng nhập hợp lệ.");
    return match?.[1] ?? "";
  } finally {
    clearTimeout(timeout);
  }
}
