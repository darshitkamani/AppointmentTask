import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import RootNavigator from './navigation/RootNavigator';
import {initializeDatabase} from './utils/database';
import {requestNotificationPermission} from './utils/notification';

const Stack = createNativeStackNavigator();

export default function App() {
  React.useEffect(() => {
    initializeDatabase();
    requestNotificationPermission();
  }, []);

  return <RootNavigator />;
}
