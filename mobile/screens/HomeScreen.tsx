import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import * as FileSystem from 'expo-file-system';
import {EventRegister} from 'react-native-event-listeners';
import FileThumbnail from '../components/FileThumnail';
import {createStackNavigator} from '@react-navigation/stack';
import {useCurrentUrl} from '../hooks/useCurrentUrl';
import {useNavigationContext} from '../hooks/useHeaderContext';
import {useFocusEffect} from '@react-navigation/native';
import {fetchFiles} from '../functions/read';

const Stack = createStackNavigator();

export const FileExplorerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // presentation: 'modal',
      }}>
      <Stack.Screen
        name="FileExplorer"
        component={HomeScreen}
        initialParams={{folderPath: FileSystem.documentDirectory}} // define root folder
      />
    </Stack.Navigator>
  );
};

export const HomeScreen = ({route, navigation}) => {
  const {setCurrentUrl} = useCurrentUrl();
  const {setCurrentTitle, setCanGoBack, setFolderId} = useNavigationContext();

  const handleFolderPress = (id: number, subFolderName: string) => {
    setCurrentTitle(subFolderName);
    setCanGoBack(true);
    setFolderId(id);
    navigation.push('FileExplorer', {folder: id, title: subFolderName});
  };

  const handleFilePress = (url: string) => {
    setCurrentUrl(url);
    // console.log("AAAAAAAAAA"+currentUrl);
    // console.log(url);
  };

  useFocusEffect(
    useCallback(() => {
      const route = navigation.getState().routes[navigation.getState().index];
      setCurrentTitle(route.params?.title || 'Home'); // set title

      // determine if back button should be shown
      setCanGoBack(navigation.getState().index > 0);
console.log("FILE SYSTEM DOCUMENT DIRECTORY"+FileSystem.documentDirectory);

      fetchFiles(route.params?.folder || null)
        .then(data => {
          data.map((item) => {
            console.log("AAAAAAAAAA"+item.name);
          });
          setData(data);
        })
        .catch(err => {
          console.log(err);
        });

      console.log(route.params?.folderPath);
    }, [navigation]),
  );

  const [data, setData] = useState([]);

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

    // LISTENER
    const listener = EventRegister.addEventListener(
      'closeMediaPlayer',
      data => {
        setCurrentUrl(null);
      },
    );

    return () => {
      if (typeof listener === 'string') {
        EventRegister.removeEventListener(listener);
      }
    };
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
      minHeight: '100%',
    },
    // ...
  });
  return (
    <SafeAreaView>
      <ScrollView style={{minHeight: '100%', backgroundColor: '#fff'}}>
        <View style={styles.container}>
          {data.map(item => {
            // set composed key to avoid same id warning
            const key = item.extension
              ? `file-${item.id}`
              : `folder-${item.id}`;
            return (
              <React.Fragment key={key}>
                {item.extension ? (
                  <FileThumbnail
                    data={item}
                    onSelect={url => handleFilePress(url)}
                  />
                ) : (
                  <FileThumbnail
                    data={item}
                    onSelect={(id, name) => handleFolderPress(id, name)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
