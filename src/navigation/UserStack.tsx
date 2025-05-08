import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AppointmentForm from '../screens/User/AppointmentFormScreen';
import AppointmentList from '../screens/User/AppointmentListScreen';
import ThankYouScreen from '../screens/ThankYouScreen';
import EditAppointmentScreen from '../screens/User/EditAppointmentScreen';

const Stack = createNativeStackNavigator();

const UserStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AppointmentList"
      component={AppointmentList}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="AppointmentForm"
      component={AppointmentForm}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="EditAppointment"
      component={EditAppointmentScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="ThankYou"
      component={ThankYouScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

export default UserStack;
