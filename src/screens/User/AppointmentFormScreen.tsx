import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getDB} from '../../utils/database';
import {scheduleReminderNotifications} from '../../utils/notification';
import {CustomButton} from '../../components/CustomButton';
import {CustomInput} from '../../components/CustomInput';
import {CustomPicker} from '../../components/CustomPicker';
import {Card} from '../../components/Card';
import {theme} from '../../constants/theme';
import {
  combineDateAndTime,
  formatDate,
  formatTime,
} from '../../utils/formatters';
import moment from 'moment';
import Icon from 'react-native-vector-icons/AntDesign';

const timeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];
const reasonOptions = [
  'Checkup',
  'Consultation',
  'Follow-up',
  'Treatment',
  'Surgery',
  'Other',
];

const AppointmentFormScreen = () => {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    date: new Date(),
    time: '09:00',
    reason: 'Checkup',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({
    name: '',
    contact: '',
  });

  const handleGoBack = () => {
    navigation.goBack();
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const errors = {name: '', contact: ''};

    if (!formData.name.trim()) {
      errors.name = 'Patient name is required';
      isValid = false;
    }

    if (!formData.contact.trim()) {
      errors.contact = 'Contact number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.contact)) {
      errors.contact = 'Please enter a valid 10-digit number';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        date: selectedDate,
      });
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const db = getDB();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM appointments WHERE date = ? AND time = ?',
        [formData.date, formData.time],
        (_, result) => {
          if (result.rows.length > 0) {
            Alert.alert(
              'Time Slot Unavailable',
              'This time slot is already booked. Please choose another time.',
              [{text: 'OK'}],
            );
          } else {
            console.log(formData.date, formData.time);

            const date = combineDateAndTime(
              formData.date.toString(),
              formData.time,
            );
            console.log(date);

            tx.executeSql(
              'INSERT INTO appointments (name, contact, date, time, reason) VALUES (?, ?, ?, ?, ?)',
              [
                formData.name,
                formData.contact,
                formData.date,
                formData.time,
                formData.reason,
              ],
              (_, insertResult) => {
                const insertedId = insertResult.insertId;
                scheduleReminderNotifications({
                  channelId: `${insertedId}`,
                  title: 'Appointment Reminder',
                  message: 'You have an appointment scheduled.',
                  date: date,
                });
                navigation.navigate('ThankYou');
              },
              error => {
                console.error('Error saving appointment:', error);
                Alert.alert(
                  'Error',
                  'Failed to save your appointment. Please try again.',
                );
              },
            );
          }
        },
        error => {
          console.error('Error checking appointments:', error);
          Alert.alert(
            'Error',
            'Failed to check available time slots. Please try again.',
          );
        },
      );
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary,
        },
      ]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={'dark-content'}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="left" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <Card>
          <Text style={styles.heading}>Book an Appointment</Text>

          <CustomInput
            label="Patient Name"
            value={formData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Enter patient's full name"
            error={formErrors.name}
          />

          <CustomInput
            label="Contact Number"
            value={formData.contact}
            onChangeText={value => handleInputChange('contact', value)}
            placeholder="Enter 10-digit contact number"
            keyboardType="phone-pad"
            error={formErrors.contact}
          />

          <Text style={styles.label}>Appointment Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>
              {formatDate(formData.date)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <CustomPicker
            label="Appointment Time"
            selectedValue={formData.time}
            onValueChange={value => handleInputChange('time', value)}
            items={timeSlots.map(time => ({
              label: formatTime(time),
              value: time,
            }))}
          />

          <CustomPicker
            label="Reason for Visit"
            selectedValue={formData.reason}
            onValueChange={value => handleInputChange('reason', value)}
            items={reasonOptions.map(reason => ({
              label: reason,
              value: reason,
            }))}
          />

          <CustomButton
            title="Book Appointment"
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 14,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  datePickerText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  submitButton: {
    marginTop: 24,
  },
});

export default AppointmentFormScreen;
