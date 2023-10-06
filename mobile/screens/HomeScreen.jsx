import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Button, Alert, FlatList, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import FileThumbnail from '../components/FileThumnail';

export default function  PromotionsScreen() {
	  const [mediaFiles, setMediaFiles] = useState([]);
    const [sound, setSound] = useState(null);
    const [data, setData] = useState([]);
  


    useEffect(() => {
      const fetchFiles = async () => {
        const dir = FileSystem.documentDirectory;
        const files = await FileSystem.readDirectoryAsync(dir);
        setMediaFiles(files.filter(file => file.endsWith('.mp4') || file.endsWith('.mp3')));
      };

      fetchFiles();


      const db = SQLite.openDatabase('files.db');

      db.transaction(tx => {
        tx.executeSql("SELECT * FROM files WHERE extension = 'mp4';", [], (tx, results) => {
          // const len = results.rows.length;
          // for (let i = 0; i < len; i++) {
          //   let row = results.rows.item(i);
          //   console.log(row);

          // }
          console.log(results.rows._array);
          setData(results.rows._array);

        });
      });
      
    }, []);

    const playSound = async (uri) => {
      if (sound) {
        await sound.unloadAsync();
      }
      console.log(uri);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    };
  
    return (
        <SafeAreaView>
            <ScrollView>
              <View style={styles.container} >
              {data.map((item) => (
                <>
                <FileThumbnail key={item.id} data={item} />
                </>
              ))}
              </View>
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
        container: {
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: 10,
          width: '100%',

        },
      });