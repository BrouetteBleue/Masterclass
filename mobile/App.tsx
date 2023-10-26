import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import BottomTab from './components/BottomTab';
import WrapperComponent from './components/WrapperComponent';

export default function App() {
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
          <StatusBar style="auto" />
          <WrapperComponent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}