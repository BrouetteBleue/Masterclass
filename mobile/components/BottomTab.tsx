import React from 'react';
import { View, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import WebScreen from '../screens/WebScreen';

type RootTabParamList = {
    Home: String;
    Profile: String;
    Settings: String;
};


const Tab = createBottomTabNavigator<RootTabParamList>();

export const BottomTab = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={WebScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};
 

const SettingsScreen = () => {
	return (
		<View style={{ flex:1, alignItems: 'center', justifyContent: 'center' }}>
			<Text> settings </Text>
		</View>
	)
}

export default BottomTab;