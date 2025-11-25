import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import {navigate} from '../utils/navigationRef';
import {useStorage} from './hooks';
import {apiCall} from './services';
import Toast from '../components/Toast';

const user = useStorage.getNumber('user');
const userName = useStorage.getString('userName');
let notificationData = {};
export const setNotificationData = (data: any) => {
  notificationData = data;
};
export const getNotificationData = () => {
  return notificationData;
};

const handleAcceptJob = () => {
  const data: any = getNotificationData();
  let currentItem = JSON.parse(data.data4);
  console.log('currentItem[0]', currentItem[0]);
  try {
    const body = {
      TECHNICIAN_ID: user,
      STATUS: 'AS',
      USER_ID: user,
      JOB_CARD_NO: currentItem.ID,
      NAME: userName,
      JOB_DATA: [{...currentItem[0], TECHNICIAN_NAME: userName}],
    };
    apiCall.post('api/technician/updateJobStatus', body).then(async res => {
      // console.log('res', res.data);
      if (res.status == 200 && res.data.code == 200) {
      } else if (res.status == 200 && res.data.code == 300) {
        console.log('Failed to accept job');
      }
    });
  } catch (error) {
    console.log('error...', error);
  }
};
export const Notification = async (
  notification: FirebaseMessagingTypes.RemoteMessage,
) => {
  try {
    let {title, body}: any = notification.notification;
    console.log('notification received:', notification);
    console.log('notification received:', notification.notification);
    console.log('notification received:', title, body);


    const {data1, data2, data3, data4, data5}: any = notification.data;
    setNotificationData({data1, data2, data3, data4, data5});

    await notifee.deleteChannel('default');
    const channelId = await notifee.createChannel({
      id: 'custom',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default', // Use 'default' sound for Android
      vibration: true, // Enable vibration
    });
    let style = {
      type: AndroidStyle.BIGTEXT,
      text: body,
      // text: `${body}\n\nDetails:\n- ${data1}\n- ${data2}\n- ${data3}\n- ${data4}\n- ${data5}`, // Showing all data as extended text
    };

    await notifee.displayNotification({
      title,
      android: {
        channelId,
        sound: 'default',
        style,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        showTimestamp: true,
        timestamp: Date.now(),
        actions:
          data3 == 'PJ'
            ? [
                {
                  title: 'Accept',
                  pressAction: {id: 'accept'},
                  color: '#1E90FF',
                },
              ]
            : [],
      },
      ios: {
        sound: 'default', // This line is missing in your current code
      },
    });

    // Background event handler
    notifee.onBackgroundEvent(async ({type, detail}: any) => {
      console.log('background notification notification');

      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction.id === 'accept') {
          console.log('accept background');
          handleAcceptJob();
        }
      }
    });

    // Foreground event handler
    notifee.onForegroundEvent(({type, detail}: any) => {
      const data: any = getNotificationData();
      let currentItem = JSON.parse(data.data4);
      if (type === 1 && detail.notification) {
        // handlePress();
        handleNotification(data);
      }
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction.id === 'accept') {
          console.log('accept foreground');
          handleAcceptJob();
        }
      }
    });
    const handleNotification = (remoteMessage: any) => {
      const type = remoteMessage.data3;
      console.log('type', type);
      console.log('remoteMessage.data4', JSON.parse(remoteMessage.data4));
      const data = JSON.parse(remoteMessage.data4 as string);
      console.log('\n\n...data[0]', data[0]);
      console.log("asdgjksdgjk",type == "PJ");
      if (type === 'C') {
        navigate('Job', {screen: 'ChatScreen', params: {jobItem: data}});
      } else if (type == 'PJ') {
        console.log('Navigating to PendingJobList');
        navigate('Home', {screen: 'PendingJobList'});
      } else if (type === 'J') {
        data[0]?.TRACK_STATUS == null ||
        data[0].TRACK_STATUS == 'ST' ||
        data[0]?.TRACK_STATUS == '-'
          ? navigate('Job', {
              screen: 'JobDetails',
              params: {item: data[0], isFromJobList: false},
            })
          : navigate('Job', {
              screen: 'JobFlow',
              params: {item: data[0], isFromJobList: false},
            });
      }
    };
  } catch (err) {
    console.warn('Notification error:', err);
  }
};
