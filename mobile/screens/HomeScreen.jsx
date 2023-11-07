import { StyleSheet, Text, View, Pressable, ScrollView, Animated, PanResponder, TextInput, Button, Alert, FlatList, SafeAreaView , Dimensions} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { EventRegister } from 'react-native-event-listeners';
import FileThumbnail from '../components/FileThumnail';
import MediaPlayer from '../components/MediaPlayer';

export default function  HomeScreen({ setSelectedUrl }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [sound, setSound] = useState(null);
  const [data, setData] = useState([])
  // const [selectedUrl, setSelectedUrl] = useState(null);

  // debug function
  const logFiles = async () => {
    try {
      const dirUri = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(dirUri);
      console.log('Files in Document Directory:');
      files.forEach((fileName, index) => {
        console.log(`${index + 1}. ${fileName}`);
      });
    } catch (error) {
      console.error('Error reading document directory:', error);
    }
  };

    useEffect(() => {
      // createDirectory();
      logFiles();

      // FETCH
      const fetchFiles = async () => {
        const dir = FileSystem.documentDirectory;
        const files = await FileSystem.readDirectoryAsync(dir);
        setMediaFiles(files.filter(file => file.endsWith('.mp4') || file.endsWith('.mp3')));
      };

      fetchFiles();


      // DATABASE

      const db = SQLite.openDatabase('files.db');

      db.transaction(tx => {
        tx.executeSql("SELECT * FROM files", [], (tx, results) => {
          
          setData(results.rows._array);
          data.map((item) => {
            console.log(item);
          })
        });
      });

      // LISTENER
      const listener = EventRegister.addEventListener('closeMediaPlayer', (data) => {
        console.log(data);
        setSelectedUrl(null);
      });
      return () => {
        EventRegister.removeEventListener(listener);
      }
    }, []);

  
    return (
        <SafeAreaView>
            <ScrollView style={{minHeight:"100%",backgroundColor: '#fff',}}>
              <View style={styles.container} >
                {data.map((item) => (
                  <React.Fragment key={item.id}>
                  <FileThumbnail data={item} onSelect={(url) => setSelectedUrl(url)} />
                  </React.Fragment>
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
    height: '100%',
    minHeight:"100%"
  },
});