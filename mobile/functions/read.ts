import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('files.db');

export function fetchFiles(folderId: number | null): Promise<any> {
  return new Promise((resolve, reject) => {
    let filesQuery;
    let foldersQuery;
    let queryParams;

    if (folderId === null) {
      // get the files and folders in the root directory
      filesQuery = "SELECT * FROM files WHERE folder_id IS NULL";
      foldersQuery = "SELECT * FROM folders WHERE parent_id IS NULL";
      queryParams = [];
    } else {
      // get the files and folders in the specified folder
      filesQuery = "SELECT * FROM files WHERE folder_id = ?";
      foldersQuery = "SELECT * FROM folders WHERE parent_id = ?";
      queryParams = [folderId];
    }

    db.transaction((tx) => {
      // fetch folders
      tx.executeSql(
        foldersQuery,
        queryParams,
        (_, foldersResult) => {
          // fetch files
          tx.executeSql(
            filesQuery,
            queryParams,
            (_, filesResult) => {
              // combine the results
              const combinedResults = [
                ...foldersResult.rows._array,
                ...filesResult.rows._array,
              ];
              resolve(combinedResults);
              console.log(combinedResults);
              
            },
            (_, error) => {
              reject(error);
              return false; // Continue the transaction in case of error
            }
          );
        },
        (_, error) => {
          reject(error);
          return false; 
        }
      );
    });
  });
}
