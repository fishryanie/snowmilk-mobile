import { useState } from "react";
import { useRouter } from "expo-router";
import { useSave } from "api/hooks";
import { AppButton } from "components/ui/button";
import { ThemedText, ThemedView } from "components/base";
import { Card, InlineError } from "components/molecules/common";
import { Field, SelectField } from "components/molecules/form-field";
import { fundingLabels } from "utils/format";
import { Palette } from "themes";
export function useDraft(initial: Record<string, string>) {
  const [draft, setDraft] = useState(initial);
  const set = (key: string, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return {
    draft,
    set,
    field: (key: string, label: string, numeric = false) => (
      <Field
        label={label}
        value={draft[key] ?? ""}
        numeric={numeric}
        onChange={(value) => set(key, value)}
      />
    ),
  };
}
export function useEditorSave(path: string, id?: string, method?: string) {
  const router = useRouter();
  const [error, setError] = useState("");
  const mutation = useSave(() => router.back());
  function save(builder: () => unknown) {
    if (mutation.isPending) return;
    setError("");
    try {
      mutation.mutate({
        path: path + (id ? "/" + id : ""),
        method: method ?? (id ? "PUT" : "POST"),
        body: builder(),
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Dữ liệu chưa hợp lệ.",
      );
    }
  }
  return {
    save,
    saving: mutation.isPending,
    error: error || mutation.error?.message,
  };
}
export function required(value: string, label: string) {
  if (!value.trim())
    throw new Error("Vui lòng nhập " + label.toLocaleLowerCase("vi") + ".");
  return value.trim();
}
export function FundingField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SelectField
      label="Nguồn tiền"
      value={value}
      onChange={onChange}
      options={Object.entries(fundingLabels).map(([value, label]) => ({
        value,
        label,
      }))}
    />
  );
}
export function ActiveField({
  value,
  onChange,
  label = "Trạng thái",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: "true", label: "Đang hoạt động" },
        { value: "false", label: "Ngừng hoạt động" },
      ]}
    />
  );
}
export function DeleteAction({ path, label }: { path: string; label: string }) {
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const mutation = useSave(() => router.back());
  return (
    <ThemedView gap={10}>
      <InlineError message={mutation.error?.message} />
      {confirm ? (
        <Card>
          <ThemedText color={Palette.danger} fontSize={14}>
            Xóa {label}? Thao tác sẽ cập nhật dữ liệu Snowmilk và tính lại các
            số liệu liên quan.
          </ThemedText>
          <AppButton
            label="Xác nhận xóa"
            loading={mutation.isPending}
            variant="danger"
            onPress={() => {
              if (!mutation.isPending)
                mutation.mutate({ path, method: "DELETE" });
            }}
          />
          <AppButton
            label="Giữ lại"
            variant="ghost"
            disabled={mutation.isPending}
            onPress={() => setConfirm(false)}
          />
        </Card>
      ) : (
        <AppButton
          label="Xóa "
          variant="ghost"
          textColor={Palette.danger}
          onPress={() => setConfirm(true)}
        />
      )}
    </ThemedView>
  );
}
