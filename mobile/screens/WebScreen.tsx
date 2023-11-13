import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput,Button, Modal, Alert, FlatList, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Linking, NativeModules } from 'react-native';
import { Video , Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';
import { debounce } from 'lodash';
import { insertFile } from '../functions/create';
import { fetchFiles, getFolderInfo } from '../functions/read';
import FileThumbnail from '../components/FileThumnail';
import PlayerBtn from '../components/Buttons/PlayerBtn';


export default function WebScreen() {
  const [uri, setUri] = useState('https://m.youtube.com/');
  const [textInputValue, setTextInputValue] = useState('');
  const webViewRef = useRef(null);
  const [prevUrl, setPrevUrl] = useState('');
  const [isMessageProcessing, setIsMessageProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [directoryModalVisible, setDirectoryModalVisible] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height -90;
  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    name: null,
    parentId: null,
    path: null
  });
  const [folders, setFolders] = useState([]);
  const [mediaInfos, setMediaInfos] = useState({url: '', title: ''});
  const [pendingUrl, setPendingUrl] = useState(null);
  const { WebViewBridge } = NativeModules;


  const loadFolders = async (folderId) => {
    const fetchedFolders = await fetchFiles(folderId, "folders");
    setFolders(fetchedFolders);

    console.log("Dossier actuel:", currentFolder);
    
  };

  const handleFolderClick = async (folderId) => {
    const folderInfo = await getFolderInfo(folderId);
    setCurrentFolder({ id: folderId, parentId: folderInfo.parent_id, name: folderInfo.name, path: folderInfo.path });
    await loadFolders(folderId);
  };

  const handleBackClick = async () => {
    if (currentFolder.parentId !== null) {
      const parentFolderInfo = await getFolderInfo(currentFolder.parentId);
      setCurrentFolder({ id: parentFolderInfo.id, parentId: parentFolderInfo.parent_id, name: parentFolderInfo.name, path: parentFolderInfo.path });
      await loadFolders(parentFolderInfo.id);
    } else {
      setCurrentFolder({ id: null, parentId: null, name: "Racine", path: FileSystem.documentDirectory });
      await loadFolders(null);
    }
  };
  
  useEffect(() => {
    if (directoryModalVisible) {
      loadFolders(currentFolder.id);
    }
  }, [directoryModalVisible, currentFolder.id]);


  const closeWebViewTransaction = () => {
    setDirectoryModalVisible(false);
    setModalVisible(false);
    setIsMessageProcessing(false);
  }

  const handleDownload = async (url) => {
    console.log("Téléchargement du média" + url);

    const cleanedTitle = mediaInfos.title.replace(/[^a-zA-Z0-9]/g, '');
    let directory = currentFolder.path || FileSystem.documentDirectory;
    const extension = uri.includes('soundcloud') ? '.mp3' : '.mp4';
    let fileUri = `${directory}${cleanedTitle}${extension}`;

    // verify if file already exists
    let counter = 1;
    while (await FileSystem.getInfoAsync(fileUri).then(info => info.exists)) {
      fileUri = `${directory}${cleanedTitle}(${counter})${extension}`;
      counter++;
    }


    if(uri.includes('soundcloud')){
      const url = `http://192.168.1.34:3000/convert?url=${encodeURIComponent(mediaInfos.url)}&title=${cleanedTitle}`;
      const response = await fetch(url);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = async function() {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          convertMedia(fileUri, mediaInfos.title, cleanedTitle+'.mp3');
        } 
      };
      reader.readAsDataURL(blob);
      console.log(`Fichier téléchargé et sauvegardé à ${fileUri}`);
      
      closeWebViewTransaction();
    }
    else {
      try {
        const download = FileSystem.createDownloadResumable(mediaInfos.url, fileUri);
        const { uri: downloadedUrl } = await download.downloadAsync();
        console.log(`Fichier téléchargé et sauvegardé à ${downloadedUrl}`);
        
        convertMedia(downloadedUrl, mediaInfos.title, cleanedTitle+'.mp4');
        closeWebViewTransaction();
      } catch (error) {
        console.log(`Erreur: ${error}`);
      }
    }
  };


  const convertMedia = async (uri, name,cleanedTitle) => {
    try {
      console.log("URI:", uri);
      const extension = uri.split('.').pop();
      let duration = 0;
  
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      const status = await newSound.getStatusAsync();

      if (status.isLoaded) {
        const { durationMillis } = status; 
        duration = durationMillis / 1000;
      }
       
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });

      const date = new Date().toISOString().split('T')[0];
      if (fileInfo.exists && !fileInfo.isDirectory) {

        const data = {
          name: name,
          file_name: cleanedTitle,
          folder_id: currentFolder.id || null,
          date: date,
          duration: duration,
          size: fileInfo.size,
          extension: extension
        }

        insertFile(data).then((caca) => {
          console.log("Fichier inséré");
        }).catch((error) => {
          console.log("Erreur lors de l'insertion du fichier:", error);
        });
      }else{
        console.log("Le fichier n'existe pas");
      }
      
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
    console.log('Message reçu :', data);

    setIsMessageProcessing(true);
    setMediaInfos({url: data.url ,title: data.title});
    setModalVisible(true);
   
  }, 500); // Attend 500ms avant d'exécuter

  const onMessageHandler = (event) => {
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





// trouve un moyen pas trop chiant de ranger les 2 scripts dans 2 fichiers différents





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
  const askUserForNavigationChoice = (url) => {
    return new Promise((resolve) => {
      Alert.alert(
        'Ouvrir le lien',
        "Voulez-vous ouvrir ce lien dans l'application YouTube ou continuer dans le WebView?",
        [
          { text: 'Dans l\'application', onPress: () => resolve('app') },
          { text: 'Dans WebView', onPress: () => resolve('webView') },
        ],
        { cancelable: false }
      );
    });
  };

  const handleNavigationStateChange = async (navState) => {
    let url = navState.url;

    if (url !== prevUrl) {
      console.log("La derniere url de requete est :", lastHlsUrl);
      console.log("L'URL actuelle est :", currentUrl);
      lastHlsUrl = '';
      currentTitle = '';
      currentUrl = '';
      isMusicAlreadyPlayed = false;
      console.log("Réinitialisation de lastHlsUrl il vaut : "+lastHlsUrl);
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
        ref={webViewRef}
        source={{ uri }}
        style={{ flex: 5, backgroundColor: 'green' }}
        injectedJavaScript={uri.includes('soundcloud') ? SoundcloudJavascript : (uri.includes('youtube') ? YoutubeJavascript : null)}
        onMessage={onMessageHandler}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false} 
        setSupportMultipleWindows={false}
        startInLoadingState={true}
       
      />

      {/* PAS BESOIN DE STACK NAVIGATOR TU RELOAD JUSTE AU CLICK */}
  
      {modalVisible && (
        <View style={{
          position: 'absolute',
          left: '50%',
          top: '90%',
          transform: [{ translateX: -160 }, { translateY: -100 }],
          backgroundColor: 'darkgray',
          width: 320,
          height: 100,
          zIndex: 9999
        }}>
          <Text>Voulez-vous télécharger ce média ?</Text>
          <Button title="Télécharger" onPress={() => setDirectoryModalVisible(true)} />
          <Button title="Fermer" onPress={() => {setModalVisible(false); setIsMessageProcessing(false)}} />
        </View>
      )}
      {directoryModalVisible && (
        <Modal animationType='slide' transparent={true}>
          <View 
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 22,
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
            }}
          >
            <View 
              style={{
                width: windowWidth, // Largeur du contenu du modal
                height: "100%", // Hauteur du contenu du modal
                backgroundColor: '#292929', // Couleur de fond du contenu
                borderRadius: 10, // Bordures arrondies
                paddingVertical: 20, // Espace interne
                alignItems: 'center', // Centrer horizontalement le contenu
                shadowColor: '#000', // Ombre
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5
              }}
            >

              <View style={{borderBottomWidth:2 , paddingBottom:6, width:"100%"}}>
                <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>Nom du fichier : </Text>
                <TextInput value={mediaInfos.title} style={{borderWidth:2, width:300}}/>
              </View>





              <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>Choisissez un dossier</Text>
              
              <View style={{width: "100%", height: "60%", backgroundColor:"red",alignItems: 'center',justifyContent: 'flex-start',flexDirection: 'row',flexWrap: 'wrap',padding: 10,}}>

                <View style={{width: "100%", height: "10%", backgroundColor:"blue", flexDirection:"row", alignItems:"center"}}>
                  <PlayerBtn 
                      onPress={() => handleBackClick()}
                      size={30}
                      svgPaths={["M11.67 3.87L9.9 2.1L0 12l9.9 9.9l1.77-1.77L3.54 12z"]}
                      style={{ borderRadius: 100, marginLeft: 20 }}
                      fill='#2F7CF6'
                  />
                  <Text>{currentFolder.id ? currentFolder.name : 'Racine'}</Text>
                </View>
                {folders.map((item) => {
                    return (
                      <React.Fragment key={item.id}>
                        <FileThumbnail data={item} onSelect={() => handleFolderClick(item.id)} /> 
                      </React.Fragment>
                      
                    );
                  }               
                )}
                
              </View>
              
              <View>
                <Pressable onPress={() => handleDownload(currentUrl)}><Text>Télécharger ici</Text></Pressable>
                <Pressable onPress={() => setDirectoryModalVisible(false)}><Text>Fermer</Text></Pressable>
              </View>

              
            </View>
          </View>
        </Modal>
      )}
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
