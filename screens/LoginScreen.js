import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

// Eye open SVG icon
const EyeOpen = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
      stroke="#9094b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke="#9094b0" strokeWidth="2" />
  </Svg>
);

// Eye closed SVG icon
const EyeOff = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0120.49 16.1M14.12 14.12A3 3 0 119.88 9.88"
      stroke="#9094b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke="#9094b0" strokeWidth="2" strokeLinecap="round"
    />
  </Svg>
);

// ✅ Defined OUTSIDE component so it never remounts on re-render
const PasswordInput = ({ value, onChange, placeholder, show, onToggle }) => (
  <View style={s.inputRow}>
    <TextInput
      style={s.inputFlex}
      placeholder={placeholder}
      placeholderTextColor="#b0b7c3"
      value={value}
      onChangeText={onChange}
      secureTextEntry={!show}
      autoCapitalize="none"
    />
    <TouchableOpacity
      style={s.eyeBtn}
      onPress={onToggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.6}
    >
      {show ? <EyeOff /> : <EyeOpen />}
    </TouchableOpacity>
  </View>
);

export default function LoginScreen() {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = (newTab) => {
    setTab(newTab);
    setName('');
    setPassword('');
    setConfirmPassword('');
    setShowPass(false);
    setShowConfirmPass(false);
  };

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter name and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, { name: name.trim(), password });
      login({ name: res.data.name, role: res.data.role, token: res.data.token });
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, { name: name.trim(), password });
      login({ name: res.data.name, role: res.data.role, token: res.data.token });
    } catch (err) {
      Alert.alert('Sign Up Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fc" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >

          <View style={s.logoArea}>
            <Text style={s.logo}>🍱</Text>
            <Text style={s.appName}>Tiffin Mate</Text>
            <Text style={s.appSub}>Track your daily tiffin orders</Text>
          </View>

          <View style={s.tabBar}>
            <TouchableOpacity style={[s.tabBtn, tab === 'login' && s.tabBtnActive]} onPress={() => reset('login')}>
              <Text style={[s.tabBtnText, tab === 'login' && s.tabBtnTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tabBtn, tab === 'signup' && s.tabBtnActive]} onPress={() => reset('signup')}>
              <Text style={[s.tabBtnText, tab === 'signup' && s.tabBtnTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.label}>NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Your name"
              placeholderTextColor="#b0b7c3"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={s.label}>PASSWORD</Text>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Password"
              show={showPass}
              onToggle={() => setShowPass(!showPass)}
            />

            {tab === 'signup' && (
              <>
                <Text style={s.label}>CONFIRM PASSWORD</Text>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  show={showConfirmPass}
                  onToggle={() => setShowConfirmPass(!showConfirmPass)}
                />
              </>
            )}

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.6 }]}
              onPress={tab === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>
                {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.hint}>
            {tab === 'login'
              ? "Don't have an account? Tap Sign Up or ask your admin."
              : 'Already have an account? Tap Sign In.'}
          </Text>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fc' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 60, marginBottom: 10 },
  appName: { fontSize: 30, fontWeight: '900', color: '#1a1d2e', letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#eceeff',
    borderRadius: 14, padding: 4, marginBottom: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#9094b0' },
  tabBtnTextActive: { color: '#5b6af0', fontWeight: '800' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: '#e5e7f0', marginBottom: 16,
  },
  label: {
    fontSize: 10, fontWeight: '700', color: '#b0b7c3',
    letterSpacing: 1.2, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: '#f7f8fc', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e5e7f0',
    padding: 13, fontSize: 15, color: '#1a1d2e',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f7f8fc', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e5e7f0',
    paddingRight: 4,
  },
  inputFlex: { flex: 1, padding: 13, fontSize: 15, color: '#1a1d2e' },
  eyeBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  btn: {
    backgroundColor: '#5b6af0', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 12, color: '#9094b0', lineHeight: 18 },
});