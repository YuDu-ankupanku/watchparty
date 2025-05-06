import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This is a placeholder because the actual create functionality is accessed
// through the tab button that redirects to /create-room
export default function CreateTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading create room...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
});