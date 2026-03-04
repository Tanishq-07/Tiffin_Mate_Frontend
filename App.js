import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddOrderScreen from './screens/AddOrderScreen';
import SummaryScreen from './screens/SummaryScreen';
import { ThemeContext, LIGHT, DARK } from './theme';

const Tab = createBottomTabNavigator();
const TAB_ICON = { 'Add Order': '➕', 'Monthly Summary': '📊' };

export default function App() {
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : LIGHT;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={{ dark, setDark, C }}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: C.card,
                borderTopColor: C.border,
                borderTopWidth: 1,
                height: 62,
                paddingBottom: 8,
                paddingTop: 6,
              },
              tabBarActiveTintColor: C.accent,
              tabBarInactiveTintColor: C.muted,
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconWrap, focused && { backgroundColor: C.accentSoft }]}>
                  <Text style={{ fontSize: 16 }}>{TAB_ICON[route.name]}</Text>
                </View>
              ),
            })}
          >
            <Tab.Screen name="Add Order" component={AddOrderScreen} />
            <Tab.Screen name="Monthly Summary" component={SummaryScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconWrap: { padding: 4, borderRadius: 8 },
});