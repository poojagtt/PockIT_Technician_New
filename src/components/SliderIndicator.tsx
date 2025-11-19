// import React, {useState, useRef, useEffect, useMemo} from 'react';
// import {
//   View,
//   StyleSheet,
//   Animated,
//   PanResponder,
//   LayoutChangeEvent,
//   Linking,
// } from 'react-native';
// import {Button, Icon} from '../components';
// import {apiCall, fontFamily, useTheme} from '../modules';
// import {RootState, useDispatch, useSelector} from '../context/reducers/store';
// import {updateTechStatus} from '../context/reducers/app';
// import moment from 'moment';
// import {get} from '@react-native-firebase/database';
// import Modal from './Modal';
// import {Text} from 'react-native-paper';
// import {useNavigation} from '@react-navigation/native';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import {MenuParams, MenuRoutes} from '../routes/Menu';

// interface SliderIndicatorProps {
//   onStatusChange?: (isOnline: boolean) => void;
//   navigation?: any;
//   from?: string;
// }

// const SliderIndicator: React.FC<SliderIndicatorProps> = ({
//   onStatusChange,
//   navigation,
//   from,
// }) => {
//   const colors = useTheme();
//   const dispatch = useDispatch();
//   const {user, techStatus} = useSelector(state => state.app);
//   const slideAnimation = useRef(new Animated.Value(techStatus ? 1 : 0)).current;
//   const [containerWidth, setContainerWidth] = useState(0);
//   const dragIndicatorWidth = 38;
//   const containerPadding = 12;
//   const [unavailableModal, setUnavailableModal] = useState(false);

//   const maxTranslateX = containerWidth
//     ? Math.max(containerWidth - 2 * containerPadding - dragIndicatorWidth, 0)
//     : 0;

//   useEffect(() => {
//     slideAnimation.setValue(techStatus ? 1 : 0);
//   }, [techStatus, slideAnimation]);

//   const isUnavailable = (jobDate1: any[], jobDate2: any[]): boolean => {
//     if (!Array.isArray(jobDate1) || !Array.isArray(jobDate2)) {
//       return false; // Ensure data is valid
//     }

//     const formattedJobDates = jobDate2.map(date =>
//       moment(date).format('YYYY-MM-DD'),
//     );
//     const isBlockedDate = formattedJobDates.includes(
//       moment().format('YYYY-MM-DD'),
//     );

//     const isWeekendBlocked = jobDate1.some(
//       entry =>
//         entry.IS_SERIVCE_AVAILABLE === 0 &&
//         ['Sa', 'Su'].includes(entry.WEEK_DAY) &&
//         ['Sa', 'Su'].includes(moment().format('dd')),
//     );

//     return isBlockedDate || isWeekendBlocked;
//   };

//   const startXRef = useRef(0);

//   const panResponder = useMemo(
//     () =>
//       PanResponder.create({
//         onStartShouldSetPanResponder: () => true,
//         onMoveShouldSetPanResponder: () => true,
//         onPanResponderGrant: () => {

//           slideAnimation.stopAnimation((value: number) => {
//             startXRef.current = value * maxTranslateX;
//           });
//         },
//         onPanResponderMove: (_, {dx}) => {
//           const newX = startXRef.current + dx;
//           const newValue = Math.min(
//             Math.max(newX / (maxTranslateX || 1), 0),
//             1,
//           );
//           slideAnimation.setValue(newValue);
//         },
//         onPanResponderRelease: (_, {vx}) => {
//           // @ts-ignore
//           const currentValue = slideAnimation.__getValue();
//           const toValue = currentValue > 0.5 ? 1 : 0;



       
//           const goingOffline = techStatus === true && toValue === 0;
//           const goingOnline = techStatus === false && toValue === 1;
        
//           if (goingOffline) {
//             // your custom condition or alert for going offline
//             console.log('User trying to go OFFLINE');
//             // Do your logic or confirmation here
//           } else if (goingOnline) {
//             console.log('User trying to go ONLINE');
//             // API call already handled in your code
//           }
//           Animated.spring(slideAnimation, {
//             toValue,
//             useNativeDriver: false,
//             friction: 8,
//             tension: 30,
//             velocity: vx,
//             restDisplacementThreshold: 0.01,
//             restSpeedThreshold: 0.01,
//           }).start(async () => {
//             console.log('toValue', toValue);
//             try {
//               apiCall
//                 .post(`api/technician/getUnAvailablityOfTechnician`, {
//                   TECHNICIAN_ID: user?.ID,
//                 })
//                 .then(res => {
//                   if (res.status === 200) {
//                     // console.log('\nholidays1', res.data.DATA1);
//                     // console.log('\nholidays2', res.data.DATA2);

//                     const dates1 = res.data.DATA1.map((item: any) =>
//                       moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
//                     );
//                     const dates2 = res.data.DATA2.map((item: any) =>
//                       moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
//                     );
//                     console.log('dates1', isUnavailable(dates1, dates2));
//                     if (isUnavailable(dates1, dates2)) {
//                       setUnavailableModal(true);
//                       console.log('Service is not available');
//                       slideAnimation.setValue(0);
//                     } else {
//                       const newStatus = toValue === 1;
//                       dispatch(updateTechStatus(newStatus));
//                       if (onStatusChange) {
//                         onStatusChange(newStatus);
//                       }
//                     }
//                   }
//                 })
//                 .catch(err => {
//                   console.log('jobs err.....', err);
//                 });
//             } catch (error) {
//               console.log(error);
//             }
//           });
//         },
//       }),
//     [maxTranslateX, slideAnimation, dispatch],
//   );

//   const translateX = slideAnimation.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, maxTranslateX],
//   });
//   const backgroundColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [colors.primary2, '#FFFFFF', '#FFFFFF'],
//   });
//   const textColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
//   });
//   const borderColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['transparent', colors.primary2, colors.primary2],
//   });
//   const offlineTextOpacity = slideAnimation.interpolate({
//     inputRange: [0, 0.5],
//     outputRange: [1, 0],
//   });
//   const onlineTextOpacity = slideAnimation.interpolate({
//     inputRange: [0.5, 1],
//     outputRange: [0, 1],
//   });
//   const iconOfflineOpacity = slideAnimation.interpolate({
//     inputRange: [0, 0.5],
//     outputRange: [1, 0],
//   });
//   const iconOnlineOpacity = slideAnimation.interpolate({
//     inputRange: [0.5, 1],
//     outputRange: [0, 1],
//   });
//   const iconBackgroundColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
//   });

//   const onLayout = (event: LayoutChangeEvent) => {
//     setContainerWidth(event.nativeEvent.layout.width);
//   };

//   return (
//     <View style={styles.toggleContainer}>
//       <View style={styles.buttonWrapper}>
//         <Animated.View
//           style={[
//             styles.toggleButton,
//             {
//               backgroundColor,
//               borderColor,
//             },
//           ]}
//           onLayout={onLayout}>
//           <View style={styles.textContainer}>
//             <Animated.Text
//               style={[
//                 styles.toggleText,
//                 {opacity: offlineTextOpacity, color: textColor},
//               ]}>
//               Go online
//             </Animated.Text>
//             <Animated.Text
//               style={[
//                 styles.toggleText,
//                 {
//                   opacity: onlineTextOpacity,
//                   position: 'absolute',
//                   color: textColor,
//                 },
//               ]}>
//               Go offline
//             </Animated.Text>
//           </View>
//           <Animated.View
//             {...panResponder.panHandlers}
//             style={[
//               styles.dragIndicator,
//               {
//                 transform: [{translateX}],
//                 left: containerPadding,
//                 backgroundColor: iconBackgroundColor,
//               },
//             ]}>
//             <Animated.View
//               style={[styles.iconContainer, {opacity: iconOfflineOpacity}]}>
//               <Icon
//                 name="arrow-forward-ios"
//                 type="MaterialIcons"
//                 size={20}
//                 style={{alignSelf: 'center', marginLeft: 3}}
//                 color={colors.primary2}
//               />
//             </Animated.View>
//             <Animated.View
//               style={[styles.iconContainer, {opacity: iconOnlineOpacity}]}>
//               <Icon
//                 name="arrow-back-ios"
//                 type="MaterialIcons"
//                 size={20}
//                 style={{alignSelf: 'center', marginLeft: 7}}
//                 color="#FFFFFF"
//               />
//             </Animated.View>
//           </Animated.View>
//         </Animated.View>
//       </View>

//       <Modal
//         title="Cannot Go Online"
//         onClose={() => {
//           setUnavailableModal(false);
//           slideAnimation.setValue(0);
//         }}
//         show={unavailableModal}>
//         <View>
//           <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 16,
//               fontWeight: '600',
//               textAlign: 'left',
//               // marginVertical: 16,
//             }}>
//             You have marked today as a holiday. You cannot go online at the
//             moment.
//           </Text>
//           <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 14,
//               fontWeight: '600',
//               textAlign: 'left',
//               marginVertical: 16,
//             }}>
//             To start accepting jobs today, update your availability in your
//             profile or contact the admin for assistance.
//           </Text>

//           <View
//             style={{
//               marginVertical: 16,
//               flexDirection: 'row',
//               flex: 1,
//               justifyContent: 'space-between',
//               alignItems: 'center',
//             }}>
//             <View style={{flex: 1}}>
//               <Button
//                 label="Contact Admin"
//                 onPress={() => {
//                   setUnavailableModal(false);
//                    Linking.openURL('tel:9582700865');
//                 }}></Button>
//             </View>
//             <View style={{width: 16}} />
//             <View style={{flex: 1}}>
//               <Button
//                 label="Update Availability"
//                 onPress={() => {
//                   setUnavailableModal(false);
//                   if (from == 'D') {
//                     navigation.navigate('Profile', {
//                       screen: 'TimeSheet',
//                     });
//                   } else {
//                     navigation.navigate('TimeSheet');
//                   }
//                 }}
//               />
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   toggleContainer: {
//     marginVertical: 16,
//   },
//   buttonWrapper: {
//     height: 56,
//   },
//   toggleButton: {
//     height: 56,
//     borderRadius: 12,
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     borderWidth: 1,
//   },
//   textContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   toggleText: {
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   dragIndicator: {
//     width: 38,
//     height: 38,
//     borderRadius: 8,
//     position: 'absolute',
//     top: 9,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default SliderIndicator;



// import React, {useState, useRef, useEffect, useMemo} from 'react';
// import {
//   View,
//   StyleSheet,
//   Animated,
//   PanResponder,
//   LayoutChangeEvent,
//   Linking,
// } from 'react-native';
// import {Button, Icon} from '../components';
// import {apiCall, fontFamily, useTheme} from '../modules';
// import {RootState, useDispatch, useSelector} from '../context/reducers/store';
// import {updateTechStatus} from '../context/reducers/app';
// import moment from 'moment';
// import {get} from '@react-native-firebase/database';
// import Modal from './Modal';
// import {Text} from 'react-native-paper';
// import {useNavigation} from '@react-navigation/native';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import {MenuParams, MenuRoutes} from '../routes/Menu';

// interface SliderIndicatorProps {
//   onStatusChange?: (isOnline: boolean) => void;
//   navigation?: any;
//   from?: string;
// }

// const SliderIndicator: React.FC<SliderIndicatorProps> = ({
//   onStatusChange,
//   navigation,
//   from,
// }) => {
//   const colors = useTheme();
//   const dispatch = useDispatch();
//   const {user, techStatus} = useSelector(state => state.app);
//   const slideAnimation = useRef(new Animated.Value(techStatus ? 1 : 0)).current;
//   const [containerWidth, setContainerWidth] = useState(0);
//   const dragIndicatorWidth = 38;
//   const containerPadding = 12;
//   const [unavailableModal, setUnavailableModal] = useState(false);
//   const [offlineModal, setOfflineModal] = useState(false);


//   const maxTranslateX = containerWidth
//     ? Math.max(containerWidth - 2 * containerPadding - dragIndicatorWidth, 0)
//     : 0;

//   useEffect(() => {
//     slideAnimation.setValue(techStatus ? 1 : 0);
//   }, [techStatus, slideAnimation]);

//   const isUnavailable = (jobDate1: any[], jobDate2: any[]): boolean => {
//     if (!Array.isArray(jobDate1) || !Array.isArray(jobDate2)) {
//       return false; // Ensure data is valid
//     }

//     const formattedJobDates = jobDate2.map(date =>
//       moment(date).format('YYYY-MM-DD'),
//     );
//     const isBlockedDate = formattedJobDates.includes(
//       moment().format('YYYY-MM-DD'),
//     );

//     const isWeekendBlocked = jobDate1.some(
//       entry =>
//         entry.IS_SERIVCE_AVAILABLE === 0 &&
//         ['Sa', 'Su'].includes(entry.WEEK_DAY) &&
//         ['Sa', 'Su'].includes(moment().format('dd')),
//     );

//     return isBlockedDate || isWeekendBlocked;
//   };
//  const getAssignedJobs = async () => {
//       // Update the UI immediately
     

      
//         // Check for jobs when switching to unavailable
//         try {
//           const date = moment().format('YYYY-MM-DD');

//           const response = await apiCall.post('api/jobCard/get', {
//             filter: ` AND TECHNICIAN_ID = ${user?.ID} AND STATUS = "AS" AND DATE(SCHEDULED_DATE_TIME) = '${date}' `,
//           });

//           if (response.data.data && response.data.data.length > 0) {
//             console.log('Jobs found:', response.data.data);
//             if(response.data?.data?.length > 0){
//               return true; 
//             }
//             else
//             {
//               return false; 
//             }
           
//           }
//         } catch (error) {
//           // If API call fails, revert the switch
         
//           console.error('Error checking jobs:', error);
//         }
      
//     };
//   const startXRef = useRef(0);

//   const panResponder = useMemo(
//     () =>
//       PanResponder.create({
//         onStartShouldSetPanResponder: () => true,
//         onMoveShouldSetPanResponder: () => true,
//         onPanResponderGrant: () => {

//           slideAnimation.stopAnimation((value: number) => {
//             startXRef.current = value * maxTranslateX;
//           });
//         },
//         onPanResponderMove: (_, {dx}) => {
//           const newX = startXRef.current + dx;
//           const newValue = Math.min(
//             Math.max(newX / (maxTranslateX || 1), 0),
//             1,
//           );
//           slideAnimation.setValue(newValue);
//         },
//         onPanResponderRelease: async(_, {vx}) => {
//           // @ts-ignore
//           const currentValue = slideAnimation.__getValue();
//           const toValue = currentValue > 0.5 ? 1 : 0;
//           const goingOffline = techStatus === true && toValue === 0;

//           if (goingOffline) {
//             // 👇 Call your API or check for today's job
//             const hasJobToday = await getAssignedJobs(); // write this function
        
//             if (hasJobToday) {
//               // 👇 Show modal and prevent toggle
//               setOfflineModal(true);
//               // Reset the animation back to Online
//               Animated.spring(slideAnimation, {
//                 toValue: 1,
//                 useNativeDriver: false,
//               }).start();
//               return; // Don't continue further
//             }
//           }
        
        
         
//           Animated.spring(slideAnimation, {
//             toValue,
//             useNativeDriver: false,
//             friction: 8,
//             tension: 30,
//             velocity: vx,
//             restDisplacementThreshold: 0.01,
//             restSpeedThreshold: 0.01,
//           }).start(async () => {
//             console.log('toValue', toValue);
//             try {
//               apiCall
//                 .post(`api/technician/getUnAvailablityOfTechnician`, {
//                   TECHNICIAN_ID: user?.ID,
                
//                 })
//                 .then(res => {
//                   if (res.status === 200) {
//                     console.log('\nholidays1', res.data.DATA1);
//                     console.log('\nholidays2', res.data.DATA2);

//                     const dates1 = res.data.DATA1.map((item: any) =>
//                       moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
//                     );
//                     const dates2 = res.data.DATA2.map((item: any) =>
//                       moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
//                     );
//                     console.log('dates1', isUnavailable(dates1, dates2));
//                     if (isUnavailable(dates1, dates2)) {
//                       setUnavailableModal(true);
//                       console.log('Service is not available');
//                       slideAnimation.setValue(0);
//                     } else {
//                       const newStatus = toValue === 1;
//                       dispatch(updateTechStatus(newStatus));
//                       if (onStatusChange) {
//                         onStatusChange(newStatus);
//                       }
//                     }
//                   }
//                 })
//                 .catch(err => {
//                   console.log('jobs err.....', err);
//                 });
//             } catch (error) {
//               console.log(error);
//             }
//           });
//         },
//       }),
//     [maxTranslateX, slideAnimation, dispatch],
//   );

//   const translateX = slideAnimation.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, maxTranslateX],
//   });
//   const backgroundColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [colors.primary2, '#FFFFFF', '#FFFFFF'],
//   });
//   const textColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
//   });
//   const borderColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['transparent', colors.primary2, colors.primary2],
//   });
//   const offlineTextOpacity = slideAnimation.interpolate({
//     inputRange: [0, 0.5],
//     outputRange: [1, 0],
//   });
//   const onlineTextOpacity = slideAnimation.interpolate({
//     inputRange: [0.5, 1],
//     outputRange: [0, 1],
//   });
//   const iconOfflineOpacity = slideAnimation.interpolate({
//     inputRange: [0, 0.5],
//     outputRange: [1, 0],
//   });
//   const iconOnlineOpacity = slideAnimation.interpolate({
//     inputRange: [0.5, 1],
//     outputRange: [0, 1],
//   });
//   const iconBackgroundColor = slideAnimation.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
//   });

//   const onLayout = (event: LayoutChangeEvent) => {
//     setContainerWidth(event.nativeEvent.layout.width);
//   };

//   return (
//     <View style={styles.toggleContainer}>
//       <View style={styles.buttonWrapper}>
//         <Animated.View
//           style={[
//             styles.toggleButton,
//             {
//               backgroundColor,
//               borderColor,
//             },
//           ]}
//           onLayout={onLayout}>
//           <View style={styles.textContainer}>
//             <Animated.Text
//               style={[
//                 styles.toggleText,
//                 {opacity: offlineTextOpacity, color: textColor},
//               ]}>
//               Go online
//             </Animated.Text>
//             <Animated.Text
//               style={[
//                 styles.toggleText,
//                 {
//                   opacity: onlineTextOpacity,
//                   position: 'absolute',
//                   color: textColor,
//                 },
//               ]}>
//               Go offline
//             </Animated.Text>
//           </View>
//           <Animated.View
//             {...panResponder.panHandlers}
//             style={[
//               styles.dragIndicator,
//               {
//                 transform: [{translateX}],
//                 left: containerPadding,
//                 backgroundColor: iconBackgroundColor,
//               },
//             ]}>
//             <Animated.View
//               style={[styles.iconContainer, {opacity: iconOfflineOpacity}]}>
//               <Icon
//                 name="arrow-forward-ios"
//                 type="MaterialIcons"
//                 size={20}
//                 style={{alignSelf: 'center', marginLeft: 3}}
//                 color={colors.primary2}
//               />
//             </Animated.View>
//             <Animated.View
//               style={[styles.iconContainer, {opacity: iconOnlineOpacity}]}>
//               <Icon
//                 name="arrow-back-ios"
//                 type="MaterialIcons"
//                 size={20}
//                 style={{alignSelf: 'center', marginLeft: 7}}
//                 color="#FFFFFF"
//               />
//             </Animated.View>
//           </Animated.View>
//         </Animated.View>
//       </View>

//       <Modal
//         title="Cannot Go Online"
//         onClose={() => {
//           setUnavailableModal(false);
//           slideAnimation.setValue(0);
//         }}
//         show={unavailableModal}>
//         <View>
//           <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 16,
//               fontWeight: '600',
//               textAlign: 'left',
//               // marginVertical: 16,
//             }}>
//             You have marked today as a holiday. You cannot go online at the
//             moment.
//           </Text>
//           <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 14,
//               fontWeight: '600',
//               textAlign: 'left',
//               marginVertical: 16,
//             }}>
//             To start accepting jobs today, update your availability in your
//             profile or contact the admin for assistance.
//           </Text>

//           <View
//             style={{
//               marginVertical: 16,
//               flexDirection: 'row',
//               flex: 1,
//               justifyContent: 'space-between',
//               alignItems: 'center',
//             }}>
//             <View style={{flex: 1}}>
//               <Button
//                 label="Contact Admin"
//                 onPress={() => {
//                   setUnavailableModal(false);
//                    Linking.openURL('tel:9582700865');
//                 }}></Button>
//             </View>
//             <View style={{width: 16}} />
//             <View style={{flex: 1}}>
//               <Button
//                 label="Update Availability"
//                 onPress={() => {
//                   setUnavailableModal(false);
//                   if (from == 'D') {
//                     navigation.navigate('Profile', {
//                       screen: 'TimeSheet',
//                     });
//                   } else {
//                     navigation.navigate('TimeSheet');
//                   }
//                 }}
//               />
//             </View>
//           </View>
//         </View>
//       </Modal>



//       <Modal
//         title="Cannot Go Offline"
//         onClose={() => {
//           setOfflineModal(false);
//         }}
//         show={offlineModal}>
//         <View>
//           <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 16,
//               fontWeight: '600',
//               textAlign: 'left',
//               // marginVertical: 16,
//             }}>
//            You have an active job assigned for today. Please complete it before going offline.
//           </Text>
//           {/* <Text
//             style={{
//               fontFamily: fontFamily,
//               fontSize: 14,
//               fontWeight: '600',
//               textAlign: 'left',
//               marginVertical: 16,
//             }}>
//             for more details contact the admin for assistance.
//           </Text> */}

       
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   toggleContainer: {
//     marginVertical: 16,
//   },
//   buttonWrapper: {
//     height: 56,
//   },
//   toggleButton: {
//     height: 56,
//     borderRadius: 12,
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     borderWidth: 1,
//   },
//   textContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   toggleText: {
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   dragIndicator: {
//     width: 38,
//     height: 38,
//     borderRadius: 8,
//     position: 'absolute',
//     top: 9,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default SliderIndicator;



import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Linking,
} from 'react-native';
import {Button, Icon} from '../components';
import {apiCall, fontFamily, useTheme} from '../modules';
import {RootState, useDispatch, useSelector} from '../context/reducers/store';
import {updateTechStatus} from '../context/reducers/app';
import moment from 'moment';
import {get} from '@react-native-firebase/database';
import Modal from './Modal';
import {Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MenuParams, MenuRoutes} from '../routes/Menu';

interface SliderIndicatorProps {
  onStatusChange?: (isOnline: boolean) => void;
  navigation?: any;
  from?: string;
}

const SliderIndicator: React.FC<SliderIndicatorProps> = ({
  onStatusChange,
  navigation,
  from,
}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {user, techStatus} = useSelector(state => state.app);
  const slideAnimation = useRef(new Animated.Value(techStatus ? 1 : 0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const dragIndicatorWidth = 38;
  const containerPadding = 12;
  const [unavailableModal, setUnavailableModal] = useState(false);
  const [offlineModal, setOfflineModal] = useState(false);


  const maxTranslateX = containerWidth
    ? Math.max(containerWidth - 2 * containerPadding - dragIndicatorWidth, 0)
    : 0;

  useEffect(() => {
    slideAnimation.setValue(techStatus ? 1 : 0);
  }, [techStatus, slideAnimation]);

  const isUnavailable = (jobDate1: any[], jobDate2: any[]): { isBlockedDate: boolean; isWeekendBlocked: boolean } => {
    const formattedJobDates = jobDate2.map(date => moment(date.DATE_OF_MONTH).format('YYYY-MM-DD'));
  
    
    const isWeekendBlocked = jobDate1.some(
      entry =>
        entry.IS_SERIVCE_AVAILABLE === 0 &&  
        ['Sa', 'Su'].includes(entry.WEEK_DAY) &&
        ['Sa', 'Su'].includes(moment().format('dd'))
    );
    const isBlockedDate= jobDate2.some(entry => entry.IS_SERIVCE_AVAILABLE === false && formattedJobDates.includes(moment().format('YYYY-MM-DD')));
console.log('isBlockedDate',isBlockedDate);
    console.log('isWeekendBlocked',isWeekendBlocked);
    return { isBlockedDate, isWeekendBlocked };
  };
  
 const getAssignedJobs = async () => {
     
        try {
          const date = moment().format('YYYY-MM-DD');

          const response = await apiCall.post('api/jobCard/get', {
            filter: ` AND TECHNICIAN_ID = ${user?.ID} AND STATUS = "AS" AND DATE(SCHEDULED_DATE_TIME) = '${date}' `,
          });
console.log('response',response.data.data);
          if (response.data.data && response.data.data.length > 0) {
            console.log('Jobs found:', response.data.data);
            if(response.data?.data?.length > 0){
              return true; 
            }
            else
            {
              return false; 
            }
           
          }
        } catch (error) {
          // If API call fails, revert the switch
         
          console.error('Error checking jobs:', error);
        }
      
    };
  const startXRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {

          slideAnimation.stopAnimation((value: number) => {
            startXRef.current = value * maxTranslateX;
          });
        },
        onPanResponderMove: (_, {dx}) => {
          const newX = startXRef.current + dx;
          const newValue = Math.min(
            Math.max(newX / (maxTranslateX || 1), 0),
            1,
          );
          slideAnimation.setValue(newValue);
        },
        onPanResponderRelease: async(_, {vx}) => {
          // @ts-ignore
          const currentValue = slideAnimation.__getValue();
          const toValue = currentValue > 0.5 ? 1 : 0;
          const goingOffline = techStatus === true && toValue === 0;
console.log('goingOffline',techStatus);
console.log('toValue****',toValue);

          if (goingOffline) {
            // 👇 Call your API or check for today's job
            const hasJobToday = await getAssignedJobs(); // write this function
        
            if (hasJobToday) {
              // 👇 Show modal and prevent toggle
              setOfflineModal(true);
              // Reset the animation back to Online
              Animated.spring(slideAnimation, {
                toValue: 1,
                useNativeDriver: false,
              }).start();
              return; // Don't continue further
            }
          }
        
        
         
          Animated.spring(slideAnimation, {
            toValue,
            useNativeDriver: false,
            friction: 8,
            tension: 30,
            velocity: vx,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }).start(async () => {
            console.log('toValue', toValue);

  try {
      apiCall
        .post(`api/technician/getUnAvailablityOfTechnician`, {
          TECHNICIAN_ID: user?.ID,
        
        })
        .then(res => {
          if (res.status === 200) {
            // console.log('\nadmin holiday', res.data.DATA1);
            // console.log('\nself holiday', res.data.DATA2);
  
            const data1 = res.data.DATA1.map((item: any) => ({
              WEEK_DAY: item.WEEK_DAY, // e.g., 'Su', 'Mo', etc.
              IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
            }));
  
            // Dates from self holiday list (already specific dates)
            const selfHolidayDates = res.data.DATA2
            .filter((item: any) => item.IS_SERIVCE_AVAILABLE === false)
            .map((item: any) => ({
              DATE_OF_MONTH: moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
              IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
            }));
            
  console.log('dates1', data1);
            console.log('dates2', selfHolidayDates);
        
            const {isBlockedDate, isWeekendBlocked} = isUnavailable(
              data1,selfHolidayDates
            );
            console.log('isBlockedDate', isBlockedDate);
            console.log('isWeekendBlocked', isWeekendBlocked);
            if (isBlockedDate && isWeekendBlocked) {
              setUnavailableModal(true);
              console.log('Service is not available');
              slideAnimation.setValue(0);
            } else if(isBlockedDate) {
              setUnavailableModal(true);
              console.log('Service is not available');
              slideAnimation.setValue(0);
            }else{
              const newStatus = toValue === 1;
              dispatch(updateTechStatus(newStatus));
              if (onStatusChange) {
                onStatusChange(newStatus);
              }
            }
          
          }
        })
        .catch(err => {
          console.log('getHolidays err.....', err);
        });
    } catch (error) {
      console.log('getHolidays catch err', error);
    }




            
         
          });
        },
      }),
    [maxTranslateX, slideAnimation, dispatch],
  );

  const translateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxTranslateX],
  });
  const backgroundColor = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.primary2, '#FFFFFF', '#FFFFFF'],
  });
  const textColor = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
  });
  const borderColor = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['transparent', colors.primary2, colors.primary2],
  });
  const offlineTextOpacity = slideAnimation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  });
  const onlineTextOpacity = slideAnimation.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });
  const iconOfflineOpacity = slideAnimation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  });
  const iconOnlineOpacity = slideAnimation.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });
  const iconBackgroundColor = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFFFFF', colors.primary2, colors.primary2],
  });

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.toggleContainer}>
      <View style={styles.buttonWrapper}>
        <Animated.View
          style={[
            styles.toggleButton,
            {
              backgroundColor,
              borderColor,
            },
          ]}
          onLayout={onLayout}>
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.toggleText,
                {opacity: offlineTextOpacity, color: textColor},
              ]}>
              Go online
            </Animated.Text>
            <Animated.Text
              style={[
                styles.toggleText,
                {
                  opacity: onlineTextOpacity,
                  position: 'absolute',
                  color: textColor,
                },
              ]}>
              Go offline
            </Animated.Text>
          </View>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.dragIndicator,
              {
                transform: [{translateX}],
                left: containerPadding,
                backgroundColor: iconBackgroundColor,
              },
            ]}>
            <Animated.View
              style={[styles.iconContainer, {opacity: iconOfflineOpacity}]}>
              <Icon
                name="arrow-forward-ios"
                type="MaterialIcons"
                size={20}
                style={{alignSelf: 'center', marginLeft: 3}}
                color={colors.primary2}
              />
            </Animated.View>
            <Animated.View
              style={[styles.iconContainer, {opacity: iconOnlineOpacity}]}>
              <Icon
                name="arrow-back-ios"
                type="MaterialIcons"
                size={20}
                style={{alignSelf: 'center', marginLeft: 7}}
                color="#FFFFFF"
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>

      <Modal
        title="Cannot Go Online"
        onClose={() => {
          setUnavailableModal(false);
          slideAnimation.setValue(0);
        }}
        show={unavailableModal}>
        <View>
          <Text
            style={{
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'left',
            }}>
            You have marked today as a holiday. You cannot go online at the
            moment.
          </Text>
          <Text
            style={{
              fontFamily: fontFamily,
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'left',
              marginVertical: 16,
            }}>
            To start accepting jobs today, update your availability in your
            profile or contact the admin for assistance.
          </Text>

          <View
            style={{
              marginVertical: 16,
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View style={{flex: 1}}>
              <Button
                label="Contact Admin"
                onPress={() => {
                  setUnavailableModal(false);
                   Linking.openURL('tel:9582700865');
                }}/>
            </View>
            <View style={{width: 16}} />
            <View style={{flex: 1}}>
              <Button
                label="Update Availability"
                onPress={() => {
                  setUnavailableModal(false);
                  if (from == 'D') {
                    navigation.navigate('Profile', {
                      screen: 'TimeSheet',
                    });
                  } else {
                    navigation.navigate('TimeSheet');
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>



      <Modal
        title="Cannot Go Offline"
        onClose={() => {
          setOfflineModal(false);
        }}
        show={offlineModal}>
        <View>
          <Text
            style={{
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'left',
              // marginVertical: 16,
            }}>
           You have an active job assigned for today. Please complete it before going offline.
          </Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    marginVertical: 16,
  },
  buttonWrapper: {
    height: 56,
  },
  toggleButton: {
    height: 56,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  dragIndicator: {
    width: 38,
    height: 38,
    borderRadius: 8,
    position: 'absolute',
    top: 9,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SliderIndicator;
