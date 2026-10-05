import { AppButton } from "components/ui";
import { forwardRef, useImperativeHandle, useState } from "react";
import CalendarPicker, {
  DateChangedCallback,
} from "react-native-calendar-picker";
import { Modal, Pressable, StyleSheet } from "react-native";
import { FontFamily, Palette } from "themes";
import { width } from "themes/scaling";
import { dayKey } from "utils/format";
import { ThemedText } from "../ThemedText";
import { ViewTheme } from "../ThemedView";

interface DatePickerProps {
  onChange: (value: number) => void;
  value?: string;
  maxDate?: string;
}

export interface DatePickerMethods {
  open: () => void;
}

export const DatePicker = forwardRef<DatePickerMethods, DatePickerProps>(
  function DatePicker({ onChange, value, maxDate }, ref) {
    const [isShow, setShow] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();

    const handleDateChange: DateChangedCallback = (date) => {
      if (maxDate && dayKey(date) > maxDate) return;
      setSelectedDate(date);
    };

    const handleAccept = () => {
      if (!selectedDate) return;
      if (maxDate && dayKey(selectedDate) > maxDate) return;
      onChange(new Date(selectedDate).getTime() / 1000);
      setShow(false);
    };

    useImperativeHandle(ref, () => ({
      open: () => {
        const initialDate = value
          ? new Date(value + "T12:00:00+07:00")
          : new Date();
        setSelectedDate(
          maxDate && dayKey(initialDate) > maxDate
            ? new Date(maxDate + "T12:00:00+07:00")
            : initialDate,
        );
        setShow(true);
      },
    }));

    return (
      <Modal
        visible={isShow}
        transparent
        animationType="fade"
        onRequestClose={() => setShow(false)}
      >
        <ViewTheme
          flex={1}
          justifyContent="center"
          paddingHorizontal={24}
          safePaddingTop={16}
          safePaddingBottom={16}
          backgroundColor="#00000066"
        >
          <Pressable
            accessibilityLabel="Đóng lịch"
            accessibilityRole="button"
            onPress={() => setShow(false)}
            style={StyleSheet.absoluteFill}
          />
          <ViewTheme
            alignSelf="center"
            width="100%"
            maxWidth={480}
            radius={24}
            padding={12}
            backgroundColor={Palette.surfaceBase}
          >
            <ThemedText
              color={Palette.textPrimary}
              fontFamily={FontFamily.bold}
              fontSize={18}
              marginBottom={4}
              textAlign="center"
            >
              Chọn ngày
            </ThemedText>
            <ThemedText
              color={Palette.textSecondary}
              fontFamily={FontFamily.regular}
              fontSize={13}
              marginBottom={12}
              textAlign="center"
            >
              Chọn ngày ghi nhận dữ liệu.
            </ThemedText>
            <CalendarPicker
              initialDate={selectedDate}
              maxDate={maxDate ? new Date(maxDate + "T12:00:00+07:00") : undefined}
              restrictMonthNavigation={Boolean(maxDate)}
              months={[
                "Tháng 1",
                "Tháng 2",
                "Tháng 3",
                "Tháng 4",
                "Tháng 5",
                "Tháng 6",
                "Tháng 7",
                "Tháng 8",
                "Tháng 9",
                "Tháng 10",
                "Tháng 11",
                "Tháng 12",
              ]}
              weekdays={["T2", "T3", "T4", "T5", "T6", "T7", "CN"]}
              previousTitle="Trước"
              nextTitle="Sau"
              startFromMonday={true}
              todayBackgroundColor={Palette.borderSubtle}
              selectedDayColor={Palette.accent}
              selectedDayTextColor={Palette.surfaceBase}
              selectedStartDate={selectedDate}
              width={Math.min(width, 480) - 72}
              onDateChange={handleDateChange}
            />
            <AppButton
              disabled={!selectedDate}
              label="Xác nhận"
              onPress={handleAccept}
              style={{ marginTop: 16 }}
            />
          </ViewTheme>
        </ViewTheme>
      </Modal>
    );
  },
);
