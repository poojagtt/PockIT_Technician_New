/**
 * @format
 */
import 'react-native-get-random-values';
import React, {useState, useEffect} from 'react';
import {AppRegistry, Modal, View, Text, Dimensions} from 'react-native';
import {Provider} from 'react-redux';
import App from './App';
import {name as appName} from './app.json';
import {Button, Icon} from './src/components';
import {store} from './src/context';
import {enableScreens} from 'react-native-screens';
import {Notification} from './src/modules/notifications';
import messaging from '@react-native-firebase/messaging';
import {useStorage} from './src/modules';
import moment from 'moment';
import {WebView} from 'react-native-webview';

import {apiCall, fontFamily} from './src/modules';
import {safeParseNotificationData} from './src/utils';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import SoundPlayer from 'react-native-sound-player';
import {SafeAreaView} from 'react-native-safe-area-context';

const Application = () => {
  enableScreens(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [countdown, setCountdown] = useState(60);

  const userID = useStorage.getNumber('user');
  const acceptPermission = useStorage.getNumber('acceptPermission');
  const userName = useStorage.getString('userName');
  const isUnavailable = (data1, data2Formatted, expectedDateTime) => {
    const formattedJobDate = moment(expectedDateTime).format('YYYY-MM-DD');
    const dayOfWeek = moment(expectedDateTime).format('dd');
    const isBlockedDate = data2Formatted.some(
      entry =>
        moment(entry.DATE_OF_MONTH).format('YYYY-MM-DD') === formattedJobDate &&
        entry.IS_SERIVCE_AVAILABLE == false,
    );

    const isDayBlocked = data1.some(
      entry => entry.IS_SERIVCE_AVAILABLE == 0 && entry.WEEK_DAY === dayOfWeek,
    );
    return {isBlockedDate, isDayBlocked};
  };
  const popupSound = () => {
    try {
      SoundPlayer.playSoundFile('notification_sound', 'mp3'); // name without extension
    } catch (e) {
      console.log('Cannot play the sound file', e);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'ios' && Dimensions.get('window').height >= 1024) {
      Alert.alert('This app is only available for iPhone devices.');
    }
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('\n\n\nnotification', remoteMessage);

      const isNotificationsEnabled = useStorage.getBoolean(
        'NOTIFICATIONS_ENABLED',
      );
      useStorage.set('UNREAD_NOTIFICATIONS', true);

      if (
        isNotificationsEnabled === true ||
        isNotificationsEnabled === undefined
      ) {
        const data = remoteMessage.data?.data3;
        console.log('\n\n\ndata', data);

        if (data === 'PJ') {
          // console.log("data", data);
          try {
            const parsedData = safeParseNotificationData(remoteMessage.data?.data4);
            if (!parsedData) {
              console.log('Invalid notification data4 for PJ');
              return;
            }
            apiCall
              .post(`api/technician/getUnAvailablityOfTechnician`, {
                TECHNICIAN_ID: userID,
              })
              .then(res => {
                if (res.status === 200) {
                  // console.log('\nadmin holiday', res.data.DATA1);
                  // console.log('\nself holiday', res.data.DATA2);

                  const data1 = res.data.DATA1.map(item => ({
                    WEEK_DAY: item.WEEK_DAY, // e.g., 'Su', 'Mo', etc.
                    IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
                  }));

                  // Dates from self holiday list (already specific dates)
                  const selfHolidayDates = res.data.DATA2.map(item => ({
                    DATE_OF_MONTH: moment(item.DATE_OF_MONTH).format(
                      'YYYY-MM-DD',
                    ),
                    IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
                  }));

                  // Calculate upcoming dates for the next N days (say, 30) and mark week-offs
                  const autoWeekOffs = [];
                  const daysToCheck = 30;
                  for (let i = 0; i < daysToCheck; i++) {
                    const date = moment().add(i, 'days');
                    const weekDay = date.format('dd'); // e.g., 'Mo', 'Tu', etc.

                    const isWeekOff = data1.some(
                      entry =>
                        entry.IS_SERIVCE_AVAILABLE === 0 &&
                        entry.WEEK_DAY === weekDay,
                    );

                    if (isWeekOff) {
                      autoWeekOffs.push({
                        DATE_OF_MONTH: date.format('YYYY-MM-DD'),
                        IS_SERIVCE_AVAILABLE: false,
                      });
                    }
                  }

                  // Merge selfHolidayDates and autoWeekOffs without duplicates
                  const mergedData2 = [
                    ...selfHolidayDates,
                    ...autoWeekOffs.filter(
                      auto =>
                        !selfHolidayDates.some(
                          self => self.DATE_OF_MONTH === auto.DATE_OF_MONTH,
                        ),
                    ),
                  ];

                  const expectedDateTime = moment(
                    parsedData[0].EXPECTED_DATE_TIME,
                  ).format('YYYY-MM-DD');
                  const result = isUnavailable(
                    data1,
                    mergedData2,
                    expectedDateTime,
                  );

                  console.log('result', result);
                  if (
                    !result.isBlockedDate &&
                    !result.isDayBlocked &&
                    acceptPermission == 1
                  ) {
                    setNotificationData(parsedData);

                    popupSound();
                    setModalVisible(true);
                    console.log('parsedData', parsedData);
                    setCountdown(60);
                  } else if (
                    !result.isBlockedDate &&
                    result.isDayBlocked &&
                    acceptPermission == 1
                  ) {
                    setNotificationData(parsedData);
                    popupSound();
                    setModalVisible(true);
                    console.log('parsedData', parsedData);
                    setCountdown(60);
                  } else {
                    console.log('You are not available to accept this job');
                  }
                }
              })
              .catch(err => {
                console.log('getHolidays err.....', err);
              });
          } catch (error) {
            console.log('getHolidays catch err', error);
          }

          // try {
          //   const parsedData = JSON.parse(remoteMessage.data?.data4);
          //   const res = await apiCall.post(
          //     'api/technician/getUnAvailablityOfTechnician',
          //     {
          //       TECHNICIAN_ID: userID,
          //     },
          //   );
          //   console.log("res.status", res.status);
          //   if (res.status === 200) {
          //     console.log("\n\n\nholiday", res.data.DATA1);
          //     console.log("\n\n\nholiday2", res.data.DATA2);

          //     const data1 = res.data.DATA1;

          //     const dates2 = res.data.DATA2
          //   .filter((item: any) => item.IS_SERIVCE_AVAILABLE === false)
          //   .map((item: any) => ({
          //     DATE_OF_MONTH: moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
          //     IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
          //   }));

          //      const autoWeekOffs: any[] = [];
          //               const daysToCheck = 30;
          //               for (let i = 0; i < daysToCheck; i++) {
          //                 const date = moment().add(i, 'days');
          //                 const weekDay = date.format('dd'); // e.g., 'Mo', 'Tu', etc.

          //                 const isWeekOff = data1.some(
          //                   entry => entry.IS_SERIVCE_AVAILABLE === 0 && entry.WEEK_DAY === weekDay,
          //                 );

          //                 if (isWeekOff) {
          //                   autoWeekOffs.push({
          //                     DATE_OF_MONTH: date.format('YYYY-MM-DD'),
          //                     IS_SERIVCE_AVAILABLE: false,
          //                   });
          //                 }
          //               }

          //               // Merge selfHolidayDates and autoWeekOffs without duplicates
          //               const mergedData2 = [
          //                 ...dates2,
          //                 ...autoWeekOffs.filter(
          //                   auto =>
          //                     !dates2.some(
          //                       self => self.DATE_OF_MONTH === auto.DATE_OF_MONTH,
          //                     ),
          //                 ),
          //               ];

          //     const expectedDateTime = moment(parsedData[0].EXPECTED_DATE_TIME).format('YYYY-MM-DD');
          //     const result = isUnavailable(data1, mergedData2,expectedDateTime);

          //     console.log("result", result);
          //     if (!result.isBlockedDate && !result.isDayBlocked && acceptPermission == 1) {
          //       setNotificationData(parsedData);
          //       setModalVisible(true);
          //       setCountdown(120);
          //     }
          //     else if(!result.isBlockedDate && result.isDayBlocked && acceptPermission == 1)
          //       {
          //         setNotificationData(parsedData);
          //       setModalVisible(true);
          //       setCountdown(120);
          //       } else {
          //      console.log('You are not available to accept this job');
          //     }
          //   }
          // } catch (error) {
          //   console.log('Notification PJ error:', error);
          // }
        } else {
          Notification(remoteMessage);
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let timer;
    if (modalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setModalVisible(false);
      setCountdown(60);
    }

    return () => clearInterval(timer);
  }, [modalVisible, countdown]);

  const handleAcceptJob = async () => {
    setLoading(true);
    try {
      const body = {
        TECHNICIAN_ID: userID,
        STATUS: 'AS',
        USER_ID: userID,
        JOB_CARD_NO: notificationData?.ID,
        NAME: userName,
        JOB_DATA: [{...notificationData[0], TECHNICIAN_NAME: userName}],
      };
      const res = await apiCall.post('api/technician/updateJobStatus', body);

      if (res.status === 200 && res.data.code === 200) {
        setLoading(false);
        setModalVisible(false);
      } else {
        console.log('Failed to accept job');
        setLoading(false);
      }
    } catch (error) {
      console.log('Accept job error:', error);
      setLoading(false);
    }
  };

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // Create channel if needed
    await notifee.createChannel({
      id: 'custom',
      name: 'Custom Sound Channel',
      sound: 'default',
      importance: 4,
    });
  });

  return (
    <Provider store={store}>
      <App />
      <Modal
        animationType="slide"
        transparent
        // visible={true}

        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View
            style={{
              width: 350,
              padding: 20,
              backgroundColor: 'white',
              borderRadius: 10,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                fontFamily: fontFamily,
              }}>
              New Job Request
            </Text>
            <Icon
              onPress={() => {
                setModalVisible(false);
                setCountdown(60);
              }}
              style={{position: 'absolute', right: 12, top: 12}}
              name="close"
              type="AntDesign"
            />

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#000000',
                  fontWeight: '400',
                  fontFamily: fontFamily,
                }}>
                {notificationData?.[0]?.SERVICE_NAME}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: '#000000',
                  fontWeight: '400',
                  fontFamily: fontFamily,
                }}>
                {notificationData?.[0]?.ESTIMATED_TIME_IN_MIN} mins
              </Text>
            </View>

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#000000',
                  fontWeight: '400',
                  fontFamily: fontFamily,
                }}>
                Amount
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: '#000000',
                  fontWeight: '400',
                  fontFamily: fontFamily,
                }}>
                ₹{' '}
                {Number(
                  notificationData?.[0]?.FINAL_ITEM_AMOUNT,
                ).toLocaleString('en-IN')}
              </Text>
            </View>

            <Text style={{fontFamily: fontFamily}}>
              {notificationData?.[0]?.SERVICE_ADDRESS}
            </Text>
            <Button
              style={{marginTop: 12}}
              loading={loading}
              label="Accept"
              onPress={handleAcceptJob}
              Leftchild={
                <Text style={{color: 'white', fontFamily: fontFamily}}>
                  {countdown}
                </Text>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
      {modalVisible && (
        <WebView
          key={modalVisible ? 'play' : 'nop'}
          originWhitelist={['*']}
          source={{
            html: `
        <html>
          <body>
            <audio autoplay>
              <source src="file:///android_asset/custom_sound.mp3" type="audio/mpeg" />
            </audio>
          </body>
        </html>
      `,
          }}
          style={{width: 0, height: 0, opacity: 0}}
          mediaPlaybackRequiresUserAction={false}
        />
      )}
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => Application);
