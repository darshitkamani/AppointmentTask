import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AdminDashboard from '../screens/Admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AdminDashboard"
      component={AdminDashboard}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

export default AdminStack;
