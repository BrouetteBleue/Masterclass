import { StyleSheet, Text, View, Pressable, ScrollView, Animated, PanResponder, TextInput, Button, Alert, FlatList, SafeAreaView , Dimensions} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import FileThumbnail from '../components/FileThumnail';

export default function  PromotionsScreen() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [sound, setSound] = useState(null);
  const [data, setData] = useState([])
  const [selectedUrl, setSelectedUrl] = useState(null);


  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const isBottom = useRef(false);

  const oldGestureY = useRef(0);


  const listOpacity = useRef(new Animated.Value(1)).current;

  const opacity = useRef(new Animated.Value(1)).current;
  const boxHeight = useRef(new Animated.Value(windowHeight)).current;
  const boxWidth = useRef(new Animated.Value(windowWidth)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const [videoResizeMode, setVideoResizeMode] = useState('cover');

  let initialX = 0;
  let initialY = 0;
  const initialVals = useRef({x: 0, y: 0, height: windowHeight, width: windowWidth});
  const lockedDirection = useRef(null);
  
  let tapGesture = false;

  const mooveAnimation = (gestureY , initialH , initialW, direction) => {
    let deltaY = gestureY * 1.45; // values for the position of the block when is mooving (may depend of the device)
    let deltaX = deltaY * 0.45;
    let newHeight;
    let newWidth;
    const maxY = 250 // max position of the bloc to remove the "bottom" flag

    // if the block is mooving down, decrease the size of the block
    if (deltaY >= 0) {
      newHeight = Math.max(90, initialH - deltaY);
      newWidth = Math.max(160, initialW - deltaX);
    } else {
      // else increase the size of the block
      newHeight = initialH - (deltaY * 1.45 ) >= windowHeight ? windowHeight : initialH - deltaY * 1.45;
      newWidth = initialW - deltaX >= windowWidth ? windowWidth : initialW - deltaX;
    }
  // console.log("newHeight", newHeight, "newWidth", newWidth);
    // set the limits 
    let targetY = initialY + deltaY;
    let targetX = initialX + deltaX;

    targetY = Math.min(Math.max(targetY, 0), 610); // position for iphone 11
    targetX = Math.min(Math.max(targetX, 0), 250); 

    if (newHeight >= windowHeight) {
      setVideoResizeMode('contain');
    } else {
      setVideoResizeMode('cover');
    }

    if (targetY >= maxY) {
      isBottom.current = false;
    } 

 console.log("initialH", initialH, "initialW", initialW, "initialY", initialY, "initialX", initialX, "deltaY", deltaY, "deltaX", deltaX, "newHeight", newHeight, "newWidth", newWidth, "targetY", targetY, "targetX", targetX, "isBottom", isBottom.current,);
    
    // set the new values at each frame
    boxHeight.setValue(newHeight);
    boxWidth.setValue(newWidth);
    panY.setValue(targetY);
    panX.setValue(targetX);

    if(direction === "vertical") {

      if ((initialH >= 610 && gestureY < 0) || (initialH  <= 100 && gestureY > 0)) {
        return;
      }
      let currentDirection = gestureY > oldGestureY.current ? 'down' : 'up';
      console.log("currentDirection", currentDirection, "gestureY", gestureY, "oldGestureY", oldGestureY.current );
      let opacity = 0;
      // console.log("oldGestureY", oldGestureY.current, "gestureY", gestureY);

      // quand gesture est plus grand que l'ancien = on descend 
      if(oldGestureY.current < gestureY ) {
        if(initialY === 0) {
         opacity = 1 - Math.abs(gestureY) / windowWidth;
        }
        else{
          opacity = 0 + Math.abs(gestureY) / windowWidth;
        }
      } else if (oldGestureY.current > gestureY){
        if(initialY === 610) {
          opacity = 0 + Math.abs(gestureY) / windowWidth;
        }
        else{
         opacity = 1 - Math.abs(gestureY) / windowWidth;
        }
      }
      opacity = Math.max(0, Math.min(1, opacity));
      listOpacity.setValue(opacity);
    }
  }


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log("onStartShouldSetPanResponder");
        tapGesture = true; // if the user touches the block, it's a tap gesture
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        console.log("onMoveShouldSetPanResponder");
        tapGesture = false; // if the user moves the block, it's a drag gesture, not a tap
        console.log("tapGesture", tapGesture);
        return true;
      },
      onPanResponderMove: (_, gestureState) => {
        // console.log("panY", panY._value , "panX", panX._value);
        // console.log("gestureState.dy", gestureState.dy);
        // console.log("listOpacity", listOpacity._value);

        // if the block is at the bottom , lock the direction of the gesture
        if (!lockedDirection.current) {
          if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
            lockedDirection.current = "vertical";
          } else {
            lockedDirection.current = "horizontal";
          }
        }

        // if the block is at the bottom 
        if (isBottom.current) {

          // if the direction is horizontal, move the block horizontally and fade it out
          if (lockedDirection.current === "horizontal") {
            panX.setValue(initialX + gestureState.dx);
            let newOpacity = 1 - Math.abs(gestureState.dx) / windowWidth;
            newOpacity = Math.max(0, Math.min(1, newOpacity)); // Limiter entre 0 et 1
            opacity.setValue(newOpacity);
          } else {
            // else moove to the top
            mooveAnimation(gestureState.dy , initialHeight , initialWidth , lockedDirection.current)

            oldGestureY.current = gestureState.dy;
          }
        } else {
      

          // Disable the vertical gesture if the block is at the top
          if ((initialY >= 610 && gestureState.dy > 0) || (initialHeight <= 100 && gestureState.dy > 0)) {
            return;
          }

          mooveAnimation(gestureState.dy , initialHeight , initialWidth , lockedDirection.current)

          oldGestureY.current = gestureState.dy;

        }
      },
      // When the user touches the block set the initial values
      onPanResponderGrant: () => {
        const { x, y, height, width } = initialVals.current;
        initialX = x;
        initialY = y;
        initialHeight = height;
        initialWidth = width;      
        lockedDirection.current = null; // reset the locked direction
      }, 

      // When the user releases the block
      onPanResponderRelease: (_, gestureState) => {

        // if the block is at the bottom and the direction is horizontal AND the distance was more than 150 px => close the block
        if (isBottom.current && Math.abs(gestureState.dx) > 150) {
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
        else if(isBottom.current && Math.abs(gestureState.dx) < 150) { 
          console.log("reset", isBottom.current , "targetY", initialY, );
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
          // console.log("currentY", currentY, "threshold", threshold , "initialY", initialY, "currentY - initialY", currentY - 100);
          targetY = 0;
          targetX = 0;
          targetHeight = windowHeight;
          targetWidth = windowWidth;
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }

        // Animation down values
        if (initialY === 0 && currentY > threshold) {
          targetY = 610;
          targetX = 250;
          targetHeight = 90;
          targetWidth = 160;
        }
        // Anivmation up values
        if (!tapGesture && initialY === 610 && currentY < initialY - threshold) {
          // console.log("currentY", currentY, "initialY", initialY, "gestureState.dy", gestureState.dy, "panY", panY._value);
          targetY = 0;
          targetX = 0;
          targetHeight = windowHeight;
          targetWidth = windowWidth;
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }

        // if the block is at the bottom, set the flag to true
        if (targetY === 610) { 
          isBottom.current = true;
        } else {
          isBottom.current = false;
        }

        if (initialY === 0 && currentY > threshold) {
          Animated.timing(listOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
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


    // reset animation values when a new video is selected
    useEffect(() => {
      if (selectedUrl !== null) {
        panX.setValue(0);
        panY.setValue(0);
        boxHeight.setValue(windowHeight);
        boxWidth.setValue(windowWidth);
        opacity.setValue(1);
        listOpacity.setValue(1);
        isBottom.current = false;
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
                width: boxWidth,
                height: boxHeight,
                transform: [{ translateX: panX }, { translateY: panY }],
                position: 'absolute',
                opacity: isBottom.current ? opacity : 1,
                zIndex: 999,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              <View {...panResponder.panHandlers} style={{ width: '100%', height: '26%',minHeight: 100, zIndex: 1}}>
                <Video
                  source={{ uri: selectedUrl }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={videoResizeMode}
                  shouldPlay
                  isLooping
                  style={{ width: "100%", height: "100%", minHeight: 100, backgroundColor: 'blue'}}
                  aspectRatio={16/9}
                  pointerEvents="none"
                />
              </View >
              <Animated.View style={{ width: '100%', height: '74%', backgroundColor: 'white', opacity: listOpacity}} >
                <TextInput style={{ width: '100%', height: '20%', backgroundColor: 'green', maxHeight: "20%"  }}  placeholder='caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3 caca1 caca2 caca3'/>
                <TextInput style={{ width: '100%', height: '20%', backgroundColor: 'brown', maxHeight: "20%" }} placeholder='caca1 caca2 caca3'/>
                <TextInput style={{ width: '100%', height: '20%', backgroundColor: 'yellow', maxHeight: "20%" }} placeholder='caca1 caca2 caca3'/>
                <TextInput style={{ width: '100%', height: '20%', backgroundColor: 'pink', maxHeight: "20%" }} placeholder='caca1 caca2 caca3'/>
              </Animated.View>

            </Animated.View>
          }
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    width: '100%',
    height: '100%',

  },
});