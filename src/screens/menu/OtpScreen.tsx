import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall} from '../../modules/services';
import SuccessModal from '../../components/SuccessModal';
import {Reducers, useDispatch, useSelector} from '../../context';
import {fontFamily} from '../../modules';

interface OtpScreenProps extends MenuRoutes<'OtpScreen'> {}
const OtpScreen: React.FC<OtpScreenProps> = ({route, navigation}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(120);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const {mobile, email, name, photo} = route.params || {};
  const [isModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const {user} = useSelector(state => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    let otpArray = [...otp];
    otpArray[index] = value;
    setOtp(otpArray);
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiCall
        .post('api/technician/get', {
          filter: ` AND ID = ${user?.ID} `,
        })
        .then(res => res.data);
      if (response.data && response.data.length > 0) {
        const userData = response.data[0];
        dispatch(Reducers.setUser(userData));
      } else {
        Alert.alert('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error fetching user data');
    } finally {
    }
  };
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      Alert.alert('Please enter a valid 4-digit OTP');
      return;
    }

    try {
      const response = await apiCall.post('api/technician/verifyOTP', {
        OTP: otpCode,
        MOBILE_NUMBER: mobile,
        TECHNICIAN_ID: user?.ID,
      });
      if (response.data?.message === 'OTP verified successfully...') {
        setSuccessMessage('Profile updated successfully');
        setModalVisible(true);
        fetchProfile();
        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate('Profile');
        }, 3000);
      } else if (response.data?.message === 'invalid OTP') {
        Alert.alert(
          'OTP Verification Failed',
          'Invalid OTP. Please try again.',
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert(
        'Error verifying OTP',
        'An error occurred while verifying your OTP.',
      );
    }
  };
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      const response = await apiCall.post(
        '/api/technician/updateTechnicianProfile',
        {
          ID: user?.ID,
          NAME: name,
          EMAIL_ID: email,
          PHOTO: photo,
          MOBILE_NUMBER: mobile,
        },
      );
      if (response.data?.is_new_mobile === 1) {
        Alert.alert('Success', 'OTP has been resent to your mobile number.');
        setTimer(120);
      } else {
        Alert.alert('Failed', 'Could not resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'An error occurred while resending OTP.');
    }
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter verification code</Text>
      <Text style={styles.subtitle}>
        We have sent you a 4-digit verification code on
      </Text>
      <Text style={styles.phoneNumber}>+91 {mobile || 'XXXXXXXXXX'}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => (inputRefs.current[index] = ref)}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={value => handleOtpChange(index, value)}
            textAlign="center"
          />
        ))}
      </View>

      <Text style={styles.timer}>{formatTimer()}</Text>

      <TouchableOpacity disabled={timer > 0} onPress={handleResendOtp}>
        <Text style={styles.resend}>
          Didn’t Receive the Code? <Text style={styles.resendBold}>Resend</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          {backgroundColor: isOtpComplete ? '#585858' : '#999999'},
        ]}
        disabled={!isOtpComplete}
        onPress={handleVerify}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>
      <SuccessModal visible={isModalVisible} message={successMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: fontFamily,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 12,
    color: 'gray',
    fontWeight: '400',
    lineHeight: 14,
    fontFamily: fontFamily,
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 10,
    fontFamily: fontFamily,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 18,
    marginHorizontal: 5,
  },
  timer: {
    fontSize: 16,
    color: 'gray',
    marginVertical: 10,
    fontFamily: fontFamily,
  },
  resend: {
    fontSize: 14,
    color: 'gray',
    fontFamily: fontFamily,
    fontWeight: '400',
  },
  resendBold: {
    fontWeight: '500',
    color: 'black',
    fontFamily: fontFamily,
  },
  verifyButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    alignSelf: 'stretch',
  },
  verifyText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
});

export default OtpScreen;
