import {
  View,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Text,
  SafeAreaView,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Pdf from 'react-native-pdf';
import {JobRoutes} from '../../../routes/Job';
import {apiCall, fontFamily, IMAGE_URL, Size, useTheme} from '../../../modules';
import {Button, Icon} from '../../../components';
import {useSelector} from '../../../context';
import SuccessModal from '../../../components/SuccessModal';
import HappyCode from '../HappyCode';
import {resetAndNavigate} from '../../../utils/resetAndNavigate';
import Toast from '../../../components/Toast';

interface InvoiceProps extends JobRoutes<'ViewInvoice'> {}
const ViewInvoice: React.FC<InvoiceProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {item, partList} = route.params;
  const {user} = useSelector(state => state.app);
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState({
    uri: '',
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
    getInvoice();
  }, []);
  // console.log('item...', item.CUSTOMER_TYPE);
  const getInvoice = () => {
    try {
      apiCall
        .post(`api/invoice/get`, {
          filter: ` AND ORDER_ID = ${item.ORDER_ID} AND JOB_CARD_ID = ${item.ID} AND TYPE = 'J' `,
        })
        .then(res => {
          if (res.status == 200 && res.data.code == 200) {
            setData({
              ...data,
              uri: res.data.data[0].INVOICE_URL,
              loading: false,
            });
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
  console.log(
    " IMAGE_URL + 'Invoices/' + data.uri",
    IMAGE_URL + 'Invoices/' + data.uri,
  );
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
  return (
    <SafeAreaView style={{flex: 1}}>
      <Icon
        name="keyboard-backspace"
        type="MaterialCommunityIcons"
        size={25}
        color={'#999999'}
        onPress={() => {
          navigation.goBack();
        }}
        style={{
          marginTop: Size.containerPadding,
          marginHorizontal: Size.containerPadding,
        }}
      />
      <Text
        style={{
          fontFamily: fontFamily,
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 30,
          textAlign: 'left',
          letterSpacing: 0.6,
          margin: Size.containerPadding,
        }}>
        Invoice
      </Text>
      {data.loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={colors.primary} size={'small'} />
        </View>
      ) : (
        <View style={{flex: 1}}>
          <Pdf
            trustAllCerts={false}
            source={{cache: false, uri: IMAGE_URL + 'Invoices/' + data.uri}}
            onLoadComplete={(numberOfPages, filePath) => {}}
            onPageChanged={(page, numberOfPages) => {}}
            onError={error => {}}
            onPressLink={uri => {}}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              paddingVertical: -50,
            }}
            enableAnnotationRendering={true}
          />
        </View>
      )}
      <View style={{margin: Size.containerPadding}}>
        <Button
          label="Done"
          onPress={() => {
            item.CUSTOMER_TYPE == 'B'
              ? paymentReceived()
              : item.CUSTOMER_TYPE == 'I' &&
                item.PAYMENT_MODE == 'COD' &&
                item.PAYMENT_STATUS == 'P'
              ? navigation.navigate('InvoiceDetails', {
                  item,
                  partList: partList,
                  data: IMAGE_URL + 'Invoices/' + data.uri,
                })
              : paymentReceived();
          }}
        />
      </View>
      <HappyCode
        value={otp.value}
        error={otp.errorMessage}
        loading={loader}
        onBack={() => setOtp({...otp, show: false})}
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
    </SafeAreaView>
  );
};

export default ViewInvoice;
