import * as FileSystem from 'expo-file-system';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'files.db',
    location: 'default',
  },
  () => console.log('Database opened'),
  error => console.log('Error opening database', error),
);

// Function to create a folder in the app's document directory and insert it into the database
export default function createFolder(
  name: string,
  parent_id: number | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let folderPath;

    // if parent_id is null, create the folder in the root directory
    if (parent_id === null) {
      folderPath = `${FileSystem.documentDirectory}${name}/`;
      createFolderInFileSystemAndDB(folderPath, name, null, resolve, reject);
    } else {
      // else get the parent folder path from the database
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM folders WHERE id = ?',
          [parent_id],
          (tx, results) => {
            if (results.rows.length > 0) {
              const parentFolderPath = results.rows.item(0).path;
              folderPath = `${parentFolderPath}${name}/`;
              createFolderInFileSystemAndDB(
                folderPath,
                name,
                parent_id,
                resolve,
                reject,
              );
            } else {
              reject(new Error('Parent folder not found'));
            }
          },
          (tx, error) => {
            reject(error);
            return false;
          },
        );
      });
    }
  });
}

function createFolderInFileSystemAndDB(
  folderPath: string,
  name: string,
  parent_id: number | null,
  resolve: any,
  reject: any,
) {
  // create the folder into the file system
  FileSystem.makeDirectoryAsync(folderPath, {intermediates: true})
    .then(() => {
      // insert into the database
      const now = new Date().toISOString().split('T')[0];
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO folders (name, date, path, parent_id) VALUES (?, ?, ?, ?)',
          [name, now, folderPath, parent_id],
          (_, results) => {
            if (results.rowsAffected > 0) {
              console.log('Folder inserted into database successfully');
              resolve();
            } else {
              console.error('Failed to insert folder into database');
              reject(new Error('Failed to insert folder into database'));
            }
          },
          (tx, error) => {
            reject(error);
            return false;
          },
        );
      });
    })
    .catch(err => {
      reject(err);
    });
}

export function createDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        // create folders table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            date DATE,
            path TEXT,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES folders(id)
          )`,
          [],
          () => {},
          (tx, err) => {
            reject(err);
            return false;
          },
        );

        // create files table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            file_name TEXT,
            folder_id INTEGER,
            date DATE,
            duration TEXT,
            size TEXT,
            extension TEXT,
            FOREIGN KEY (folder_id) REFERENCES folders(id)
          )`,
          [],
          () => {},
          (tx, err) => {
            reject(err);
            return false;
          },
        );

        // if everything ok
        resolve();
      },
      err => {
        reject(err);
      },
    );
  });
}

export interface FileData {
  name: string;
  file_name: string;
  folder_id: number | null;
  date: string;
  duration: number;
  size: number;
  extension: string | undefined;
}

// insert file into database
export function insertFile(data: FileData): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO files (name, file_name, folder_id, date, duration, size, extension) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          data.name,
          data.file_name,
          data.folder_id,
          data.date,
          data.duration,
          data.size,
          data.extension,
        ],
        () => {
          resolve();
        },
        (tx, error) => {
          reject(error);
          return false;
        },
      );
    });
  });
}





function checkAndSendData(action) {

  if(isShortVideoPage()){

    if (videoUrls.length >= 2) {
      let currentShortUrl = videoUrls[videoUrls.length - 2].url;
      let currentShortTitle = videoUrls[videoUrls.length - 2].title;
      window.ReactNativeWebView.postMessage(currentShortUrl);
      window.ReactNativeWebView.postMessage(currentShortTitle);

      if (currentShortUrl && currentShortTitle == getShortTitleElement() && action == "play") { // si on a la derniere url et le titre
        if(currentTitle !== getShortTitleElement()){ 
          currentTitle = getShortTitleElement();
        }
 
        sendData(action, currentShortUrl, currentShortTitle); // on envoie les données
        lastVideoUrl = '';  // Réinitialisez l'url pour le prochain son (pour éviter de renvoyer la même url)
        lastVideoTitle = '';
      }

    }

  }

}

(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    // Intercepter la réponse sans affecter la requête d'origine
    const response = await originalFetch.apply(this, args);

    // Clone la réponse pour ne pas perturber le flux de traitement original
    const clone = response.clone();

    // Traiter le clone pour extraire les informations spécifiques
    clone.json().then(data => {
      if (args[0].url.includes('player?')) {
        if (data.streamingData && data.streamingData.formats && data.streamingData.formats.length > 0) {
          if (!isHomePage()) {

              // window.ReactNativeWebView.postMessage("test" );
              lastVideoUrl = data.streamingData.formats[1].url;
              lastVideoTitle = data.videoDetails.title;
              videoUrls.push({ url: lastVideoUrl, title: lastVideoTitle });  // ajoute à la liste
            // }
          }
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