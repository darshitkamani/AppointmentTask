import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getDB} from '../../utils/database';
import {CustomButton} from '../../components/CustomButton';
import {Card} from '../../components/Card';
import {theme} from '../../constants/theme';
import {
  formatAppointmentDateTime,
  getRelativeTimeDescription,
  isUpcomingEvent,
} from '../../utils/formatters';
import Icon from 'react-native-vector-icons/AntDesign';

interface Appointment {
  id: number;
  name: string;
  contact: string;
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'Cancelled' | 'Done';
}

const statusColors = {
  Pending: theme.colors.info,
  Cancelled: theme.colors.error,
  Done: theme.colors.success,
};

const AppointmentListScreen = () => {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAppointments = () => {
    const db = getDB();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM appointments ORDER BY date, time',
        [],
        (_, result) => {
          const len = result.rows.length;
          const appointmentsData: Appointment[] = [];

          for (let i = 0; i < len; i++) {
            appointmentsData.push(result.rows.item(i));
          }

          setAppointments(appointmentsData);
          setRefreshing(false);
        },
        error => {
          console.error('Error loading appointments:', error);
          setRefreshing(false);
        },
      );
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
      return () => {};
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleAddAppointment = () => {
    navigation.navigate('AppointmentForm');
  };

  const handleEditAppointment = (appointment: Appointment) => {
    navigation.navigate('EditAppointment', {appointmentId: appointment.id});
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const db = getDB();
            db.transaction(tx => {
              tx.executeSql(
                'UPDATE appointments SET status = ? WHERE id = ?',
                ['Cancelled', appointment.id],
                () => {
                  loadAppointments();
                },
                error => {
                  console.error('Error cancelling appointment:', error);
                  Alert.alert(
                    'Error',
                    'Failed to cancel appointment. Please try again.',
                  );
                },
              );
            });
          },
        },
      ],
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderAppointmentItem = ({item}: {item: Appointment}) => {
    const appointmentDate = new Date(item.date);
    const isUpcoming =
      isUpcomingEvent(formatAppointmentDateTime(item.date, item.time)) &&
      item.status === 'Pending';
    const relativeDateText = getRelativeTimeDescription(appointmentDate);

    const isExpired =
      !isUpcomingEvent(formatAppointmentDateTime(item.date, item.time)) &&
      item.status === 'Pending';

    return (
      <Card variant="flat" style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.reasonContainer}>
            <Text style={styles.reason}>{item.reason}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    statusColors[isExpired ? 'Cancelled' : item.status],
                },
              ]}>
              <Text style={styles.statusText}>
                {isExpired ? 'Expired' : item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.dateTime}>
            {formatAppointmentDateTime(item.date, item.time)}
          </Text>
          {isUpcoming && (
            <Text style={styles.relativeDate}>{relativeDateText}</Text>
          )}
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {item.name}</Text>
          <Text style={styles.contactNumber}>Contact: {item.contact}</Text>
        </View>

        {isUpcoming && (
          <View style={styles.actionButtons}>
            <CustomButton
              title="Edit"
              variant="outline"
              onPress={() => handleEditAppointment(item)}
              style={styles.editButton}
              textStyle={styles.buttonText}
            />
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={() => handleCancelAppointment(item)}
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
          </View>
        )}
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyText}>No appointments found</Text>
        <CustomButton
          title="Schedule New Appointment"
          onPress={handleAddAppointment}
          style={styles.addButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.primary,
        },
      ]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={'dark-content'}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="left" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <CustomButton
            title="+ New"
            onPress={handleAddAppointment}
            style={styles.newButton}
          />
        </View>

        <FlatList
          data={appointments}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={
            appointments.length ? styles.listContent : styles.emptyListContent
          }
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // paddingTop: 15,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },

  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 8,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentHeader: {
    marginBottom: 12,
  },
  reasonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reason: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  dateTime: {
    fontSize: 16,
    color: theme.colors.text,
  },
  relativeDate: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginTop: 4,
  },
  patientInfo: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  patientName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  contactNumber: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  editButton: {
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    borderColor: theme.colors.error,
  },
  buttonText: {
    fontSize: 14,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    minWidth: 200,
  },
});

export default AppointmentListScreen;
