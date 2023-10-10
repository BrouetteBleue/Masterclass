import { StyleSheet, Text, View, Pressable, ScrollView, Animated, PanResponder, TextInput, Button, Alert, FlatList, SafeAreaView , Dimensions} from 'react-native';
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
  // const [boxHeight, setBoxHeight] = useState("50%"); // Hauteur initiale
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;


  const boxHeight = useRef(new Animated.Value(270)).current;
  const boxWidth = useRef(new Animated.Value(windowWidth)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const dragDirection = useRef(new Animated.Value(0)).current;

  const initialVals = useRef({x: 0, y: 0, height: 270, width: windowWidth});
  
  let tapGesture = false;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        tapGesture = true;
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        tapGesture = false;
        return true;
      },
      onPanResponderMove: (_, gestureState) => {
        console.log("x", gestureState.dx, "y", gestureState.dy);
        // Empêcher le mouvement si le carré est déjà dans la position limite
        if ((initialY >= 660 && gestureState.dy > 0) || (initialHeight <= 100 && gestureState.dy > 0)) {
          return;
        }
      
        let deltaY = gestureState.dy * 1.35;
        let deltaX = deltaY * 0.45;
        let newHeight;
        let newWidth;
      
        if (deltaY >= 0) {
          newHeight = Math.max(100, initialHeight - deltaY);
          newWidth = Math.max(100, initialWidth - deltaX);
        } else {
          newHeight = Math.min(270, initialHeight - deltaY);
          newWidth = Math.min(windowWidth, initialWidth - deltaX);
        }
      
        // Appliquer les limites
        let targetY = initialY + deltaY;
        let targetX = initialX + deltaX;

        targetY = Math.min(Math.max(targetY, 0), 660); // entre 0 et 660
        targetX = Math.min(Math.max(targetX, 0), 300); // entre 0 et 300
        
        boxHeight.setValue(newHeight);
        boxWidth.setValue(newWidth);
        panY.setValue(targetY);
        panX.setValue(targetX);
      },
      onPanResponderGrant: () => {
        const { x, y, height, width } = initialVals.current;
        initialX = x;
        initialY = y;
        initialHeight = height;
        initialWidth = width;      
      },
      onPanResponderRelease: () => {
        let currentX = panX._value;
        let currentY = panY._value;
        let currentHeight = boxHeight._value;
        let currentWidth = boxWidth._value;
      
        const threshold = 100; // distance en pixels pour déclencher la transition
        
        let targetX = initialX;
        let targetY = initialY;
        let targetHeight = initialHeight;
        let targetWidth = initialWidth;
      
        if (tapGesture && initialY === 660) {  // Si c'est un tap et que le bloc est en bas
          targetY = 0;
          targetX = 0;
          targetHeight = 270;
          targetWidth = windowWidth;
        }

        // Depuis la position initiale
        if (initialY === 0 && currentY > threshold) {
          targetY = 660;
          targetX = 300;
          targetHeight = 100;
          targetWidth = 100;
        }
        // Pour la remontée
        else if (initialY === 660 && currentY < initialY - threshold) {
          targetY = 0;
          targetX = 0;
          targetHeight = 270;
          targetWidth = windowWidth;
        }
      
        Animated.parallel([
          Animated.spring(panX, {
            toValue: targetX,
            useNativeDriver: false,
          }),
          Animated.spring(panY, {
            toValue: targetY,
            useNativeDriver: false,
          }),
          Animated.spring(boxHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
          }),
          Animated.spring(boxWidth, {
            toValue: targetWidth,
            useNativeDriver: false,
          }),

        ]).start();
        initialVals.current = {
          x: targetX,
          y: targetY,
          height: targetHeight,
          width: targetWidth
        };
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
          console.log(results.rows._array);
          setData(results.rows._array);

        });
      });
      
    }, []);
  
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
              style={{ width: "100%", margin: 0 }} 
              isVisible={selectedUrl !== null} 
              animationType="slide"  
              swipeDirection= {"down"}
              panResponderThreshold={500}
              // onSwipeComplete={() => setBoxHeight("25%")}  // Réduire la taille ici
              // onSwipeCancel={() => setBoxHeight("50%")}
            >
            <SafeAreaView style={{ flex: 1 }}>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                backgroundColor: 'red',
                width: boxWidth,
                height: boxHeight,
                transform: [{ translateX: panX }, { translateY: panY }],
                zIndex: 999,
                // position: 'absolute',
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