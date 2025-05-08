import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {getDB} from '../../utils/database';
import {Card} from '../../components/Card';
import {CustomButton} from '../../components/CustomButton';
import {theme} from '../../constants/theme';
import {
  formatAppointmentDateTime,
  isUpcomingEvent,
} from '../../utils/formatters';
import {cancelReminderNotifications} from '../../utils/notification';
import Icon from 'react-native-vector-icons/AntDesign';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Appointment {
  id: number;
  name: string;
  contact: string;
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Cancelled' | 'Done';
}

interface FeedbackStats {
  averageRating: number;
  totalRatings: number;
  ratingsCount: {
    [key: number]: number;
  };
}

const statusColors = {
  Pending: theme.colors.info,
  Approved: theme.colors.primary,
  Cancelled: theme.colors.error,
  Done: theme.colors.success,
};

const AdminDashboardScreen = () => {
  const navigator = useNavigation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingsCount: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'All' | 'Pending' | 'Approved' | 'Cancelled' | 'Done'
  >('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    loadAppointments();
    loadFeedbackStats();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

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
        },
        error => {
          console.error('Error loading appointments:', error);
        },
      );
    });
  };

  const loadFeedbackStats = () => {
    const db = getDB();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT rating FROM feedback',
        [],
        (_, result) => {
          const len = result.rows.length;
          let totalRating = 0;
          const ratingsCount: any = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          };

          for (let i = 0; i < len; i++) {
            const rating = result.rows.item(i).rating;
            totalRating += rating;
            ratingsCount[rating]++;
          }

          setFeedbackStats({
            averageRating: len > 0 ? totalRating / len : 0,
            totalRatings: len,
            ratingsCount,
          });
        },
        error => {
          console.error('Error loading feedback stats:', error);
        },
      );
    });
  };

  const handleUpdateStatus = (
    appointment: Appointment,
    newStatus: 'Approved' | 'Cancelled' | 'Done',
  ) => {
    Alert.alert(
      `${newStatus} Appointment`,
      `Are you sure you want to mark this appointment as ${newStatus.toLowerCase()}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: () => {
            const db = getDB();
            db.transaction(tx => {
              tx.executeSql(
                'UPDATE appointments SET status = ? WHERE id = ?',
                [newStatus, appointment.id],
                () => {
                  loadAppointments();
                  cancelReminderNotifications(
                    appointment.id,
                    appointment.time,
                    true,
                  );
                  Alert.alert(
                    'Success',
                    `Appointment status updated to ${newStatus}`,
                  );
                },
                error => {
                  console.error('Error updating appointment status:', error);
                  Alert.alert('Error', 'Failed to update appointment status');
                },
              );
            });
          },
        },
      ],
    );
  };

  const getFilteredAppointments = () => {
    if (activeTab === 'All') {
      return appointments;
    }
    return appointments.filter(appointment => appointment.status === activeTab);
  };
  const handleGoBack = () => {
    navigator.goBack();
  };

  const renderAppointmentItem = ({item}: {item: Appointment}) => {
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
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Patient: {item.name}</Text>
          <Text style={styles.contactNumber}>Contact: {item.contact}</Text>
        </View>

        <View style={styles.actionContainer}>
          {item.status === 'Pending' && !isExpired && (
            <>
              <CustomButton
                title="Approve"
                onPress={() => handleUpdateStatus(item, 'Approved')}
                style={{
                  ...styles.actionButton,
                  backgroundColor: theme.colors.success,
                }}
                textStyle={styles.actionButtonText}
              />
              <CustomButton
                title="Cancel"
                onPress={() => handleUpdateStatus(item, 'Cancelled')}
                style={{
                  ...styles.actionButton,
                  backgroundColor: theme.colors.error,
                }}
                textStyle={styles.actionButtonText}
              />
            </>
          )}

          {item.status === 'Approved' && (
            <CustomButton
              title="Mark as Done"
              onPress={() => handleUpdateStatus(item, 'Done')}
              style={{
                ...styles.actionButton,
                backgroundColor: theme.colors.success,
              }}
              textStyle={styles.actionButtonText}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No appointments found</Text>
    </View>
  );

  const renderTabButton = (
    tab: 'All' | 'Pending' | 'Approved' | 'Cancelled' | 'Done',
  ) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}>
        <Text
          style={[
            styles.tabButtonText,
            isActive && styles.activeTabButtonText,
          ]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingNumber}>{rating}★</Text>
        <View style={styles.ratingBarWrapper}>
          <View style={[styles.ratingBarFill, {width: `${percentage}%`}]} />
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
    );
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
        backgroundColor={theme.colors.primary}
        barStyle={'light-content'}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="left" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={styles.statsSection}>
            <Card style={styles.statsCard}>
              <Text style={styles.sectionTitle}>Feedback Statistics</Text>
              <View style={styles.feedbackOverview}>
                <View style={styles.averageRatingContainer}>
                  <Text style={styles.averageRatingValue}>
                    {feedbackStats.averageRating.toFixed(1)}
                  </Text>
                  <Text style={styles.averageRatingLabel}>Average Rating</Text>
                  <Text style={styles.totalRatings}>
                    {feedbackStats.totalRatings} total ratings
                  </Text>
                </View>

                <View style={styles.ratingBarsContainer}>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <React.Fragment key={rating}>
                      {renderRatingBar(
                        rating,
                        feedbackStats.ratingsCount[rating],
                        feedbackStats.totalRatings,
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.appointmentsSection}>
            <Text style={styles.sectionTitle}>Appointments</Text>

            <View style={styles.tabsContainer}>
              {(
                ['All', 'Pending', 'Approved', 'Cancelled', 'Done'] as const
              ).map(tab => (
                <React.Fragment key={tab}>
                  {renderTabButton(tab)}
                </React.Fragment>
              ))}
            </View>

            <FlatList
              data={getFilteredAppointments()}
              renderItem={renderAppointmentItem}
              keyExtractor={item => item.id.toString()}
              ListEmptyComponent={renderEmptyList}
              scrollEnabled={false}
              nestedScrollEnabled
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    alignContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statsSection: {
    padding: 16,
  },
  statsCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  feedbackOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageRatingContainer: {
    alignItems: 'center',
    flex: 1,
  },
  averageRatingValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  averageRatingLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  totalRatings: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  ratingBarsContainer: {
    flex: 2,
    marginLeft: 16,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    width: 30,
    fontSize: 12,
    color: theme.colors.text,
  },
  ratingBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'right',
  },
  appointmentsSection: {
    padding: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.border,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activeTabButtonText: {
    color: theme.colors.white,
  },
  appointmentCard: {
    marginBottom: 16,
    padding: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  dateTime: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  patientInfo: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
  },
  patientName: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  backButton: {
    paddingVertical: 10,
    paddingRight: 10,
  },
});

export default AdminDashboardScreen;
