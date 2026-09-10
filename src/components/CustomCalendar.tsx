import React, {useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '../utils/constants';

interface Props {
  value: Date;
  maximumDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d: Date) => isSameDay(d, new Date());

const CustomCalendar: React.FC<Props> = ({value, maximumDate, onSelect, onClose}) => {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const count = new Date(viewYear, viewMonth + 1, 0).getDate();
    const lead = first.getDay();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= count; d++)
      cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const clampToday = () => {
    const now = new Date();
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
  };

  const stepMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const disabled = (day: Date) => (maximumDate ? day.getTime() > maximumDate.getTime() : false);

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <TouchableOpacity style={styles.navBtn} onPress={() => stepMonth(-1)}>
          <MaterialIcons name="chevron-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headTitle} onPress={clampToday}>
          <Text style={styles.headText}>
            {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => stepMonth(1)}>
          <MaterialIcons name="chevron-right" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={`${w}${i}`} style={styles.dayCell}>
            <Text style={styles.weekday}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, i) =>
          day === null ? (
            <View key={`blank${i}`} style={styles.dayCell} />
          ) : (
            <View key={day.toISOString()} style={styles.dayCell}>
              <TouchableOpacity
                style={[
                  styles.dayBtn,
                  isSameDay(day, value) && styles.dayBtnSelected,
                  isToday(day) && !isSameDay(day, value) && styles.dayBtnToday,
                ]}
                disabled={disabled(day)}
                onPress={() => onSelect(day)}>
                <Text
                  style={[
                    styles.dayText,
                    isSameDay(day, value) && styles.dayTextSelected,
                    disabled(day) && styles.dayTextDisabled,
                  ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekRow: {
    flexDirection: 'row',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dayBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    backgroundColor: COLORS.primary,
  },
  dayBtnToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 13,
    color: COLORS.text,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: COLORS.border,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default CustomCalendar;