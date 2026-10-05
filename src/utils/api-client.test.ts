import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

mock.module("react-native", () => ({ Platform: { OS: "ios" } }));
const { ApiError, configureApi, request, signIn } = await import("../api/client");

const serverUrl = "http://192.168.1.141:3101";
const nativeFailure =
  "fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)";

beforeEach(() => configureApi(serverUrl));
afterEach(() => mock.restore());

describe("Snowmilk API connection failures", () => {
  test("shows a useful message for the iOS error instead of a Swift exception", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error(nativeFailure));

    await expect(request("/api/reports/dashboard")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("Không kết nối được Snowmilk"),
    });
  });

  test("handles browser network failures the same way", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(request("/api/reports/dashboard")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("Không kết nối được Snowmilk"),
    });
  });

  test("also translates connection failures during sign-in", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error(nativeFailure));

    await expect(signIn("staff@example.test", "password")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("Không kết nối được Snowmilk"),
    });
  });

  test("recognizes cancellation even when native fetch throws a plain Error", async () => {
    const controller = new AbortController();
    spyOn(globalThis, "fetch").mockImplementation((_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () =>
          reject(new Error("fetch failed: The operation was aborted.")),
        );
      }),
    );

    const pending = request("/api/reports/dashboard", { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({
      status: 0,
      message: "Yêu cầu bị gián đoạn hoặc quá thời gian. Hãy thử lại.",
    });
  });

  test("keeps server validation messages and HTTP statuses", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      success: false,
      errors: { fieldErrors: { saleDate: ["Ngày này đã chốt doanh thu."] } },
    }, { status: 400 }));

    await expect(request("/api/sales", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 400,
      message: "Ngày này đã chốt doanh thu.",
    });
  });

  test("keeps invalid API responses distinct from network failures", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html></html>"));

    await expect(request("/api/reports/dashboard")).rejects.toThrow(
      "API không trả về dữ liệu JSON. Kiểm tra địa chỉ máy chủ.",
    );
  });

  test("can retry after the server becomes available", async () => {
    const fetch = spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error(nativeFailure))
      .mockResolvedValueOnce(Response.json({ success: true, data: { daily: [] } }));

    await expect(request("/api/reports/dashboard")).rejects.toBeInstanceOf(ApiError);
    await expect(request("/api/reports/dashboard")).resolves.toEqual({ daily: [] });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
