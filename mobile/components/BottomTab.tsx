import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet,Dimensions, TextInput } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as FileSystem from 'expo-file-system';
import HomeScreen from '../screens/HomeScreen';
import WebScreen from '../screens/WebScreen';
import PlayerBtn from './Buttons/PlayerBtn';
import createFolder from '../functions/create';
const screenHeight = Dimensions.get('screen').height;

type RootTabParamList = {
    Home: String;
    Profile: String;
    Settings: String;
};

interface MenuOptionProps {
    label: string;
    onPress: () => void;
    isLastOption?: boolean; 
}

interface MenuOverlayProps {
    visible: boolean;
    onClose: () => void;
    createFolder?: () => void;
}

const Tab = createBottomTabNavigator<RootTabParamList>();

const HeaderButton = ({ onOpen }) => {
    return (
        <PlayerBtn 
            onPress={onOpen}
            size={30}
            svgPaths={["M6 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2z"]}
            style={{ marginRight: 20,  borderRadius: 100, }}
            fill='red'
        />
    )
}

const MenuOption = ({ label, onPress, isLastOption }: MenuOptionProps) => {
    return (
        <TouchableOpacity onPress={onPress} style={[
            styles.menuOption,
            isLastOption && styles.lastMenuOption
        ]}>
            <Text style={styles.menuText}>{label}</Text>
        </TouchableOpacity>
    );
};


const MenuOverlay = ({ visible, onClose, createFolder }: MenuOverlayProps) => {
    if (!visible) return null;

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            style={styles.overlay}
        >
            <View style={styles.menuContainer}>
                <MenuOption label="Ajouter depuis Fichiers" onPress={onClose} />
                <MenuOption label="Ajouter depuis la galerie" onPress={onClose} />
                <MenuOption label="Choisir plusieurs éléments" onPress={onClose} />
                <MenuOption label="Créer un dossier" onPress={createFolder} isLastOption />
            </View>

            <View style={styles.menuContainer}>
                <MenuOption label="Annuler" onPress={onClose} isLastOption />
            </View>
        </TouchableOpacity>
    );
};


const ModalCreateDirectory = ({onClose}) => {

    const [folderName, setFolderName] = useState('');
    // autofocus on input
    const inputRef = useRef(null);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // async function to handle Create button cause onPress can't be a promise
    const handleCreatePress = async () => {
        try {
            await createFolder(folderName.trim());
            // if good close modal
            onClose();
        } catch (error) {
            console.error(error);
        }
    };
    

    return (
      <View style={{position:"absolute", top:0, left:0, width:"100%", height:"100%",  justifyContent:'center', alignItems:'center',backgroundColor: 'rgba(0, 0, 0, 0.5)',}} >
        <View style={{backgroundColor:"#fff", width:"70%", borderRadius:10, justifyContent:"center", alignItems:"center", paddingTop:30, marginBottom:200}}>
            <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>Créer un dossier</Text>
            <TextInput
                ref={inputRef}
                onChangeText={setFolderName}
                placeholder="Nom du dossier"
                style={{borderWidth: 1, borderColor: '#ccc', padding: 10, width: '90%', marginBottom: 20}}
            />
            <View style={{flexDirection:"row", width:"100%", }}>
                <Pressable style={{backgroundColor: '#ccc', padding: 10, width: '50%',borderBottomLeftRadius:10 , borderRightWidth:1,borderColor:"white"}} onPress={onClose}>
                    <Text style={{textAlign: 'center'}}>Annuler</Text>
                </Pressable>
                <Pressable style={{backgroundColor: '#ccc', padding: 10, width: '50%',borderBottomRightRadius:10,}} onPress={handleCreatePress}>
                    <Text style={{textAlign: 'center'}}>Créer</Text>
                </Pressable>
            </View>
            
        </View>
        
      </View>
    )
  };


export const BottomTab = ({ setSelectedUrl }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const closeAll = () => {
        setModalVisible(false);
        setMenuVisible(false);   
    }

    return (
        <> 
        <Tab.Navigator>
            <Tab.Screen 
                name="Home" 
                options={{ 
                    title: 'My home',
                    headerRight: () => (
                        <HeaderButton onOpen={() => setMenuVisible(true)} />
                    ),
                }}
            >
                {props => <HomeScreen {...props} setSelectedUrl={setSelectedUrl} />}
            </Tab.Screen>
            <Tab.Screen name="Profile" component={WebScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} createFolder={() => setModalVisible(true)} />
        { modalVisible && <ModalCreateDirectory onClose={closeAll} />}
        </>
       
    );
};
 

const SettingsScreen = () => {
	return (
		<View style={{ flex:1, alignItems: 'center', justifyContent: 'center' }}>
			<Text> settings </Text>
		</View>
	)
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        width: '100%',
        height: screenHeight,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingBottom: 20,
    },
    menuContainer: {
        backgroundColor: '#fff',
        marginBottom: 10,
        paddingVertical: 10,
        // paddingHorizontal: 10,
        width: '95%',
        borderRadius: 10,
    },
    menuOption: {
        paddingTop: 15,
        backgroundColor: 'white',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        height: 50,
    },
    menuText: {
        fontSize: 18,
        textAlign: 'center',
        color: "red"
    },
    lastMenuOption: {
        borderBottomWidth: 0, 
    },

});


export default BottomTab;