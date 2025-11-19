// import {Platform} from 'react-native';
// import {
//   PERMISSIONS,
//   Permission,
//   RESULTS,
//   check,
//   request,
// } from 'react-native-permissions';
// type checkInterface = 'location' | 'camera' | 'storage';
// class PermissionClass {
//   _requestPermissionMultiple: (permission: Permission[]) => Promise<void> =
//     async permissions => {
//       return new Promise((success, reject) => {
//         const results: boolean[] = [];
//         for (const permission of permissions) {
//           if (permission) {
//             this._checkAndRequestPermission(permission)
//               .then(() => results.push(true))
//               .catch(err => {
//                 console.warn(err, permission);
//                 results.push(false);
//               });
//           }
//         }

//         for (const result of results) {
//           if (!result) {
//             return reject();
//           }
//         }
//         return success();
//       });
//     };
//   _checkAndRequestPermission: (permission: Permission) => Promise<void> =
//     async permission => {
//       return new Promise((success, reject) => {
//         if (!permission) {
//           reject('no permission founds');
//         } else {
//           try {
//             check(permission)
//               .then(result => {
//                 if (result === RESULTS.GRANTED) {
//                   success();
//                 } else {
//                   this._request(permission)
//                     .then(() => success())
//                     .catch(err => reject(err));
//                 }
//               })
//               .catch(err => reject(err));
//           } catch (error) {
//             reject(error);
//           }
//         }
//       });
//     };
//   _request: (permission: Permission) => Promise<void> = async permission => {
//     return new Promise((success, reject) => {
//       try {
//         request(permission)
//           .then(value => {
//             value === RESULTS.GRANTED
//               ? success()
//               : reject(`Reject due to` + value);
//           })
//           .catch(err => reject(err));
//       } catch (error) {
//         reject(error);
//         console.warn('Error while Requesting Permission', error);
//       }
//     });
//   };
//   _checkMultiple: (permissions: Permission[]) => Promise<boolean> =
//     async permissions => {
//       return new Promise(async (success, reject) => {
//         const results: boolean[] = [];
//         for (const permission of permissions) {
//           if (permission) {
//             const result = await check(permission)
//               .then(result => {
//                 if (result === RESULTS.GRANTED) {
//                   return true;
//                 } else {
//                   return false;
//                 }
//               })
//               .catch(err => {
//                 reject(err);
//                 return false;
//               });
//             results.push(result);
//           }
//         }
//         for (const result of results) {
          
//           if (!result) {
//             return success(false);
//           }
//         }
//         return success(true);
//       });
//     };
//   checkCamera: (value: checkInterface) => Promise<boolean> = async () => {
//     try {
//       let permissions: Permission[] = [];
//       if (Platform.OS == 'ios') {
//         permissions.push(PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY);
//       } else if (Platform.OS == 'android') {
//         permissions.push(
//           PERMISSIONS.ANDROID.CAMERA,
//           PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
//           PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
//           PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
//         );
//       } else {
//         permissions = [];
//       }
//       if (permissions.length) {
//         return await this._checkMultiple(permissions);
//       } else {
//         return false;
//       }
//     } catch (error) {
//       console.warn('Storage Permission Error', error);
//       return false;
//     }
//   };
//   requestCamera: () => Promise<boolean> = async () => {
//     try {
//       let permissions: Permission[] = [];
//       if (Platform.OS == 'ios') {
//         permissions.push(PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY);
//       } else if (Platform.OS == 'android') {
//         permissions.push(
//           PERMISSIONS.ANDROID.CAMERA,
//           PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
//           PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
//           PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
//         );
//       } else {
//         permissions = [];
//       }
//       if (permissions.length) {
//         return await this._requestPermissionMultiple(permissions)
//           .then(() => true)
//           .catch(err => {
//             console.warn(`Request Camera Error`, err);
//             return false;
//           });
//       } else {
//         return false;
//       }
//     } catch (error) {
//       console.warn('Storage Permission Error', error);
//       return false;
//     }
//   };
//   checkLocation: () => Promise<boolean> = async () => {
//     try {
//       let permissions: Permission[] = [];
//       if (Platform.OS === 'ios') {
//         permissions.push(
//           // PERMISSIONS.IOS.LOCATION_ALWAYS,
//           PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//         );
//       } else if (Platform.OS === 'android') {
//         permissions.push(
//           PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//           PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
//         );
//       } else {
//         permissions = [];
//       }
//       if (permissions.length) {
//         return await this._checkMultiple(permissions);
//       } else {
//         return false;
//       }
//     } catch (error) {
//       console.warn('Storage Permission Error', error);
//       return false;
//     }
//   };
//   requestLocation: () => Promise<void> = () => {
//     return new Promise((res, rej) => {
//       try {
//         let permissions: Permission[] = [];
//         if (Platform.OS === 'ios') {
//           permissions.push(
//             // PERMISSIONS.IOS.LOCATION_ALWAYS,
//             PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//           );
//         } else if (Platform.OS === 'android') {
//           permissions.push(
//             PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//             PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
//           );
//         } else {
//           rej(`Platform mismatch...`);
//         }
//         if (permissions.length) {
//           this._requestPermissionMultiple(permissions)
//             .then(() => res())
//             .catch(err => rej(err));
//         } else {
//           rej('Permission not Found');
//         }
//       } catch (error) {
//         rej(error);
//       }
//     });
//   };

//   checkStorage: () => Promise<boolean> = async () => {
//     try {
//       let permissions: Permission[] = [];
//       if (Platform.OS === 'ios') {
//         permissions.push(PERMISSIONS.IOS.MEDIA_LIBRARY);
//       } else if (Platform.OS === 'android') {
//         if (Platform.Version >= 30) {
//           permissions.push(
//             PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
//             PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
//             PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
//           );
//         } else {
//           permissions.push(
//             PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
//             PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
//           );
//         }
//       } else {
//         return false;
//       }
//       if (permissions.length) {
//         return await this._checkMultiple(permissions);
//       } else {
//         return false;
//       }
//     } catch (error) {
//       console.warn('Storage Permission Error', error);
//       return false;
//     }
//   };
//   requestStorage: () => Promise<void> = () => {
//     return new Promise((res, rej) => {
//       try {
//         let permissions: Permission[] = [];
//         if (Platform.OS === 'ios') {
//           permissions.push(PERMISSIONS.IOS.MEDIA_LIBRARY);
//         } else if (Platform.OS === 'android') {
//           if (Platform.Version >= 33) {
//             permissions.push(
//               PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
//             );
//           } else {
//             permissions.push(
//               PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
//               PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
//             );
//           }
//         } else {
//           rej(`Platform mismatch...`);
//         }
//         if (permissions.length) {
//           this._requestPermissionMultiple(permissions)
//             .then(() => res())
//             .catch(err => rej(err));
//         } else {
//           rej('Permission not Found');
//         }
//       } catch (error) {
//         rej(error);
//       }
//     });
//   };
 
  
// }

// const Permissions = new PermissionClass();
// export default Permissions;




import { Platform } from 'react-native';
import {
  PERMISSIONS,
  Permission,
  RESULTS,
  check,
  request,
  requestMultiple,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';

type CheckType = 'location' | 'camera' | 'storage';

class PermissionClass {
  private async _checkAndRequestPermission(permission: Permission): Promise<void> {
    const result = await check(permission);
    if (result === RESULTS.GRANTED) return;
    const requestResult = await request(permission);
    if (requestResult !== RESULTS.GRANTED) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  private async _requestPermissionMultiple(permissions: Permission[]): Promise<void> {
    const results = await Promise.all(
      permissions.map(permission =>
        this._checkAndRequestPermission(permission).then(() => true).catch(() => false),
      )
    );
    if (results.includes(false)) {
      throw new Error('One or more permissions were denied');
    }
  }

  private async _checkMultiple(permissions: Permission[]): Promise<boolean> {
    const results = await Promise.all(
      permissions.map(permission =>
        check(permission)
          .then(result => result === RESULTS.GRANTED)
          .catch(() => false),
      )
    );
    return results.every(Boolean);
  }

  async checkCamera(): Promise<boolean> {
    try {
      const permissions: Permission[] =
        Platform.OS === 'ios'
          ? [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY]
          : [PERMISSIONS.ANDROID.CAMERA];
      return await this._checkMultiple(permissions);
    } catch (error) {
      console.warn('Camera Permission Error:', error);
      return false;
    }
  }

  // async requestCamera(): Promise<boolean> {
  //   try {
  //     const permissions: Permission[] =
  //       Platform.OS === 'ios'
  //         ? [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY]
  //         : [
  //             PERMISSIONS.ANDROID.CAMERA,
  //             PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  //             PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  //             PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
  //           ];
  //     await this._requestPermissionMultiple(permissions);
  //     return true;
  //   } catch (error) {
  //     console.warn('Request Camera Error:', error);
  //     return false;
  //   }
  // }


  async requestCamera(): Promise<boolean> {
  try {
    const permissions: Permission[] = Platform.OS === 'ios'
      ? [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY]
      : [PERMISSIONS.ANDROID.CAMERA];

    const statuses = await requestMultiple(permissions);

    // Check that CAMERA was granted
    const cameraPermission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const granted = statuses[cameraPermission] === RESULTS.GRANTED;

    return granted;
  } catch (error) {
    console.warn('Request Camera Error:', error);
    return false;
  }
}

  async checkLocation(): Promise<boolean> {
    try {
      const permissions: Permission[] =
        Platform.OS === 'ios'
          ? [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,PERMISSIONS.IOS.LOCATION_ALWAYS]
          : [
              PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
              PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
            ];
      return await this._checkMultiple(permissions);
    } catch (error) {
      console.warn('Location Permission Error:', error);
      return false;
    }
  }

  async requestLocation(): Promise<boolean> {
    try {
      const permissions: Permission[] =
        Platform.OS === 'ios'
          ? [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
          : [
              PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
              PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
            ];
      await this._requestPermissionMultiple(permissions);
      return true;
    } catch (error) {
      console.warn('Request Location Error:', error);
      return false;
    }
  }

  async checkStorage(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await this._checkMultiple([PERMISSIONS.IOS.MEDIA_LIBRARY]);
      }
      // Android: Downloads and app-specific storage do not require broad media/storage permission
      return true;
    } catch (error) {
      console.warn('Storage Permission Error:', error);
      return false;
    }
  }

  async requestStorage(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await this._requestPermissionMultiple([PERMISSIONS.IOS.MEDIA_LIBRARY]);
      }
      // Android: no-op (scoped storage compliant flows shouldn't request storage)
      return true;
    } catch (error) {
      console.warn('Request Storage Error:', error);
      return false;
    }
  }



    // ========== NOTIFICATIONS ==========
    async checkNotification(): Promise<boolean> {
      try {
        if (Platform.OS === 'ios') {
          const { status } = await checkNotifications();
          return status === RESULTS.GRANTED;
        } else {
          const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          return result === RESULTS.GRANTED;
        }
      } catch (error) {
        console.warn('Notification Permission Error:', error);
        return false;
      }
    }
    
  
    async requestNotification(): Promise<boolean> {
      try {
        if (Platform.OS === 'ios') {
          const { status } = await requestNotifications(['alert', 'sound', 'badge']);
          return status === RESULTS.GRANTED;
        } else {
          await this._checkAndRequestPermission(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          return true;
        }
      } catch (error) {
        console.warn('Request Notification Error:', error);
        return false;
      }
    }
    
}

const Permissions = new PermissionClass();
export default Permissions;
