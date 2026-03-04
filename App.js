import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AddOrderScreen from './screens/AddOrderScreen';
import SummaryScreen from './screens/SummaryScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import { ThemeContext, LIGHT, DARK } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityIndicator } from 'react-native';
const Tab = createBottomTabNavigator();

const ICONS = {
  'Add Order': '➕',
  'Summary': '📊',
  'Admin': '⚙️',
};

function TabNavigator() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : LIGHT;
  const isAdmin = user?.role === 'admin';

  return (
    <ThemeContext.Provider value={{ dark, setDark, C }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopColor: C.border,
            borderTopWidth: 1,
            height: 52 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
          },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: C.accentSoft }]}>
              <Text style={{ fontSize: 16 }}>{ICONS[route.name]}</Text>
            </View>
          ),
        })}
      >
        {/* Members see Add Order + Summary */}
        {!isAdmin && <Tab.Screen name="Add Order" component={AddOrderScreen} />}

        {/* Everyone sees Summary */}
        <Tab.Screen name="Summary" component={SummaryScreen} />

        {/* Only admin sees Admin tab */}
        {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} />}
      </Tab.Navigator>
    </ThemeContext.Provider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fc' }}>
        <ActivityIndicator size="large" color="#5b6af0" />
      </View>
    );
  }

  return user ? <TabNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconWrap: { padding: 4, borderRadius: 8 },
});