import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Animated, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useTheme } from '../theme';
import { BASE_URL, MEMBERS } from '../config';

const TIMES = ['morning', 'night'];
const TYPES = ['full', 'half'];
const TIME_ICON = { morning: '🌅', night: '🌙' };
const TYPE_ICON = { full: '🍱', half: '🥡' };

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });
}

function formatDateLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function AddOrderScreen() {
  const { dark, setDark, C } = useTheme();
  const s = makeStyles(C);

  const dates = getLast30Days();
  const [name, setName] = useState(MEMBERS[0]);
  const [time, setTime] = useState(TIMES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/orders`, {
        name, time, type,
        date: selectedDate.toISOString(),
      });
      Alert.alert('✅ Order Added', `${name} · ${time} · ${type} · ${formatDateLabel(selectedDate)}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add order. Is backend running?';
      Alert.alert('❌ Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const Chip = ({ label, selected, onPress, icon }) => (
    <TouchableOpacity
      style={[s.chip, selected && s.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={s.chipIcon}>{icon}</Text>}
      <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={C.headerBg} />

      <View style={s.topBar}>
        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }}>
          <Text style={s.headerTitle}>Add Order</Text>
          <Text style={s.headerSub}>Log today's tiffin</Text>
        </Animated.View>
        <TouchableOpacity style={s.themeBtn} onPress={() => setDark(!dark)}>
          <Text style={s.themeBtnText}>{dark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={s.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>👤 Who's ordering?</Text>
          <View style={s.chipRow}>
            {MEMBERS.map((n) => (
              <Chip key={n} label={n} selected={name === n} onPress={() => setName(n)} />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>📅 Date</Text>
          <TouchableOpacity style={s.dateButton} onPress={() => setShowDatePicker(!showDatePicker)} activeOpacity={0.8}>
            <Text style={s.dateButtonText}>{formatDateLabel(selectedDate)}</Text>
            <Text style={s.dateButtonSub}>
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={s.dateChevron}>{showDatePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={s.dateDropdown}>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {dates.map((d, i) => {
                  const isSel = d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.dateItem, isSel && s.dateItemSelected]}
                      onPress={() => { setSelectedDate(d); setShowDatePicker(false); }}
                    >
                      <Text style={[s.dateItemText, isSel && s.dateItemTextSelected]}>
                        {formatDateLabel(d)}
                      </Text>
                      <Text style={s.dateItemSub}>
                        {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>⏰ Meal Time</Text>
          <View style={s.chipRow}>
            {TIMES.map((t) => (
              <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)}
                selected={time === t} onPress={() => setTime(t)} icon={TIME_ICON[t]} />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>🍽️ Tiffin Type</Text>
          <View style={s.chipRow}>
            {TYPES.map((tp) => (
              <Chip key={tp} label={tp.charAt(0).toUpperCase() + tp.slice(1)}
                selected={type === tp} onPress={() => setType(tp)} icon={TYPE_ICON[tp]} />
            ))}
          </View>
        </View>

        <View style={s.previewCard}>
          <Text style={s.previewLabel}>ORDER PREVIEW</Text>
          <Text style={s.previewText}>
            {name} · {TIME_ICON[time]} {time} · {TYPE_ICON[type]} {type} · {formatDateLabel(selectedDate)}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={s.submitText}>{loading ? 'Adding…' : 'Add Order'}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: C.headerBg,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: C.subtext, marginTop: 2 },
  themeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, alignItems: 'center',
    justifyContent: 'center', marginTop: 2,
  },
  themeBtnText: { fontSize: 18 },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    marginBottom: 10, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.card,
  },
  chipSelected: { backgroundColor: C.accent, borderColor: C.accent },
  chipIcon: { fontSize: 14, marginRight: 6 },
  chipText: { color: C.subtext, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  dateButton: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    padding: 14, flexDirection: 'row', alignItems: 'center',
  },
  dateButtonText: { fontSize: 15, fontWeight: '700', color: C.accent, flex: 1 },
  dateButtonSub: { fontSize: 11, color: C.muted, marginRight: 8 },
  dateChevron: { color: C.accent, fontSize: 11 },
  dateDropdown: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    marginTop: 6, overflow: 'hidden',
  },
  dateItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dateItemSelected: { backgroundColor: C.accentSoft },
  dateItemText: { fontSize: 14, color: C.text, fontWeight: '600' },
  dateItemTextSelected: { color: C.accent },
  dateItemSub: { fontSize: 12, color: C.muted },
  previewCard: {
    backgroundColor: C.accentSoft, borderRadius: 14,
    padding: 14, marginBottom: 20, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  previewLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.4, marginBottom: 5 },
  previewText: { color: C.accent, fontSize: 13, fontWeight: '600' },
  submitBtn: {
    backgroundColor: C.accent, borderRadius: 16,
    padding: 17, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
});