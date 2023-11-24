import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'files.db',
    location: 'default',
  },
  () => console.log('Database opened'),
  error => console.log('Error opening database', error),
);

export function fetchFiles(
  folderId: number | null,
  type: 'all' | 'folders' | 'files' = 'all',
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let filesQuery = '';
    let foldersQuery = '';
    let queryParams: number[] = [];

    if (folderId === null) {
      filesQuery = 'SELECT * FROM files WHERE folder_id IS NULL';
      foldersQuery = 'SELECT * FROM folders WHERE parent_id IS NULL';
    } else {
      filesQuery = 'SELECT * FROM files WHERE folder_id = ?';
      foldersQuery = 'SELECT * FROM folders WHERE parent_id = ?';
      queryParams = [folderId];
    }

    db.transaction(tx => {
      if (type === 'all' || type === 'folders') {
        // _ = non used param, foldersResult = result of the query
        tx.executeSql(
          foldersQuery,
          queryParams,
          (_, foldersResult) => {
            const foldersArray: any[] = [];
            for (let i = 0; i < foldersResult.rows.length; i++) {
              foldersArray.push(foldersResult.rows.item(i));
            }

            if (type === 'folders') {
              resolve(foldersArray);
            } else {
              tx.executeSql(
                filesQuery,
                queryParams,
                (_, filesResult) => {
                  const filesArray = [];
                  for (let i = 0; i < filesResult.rows.length; i++) {
                    filesArray.push(filesResult.rows.item(i));
                  }

                  const combinedResults = foldersArray.concat(filesArray);              
                  resolve(combinedResults);
                },
                (_, error) => {
                  reject(error);
                  return false;
                },
              );
            }
          },
          (_, error) => {
            reject(error);
            return false;
          },
        );
      } else if (type === 'files') {
        tx.executeSql(
          filesQuery,
          queryParams,
          (_, filesResult) => {
            const filesArray = [];
            for (let i = 0; i < filesResult.rows.length; i++) {
              filesArray.push(filesResult.rows.item(i));
            }
            resolve(filesArray);
          },
          (_, error) => {
            reject(error);
            return false;
          },
        );
      }
    });
  });
}

export function getFolderInfo(folderId: number): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM folders WHERE id = ?',
        [folderId],
        (_, result) => resolve(result.rows.item(0)),
        (_, error) => {
          reject(error);
          return false;
        },
      );
    });
  });
}
