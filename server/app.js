const express = require('express');
const { exec } = require('child_process');
const app = express();

app.get('/convert', (req, res) => {
    console.log('Requête de conversion reçue.');
    
    const url = req.query.url;
    const title = req.query.title;

 console.log(url);
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      
      const realUrl = data.url;
      // Téléchargez le fichier à partir de realUrl

      // console.log('realUrl :'+realUrl);
      
      const outputFilename = `${title}.mp3`;
    const cmd = `ffmpeg -i "${realUrl}" -q:a 0 -map a ${outputFilename}`;

    // console.log(`Exécution de la commande: ${cmd}`);
  
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur: ${error}`); 
        res.status(500).send('Erreur de conversion.');
        return;
      }
      console.log("Conversion terminée.");
      res.download(outputFilename); // Envoie le fichier au client
    });
    }); 

   
  }); 

app.listen(3000, () => {
  console.log('Serveur en écoute sur le port 3000.');
});