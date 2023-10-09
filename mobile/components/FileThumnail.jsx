import { StyleSheet, Text, View, Pressable, Image ,TextInput, Button, Alert, FlatList, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as Thumb from 'expo-video-thumbnails';
import PlayBtn from '../assets/PlayBtn';



export default function  FileThumbnail({ data , onSelect}) {

    const [thumbnail, setThumbnail] = useState(null);
    const handleClick = () => {
      onSelect(data.url);
    };

    useEffect(() => {
        console.log("test" +data);
        const fetchThumbnail = async () => {
            try {
              const thumb = await Thumb.getThumbnailAsync(
                data.url,
                {
                  time: 15000,
                }
              );
              setThumbnail({ uri: thumb.uri });
            } catch (error) {
              console.error('Erreur en récupérant la miniature:', error);
            }
          };
          if(data.extension === "mp4"){
            fetchThumbnail();
          }
        
    }, []);


    // formatter la taille du fichier
    function formatSize(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
    
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
      const i = Math.floor(Math.log(bytes) / Math.log(k));
    
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
      <Pressable onPress={handleClick}>
        <View style={{ backgroundColor: "#fff", width: "33%", height: 120 , position: 'relative', alignItems: 'center', marginBottom: 50}}>
             {thumbnail && (
              <>
              <Image
                source={thumbnail}
                style={{ width: 100, height: 70, backgroundColor: "red", }}  // Ajoutez un style pour voir l'image
                />
                <View style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -15 }, { translateY: -35 }],
                }}>
                  <PlayBtn name="play" />
                </View>
              </>
                
            )}
            <Text>{data.name.substring(0,25)}.{data.extension}</Text>
            <Text>{formatSize(data.size)}</Text>
            <Text>{data.date}</Text>
        </View>    
      </Pressable>
        
    );
}
