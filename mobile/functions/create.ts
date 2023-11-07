import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

// Open database
const db = SQLite.openDatabase('files.db');

// Function to create a folder in the app's document directory and insert it into the database
export default function createFolder(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Chemin du dossier à créer
        const folderPath = `${FileSystem.documentDirectory}${name}`;

        // Create folder
        FileSystem.makeDirectoryAsync(folderPath, { intermediates: true }).then(() => {
            // Inset folder into database
            const now =  new Date().toISOString().split('T')[0];
            db.transaction((tx) => {
                tx.executeSql('INSERT INTO files (name, path, date) VALUES (?, ?, ?)', [name,`${name}/`, now], (tx, results) => {
                    if (results.rowsAffected > 0) {
                        resolve();
                    } else {
                        reject(new Error('Failed to insert folder into database'));
                    }
                });
            });
        }).catch((err) => {
            reject(err);
        });
    });
}

export function createDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, path TEXT, date DATE, duration TEXT, size TEXT, extension TEXT)', [], () => {
                resolve();
            }, (err) => {
                reject(err);
                return false;
            });
        });
    });
}


// TEST LES DL 