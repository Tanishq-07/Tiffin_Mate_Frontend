import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
  Animated, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function formatOrderDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toDateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupByDay(orders) {
  const map = {};
  const keyOrder = [];
  orders.forEach((o) => {
    const key = toDateKey(o.date);
    if (!map[key]) {
      map[key] = { date: o.date, morning: null, night: null, morningId: null, nightId: null };
      keyOrder.push(key);
    }
    map[key][o.time] = o.type;
    map[key][`${o.time}Id`] = o._id;
  });
  return keyOrder.map((k) => map[k]);
}

export default function SummaryScreen() {
  const { dark, setDark, C } = useTheme();
  const { user } = useAuth();
  const s = makeStyles(C);
  const isAdmin = user?.role === 'admin';

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [prices, setPrices] = useState({ full: 80, half: 40 });
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState({});

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerTranslate = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, -20], extrapolate: 'clamp' });

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/orders/summary`,
        { params: { month, year }, ...authHeader }
      );
      setSummary(res.data.summary);
      setMembers(res.data.members || Object.keys(res.data.summary));
      if (res.data.prices) setPrices(res.data.prices);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch summary. Is backend running?');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useFocusEffect(useCallback(() => { fetchSummary(); }, [fetchSummary]));

  const toggleExpand = (name) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleDelete = (id, label) => {
    Alert.alert('Delete Order', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${BASE_URL}/orders/${id}`, authHeader);
            fetchSummary();
          } catch (err) {
            Alert.alert('Error', 'Could not delete order.');
          }
        },
      },
    ]);
  };

  const totalAll = summary
    ? Object.values(summary).reduce((sum, d) => sum + (d?.total || 0), 0)
    : 0;

  const TypePill = ({ type, id, label }) => {
    if (!type) return <View style={s.pillEmpty}><Text style={s.pillEmptyText}>—</Text></View>;
    return (
      <View style={s.pillRow}>
        <View style={[s.pill, type === 'full' ? s.pillFull : s.pillHalf]}>
          <Text style={[s.pillText, type === 'full' ? s.pillFullText : s.pillHalfText]}>
            {type === 'full' ? '🍱 Full' : '🥡 Half'}
          </Text>
        </View>
        {id && (
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => handleDelete(id, label)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={s.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={C.headerBg} />

      <View style={s.topBar}>
        <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }}>
          <Text style={s.headerTitle}>
            {isAdmin ? 'All Summaries' : 'My Summary'}
          </Text>
          <Text style={s.headerSub}>
            {isAdmin ? 'Monthly overview for all members' : `Viewing as ${user.name}`}
          </Text>
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
        {/* Prices Banner */}
        <View style={s.pricesBanner}>
          <Text style={s.pricesBannerTitle}>Current Prices</Text>
          <View style={s.pricesRow}>
            <View style={s.priceChip}>
              <Text style={s.priceChipLabel}>🍱 Full</Text>
              <Text style={s.priceChipValue}>₹{prices.full}</Text>
            </View>
            <View style={s.priceDivider} />
            <View style={s.priceChip}>
              <Text style={s.priceChipLabel}>🥡 Half</Text>
              <Text style={s.priceChipValue}>₹{prices.half}</Text>
            </View>
          </View>
        </View>

        {/* Month Selector */}
        <View style={s.monthSelector}>
          <TouchableOpacity onPress={() => setMonth((m) => Math.max(1, m - 1))} style={s.arrowBtn}>
            <Text style={s.arrowText}>‹</Text>
          </TouchableOpacity>
          <View style={s.monthCenter}>
            <Text style={s.monthName}>{MONTH_NAMES[month - 1]}</Text>
            <Text style={s.monthYear}>{year}</Text>
          </View>
          <TouchableOpacity onPress={() => setMonth((m) => Math.min(12, m + 1))} style={s.arrowBtn}>
            <Text style={s.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.refreshBtn} onPress={fetchSummary}>
          <Text style={s.refreshText}>↻  Refresh</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 40 }} />
        ) : summary ? (
          <>
            {/* Grand total — show for admin or if member has orders */}
            {(isAdmin || totalAll > 0) && (
              <View style={s.grandTotal}>
                <Text style={s.grandTotalLabel}>
                  {isAdmin ? 'Total this month (all)' : 'Your total this month'}
                </Text>
                <Text style={s.grandTotalValue}>₹{totalAll}</Text>
              </View>
            )}

            {members.map((name) => {
              const data = summary[name] || { full: 0, half: 0, total: 0, orders: [] };
              const isOpen = expanded[name];
              const grouped = groupByDay(data.orders || []);

              return (
                <TouchableOpacity
                  key={name}
                  style={s.card}
                  onPress={() => toggleExpand(name)}
                  activeOpacity={0.82}
                >
                  <View style={s.cardHeader}>
                    <View style={s.cardAvatar}>
                      <Text style={s.cardAvatarText}>{name[0]}</Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardName}>{name}</Text>
                      <View style={s.cardBadgeRow}>
                        <View style={s.badge}>
                          <Text style={s.badgeText}>🍱 {data.full}</Text>
                        </View>
                        <View style={s.badge}>
                          <Text style={s.badgeText}>🥡 {data.half}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.cardRight}>
                      <Text style={s.cardTotal}>₹{data.total}</Text>
                      <Text style={s.expandHint}>{isOpen ? '▲' : '▼'}</Text>
                    </View>
                  </View>

                  {isOpen && (
                    <View style={s.detail}>
                      <View style={s.detailDivider} />
                      {grouped.length === 0 ? (
                        <Text style={s.noOrders}>No orders this month</Text>
                      ) : (
                        <>
                          <View style={s.tableHeader}>
                            <Text style={[s.tableHeaderText, { width: 90 }]}>Date</Text>
                            <Text style={[s.tableHeaderText, { flex: 1 }]}>🌅 Morning</Text>
                            <Text style={[s.tableHeaderText, { flex: 1 }]}>🌙 Night</Text>
                          </View>
                          {grouped.map((row, i) => (
                            <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                              <Text style={s.tableDate}>{formatOrderDate(row.date)}</Text>
                              <View style={{ flex: 1, paddingRight: 4 }}>
                                <TypePill
                                  type={row.morning}
                                  id={row.morningId}
                                  label={`${name} · morning · ${row.morning} · ${formatOrderDate(row.date)}`}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <TypePill
                                  type={row.night}
                                  id={row.nightId}
                                  label={`${name} · night · ${row.night} · ${formatOrderDate(row.date)}`}
                                />
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <Text style={s.empty}>No orders yet this month.</Text>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12, backgroundColor: C.headerBg,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: C.subtext, marginTop: 2 },
  themeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 18 },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },
  pricesBanner: {
    backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center',
  },
  pricesBannerTitle: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginRight: 16,
  },
  pricesRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  priceChip: { alignItems: 'center', paddingHorizontal: 14 },
  priceChipLabel: { fontSize: 11, color: C.subtext, marginBottom: 2 },
  priceChipValue: { fontSize: 20, fontWeight: '800', color: C.accent },
  priceDivider: { width: 1, height: 32, backgroundColor: C.border },
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: 14, padding: 8, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  arrowBtn: { padding: 8, paddingHorizontal: 14 },
  arrowText: { fontSize: 26, color: C.accent, fontWeight: '300', lineHeight: 30 },
  monthCenter: { alignItems: 'center' },
  monthName: { fontSize: 17, fontWeight: '700', color: C.text },
  monthYear: { fontSize: 11, color: C.muted, marginTop: 1 },
  refreshBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16, marginBottom: 14 },
  refreshText: { color: C.accent, fontSize: 13, fontWeight: '600' },
  grandTotal: {
    backgroundColor: C.accent, borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  grandTotalLabel: { fontSize: 13, fontWeight: '600', color: '#ffffffcc' },
  grandTotalValue: { fontSize: 26, fontWeight: '900', color: '#fff' },
  card: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1,
    borderColor: C.border, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardAvatarText: { fontSize: 18, fontWeight: '800', color: C.accent },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 5 },
  cardBadgeRow: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: C.accentSoft, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 },
  badgeText: { fontSize: 12, color: C.accent, fontWeight: '700' },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 21, fontWeight: '800', color: C.accent },
  expandHint: { fontSize: 11, color: C.muted, marginTop: 4 },
  detail: { paddingHorizontal: 14, paddingBottom: 16 },
  detailDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, marginBottom: 6 },
  tableHeaderText: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderRadius: 8, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: C.cardAlt },
  tableDate: { fontSize: 13, color: C.subtext, fontWeight: '600', width: 90 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  pillFull: { backgroundColor: '#d1fae5' },
  pillHalf: { backgroundColor: '#fce7f3' },
  pillText: { fontSize: 12, fontWeight: '700' },
  pillFullText: { color: '#065f46' },
  pillHalfText: { color: '#9d174d' },
  pillEmpty: { paddingVertical: 4, paddingHorizontal: 10 },
  pillEmptyText: { fontSize: 13, color: C.muted },
  deleteBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 9, color: '#dc2626', fontWeight: '800' },
  noOrders: { color: C.muted, fontSize: 14, textAlign: 'center', padding: 12 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 60, fontSize: 15 },
});