let currentUrl = '';
  let lastHlsUrl = ''; // Stocke la dernière URL HLS
  let currentTitle = '';
  let isMusicAlreadyPlayed = false;
  

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
  
