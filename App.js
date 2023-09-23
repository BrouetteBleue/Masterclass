import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput, Button, Alert, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';


export default function App() {
  // const [uri, setUri] = useState('https://m.youtube.com/');
  // const [textInputValue, setTextInputValue] = useState('');
  // const webViewRef = useRef(null);
  // const [prevUrl, setPrevUrl] = useState('');

  // const handleButtonPress = () => {
  //   setUri(textInputValue);
  // };

  // const onMessage = (event) => {
  //   let  data = event.nativeEvent;
  //   console.log('Message reçu :', data);
  //   // if (data.data === 'play') {
  //     Alert.alert('Vidéo détectée', 'Voulez-vous télécharger cette vidéo?', [
  //       { text: 'Oui', onPress: () => {

  //         console.log('Téléchargement en cours...') 

  //         // const uri = data.data;
  //         // const fileUri = FileSystem.documentDirectory + `/${data.title}.mp4`;

  //         // fetch(uri)
  //         // .then(response => response.blob())
  //         // .then(blob => {
  //         //   // Faites quelque chose avec le blob

            
  //         // });
  //     // FileSystem.createDownloadResumable(
  //     //         uri,
  //     //         fileUri
  //     //       );
      

  //     const cleanFileName = (fileName) => {
  //       return fileName.replace(/[^a-zA-Z0-9]/g, '_');
  //     }

  //     const downloadFile = async () => {
  //       const uri = data.data;
  //       const cleanedTitle = cleanFileName(data.title);
  //       const fileUri = FileSystem.documentDirectory + `/${cleanedTitle}.mp4`;
          
  //           const download = FileSystem.createDownloadResumable(uri,fileUri);
          
  //           const { uri: downloadedUri } = await download.downloadAsync();
  //           console.log(`Fichier téléchargé et sauvegardé à ${downloadedUri}`);
  //         };

  //         downloadFile();

  //         }
          
  //       },
  //       { text: 'Non', onPress: () => console.log('Téléchargement annulé.') },
  //     ]);
  //   // }
  // };


  // const Download = () => {
   
  // }

  // const runFirst = `
  // (function() {
  
  //   // Fonction pour ajouter des écouteurs d'événements aux éléments média (vidéo ou audio)
  //   function addEventListenersToMedia(mediaElements) {
  //     mediaElements.forEach(media => {
  //       media.addEventListener('play', function() {
  //         window.ReactNativeWebView.postMessage('play'); // Envoi d'un message lorsque la vidéo est en lecture
  //         window.ReactNativeWebView.postMessage(media.src);
  //       });
  //       media.addEventListener('pause', function() {
  //         window.ReactNativeWebView.postMessage('pause'); // Envoi d'un message lorsque la vidéo est en pause
  //       });
  //     });
  //   }
  
  //   // Vérifie si les écouteurs d'événements ont déjà été ajoutés
  //   if (!window.myEventListenersAdded) {
  
  //     // Ajout des écouteurs aux médias déjà présents au chargement de la page
  //     const videos = document.querySelectorAll('video');
  //     const audios = document.querySelectorAll('audio');
  //     addEventListenersToMedia(videos);
  //     addEventListenersToMedia(audios);
  
  //     // Création d'un observateur pour détecter les nouveaux éléments média ajoutés à la page
  //     const observer = new MutationObserver(mutations => {
  //       mutations.forEach(mutation => {
  //         mutation.addedNodes.forEach(newNode => {
  //           if (newNode.tagName === 'VIDEO' || newNode.tagName === 'AUDIO') {
  //             addEventListenersToMedia([newNode]); // Ajout des écouteurs au nouvel élément média
  //           }
  //         });
  //       });
  //     });
  
  //     // Configuration de l'observateur pour qu'il observe les modifications du DOM dans tout le document
  //     observer.observe(document.body, {
  //       childList: true, // Observe les nœuds enfants ajoutés ou supprimés
  //       subtree: true    // Observe également toutes les sous-arborescences
  //     });
  
  //     // Indique que les écouteurs ont été ajoutés
  //     window.myEventListenersAdded = true;
  //   }
  // })();
  // true; // Retourne true pour indiquer que le script a bien été exécuté
  // `;

  // const handleNavigationStateChange = (navState) => {
  //   const { url } = navState;
  //   if (url !== prevUrl) {
  //     console.log("L'URL actuelle est :", url);
  //     setPrevUrl(url);
  //   }

  //   // Réinjecte le JavaScript lorsque la navigation change
  //   webViewRef.current?.injectJavaScript(runFirst);
  // };

  // return (
  //   <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
  //     <TextInput
  //       style={{ flex: 0.05, backgroundColor: 'green', borderWidth: 1 }}
  //       onChangeText={(text) => setTextInputValue(text)}
  //       value={textInputValue}
  //     />
  //     <Button title="Valider" onPress={handleButtonPress} />
  //     <WebView
  //       ref={webViewRef} // Utilisation de la référence pour le WebView
  //       source={{ uri }}
  //       style={{ flex: 5, backgroundColor: 'green' }}
  //       injectedJavaScript={runFirst}
  //       onMessage={onMessage}
  //       onNavigationStateChange={handleNavigationStateChange}
  //       originWhitelist={['*']}
  //       // userAgent="Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.3"
  //       userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
  //       allowsInlineMediaPlayback={true} // c'est ces 2 lignes qui permettent de lire les vidéos sans le plein écran forcé
  //       mediaPlaybackRequiresUserAction={false} 
  //     />
  //   </SafeAreaView> 
  // );


    const [videos, setVideos] = useState([]);
  
    useEffect(() => {
      const fetchVideos = async () => {
        const videoDir = FileSystem.documentDirectory;
        const files = await FileSystem.readDirectoryAsync(videoDir);
        setVideos(files.filter(file => file.endsWith('.mp4')));
        console.log(files);
      };
  
      fetchVideos();
    }, []);
  
    return (
      <View>
        <FlatList
          data={videos}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View>
              <Text>{item}</Text>
              <Video
                source={{ uri: `${FileSystem.documentDirectory}${item}` }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={true}
                style={{ width: 300, height: 300, backgroundColor: 'grey' }}
                onLoadStart={() => console.log('Chargement commencé')}
                onLoad={() => console.log('Chargement terminé')}
                onError={(e) => console.log('Erreur lors du chargement', e)}
                
                
              />
            </View>
          )}
        />
      </View>
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




