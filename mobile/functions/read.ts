import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('files.db');

export function fetchFiles(folderId: number | null, type: 'all' | 'folders' | 'files' = 'all'): Promise<any> {
  return new Promise((resolve, reject) => {
    let filesQuery;
    let foldersQuery;
    let queryParams;

    // get the files and folders in the specified folder
    if (folderId === null) {
      filesQuery = "SELECT * FROM files WHERE folder_id IS NULL";
      foldersQuery = "SELECT * FROM folders WHERE parent_id IS NULL";
    } else {
      // get the files and folders in the specified folder
      filesQuery = "SELECT * FROM files WHERE folder_id = ?";
      foldersQuery = "SELECT * FROM folders WHERE parent_id = ?";
      queryParams = [folderId];
    }

    db.transaction((tx) => {
      // fetch folders if needed
      if (type === 'all' || type === 'folders') {
        // _ = non used param, foldersResult = result of the query
        tx.executeSql(foldersQuery,queryParams, (_, foldersResult) => {
          
            if (type === 'folders') {
              resolve(foldersResult.rows._array);
              console.log(foldersResult.rows._array);
            } else {
                // fetch files
                tx.executeSql(filesQuery,queryParams,(_, filesResult) => {
                  // combine the results
                  const combinedResults = [
                    ...foldersResult.rows._array,
                    ...filesResult.rows._array,
                  ];
                  resolve(combinedResults);
                  // console.log(combinedResults);
                },
                (_, error) => {
                  reject(error);
                  return false;
                });
            }
          },
          (_, error) => {
            reject(error);
            return false; 
          }
        );
      } else if (type === 'files') {
        // fetch only files
        tx.executeSql(filesQuery,queryParams,(_, filesResult) => {
            resolve(filesResult.rows._array);
            console.log(filesResult.rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      }
    });
  });
}

export function getFolderInfo(folderId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM folders WHERE id = ?",
        [folderId],
        (_, result) => resolve(result.rows._array[0]),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}