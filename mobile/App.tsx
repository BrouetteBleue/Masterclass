import React, {useEffect} from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import WrapperComponent from './components/WrapperComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDatabase } from './functions/create';

export default function App() {
  
  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        // first launch
        console.log('First launch, setting up database');
        
        await AsyncStorage.setItem('hasLaunched', 'true');
        createDatabase();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
          <StatusBar style="auto" />
          <WrapperComponent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}