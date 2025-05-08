import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {theme} from '../constants/theme';

interface PickerItem {
  label: string;
  value: string;
}

interface CustomPickerProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  error?: string;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  const renderItem = ({item}: {item: PickerItem}) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        selectedValue === item.value && styles.selectedItem,
      ]}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}>
      <Text
        style={[
          styles.itemText,
          selectedValue === item.value && styles.selectedItemText,
        ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.pickerButton, error ? styles.pickerButtonError : null]}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.pickerButtonText}>
          {selectedItem ? selectedItem.label : 'Select an option'}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              style={styles.flatList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 14,
    backgroundColor: theme.colors.surface,
  },
  pickerButtonError: {
    borderColor: theme.colors.error,
  },
  pickerButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownIcon: {
    fontSize: 12,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 22,
    color: theme.colors.text,
    padding: 4,
  },
  flatList: {
    padding: 8,
  },
  itemContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedItem: {
    backgroundColor: theme.colors.primaryLight,
  },
  itemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedItemText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
