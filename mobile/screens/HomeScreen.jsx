import { StyleSheet, Text, View, Pressable, ScrollView, SafeAreaView} from 'react-native';
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { EventRegister } from 'react-native-event-listeners';
import FileThumbnail from '../components/FileThumnail';
import { createStackNavigator } from '@react-navigation/stack';
import { useCurrentUrl } from '../hooks/useCurrentUrl';
import { useNavigationContext } from '../hooks/useHeaderContext';
import { useFocusEffect } from '@react-navigation/native';

const Stack = createStackNavigator();

export const FileExplorerStack = () => {
  return (
    <Stack.Navigator screenOptions={{
          headerShown: false,
        }}>
      <Stack.Screen
        name="FileExplorer"
        component={HomeScreen}
        initialParams={{ folderPath: FileSystem.documentDirectory }} // define root folder
        
      />
    </Stack.Navigator>
  );
};


const HomeScreen = ({ route, navigation }) => {
  const { folderPath } = route.params;
  const { setCurrentUrl } = useCurrentUrl();
  const { setCurrentTitle, setCanGoBack } = useNavigationContext();

  const handleFolderPress = (subFolderName) => {
    const subFolderPath = `${folderPath}${subFolderName}`; 
    setCurrentTitle(subFolderName);
    setCanGoBack(true);
    navigation.push('FileExplorer', { folderPath: subFolderPath, title: subFolderName.slice(0, -1) }); 
  };

  useFocusEffect(
    useCallback(() => {
      const route = navigation.getState().routes[navigation.getState().index];
      setCurrentTitle(route.params?.title || 'Home'); // set title
      // determine if back button should be shown
      setCanGoBack(navigation.getState().index > 0);
      console.log(route.params?.folderPath);
    }, [navigation])
  );

  const [data, setData] = useState([])

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

      logFiles();

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
        setCurrentUrl(null);
      });
      return () => {
        EventRegister.removeEventListener(listener);
      }
    }, []);

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
  // ...
});
    return (
        <SafeAreaView>
            <ScrollView style={{minHeight:"100%",backgroundColor: '#fff',}}>
              <View style={styles.container} >
                {data.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.extension ? 
                      <FileThumbnail data={item} onSelect={(url) => setCurrentUrl(url)} />
                     : <FileThumbnail data={item} onSelect={(url) => handleFolderPress(url)} /> }
                  
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>
        </SafeAreaView>
    );
}
