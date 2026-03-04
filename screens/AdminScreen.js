import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

export default function AdminScreen() {
  const { C, dark, setDark } = useTheme();
  const { user, logout } = useAuth();
  const s = makeStyles(C);

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
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
      `Remove ${name}?\n\nThey won't be able to log in and will be removed from the monthly summary.`,
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

        {/* Users = Tiffin Members */}
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
                  <Text style={s.userMeta}>Can login · shown in summary</Text>
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
          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="Password"
            placeholderTextColor={C.muted}
            value={newUserPass}
            onChangeText={setNewUserPass}
            secureTextEntry
          />
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

        {/* Prices */}
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
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fee2e2' },
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
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
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