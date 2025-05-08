import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getDB} from '../../utils/database';
import {
  cancelReminderNotifications,
  createReminderChannel,
  scheduleReminderNotifications,
} from '../../utils/notification';
import {CustomButton} from '../../components/CustomButton';
import {CustomInput} from '../../components/CustomInput';
import {CustomPicker} from '../../components/CustomPicker';
import {Card} from '../../components/Card';
import {theme} from '../../constants/theme';
import {formatDate, formatTime} from '../../utils/formatters';
import moment from 'moment';

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

interface RouteParams {
  appointmentId: number;
}

const EditAppointmentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const {appointmentId} = route.params as RouteParams;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    date: new Date(),
    time: '09:00',
    reason: 'Checkup',
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<any>({
    name: '',
    contact: '',
  });

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = () => {
    const db = getDB();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM appointments WHERE id = ?',
        [appointmentId],
        (_, result) => {
          if (result.rows.length > 0) {
            const appointment = result.rows.item(0);

            setFormData({
              name: appointment.name,
              contact: appointment.contact,
              date: new Date(appointment.date),
              time: appointment.time,
              reason: appointment.reason,
            });
          } else {
            Alert.alert('Error', 'Appointment not found');
            navigation.goBack();
          }
          setIsLoading(false);
        },
        error => {
          console.error('Error fetching appointment details:', error);
          Alert.alert('Error', 'Failed to load appointment details');
          setIsLoading(false);
          navigation.goBack();
        },
      );
    });
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

  const checkTimeSlotAvailability = (
    callback: (isAvailable: boolean) => void,
  ) => {
    const db = getDB();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM appointments WHERE date = ? AND time = ? AND id != ?',
        [formData.date.toDateString(), formData.time, appointmentId],
        (_, result) => {
          callback(result.rows.length === 0);
        },
        error => {
          console.error('Error checking time slot availability:', error);
          Alert.alert('Error', 'Failed to check time slot availability');
          callback(false);
        },
      );
    });
  };

  const handleUpdate = () => {
    if (!validateForm()) return;

    checkTimeSlotAvailability(isAvailable => {
      if (!isAvailable) {
        Alert.alert(
          'Time Slot Unavailable',
          'This time slot is already booked. Please choose another time.',
          [{text: 'OK'}],
        );
        return;
      }

      const db = getDB();
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE appointments SET name = ?, contact = ?, date = ?, time = ?, reason = ? WHERE id = ?',
          [
            formData.name,
            formData.contact,
            formData.date.toDateString(),
            formData.time,
            formData.reason,
            appointmentId,
          ],
          (_, insertResult) => {
            const insertedId = insertResult.insertId;
            cancelReminderNotifications(insertedId);
            scheduleReminderNotifications({
              channelId: `${insertedId}`,
              title: 'Appointment Reminder',
              message: 'You have an appointment scheduled.',
              date: formData.date,
            });

            Alert.alert('Success', 'Appointment updated successfully', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          },
          error => {
            console.error('Error updating appointment:', error);
            Alert.alert(
              'Error',
              'Failed to update appointment. Please try again.',
            );
          },
        );
      });
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading appointment details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <Card>
        <Text style={styles.heading}>Edit Appointment</Text>

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
          <Text style={styles.datePickerText}>{formatDate(formData.date)}</Text>
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
          items={reasonOptions.map(reason => ({label: reason, value: reason}))}
        />

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <CustomButton
            title="Update Appointment"
            onPress={handleUpdate}
            style={styles.updateButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  updateButton: {
    flex: 2,
  },
});

export default EditAppointmentScreen;
