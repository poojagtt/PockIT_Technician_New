import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeModules,
} from 'react-native';
import {fontFamily, GlobalStyle, Size, useTheme} from '../../modules/themes';
import {AppLogo, left, right} from '../../assets';
import {apiCall, isValidEmail, isValidMobile, useStorage} from '../../modules';
import {Reducers, useDispatch} from '../../context';
import {getCountryCode} from '../../Functions';
import {tokenStorage} from '../../modules/hooks';
import {Button, Dropdown, Icon, TextInput} from '../../components';
import messaging from '@react-native-firebase/messaging';
import OtpModal from './OtpModal';
import {getDeviceDetails} from '../../modules/deviceInfo';
import DeviceInfo from 'react-native-device-info';
import CountryCodeSelector from '../../components/CountryCodeSelector';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import PrivacyPolicy from './PrivacyPolicy';

const PockitLogocolor = require('../../assets/images/PokitItengineerscolor.png');

interface LoginProps {}
interface inputInterface {
  value: string;
  error: boolean;
  errorMessage: string;
  termsErrorMessage: string;
  show?: boolean;
}

const Login: React.FC<LoginProps> = () => {
  const {width, height} = Dimensions.get('window');

  const colors = useTheme();
  const dispatch = useDispatch();
  const countryCodes = getCountryCode();
  const appVersion = DeviceInfo.getVersion();
  const [mobile, setMobile] = useState<inputInterface>({
    value: '',
    error: false,
    errorMessage: '',
    termsErrorMessage: '',
  });
  const [otp, setOtp] = useState({
    value: '',
    error: false,
    errorMessage: '',
    show: false,
  });
  const [error, setError] = useState({
    value: false,
    errorMessage: '',
  });
  const [selectedCountry, setSelectedCountry] = useState({
    label: '+91 (India)',
    value: '+91',
  });
  const [ShowCountrySelector, setShowCountrySelector] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const timeOutCallback = useCallback(
    () => setTimer(currTimer => currTimer - 1),
    [],
  );
  useEffect(() => {
    timer > 0 && setTimeout(timeOutCallback, 1000);
  }, [timer, timeOutCallback]);

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const onVerify = async () => {
    console.log('onVerify called');
    const deviceDetails = await getDeviceDetails();
    setLoading(true);
    let isValid: boolean = mobileValidation();
    if (!isValid) {
      setLoading(false);
      return;
    }
    apiCall
      .post('app/technician/sendOTP', {
        COUNTRY_CODE: selectedCountry.value,
        TYPE_VALUE: mobile.value,
        DEVICE_ID: deviceDetails?.deviceId,
        TYPE: showDropdown ? 'M' : 'E',
      })
      .then(res => {
        console.log('******res', res.data);
        if (res.data.code == 200) {
          console.log('OTP sent successfully');
          setError({
            value: false,
            errorMessage: '',
          });
          setMobile({
            ...mobile,
            errorMessage: '',
            termsErrorMessage: '',
          });
          setOtp({
            ...otp,
            show: true,
          });
        } else {
          setError({
            value: true,
            errorMessage: res.data.message,
          });
          setMobile({
            ...mobile,
            errorMessage: '',
            termsErrorMessage: '',
          });
        }
      })
      .catch(function (error) {
        setMobile({
          ...mobile,
          errorMessage: '',
          termsErrorMessage: '',
        });
        if (error.response) {
          setError({value: true, errorMessage: error.response.data.message});
          return;
        } else if (error.request) {
          setError({
            value: true,
            errorMessage: `Unable to check the connection`,
          });
          return;
        } else {
          setError({value: true, errorMessage: error.message});
          return;
        }
      })
      .finally(() => setLoading(false));
  };
  const onOTPVerify = async (otp) => {
    try {
      setLoading(true);
      const CLOUD_ID = await messaging().getToken();
      const deviceDetails = await getDeviceDetails();

      if (!deviceDetails) {
        throw new Error('Unable to get device details');
      }

      apiCall
        .post('app/technician/verifyOTP', {
          TYPE_VALUE: mobile.value,
          OTP: otp,
          CLOUD_ID,
          DEVICE_TYPE: 'M',
          DEVICE_ID: deviceDetails.deviceId,
          DEVICE_NAME: deviceDetails.deviceName,
          DEVICE_IP: deviceDetails.ipAddress,
          SESSION_KEY: deviceDetails.sessionKey,
          TYPE: showDropdown ? 'M' : 'E',
        })
        .then(async res => {
          if (res.data.code == 200 && res.data.data[0].UserData) {
            let user = res.data.data[0].UserData[0];
            let token = res.data.data[0].token;
            const topic = res.data.data[0]?.UserData[0]?.SUBSCRIBED_CHANNELS;
            useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(topic));
            setError({value: false, errorMessage: ''});
            setOtp({
              ...otp,
              error: false,
              errorMessage: '',
              show: false,
              value: '',
            });
            tokenStorage.setToken(token);
            console.log('topic', topic);
            useStorage.set(`user`, user.USER_ID);
            if (topic) {
              topic.map(async (item: any) => {
                await messaging()
                  .subscribeToTopic(item.CHANNEL_NAME)
                  .then(() => console.log('Subscribed to topic!'));
              });
            }

            dispatch(Reducers.setSplash(true));
          } else {
            setError({value: true, errorMessage: res.data.message});
          }
        })
        .catch(function (error) {
          if (error.response) {
            setError({value: true, errorMessage: error.response.data.message});
            return;
          } else if (error.request) {
            setError({
              value: true,
              errorMessage: `Unable to check the connection`,
            });
            return;
          } else {
            setError({value: true, errorMessage: error.message});
            return;
          }
        })
        .finally(() => setLoading(false));
    } catch (error) {
      setLoading(false);
      setError({
        value: true,
        errorMessage: 'Failed to get device information',
      });
    }
  };
  const mobileValidation: () => boolean = () => {
    setError({
      value: false,
      errorMessage: '',
    });
    if (mobile.value.length == 0) {
      setMobile({
        ...mobile,
        error: true,
        errorMessage: 'Please enter email or mobile number',
        termsErrorMessage: !termsAccepted
          ? 'Please accept the terms & conditions and privacy policy to continue'
          : '',
      });
      return false;
    }
    if (showDropdown) {
      if (mobile.value.length != 10) {
        setMobile({
          ...mobile,
          error: true,
          errorMessage: 'Mobile number must be 10 digits long',
          termsErrorMessage: !termsAccepted
            ? 'Please accept the terms & conditions and privacy policy to continue'
            : '',
        });
        return false;
      }
      if (!isValidMobile(mobile.value)) {
        setMobile({
          ...mobile,
          error: true,
          errorMessage: 'Please enter a valid mobile number',
          termsErrorMessage: !termsAccepted
            ? 'Please accept the terms & conditions and privacy policy to continue'
            : '',
        });
        return false;
      }
    } else if (!isValidEmail(mobile.value)) {
      setMobile({
        ...mobile,
        error: true,
        errorMessage: 'Please enter a valid email',
      });
      return false;
    }
    if (!termsAccepted) {
      setMobile({
        ...mobile,
        termsErrorMessage:
          'Please accept the terms & conditions and privacy policy to continue',
      });
      return false;
    }
    return true;
  };
  const onModalClose = () => {
    setOtp({...otp, show: false});
  };
  const onResendOTP = async () => {
    const deviceDetails = await getDeviceDetails();

    apiCall
      .post('app/technician/sendOTP', {
        COUNTRY_CODE: selectedCountry.value,
        MOBILE_NUMBER: mobile.value,
        TYPE_VALUE: mobile.value,
        DEVICE_ID: deviceDetails?.deviceId,
        TYPE: showDropdown ? 'M' : 'E',
      })
      .then(res => {
        if (res.data.code == 200) {
          setTimer(30);
          setError({
            value: false,
            errorMessage: '',
          });
          setOtp({
            ...otp,
            show: true,
          });
        } else {
          setError({
            value: true,
            errorMessage: res.data.message,
          });
        }
      })
      .catch(function (error) {
        if (error.response) {
          setError({value: true, errorMessage: error.response.data.message});
          return;
        } else if (error.request) {
          setError({value: true, errorMessage: error.request.data.message});
          return;
        } else {
          setError({value: true, errorMessage: error.message});
          return;
        }
      })
      .finally(() => setLoading(false));
  };
  const handleTextInputChange = (text: string) => {
    setMobile({
      ...mobile,
      value: text,
      error: false,
      errorMessage: '',
      termsErrorMessage: mobile.termsErrorMessage,
    });
    setError({
      value: false,
      errorMessage: '',
    });

    // Check if text contains only numbers
    const isAllNumbers = /^\d+$/.test(text);

    if (text.length >= 3 && text.length <= 10 && isAllNumbers) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Initiate WhatsApp handshake when the modal opens (required for zero/one-tap)
    // useEffect(() => {
    //   const waModule = NativeModules.WhatsAppOtpModule;
    //   if (Platform.OS === 'android' && waModule?.initiateHandshake) {
    //     waModule.initiateHandshake().catch((err: any) =>
    //       console.warn('Failed to start WhatsApp OTP handshake', err),
    //     );
    //   }
    // }, []);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.white,
      }}>
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}>
        <Image
          source={left}
          style={{
            position: 'absolute',
            left: -Size.containerPadding,
            top: '50%',
            transform: [{translateY: '-50%'}],
            // width: '50%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
        <Image
          source={right}
          style={{
            position: 'absolute',
            right: -Size.containerPadding,
            top: '16%',
            transform: [{translateY: '-50%'}],
            // width: '50%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16,
              justifyContent: 'space-between', // Ensure space between top and bottom sections
            }}
            keyboardShouldPersistTaps="handled">
            {/* Top section */}
            <View
              style={{
                alignItems: 'center',
                marginTop: keyboardVisible ? 20 : 60,
              }}>
              <Image
                source={AppLogo}
                style={{width: 90, height: 90}}
                resizeMode="contain"
              />
              <Image
                source={PockitLogocolor}
                style={{width: 138, height: 40}}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontWeight: '400',
                  fontSize: 20,
                  lineHeight: 28.64,
                  textAlign: 'center',
                  color: colors.primary,
                  marginTop: 20,
                }}>
                Welcome to PockIT!
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontWeight: '500',
                  fontSize: 24,
                  lineHeight: 28.64,
                  textAlign: 'center',
                  color: '#1C1C28',
                  marginTop: 10,
                }}>
                Login
              </Text>
            </View>
  {/* {Platform.OS === 'android' ? (
                <Text
                  onPress={() => {
                    const waModule = (NativeModules as any).WhatsAppOtpModule;
                    waModule?.initiateHandshake?.().catch((e: any) =>
                      console.warn('Manual WA handshake failed', e),
                    );
                  }}
                  style={{
                    textAlign: 'center',
                    color: colors.primary2,
                    textDecorationLine: 'underline',
                    marginBottom: 8,
                  }}>
                  Tap to re-initiate WhatsApp OTP handshake (debug)
                </Text>
              ) : null} */}
            {error.value && (
              <Text
                style={{
                  color: colors.error,
                  textAlign: 'center',
                  marginBottom: 10,
                  fontFamily: fontFamily,
                }}>
                {error.errorMessage}
              </Text>
            )}

            {/* Bottom section */}
            <View>
              <View style={{marginBottom: Keyboard.isVisible() ? 20 : 30}}>
                <TextInput
                  leftChild={
                    showDropdown ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowCountrySelector(true)}
                        style={{
                          width: 80,
                          borderRightWidth: 1,
                          borderColor: mobile.error ? colors.error : '#CBCBCB',
                          borderTopWidth: 0,
                          borderLeftWidth: 0,
                          borderBottomWidth: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 8,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          backgroundColor: 'transparent',
                        }}>
                        <Text
                          style={{
                            color: colors.text,
                            fontFamily: fontFamily,
                            fontSize: 16,
                          }}>
                          {selectedCountry.value}
                        </Text>
                      </TouchableOpacity>
                    ) : undefined
                  }
                  placeholder={
                    !mobile.value || mobile.value.length < 3
                      ? 'Enter Email or Mobile Number'
                      : 'Mobile Number'
                  }
                  value={mobile.value}
                  keyboardType="email-address"
                  placeholderTextColor="#D2D2D2"
                  onChangeText={handleTextInputChange}
                  error={mobile.error}
                  errorMessage={mobile.errorMessage}
                  maxLength={showDropdown ? 10 : undefined}
                />
                <View
                  style={{
                    flexDirection: 'column',
                    marginBottom: 16,
                    marginTop: 15,
                  }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                      style={{
                        width: 20,
                        height: 20,
                        borderWidth: 1,
                        borderColor: termsAccepted ? colors.primary2 : '#999',
                        borderRadius: 4,
                        marginRight: 8,
                        backgroundColor: termsAccepted
                          ? colors.primary2
                          : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      {termsAccepted && (
                        <Icon
                          type="AntDesign"
                          name="check"
                          size={14}
                          color="#fff"
                        />
                      )}
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        fontFamily: fontFamily,
                        lineHeight: 18,
                        marginLeft: 5,
                        flex: 1,
                      }}>
                      I have read and agree to the{' '}
                      <Text
                        onPress={() => setShowTermsModal(true)}
                        style={{
                          color: colors.primary2,
                          textDecorationLine: 'underline',
                        }}>
                        Terms and Conditions
                      </Text>{' '}
                      and{' '}
                      <Text
                        onPress={() => setShowPrivacyModal(true)}
                        style={{
                          color: colors.primary2,
                          textDecorationLine: 'underline',
                        }}>
                        Privacy Policy{' '}
                      </Text>
                      of PockIT Engineers
                    </Text>
                  </View>
                  {mobile.termsErrorMessage && (
                    <Text
                      style={{
                        color: colors.error,
                        fontFamily: fontFamily,
                        fontSize: 10,
                        marginTop: 5,
                        marginLeft: 10,
                      }}>
                      {mobile.termsErrorMessage}
                    </Text>
                  )}
                </View>
                <CountryCodeSelector
                  visible={ShowCountrySelector}
                  onClose={() => setShowCountrySelector(false)}
                  onSelect={(item: {label: string; value: string}) => {
                    setSelectedCountry({
                      ...selectedCountry,
                      label: item.label,
                      value: item.value,
                    });
                  }}
                  data={countryCodes}
                  selectedCountry={selectedCountry}
                />
                {mobile.value.length >= 10 && (
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      color: '#757575',
                      fontSize: 11,
                      fontWeight: '400',
                      textAlign: 'center',
                      marginTop: 5,
                    }}>
                    You will receive an OTP on your above
                    {showDropdown ? ' WhatsApp number' : ' email address'} for
                    verification.
                  </Text>
                )}
              </View>

              <View
                style={{
                  marginBottom:
                    keyboardVisible && Platform.OS == 'android' ? 48 : 0,
                    paddingBottom:!keyboardVisible ? 20 : 0
                }}>
                <Button label="Login" onPress={onVerify} loading={loading} />
              </View>

              {/* <Text
                style={{
                  color: colors.primary2,
                  textAlign: 'center',
                  marginVertical: 5,
                  fontFamily: fontFamily,
                }}>
                v {appVersion}
              </Text> */}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <OtpModal
        value={otp.value}
        error={error.errorMessage}
        loading={loading}
        onBack={onModalClose}
        onChange={text => setOtp({...otp, value: text})}
        onResend={onResendOTP}
        onSuccess={onOTPVerify}
        sendTo={
          showDropdown
            ? `${selectedCountry.value} ${mobile.value}`
            : mobile.value
        }
        visible={otp.show}
      />

      <Modal transparent visible={loading} />
      <TermsAndConditionsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyPolicy
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
};

export default Login;
