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
  const [videoHeight, setVideoHeight] = useState("30%");

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const [isBottom, setIsBottom] = useState(false);


  const opacity = useRef(new Animated.Value(1)).current;
  const boxHeight = useRef(new Animated.Value(windowHeight)).current;
  const boxWidth = useRef(new Animated.Value(windowWidth)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  

  let initialX = 0;
  let initialY = 0;
  let lockedDirection = null;
  const initialVals = useRef({x: 0, y: 0, height: windowHeight, width: windowWidth});
  
  let tapGesture = false;

  const mooveAnimation = (gestureY , initialH , initialW) => {
    let deltaY = gestureY * 1.35; // values for the position of the block when is mooving (may depend of the device)
    let deltaX = deltaY * 0.45;
    let newHeight;
    let newWidth;
  
    // if the block is mooving up, decrease the size of the block
    if (deltaY >= 0) {
      newHeight = Math.max(100, initialH - deltaY);
      newWidth = Math.max(150, initialW - deltaX);
    } else {
      // else increase the size of the block
      newHeight = Math.min(windowHeight, initialH - deltaY);
      newWidth = Math.min(windowWidth, initialW - deltaX);
    }
  
    // set the limits 
    let targetY = initialY + deltaY;
    let targetX = initialX + deltaX;

    targetY = Math.min(Math.max(targetY, 0), 610); // position for iphone 11
    targetX = Math.min(Math.max(targetX, 0), 250); 
    
    // set the new values at each frame
    boxHeight.setValue(newHeight);
    boxWidth.setValue(newWidth);
    panY.setValue(targetY);
    panX.setValue(targetX);
  }


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        tapGesture = true; // if the user touches the block, it's a tap gesture
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        tapGesture = false; // if the user moves the block, it's a drag gesture, not a tap
        return true;
      },
      onPanResponderMove: (_, gestureState) => {

        // if the block is at the bottom , lock the direction of the gesture
        if (!lockedDirection) {
          if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
            lockedDirection = "vertical";
          } else {
            lockedDirection = "horizontal";
          }
        }

        // if the block is at the bottom 
        if (isBottom) {

          // if the direction is horizontal, move the block horizontally and fade it out
          if (lockedDirection === "horizontal") {
            panX.setValue(initialX + gestureState.dx);
            let newOpacity = 1 - Math.abs(gestureState.dx) / windowWidth;
            newOpacity = Math.max(0, Math.min(1, newOpacity)); // Limiter entre 0 et 1
            opacity.setValue(newOpacity);
          } else {
            // else moove to the top
            mooveAnimation(gestureState.dy , initialHeight , initialWidth)
          }
        } else {
      

          // Disable the vertical gesture if the block is at the top
          if ((initialY >= 610 && gestureState.dy > 0) || (initialHeight <= 100 && gestureState.dy > 0)) {
            return;
          }

          mooveAnimation(gestureState.dy , initialHeight , initialWidth)
        }
      },
      // When the user touches the block set the initial values
      onPanResponderGrant: () => {
        const { x, y, height, width } = initialVals.current;
        initialX = x;
        initialY = y;
        initialHeight = height;
        initialWidth = width;      
        lockedDirection = null; // reset the locked direction
      }, 

      // When the user releases the block
      onPanResponderRelease: (_, gestureState) => {

        // if the block is at the bottom and the direction is horizontal AND the distance was more than 150 px => close the block
        if (isBottom && Math.abs(gestureState.dx) > 150) {
          Animated.parallel([
            Animated.timing(panX, {
              toValue: gestureState.dx > 0 ? windowWidth : -windowWidth, // move the block out of the screen
              duration: 300,
              useNativeDriver: false, 
            }),
            Animated.timing(opacity, {
              toValue: 0, // fade out the block
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            setSelectedUrl(null); // reset the selected video url
          });
          return;
        }

        // if the block is at the bottom and the direction is horizontal AND the distance was less than 150 px => reset the block to initial bottom position
        else if(isBottom && Math.abs(gestureState.dx) < 150) { 
          // Reset opacity
          opacity.setValue(1);
          
          // set the block to initial bottom position
          panX.setValue(initialVals.current.x);
          panY.setValue(initialVals.current.y);
          boxHeight.setValue(initialVals.current.height);
          boxWidth.setValue(initialVals.current.width);
        }


        let currentX = panX._value;
        let currentY = panY._value;
        let currentHeight = boxHeight._value;
        let currentWidth = boxWidth._value;
      
        const threshold = 100; // minimal distance to trigger animation
        
        let targetX = initialX; // target values for animation transition (reset to initial values by default)
        let targetY = initialY;
        let targetHeight = initialHeight;
        let targetWidth = initialWidth;
      
        // if the gesture is a tap and the block is at the bottom of the screen, move it to the top
        if (tapGesture && initialY === 610) {  
          targetY = 0;
          targetX = 0;
          targetHeight = windowHeight;
          targetWidth = windowWidth;
        }

        // Animation down values
        if (initialY === 0 && currentY > threshold) {
          targetY = 610;
          targetX = 250;
          targetHeight = 100;
          targetWidth = 150;
        }
        // Anivmation up values
        else if (initialY === 610 && currentY < initialY - threshold) {
          targetY = 0;
          targetX = 0;
          targetHeight = windowHeight;
          targetWidth = windowWidth;
        }

        // if the block is at the bottom, set the flag to true
        if (targetY === 610) { 
          setIsBottom(true);
          console.log("bottom");
        } else {
          setIsBottom(false);
          // console.log("bottom");
        }
        
       // Animation up or down with size change
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

    useEffect(() => {
      console.log("caca");
      setVideoHeight(isBottom ? "100%" : "30%");
    }, [isBottom]);

    // reset animation values when a new video is selected
    useEffect(() => {
      if (selectedUrl !== null) {
        panX.setValue(0);
        panY.setValue(0);
        boxHeight.setValue(windowHeight);
        boxWidth.setValue(windowWidth);
        opacity.setValue(1);
        setIsBottom(false);
        initialVals.current = { x: 0, y: 0, height: windowHeight, width: windowWidth };
      }
    }, [selectedUrl]);
  
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

            {selectedUrl && 
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                backgroundColor: 'red',
                width: boxWidth,
                height: boxHeight,
                transform: [{ translateX: panX }, { translateY: panY }],
                position: 'absolute',
                opacity: isBottom ? opacity : 1,
                zIndex: 999,
              }}
            >
              {/* <View style={{ width: '100%', height: isBottom ? '100%' : '30%' }}> */}
                <Video
                  source={{ uri: selectedUrl }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode="cover"
                  shouldPlay
                  isLooping
                  style={{ width: '100%', height: videoHeight }}
                />
              {/* </View> */}
            </Animated.View>
          }
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

  },
});