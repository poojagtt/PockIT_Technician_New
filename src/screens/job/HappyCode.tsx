import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Modal, SafeAreaView} from 'react-native';
import {fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import {Button, Icon} from '../../components';
import {OtpInput} from 'react-native-otp-entry';
import Toast from '../../components/Toast';

interface HappyCodeProps {
  visible: boolean;
  onBack: () => void;
  value: string;
  onSuccess: () => void;
  onChange: (otp: string) => void;
  onResend: () => void;
  sendTo: string;
  loading: boolean;
  error: string;
}

const HappyCode: React.FC<HappyCodeProps> = ({
  visible,
  value,
  onBack,
  onSuccess,
  onChange,
  onResend,
  loading,
  sendTo,
  error,
}) => {
  const colors = useTheme();
  const [timer, setTimer] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const timeOutCallback = useCallback(
    () => setTimer(currTimer => currTimer - 1),
    [],
  );
  useEffect(() => {
    if (timer > 0) {
      const timeId = setTimeout(timeOutCallback, 1000);
      return () => clearTimeout(timeId);
    }
  }, [timer, timeOutCallback]);

  useEffect(() => {
    setTimer(30);
  }, [visible]);

  return (
    <Modal
      transparent={false}
      visible={visible}
      onRequestClose={() => {
        onBack();
      }}>
      <SafeAreaView style={{flex: 1}}>
        <View
          style={{
            flex: 1,
          }}>
          <Text
            onPress={() => {
              onBack();
            }}
            style={GlobalStyle.modalBackground}
          />
          <View
            style={{
              backgroundColor: colors.background,
              padding: Size.containerPadding,
              gap: Size['3xl'],
              flex: 1,
            }}>
            <Icon
              name="chevron-back"
              type="Ionicons"
              color={'#403f3f'}
              size={23}
              onPress={() => {
                onBack();
              }}
            />
            <View style={{flex: 1, justifyContent: 'center'}}>
              <View style={{gap: 8}}>
                <Text
                  style={[
                    {
                      fontSize: 24,
                      fontWeight: '400',
                      textAlign: 'center',
                      fontFamily: fontFamily,
                      color: colors.primaryText,
                      lineHeight: 28.64,
                    },
                  ]}>
                  {'Enter Happy Code'}
                </Text>
                <Text
                  style={[
                    {
                      fontSize: 12,
                      fontWeight: '400',
                      textAlign: 'center',
                      fontFamily: fontFamily,
                      color: colors.heading,
                      lineHeight: 14.32,
                    },
                  ]}>
                  Enter code sent to customer's registered no. below
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily: fontFamily,
                    color: colors.text,
                    lineHeight: 16.71,
                  }}>
                  {sendTo}
                </Text>
                {error ? (
                  <Text
                    style={{
                      fontSize: Size.md,
                      textAlign: 'center',
                      fontFamily: fontFamily,
                      paddingHorizontal: Size.containerPadding * 2,
                      color: colors.error,
                    }}>
                    {'' + error}
                  </Text>
                ) : null}
              </View>
              <View
                style={{
                  gap: Size.padding,
                  marginVertical: Size['2xl'],
                }}>
                <OtpInput
                  key={resetKey}
                  numberOfDigits={4}
                  onTextChange={text => onChange(text)}
                  autoFocus
                  blurOnFilled
                  theme={{
                    containerStyle: {
                      justifyContent: 'center',
                      gap: 8,
                    },
                    pinCodeTextStyle: {
                      fontFamily: fontFamily,
                      fontWeight: '500',
                      fontSize: 14,
                      lineHeight: 16.71,
                    },
                    pinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.text,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                    filledPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                    focusedPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                    disabledPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                  }}
                  onFilled={text => {
                    onChange(text);
                  }}
                />
              </View>
              <View style={{gap: 8}}>
                {timer > 0 ? (
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: '400',
                        textAlign: 'center',
                        fontFamily: fontFamily,
                        color: colors.heading,
                        lineHeight: 14.32,
                      },
                    ]}>
                    {timer}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily: fontFamily,
                    color: colors.heading,
                    lineHeight: 14.32,
                  }}>
                  {`Didn't Receive the Code?`}
                  <Text
                    onPress={() => {
                      if (timer > 0) return;
                      onChange('');
                      setResetKey(prev => prev + 1);
                      onResend();
                      setTimer(60);
                    }}
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      textAlign: 'center',
                      fontFamily: fontFamily,
                      color: timer > 0 ? colors.text : colors.primary2,
                      textDecorationLine: timer > 0 ? 'none' : 'underline',
                      lineHeight: 16.71,
                    }}>
                    {' Resend Happy Code'}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{justifyContent: 'flex-end'}}>
              <Button
                onPress={() => {
                  if (value.length < 4) {
                    Toast('Please enter valid OTP');
                  } else {
                    onSuccess();
                  }
                }}
                label={'End Job'}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
export default HappyCode;
const styles = StyleSheet.create({});
