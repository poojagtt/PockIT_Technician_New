import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { fontFamily } from '../modules';

// Getting full device width for the button
const { width } = Dimensions.get('window');

const CustomNotification = ({ title, body, onAccept }:any) => {
  return (
    <View style={styles.notificationContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
        <Text style={styles.buttonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    margin: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
  body: {
    fontSize: 14,
    color: '#333',
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  acceptButton: {
    backgroundColor: '#1E90FF', // Blue background
    width: width * 0.8, // 80% of device width
    padding: 15,
    borderRadius: 30, // Rounded corners
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
});

export default CustomNotification;
