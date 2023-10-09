import { StyleSheet, Text, View, Pressable, ScrollView, Animated, PanResponder, TextInput, Button, Alert, FlatList, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import FileThumbnail from '../components/FileThumnail';
import Modal from 'react-native-modal';

export default function  PromotionsScreen() {
	  const [mediaFiles, setMediaFiles] = useState([]);
    const [sound, setSound] = useState(null);
    const [data, setData] = useState([])
    const [selectedUrl, setSelectedUrl] = useState(null);
    const [boxHeight, setBoxHeight] = useState("50%"); // Hauteur initiale
    const panY = useRef(new Animated.Value(0)).current;

  
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          console.log('PanResponder init');
          return true;
        },
        onMoveShouldSetPanResponder: () => {
          console.log("Should set pan responder");
          return true;
        },
        onPanResponderMove: (_, gestureState) => {
          console.log("gestureState: ", gestureState);
          Animated.event([null, { dy: panY }], { useNativeDriver: false })(_, gestureState);
        },
        onPanResponderRelease: () => {
          console.log("panY._value: ", panY._value);
          if (Math.abs(panY._value) > 50) {
            setBoxHeight("25%");
          } else {
            setBoxHeight("50%");
          }
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => panY.setValue(0));
        },
      })
    ).current;

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
            <ScrollView >
              <View style={styles.container} >
              {data.map((item) => (
                <React.Fragment key={item.id}>
                <FileThumbnail data={item} onSelect={(url) => setSelectedUrl(url)} />
                </React.Fragment>
              ))}
              </View>
            </ScrollView>

            <View>

            <Modal 
              style={{backgroundColor: "green" , width: "100%", margin: 0 }} 
              isVisible={selectedUrl !== null} 
              animationType="slide"  
              swipeDirection= {["down","right"]}
              panResponderThreshold={500}
              // onSwipeComplete={() => setBoxHeight("25%")}  // Réduire la taille ici
              // onSwipeCancel={() => setBoxHeight("50%")}
            >
            <SafeAreaView style={{ flex: 1 }}>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                backgroundColor: 'red',
                width: '100%',
                height: boxHeight,
                transform: [{ translateY: panY }],
                zIndex: 999,
              }}
            ></Animated.View>
              <Pressable
                onPress={() => setSelectedUrl(null)}>
                <Text style={styles.textStyle}>Hide Modal</Text>
              </Pressable>
              </SafeAreaView>
            </Modal>
            
            </View>
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