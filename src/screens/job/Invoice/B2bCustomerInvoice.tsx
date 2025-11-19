import {View, ActivityIndicator, Alert, ToastAndroid, Text} from 'react-native';
import React, {useEffect, useState} from 'react';
import {JobRoutes} from '../../../routes/Job';
import {apiCall, Size, useTheme} from '../../../modules';
import {useSelector} from '../../../context';
import SuccessModal from '../../../components/SuccessModal';
import HappyCode from '../HappyCode';
import {resetAndNavigate} from '../../../utils/resetAndNavigate';
import Toast from '../../../components/Toast';

interface InvoiceProps extends JobRoutes<'B2bCustomerInvoice'> {}
const B2bCustomerInvoice: React.FC<InvoiceProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {item, partList, IS_INVOICE_GENERATED} = route.params;
  const {user} = useSelector(state => state.app);
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState({
    loading: true,
  });
  const [otp, setOtp] = useState({
    value: '',
    error: false,
    errorMessage: '',
    show: false,
  });
  const [successModal, setSuccessModal] = useState({
    visible: false,
    message: '',
  });
  useEffect(() => {
    IS_INVOICE_GENERATED == 0 ? getInvoice() : paymentReceived();
  }, []);
  const getInvoice = () => {
    try {
      apiCall
        .post(`api/technician/getInvoice`, {
          JOB_CARD_ID: item.ID,
          ORDER_ID: item.ORDER_ID,
          JOB_CARD_NO: item.JOB_CARD_NO,
          INVOICE_FOR: 'J',
          ORDER_NO: item.ORDER_NO,
        })
        .then(res => {
          if (res.status == 200 && res.data.code == 200) {
            paymentReceived();
          } else {
            console.warn('Something wrong..');
          }
        });
    } catch (error) {
      console.log('error...', error);
    }
  };
  const sendOtp = async () => {
    try {
      setLoader(true);
      let payload = {
        MOBILE_NUMBER: item.CUSTOMER_MOBILE_NUMBER,
        COUNTRY_CODE: item.CUSTOMER_COUNTRY_CODE,
        TECHNICIAN_ID: item.TECHNICIAN_ID,
        CUSTOMER_ID: item.CUSTOMER_ID,
        ORDER_ID: item.ORDER_ID,
        ORDER_NO: item.ORDER_NO,
        JOB_CARD_NO: item.JOB_CARD_NO,
        ID: item.ID,
        SERVICE_ID: item.SERVICE_ID,
        CUST_TYPE: item.CUSTOMER_TYPE,
        EMAIL_ID: item.CUSTOMER_EMAIL,
      };
      const response = await apiCall.post(
        'app/technician/sendOTPToConfirm',
        payload,
      );
      console.log('happy code', response.data);
      if (response.data.code == 200) {
        setLoader(false);
        Toast('Happy code sent');
      } else {
        Alert.alert('Failed to Send happy code');
      }
    } catch (error) {
      console.error('Error in Send happy code:', error);
      Alert.alert('Error sending happy code');
    } finally {
      setLoader(false);
    }
  };
  const verifyOtp = async () => {
    try {
      setLoader(true);
      let payload = {
        MOBILE_NUMBER: item.CUSTOMER_MOBILE_NUMBER,
        TECHNICIAN_ID: item.TECHNICIAN_ID,
        JOB_CARD_NO: item.JOB_CARD_NO,
        REMARK: 'Payment Received',
        OTP: otp.value,
        EMAIL_ID: item.CUSTOMER_EMAIL,
      };
      const response = await apiCall.post(
        'app/technician/verifyOTPToConfirm',
        payload,
      );
      if (response.data.code == 200) {
        setLoader(false);
        Toast('Happy Code Verified');
        endJob();
      } else {
        Alert.alert('Wrong OTP');
      }
    } catch (error) {
      console.error('Error in Verifying happy code:', error);
      Alert.alert('Error verifying happy code');
    } finally {
      setLoader(false);
    }
  };
  const endJob = async () => {
    try {
      setLoader(true);
      let payload = {
        JOB_DATA: [item],
        TECHNICIAN_ID: item.TECHNICIAN_ID,
        STATUS: 'EJ',
      };
      const response = await apiCall.post(
        'api/technician/updateJobStatus',
        payload,
      );
      if (response.data.code == 200) {
        setSuccessModal({
          visible: true,
          message: 'Job ended',
        });
        setTimeout(() => {
          setSuccessModal({
            visible: false,
            message: '',
          });
          // @ts-ignore
          resetAndNavigate(navigation, 'Job', 'JobList');
        }, 1500);
      } else {
        Alert.alert('Failed to END job');
      }
    } catch (error) {
      console.error('Error in Job End:', error);
      Alert.alert('Error Ending job');
    } finally {
      setLoader(false);
    }
  };
  const paymentReceived = async () => {
    try {
      let payload = {
        ORDER_ID: item.ORDER_ID,
        JOB_CARD_ID: item.ID,
        JOB_CARD_NO: item.JOB_CARD_NO,
        CUSTOMER_ID: item.CUSTOMER_ID,
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
      };
      const response = await apiCall.post(
        'api/jobCard/updatePaymentStatus',
        payload,
      );
      if (response.status == 200) {
        setData({...data, loading: false});
        setOtp({
          ...otp,
          show: true,
        });
        sendOtp();
        if (
          item.CUSTOMER_TYPE == 'I' &&
          item.PAYMENT_MODE == 'COD' &&
          item.PAYMENT_STATUS == 'P'
        ) {
          Toast('Payment Received');
        }
      } else {
        Alert.alert('Failed to Payment Received');
      }
    } catch (error) {
      console.error('Error in Payment Received:', error);
    }
  };
  // console.log(item);
  return (
    <View style={{flex: 1}}>
      {data.loading && (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={colors.primary} size={'small'} />
        </View>
      )}
      <HappyCode
        value={otp.value}
        error={otp.errorMessage}
        loading={loader}
        onBack={() => {
          setOtp({...otp, show: false});
          navigation.goBack();
        }}
        onChange={text => {
          setOtp({
            ...otp,
            value: text,
          });
        }}
        onResend={sendOtp}
        onSuccess={verifyOtp}
        sendTo={`${item.CUSTOMER_COUNTRY_CODE} ${item.CUSTOMER_MOBILE_NUMBER}`}
        visible={otp.show}
      />
      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
      />
    </View>
  );
};

export default B2bCustomerInvoice;
