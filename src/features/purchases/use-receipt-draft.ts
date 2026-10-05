import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReceiptDraft } from "types/receipt";

export type ReceiptWork = {
  photo: { uri: string; width: number; height: number } | null;
  draft: ReceiptDraft | null;
};
const empty: ReceiptWork = { photo: null, draft: null };

export function useReceiptDraft(serverUrl: string) {
  const storageKey = "snowmilk.receipt-draft.v1:" + serverUrl;
  const [work, setWork] = useState<ReceiptWork>(empty);
  const [loadedKey, setLoadedKey] = useState("");
  const [storageError, setStorageError] = useState("");
  const queue = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey).then((saved) => {
      if (!active) return;
      if (saved) {
        const restored = JSON.parse(saved) as ReceiptWork;
        if (!restored || (restored.draft && !Array.isArray(restored.draft.lines))) throw new Error("Invalid draft");
        setWork(restored);
      } else setWork(empty);
    }).catch(() => {
      if (active) setStorageError("Không khôi phục được bản nháp bill trên máy. Hãy chọn lại ảnh.");
    }).finally(() => { if (active) setLoadedKey(storageKey); });
    return () => { active = false; };
  }, [storageKey]);

  const persist = useCallback((next: ReceiptWork) => {
    setWork(next);
    queue.current = (queue.current ?? Promise.resolve()).then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next)))
      .then(() => { setStorageError(""); }).catch(() => {
        setStorageError("Chưa lưu được bản nháp trên máy. Hãy giữ màn hình này để thử lại.");
      });
  }, [storageKey]);
  const clear = useCallback(async () => {
    await queue.current;
    await AsyncStorage.removeItem(storageKey);
    setWork(empty);
  }, [storageKey]);
  return { work, ready: loadedKey === storageKey, storageError, persist, clear };
}
