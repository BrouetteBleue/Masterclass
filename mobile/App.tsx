import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import WrapperComponent from './components/WrapperComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createDatabase} from './functions/create';
import {CurrentUrlProvider} from './hooks/useCurrentUrl';
import Constants from 'expo-constants';

export default function App() {
  console.log(Constants.systemFonts);
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
        <StatusBar />
        <CurrentUrlProvider>
          <WrapperComponent />
        </CurrentUrlProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
