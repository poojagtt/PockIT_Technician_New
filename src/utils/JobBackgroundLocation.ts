import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import database from '@react-native-firebase/database';
import { Alert, Linking, Platform } from 'react-native';
import { apiCall } from '../modules';
import moment from 'moment';
import { useSelector } from '../context';

let watchIdRef: { current: number | null } = { current: null };
let lastApiCallTime = 0;

const sleep = (time: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, time));

// export const requestFineLocationPermission = async (): Promise<boolean> => {
//   try {
//     if (Platform.OS === 'android') {
//       const fineLocationPermission = await request(
//         PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,

//       );
//       if (fineLocationPermission !== RESULTS.GRANTED) {
//         if (Platform.OS === 'android') {
//           Alert.alert(
//             'Location Permission Required',
//             'Please enable location services to use this feature.',
//             [

//               { text: 'Cancel', style: 'cancel' },
//               { text: 'Open Settings', onPress: () => request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION) }

//             ],
//           );
//         }
//         console.warn('Fine location permission not granted.');
//         return false;
//       }
//       // @ts-ignore
//       if (Platform.Version >= 29) {
//         console.log('Requesting background location permission for Android 10+');
//         const backgroundLocationPermission = await request(
//           PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
//         );
//         if (backgroundLocationPermission !== RESULTS.GRANTED) {
//           Alert.alert(
//             'Background Location Required',
//             'App needs "Allow all the time" location permission to track in background.',
//             [
//               { text: 'Cancel', style: 'cancel' },
//               { text: 'Open Settings', onPress: () => request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION) }
//             ]
//           );
//           return false;
//         }
//       }
//       return true;
//     } else if (Platform.OS === 'ios') {
//       // Request both when-in-use and always for background location
//       const whenInUse = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
//       if (whenInUse !== RESULTS.GRANTED) {
//         console.warn('iOS when-in-use location not granted.');
//         return false;
//       }
//       const always = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
//       if (always !== RESULTS.GRANTED) {
//         console.warn('iOS always location not granted.');
//         return false;
//       }
//       return true;
//     }
//     return false;
//   } catch (err) {
//     console.warn('Permission error:', err);
//     return false;
//   }
// };

export const requestFineLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // 1. Request FINE_LOCATION
      const finePermission = await request(
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      if (finePermission !== RESULTS.GRANTED) {
        Alert.alert(
          'Location Permission Required',
          'Please enable precise location (GPS) to use this feature.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => openSettings()},
          ],
        );
        return false;
      }

      // 2. Request BACKGROUND location for Android 10+
      if (Platform.Version >= 29) {
        const bgPermission = await request(
          PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
        );

        if (bgPermission !== RESULTS.GRANTED) {
          Alert.alert(
            'Background Location Required',
            'Please allow “Allow all the time” so the app can track in background.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => openSettings()},
            ],
          );
          return false;
        }
      }

      return true;
    }

    // iOS handling
    if (Platform.OS === 'ios') {
      const whenInUse = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (whenInUse !== RESULTS.GRANTED) return false;

      const always = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (always !== RESULTS.GRANTED) return false;

      return true;
    }

    return false;
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};
export const JobStartBbService = async (
  jobItem: JobData,
  user: TechnicianInterface | any,
) => {
  try {
    const hasPermissions = await requestFineLocationPermission();
    console.log('Location permissions granted:', hasPermissions);
    if (!hasPermissions) return null;

    const isRunning = await BackgroundService.isRunning();
    console.log('Background Service is running:', isRunning);
    if (isRunning) {
      return;
    }
    await BackgroundService.start(
      async taskDataArguments => {
        const { delay }: any = taskDataArguments;

        watchIdRef.current = Geolocation.watchPosition(
          position => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastApiCallTime;

            if (timeDiff >= delay) {
              const coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              if (coordinates.latitude && coordinates.longitude) {
                database()
                  .ref(`Jobs/${jobItem.ID}/location`)
                  .set({
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    timestamp: new Date().toISOString(),
                  })
                  .then(() => console.log('Location updated in Firebase'))
                  .catch(error =>
                    console.error(
                      'Error updating location in Firebase: ',
                      error,
                    ),
                  );
                const body = {
                  TECHNICIAN_ID: user?.ID,
                  TECHNICIAN_NAME: user?.NAME,
                  MOBILE_NUMBER: user?.MOBILE_NUMBER,
                  LOCATION_LATITUDE: coordinates.latitude,
                  LOCATION_LONG: coordinates.longitude,
                  DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
                  ORDER_ID: jobItem.ORDER_ID,
                  JOB_CARD_ID: jobItem.ID,
                  SERVICE_ID: jobItem.SERVICE_ID,
                  CLIENT_ID: 1,
                };
                apiCall
                  .post('api/technicianLocationTrack/create', body)
                  .then(res => {
                    if (res.status == 200 && res.data.code == 200) {
                      console.log('Location saved successfully');
                    } else {
                      console.warn('Something wrong..Please try again0000');
                    }
                  })
                  .catch(err => {
                    console.error('API call error:', err);
                  });
                lastApiCallTime = currentTime; // Update last API call time
              }
            }
          },
          error => {
            console.log('Error:', error.code, error.message);
            if (error.code === 1) {

              Alert.alert('Location Error', 'Please enable location services.');
            }
          },
          { enableHighAccuracy: true, distanceFilter: 0 },
        );

        while (BackgroundService.isRunning()) {
          console.log(`Waiting for ${delay / 1000} seconds...`);
          await sleep(delay);
        }
      },
      {
        taskName: 'Example',
        taskTitle: 'Track Location',
        taskDesc: 'Tracking your location dynamically.',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
        color: '#4ea3e4',
        parameters: {
          delay: 10000, // 10 sec
        },
      },
    );
  } catch (err) {
    console.error('Error starting background service:', err);
    return null;
  }
};
export const JobStopBgService = async () => {
  try {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('Geolocation watch cleared.');
    }
    if (await BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log('Background Service stopped.');
    }
  } catch (error) {
    console.error('Error stopping background service:', error);
  }
};
