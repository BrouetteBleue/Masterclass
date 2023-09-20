import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput, Button, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [uri, setUri] = useState('https://reactnative.dev/');
  const [textInputValue, setTextInputValue] = useState('');
  const webViewRef = useRef(null);
  const [prevUrl, setPrevUrl] = useState('');

  const handleButtonPress = () => {
    setUri(textInputValue);
  };

  const onMessage = (event) => {
    const { data } = event.nativeEvent;
    if (data === 'play') {
      Alert.alert('Média en lecture');
    } else if (data === 'pause') {
      Alert.alert('Média en pause');
    }
  };

  // const runFirst = `
  //   const videos = document.querySelectorAll('video');
  //   const audios = document.querySelectorAll('audio');
  //   videos.forEach(video => {
  //     video.addEventListener('play', function() {
  //       window.ReactNativeWebView.postMessage('play');
  //     });
  //     video.addEventListener('pause', function() {
  //       window.ReactNativeWebView.postMessage('pause');
  //     });
  //   });
  //   audios.forEach(audio => {
  //     audio.addEventListener('play', function() {
  //       window.ReactNativeWebView.postMessage('play');
  //     });
  //     audio.addEventListener('pause', function() {
  //       window.ReactNativeWebView.postMessage('pause');
  //     });
  //   });
  //   true;
  // `;

  const runFirst = `
(function() {
  function addEventListenersToMedia(mediaElements) {
    mediaElements.forEach(media => {
      media.addEventListener('play', function() {
        window.ReactNativeWebView.postMessage('play');
      });
      media.addEventListener('pause', function() {
        window.ReactNativeWebView.postMessage('pause');
      });
    });
  }

  if (!window.myEventListenersAdded) {
    // Pour les médias déjà présents au chargement
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    addEventListenersToMedia(videos);
    addEventListenersToMedia(audios);

    // Pour les nouveaux médias ajoutés dynamiquement
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(newNode => {
          if (newNode.tagName === 'VIDEO' || newNode.tagName === 'AUDIO') {
            addEventListenersToMedia([newNode]);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.myEventListenersAdded = true;
  }
})();
true;
`;

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    if (url !== prevUrl) {
      console.log("L'URL actuelle est :", url);
      setPrevUrl(url);
    }

    // Réinjecte le JavaScript lorsque la navigation change
    webViewRef.current?.injectJavaScript(runFirst);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
      <TextInput
        style={{ flex: 0.05, backgroundColor: 'green', borderWidth: 1 }}
        onChangeText={(text) => setTextInputValue(text)}
        value={textInputValue}
      />
      <Button title="Valider" onPress={handleButtonPress} />
      <WebView
        ref={webViewRef} // Utilisation de la référence pour le WebView
        source={{ uri }}
        style={{ flex: 5, backgroundColor: 'green' }}
        injectedJavaScript={runFirst}
        onMessage={onMessage}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.3"
      />
    </SafeAreaView> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});




// quand il cherche un site il écrits => sa l'envoie sur google avec la recherche qu'il a écris