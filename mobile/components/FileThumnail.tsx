import { StyleSheet, Text, View, Pressable, Image} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as Thumb from 'expo-video-thumbnails';
import PlayBtn from '../assets/PlayBtn';
import * as FileSystem from 'expo-file-system';
import { getFolderInfo } from '../functions/read';


export default function  FileThumbnail({ data , onSelect}): JSX.Element {

    const [thumbnail, setThumbnail] = useState(null);
    const handleClick = () => {
      if (data.extension) {
        let path :string;
        if(data.folder_id){
          getFolderInfo(data.folder_id).then((data2) => {
            path = data2.path+data.file_name; 
            onSelect(path); 
          })
        }else {
          path = FileSystem.documentDirectory+data.file_name;
          onSelect(path); 
        }
        
      }else{
        // if its a folder
        onSelect(data.id,data.name);
      }
      
    };

    
    const fetchThumbnail = async () => {
      try {
        if(data.folder_id){
          let path2 :string;
          getFolderInfo(data.folder_id).then(async (data2) => {
            path2 = data2.path;
            const thumb = await Thumb.getThumbnailAsync(
              path2+data.file_name,
              {
                time: 15000,
              }
            );
            
            setThumbnail({ uri: thumb.uri });
          }).catch((error) => {
            console.error(error);
          })

          
        }
      } catch (error) {
        console.error('Erreur en récupérant la miniature:', error);
      }
    };

    useEffect(() => {
          switch (data.extension) {
            case "mp4":
              fetchThumbnail();
              break;
            case "mp3":
              setThumbnail(require('../assets/music.png'));
              break;
            case undefined:
              setThumbnail(require('../assets/folder.png'));
              break;
            // case "pdf":
            //   setThumbnail(require('../assets/pdf.png'));
            //   break;
            // case "doc":
            //   setThumbnail(require('../assets/doc.png'));
            //   break;
            // case "docx":
            //   setThumbnail(require('../assets/doc.png'));
            //   break;
            // case "xls":
            //   setThumbnail(require('../assets/xls.png'));
            //   break;
            // case "xlsx":
            //   setThumbnail(require('../assets/xls.png'));
            //   break;
            // case "ppt":
            //   setThumbnail(require('../assets/ppt.png'));
            //   break;
            // case "pptx":
            //   setThumbnail(require('../assets/ppt.png'));
            //   break;
            // case "txt":
            //   setThumbnail(require('../assets/txt.png'));
            //   break;
            // case "zip":
            //   setThumbnail(require('../assets/zip.png'));
            //   break;
            // case "rar":
            //   setThumbnail(require('../assets/zip.png'));
            //   break;
            // case "jpg":
            //   setThumbnail(require('../assets/jpg.png'));
            //   break;
            // case "jpeg":
            //   setThumbnail(require('../assets/jpg.png'));
            //   break;
            // case "png":
            //   setThumbnail(require('../assets/jpg.png'));
            //   break;
            // default:
            //   setThumbnail(require('../assets/file.png'));
            //   break;
          }
        
    }, []);


    // formatter la taille du fichier
    function formatSize(bytes: number, decimals = 2): string {
      if (bytes === 0) return '0 Bytes';
    
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
      const i = Math.floor(Math.log(bytes) / Math.log(k));
    
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    if (!data.name) return null;

    return (
      <Pressable onPress={handleClick} style={{ width:"33%"}}>
        <View style={{ height: 120 , position: 'relative', alignItems: 'center', marginBottom: 50}}>
             {thumbnail && (
              <>
                <Image
                  source={thumbnail}
                  style={{ width: 100, height: 70, }}  
                />
                {data.extension && (
                   <View style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -15 }, { translateY: -35 }],
                  }}
                >
                  <PlayBtn name="play" />
                </View>
                )}
               
              </>
                
            )}
            
            {data.extension ? (
              <>
                <Text>{data.name.substring(0,25)}.{data.extension}</Text>
                <Text>{data.date}</Text>
                <Text>{formatSize(data.size)}</Text>
              </>
            ) : (
              <>
                <Text>{data.name.substring(0,25)}</Text>
                <Text>{data.date}</Text>
              </>
            )}
        </View>    
      </Pressable>
        
    );
}
