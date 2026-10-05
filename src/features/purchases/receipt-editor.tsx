import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useQueryClient } from "@tanstack/react-query";
import { request, ApiError } from "api/client";
import { useData } from "api/hooks";
import { useApi } from "api/provider";
import { ThemedText, ThemedView } from "components/base";
import { Card, DetailRow, InlineError } from "components/molecules/common";
import { DateField, Field } from "components/molecules/form-field";
import { FundingField } from "components/organisms/editor-shared";
import { FormScreen, LoadingCards } from "components/organisms/screen";
import { AppButton } from "components/ui/button";
import { FontFamily, Palette } from "themes";
import type { Ingredient } from "types/domain";
import type { ReceiptDraft, ReceiptDraftLine, ReceiptScan } from "types/receipt";
import { dayKey, money } from "utils/format";
import { createReceiptDraft, receiptDraftTotal, receiptPurchasePayload } from "utils/receipt";
import { ReceiptLineCard } from "./receipt-line";
import { useReceiptDraft, type ReceiptWork } from "./use-receipt-draft";

export function ReceiptEditor() {
  const router = useRouter();
  const client = useQueryClient();
  const { serverUrl } = useApi();
  const ingredients = useData<Ingredient[]>("/api/ingredients?limit=500");
  const { work, ready, storageError, persist, clear } = useReceiptDraft(serverUrl);
  const [busy, setBusy] = useState<"scan" | "save" | "photo" | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const running = useRef(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => { abort.current?.abort(); }, []);
  const draft = work.draft;
  const update = (change: Partial<ReceiptDraft>) => {
    if (!draft) return;
    setConfirmed(false);
    persist({ ...work, draft: { ...draft, ...change } });
  };
  const updateLine = (key: string, change: Partial<ReceiptDraftLine>) => {
    if (draft) update({ lines: draft.lines.map((line) => line.key === key ? { ...line, ...change } : line) });
  };

  async function readPhoto(next: ReceiptWork) {
    if (!next.photo) return;
    setBusy("scan");
    setError("");
    abort.current = new AbortController();
    const context = ImageManipulator.manipulate(next.photo.uri);
    try {
      const longest = Math.max(next.photo.width, next.photo.height);
      if (longest > 2000) context.resize(next.photo.width >= next.photo.height ? { width: 2000 } : { height: 2000 });
      const image = await context.renderAsync();
      let converted;
      try { converted = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true }); }
      finally { image.release(); }
      if (!converted.base64 || converted.base64.length > 4_000_000) throw new Error("Ảnh bill quá lớn. Hãy chụp gần bill hoặc chọn ảnh nhỏ hơn.");
      const scan = await request<ReceiptScan>("/api/purchases/scan", {
        method: "POST", body: { imageBase64: converted.base64 }, timeoutMs: 80000, signal: abort.current.signal,
      });
      if (!scan?.receiptId || !scan.lines?.length) throw new Error("Chưa đọc được mặt hàng. Hãy chọn ảnh rõ hơn.");
      persist({ photo: next.photo, draft: createReceiptDraft(scan) });
      setConfirmed(false);
    } finally {
      context.release();
    }
  }

  async function pickPhoto(camera: boolean) {
    if (running.current || !ready) return;
    running.current = true;
    setBusy("photo");
    setError("");
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          if (!permission.canAskAgain) Alert.alert("Cho phép chụp bill", "Mở cài đặt để cho phép Sữa Tuyết dùng camera.", [
            { text: "Để sau", style: "cancel" }, { text: "Mở cài đặt", onPress: () => { void Linking.openSettings(); } },
          ]);
          throw new Error("Cần quyền camera để chụp bill. Bạn cũng có thể chọn ảnh đã chụp.");
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: false, quality: 1 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      const next: ReceiptWork = { photo: { uri: asset.uri, width: asset.width, height: asset.height }, draft: null };
      persist(next);
      setConfirmed(false);
      await readPhoto(next);
    } catch (failure) {
      setError(failure instanceof ApiError && failure.status === 404
        ? "Máy chủ Snowmilk chưa có tính năng đọc bill. Cần cập nhật API trước khi dùng."
        : failure instanceof Error ? failure.message : "Không mở được ảnh bill.");
    } finally { running.current = false; setBusy(null); }
  }

  function choosePhoto(camera: boolean) {
    if (draft) Alert.alert("Đọc bill khác?", "Bản nháp hiện tại sẽ được thay bằng bill mới.", [
      { text: "Giữ bản nháp", style: "cancel" },
      { text: "Đọc bill khác", onPress: () => { void pickPhoto(camera); } },
    ]);
    else void pickPhoto(camera);
  }

  async function retryScan() {
    if (running.current) return;
    running.current = true;
    try { await readPhoto(work); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Chưa đọc được bill."); }
    finally { running.current = false; setBusy(null); }
  }

  async function save() {
    if (running.current || !draft || !ingredients.data) return;
    setError("");
    if (!confirmed) { setError("Hãy kiểm tra ngày, mặt hàng, quy cách và thành tiền, rồi xác nhận ở cuối bill."); return; }
    running.current = true;
    setBusy("save");
    try {
      const payload = receiptPurchasePayload(draft, ingredients.data);
      await request("/api/purchases/import-receipt", { method: "POST", body: payload, timeoutMs: 60000 });
      void client.invalidateQueries({ queryKey: ["snowmilk", serverUrl] });
      await clear();
      router.dismissTo({ pathname: "/(tabs)/purchases", params: { date: draft.date, receiptId: draft.receiptId } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chưa lưu được bill. Bản nháp được giữ để thử lại.");
    } finally { running.current = false; setBusy(null); }
  }

  const total = draft ? receiptDraftTotal(draft.lines) : 0;
  return (
    <FormScreen title="Nhập hàng từ bill" saving={busy !== null} error={error}
      saveDisabled={!ready || (Boolean(draft) && !ingredients.data)}
      loadingLabel={busy === "scan" ? "Đang đọc bill…" : busy === "photo" ? "Đang mở ảnh…" : "Đang nhập hàng…"}
      saveLabel={draft ? `Nhập ${draft.lines.filter((line) => line.included).length} mặt hàng · ${money(total)}` : "Chọn ảnh bill để bắt đầu"}
      onSave={() => { if (draft) void save(); else choosePhoto(true); }}>
      {!ready ? <LoadingCards /> : <>
        <Card>
          <ThemedText fontFamily={FontFamily.semibold} fontSize={16}>Chụp bill, điền sẵn phiếu nhập</ThemedText>
          <ThemedText fontSize={12} lineHeight={20} color={Palette.textSecondary}>
            Chụp rõ toàn bộ bill. Ngày, từng mặt hàng, số lượng và thành tiền sẽ được đọc để bạn kiểm tra rồi nhập kho.
          </ThemedText>
          <ThemedView row gap={10}>
            <ThemedView flex={1}><AppButton label="Chụp bill" disabled={!ready || busy !== null} onPress={() => choosePhoto(true)} /></ThemedView>
            <ThemedView flex={1}><AppButton label="Chọn ảnh" variant="secondary" disabled={!ready || busy !== null} onPress={() => choosePhoto(false)} /></ThemedView>
          </ThemedView>
          <ThemedText fontSize={11} lineHeight={18} color={Palette.textTertiary}>Ảnh được gửi tới DeepSeek để đọc nội dung bill.</ThemedText>
        </Card>
        {work.photo ? <Image accessibilityLabel="Ảnh bill nhập hàng" source={{ uri: work.photo.uri }} resizeMode="contain"
          style={{ width: "100%", height: 220, borderRadius: 16, backgroundColor: Palette.surfaceMuted }} /> : null}
        {busy === "scan" ? <ThemedView rowCenter gap={10}>
          <ActivityIndicator color={Palette.accent} /><ThemedText fontSize={13}>Đang đọc ngày và mặt hàng trên bill…</ThemedText>
        </ThemedView> : null}
        {work.photo && !draft && busy === null ? <AppButton label="Đọc lại ảnh bill" variant="ghost" onPress={() => { void retryScan(); }} /> : null}
        <InlineError message={storageError} />
        <InlineError message={ingredients.error?.message} onRetry={() => { void ingredients.refetch(); }} />
        {draft ? <>
          <Card>
            <ThemedText fontFamily={FontFamily.semibold} fontSize={15}>Thông tin trên bill</ThemedText>
            {draft.warnings.map((warning) => <ThemedText key={warning} selectable fontSize={12} lineHeight={19} color={Palette.cashOut}>{warning}</ThemedText>)}
            {draft.date ? <DateField label="Ngày nhập theo bill" value={draft.date} maxDate={dayKey()} onChange={(date) => update({ date })} />
              : <><ThemedText color={Palette.cashOut} fontSize={12}>Chưa có ngày nhập. Chọn đúng ngày trên bill.</ThemedText>
                <DateField label="Chọn ngày nhập" value="" maxDate={dayKey()} onChange={(date) => update({ date })} /></>}
            <Field label="Nhà cung cấp" value={draft.supplier} onChange={(supplier) => update({ supplier })} />
            <Field label="Số bill" value={draft.invoiceNumber} onChange={(invoiceNumber) => update({ invoiceNumber })} />
            <FundingField value={draft.funding} onChange={(funding) => update({ funding: funding as ReceiptDraft["funding"] })} />
          </Card>
          {ingredients.data ? draft.lines.map((line) => <ReceiptLineCard key={line.key} line={line} ingredients={ingredients.data}
            onChange={(change) => updateLine(line.key, change)} />) : ingredients.isLoading ? <LoadingCards /> : null}
          <Card>
            <DetailRow label="Tổng bill đọc được" value={draft.billTotal === null ? "Chưa đọc rõ" : money(draft.billTotal)} />
            <DetailRow label="Tổng các dòng nhập" value={money(total)} />
            {draft.billTotal !== null && total !== draft.billTotal ? <ThemedText color={Palette.cashOut} fontSize={12} lineHeight={19}>
              Tổng dòng nhập khác tổng bill. Kiểm tra thuế, phí, chiết khấu hoặc dòng đã bỏ trước khi xác nhận.
            </ThemedText> : null}
            <Field label="Ghi chú" multiline value={draft.note} onChange={(note) => update({ note })} />
            <ThemedText fontSize={12} lineHeight={19} color={Palette.textSecondary}>
              Kiểm tra ngày, mặt hàng, đơn vị mua và thành tiền. Chi phí thuê tiệt trùng có thể bổ sung trong từng phiếu sau khi nhập.
            </ThemedText>
            <AppButton variant={confirmed ? "secondary" : "ghost"} label={confirmed ? "Đã kiểm tra bill ✓" : "Xác nhận đã kiểm tra bill"}
              onPress={() => setConfirmed((value) => !value)} accessibilityState={{ selected: confirmed }} />
          </Card>
        </> : null}
      </>}
    </FormScreen>
  );
}
