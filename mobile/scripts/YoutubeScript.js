  
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
  

  (function() {
    // Sauvegardez la référence originale de la fonction fetch
    const originalFetch = window.fetch;
  
    // Redéfinissez la fonction fetch pour intercepter les appels
    window.fetch = async function(...args) {
      console.log('fetch appelé avec les arguments :', args);
  
      // Exécutez la requête fetch originale
      const response = await originalFetch(...args);
  
      // Clonez la réponse pour que vous puissiez la lire et la laisser intacte pour le code original
      const clone = response.clone();
  
      // Vous pouvez maintenant lire le texte ou le JSON de la réponse clonée
    
  
      // Retournez la réponse originale pour ne pas perturber le fonctionnement normal
      return response;
    };
  })();


  (function() {
    const originalFetch = window.fetch;
  
    window.fetch = async function(...args) {
      // args[0] contient l'URL de la requête
      if (args[0].includes('critère_spécifique')) {
        console.log('fetch appelé pour une URL spécifique:', args[0]);
  
        // Exécutez la requête fetch originale
        const response = await originalFetch(...args);
  
        // Clonez et lisez la réponse pour cette requête spécifique
        const clone = response.clone();
        clone.text().then(text => {
          console.log('Réponse fetch pour URL spécifique (text) :', text);
        }).catch(e => {
          console.error('Erreur lors de la lecture de la réponse fetch:', e);
        });
  
        return response;
      } else {
        // Pour toutes les autres requêtes, utilisez fetch normalement
        return originalFetch(...args);
      }
    };
  })();


  (function() {
    // Sauvegardez la référence originale de la fonction fetch
    const originalFetch = window.fetch;
  
    // Redéfinissez la fonction fetch pour intercepter les appels
    window.fetch = async function(...args) {
      console.log('fetch appelé avec les arguments :', args);
  
      // Exécutez la requête fetch originale
      const response = await originalFetch(...args);
  
      // Clonez la réponse pour que vous puissiez la lire et la laisser intacte pour le code original
      const clone = response.clone();
  
      // Vous pouvez maintenant lire le texte ou le JSON de la réponse clonée
      clone.text().then(text => {
        console.log('Réponse fetch (text) :', text);
      }).catch(e => {
        console.error('Erreur lors de la lecture de la réponse fetch:', e);
      });
  
      // Retournez la réponse originale pour ne pas perturber le fonctionnement normal
      return response;
    };
  })();
















  // FONCTIONNE 

  (function() {
    const originalFetch = window.fetch;
  
    window.fetch = async function(...args) {
      // args[0] contient l'URL de la requête
      if (args[0].url.includes('player?')) {
        console.log('fetch appelé pour une URL spécifique:', args[0].url);
  
        // // Exécutez la requête fetch originale
         const response = await originalFetch(...args);
  
        // // Clonez et lisez la réponse pour cette requête spécifique
         const clone = response.clone();
        clone.text().then(text => {
          console.log('Réponse fetch pour URL spécifique (text) :', text);
        }).catch(e => {
          console.error('Erreur lors de la lecture de la réponse fetch:', e);
        });
  
         return response;
      } else {
        // // Pour toutes les autres requêtes, utilisez fetch normalement
         return originalFetch(...args);
      }
    };
  })();







  // fonctionne bien mais reset pas
  (function() {
    const originalFetch = window.fetch;
  
    window.fetch = async function(...args) {
      if (args[0].url.includes('player?')) {
        const response = await originalFetch(...args);
        const clone = response.clone();
  
        clone.json().then(data => {
          if (data.streamingData && data.streamingData.formats && data.streamingData.formats.length > 0) {
            const videoUrl = data.streamingData.formats[0].url;
            console.log('URL de la vidéo :', videoUrl);
            window.ReactNativeWebView.postMessage(JSON.stringify({videoUrl}));
          }
        }).catch(e => {
          console.error("Erreur lors de l'extraction de l\'URL de la vidéo :", e);
        });
  
        // Restaurer la fonction fetch d'origine
        window.fetch = originalFetch;
        return response;
      } else {
        return originalFetch(...args);
      }
    };
  })();



    // fonctionne bien mais
    (function() {
      const originalFetch = window.fetch;
    
      window.fetch = async function(...args) {
        try{
          const response = await originalFetch.apply(this, args);
          if (args[0].url.includes('player?')) {
            const clone = response.clone();
      
            clone.json().then(data => {
              if (data.streamingData && data.streamingData.formats && data.streamingData.formats.length > 0) {
                const videoUrl = data.streamingData.formats[1].url;
                console.log('URL de la vidéo :', videoUrl);
                // window.ReactNativeWebView.postMessage(JSON.stringify({videoUrl}));
              }
            }).catch(e => {
              console.error("Erreur lors de l'extraction de l\'URL de la vidéo :", e);
            });
      
            // Restaurer la fonction fetch d'origine
            window.fetch = originalFetch;
            return response;
          } else {
            return originalFetch(...args);
          }

        }catch (e) {
          console.error("Erreur lors de l'extraction de l\'URL de la vidéo :", e);
          return originalFetch.apply(this, args);
        };
      };
    })();












    (function() {
      function replaceFetch() {
        const originalFetch = window.fetch;
    
        window.fetch = async function(...args) {
          try {
            const response = await originalFetch.apply(this, args);
    
            if (args[0].url.includes('player?')) {
              const clone = response.clone();
    
              clone.json().then(data => {
                if (data.streamingData && data.streamingData.formats && data.streamingData.formats.length > 0) {
                  const videoUrl = data.streamingData.formats[0].url;
                  console.log('URL de la vidéo :', videoUrl);
                  // window.ReactNativeWebView.postMessage(JSON.stringify({videoUrl}));
                }
              }).catch(e => {
                console.error("Erreur lors de l'extraction de l'URL de la vidéo :", e);
              });
            }
    
            return response;
          } catch (e) {
            console.error("Erreur lors de l'extraction de l'URL de la vidéo :", e);
            return originalFetch.apply(this, args);
          };
        };
      }
    
      // Remplacer la fonction fetch toutes les 5 secondes pour s'assurer qu'elle reste surchargée
      setInterval(replaceFetch, 5000);
    
      // Effectuer le premier remplacement immédiatement
      replaceFetch();
    })();