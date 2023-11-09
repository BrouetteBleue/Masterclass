import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput, Button, Alert, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Video , Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';
import { debounce } from 'lodash';
import { insertFile } from '../functions/create';


export default function WebScreen() {
  const [uri, setUri] = useState('https://m.soundcloud.com/');
  const [textInputValue, setTextInputValue] = useState('');
  const webViewRef = useRef(null);
  const [prevUrl, setPrevUrl] = useState('');
  const [isMessageProcessing, setIsMessageProcessing] = useState(false);


  const convertMedia = async (uri, name,cleanedTitle) => {
    try {
      console.log("URI:", uri);
      const extension = uri.split('.').pop();
      console.log("Extension:", extension);
      let duration = 0;
  
        console.log("Création du son...");
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        console.log("Son créé");
        const { durationMillis } = await newSound.getStatusAsync();
        duration = durationMillis / 1000;
        console.log("Durée du son:", duration);

      
      console.log("Obtention des informations du fichier...");
      const size = await FileSystem.getInfoAsync(uri, { size: true });
      const date = new Date().toISOString().split('T')[0];
    
      console.log("Ouverture de la base de données...");
      const db = SQLite.openDatabase('files.db');

      const data = {
        name: name,
        file_name: cleanedTitle,
        folder_id: null,
        date: date,
        duration: duration,
        size: size.size,
        extension: extension
      }

      insertFile(data).then((caca) => {
        console.log("Fichier inséré");
      }).catch((error) => {
        console.log("Erreur lors de l'insertion du fichier:", error);
      });
      
    } catch (error) {
      console.error("Erreur :", error);
    }
  };







  const handleButtonPress = () => {
    setUri("https://www.google.com/search?q="+textInputValue);
  };

  const debouncedOnMessage = debounce((data) => {
    if (isMessageProcessing) {
      console.log('Message ignoré :', data);
      return;
    }
    setIsMessageProcessing(true);
    console.log('Message reçu :', data);

    // if (data.action == 'play' || data.action == 'load') {
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
              const fileUri = `${FileSystem.documentDirectory}${cleanedTitle}.mp3`;
            
              const response = await fetch(url);
              const blob = await response.blob();
              
              const reader = new FileReader();
              reader.onload = async function() {
                const base64data = reader.result.split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64data, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                convertMedia(fileUri, data.title, cleanedTitle+'.mp3');
              };
              reader.readAsDataURL(blob);
              console.log(`Fichier téléchargé et sauvegardé à ${fileUri}`);
              
              
              setIsMessageProcessing(false);
            }
            else {
              try {
                const url = data.url;
                const cleanedTitle = cleanFileName(data.title);
                const fileUrl = `${FileSystem.documentDirectory}${cleanedTitle}.mp4`;
                  
                const download = FileSystem.createDownloadResumable(url, fileUrl);
                
                const { uri: downloadedUrl } = await download.downloadAsync();
                console.log(`Fichier téléchargé et sauvegardé à ${downloadedUrl}`);
                
                convertMedia(downloadedUrl, data.title, cleanedTitle+'.mp4');
                setIsMessageProcessing(false);
              } catch (error) {
                console.log(`Erreur: ${error}`);
              }
            }
          };
          downloadFile();
        }    
      },
      { text: 'Non', onPress: () => {
          console.log('Téléchargement annulé.');
          setIsMessageProcessing(false);
        } 
      }
      ]);
    // }
  }, 500); // Attend 500ms avant d'exécuter

  const onMessageHandler = (event) => {
    // console.log('Message reçu :', event.nativeEvent.data);
    debouncedOnMessage(JSON.parse(event.nativeEvent.data));
  };

  let currentUrl = '';
  let lastHlsUrl = ''; // Stocke la dernière URL HLS
  let currentTitle = '';
  let isMusicAlreadyPlayed = false;
  
  const SoundcloudJavascript = `
  (function() {
   let hlsUrls = []; // tableau pour stocker les urls car a chaque navigation elles restent en mémoire et le code récupère la première url qu'il trouve, donc on stocke les urls dans un tableau et on récupère la dernière
   isMusicAlreadyPlayed = false; // variable pour savoir si la musique a déjà été jouée pour activer le click sur le bouton play
   
     
// Fonction pour envoyer des données
    function sendData(action, url, title) {
      const data = { "action" : action, "url" : url, "title" : title }; // l'objet a renvoyer
      window.ReactNativeWebView.postMessage(JSON.stringify(data)); // on envoie l'objet en string (la fonction reçoit une string)
    }

  function checkAndSendData(action) {
    if (lastHlsUrl && currentTitle) { // si on a la derniere url et le titre

      // une dernière vérification pour être sur que le titre est bien le bon
      if(currentTitle !== getTitleElement().innerText){ 
        currentTitle = getTitleElement().innerText;
      }

      // window.ReactNativeWebView.postMessage("Action :"+ action +"Dernière URL HLS"+currentUrl + "AAAAAAAAAAAAAAAAAAAAA"+ currentTitle);

      sendData(action, lastHlsUrl, currentTitle); // on envoie les données
      lastHlsUrl = '';  // Réinitialisez l'url pour le prochain son (pour éviter de renvoyer la même url)
      isMusicAlreadyPlayed = true;
    }

    // le click sur le bouton play est détecté mais la musique a déjà été jouée
    else if (action == "click bouton play" && isMusicAlreadyPlayed) { 
      // Envoyez des données seulement si la musique a déjà été jouée
      // window.ReactNativeWebView.postMessage("Action :"+ action +"Dernière URL HLS"+currentUrl + "AAAAAAAAAAAAAAAAAAAAA"+ currentTitle);
      sendData(action, currentUrl, currentTitle);
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
          setTimeout(() => {
            checkAndSendData("Check des requetes");
          }, 2000);
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
              
              currentTitle = getTitleElement().innerText; // avant cette ligne le titre est vide
              // sendData('load', lastHlsUrl, getTitleElement().innerText);

              isMusicAlreadyPlayed = false; // ce code se trigger au chargement de la page donc le son n'est pas encore joué
              setTimeout(() => {
                checkAndSendData("title obserever");
                isMusicAlreadyPlayed = true;
              }, 2000);
            }
          }
        }
      });
    });

    let buttonHandlers = {}; // stocke les id des évènements du bouton play et pause pour pouvoir les supprimer et les réajouter à chaque changement de page
    
    // Fonction pour attacher un écouteur d'événement click aux boutons de contrôle
    function attachClickListenerToControlButtons() {
      const buttons = document.querySelectorAll('[class*="ControlButton"]'); 
      buttons.forEach((button, index) => {  // pr chaque bouton de controle

        if (buttonHandlers[index]) {
          button.removeEventListener('click', buttonHandlers[index]); // supprime l'event listener du bouton si il existe
        }

           buttonHandlers[index] = function() {
              const svgElement = button.querySelector('svg'); // on recupere le svg a l'intérieur du bouton
              if (svgElement && svgElement.classList.contains('ControlButton_PlayButtonIcon__2BcGf')) { // si le svg contient la classe play
                  const titleElement = getTitleElement();
                // sendData('play', lastHlsUrl, titleElement ? titleElement.innerText : ''); // le titre peut etre dans une balise span en fonction de la plateforme 

                  setTimeout(() => {
                    checkAndSendData("click bouton play");
                  }, 2000);
              }
              // if (svgElement && svgElement.classList.contains('ControlButton_PauseButtonIcon__1uSsq')) {   // code pour le bouton pause
              //   isNewMusicLoaded = true;
              // }
            }

            button.addEventListener('click', buttonHandlers[index]);
      });
    }
    
    window.addEventListener('hashchange', function() {
      isMusicAlreadyPlayed = false; // Réinitialise la variable lors de la navigation
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











  const YoutubeJavascript = `
  (function() {

    function sendData(action, url, title) {
      const data = { "action" : action, "url" : url, "title" : title }; // l'objet a renvoyer
      window.ReactNativeWebView.postMessage(JSON.stringify(data)); // on envoie l'objet en string (la fonction reçoit une string)
    }

    // Fonction pour obtenir le titre
    function getTitleElement() {
      return document.querySelector('[class*="metadata-title"] span');
    }

    function checkAndSendData(action) {
      if (lastHlsUrl && currentTitle && action == "play") { // si on a la derniere url et le titre
  
        // une dernière vérification pour être sur que le titre est bien le bon
        if(currentTitle !== getTitleElement().innerText){ 
          currentTitle = getTitleElement().innerText;
        }
  
        // window.ReactNativeWebView.postMessage("Action :"+ action +"Dernière URL HLS"+currentUrl + "AAAAAAAAAAAAAAAAAAAAA"+ currentTitle);
  
        sendData(action, lastHlsUrl, currentTitle); // on envoie les données
        lastHlsUrl = '';  // Réinitialisez l'url pour le prochain son (pour éviter de renvoyer la même url)
        // isMusicAlreadyPlayed = true;
      }
      else if(action == "pause"){
        // sendData(action, currentUrl, currentTitle);
      }
  
      
    }


    // Observer spécifique pour le titre
    const titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => { // pour chaque mutation
        if (mutation.addedNodes && mutation.addedNodes.length > 0) { // si un noeud a été ajouté
          for (let i = 0; i < mutation.addedNodes.length; i++) { // pour chaque noeud ajouté
            const node = mutation.addedNodes[i]; // on recupere le noeud
            if (node.querySelector && (node.querySelector('[class*="metadata-title"] span') )) { // si le noeud contient le titre
              // Le titre a été ajouté, envoyer les données.
              
              currentTitle = getTitleElement().innerText; // avant cette ligne le titre est vide
              // sendData('load', lastHlsUrl, getTitleElement().innerText);

              // isMusicAlreadyPlayed = false; // ce code se trigger au chargement de la page donc le son n'est pas encore joué
              setTimeout(() => {
                checkAndSendData("title obserever");
              }, 2000);
            }
          }
        }
      });
    });
  
    // Fonction pour ajouter des écouteurs d'événements aux éléments média (vidéo ou audio)
    function addEventListenersToMedia(mediaElements) {
      mediaElements.forEach(media => {
        media.addEventListener('play', function() {
          // window.ReactNativeWebView.postMessage('play'); // Envoi d'un message lorsque la vidéo est en lecture
          // window.ReactNativeWebView.postMessage(media.src);
          lastHlsUrl = media.src;
          currentUrl = media.src;
          setTimeout(() => {
            checkAndSendData("play");
          }, 2000);
        });
        media.addEventListener('pause', function() {
          // window.ReactNativeWebView.postMessage('pause'); // Envoi d'un message lorsque la vidéo est en pause
          setTimeout(() => {
            checkAndSendData("pause");
          }, 2000);
        });
      });
    }
  
    // Vérifie si les écouteurs d'événements ont déjà été ajoutés
    if (!window.myEventListenersAdded) {
  
      // Ajout des écouteurs aux médias déjà présents au chargement de la page
      const videos = document.querySelectorAll('video');
      addEventListenersToMedia(videos);
  
      // Création d'un observateur pour détecter les nouveaux éléments média ajoutés à la page
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(newNode => {
            if (newNode.tagName === 'VIDEO') {
              addEventListenersToMedia([newNode]); // Ajout des écouteurs au nouvel élément média
            }
          });
        });
      });

      // Initier l'observation du titre
    titleObserver.observe(document.body, { childList: true, subtree: true });
  
      // Configuration de l'observateur pour qu'il observe les modifications du DOM dans tout le document
      observer.observe(document.body, {
        childList: true, // Observe les nœuds enfants ajoutés ou supprimés
        subtree: true    // Observe également toutes les sous-arborescences
      });
  
      // Indique que les écouteurs ont été ajoutés
      window.myEventListenersAdded = true;
    }
  })();
  true; // Retourne true pour indiquer que le script a bien été exécuté
  `;

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
    if(uri.includes('soundcloud')){
      webViewRef.current?.injectJavaScript(SoundcloudJavascript);
    }else if(uri.includes('youtube')){
      webViewRef.current?.injectJavaScript(YoutubeJavascript);
    }
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
        injectedJavaScript={uri.includes('soundcloud') ? SoundcloudJavascript : (uri.includes('youtube') ? YoutubeJavascript : null)}
        onMessage={onMessageHandler}
        // onMessage={onDebugMessageHandler}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={['*']}
        // userAgent="Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.3"
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        allowsInlineMediaPlayback={true} // c'est ces 2 lignes qui permettent de lire les vidéos sans le plein écran forcé
        mediaPlaybackRequiresUserAction={false} 
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
