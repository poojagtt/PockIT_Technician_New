import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Modal, SafeAreaView} from 'react-native';
import {Size, fontFamily, useTheme} from '../modules';
import Icon from './Icon';

interface SuccessModalProps {
  visible: boolean;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({visible, message}) => {
  const colors = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <SafeAreaView style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            
            
          }}>
          <View
            style={{
              flex: 1,
              padding:Size.containerPadding,
              backgroundColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={styles._circle}>
              <Icon
                name="done"
                type="MaterialIcons"
                size={80}
                color={colors.background}
              />
            </View>
            <Text style={styles._message}>{message}</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  _circle: {
    height: 150,
    width: 150,
    borderRadius: 76,
    backgroundColor: '#3170DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  _message: {
    fontFamily: fontFamily,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: Size.lg,
  },
});

export default SuccessModal;
