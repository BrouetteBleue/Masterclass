// WrapperComponent to display the media player over all the screens
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import BottomTab from './BottomTab';
import MediaPlayer from './MediaPlayer';

const WrapperComponent = () => {
  const [selectedUrl, setSelectedUrl] = useState(null);

  return (
    <>
      <BottomTab setSelectedUrl={setSelectedUrl} /> 
      <SafeAreaView style={{flex:1, position:"absolute", top:0, left: 0}}>
          {selectedUrl && (
          <MediaPlayer
            url={selectedUrl}
            onClose={() => setSelectedUrl(null)}
          />
        )}
      
      </SafeAreaView>
    </>
  );
};

export default WrapperComponent;