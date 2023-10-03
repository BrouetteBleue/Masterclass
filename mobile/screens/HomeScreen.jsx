import { StyleSheet, Text, View, Pressable, TextInput, Button, Alert, FlatList, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Video , Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function  PromotionsScreen() {
	const [mediaFiles, setMediaFiles] = useState([]);
    const [sound, setSound] = useState(null);

    useEffect(() => {
      const fetchFiles = async () => {
        const dir = FileSystem.documentDirectory;
        const files = await FileSystem.readDirectoryAsync(dir);
        setMediaFiles(files.filter(file => file.endsWith('.mp4') || file.endsWith('.mp3')));
      };

      fetchFiles();
    }, []);

    const playSound = async (uri) => {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    };
  
    return (
        <SafeAreaView>
            <View>
                <FlatList
                data={mediaFiles}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View>
                    <Text>{item}</Text>
                    {item.endsWith('.mp3') ? (
                        <Button title="Play Audio" onPress={() => playSound(`${FileSystem.documentDirectory}${item}`)} />
                    ) : (
                        <Video
                        source={{ uri: `${FileSystem.documentDirectory}${item}` }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={false}
                        resizeMode="cover"
                        shouldPlay={false}
                        style={{ width: 300, height: 300 }}
                        />
                    )}
                    </View>
                )}
                />
            </View>
        </SafeAreaView>
    );
}
