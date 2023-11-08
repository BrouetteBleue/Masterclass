import { StyleSheet, Text, View, Pressable, ScrollView, Animated, PanResponder, TextInput, Button, Alert, FlatList, SafeAreaView ,TouchableWithoutFeedback, Dimensions} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { EventRegister } from 'react-native-event-listeners';
import MediaPlayerControl, { LoopState } from './MediaPlayerControl';


interface MediaPlayerProps {
    uri: string;
    onClose: () => void;
  }


export default function  MediaPlayer( {uri, onClose}: MediaPlayerProps) {

  const filePath = `${FileSystem.documentDirectory}${uri}`;
  console.log("url", uri);
  

    const [mediaFiles, setMediaFiles] = useState([]);
    const [sound, setSound] = useState(null);
    const [data, setData] = useState([])
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMediaControlVisible, setIsMediaControlVisible] = useState(true);
    const [timerId, setTimerId] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [loopState, setLoopState] = useState<LoopState>(LoopState.NoLoop);

    const [isAtBottom, setIsAtBottom] = useState(false); // flag for the rest of the app

    // Animation vars
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height -90;
    const isBottom = useRef(false);// flag for the animation
    const oldGestureY = useRef(0);
    const listOpacity = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const boxHeight = useRef(new Animated.Value(windowHeight)).current;
    const boxWidth = useRef(new Animated.Value(windowWidth)).current;
    const panY = useRef(new Animated.Value(90)).current;
    const panX = useRef(new Animated.Value(0)).current;
    const [videoResizeMode, setVideoResizeMode] = useState<ResizeMode>(ResizeMode.COVER);
    const initialVals = useRef({x: 0, y: 90, height: windowHeight, width: windowWidth});
    const lockedDirection = useRef(null);
    let initialX = 0;
    let initialY = 90;
    let initialHeight: number;
    let initialWidth: number;
    let tapGesture = false;
  
    const mooveAnimation = (gestureY: number, initialH: number, initialW: number, direction: string): void => {
      let deltaY: number = gestureY * 1.45; // values for the position of the block when is mooving (may depend of the device)
      let deltaX: number = deltaY * 0.45;
      let newHeight: number;
      let newWidth: number;
      const maxY = 240 // max position of the bloc to remove the "bottom" flag
  
      // if the block is mooving down, decrease the size of the block
      if (deltaY >= 0) {
        newHeight = Math.max(90, initialH - deltaY);
        newWidth = Math.max(160, initialW - deltaX);
      } else {
        // else increase the size of the block
        newHeight = initialH - (deltaY * 1.45 ) >= windowHeight ? windowHeight : initialH - deltaY * 1.45;
        newWidth = initialW - deltaX >= windowWidth ? windowWidth : initialW - deltaX;
      }

      // set the limits 
      let targetY: number = initialY + deltaY;
      let targetX: number = initialX + deltaX;
  
      targetY = Math.min(Math.max(targetY, 90), 710); // position for iphone 11
      targetX = Math.min(Math.max(targetX, 0), 240); 
  
      if (newHeight >= windowHeight) {
        console.log("contain");
        
        setVideoResizeMode(ResizeMode.CONTAIN);
      } else {
        console.log("cover");
        setVideoResizeMode(ResizeMode.COVER)
      }
  
      if (targetY >= maxY) {
        isBottom.current = false;
        setIsAtBottom(false); // fix le cancel de mouvement si il va pas asser loing
      } 
  
  //  console.log("initialH", initialH, "initialW", initialW, "initialY", initialY, "initialX", initialX, "deltaY", deltaY, "deltaX", deltaX, "newHeight", newHeight, "newWidth", newWidth, "targetY", targetY, "targetX", targetX, "isBottom", isBottom.current, "maxY", maxY);
      
      // set the new values at each frame
      boxHeight.setValue(newHeight);
      boxWidth.setValue(newWidth);
      panY.setValue(targetY);
      panX.setValue(targetX);
  
      if(direction === "vertical") {
  
        if ((initialH >= 710 && gestureY < 0) || (initialH  <= 100 && gestureY > 0)) {
          return;
        }

        let opacity = 0;
  
        // quand gesture est plus grand que l'ancien = on descend 
        if(oldGestureY.current < gestureY ) {
          if(initialY === 90) {
           opacity = 1 - Math.abs(gestureY) / windowWidth;
          }
          else{
            opacity = 0 + Math.abs(gestureY) / windowWidth;
          }
        } else if (oldGestureY.current > gestureY){
          if(initialY === 710) {
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
          setIsMediaControlVisible(false);     
          return true;
        },
        onMoveShouldSetPanResponder: () => {
          console.log("onMoveShouldSetPanResponder");
          tapGesture = false; // if the user moves the block, it's a drag gesture, not a tap
          console.log("tapGesture", tapGesture);
          setIsMediaControlVisible(false);     
          return true;
        },
        onPanResponderMove: (_, gestureState) => { 
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
            if ((initialY >= 710 && gestureState.dy > 0) || (initialHeight <= 100 && gestureState.dy > 0)) {
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
  
          // if the block is at the bottom and the direction is horizontal AND the distance was more than 100 px => close the block
          if (isBottom.current && Math.abs(gestureState.dx) > 100) {
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
              EventRegister.removeAllListeners();
              close() // reset the selected video url
          
            });
            return;
          }
  
          // if the block is at the bottom and the direction is horizontal AND the distance was less than 100 px => reset the block to initial bottom position
          else if(isBottom.current && Math.abs(gestureState.dx) < 100) { 
            // Reset opacity
            opacity.setValue(1);
            
            // set the block to initial bottom position
            panX.setValue(initialVals.current.x);
            panY.setValue(initialVals.current.y);
            boxHeight.setValue(initialVals.current.height);
            boxWidth.setValue(initialVals.current.width);
          } 
        
  
          let currentX = (panX as any)._value;
          let currentY = (panY as any)._value;
          let currentHeight = (boxHeight as any)._value;
          let currentWidth = (boxWidth as any)._value;
        
          const threshold = 200; // minimal distance to trigger animation
          
          let targetX = initialX; // target values for animation transition (reset to initial values by default)
          let targetY = initialY;
          let targetHeight = initialHeight;
          let targetWidth = initialWidth;
        
          // if the gesture is a tap and the block is at the bottom of the screen, move it to the top
          if (tapGesture && initialY === 710) {  
            // console.log("currentY", currentY, "threshold", threshold , "initialY", initialY, "currentY - initialY", currentY - 100);
            targetY = 90;
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
          if (initialY === 90 && currentY > threshold) {
            targetY = 710;
            targetX = 240;
            targetHeight = 90;
            targetWidth = 160;
          }
          // Anivmation up values
          if (!tapGesture && initialY === 710 && currentY < initialY - threshold) {
            //  console.log("currentY", currentY, "initialY", initialY, "gestureState.dy", gestureState.dy, "panY", (panY as any)._value);
            targetY = 90;
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
          if (targetY >= 500) { 
            isBottom.current = true;
            setTimeout(() => {
            setIsAtBottom(true);
            },300);
          } else {
            isBottom.current = false;
            setIsAtBottom(false);
          }
  
          if (initialY === 90 && currentY > threshold) {
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


    // reset animation values when a new video is selected
    useEffect(() => {
        if (uri !== null) {
            panX.setValue(0);
            panY.setValue(90);
            boxHeight.setValue(windowHeight);
            boxWidth.setValue(windowWidth);
            opacity.setValue(1);
            listOpacity.setValue(1);
            isBottom.current = false;
            initialVals.current = { x: 0, y: 90, height: windowHeight, width: windowWidth };
            setIsAtBottom(false);
          }
        }, [uri]);

        const close = () => {
          EventRegister.emit('closeMediaPlayer', true);
        }

        const handleTap = () => {
          if(isBottom.current) {
            return;
          }
          setIsMediaControlVisible(!isMediaControlVisible);       
          hideMediaControl();
        };
        
        const handlePlay = async () => {
          setIsPlaying(!isPlaying);
        }

        const handleSkipBackward = async () => {
         console.log("skip");
        }

        const handleSkipForward = async () => {
          console.log("skip");  
        }

        const handleMute = async () => {
          setIsMuted(!isMuted);
        }

        const handleLoop = async () => {
          console.log("loop");
          if(loopState === 2) {
            setLoopState(0);
            return;
          }
          setLoopState(loopState + 1);
        }

        const handleFullScreen = async () => {
          goFullscreen();
          setIsFullScreen(!isFullScreen);

        }

        const goFullscreen = () => {
          videoRef.current.presentFullscreenPlayer();
        };

        const hideMediaControl = () => {
          if (timerId) {
            clearTimeout(timerId);
          }
          const id = setTimeout(() => {
            setIsMediaControlVisible(false);
          }, 4000);
        
          setTimerId(id);
        };

        useEffect(() => {
          hideMediaControl();
        }, [uri]);


    return (
        <Animated.View
              {...panResponder.panHandlers}
              style={{
                width: boxWidth,
                height: boxHeight,
                transform: [{ translateX: panX }, { translateY: panY }],
                position: 'absolute',
                opacity: opacity ,
                zIndex: 999,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
          <View {...panResponder.panHandlers} style={{ width: '100%', height: '29%',minHeight: 100, zIndex: 1}}>
            <Video
              ref={videoRef}
              source={{ uri: uri }}
              rate={1.0}
              volume={1.0}
              isMuted={isMuted}
              resizeMode={videoResizeMode}
              shouldPlay={isPlaying}
              isLooping
              style={{ width: "100%", height: "100%", minHeight: 100, backgroundColor: 'black'}}
              pointerEvents="none"
            />
            {
            !isBottom.current &&
            <MediaPlayerControl
              isMediaControlVisible={isMediaControlVisible}
              handleTap={handleTap}
              handleSkipBackward={handleSkipBackward}
              handlePlay={handlePlay}
              handleSkipForward={handleSkipForward}
              handleMute={handleMute}
              handleLoop={handleLoop}
              handleFullScreen={handleFullScreen}
              isPlaying={isPlaying}
              isMuted={isMuted}
              loopState={loopState}
              isFullScreen={isFullScreen}
            />
          }
          </View >
          {
            !isAtBottom &&
            <Animated.View style={{ width: '100%', height: '71%',backgroundColor:"red" ,opacity: listOpacity}} >
            <View style={{ width: '100%', height: '20%', backgroundColor: 'green', maxHeight: "20%"  }} />
            <View style={{ width: '100%', height: '20%', backgroundColor: 'brown', maxHeight: "20%" }} />
            <View style={{ width: '100%', height: '20%', backgroundColor: 'yellow', maxHeight: "20%" }} />
            <View style={{ width: '100%', height: '20%', backgroundColor: 'pink', maxHeight: "20%" }} />
          </Animated.View>
          }
          

        </Animated.View>
    );

}