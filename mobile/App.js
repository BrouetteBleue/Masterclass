import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput, Button, Alert, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Video , Audio } from 'expo-av';
import { debounce } from 'lodash';


export default function App() {
  const [uri, setUri] = useState('https://m.soundcloud.com/');
  const [textInputValue, setTextInputValue] = useState('');
  const webViewRef = useRef(null);
  const [prevUrl, setPrevUrl] = useState('');


  const handleButtonPress = () => {
    setUri(textInputValue);
  };

  const debouncedOnMessage = debounce((data) => {

    console.log('Message reçu :', data);

    if (data.action == 'play' || data.action == 'load') {
      Alert.alert('Vidéo détectée', 'Voulez-vous télécharger cette vidéo?', [
        { text: 'Oui', onPress: () => {

          console.log('Téléchargement en cours...');
      

      const cleanFileName = (fileName) => {
        return fileName.replace(/[^a-zA-Z0-9]/g, '_');
      }

      const downloadFile = async () => {

        if(uri.includes('soundcloud')){
          const cleanedTitle = cleanFileName(data.title);
          const url = `http://192.168.1.34:3000/convert?url=${encodeURIComponent(data.url)}&title=${cleanedTitle}`;
          const fileUri = `${FileSystem.documentDirectory}/${cleanedTitle}.mp3`;
        
          const response = await fetch(url);
          const blob = await response.blob();
          
          const reader = new FileReader();
          reader.onload = async function() {
            const base64data = reader.result.split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });
          };
          reader.readAsDataURL(blob);
          console.log(`Fichier téléchargé et sauvegardé à ${fileUri}`);
        }
        else{
            const url = data.url;
            const cleanedTitle = cleanFileName(data.title);
            const fileUrl = FileSystem.documentDirectory + `/${cleanedTitle}.mp4`;
              
            const download = FileSystem.createDownloadResumable(url,fileUrl);
          
            const { url: downloadedUrl } = await download.downloadAsync();
            console.log(`Fichier téléchargé et sauvegardé à ${downloadedUrl}`);

            // convertMedia(downloadedUrl);
        }
       
          
      };

          downloadFile();

          }
          
        },
        { text: 'Non', onPress: () => console.log('Téléchargement annulé.') },
      ]);
    }
  }, 500); // Attend 500ms avant d'exécuter

  const onMessageHandler = (event) => {
    // console.log('Message reçu :', event.nativeEvent.data);
    debouncedOnMessage(JSON.parse(event.nativeEvent.data));
  };

  let currentUrl = '';
  let lastHlsUrl = ''; // Stocke la dernière URL HLS
  let currentTitle = '';
let isMusicAlreadyPlayed = false;
  
  const runFirst = `
  (function() {
   let hlsUrls = [];// tableau pour stocker les urls car a chaque navigation elles restent en mémoire et le code récupère la première url qu'il trouve, donc on stocke les urls dans un tableau et on récupère la dernière
   isMusicAlreadyPlayed = false;
   
     
// Fonction pour envoyer des données
    function sendData(action, url, title) {
      const data = { "action" : action, "url" : url, "title" : title }; // l'objet a renvoyer
      window.ReactNativeWebView.postMessage(JSON.stringify(data)); // on envoie l'objet en string (la fonction reçoit une string)
    }
  function checkAndSendData(action) {
    // isNewMusicLoaded = true;
    if (lastHlsUrl && currentTitle) {

      if(currentTitle !== getTitleElement().innerText){
        currentTitle = getTitleElement().innerText;
      }

      window.ReactNativeWebView.postMessage("Action :"+ action +"Dernière URL HLS"+currentUrl + "AAAAAAAAAAAAAAAAAAAAA"+ currentTitle);
        lastHlsUrl = '';  // Réinitialisez pour le prochain
      //  currentTitle = ''; // Réinitialisez pour le prochain
      isMusicAlreadyPlayed = true;
    }

    else if (action == "click bouton play" && isMusicAlreadyPlayed) {
      // Envoyez des données seulement si la musique a déjà été jouée
      window.ReactNativeWebView.postMessage("Action :"+ action +"Dernière URL HLS"+currentUrl + "AAAAAAAAAAAAAAAAAAAAA"+ currentTitle);
    }
  }

   let requestCounter = 0; // Compteur pour les requêtes

     // Surcharge la méthode open de XMLHttpRequest pour obtenir l'URL HLS
    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this._requestId = ++requestCounter;
      this.addEventListener('load', function() {  // on ajoute un event listener sur le chargement de la page
        if (this.responseURL.includes('hls')) {  // on guette la requete qui contient l'url du son
          hlsUrls.push(this.responseURL);  // ajoute à la liste
          lastHlsUrl = hlsUrls[hlsUrls.length - 1];  // prend toujours le dernier
          currentUrl = hlsUrls[hlsUrls.length - 1];
          //  window.ReactNativeWebView.postMessage("Dernière URL HLS"+lastHlsUrl+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA Nouvelle instance de XMLHttpRequest:"+ this._requestId + "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" + getTitleElement().innerText);
           checkAndSendData("Check des requetes");
          
        }
      });
      open.apply(this, arguments);
    };

    
  
    // Fonction pour obtenir le titre
    function getTitleElement() {
      return document.querySelector('[class*="soundTitle__title"] span') || document.querySelector('.PlayableHeader_Title__DndQM'); // la classe du titre change en fonction de la plateforme (web ou mobile)
    }
    
    // Observer spécifique pour le titre
    const titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => { // pour chaque mutation
        if (mutation.addedNodes && mutation.addedNodes.length > 0) { // si un noeud a été ajouté
          for (let i = 0; i < mutation.addedNodes.length; i++) { // pour chaque noeud ajouté
            const node = mutation.addedNodes[i]; // on recupere le noeud
            if (node.querySelector && (node.querySelector('[class*="soundTitle__title"] span') || node.querySelector('.PlayableHeader_Title__DndQM'))) { // si le noeud contient le titre
              // Le titre a été ajouté, envoyer les données.
              // sendData('load', lastHlsUrl, getTitleElement().innerText);
              currentTitle = getTitleElement().innerText; // avant cette ligne le titre est vide
              // window.ReactNativeWebView.postMessage("le Titre 2"+lastHlsUrl);
              isMusicAlreadyPlayed = false;
              setTimeout(() => {
                checkAndSendData("title obserever");
                isMusicAlreadyPlayed = true;
              }, 2000);
              // currentUrl = '';
            }
          }
        }
      });
    });

    let buttonHandlers = {};
    
    // Fonction pour attacher un écouteur d'événement click aux boutons de contrôle
    function attachClickListenerToControlButtons() {
      const buttons = document.querySelectorAll('[class*="ControlButton"]'); 
      buttons.forEach((button, index) => {  // pr chaque bouton de controle

        if (buttonHandlers[index]) {
          button.removeEventListener('click', buttonHandlers[index]);
        }

           buttonHandlers[index] = function() {
              const svgElement = button.querySelector('svg'); // on recupere le svg a l'intérieur du bouton
              if (svgElement && svgElement.classList.contains('ControlButton_PlayButtonIcon__2BcGf')) { // si le svg contient la classe play
                  const titleElement = getTitleElement();
                // sendData('play', lastHlsUrl, titleElement ? titleElement.innerText : ''); // le titre peut etre dans une balise span en fonction de la plateforme 
                //  window.ReactNativeWebView.postMessage("Dernière URL HLS"+currentUrl);
                // if (isNewMusicLoaded) {
                  setTimeout(() => {
                    checkAndSendData("click bouton play");
                  }, 2000);
                // }
              }
              // if (svgElement && svgElement.classList.contains('ControlButton_PauseButtonIcon__1uSsq')) { 
              //   isNewMusicLoaded = true;
              // }
            }

            button.addEventListener('click', buttonHandlers[index]);
      });
    }
    
    window.addEventListener('hashchange', function() {
      isMusicAlreadyPlayed = false; // Réinitialisez la variable lors de la navigation
    });
  
    // Initier l'observation du titre
    titleObserver.observe(document.body, { childList: true, subtree: true });
  
    // Attache les écouteurs d'événements initialement
    attachClickListenerToControlButtons();
  
    // Observer pour les changements dans le DOM
    const observer = new MutationObserver(() => {
      attachClickListenerToControlButtons();
    });
    
    // Démarrer l'observation
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
  `;
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

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    if (url !== prevUrl) {
      console.log("La derniere url de requete est :", lastHlsUrl);
      console.log("L'URL actuelle est :", currentUrl);
      lastHlsUrl = '';
      currentTitle = '';
      currentUrl = '';
      isMusicAlreadyPlayed = false;
      console.log("Réinitialisation de lastHlsUrl il vaut : "+lastHlsUrl);
      // console.log("url de musique : "+hlsUrls);
      console.log("L'URL actuelle est :", url);
      setPrevUrl(url);
    }

    // Réinjecte le JavaScript lorsque la navigation change
    webViewRef.current?.injectJavaScript(runFirst);
  };

  const onDebugMessageHandler = (event) => {
    console.log("Message du WebView:", event.nativeEvent.data);
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
        // onMessage={onMessageHandler}
        onMessage={onDebugMessageHandler}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={['*']}
        // userAgent="Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.3"
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        allowsInlineMediaPlayback={true} // c'est ces 2 lignes qui permettent de lire les vidéos sans le plein écran forcé
        mediaPlaybackRequiresUserAction={false} 
      />
    </SafeAreaView> 
  );


















































 //  🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡

    // const [mediaFiles, setMediaFiles] = useState([]);
    // const [sound, setSound] = useState(null);

    // useEffect(() => {
    //   const fetchFiles = async () => {
    //     const dir = FileSystem.documentDirectory;
    //     const files = await FileSystem.readDirectoryAsync(dir);
    //     setMediaFiles(files.filter(file => file.endsWith('.mp4') || file.endsWith('.mp3')));
    //   };

    //   fetchFiles();
    // }, []);

    // const playSound = async (uri) => {
    //   if (sound) {
    //     await sound.unloadAsync();
    //   }
    //   const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    //   setSound(newSound);
    //   await newSound.playAsync();
    // };
  
    // return (
    //   <View>
    //     <FlatList
    //       data={mediaFiles}
    //       keyExtractor={(item) => item}
    //       renderItem={({ item }) => (
    //         <View>
    //           <Text>{item}</Text>
    //           {item.endsWith('.mp3') ? (
    //             <Button title="Play Audio" onPress={() => playSound(`${FileSystem.documentDirectory}${item}`)} />
    //           ) : (
    //             <Video
    //               source={{ uri: `${FileSystem.documentDirectory}${item}` }}
    //               rate={1.0}
    //               volume={1.0}
    //               isMuted={false}
    //               resizeMode="cover"
    //               shouldPlay={false}
    //               style={{ width: 300, height: 300 }}
    //             />
    //           )}
    //         </View>
    //       )}
    //     />
    //   </View>
    // );
  
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

