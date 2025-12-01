// import React, {useEffect, useState} from 'react';
// import {
//   ActivityIndicator,
//   Image,
//   Modal,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import Animated, {
//   useAnimatedStyle,
//   withDelay,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from 'react-native-reanimated';
// import DeviceInfo from 'react-native-device-info';
// import {AppLogo, AppLogo1} from './assets';
// import {Reducers, useDispatch} from './context';
// import {apiCall, fontFamily, Size, useTheme} from './modules';
// import {_styles} from './modules/stylesheet';

// const PockitLogo2 = require('./assets/images/PockitLogo2.png');
// const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png');

// interface SplashScreenProps {}
// const SplashScreen: React.FC<SplashScreenProps> = () => {
//   const dispatch = useDispatch();
//   const [versionManager, setVersionManager] = useState({
//     visible: false,
//     isForce: false,
//     message: '',
//   });

//   const scale = useSharedValue(1);
//   const translateX = useSharedValue(0);
//   const positionUp = useSharedValue(0);
//   const appVersion = DeviceInfo.getVersion();
//   const colors = useTheme();
//   useEffect(() => {
//     scale.value = withDelay(
//       1000,
//       withSpring(4, {
//         damping: 15,
//         stiffness: 150,
//       }),
//     );
//     translateX.value = withDelay(
//       1000,
//       withSpring(40, {
//         damping: 15,
//         stiffness: 150,
//       }),
//     );
//     setTimeout(() => {
//       positionUp.value = withTiming(-80, {duration: 500});
//     }, 2500);
//     const timeoutId = setTimeout(() => {
//       dispatch(Reducers.getUserInfo());
//     }, 4500);

//     return () => clearTimeout(timeoutId);
//   }, []);

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{scale: scale.value}, {translateX: translateX.value}],
//   }));
//   const moveUpStyle = useAnimatedStyle(() => ({
//     transform: [{translateY: positionUp.value}],
//   }));
//   const checkVersion: () => Promise<void> = async () => {
//     return new Promise((resolve, reject) => {
//       const version = DeviceInfo.getVersion();
//       apiCall
//         .post(`globalSetting/getVersion`)
//         .then(res => {
//           const {CUR_VERSION, MIN_VERSION} = res.data.data[0];
//           if (CUR_VERSION <= version) {
//             resolve();
//           } else if (MIN_VERSION <= version) {
//             setVersionManager({
//               ...versionManager,
//               isForce: false,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           } else {
//             setVersionManager({
//               ...versionManager,
//               isForce: true,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           }
//         })
//         .catch(function (error) {
//           let message = '';
//           if (error.code) {
//             message = error.message;
//           } else if (error.message) {
//             message = error.message;
//           } else {
//             message = `Sorry for your inconvenience`;
//           }
//           reject(message);
//         });
//     });
//   };
//   return (
//     <SafeAreaView style={{flex: 1}}>
//       <View style={styles._splashContainer}>
//         <View style={[styles._clipContainer, {backgroundColor: '#FFF'}]}>
//           <Animated.View style={[styles._logoContainer, animatedStyle]}>
//             <Image
//               source={AppLogo}
//               style={styles._splashImage}
//               resizeMode="center"
//             />
//             <Image
//               source={PockitLogo2}
//               style={[
//                 styles._splashImage,
//                 {width: Size.width * 0.2, height: Size.width * 0.28},
//               ]}
//               resizeMode="contain"
//             />
//           </Animated.View>
//         </View>
//       </View>
//       <Modal
//         visible={versionManager.visible}
//         animationType="fade"
//         transparent={true}>
//         <View style={styles._modalContainer}>
//           <View style={styles._modalContent}>
//             <Image
//               source={AppLogo1}
//               style={{width: '100%'}}
//               resizeMode={'contain'}
//             />
//           </View>
//           <View style={styles._txtContainer}>
//             <Text style={styles._txt}>Here is New Version Available</Text>
//             <Text style={styles._txt}>{versionManager.message}</Text>
//           </View>

//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               marginTop: 30,
//               gap: 20,
//               paddingHorizontal: 20,
//             }}>
//             {versionManager.isForce ? null : (
//               <TouchableOpacity
//                 style={{
//                   flex: 1,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   borderRadius: 8,
//                   gap: 10,
//                   backgroundColor: '#585858',
//                 }}>
//                 <Text
//                   style={{
//                     fontFamily: fontFamily,
//                     fontWeight: 500,
//                     fontSize: 16,
//                     lineHeight: 24,
//                     textAlign: 'center',
//                     color: '#E9E9E9',
//                     padding: 15,
//                   }}>
//                   {'Remind Me Later'}
//                 </Text>
//                 <ActivityIndicator
//                   style={{
//                     position: 'absolute',
//                     right: Size.padding * 2,
//                     alignSelf: 'center',
//                   }}
//                 />
//               </TouchableOpacity>
//             )}

//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 padding: Size.containerPadding,
//                 borderRadius: 8,
//                 gap: 10,
//                 backgroundColor: '#585858',
//               }}>
//               <Text
//                 style={{
//                   fontSize: 18,
//                   fontWeight: '500',
//                   letterSpacing: 0.69,
//                   color: '#343434',
//                   fontFamily: fontFamily,
//                 }}>
//                 Update
//               </Text>
//               <Text
//                 style={{
//                   position: 'absolute',
//                   right: Size.padding * 2,
//                   alignSelf: 'center',
//                   fontFamily: fontFamily,
//                 }}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//       <Animated.View
//         style={[{alignItems: 'center', marginBottom: -70}, moveUpStyle]}>
//         <Image
//           source={PokitItengineerscolor}
//           style={{resizeMode: 'contain', width: 150}}
//         />
//         {/* <Text style={{color: colors.primary2, marginTop: Size.sm, fontFamily: fontFamily,}}>
//           v {appVersion}
//         </Text> */}
//       </Animated.View>
//     </SafeAreaView>
//   );
// };
// export default SplashScreen;
// const styles = StyleSheet.create({
//   _splashContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FFF',
//   },
//   _clipContainer: {
//     width: Size.width * 0.5,
//     height: Size.width * 0.4,
//     overflow: 'hidden',
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'absolute',
//     top: '50%',
//     transform: [{translateY: -Size.width * 0.2}],
//   },
//   _logoContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: Size.width * 0.2,
//     height: Size.width * 0.1,
//     flexDirection: 'row',
//   },
//   _splashImage: {
//     width: '80%',
//     height: '75%',
//     borderRadius: Size.radius,
//   },
//   _modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   _modalContent: {
//     width: '40%',
//     height: '20%',
//     backgroundColor: '#ccc',
//     borderRadius: 10,
//     padding: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   _txtContainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   _txt: {
//     textAlign: 'center',
//     fontSize: 20,
//     fontFamily: fontFamily,
//   },
//   _bottomTextContainer: {
//     position: 'absolute',
//     bottom: '15%',
//     alignItems: 'center',
//   },
//   _appNameText: {
//     fontSize: 32,
//     fontFamily: 'SF Pro Display',
//     fontWeight: '600',
//   },
//   _blueText: {
//     color: '#2B3990',
//   },
//   _orangeText: {
//     color: '#F15A24',
//   },
// });


// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Image,
//   Modal,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Platform,
// } from 'react-native';
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import DeviceInfo from 'react-native-device-info';
// import { useTranslation } from 'react-i18next';
// import { AppLogo } from './assets';
// import { Reducers, useDispatch } from './context';
// import { apiCall, fontFamily, Size, useTheme } from './modules';
// import { _styles } from './modules/stylesheet';

// import Animated, {
//   withTiming,
//   useSharedValue,
//   useAnimatedStyle,
//   Easing,
// } from 'react-native-reanimated';

// // Images
// const AppLogo1 = require('./assets/images/PokitEngginers1.png');
// const AppLogo2 = require('./assets/images/PokitEngginers2.png');
// const PockitEnggBottomlogo = require('./assets/images/PockitEnggBottomlogo.png');

// const LOGO_SIZE = 60;
// const LOGO_MARGIN = 12;

// const SplashScreen = () => {
//   const dispatch = useDispatch();
//   const { t } = useTranslation();
//   const color = useTheme();

//   // Animation values
//   const logo1TranslateX = useSharedValue(0);
//   const logo1Scale = useSharedValue(1);
//   const logo2TranslateX = useSharedValue(0);
//   const logo2Opacity = useSharedValue(1);
//   const showSingleLogo = useSharedValue(0);
//   const positionUp = useSharedValue(0);

//   // Calculate the distance between logos (logo width + margin)
//   const moveDistance = LOGO_SIZE + LOGO_MARGIN;

//   // Animated styles
//   const logo1Style = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: logo1TranslateX.value },
//       { scale: logo1Scale.value },
//     ],
//     zIndex: 2,
//   }));

//   const logo2Style = useAnimatedStyle(() => ({
//     transform: [{ translateX: logo2TranslateX.value }],
//     opacity: logo2Opacity.value,
//     zIndex: 1,
//   }));

//   const singleLogoContainerStyle = useAnimatedStyle(() => ({
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     alignItems: 'center',
//     justifyContent: 'center',
//     opacity: showSingleLogo.value,
//     pointerEvents: showSingleLogo.value ? 'auto' : 'none',
//   }));

//   const bothLogoContainerStyle = useAnimatedStyle(() => ({
//     opacity: 1 - showSingleLogo.value,
//     pointerEvents: showSingleLogo.value ? 'none' : 'auto',
//   }));

//   const moveUpStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: positionUp.value }],
//   }));

//   const [versionManager, setVersionManager] = useState({
//     visible: false,
//     isForce: false,
//     message: '',
//   });

//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       dispatch(Reducers.getUserInfo());
//       // Animate: logo1 slides right to center, scales up; logo2 slides out and fades
//       logo1TranslateX.value = withTiming(moveDistance / 2, { duration: 600, easing: Easing.out(Easing.exp) });
//       logo1Scale.value = withTiming(2.2, { duration: 600, easing: Easing.out(Easing.exp) });
//       logo2TranslateX.value = withTiming(moveDistance * 1.5, { duration: 600, easing: Easing.out(Easing.exp) });
//       logo2Opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) });
//       setTimeout(() => {
//         showSingleLogo.value = withTiming(1, { duration: 200, easing: Easing.linear });
//       }, 600);
//       positionUp.value = withTiming(-80, { duration: 500, easing: Easing.out(Easing.exp) });
//     }, 1000);

//     return () => clearTimeout(timeoutId);
//   }, []);

//   return (
//     <SafeAreaProvider>
//       <SafeAreaView style={{ flex: 1, backgroundColor: color.background }} edges={['top', 'bottom']}>
//         {/* Both logos, same size, centered in a row */}
//         <Animated.View style={[styles._splashContainer, styles.rowCenter, bothLogoContainerStyle]}>
//           <Animated.Image
//             source={AppLogo1}
//             style={[styles.logoImageSmall, logo1Style]}
//             resizeMode="contain"
//           />
//           <Animated.Image
//             source={AppLogo2}
//             style={[styles.logoImageSmall, logo2Style]}
//             resizeMode="contain"
//           />
//         </Animated.View>
//         {/* Single big logo, absolutely centered */}
//         <Animated.View style={[singleLogoContainerStyle]}>
//           <Animated.Image
//             source={AppLogo1}
//             style={[styles.logoImageBig]}
//             resizeMode="contain"
//           />
//         </Animated.View>

//         <Modal visible={versionManager.visible} animationType="fade" transparent>
//           <View style={styles._modalContainer}>
//             <View style={styles._modalContent}>
//               <Image source={AppLogo} style={{ width: '100%' }} resizeMode="contain" />
//             </View>
//             <View style={styles._txtcontainer}>
//               <Text style={styles._txt}>{t('splash.newVersionAvailable')}</Text>
//               <Text style={styles._txt}>{versionManager.message}</Text>
//             </View>
//             <View style={styles._modalButtonContainer}>
//               {!versionManager.isForce && (
//                 <TouchableOpacity style={styles._modalButton}>
//                   <Text style={styles._modalButtonText}>{t('splash.remindLater')}</Text>
//                   <ActivityIndicator style={styles._modalLoader} />
//                 </TouchableOpacity>
//               )}
//               <TouchableOpacity style={styles._modalButton}>
//                 <Text style={[styles._modalButtonText, { color: '#343434', fontSize: 18 }]}>
//                   {t('splash.update')}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>

//         <View style={styles.footerContainer}>
//           {/* <Animated.Text style={[styles.footerText, moveUpStyle]}>
//             Version {DeviceInfo.getVersion()} (Build {DeviceInfo.getBuildNumber()})
//           </Animated.Text> */}
//           <Animated.Image
//             source={PockitEnggBottomlogo}
//             style={[styles.bottomLogo, moveUpStyle]}
//             resizeMode="contain"
//           />
//         </View>
//       </SafeAreaView>
//     </SafeAreaProvider>
//   );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   _splashContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rowCenter: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   logoImageSmall: {
//     width: LOGO_SIZE,
//     height: LOGO_SIZE,
//     marginHorizontal: LOGO_MARGIN / 2,
//     backgroundColor: 'transparent',
//   },
//   logoImageBig: {
//     width: 140,
//     height: 140,
//     backgroundColor: 'transparent',
//   },
//   _modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   _modalContent: {
//     width: '40%',
//     height: '20%',
//     backgroundColor: '#ccc',
//     borderRadius: 10,
//     padding: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   _txtcontainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   _txt: {
//     textAlign: 'center',
//     fontSize: 20,
//   },
//   _modalButtonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 30,
//     gap: 20,
//     paddingHorizontal: 20,
//   },
//   _modalButton: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: Size.containerPadding,
//     borderRadius: 8,
//     gap: 10,
//     backgroundColor: '#585858',
//   },
//   _modalButtonText: {
//      fontFamily: fontFamily,
//     fontWeight: '500',
//     fontSize: 16,
//     lineHeight: 24,
//     textAlign: 'center',
//     color: '#E9E9E9',
//     padding: 15,
//   },
//   _modalLoader: {
//     position: 'absolute',
//     right: Size.padding * 2,
//     alignSelf: 'center',
//   },
//   footerContainer: {
//     position: 'absolute',
//     bottom: -80,
//     width: '100%',
//     alignItems: 'center',
//     overflow: 'visible',
//   },
//   footerText: {
//     textAlign: 'center',
//     color: 'black',
//      fontFamily: fontFamily,
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 8,
//   },
//   bottomLogo: {
//     width: '80%',
//     aspectRatio: 4.5,
//   },
// });



// import React, {useEffect, useState} from 'react';
// import {
//   ActivityIndicator,
//   Image,
//   Modal,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import Animated, {
//   useAnimatedStyle,
//   withDelay,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from 'react-native-reanimated';
// import DeviceInfo from 'react-native-device-info';
// import {AppLogo, AppLogo1} from './assets';
// import {Reducers, useDispatch} from './context';
// import {apiCall, fontFamily, Size, useTheme} from './modules';
// import {_styles} from './modules/stylesheet';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const PockitLogo2 = require('./assets/images/PokitEngginers2.png');
// const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png');

// interface SplashScreenProps {}

// const SplashScreen: React.FC<SplashScreenProps> = () => {
//    const insets = useSafeAreaInsets();
//   const dispatch = useDispatch();
//   const [versionManager, setVersionManager] = useState({
//     visible: false,
//     isForce: false,
//     message: '',
//   });

//   const scale = useSharedValue(1);
//   const translateX = useSharedValue(0);
//   const positionUp = useSharedValue(0);
//   const appVersion = DeviceInfo.getVersion();
//   const colors = useTheme();
//   useEffect(() => {
//     scale.value = withDelay(
//       1000,
//       withSpring(4, {
//         damping: 15,
//         stiffness: 150,
//       }),
//     );
//     translateX.value = withDelay(
//       1000,
//       withSpring(35, {
//         damping: 15,
//         stiffness: 150,
//       }),
//     );
//     setTimeout(() => {
//       positionUp.value = withTiming(-80, {duration: 500});
//     }, 2500);
//     const timeoutId = setTimeout(() => {
//       dispatch(Reducers.getUserInfo());
//     }, 2000);

//     return () => clearTimeout(timeoutId);
//   }, []);

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{scale: scale.value}, {translateX: translateX.value}],
//   }));
//   const moveUpStyle = useAnimatedStyle(() => ({
//     transform: [{translateY: positionUp.value}],
//   }));
//   const checkVersion: () => Promise<void> = async () => {
//     return new Promise((resolve, reject) => {
//       const version = DeviceInfo.getVersion();
//       apiCall
//         .post(`globalSetting/getVersion`)
//         .then(res => {
//           const {CUR_VERSION, MIN_VERSION} = res.data.data[0];
//           if (CUR_VERSION <= version) {
//             resolve();
//           } else if (MIN_VERSION <= version) {
//             setVersionManager({
//               ...versionManager,
//               isForce: false,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           } else {
//             setVersionManager({
//               ...versionManager,
//               isForce: true,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           }
//         })
//         .catch(function (error) {
//           let message = '';
//           if (error.code) {
//             message = error.message;
//           } else if (error.message) {
//             message = error.message;
//           } else {
//             message = `Sorry for your inconvenience`;
//           }
//           reject(message);
//         });
//     });
//   };
//   return (
//     <SafeAreaView style={{flex: 1}}>
//       <View style={styles._splashContainer}>
//         <View style={[styles._clipContainer, {backgroundColor: '#FFF'}]}>
//           <Animated.View style={[styles._logoContainer, animatedStyle]}>
//             <Image
//               source={AppLogo}
//               style={styles._splashImage}
//               resizeMode="center"
//             />
//             <Image
//               source={PockitLogo2}
//               style={[
//                 styles._splashImage,
//                 {width: Size.width * 0.2, height: Size.width * 0.28},
//               ]}
//               resizeMode="contain"
//             />
//           </Animated.View>
//         </View>
//       </View>
//       <Modal
//         visible={versionManager.visible}
//         animationType="fade"
//         transparent={true}>
//         <View style={styles._modalContainer}>
//           <View style={styles._modalContent}>
//             <Image
//               source={AppLogo1}
//               style={{width: '100%'}}
//               resizeMode={'contain'}
//             />
//           </View>
//           <View style={styles._txtContainer}>
//             <Text style={styles._txt}>Here is New Version Available</Text>
//             <Text style={styles._txt}>{versionManager.message}</Text>
//           </View>

//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               marginTop: 30,
//               gap: 20,
//               paddingHorizontal: 20,
//             }}>
//             {versionManager.isForce ? null : (
//               <TouchableOpacity
//                 style={{
//                   flex: 1,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   borderRadius: 8,
//                   gap: 10,
//                   backgroundColor: '#585858',
//                 }}>
//                 <Text
//                   style={{
// fontFamily: fontFamily,                    fontWeight: 500,
//                     fontSize: 16,
//                     lineHeight: 24,
//                     textAlign: 'center',
//                     color: '#E9E9E9',
//                     padding: 15,
//                   }}>
//                   {'Remind Me Later'}
//                 </Text>
//                 <ActivityIndicator
//                   style={{
//                     position: 'absolute',
//                     right: Size.padding * 2,
//                     alignSelf: 'center',
//                   }}
//                 />
//               </TouchableOpacity>
//             )}

//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 padding: Size.containerPadding,
//                 borderRadius: 8,
//                 gap: 10,
//                 backgroundColor: '#585858',
//               }}>
//               <Text
//                 style={{
//                   fontFamily: fontFamily,
//                   fontSize: 18,
//                   fontWeight: '500',
//                   letterSpacing: 0.69,
//                   color: '#343434',
//                 }}>
//                 Update
//               </Text>
//               <Text
//                 style={{
//                   fontFamily: fontFamily,
//                   position: 'absolute',
//                   right: Size.padding * 2,
//                   alignSelf: 'center',
//                 }}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//       <Animated.View
//         style={[{alignItems: 'center', marginBottom: -70}, moveUpStyle]}>
//         <Image
//           source={PokitItengineerscolor}
//           style={{resizeMode: 'contain', width: 150}}
//         />
//         {/* <Text style={{color: colors.primary2, marginTop: Size.sm}}>
//           v {appVersion}
//         </Text> */}
//       </Animated.View>
//     </SafeAreaView>
//   );
// };
// export default SplashScreen;
// const styles = StyleSheet.create({
//   _splashContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FFF',
//   },
//   _clipContainer: {
//     width: Size.width * 0.5,
//     height: Size.width * 0.4,
//     overflow: 'hidden',
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'absolute',
//     top: '50%',
//     transform: [{translateY: -Size.width * 0.2}],
//   },
//   _logoContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: Size.width * 0.2,
//     height: Size.width * 0.1,
//     flexDirection: 'row',
//   },
//   _splashImage: {
//     width: '80%',
//     height: '75%',
//     borderRadius: Size.radius,
   
  
//   },
//   _modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   _modalContent: {
//     width: '40%',
//     height: '20%',
//     backgroundColor: '#ccc',
//     borderRadius: 10,
//     padding: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   _txtContainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   _txt: {
//     fontFamily: fontFamily,
//     textAlign: 'center',
//     fontSize: 20,
//   },
//   _bottomTextContainer: {
//     position: 'absolute',
//     bottom: '15%',
//     alignItems: 'center',
//   },
//   _appNameText: {
//     fontSize: 32,
//     fontFamily: 'SF Pro Display',
//     fontWeight: '600',
//   },
//   _blueText: {
//     color: '#2B3990',
//   },
//   _orangeText: {
//     color: '#F15A24',
//   },
// });



// import React, { useEffect } from 'react';
// import {
//   Image,
//   SafeAreaView,
//   StyleSheet,
//   View,
//   Dimensions,
// } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withDelay,
//   Easing,
// } from 'react-native-reanimated';
// import { AppLogo } from './assets'; // your left logo
// import { Reducers, useDispatch } from './context';
// const PockitLogo2 = require('./assets/images/PokitEngginers2.png'); // right logo
// const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png'); // bottom image

// const SCREEN_WIDTH = Dimensions.get('window').width;

// const SplashScreen = () => {
//   // Animation shared values
//   const pokitTranslateX = useSharedValue(0);
//   const pokitOpacity = useSharedValue(1);

//   const appLogoTranslateX = useSharedValue(0);
//   const appLogoScale = useSharedValue(1);

//   const bottomMoveUp = useSharedValue(40); // start below visible (40 px down)
//   const bottomOpacity = useSharedValue(0); // initially invisible

//  const dispatch = useDispatch();

// useEffect(() => {
//   setTimeout(() => {
//     // Animate right logo slide & fade out
//     pokitTranslateX.value = withTiming(150, { duration: 700, easing: Easing.out(Easing.exp) });
//     pokitOpacity.value = withTiming(0, { duration: 700 });

//     // Animate left logo slide to center
//     appLogoTranslateX.value = withTiming(46, { duration: 700, easing: Easing.out(Easing.exp) }, () => {
//       // After sliding finishes, scale up appLogo more
//       appLogoScale.value = withTiming(1.9, { duration: 500 });
//     });

//     // Animate bottom image move up and fade in after a delay, then dispatch after done
//     bottomMoveUp.value = withDelay(
//       1500,
//       withTiming(
//         0,
//         { duration: 600, easing: Easing.out(Easing.exp) },
//         (isFinished) => {
//           if (isFinished) {
//             dispatch(Reducers.getUserInfo());
//           }
//         }
//       )
//     );
//     bottomOpacity.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) }));
//   }, 1000);
// }, []);

//   const pokitStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: pokitTranslateX.value }],
//     opacity: pokitOpacity.value,
//   }));

//   const appLogoStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: appLogoTranslateX.value },
//       { scale: appLogoScale.value },
//     ],
//   }));

//   const bottomImageStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: bottomMoveUp.value }],
//     opacity: bottomOpacity.value,
//   }));

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.logoRow}>
//         <Animated.Image
//           source={AppLogo}
//           style={[styles.appLogo, appLogoStyle]}
//           resizeMode="contain"
//         />
//         <Animated.View style={[styles.pokitWrapper, pokitStyle]}>
//           <Image
//             source={PockitLogo2}
//             style={styles.pokitLogo}
//             resizeMode="contain"
//           />
//         </Animated.View>
//       </View>

//       <Animated.View style={[styles.bottomImageWrapper, bottomImageStyle]}>
//         <Image
//           source={PokitItengineerscolor}
//           style={styles.bottomImage}
//           resizeMode="contain"
//         />
//       </Animated.View>
//     </SafeAreaView>
//   );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   logoRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop:-50,
//     width: 172, // total width for 2 logos + gap (80 + 12 + 80)
//   },
//   appLogo: {

//     width: 90,
//     height: 90,
//   },
//   pokitWrapper: {
//     width: 80,
//     height: 80,
//     marginLeft: 12,
//   },
//   pokitLogo: {
//     width: 90,
//     height: 90,
//   },
//   bottomImageWrapper: {
//     position: 'absolute',
//     bottom: 20, // 20 px above bottom edge
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   bottomImage: {
//     width: 150,
//     height: 40,
//   },
// });


import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { AppLogo, AppLogo1 } from './assets'; // your left logo
import { Reducers, useDispatch } from './context';
import { apiCall, fontFamily, Size, useTheme } from './modules';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
const PockitLogo2 = require('./assets/images/PokitEngginers2.png'); // right logo
const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png'); // bottom image

const SCREEN_WIDTH = Dimensions.get('window').width;

const SplashScreen = () => {
  // Animation shared values
  const pokitTranslateX = useSharedValue(0);
  const pokitOpacity = useSharedValue(1);
  const colors = useTheme();

  const appLogoTranslateX = useSharedValue(0);
  const appLogoScale = useSharedValue(1);

  const bottomMoveUp = useSharedValue(40); // start below visible (40 px down)
  const bottomOpacity = useSharedValue(0); // initially invisible

  const dispatch = useDispatch();

  // Wrap dispatch call in a normal JS function for runOnJS
 const triggerDispatch = async () => {
  try {
    await dispatch(Reducers.getUserInfo()); // wait for the async call
    // you can navigate or show next screen here
  } catch (error) {
    console.error('User info fetch failed', error);
    // optionally show retry or error UI
  }
};
const checkVersion = async () => {
  try {
    const version = DeviceInfo.getVersion();
    const res = await apiCall.post(`globalSetting/getVersion`);
    const { CUR_VERSION } = res.data.data[0].TECHNICIAN_CUR_VERSION;
    console.log("res",res.data.data[0].TECHNICIAN_CUR_VERSION)
console.log("admin panel current version",CUR_VERSION);
console.log("&&&&&admin panel current version",res.data.data[0].TECHNICIAN_CUR_VERSION >= version);

console.log("mobile current version",version);

    if (res.data.data[0].TECHNICIAN_CUR_VERSION <= version) {
      setIsVersionOK(true); // ✅ Safe to continue
    } 
    // else if (MIN_VERSION <= version) {
    //   setVersionManager({
    //     visible: true,
    //     isForce: false,
    //     message: `A new version is available. Please update.`,
    //   });
    // } 
    else {
      setVersionManager({
        visible: true,
        isForce: true,
        message: `A update is required to continue using the app.`,
      });
    }
  } catch (err) {
    console.error('Version check failed', err);
    // you might want to allow the app to continue in case of error
    setIsVersionOK(true);
  }
};

useEffect(()=>{
  checkVersion();
},[])
const [isVersionOK, setIsVersionOK] = useState(false);

// const checkVersion: () => Promise<void> = async () => {
//     return new Promise((resolve, reject) => {
//       const version = DeviceInfo.getVersion();
//       apiCall
//         .post(`globalSetting/getVersion`)
//         .then(res => {
//           console.log("version response",res.data.data)
//           const {CUR_VERSION, MIN_VERSION} = res.data.data[0];
//           if (CUR_VERSION <= version) {
//             resolve();
//           } else if (MIN_VERSION <= version) {
//             setVersionManager({
//               ...versionManager,
//               isForce: false,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           } else {
//             setVersionManager({
//               ...versionManager,
//               isForce: true,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           }
//         })
//         .catch(function (error) {
//           let message = '';
//           if (error.code) {
//             message = error.message;
//           } else if (error.message) {
//             message = error.message;
//           } else {
//             message = `Sorry for your inconvenience`;
//           }
//           reject(message);
//         });
//     });
//   };
const handleUpdate = () => {
  console.log("here to update")
  const storeUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/us/app/name-pockit-technician/id6747819751'
      : 'https://play.google.com/store/apps/details?id=com.pockit.technician';

  Linking.openURL(storeUrl).catch(err =>
    console.error('Failed to open app store:', err),
  );
};
  useEffect(() => {
    if (!isVersionOK) return;
    setTimeout(() => {
      // Animate right logo slide & fade out
      pokitTranslateX.value = withTiming(150, { duration: 700, easing: Easing.out(Easing.exp) });
      pokitOpacity.value = withTiming(0, { duration: 700 });

      // Animate left logo slide to center
      appLogoTranslateX.value = withTiming(46, { duration: 700, easing: Easing.out(Easing.exp) }, () => {
        // After sliding finishes, scale up appLogo more
        appLogoScale.value = withTiming(1.9, { duration: 500 });
      });

      // Animate bottom image move up and fade in after a delay, then dispatch after done
      bottomMoveUp.value = withDelay(
        1500,
        withTiming(
          0,
          { duration: 600, easing: Easing.out(Easing.exp) },
          (isFinished) => {
            if (isFinished) {
              // Use runOnJS to safely call dispatch on JS thread
              runOnJS(triggerDispatch)();
            }
          }
        )
      );
      bottomOpacity.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) }));
    }, 1000);
  }, [isVersionOK]);

  const pokitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pokitTranslateX.value }],
    opacity: pokitOpacity.value,
  }));

  const appLogoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: appLogoTranslateX.value },
      { scale: appLogoScale.value },
    ],
  }));

  const bottomImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomMoveUp.value }],
    opacity: bottomOpacity.value,
  }));
const [versionManager, setVersionManager] = useState({
    message: '',
  });
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoRow}>
        <Animated.Image
          source={AppLogo}
          style={[styles.appLogo, appLogoStyle]}
          resizeMode="contain"
        />
        <Animated.View style={[styles.pokitWrapper, pokitStyle]}>
          <Image
            source={PockitLogo2}
            style={styles.pokitLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomImageWrapper, bottomImageStyle]}>
        <Image
          source={PokitItengineerscolor}
          style={styles.bottomImage}
          resizeMode="contain"
        />
      </Animated.View>

       <Modal
        visible={versionManager.visible}
        animationType="fade"
        transparent={true}>
       <View style={styles._modalContainer}>
          {/* <View style={styles._modalContent}> */}
            <Image
              source={AppLogo}
              style={{height: 100, width: 100}}
              resizeMode={'contain'}
            />
          {/* </View> */}
          <View style={styles._txtContainer}>
            <Text style={styles._txt}>Time for an Update! To keep things running smoothly, please update to the latest version.</Text>
            <Text style={styles._txt}>{versionManager.message}</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 30,
              gap: 20,
              paddingHorizontal: 20,
            }}>
            {versionManager.isForce ? null : (
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  gap: 10,
                  backgroundColor: '#585858',
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: 24,
                    textAlign: 'center',
                    color: '#E9E9E9',
                    padding: 15,
                  }}>
                  {'Remind Me Later'}
                </Text>
                <ActivityIndicator
                  style={{
                    position: 'absolute',
                    right: Size.padding * 2,
                    alignSelf: 'center',
                  }}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
            onPress={()=>{handleUpdate()}}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                borderRadius: 8,
                // gap: 10,
                backgroundColor: colors.primary,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '500',
                  letterSpacing: 0.69,
                  color: colors.white,
                  fontFamily: fontFamily,
                }}>
                Update
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  right: Size.padding * 2,
                  alignSelf: 'center',
                  fontFamily: fontFamily,
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
     
      </Modal>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    width: 172, // total width for 2 logos + gap (80 + 12 + 80)
  },
  appLogo: {
    width: 90,
    height: 90,
  },
  pokitWrapper: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
  pokitLogo: {
    width: 90,
    height: 90,
  },
  bottomImageWrapper: {
    position: 'absolute',
    bottom: 20, // 20 px above bottom edge
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomImage: {
    width: 150,
    height: 40,
  },
   _modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal:18
  },
  _modalContent: {
    // width: '40%',
    // height: '20%',
    // backgroundColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  _txtContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  _txt: {
    fontFamily: fontFamily,
    textAlign: 'center',
    fontSize: 18,
  },
  _bottomTextContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
  },
});
