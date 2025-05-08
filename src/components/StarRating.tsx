import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface Props {
  rating: number;
  setRating: (val: number) => void;
}

export const StarRating = ({rating, setRating}: Props) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Text
            style={[styles.star, {color: i <= rating ? '#ffd700' : '#ccc'}]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flexDirection: 'row', marginVertical: 10},
  star: {fontSize: 32, marginHorizontal: 4},
});
