import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import HomeScreen from './screens/HomeScreen';
import WebScreen from './screens/WebScreen';

export default function App() {
  const Tab = createBottomTabNavigator();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator  screenOptions={{
              headerShown: false,
            }}>
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="WebTab" component={WebScreen} />
            {/* <Tab.Screen name="SettingsTab" component={NativeStackNavigatorExample} options={{ unmountOnBlur:true}}/> */}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}