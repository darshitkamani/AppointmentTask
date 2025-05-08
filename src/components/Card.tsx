import React from 'react';
import {View, StyleSheet, ViewProps} from 'react-native';
import {theme} from '../constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  ...restProps
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'flat' ? styles.cardFlat : styles.cardDefault,
        style,
      ]}
      {...restProps}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardDefault: {
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardFlat: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
