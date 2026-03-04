import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

const EyeOpen = ({ color }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

const EyeOff = ({ color }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0120.49 16.1M14.12 14.12A3 3 0 119.88 9.88"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function AdminScreen() {
  const { C, dark, setDark } = useTheme();
  const { user, logout } = useAuth();
  const s = makeStyles(C);

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [fullPrice, setFullPrice] = useState('');
  const [halfPrice, setHalfPrice] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [usersRes, configRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/users`, authHeader),
        axios.get(`${BASE_URL}/admin/config`, authHeader),
      ]);
      setUsers(usersRes.data.users);
      setFullPrice(String(configRes.data.prices.full));
      setHalfPrice(String(configRes.data.prices.half));
    } catch (err) {
      Alert.alert('Error', 'Could not load admin data');
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const addUser = async () => {
    const n = newUserName.trim();
    const p = newUserPass.trim();
    if (!n || !p) { Alert.alert('Error', 'Name and password required'); return; }
    if (p.length < 4) { Alert.alert('Error', 'Password must be at least 4 characters'); return; }
    setLoadingUsers(true);
    try {
      await axios.post(`${BASE_URL}/admin/users`, { name: n, password: p }, authHeader);
      setNewUserName('');
      setNewUserPass('');
      setShowNewPass(false);
      const res = await axios.get(`${BASE_URL}/admin/users`, authHeader);
      setUsers(res.data.users);
      Alert.alert('✅ Done', `${n} added — they can now log in and appear in summary`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    } finally { setLoadingUsers(false); }
  };

  const removeUser = (name) => {
    Alert.alert(
      'Remove User',
      `Remove @${name}?\n\nThey won't be able to log in and will be removed from the monthly summary.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/admin/users/${name}`, authHeader);
              setUsers(users.filter((u) => u.name !== name));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed');
            }
          },
        },
      ]
    );
  };

  const savePrices = async () => {
    const full = parseFloat(fullPrice);
    const half = parseFloat(halfPrice);
    if (isNaN(full) || isNaN(half)) { Alert.alert('Error', 'Enter valid prices'); return; }
    setSavingPrices(true);
    try {
      await axios.put(`${BASE_URL}/admin/config/prices`, { full, half }, authHeader);
      Alert.alert('✅ Saved', 'Prices updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    } finally { setSavingPrices(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={C.headerBg} />

      <View style={s.topBar}>
        <View>
          <Text style={s.headerTitle}>Admin</Text>
          <Text style={s.headerSub}>Manage users & prices</Text>
        </View>
        <View style={s.topBarRight}>
          <TouchableOpacity style={s.themeBtn} onPress={() => setDark(!dark)}>
            <Text style={s.themeBtnText}>{dark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Users Section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>👥 Users & Tiffin Members</Text>
          <Text style={s.sectionHint}>
            Every user added here can log in and appears in the monthly summary automatically.
          </Text>

          {users.length === 0 ? (
            <Text style={s.emptyText}>No users yet</Text>
          ) : (
            users.map((u) => (
              <View key={u.name} style={s.userRow}>
                <View style={s.userAvatar}>
                  <Text style={s.userAvatarText}>{u.name[0]}</Text>
                </View>
                <View style={s.userInfo}>
                  <Text style={s.userName}>{u.name}</Text>
                  <Text style={s.userMeta}>@{u.name.toLowerCase()} · member</Text>
                </View>
                <TouchableOpacity style={s.removeBtn} onPress={() => removeUser(u.name)}>
                  <Text style={s.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={s.divider} />
          <Text style={s.subLabel}>ADD NEW USER</Text>

          <TextInput
            style={s.input}
            placeholder="Name"
            placeholderTextColor={C.muted}
            value={newUserName}
            onChangeText={setNewUserName}
            autoCapitalize="words"
          />

          <View style={[s.inputRow, { marginTop: 8 }]}>
            <TextInput
              style={s.inputFlex}
              placeholder="Password"
              placeholderTextColor={C.muted}
              value={newUserPass}
              onChangeText={setNewUserPass}
              secureTextEntry={!showNewPass}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowNewPass(!showNewPass)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              {showNewPass ? <EyeOff color={C.muted} /> : <EyeOpen color={C.muted} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.saveBtn, loadingUsers && { opacity: 0.6 }]}
            onPress={addUser}
            disabled={loadingUsers}
          >
            {loadingUsers
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Add User</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Prices Section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>💰 Tiffin Prices</Text>

          <Text style={s.inputLabel}>Full Tiffin (₹)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={fullPrice}
            onChangeText={setFullPrice}
            placeholderTextColor={C.muted}
          />

          <Text style={s.inputLabel}>Half Tiffin (₹)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={halfPrice}
            onChangeText={setHalfPrice}
            placeholderTextColor={C.muted}
          />

          <TouchableOpacity
            style={[s.saveBtn, savingPrices && { opacity: 0.6 }]}
            onPress={savePrices}
            disabled={savingPrices}
          >
            <Text style={s.saveBtnText}>{savingPrices ? 'Saving…' : 'Save Prices'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutFullBtn} onPress={logout}>
          <Text style={s.logoutFullText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
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
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 18 },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#fee2e2',
  },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },

  container: { padding: 20, paddingBottom: 48 },

  section: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4,
  },
  sectionHint: { fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 18 },
  subLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  emptyText: { color: C.muted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  userAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.accentSoft, alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  userAvatarText: { fontSize: 15, fontWeight: '800', color: C.accent },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: C.text },
  userMeta: { fontSize: 11, color: C.muted, marginTop: 1 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 11, color: '#dc2626', fontWeight: '800' },

  input: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    padding: 13, fontSize: 15, color: C.text,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    paddingRight: 4,
  },
  inputFlex: { flex: 1, padding: 13, fontSize: 15, color: C.text },
  eyeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  inputLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 0.8, marginBottom: 6, marginTop: 12,
  },
  saveBtn: {
    backgroundColor: C.accent, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  logoutFullBtn: {
    borderWidth: 1.5, borderColor: '#fca5a5',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  logoutFullText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});