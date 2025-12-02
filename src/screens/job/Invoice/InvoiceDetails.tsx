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
  TouchableOpacity,
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
import { set } from '@react-native-firebase/database';
import Modal from '../../../components/Modal';
import QRCode from 'react-native-qrcode-svg';


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
  const [openScannerModal, setOpenScannerModal] = useState(false);
  const [QRloader,setQRLoader] = useState(false);
  const [dataSource, setDataSource] = useState({uri: ''});
  const [intervalId, setIntervalId] = useState(null);


  const [totalAmount, setTotalAmount] = useState(
    parseFloat(String(item?.FINAL_ITEM_AMOUNT || '0')),
  );
  console.log("\n\n\ndata",item)
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
  useEffect(() => {
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [intervalId]);
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
 
  const onOpenScanner = async() => {
    setQRLoader(true);
      try {
      let payload = {
        ORDER_ID: item.ORDER_ID,
        JOB_CARD_ID: item.ID,
        CUSTOMER_ID: item.CUSTOMER_ID,
        SERVICE_ID: item.SERVICE_ID,
        TECHNICIAN_ID: item.TECHNICIAN_ID,
        VENDOR_ID: item.VENDOR_ID || null,
        MOBILE_NO: item.CUSTOMER_MOBILE_NUMBER,
        CART_ID: item.CART_ID || null,
        
      
      };
      console.log("payload qr",payload)
      const response = await apiCall.post(
        'api/order/createrazOrder',
        payload,
      );
      if (response.data.code == 200) {
         setQRLoader(false);
         setDataSource({uri:response.data.data.qr_image_url});
         setOpenScannerModal(true);
          startPaymentChecking();
       console.log("response qr",response.data)
      } else {
         setQRLoader(false);

        Alert.alert('Failed to Get QR Code');
      }
    } catch (error) {
         setQRLoader(false);

      console.error('Error in Get QR Code :', error);
      Alert.alert('Error getting QR Code');
    } finally {
         setQRLoader(false);
      
    }
  }
  const startPaymentChecking = () => {
  const id = setInterval(() => {
    checkPaymentStatus();
  }, 5000); // 5 seconds

  setIntervalId(id);
};
  const checkPaymentStatus = async () => {
  try {
   
    const response = await apiCall.post(
      "api/paymentGatewayTransactions/get",{
      filter:`AND CUSTOMER_ID=${item.CUSTOMER_ID}  AND ORDER_ID=${item.ORDER_ID} AND JOB_CARD_ID=${item.ID} AND TECHNICIAN_ID=${item.TECHNICIAN_ID}`
   } );

    if (response.data.code == 200) {
      console.log("payment status response", response.data);
      // if (response.data.data.PAYMENT_STATUS === "PAID") {
        
      
      //   clearInterval(intervalId);
      //   Toast("Payment Received");
      //  setOpenScannerModal(false);
      //  paymentReceived();
      // }
    }
  } catch (error) {
    console.log("payment status error", error);
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
          label={'Show QR Code'}
          onPress={onOpenScanner}
          loading={QRloader}
        />
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


 <Modal
  
      show={openScannerModal}
      containerStyle={{margin: 0, maxHeight: '70%'}}
      style={{
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingHorizontal: Size.lg,
      }}
      onClose={()=>{}}>
     <View style={{}}>
         <View style={{alignItems:'center',justifyContent:'center'}}>
          <TouchableOpacity style={{alignSelf:'flex-end',marginBottom:10}} onPress={()=>setOpenScannerModal(false)}>
            <Icon name='close' type='AntDesign'></Icon>
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
        Scan to Pay
      </Text>

      <Image
        source={{ uri: dataSource.uri }}
        style={{ width: 250, height: 250, alignSelf: 'center', marginVertical: 20 }}
      />
          {/* <QRCode
          size={280}
          
      value={dataSource.uri}
    /> */}
         </View>
        </View>
    </Modal>

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



// import React, {useEffect, useState} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   Alert,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
// } from 'react-native';
// import {JobRoutes} from '../../../routes/Job';
// import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
// import {Button, Icon} from '../../../components';
// import HappyCode from '../HappyCode';
// import SuccessModal from '../../../components/SuccessModal';
// import {useSelector} from '../../../context';
// import {resetAndNavigate} from '../../../utils';
// import Pdf from 'react-native-pdf';
// import Toast from '../../../components/Toast';
// import Modal from '../../../components/Modal';
// import RazorpayCheckout from 'react-native-razorpay';
// import {RAZOR_PAY_KEY} from '../../../modules/services'; // ensure this exists and is public key

// interface InvoiceDetailsProps extends JobRoutes<'InvoiceDetails'> {}
// const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({navigation, route}) => {
//   const {user} = useSelector(state => state.app);
//   const {item, partList, data} = route.params;
//   const colors = useTheme();
//   const [loader, setLoader] = useState({
//     sendOtp: false,
//     verifyOtp: false,
//     paymentReceived: false,
//     endJob: false,
//   });
//   const [openScannerModal, setOpenScannerModal] = useState(false);
//   const [QRloader, setQRLoader] = useState(false);
//   const [dataSource, setDataSource] = useState({uri: ''});
//   const [intervalId, setIntervalId] = useState<NodeJS.Timer | null>(null);
//   const [orderPayload, setOrderPayload] = useState<{ order_id?: string; amount?: number } | null>(null);

//   const [totalAmount, setTotalAmount] = useState<number>(
//     parseFloat(String(item?.FINAL_ITEM_AMOUNT || '0')),
//   );

//   useEffect(() => {
//     if (item.TOTAL_AMOUNT && partList.length > 0) {
//       const filteredPartList = partList.filter(
//         d => d.STATUS === 'AC' && d.IS_RETURNED == 0,
//       );

//       const sum = filteredPartList.reduce(
//         (acc, d) => acc + parseFloat(String(d?.TOTAL_AMOUNT || '0')),
//         0,
//       );
//       const EXPRESS_DELIVERY_CHARGES = item.EXPRESS_DELIVERY_CHARGES
//         ? parseFloat(String(item.EXPRESS_DELIVERY_CHARGES))
//         : 0;
//       const COUPON_AMOUNT = item.COUPON_AMOUNT
//         ? parseFloat(String(item.COUPON_AMOUNT))
//         : 0;
//       setTotalAmount(
//         sum +
//           parseFloat(String(item.TOTAL_AMOUNT)) +
//           EXPRESS_DELIVERY_CHARGES -
//           COUPON_AMOUNT,
//       );
//     }
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (intervalId) {
//         clearInterval(intervalId);
//       }
//     };
//   }, [intervalId]);

//   const [otp, setOtp] = useState({
//     value: '',
//     error: false,
//     errorMessage: '',
//     show: false,
//   });
//   const [successModal, setSuccessModal] = useState({
//     visible: false,
//     message: '',
//   });

//   const sendOtp = async () => {
//     try {
//       setLoader(s => ({...s, sendOtp: true}));
//       const payload = {
//         MOBILE_NUMBER: item.CUSTOMER_MOBILE_NUMBER,
//         COUNTRY_CODE: item.CUSTOMER_COUNTRY_CODE ? item.CUSTOMER_COUNTRY_CODE : '+91',
//         TECHNICIAN_ID: item.TECHNICIAN_ID,
//         TECHNICIAN_NAME: item.TECHNICIAN_NAME,
//         CUSTOMER_ID: item.CUSTOMER_ID,
//         ORDER_ID: item.ORDER_ID,
//         ORDER_NO: item.ORDER_NO,
//         JOB_CARD_NO: item.JOB_CARD_NO,
//         ID: item.ID,
//         SERVICE_ID: item.SERVICE_ID,
//         CUST_TYPE: item.CUSTOMER_TYPE,
//         EMAIL_ID: item.CUSTOMER_EMAIL,
//       };
//       const response = await apiCall.post('app/technician/sendOTPToConfirm', payload);
//       if (response.data.code == 200) {
//         setOtp(s => ({...s, show: true}));
//         Toast('Happy code sent');
//       } else {
//         Alert.alert('Failed to Send Code');
//       }
//     } catch (error) {
//       console.error('Error in Send Code:', error);
//       Alert.alert('Error sending Code');
//     } finally {
//       setLoader(s => ({...s, sendOtp: false}));
//     }
//   };

//   const verifyOtp = async () => {
//     try {
//       setLoader(s => ({...s, verifyOtp: true}));
//       const payload = {
//         MOBILE_NUMBER: item.CUSTOMER_MOBILE_NUMBER,
//         TECHNICIAN_ID: item.TECHNICIAN_ID,
//         JOB_CARD_NO: item.JOB_CARD_NO,
//         REMARK: 'Payment Received',
//         OTP: otp.value,
//         EMAIL_ID: item.CUSTOMER_EMAIL,
//       };
//       const response = await apiCall.post('app/technician/verifyOTPToConfirm', payload);
//       if (response.data.code == 200) {
//         Toast('Happy Code Verified');
//         endJob();
//       } else {
//         Alert.alert('Wrong code');
//       }
//     } catch (error) {
//       console.error('Error in Verify code:', error);
//       Alert.alert('Error verifying code');
//     } finally {
//       setLoader(s => ({...s, verifyOtp: false}));
//     }
//   };

//   /**
//    * Primary function: Request backend to create Razorpay Order (server uses secret key)
//    * Backend should return { order_id: 'order_xxx', amount: 50000 } (amount in INR)
//    * If backend returns qr_image_url only, we fallback to showing image (existing behavior).
//    */
//   const onOpenScanner = async () => {
//     setQRLoader(true);
//     try {
//       const payload = {
//         ORDER_ID: item.ORDER_ID,
//         JOB_CARD_ID: item.ID,
//         CUSTOMER_ID: item.CUSTOMER_ID,
//         SERVICE_ID: item.SERVICE_ID,
//         TECHNICIAN_ID: item.TECHNICIAN_ID,
//         VENDOR_ID: item.VENDOR_ID || null,
//         MOBILE_NO: item.CUSTOMER_MOBILE_NUMBER,
//         CART_ID: item.CART_ID || null,
//       };

//       const response = await apiCall.post('api/order/createrazOrder', payload);
//       console.log('Razorpay Order/QR Response:', response.data);
//       if (response.data.code == 200 && response.data.data) {
//         const data = response.data.data;
//         console.log('Razorpay Order/QR Response:', data);
//         // Expecting backend to return order_id & amount (INR)
//         if (data.razorpay_order_id) {
//           setOrderPayload({order_id: data.razorpay_order_id, amount: data.amount ?? totalAmount});
//           // open checkout directly
//           await openRazorpayCheckout(data.razorpay_order_id, data.amount ?? totalAmount);
//         } else if (data.qr_image_url) {
//           // fallback: show image QR if backend returns only qr image url
//           setDataSource({uri: data.qr_image_url});
//           setOpenScannerModal(true);
//           startPaymentChecking();
//         } else {
//           Alert.alert('Invalid response from server');
//         }
//       } else {
//         Alert.alert('Failed to get order from server');
//       }
//     } catch (error) {
//       console.error('Error in Get Order/QR :', error);
//       Alert.alert('Error getting payment data');
//     } finally {
//       setQRLoader(false);
//     }
//   };

//   const openRazorpayCheckout = async (orderId: string, amountInINR: number) => {
//     try {
//       // open modal in UI if you want to show waiting state
//       // Razorpay amount must be in paise:
//       const amountPaise = Math.round(Number(amountInINR) * 100);

//       const options = {
//         description: 'Payment for Order ' + (item.ORDER_NO || item.ORDER_ID || ''),
//         currency: 'INR',
//         key: RAZOR_PAY_KEY, // public key only
//         amount: amountPaise.toString(), // paise as string
//         name: 'PockIT',
//         order_id: orderId, // IMPORTANT
//         prefill: {
//           name: item.CUSTOMER_NAME || '',
//           email: item.CUSTOMER_EMAIL || '',
//           contact: item.CUSTOMER_MOBILE_NUMBER || '',
//         },
//         theme: {color: colors.primaryText || '#53a20e'},
//         method: {
//           upi: true,
//           card: true,
//           netbanking: true,
//         },
//       };

//       const res: any = await RazorpayCheckout.open(options);
//       // res contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
//       console.log('Razorpay success:', res);
//       Toast('Payment successful');

//       // Confirm payment with backend (verify signature & update status)
//       await confirmPaymentWithBackend(orderId, res);

//       // Mark payment received in jobCard (calls your existing endpoint)
//       await paymentReceived(); // this will send update to jobCard/updatePaymentStatus
//       // stop polling/checking and close modal if open
//       if (intervalId) {
//         clearInterval(intervalId as any);
//         setIntervalId(null);
//       }
//       setOpenScannerModal(false);
//     } catch (err: any) {
//       console.log('Razorpay error:', err);
//       // handle user cancellation or error
//       if (err.description) {
//         Alert.alert('Payment Failed', err.description);
//       } else {
//         Alert.alert('Payment Failed');
//       }
//     }
//   };

//   /**
//    * Confirm payment on backend - verify signature & persist transaction
//    * CUSTOMIZE: use the actual API your backend exposes for verification.
//    */
//   const confirmPaymentWithBackend = async (orderId: string, razorpayResponse: any) => {
//     try {
//       // Backend should verify signature and store transaction
//       const payload = {
//         ORDER_ID: orderId,
//         JOB_CARD_ID: item.ID,
//         CUSTOMER_ID: item.CUSTOMER_ID,
//         TECHNICIAN_ID: item.TECHNICIAN_ID,
//         RAZORPAY_PAYMENT_ID: razorpayResponse.razorpay_payment_id,
//         RAZORPAY_ORDER_ID: razorpayResponse.razorpay_order_id,
//         RAZORPAY_SIGNATURE: razorpayResponse.razorpay_signature,
//         AMOUNT: razorpayResponse.amount || Math.round(totalAmount * 100),
//         RAW_RESPONSE: razorpayResponse,
//       };

//       // <-- CUSTOMIZE endpoint name if different on your backend
//       const resp = await apiCall.post('api/paymentGatewayTransactions/confirm', payload);
//       if (resp.data && resp.data.code === 200) {
//         Toast('Payment confirmed on server');
//       } else {
//         // server might return success in different shape, handle accordingly
//         console.warn('Server confirm response', resp.data);
//       }
//     } catch (error) {
//       console.error('Error confirming payment on backend:', error);
//     }
//   };

//   const startPaymentChecking = () => {
//     if (intervalId) return;
//     const id = setInterval(() => {
//       checkPaymentStatus();
//     }, 5000); // 5 seconds
//     setIntervalId(id as unknown as NodeJS.Timer);
//   };

//   const checkPaymentStatus = async () => {
//     try {
//       const response = await apiCall.post('api/paymentGatewayTransactions/get', {
//         filter: `AND CUSTOMER_ID=${item.CUSTOMER_ID}  AND ORDER_ID=${item.ORDER_ID} AND JOB_CARD_ID=${item.ID} AND TECHNICIAN_ID=${item.TECHNICIAN_ID}`,
//       });

//       if (response.data.code == 200) {
//         // <-- CUSTOMIZE: inspect the response structure
//         const data = response.data.data;
//         // Example: if data.PAYMENT_STATUS === 'PAID' then mark received
//         if (data && (data.PAYMENT_STATUS === 'PAID' || data.payment_status === 'PAID')) {
//           if (intervalId) {
//             clearInterval(intervalId as any);
//             setIntervalId(null);
//           }
//           Toast('Payment Received');
//           setOpenScannerModal(false);
//           await paymentReceived();
//         }
//       }
//     } catch (error) {
//       console.log('payment status error', error);
//     }
//   };

//   const paymentReceived = async () => {
//     try {
//       setLoader(s => ({...s, paymentReceived: true}));
//       const payload = {
//         ORDER_ID: item.ORDER_ID,
//         JOB_CARD_ID: item.ID,
//         JOB_CARD_NO: item.JOB_CARD_NO,
//         CUSTOMER_ID: item.CUSTOMER_ID,
//         TECHNICIAN_ID: user?.ID,
//         TECHNICIAN_NAME: user?.NAME,
//       };
//       const response = await apiCall.post('api/jobCard/updatePaymentStatus', payload);
//       // Some of your endpoints return data.code, some return status 200 — handle both
//       if ((response.data && response.data.code == 200) || response.status == 200) {
//         sendOtp(); // send happy code only after marking payment
//         Toast('Payment Received');
//       } else {
//         Alert.alert('Failed to update payment status on server');
//       }
//     } catch (error) {
//       console.error('Error in Payment Received:', error);
//     } finally {
//       setLoader(s => ({...s, paymentReceived: false}));
//     }
//   };

//   const endJob = async () => {
//     try {
//       setLoader(s => ({...s, endJob: true}));
//       const payload = {
//         JOB_DATA: [item],
//         TECHNICIAN_ID: item.TECHNICIAN_ID,
//         STATUS: 'EJ',
//       };
//       const response = await apiCall.post('api/technician/updateJobStatus', payload);
//       if (response.data.code == 200) {
//         setSuccessModal({visible: true, message: 'Job ended'});
//         setTimeout(() => {
//           setSuccessModal({visible: false, message: ''});
//           // @ts-ignore
//           resetAndNavigate(navigation, 'Job', 'JobList');
//         }, 1500);
//       } else {
//         Alert.alert('Failed to END job');
//       }
//     } catch (error) {
//       console.error('Error in Job End:', error);
//       Alert.alert('Error Ending job');
//     } finally {
//       setLoader(s => ({...s, endJob: false}));
//     }
//   };

//   return (
//     <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
//       <View style={{backgroundColor: '#FDFDFD', padding: Size.containerPadding}}>
//         <Icon
//           name="keyboard-backspace"
//           type="MaterialCommunityIcons"
//           size={25}
//           onPress={() => {
//             navigation.goBack();
//           }}
//         />
//         <View style={{marginTop: Size.containerPadding, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDFDFD'}}>
//           <Text style={[styles.headerTxt, {flex: 1, color: colors.primaryText}]}>{item.SERVICE_NAME}</Text>
//         </View>
//       </View>

//       <View style={styles.container}>
//         {item.CUSTOMER_TYPE == 'I' ? (
//           <ScrollView showsVerticalScrollIndicator={false}>
//             <View style={{flex: 1}}>
//               {/* --- invoice card (kept as-is) --- */}
//               <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, gap: 12, shadowColor: colors.primary}}>
//                 {/* header */}
//                 <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
//                   <View style={{gap: 6}}>
//                     <Image source={require('../../../assets/images/PockitLogo1.png')} style={{width: 43, height: 43, borderRadius: 30, backgroundColor: '#333'}} resizeMode="cover" />
//                     <Text style={{fontSize: 14, fontWeight: '500', fontFamily: fontFamily}}>PockIT</Text>
//                   </View>
//                   <View>
//                     <Text style={{fontSize: 14, fontWeight: '500', textAlign: 'right', fontFamily: fontFamily}}>Date : {new Date(item.JOB_COMPLETED_DATETIME || new Date()).toDateString()}</Text>
//                     <Text style={{fontSize: 16, color: '#666', textAlign: 'right', fontFamily: fontFamily}}>INVOICE</Text>
//                     <Text style={{fontSize: 16, color: '#666', textAlign: 'right', fontFamily: fontFamily}}>#{item.ID}</Text>
//                   </View>
//                 </View>

//                 {/* the rest of invoice details (unchanged) */}
//                 <View>
//                   {/* ... fields omitted here to keep file shorter; you can keep the same code as before */}
//                   <View style={{height: 10}} />
//                   <View style={{borderColor: colors.subHeading, borderBottomWidth: 0.8}} />
//                   <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14}}>
//                     <Text style={{fontSize: 14, fontWeight: '600', fontFamily: fontFamily}}>Total</Text>
//                     <Text style={{fontSize: 14, fontWeight: '600', fontFamily: fontFamily}}>{`₹ ${parseFloat(String(totalAmount || '0')).toLocaleString('en-IN', {maximumFractionDigits: 2})}`}</Text>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           </ScrollView>
//         ) : (
//           <View style={{flex: 1}}>
//             <Pdf trustAllCerts={false} source={{cache: false, uri: data}} style={{flex: 1, width: '100%', height: '100%'}} enableAnnotationRendering={true} />
//           </View>
//         )}
//       </View>

//       <View style={{gap: 12, marginHorizontal: 15, marginTop: 15}}>
//         <Button label={'Collect Payment'} onPress={onOpenScanner} loading={QRloader} />
//       </View>
//       <View style={{gap: 12, marginHorizontal: 15, marginTop: 15}}>
//         <Button label={'Payment Received'} onPress={paymentReceived} loading={loader.paymentReceived} />
//       </View>

//       <HappyCode value={otp.value} error={otp.errorMessage} loading={loader.sendOtp || loader.verifyOtp} onBack={() => setOtp({...otp, show: false})} onChange={text => setOtp({...otp, value: text})} onResend={sendOtp} onSuccess={verifyOtp} sendTo={`${item.CUSTOMER_COUNTRY_CODE} ${item.CUSTOMER_MOBILE_NUMBER}`} visible={otp.show} />
//       <SuccessModal visible={successModal.visible} message={successModal.message} />

//       <Modal show={openScannerModal} containerStyle={{margin: 0, maxHeight: '70%'}} style={{borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: Size.lg}} onClose={() => {}}>
//         <View>
//           <View style={{alignItems: 'center', justifyContent: 'center'}}>
//             <TouchableOpacity style={{alignSelf: 'flex-end', marginBottom: 10}} onPress={() => { setOpenScannerModal(false); if (intervalId) { clearInterval(intervalId as any); setIntervalId(null); } }}>
//               <Icon name="close" type="AntDesign" />
//             </TouchableOpacity>

//             <Text style={{fontSize: 16, fontWeight: '600', textAlign: 'center'}}>Scan to Pay</Text>

//             {/* If backend provided an image (fallback), show it */}
//             {dataSource.uri ? (
//               <Image source={{uri: dataSource.uri}} style={{width: 250, height: 250, alignSelf: 'center', marginVertical: 20}} />
//             ) : (
//               <View style={{height: 260, width: 260, alignItems: 'center', justifyContent: 'center', marginVertical: 20}}>
//                 <Text>Opened Razorpay Checkout — ask customer to complete payment on screen</Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default InvoiceDetails;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: Size.containerPadding,
//     gap: 12,
//   },
//   headerTxt: {
//     fontFamily: fontFamily,
//     fontSize: 19,
//     fontWeight: '700',
//     lineHeight: 30,
//     textAlign: 'left',
//     letterSpacing: 0.6,
//   },
// });
