import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  Share,
  TouchableOpacity,
  TextInput,
  Button,
  Modal,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import {WebView} from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import {debounce, last} from 'lodash';
import Sound from 'react-native-sound';
import {insertFile, FileData} from '../functions/create';
import {fetchFiles, getFolderInfo} from '../functions/read';
import FileThumbnail from '../components/FileThumnail';
import PlayerBtn from '../components/Buttons/PlayerBtn';

export default function WebScreen() {
  const [uri, setUri] = useState('');
  const [textInputValue, setTextInputValue] = useState('');
  const webViewRef = useRef(null);
  const [prevUrl, setPrevUrl] = useState('');
  const [isMessageProcessing, setIsMessageProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [directoryModalVisible, setDirectoryModalVisible] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height - 90;

  interface Folder {
    id: number | null;
    name: string | null;
    parentId: number | null;
    path: string | null;
  }

  const [currentFolder, setCurrentFolder] = useState<Folder>({
    id: null,
    name: null,
    parentId: null,
    path: null,
  });
  const [folders, setFolders] = useState([]);
  const [mediaInfos, setMediaInfos] = useState({url: '', title: ''});
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  // eslint-disable-next-line prettier/prettier
  const [windows, setWindows] = useState([
    {url: 'https://example.com', active: true},
  ]);
  const [showWindowsModal, setShowWindowsModal] = useState(false);

  const loadFolders = async (folderId: number | null) => {
    const fetchedFolders = await fetchFiles(folderId, 'folders');
    setFolders(fetchedFolders);

    console.log('Dossier actuel:', currentFolder);
  };

  const handleFolderClick = async (folderId: number) => {
    const folderInfo = await getFolderInfo(folderId);
    setCurrentFolder({
      id: folderId,
      parentId: folderInfo.parent_id,
      name: folderInfo.name,
      path: folderInfo.path,
    });
    await loadFolders(folderId);
  };

  const handleBackClick = async () => {
    if (currentFolder.parentId !== null) {
      const parentFolderInfo = await getFolderInfo(currentFolder.parentId);
      setCurrentFolder({
        id: parentFolderInfo.id,
        parentId: parentFolderInfo.parent_id,
        name: parentFolderInfo.name,
        path: parentFolderInfo.path,
      });
      await loadFolders(parentFolderInfo.id);
    } else {
      setCurrentFolder({
        id: null,
        parentId: null,
        name: 'Racine',
        path: FileSystem.documentDirectory,
      });
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
  };

  const handleDownload = async (url: string) => {
    console.log('Téléchargement du média' + url);

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

    if (uri.includes('soundcloud')) {
      const url = `http://192.168.1.34:3000/convert?url=${encodeURIComponent(
        mediaInfos.url,
      )}&title=${cleanedTitle}`;
      const response = await fetch(url);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onload = async function () {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          convertMedia(fileUri, mediaInfos.title, cleanedTitle + '.mp3');
        }
      };
      reader.readAsDataURL(blob);
      console.log(`Fichier téléchargé et sauvegardé à ${fileUri}`);

      closeWebViewTransaction();
    } else {
      // try {
      //   const download = FileSystem.createDownloadResumable(
      //     mediaInfos.url,
      //     fileUri,
      //   );
      //   const {uri: downloadedUrl} = await download.downloadAsync();
      //   console.log(`Fichier téléchargé et sauvegardé à ${downloadedUrl}`);

      //   convertMedia(downloadedUrl, mediaInfos.title, cleanedTitle + '.mp4');
      //   closeWebViewTransaction();
      // } catch (error) {
      //   console.log(`Erreur: ${error}`);
      // }

      try {
        const response = await fetch(mediaInfos.url);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const base64data = reader.result.split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log(`Fichier téléchargé et sauvegardé à ${fileUri}`);
            convertMedia(fileUri, mediaInfos.title, cleanedTitle + extension);
            closeWebViewTransaction();
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.log(`Erreur lors du téléchargement: ${error}`);
      }
    }
  };

  const redirectToWebsite = (url: string) => {
    return () => {
      setIsWebViewVisible(true);
      setUri(url);
    };
  };

  const handleTestDL = () => {
    return () => {
      testDL();
    };
  };

  const testDL = async () => {
    console.log('Téléchargement du média');

    const oui =
      'https://rr1---sn-n4g-jqbek.googlevideo.com/videoplayback?expire=1700299956&ei=VDBYZYaMNo_YxN8PzNisOA&ip=37.65.165.137&id=o-AMfoDk_8g-Eu2_hlpRXP7plnHurfYkHdKIdY22sZiPJJ&itag=18&source=youtube&requiressl=yes&mh=NP&mm=31%2C26&mn=sn-n4g-jqbek%2Csn-h5q7kne6&ms=au%2Conr&mv=m&mvi=1&pl=19&initcwndbps=1431250&spc=UWF9f0qvhDb_-fKuR8lHPZpEZc86AT5rY6yf_6OGPw&vprv=1&svpuc=1&mime=video%2Fmp4&ns=6tYoIuvuE0jFPvg26I45g2oP&gir=yes&clen=58954440&ratebypass=yes&dur=859.788&lmt=1700096012620757&mt=1700277919&fvip=2&fexp=24007246&beids=24350018&c=MWEB&txp=5538434&n=Iaz1kl5GN1a-F1gPJ&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Cgir%2Cclen%2Cratebypass%2Cdur%2Clmt&sig=ANLwegAwRQIgGphUBRvFABzM7-Q0YffBsNHTsN0tHZUdwsvvwlrv16YCIQCAtB1753tDhuuL6kEoucwtdtp4XAVOBSViPUm4K7FyOg%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AM8Gb2swRAIgAkte0K7_9AzxKtWa_0WUCPSzzpkZ49gpW26HwJs-QW0CICInonI4f--M-J104vP40fQJja-tW_e2wi28NW2V1dpU';
    // "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4";
    const cleanedTitle = 'theLastOnevraimentserieux';
    let directory = FileSystem.documentDirectory;
    const extension = '.mp4';
    let fileUri = `${directory}${cleanedTitle}${extension}`;

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        oui,
        fileUri,
        {},
        progress => {
          const totalBytesWritten = progress.totalBytesWritten;
          const totalBytesExpectedToWrite = progress.totalBytesExpectedToWrite;
          console.log(
            `Progress: ${totalBytesWritten} / ${totalBytesExpectedToWrite}`,
          );
        },
      );

      console.log('Début du téléchargement');
      const {uri: downloadedUrl} = await downloadResumable.downloadAsync();
      console.log(`Fichier téléchargé et sauvegardé à ${downloadedUrl}`);
      convertMedia(downloadedUrl, cleanedTitle, cleanedTitle + '.mp4');
      // Autres opérations après le téléchargement
    } catch (error) {
      console.error(`Erreur lors du téléchargement: ${error}`);
    }
  };

  // eslint-disable-next-line prettier/prettier
  const convertMedia = async (
    uri: string,
    name: string,
    cleanedTitle: string,
  ) => {
    try {
      console.log('URI:', uri);
      const extension = uri.split('.').pop();

      let sound = new Sound(uri, '', async error => {
        if (error) {
          console.log('Erreur lors du chargement du son:', error);
          return;
        }

        // Obtention de la durée
        let duration = sound.getDuration();
        console.log('Durée:', duration);

        // Obtenir les informations du fichier
        const fileInfo = await FileSystem.getInfoAsync(uri, {size: true});

        if (fileInfo.exists && !fileInfo.isDirectory) {
          const date = new Date().toISOString().split('T')[0];
          const data: FileData = {
            name: name,
            file_name: cleanedTitle,
            folder_id: currentFolder.id || null,
            date: date,
            duration: duration,
            size: fileInfo.size,
            extension: extension,
          };

          // Insérer les informations du fichier dans la base de données
          insertFile(data)
            .then(() => {
              console.log('Fichier inséré');
            })
            .catch(error => {
              console.log("Erreur lors de l'insertion du fichier:", error);
            });
        } else {
          console.log("Le fichier n'existe pas");
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleButtonPress = () => {
    setUri('https://www.google.com/search?q=' + textInputValue);
    setIsWebViewVisible(true);
  };

  const debouncedOnMessage = debounce(data => {
    if (isMessageProcessing) {
      console.log('Message ignoré :', data);
      return;
    }
    console.log('Message reçu :', data);

    setIsMessageProcessing(true);
    setMediaInfos({url: data.url, title: data.title});
    setModalVisible(true);
  }, 500); // Attend 500ms avant d'exécuter

  const onMessageHandler = (event: any) => {
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
  let lastVideoUrl = ""; // Stocke la dernière URL de la vidéo
  let lastVideoTitle = ""; // Stocke le titre de la dernière vidéo
  const YoutubeJavascript = `
  (function() {
    let videoUrls = []; // tableau pour stocker les urls car a chaque navigation elles restent en mémoire et le code récupère la première url qu'il trouve, donc on stocke les urls dans un tableau et on récupère la dernière
    let shortCounter = 0;

    function isHomePage() {
      return window.location.href === 'https://m.youtube.com/';
    }

    function isShortVideoPage() {
      return window.location.href.startsWith('https://m.youtube.com/shorts/');
    }

    function sendData(action, url, title) {
      const data = { "action" : action, "url" : url, "title" : title }; // l'objet a renvoyer
      window.ReactNativeWebView.postMessage(JSON.stringify(data)); // on envoie l'objet en string (la fonction reçoit une string)
    }

    // Fonction pour obtenir le titre
    function getVideoTitleElement() {
      return document.querySelector('[class*="metadata-title"] span').innerText;
    }

    
    function getShortTitleElement() {
      const activeCarouselItem = document.querySelector('ytm-reel-player-overlay-renderer[data-is-active="true"]');
      if (activeCarouselItem) {
        return activeCarouselItem.querySelector('[class*="reel-title"] span').innerText;
      }
      return null;
    }

    // title on page and title on json may have different whitespaces and line breaks
    function trimTitles(title) {
      return title.trim().replace(/\\s+/g, ' ');
    }

    function compareTitles(title1, title2) {
      return trimTitles(title1) === trimTitles(title2);
    }

    function getCurrentShort() {
      let playingTitle = getShortTitleElement();
      window.ReactNativeWebView.postMessage("ouiii : " + playingTitle);
      for (let i = videoUrls.length - 1; i >= 0; i--) {
        if (videoUrls[i].title === playingTitle) {
          return videoUrls[i];
        }
      }
      return null;
    }

    function checkAndSendData(action) {
      if(isShortVideoPage()){

          let currentShort = getCurrentShort();
          // window.ReactNativeWebView.postMessage(currentShort.url);
          // window.ReactNativeWebView.postMessage(currentShort.title);

          if (currentShort && action == "play") {
     
            sendData(action, currentShort.url, currentShort.title); // on envoie les données
            lastVideoUrl = '';  // Réinitialisez l'url pour le prochain son (pour éviter de renvoyer la même url)
            lastVideoTitle = '';
          }

      }
      else {
        if (lastVideoUrl &&  compareTitles(lastVideoTitle , getVideoTitleElement()) && action == "play") { // si on a la derniere url et le titre
          
          sendData(action, lastVideoUrl, lastVideoTitle); // on envoie les données
          lastVideoUrl = '';  // Réinitialisez l'url pour le prochain son (pour éviter de renvoyer la même url)
          lastVideoTitle = '';
        }
      }
    }

    //fonction pour intercepter les requetes et récupérer l'url de la vidéo
    
    (function() {
      const originalFetch = window.fetch;
    
      window.fetch = async function(...args) {
        // Intercepter la réponse sans affecter la requête d'origine
        const response = await originalFetch.apply(this, args);
    
        // Clone la réponse pour ne pas perturber le flux de traitement original
        const clone = response.clone();
    
        // Traiter le clone pour extraire les informations spécifiques
        clone.json().then(data => {
          if (args[0].url.includes('player?') && data.streamingData && data.streamingData.formats.length > 0) {         
            if (!isHomePage()) {

              data.streamingData.formats.forEach(format => {
                if (format.qualityLabel === '360p') {
                  
                  if (!isHomePage()) {
                    window.ReactNativeWebView.postMessage("oui");
                    lastVideoUrl = format.url;
                    lastVideoTitle = data.videoDetails.title;

                    // Trouver l'index de l'élément avec le même titre mais une URL vide
                    const index = videoUrls.findIndex(video => video.title === getShortTitleElement() && !video.url);
                    
                    if (index !== -1) {
                      // Remplacer l'élément si trouvé
                      window.ReactNativeWebView.postMessage("non");
                      videoUrls[index].url = lastVideoUrl;
                    } else {
                      // Vérifier si le titre est un doublon
                      const isDuplicate = videoUrls.some(video => video.title === lastVideoTitle);
                      if (!isDuplicate) {
                        // Ajouter le nouveau short s'il n'est pas un doublon
                        videoUrls.push({ id: shortCounter++, url: lastVideoUrl, title: lastVideoTitle });
                      }
                    }
                     window.ReactNativeWebView.postMessage("AAAAA : " + JSON.stringify(videoUrls));
                  }
                }
              });
            }
          }
        }).catch(e => {
          // Gérer les erreurs de traitement du clone
          // console.error("Erreur lors de l'extraction de l'URL de la vidéo :", e);
          // window.ReactNativeWebView.postMessage(e);
        });
    
        // Retourner la réponse originale pour ne pas perturber le traitement normal de la requête
        return response;
      };
    })();
  

// regle les shorts
// quand ya un doublon vidéo il renvoie pas l'url
// bloquer quand y'a un envoi en cours pour pas spam
// des fois il récup pas d'url


  
    // Fonction pour ajouter des écouteurs d'événements aux éléments média (vidéo ou audio)
    function addEventListenersToMedia(mediaElements) {
      mediaElements.forEach(media => {
        media.addEventListener('play', function() {
          window.ReactNativeWebView.postMessage('play'); // Envoi d'un message lorsque la vidéo est en lecture
          lastVideoUrl = videoUrls[videoUrls.length - 1].url;
          lastVideoTitle = videoUrls[videoUrls.length - 1].title;
          // reset les variables last video url et/ou title
            setTimeout(() => {
              checkAndSendData("play");
            }, 2000);
        });
        media.addEventListener('pause', function() {
          window.ReactNativeWebView.postMessage('pause'); // Envoi d'un message lorsque la vidéo est en pause
          // setTimeout(() => {
          //   checkAndSendData("pause");
          // }, 2000);
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

  const clearCookiesScript = `
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
`;

  const removeCookies = () => {
    webViewRef.current?.injectJavaScript(clearCookiesScript);
    webViewRef.current?.reload();
  };

  const handleNavigationStateChange = async navState => {
    let url = navState.url;

    if (url !== prevUrl) {
      console.log('La derniere url de requete est :', lastHlsUrl);
      console.log("L'URL actuelle est :", currentUrl);
      lastHlsUrl = '';
      lastVideoUrl = '';
      lastVideoTitle = '';
      currentTitle = '';
      currentUrl = '';
      isMusicAlreadyPlayed = false;
      console.log('Réinitialisation de lastHlsUrl il vaut : ' + lastHlsUrl);
      console.log("L'URL actuelle est :", url);
      setPrevUrl(url);
    }

    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    // Réinjecte le JavaScript lorsque la navigation change
    if (uri.includes('soundcloud')) {
      webViewRef.current?.injectJavaScript(SoundcloudJavascript);
    } else if (uri.includes('youtube')) {
      webViewRef.current?.injectJavaScript(YoutubeJavascript);
    }
  };

  const onDebugMessageHandler = event => {
    console.log('Message du WebView:', event.nativeEvent.data);
  };

  const goBack = () => {
    webViewRef.current.goBack();
  };

  const goForward = () => {
    webViewRef.current.goForward();
  };
  const share = async () => {
    try {
      const result = await Share.share({
        message: 'Check out this website!',
        // Vous pouvez aussi partager l'URL actuelle du WebView
      });
    } catch (error) {
      console.error(error);
    }
  };

  const addWindow = (url: string) => {
    setWindows([...windows, {url, active: false}]);
  };

  const selectWindow = (index: any) => {
    const newWindows = windows.map((window, idx) => ({
      ...window,
      active: idx === index,
    }));
    setWindows(newWindows);
    setShowWindowsModal(false);
    webViewRef.current.loadUrl(newWindows[index].url);
  };

  const renderWindowItem = ({item, index}) => (
    <TouchableOpacity
      style={styles.windowItem}
      onPress={() => selectWindow(index)}>
      <Text>{item.url}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{flexDirection: 'row', width: '100%'}}>
        <TextInput
          style={{
            width: '90%',
            borderWidth: 1,
            borderRightWidth: 0,
            borderColor: '#ccc',
            padding: 10,
            backgroundColor: 'lightgray',
          }}
          onChangeText={text => setTextInputValue(text)}
          value={textInputValue}
        />
        <PlayerBtn
          onPress={() => handleButtonPress()}
          size={60}
          svgPaths={[
            'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z',
          ]}
          style={{borderRadius: 100, zIndex: 99999}}
          fill="#2F7CF6"
        />
      </View>

      {isWebViewVisible && (
        <>
          <WebView
            ref={webViewRef}
            source={{
              uri: uri,
              // headers: {
              //   'user-agent':
              //     'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
              // },
            }}
            style={{flex: 5, backgroundColor: 'green'}}
            injectedJavaScript={
              uri.includes('soundcloud')
                ? SoundcloudJavascript
                : uri.includes('youtube')
                ? YoutubeJavascript
                : null
            }
            onMessage={onDebugMessageHandler}
            onNavigationStateChange={handleNavigationStateChange}
            originWhitelist={['*']}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            // userAgent="Mozilla/5.0 (Linux; Android 10; Pixel 4 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={false}
            cacheMode={'LOAD_NO_CACHE'} // potentiellement enlever ces 3 lignes
            domStorageEnabled={true}
            // setSupportMultipleWindows={false}
            // startInLoadingState={true}
            // incognito={true}
            // thirdPartyCookiesEnabled={false}
            // sharedCookiesEnabled={true}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              padding: 10,
            }}>
            <Button title="Back" onPress={goBack} disabled={!canGoBack} />
            <Button
              title="Forward"
              onPress={goForward}
              disabled={!canGoForward}
            />
            <Button title="Share" onPress={share} />
            <Button
              title="Fenêtres"
              onPress={() => setShowWindowsModal(true)}
            />
            <Button title="RMCookies" onPress={() => removeCookies()} />
            {/* Ajoutez d'autres boutons pour les bookmarks, l'historique, et voir toutes les fenêtres ici */}
          </View>
          <Modal
            visible={showWindowsModal}
            onRequestClose={() => setShowWindowsModal(false)}>
            <FlatList
              data={windows}
              renderItem={renderWindowItem}
              keyExtractor={(item, index) => index.toString()}
            />
            <Button
              title="Ajouter Fenêtre"
              onPress={() => addWindow('https://example.com')}
            />
          </Modal>
        </>
      )}

      {!isWebViewVisible && (
        <View
          style={{
            zIndex: 99999,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: 10,
            width: '100%',
            height: '100%',
            backgroundColor: '#FB923C',
          }}>
          <Pressable onPress={redirectToWebsite('https://m.youtube.com')}>
            <Image
              source={require('../assets/youtube.png')}
              style={{width: 100, height: 100}}
            />
            <Text>Youtube</Text>
          </Pressable>
          <Pressable onPress={redirectToWebsite('https://m.soundcloud.com')}>
            <Image
              source={require('../assets/soundcloud.png')}
              style={{width: 100, height: 100}}
            />
            <Text>Soundcloud</Text>
          </Pressable>
          <Pressable onPress={redirectToWebsite('https://m.x.com')}>
            <Image
              source={require('../assets/twitter.png')}
              style={{width: 100, height: 100}}
            />
            <Text>Twitter</Text>
          </Pressable>
          <Pressable onPress={redirectToWebsite('https://m.tiktok.com')}>
            <Image
              source={require('../assets/tiktok.png')}
              style={{width: 100, height: 100}}
            />
            <Text>TikTok</Text>
          </Pressable>
          <Pressable onPress={() => testDL()}>
            <Image
              source={require('../assets/tiktok.png')}
              style={{width: 100, height: 100}}
            />
            <Text>TEST DL</Text>
          </Pressable>
        </View>
      )}

      {modalVisible && (
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '90%',
            transform: [{translateX: -160}, {translateY: -100}],
            backgroundColor: 'darkgray',
            width: 320,
            height: 100,
            zIndex: 9999,
          }}>
          <Text>Voulez-vous télécharger ce média ?</Text>
          <Button
            title="Télécharger"
            onPress={() => setDirectoryModalVisible(true)}
          />
          <Button
            title="Fermer"
            onPress={() => {
              setModalVisible(false);
              setIsMessageProcessing(false);
            }}
          />
        </View>
      )}
      {directoryModalVisible && (
        <Modal animationType="slide" transparent={true}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 22,
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
            }}>
            <View
              style={{
                width: windowWidth, // Largeur du contenu du modal
                height: '100%', // Hauteur du contenu du modal
                backgroundColor: '#292929', // Couleur de fond du contenu
                borderRadius: 10, // Bordures arrondies
                paddingVertical: 20, // Espace interne
                alignItems: 'center', // Centrer horizontalement le contenu
                shadowColor: '#000', // Ombre
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}>
              <View
                style={{borderBottomWidth: 2, paddingBottom: 6, width: '100%'}}>
                <Text
                  style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>
                  Nom du fichier :{' '}
                </Text>
                <TextInput
                  value={mediaInfos.title}
                  style={{borderWidth: 2, width: 300}}
                />
              </View>

              <Text
                style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>
                Choisissez un dossier
              </Text>

              <View
                style={{
                  width: '100%',
                  height: '60%',
                  backgroundColor: 'red',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  padding: 10,
                }}>
                <View
                  style={{
                    width: '100%',
                    height: '10%',
                    backgroundColor: 'blue',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <PlayerBtn
                    onPress={() => handleBackClick()}
                    size={30}
                    svgPaths={[
                      'M11.67 3.87L9.9 2.1L0 12l9.9 9.9l1.77-1.77L3.54 12z',
                    ]}
                    style={{borderRadius: 100, marginLeft: 20}}
                    fill="#2F7CF6"
                  />
                  <Text>
                    {currentFolder.id ? currentFolder.name : 'Racine'}
                  </Text>
                </View>
                {folders.map(item => {
                  return (
                    <React.Fragment key={item.id}>
                      <FileThumbnail
                        data={item}
                        onSelect={() => handleFolderClick(item.id)}
                      />
                    </React.Fragment>
                  );
                })}
              </View>

              <View>
                <Pressable onPress={() => handleDownload(currentUrl)}>
                  <Text>Télécharger ici</Text>
                </Pressable>
                <Pressable onPress={() => setDirectoryModalVisible(false)}>
                  <Text>Fermer</Text>
                </Pressable>
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  windowItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});
