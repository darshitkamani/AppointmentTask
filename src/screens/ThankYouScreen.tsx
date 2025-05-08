import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {getDB} from '../utils/database';
import {CustomButton} from '../components/CustomButton';
import {Card} from '../components/Card';
import {theme} from '../constants/theme';

const ThankYouScreen = () => {
  const navigation = useNavigation<any>();
  const [rating, setRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleRating = (selectedRating: number) => {
    setRating(selectedRating);
  };
  const handleSubmitFeedback = () => {
    if (rating > 0) {
      const db = getDB();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO feedback (rating, created_at) VALUES (?, ?)',
          [rating, new Date().toISOString()],
          () => {
            setFeedbackSubmitted(true);
          },
          error => {
            console.error('Error saving feedback:', error);
          },
        );
      });
    }
  };
  const handleGoToAppointments = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'AppointmentList'}],
    });
  };

  const renderStar = (position: number) => {
    const filled = position <= rating;

    return (
      <TouchableOpacity
        key={position}
        onPress={() => handleRating(position)}
        style={styles.starContainer}>
        <Text
          style={[styles.star, filled ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.iconContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.heading}>Thank You!</Text>
        <Text style={styles.subheading}>
          Your appointment has been booked successfully.
        </Text>

        {!feedbackSubmitted ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackQuestion}>
              How do you like our booking system?
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(position => renderStar(position))}
            </View>

            <Text style={styles.ratingText}>
              {rating > 0
                ? `You've selected ${rating} star${rating > 1 ? 's' : ''}`
                : 'Tap to rate'}
            </Text>

            <CustomButton
              title="Submit Feedback"
              onPress={handleSubmitFeedback}
              disabled={rating === 0}
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View style={styles.feedbackContainer}>
            <Text style={styles.thankYouText}>
              Thank you for your feedback!
            </Text>
          </View>
        )}

        <CustomButton
          title="View My Appointments"
          onPress={handleGoToAppointments}
          variant="outline"
          style={styles.appointmentsButton}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  checkmark: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  feedbackContainer: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackQuestion: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starContainer: {
    padding: 8,
  },
  star: {
    fontSize: 40,
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  starFilled: {
    color: '#FBBF24',
  },
  ratingText: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    minWidth: 200,
    marginTop: 16,
  },
  appointmentsButton: {
    marginTop: 16,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.success,
    marginBottom: 16,
  },
});

export default ThankYouScreen;
