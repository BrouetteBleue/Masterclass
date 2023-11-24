// WrapperComponent to display the media player over all the screens
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import BottomTab from './BottomTab';
import MediaPlayer from './MediaPlayer';
import {useCurrentUrl } from '../hooks/useCurrentUrl';
import { NavigationProvider } from '../hooks/useHeaderContext';

const WrapperComponent = () => {
  const { currentUrl, setCurrentUrl } = useCurrentUrl();

  return (
    <>
      <NavigationProvider>
        <BottomTab /> 
      </NavigationProvider> 
      <SafeAreaView style={{flex:1, position:"absolute", top:0, left: 0, marginTop:50}}>
          {currentUrl && (
          <MediaPlayer
            uri={currentUrl}
            onClose={() => setCurrentUrl(null)}
          />
        )}
      
      </SafeAreaView>
    </>
  );
};

export default WrapperComponent;