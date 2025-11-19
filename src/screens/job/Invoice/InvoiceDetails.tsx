import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import {JobRoutes} from '../../../routes/Job';
import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {Button, Icon} from '../../../components';
import HappyCode from '../HappyCode';
import SuccessModal from '../../../components/SuccessModal';
import {AppLogo, _QR} from '../../../assets';
import {useSelector} from '../../../context';
import {resetAndNavigate} from '../../../utils';
import Pdf from 'react-native-pdf';
import Toast from '../../../components/Toast';

interface InvoiceDetailsProps extends JobRoutes<'InvoiceDetails'> {}
const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({navigation, route}) => {
  const {user} = useSelector(state => state.app);
  const {item, partList, data} = route.params;
  console.log('partlist details', partList);
  const colors = useTheme();
  const [loader, setLoader] = useState({
    sendOtp: false,
    verifyOtp: false,
    paymentReceived: false,
    endJob: false,
  });

  const [totalAmount, setTotalAmount] = useState(
    parseFloat(String(item?.FINAL_ITEM_AMOUNT || '0')),
  );
  useEffect(() => {
    if (item.TOTAL_AMOUNT && partList.length > 0) {
      const filteredPartList = partList.filter(
        data => data.STATUS === 'AC' && data.IS_RETURNED == 0,
      );

      const sum = filteredPartList.reduce(
        (acc, data) => acc + parseFloat(String(data?.TOTAL_AMOUNT || '0')),
        0,
      );
      const EXPRESS_DELIVERY_CHARGES = item.EXPRESS_DELIVERY_CHARGES
        ? parseFloat(String(item.EXPRESS_DELIVERY_CHARGES))
        : 0;
      const COUPON_AMOUNT = item.COUPON_AMOUNT
        ? parseFloat(String(item.COUPON_AMOUNT))
        : 0;
      setTotalAmount(
        sum +
          parseFloat(String(item.TOTAL_AMOUNT)) +
          EXPRESS_DELIVERY_CHARGES -
          COUPON_AMOUNT,
      );
    }
  }, []);
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
  const sendOtp = async () => {
    try {
      let payload = {
        MOBILE_NUMBER: item.CUSTOMER_MOBILE_NUMBER,
        COUNTRY_CODE: item.CUSTOMER_COUNTRY_CODE
          ? item.CUSTOMER_COUNTRY_CODE
          : '+91',
        TECHNICIAN_ID: item.TECHNICIAN_ID,
        TECHNICIAN_NAME: item.TECHNICIAN_NAME,

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
        setLoader({
          ...loader,
          sendOtp: false,
        });
        setOtp({
          ...otp,
          show: true,
        });
        Toast('Happy code sent');
      } else {
        Alert.alert('Failed to Send Code');
      }
    } catch (error) {
      console.error('Error in Send Code:', error);
      Alert.alert('Error sending Code');
    } finally {
      setLoader({
        ...loader,
        sendOtp: false,
      });
    }
  };
  const verifyOtp = async () => {
    try {
      setLoader({
        ...loader,
        verifyOtp: true,
      });
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
        setLoader({
          ...loader,
          verifyOtp: false,
        });
        Toast('Happy Code Verified');
        endJob();
      } else {
        Alert.alert('Wrong code');
      }
    } catch (error) {
      console.error('Error in Verify code:', error);
      Alert.alert('Error verifying code');
    } finally {
      setLoader({
        ...loader,
        verifyOtp: false,
      });
    }
  };
  const paymentReceived = async () => {
    try {
      setLoader({
        ...loader,
        paymentReceived: true,
      });
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
        setLoader({
          ...loader,
          paymentReceived: false,
        });
        sendOtp();

        Toast('Payment Received');
      } else {
        Alert.alert('Failed to Payment Received');
      }
    } catch (error) {
      console.error('Error in Payment Received:', error);
    }
  };
  const endJob = async () => {
    try {
      setLoader({
        ...loader,
        endJob: true,
      });
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
      setLoader({
        ...loader,
        endJob: false,
      });
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View
        style={{
          backgroundColor: '#FDFDFD',
          padding: Size.containerPadding,
        }}>
        <Icon
          name="keyboard-backspace"
          type="MaterialCommunityIcons"
          size={25}
          onPress={() => {
            navigation.goBack();
          }}
        />
        <View
          style={{
            marginTop: Size.containerPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FDFDFD',
          }}>
          <Text
            style={[styles.headerTxt, {flex: 1, color: colors.primaryText}]}>
            {item.SERVICE_NAME}
          </Text>
        </View>
      </View>
      <View style={styles.container}>
        {item.CUSTOMER_TYPE == 'I' ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{flex: 1}}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  elevation: 2,
                  gap: 12,
                  shadowColor: colors.primary,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{gap: 6}}>
                    <Image
                      // source={AppLogo}
                      source={require('../../../assets/images/PockitLogo1.png')}
                      style={{
                        width: 43,
                        height: 43,
                        borderRadius: 30,
                        backgroundColor: '#333',
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      PockIT
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        textAlign: 'right',
                        fontFamily: fontFamily,
                      }}>
                      Date :{' '}
                      {new Date(
                        item.JOB_COMPLETED_DATETIME || new Date(),
                      ).toDateString()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#666',
                        textAlign: 'right',
                        fontFamily: fontFamily,
                      }}>
                      INVOICE
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#666',
                        textAlign: 'right',
                        fontFamily: fontFamily,
                      }}>
                      #{item.ID}
                    </Text>
                  </View>
                </View>

                <View style={{}}>
                  <View
                    style={{
                      borderColor: colors.subHeading,
                      borderBottomWidth: 0.8,
                    }}
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      Base price
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      {`₹ ${parseFloat(
                        String(item?.SERVICE_BASE_PRICE || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      Tax({item.TAX_RATE ?? 0}%)
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      {`₹ ${parseFloat(
                        String(item?.TAX_AMOUNT || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      Express charges
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      {`₹ ${parseFloat(
                        String(item?.EXPRESS_DELIVERY_CHARGES || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      Discount
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        fontFamily: fontFamily,
                      }}>
                      {`₹ ${parseFloat(
                        String(item?.COUPON_AMOUNT || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                  <View>
                    {partList.length > 0 &&
                      partList
                        .filter(data => data.STATUS === 'AC')
                        .map((item, index) => {
                          console.log("part item",item)
                          return (
                           <View>
                             <View
                              key={item.ID}
                              style={{
                                flex: 1,
                                gap: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingTop: 12,
                              }}>
                              {item.IS_RETURNED == 0 && item.STATUS == 'AC' && (
                                <Text
                                  style={{
                                    flex: 0.7,

                                    // maxWidth:'80%',
                                    fontSize: 13,
                                    fontWeight: '500',
                                    fontFamily: fontFamily,
                                  }}>
                                  {item.INVENTORY_NAME ?? 0}
                                </Text>
                              )}
                              {item.IS_RETURNED == 0 && item.STATUS == 'AC' && (
                                <Text
                                  style={{
                                    flex: 0.3,
                                    fontSize: 13,
                                    fontWeight: '500',
                                    fontFamily: fontFamily,
                                    textAlign: 'right',
                                  }}>
                                  {`₹ ${parseFloat(
                                    String(item?.RATE + item.TAX_RATE || '0'),
                                  ).toLocaleString('en-IN', {
                                    maximumFractionDigits: 2,
                                  })}`}
                                </Text>
                              )}

                              
                            </View>
                             <View
                              key={item.ID}
                              style={{
                                flex: 1,
                                gap: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingTop: 12,
                              }}>
                              {item.IS_RETURNED == 0 && item.STATUS == 'AC' && (
                                <Text
                                  style={{
                                    flex: 0.7,

                                    // maxWidth:'80%',
                                    fontSize: 13,
                                    fontWeight: '500',
                                    fontFamily: fontFamily,
                                  }}>
                                 Tax
                                </Text>
                              )}
                              {item.IS_RETURNED == 0 && item.STATUS == 'AC' && (
                                <Text
                                  style={{
                                    flex: 0.3,
                                    fontSize: 13,
                                    fontWeight: '500',
                                    fontFamily: fontFamily,
                                    textAlign: 'right',
                                  }}>
                                  {`₹ ${parseFloat(
                                    String(item?.TAX_RATE || '0'),
                                  ).toLocaleString('en-IN', {
                                    maximumFractionDigits: 2,
                                  })}`}
                                </Text>
                              )}

                              
                            </View>
                            </View>
                          );
                        })}
                  </View>

                  <View style={{height: 10}}></View>
                  <View
                    style={{
                      borderColor: colors.subHeading,
                      borderBottomWidth: 0.8,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        fontFamily: fontFamily,
                      }}>
                      Total
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        fontFamily: fontFamily,
                      }}>
                      {`₹ ${parseFloat(
                        String(totalAmount || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={{flex: 1}}>
            <Pdf
              trustAllCerts={false}
              source={{cache: false, uri: data}}
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
      </View>

      <View style={{gap: 12, marginHorizontal: 15, marginTop: 15}}>
        <Button
          label={'Payment Received'}
          onPress={paymentReceived}
          loading={loader.paymentReceived}
        />
      </View>

      <HappyCode
        value={otp.value}
        error={otp.errorMessage}
        loading={loader.sendOtp || loader.verifyOtp}
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

export default InvoiceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Size.containerPadding,
    gap: 12,
  },
  headerTxt: {
    fontFamily: fontFamily,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
  },
});
