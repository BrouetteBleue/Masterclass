  
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
  