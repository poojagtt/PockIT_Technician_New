import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  BackHandler,
  Linking,
} from 'react-native';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {JobRoutes} from '../../routes/Job';
import {
  IMAGE_URL,
  apiCall,
  Size,
  useTheme,
  fontFamily,
  Permissions,
  useStorage,
  BASE_URL,
} from '../../modules';
import {Icon} from '../../components';
import StopWatch from '../../components/StopWatch';
import ThreeDotMenu from './ThreeDotMenu';
import {_defaultImage, _noData, _technicianMap, SVG} from '../../assets';
import AnimatedCard from '../../components/AnimatedCard';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import Button from '../../components/Button';
import SuccessModal from '../../components/SuccessModal';
import JobClose from './JobClose';
import moment from 'moment';
import RescheduleRequest from './RescheduleRequest';
import Geolocation from 'react-native-geolocation-service';
import ImageView from 'react-native-image-viewing';
import {resetAndNavigate} from '../../utils';
import RateCustomer from './Components/RateCustomer';
import StarRating from 'react-native-star-rating-widget';
import {convertTo12HourFormat} from '../../Functions';
import {GOOGLE_MAP_API_KEY} from '../../modules/services';
import {useSelector} from '../../context';
import Toast from '../../components/Toast';
import messaging from '@react-native-firebase/messaging';
import { JobStopBgService } from '../../utils/JobBackgroundLocation';

interface JobFlowProps extends JobRoutes<'JobFlow'> {}
const JobFlow: React.FC<JobFlowProps> = ({navigation, route}) => {
  const {item, isFromJobList} = route.params;
  const [details, setDetails] = useState<JobData>(item);
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const [loader, setLoader] = useState({
    startJob: false,
    pauseJob: false,
    resumeJob: false,
    getPhotos: false,
  });
  const [partList, setPartList] = useState<partListDetail[]>([]);
  // @ts-ignore
  const mapRef: any = useRef();
  const [region, setRegion] = useState({
    latitude: 16.8524,
    longitude: 74.5815,
    latitudeDelta: 2.5,
    longitudeDelta: 2.5,
    loading: true,
  });
  // console.log("job flow item",item)
  const [expandCard, setExpandCard] = useState({
    contactDetails: false,
    details: false,
    parts: false,
    customer: false,
    payment: false,
    showMenu: false,
    showMap: false,
    reschedule: false,
    imageView: false,
    showFullComment: false,
  });
  const [successModal, setSuccessModal] = useState({
    visible: false,
    message: '',
  });
  const [jobCloseModal, setJobCloseModal] = useState(false);
  const [isTimer, setIsTimer] = useState(false);

  const [photos, setPhotos] = useState<JobPhotos[]>([]);
  const [jobCardFeedback, setJobCardFeedback] = useState<any>({});
  const [rescheduleRequestData, setRescheduleRequestData] =
    // @ts-ignore
    useState<JobRescheduleData>({});

  const handleBackPress = useCallback(() => {
    if (isFromJobList) {
      navigation.goBack();
    } else {
      // @ts-ignore
      resetAndNavigate(navigation, 'Home', 'Dashboard');
    }
    return true;
  }, [isFromJobList, navigation]);

  const initializeTimerOnFocus = useCallback(async () => {
    try {
      const timerDataStr = await useStorage.getString('JobTimer');
      const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

      if (
        timerData?.jobComplete ||
        details.TECHNICIAN_STATUS === 'CO' ||
        details.IS_JOB_COMPLETE === 1
      ) {
        setIsTimer(false);
        if (timerData?.oldDuration) {
          setDetails(prev => ({
            ...prev,
            USED_TIME: timerData.oldDuration.toString(),
          }));
        }
        return;
      }

      if (details.TRACK_STATUS === 'SJ') {
        const currentTime = moment().unix();
        let elapsedTime = timerData?.oldDuration || 0;

        if (timerData) {
          elapsedTime += currentTime - (timerData.startTime || currentTime);
        }
        const updatedTimer = {
          isTimer: true,
          startTime: currentTime,
          oldDuration: elapsedTime,
        };
        await useStorage.set('JobTimer', JSON.stringify(updatedTimer));
        setIsTimer(true);
        setDetails(prev => ({
          ...prev,
          USED_TIME: elapsedTime.toString(),
        }));
      } else {
        setIsTimer(false);
      }
    } catch (error) {
      console.error('Error initializing timer on focus:', error);
    }
  }, [
    details.TRACK_STATUS,
    details.TECHNICIAN_STATUS,
    details.IS_JOB_COMPLETE,
  ]);

  const handleFocus = useCallback(() => {
    setExpandCard({
      contactDetails: false,
      details: false,
      parts: false,
      customer: false,
      payment: false,
      showMenu: false,
      showMap: false,
      reschedule: false,
      imageView: false,
      showFullComment: false,
    });

    initializeTimerOnFocus();
  }, [initializeTimerOnFocus, navigation]);

  const handleBlur = useCallback(() => {
    setExpandCard(prev => ({
      ...prev,
      showMenu: false,
    }));
  }, []);

  const handleLocationSuccess = useCallback(async (location: any) => {
    try {
      let {latitude, longitude} = location.coords;
      setRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 2.5,
        longitudeDelta: 2.5,
        loading: false,
      });
    } catch (error) {
      console.warn('Error processing location:', error);
    }
  }, []);

  const handleLocationError = useCallback((error: any) => {
    console.warn('Geolocation error:', error);
    setTimeout(getCurrentLocation, 2000);
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const Permission = await Permissions.checkLocation();
      if (!Permission) {
        await Permissions.requestLocation();
      } else {
        Geolocation.getCurrentPosition(
          handleLocationSuccess,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      }
    } catch (error) {
      console.warn('Permission or general error:', error);
    }
  }, [handleLocationSuccess, handleLocationError]);

  const getPhotos = useCallback(async () => {
    try {
      let payload = {
        filter: `AND JOB_CARD_ID=${item.ID} AND ORDER_ID = ${item.ORDER_ID}`,
      };
      const response = await apiCall.post('api/jobPhotosDetails/get', payload);
      if (response.data && response.data.code === 200) {
        setPhotos(response.data.data);
      } else {
        Alert.alert('Failed to get images');
      }
    } catch (error) {
      console.error('Error in Get:', error);
      Alert.alert('Failed to get images');
    } finally {
      setLoader(prev => ({...prev, getPhotos: false}));
    }
  }, [item.ID, item.ORDER_ID]);

  const startJob = useCallback(async () => {
    try {
      setLoader(prev => ({...prev, startJob: true}));
      let payload = {
        JOB_DATA: [details],
        TECHNICIAN_ID: user?.ID,
        STATUS: 'SJ',
      };
      const response = await apiCall.post(
        'api/technician/updateJobStatus',
        payload,
      );

      if (response.data.code === 200) {
        const startTime = moment().unix();
        const timer = {
          isTimer: true,
          startTime: startTime,
          oldDuration: 0,
        };

        await useStorage.set('JobTimer', JSON.stringify(timer));
        setIsTimer(true);

        setDetails(prev => ({
          ...prev,
          TRACK_STATUS: 'SJ',
          USED_TIME: '0',
          ORDER_STATUS_NAME: 'Start job',
        }));

        setSuccessModal({visible: true, message: 'Job started'});
        setTimeout(() => {
          setSuccessModal({visible: false, message: ''});
        }, 1500);
        // @ts-ignore
        resetAndNavigate(navigation, 'Job', 'JobFlow', {
          item: {
            ...item,
            TRACK_STATUS: 'SJ',
            USED_TIME: '0',
            ORDER_STATUS_NAME: 'Start job',
          },
        });
      } else {
        Alert.alert('Failed to Start job');
      }
    } catch (error) {
      console.error('Error in Job Start:', error);
      Alert.alert('Error starting job');
    } finally {
      setLoader(prev => ({...prev, startJob: false}));
    }
  }, [details, user?.ID]);
  const [routeCoordinates, setRouteCoordinates] = useState<any>([]);
  useEffect(() => {
    fetchRouteCoordinates(region, item, GOOGLE_MAP_API_KEY)
      .then(setRouteCoordinates)
      .catch(console.warn);
  }, [region, item]);

  const fetchRouteCoordinates = async (
    origin: any,
    destination: any,
    apiKey: any,
  ) => {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${Number(destination.LOCATION_LATITUDE)},${Number(
      destination.LOCATION_LONG,
    )}`;

    const response = await apiCall.post('getDirections', {
      LOCATION_LATITUDE: origin.latitude,
      LOCATION_LONG: origin.longitude,
      destination: {
        LOCATION_LATITUDE: destination.LOCATION_LATITUDE,
        LOCATION_LONG: destination.LOCATION_LONG,
      },
    });

    if (response.data.json.routes.length) {
      const points = decodePolyline(
        response.data.json.routes[0].overview_polyline.points,
      );
      return points;
    }

    throw new Error('No routes found');
  };

  // @ts-ignore
  function decodePolyline(encoded) {
    let poly = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

  const completeJob = useCallback(
    async (remarks: any, photos: any) => {
      try {
        const timerDataStr = await useStorage.getString('JobTimer');
        const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

        const currentTime = moment().unix();
        const finalTime = timerData
          ? timerData.oldDuration +
            (currentTime - (timerData.startTime || currentTime))
          : parseInt(details.USED_TIME) || 0;

        const completedTimer = {
          isTimer: false,
          startTime: currentTime,
          oldDuration: finalTime,
          jobComplete: true,
        };

        await useStorage.set('JobTimer', JSON.stringify(completedTimer));

        setIsTimer(false);
        setPhotos(photos);
        setJobCloseModal(false);
        setDetails(prev => ({
          ...prev,
          REMARK: remarks,
          IS_JOB_COMPLETE: 1,
          USED_TIME: finalTime.toString(),
        }));

        setSuccessModal({visible: true, message: 'Job marked as complete'});
        setTimeout(() => {
          setSuccessModal({visible: false, message: ''});
          getPhotos();
        }, 1500);
      } catch (error) {
        console.error('Error completing job:', error);
        Alert.alert('Error completing job');
      }
    },
    [details, item.ID, getPhotos],
  );

  const pauseJob = useCallback(async () => {
    try {
      setLoader(prev => ({...prev, pauseJob: true}));
      setIsTimer(false);
      let payload = {
        JOB_DATA: [details],
        TECHNICIAN_ID: user?.ID,
        STATUS: 'PJ',
      };
      const response = await apiCall.post(
        'api/technician/updateJobStatus',
        payload,
      );
      if (response.data.code === 200) {
        const currentTime = moment().unix();
        const timerDataStr = await useStorage.getString('JobTimer');
        const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

        if (timerData) {
          const oldDuration = timerData.oldDuration || 0;
          const startTime = timerData.startTime || currentTime;
          const newDuration = oldDuration + (currentTime - startTime);
          const pausedTimer = {
            isTimer: false,
            startTime: currentTime,
            oldDuration: newDuration,
          };
          setDetails(prev => ({
            ...prev,
            TRACK_STATUS: 'PJ',
            USED_TIME: newDuration.toString(),
          }));
          await useStorage.set('JobTimer', JSON.stringify(pausedTimer));
        }
        setSuccessModal({visible: true, message: 'Job paused'});
        setTimeout(() => {
          setSuccessModal({visible: false, message: ''});
        }, 1500);
      } else {
        Alert.alert('Failed to pause job');
      }
    } catch (error) {
      console.error('Error in Job Pause:', error);
      Alert.alert('Error pausing job');
    } finally {
      setLoader(prev => ({...prev, pauseJob: false}));
    }
  }, [details, user?.ID]);

  const resumeJob = useCallback(async () => {
    try {
      setLoader(prev => ({...prev, resumeJob: true}));

      let payload = {
        JOB_DATA: [details],
        TECHNICIAN_ID: user?.ID,
        STATUS: 'RJ',
      };
      const response = await apiCall.post(
        'api/technician/updateJobStatus',
        payload,
      );

      if (response.data.code === 200) {
        const currentTime = moment().unix();
        const timerDataStr = await useStorage.getString('JobTimer');
        const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

        const oldDuration = timerData?.oldDuration || 0;

        const resumedTimer = {
          isTimer: true,
          startTime: currentTime,
          oldDuration: oldDuration,
        };

        await useStorage.set('JobTimer', JSON.stringify(resumedTimer));

        setDetails(prev => ({
          ...prev,
          TRACK_STATUS: 'SJ',
          USED_TIME: oldDuration.toString(),
        }));
        setIsTimer(true);
        setSuccessModal({visible: true, message: 'Job resumed'});
        setTimeout(() => {
          setSuccessModal({visible: false, message: ''});
        }, 1500);
      } else {
        Alert.alert('Failed to Resume job');
      }
    } catch (error) {
      console.error('Error in Job Resume:', error);
      Alert.alert('Error resuming job');
    } finally {
      setLoader(prev => ({...prev, resumeJob: false}));
    }
  }, [details, user?.ID]);

  const openJobClose = useCallback(() => {
    setJobCloseModal(true);
  }, []);
  const getPartList = useCallback(() => {
    try {
      apiCall
        .post('api/inventoryRequestDetails/get', {
          filter: ` AND CUSTOMER_ID = ${item.CUSTOMER_ID} AND JOB_CARD_ID = ${item.ID} `,
        })
        .then(res => {
          if (res.data.code == 200) {
            setPartList(res.data.data);
          }
        })
        .catch(err => {
          setPartList([]);
        });
    } catch (error) {
      console.warn('error..', error);
    }
  }, [item.CUSTOMER_ID, item.ID]);

  const getJobFeedback = useCallback(() => {
    try {
      apiCall
        .post(`api/techniciancustomerfeedback/get`, {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND JOB_CARD_ID = ${item.ID}  `,
        })
        .then(res => {
          if (res.status == 200 && res.data.code == 200) {
            setJobCardFeedback(res.data.data[0]);
          }
        });
    } catch (error) {}
  }, [user?.ID, item.ID]);

  const getRescheduleData = useCallback(() => {
    try {
      apiCall
        .post('api/jobRescheduleTransactions/get', {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND JOB_CARD_ID = ${item.ID} `,
        })
        .then(res => {
          if (res.status == 200 && res.data.data.length > 0) {
            setRescheduleRequestData(res.data.data[0]);
          }
        })
        .catch(() => {});
    } catch (error) {
      console.log('err..', error);
    }
  }, [user?.ID, item.ID]);

  const toggleSection = useCallback((section: keyof typeof expandCard) => {
    setExpandCard(prev => ({
      ...prev,
      [section]: !prev[section],
      showMenu: false,
    }));
  }, []);

  const handleImageViewClose = useCallback(() => {
    setExpandCard(prev => ({...prev, imageView: false}));
  }, []);

  const handleRescheduleClose = useCallback(() => {
    setExpandCard(prev => ({...prev, reschedule: false}));
  }, []);

  const handleRescheduleSubmit = useCallback(() => {
    getRescheduleData();
    setExpandCard(prev => ({...prev, reschedule: false}));
  }, [getRescheduleData]);
  useEffect(() => {
    getPartList();
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [getPartList, handleBackPress]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', handleFocus);
    const blurUnsubscribe = navigation.addListener('blur', handleBlur);
    return () => {
      unsubscribe();
      blurUnsubscribe();
    };
  }, [navigation, handleFocus, handleBlur]);

  useEffect(() => {
    getPhotos();
    item.TECHNICIAN_STATUS == 'CO' && getJobFeedback();
    item.TRACK_STATUS == 'RD' && getRescheduleData();
  }, [item, getPhotos, getJobFeedback, getRescheduleData]);

  useEffect(() => {
    const initializeTimer = async () => {
      try {
        const timerDataStr = await useStorage.getString('JobTimer');
        const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

        // If the timer data indicates the job is complete, update details and stop the timer.
        if (timerData?.jobComplete) {
          setIsTimer(false);
          setDetails(prev => ({
            ...prev,
            IS_JOB_COMPLETE: 1, // ensure this flag is set
            USED_TIME: timerData.oldDuration.toString(),
          }));
          return;
        }

        // Otherwise, if timerData exists, process normally.
        if (timerData) {
          const currentTime = moment().unix();
          let elapsedTime = timerData.oldDuration;

          if (timerData.isTimer) {
            elapsedTime += currentTime - timerData.startTime;
            const updatedTimer = {
              ...timerData,
              startTime: currentTime,
              oldDuration: elapsedTime,
            };
            await useStorage.set('JobTimer', JSON.stringify(updatedTimer));
            setIsTimer(true);
          } else {
            setIsTimer(false);
          }

          setDetails(prev => ({
            ...prev,
            USED_TIME: elapsedTime.toString(),
          }));
        } else {
          setIsTimer(false);
        }
      } catch (error) {
        console.error('Error initializing timer:', error);
      }
    };

    initializeTimer();
  }, []);

   useEffect(() => {
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        const { data1, data2, data3, data4, data5 }: any = remoteMessage.data;
  
        const parsedData4 = JSON.parse(data4);
        const jobCardNo = parsedData4[0].JOB_CARD_NO;
  
        if (data3 == 'JC' && jobCardNo == item.JOB_CARD_NO) {
          console.log("\n\n item job card no", item.JOB_CARD_NO);
          JobStopBgService();
          // @ts-ignore
          resetAndNavigate(navigation, 'Home', 'Dashboard');
          Toast("Job has been cancelled by admin");
        }
      });
    }, []);
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          // Check details or storage before proceeding.
          const timerDataStr = await useStorage.getString('JobTimer');
          const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;

          // If the job is complete, do nothing.
          if (timerData?.jobComplete) return;

          if (timerData && timerData.isTimer) {
            const currentTime = moment().unix();
            const elapsedTime =
              timerData.oldDuration + (currentTime - timerData.startTime);

            const pausedTimer = {
              isTimer: false,
              startTime: currentTime,
              oldDuration: elapsedTime,
            };

            await useStorage.set('JobTimer', JSON.stringify(pausedTimer));
          }
        } catch (error) {
          console.error('Error in cleanup:', error);
        }
      };

      cleanup();
    };
  }, [details.IS_JOB_COMPLETE]);

  return (
    <>
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
              isFromJobList
                ? navigation.goBack()
                : // @ts-ignore
                  resetAndNavigate(navigation, 'Home', 'Dashboard');
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

            <View
              style={{
                alignItems: 'flex-end',
                position: 'relative',
              }}>
              <TouchableOpacity
                onPress={() => {
                  setExpandCard(prev => ({
                    ...prev,
                    showMenu: !prev.showMenu,
                  }));
                }}>
                <Icon
                  name="dots-vertical"
                  type="MaterialCommunityIcons"
                  color="#1C1B1F"
                  size={22}
                />
              </TouchableOpacity>
              {expandCard.showMenu && (
                <>
                  <TouchableOpacity
                    activeOpacity={1}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: -1000,
                      right: -1000,
                      bottom: -1000,
                      zIndex: 99,
                    }}
                    onPress={() =>
                      setExpandCard(prev => ({...prev, showMenu: false}))
                    }
                  />
                  <View
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      zIndex: 100,
                    }}>
                    <ThreeDotMenu
                      isVisible={expandCard.showMenu}
                      isSupport={true}
                      isGuide={true}
                      supportOnPress={() => {
                        console.log('Support onPress');
                        setExpandCard(prev => ({...prev, showMenu: false}));
                        navigation.navigate('TechnicianBackOfficeChat', {
                          jobItem: item,
                        });
                      }}
                      guideOnPress={() => {
                        setExpandCard(prev => ({...prev, showMenu: false}));
                        navigation.navigate('GuideHome', {item: item});
                      }}
                      isPart={
                        details.TRACK_STATUS == 'SJ' &&
                        details.IS_JOB_COMPLETE !== 1
                          ? true
                          : false
                      }
                      partOnPress={() => {
                        setExpandCard(prev => ({...prev, showMenu: false}));
                        navigation.navigate('PartsCategories', {jobItem: item});
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{gap: 6}}>
              {/* Details card */}
              <AnimatedCard
                title="Details"
                isExpanded={expandCard.details}
                onToggle={() => toggleSection('details')}
                mainChildren={
                  <View style={{gap: 8, marginBottom: Size.sm}}>
                    <View style={styles.row}>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: '500',
                          color: colors.primaryText,
                          fontFamily: fontFamily,
                        }}>
                        {item.JOB_CARD_NO}
                      </Text>
                      <Text
                        style={[
                          {
                            fontSize: 13,
                            fontWeight: '500',
                            fontFamily: fontFamily,
                            color: '#0B0B0B',
                            textAlign: 'right',
                          },
                        ]}>
                        {moment(item.SCHEDULED_DATE_TIME).format('MMM D YY,') +
                          ' ' +
                          convertTo12HourFormat(item.START_TIME)}
                      </Text>
                    </View>
                    {/* estimate time */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <Icon name="access-time" type="MaterialIcons" size={18} />
                      <View style={styles.row}>
                        <Text
                          style={[
                            styles.estimateTimeLabel,
                            {color: colors.primaryText},
                          ]}>
                          {`${
                            item.CUSTOMER_TYPE == 'B' ? 'SLA' : 'Estimated time'
                          }: `}
                        </Text>
                        <Text
                          style={[
                            styles.estimateTimeValue,
                            {color: colors.primaryText},
                          ]}>
                          {item.ESTIMATED_TIME_IN_MIN} mins
                        </Text>
                      </View>
                    </View>
                    {/* payment mode */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <SVG.Earning stroke={'#636161'} width={19} height={19} />
                      <View style={styles.row}>
                        <Text style={[styles.estimateTimeLabel]}>
                          {'Payment mode: '}
                        </Text>
                        {item.CUSTOMER_TYPE == 'I' && (
                          <Text style={[styles.estimateTimeValue]}>
                            {item.PAYMENT_MODE == 'COD'
                              ? 'Cash on delivery'
                              : 'Online'}
                          </Text>
                        )}

                        {item.CUSTOMER_TYPE == 'B' && (
                          <Text style={[styles.estimateTimeValue]}>NA</Text>
                        )}
                      </View>
                    </View>
                    {details.TRACK_STATUS == 'SJ' ||
                    details.TRACK_STATUS == 'PJ' ||
                    details.TRACK_STATUS == 'EJ' ||
                    rescheduleRequestData?.STATUS == 'P' ||
                    rescheduleRequestData?.STATUS == 'R' ? (
                      <View>
                        {details.TRACK_STATUS == 'SJ' ||
                        details.TRACK_STATUS == 'PJ' ||
                        details.TRACK_STATUS == 'EJ' ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              height: 43,
                              borderColor: '#636363',
                              borderWidth: 1,
                              borderRadius: 8,
                              width: '100%',
                              marginVertical: Size.sm,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                padding: 8,
                              }}>
                              <Icon
                                name="clock"
                                type="Feather"
                                size={18}
                                color={colors.secondary}
                                style={{marginTop: 2}}
                              />
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '600',
                                  color: colors.secondary,
                                  fontFamily: fontFamily,
                                }}>
                                {details.TECHNICIAN_STATUS == 'CO'
                                  ? 'Job completed'
                                  : details.TRACK_STATUS == 'SJ'
                                  ? 'Job started'
                                  : details.TRACK_STATUS == 'PJ'
                                  ? 'Job paused'
                                  : details.TRACK_STATUS == 'EJ'
                                  ? 'Job completed'
                                  : 'Job started'}
                              </Text>
                            </View>
                            <View
                              style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.secondary,
                                borderTopRightRadius: 8,
                                borderBottomRightRadius: 8,
                                height: '100%',
                                minWidth: 67,
                                margin: -1,
                              }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '500',
                                  color: '#FFFFFF',
                                  fontFamily: fontFamily,
                                  paddingHorizontal: 6,
                                }}>
                                <StopWatch
                                  initialTime={parseInt(details.USED_TIME) || 0}
                                  isRunning={isTimer}
                                  onTick={(time: number) =>
                                    setDetails({
                                      ...details,
                                      USED_TIME: time.toString(),
                                    })
                                  }

                                  // onTick={(time: number) =>
                                  //   setDetails(prev => ({
                                  //     ...prev,
                                  //     USED_TIME: time.toString(),
                                  //   }))
                                  // }
                                />
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View
                            style={{
                              borderColor: '#636363',
                              borderWidth: 1,
                              borderRadius: 8,
                              width: '100%',
                              marginVertical: Size.sm,
                              padding: 8,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }}>
                              <Icon
                                name="clock"
                                type="Feather"
                                size={18}
                                color={colors.secondary}
                                style={{marginTop: 2}}
                              />
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '600',
                                  color: colors.secondary,
                                  fontFamily: fontFamily,
                                }}>
                                {rescheduleRequestData.STATUS == 'P'
                                  ? 'Requested to reschedule'
                                  : 'Reschedule request rejected'}
                              </Text>
                            </View>
                            {rescheduleRequestData.STATUS == 'R' &&
                              rescheduleRequestData.REMARK && (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '400',
                                    color: colors.heading,
                                    fontFamily: fontFamily,
                                  }}>
                                  {rescheduleRequestData.REMARK}
                                </Text>
                              )}
                          </View>
                        )}
                      </View>
                    ) : null}

                    {partList[0]?.STATUS && (
                      <View style={[styles.row, {marginBottom: -5}]}>
                        <Text style={[styles.label, {color: '#666666'}]}>
                          Part Name
                        </Text>
                        <Text
                          style={[
                            styles.value,
                            {color: '#666666'},
                          ]}>{`Status`}</Text>
                      </View>
                    )}
                    {partList.map((item: any, index) => {
                      return (
                        <View key={item.ID}>
                          <View
                            key={item.ID}
                            style={[styles.row, {marginBottom: -5}]}>
                            <Text style={[styles.label, {color: '#333333'}]}>
                              {`${item.INVENTORY_NAME} ${
                                item.VARIANT_NAME
                                  ? '(' + item.VARIANT_NAME + ')'
                                  : ''
                              }`}
                            </Text>
                            <Text
                              style={[
                                styles.label,
                                {fontSize: 13, textAlign: 'right'},
                              ]}>{`${
                              item.STATUS == 'P'
                                ? 'Sent for approval'
                                : details.IS_JOB_COMPLETE == 0
                                ? 'Payment pending'
                                : item?.STATUS == 'AC' || item?.STATUS == 'AP'
                                ? item.IS_RETURNED == 1
                                  ? 'Returned'
                                  : 'Approved'
                                : 'Rejected'
                            }`}</Text>
                          </View>
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: colors.description,
                              height: 0.5,
                              marginBottom: 8,
                              marginTop: 16,
                            }}></View>
                        </View>
                      );
                    })}
                  </View>
                }>
                <View>
                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>{'Brand: '}</Text>
                    <Text style={styles.jobDetailValue}>
                      {item.BRAND_NAME ? item.BRAND_NAME : '-'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>{'Model: '}</Text>
                    <Text style={styles.jobDetailValue}>
                      {item.MODEL_NUMBER ? item.MODEL_NUMBER : '-'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>{'Description: '}</Text>
                    <Text style={styles.jobDetailValue}>
                      {item.DESCRIPTION ? item.DESCRIPTION : '-'}
                    </Text>
                  </View>

                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>
                      {'Special Instructions: '}
                    </Text>
                    <Text style={styles.jobDetailValue}>
                      {item.SPECIAL_INSTRUCTIONS
                        ? item.SPECIAL_INSTRUCTIONS
                        : '-'}
                    </Text>
                  </View>

                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>
                      {'Job Description: '}
                    </Text>
                    <Text style={styles.jobDetailValue}>
                      {item.TASK_DESCRIPTION ? item.TASK_DESCRIPTION : '-'}
                    </Text>
                  </View>
                  <View style={styles.jobDetailContainer}>
                    <Text style={styles.jobDetailLabel}>{'Photo/s: '}</Text>
                    {item.PHOTO_FILE ? (
                      <View style={{marginTop: Size.sm}}>
                        <TouchableOpacity
                          onPress={() =>
                            setExpandCard({...expandCard, imageView: true})
                          }>
                          <Image
                            source={
                              item.PHOTO_FILE
                                ? {
                                    uri: `${BASE_URL}static/CartItemPhoto/${item.PHOTO_FILE}`,
                                  }
                                : _defaultImage
                            }
                            style={{
                              width: '100%',
                              height: 120,
                              borderRadius: 8,
                            }}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.jobDetailValue}>
                        {'Not uploaded'}
                      </Text>
                    )}
                  </View>
                </View>
              </AnimatedCard>

              {item.TECHNICIAN_STATUS == 'CO' &&
                (jobCardFeedback?.ID ? (
                  <View style={[styles.card, {gap: Size.md}]}>
                    <Text
                      style={[
                        styles.detailsTitleTxt,
                        {color: colors.primaryText},
                      ]}>
                      {'Customer Rating'}
                    </Text>
                    <View style={{gap: 10, marginTop: 5}}>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>{'Rating'}:</Text>
                        <StarRating
                          rating={jobCardFeedback.RATING}
                          onChange={(e: any) => {}}
                          starSize={30}
                          enableHalfStar={false}
                          starStyle={{marginHorizontal: -0.5}}
                        />
                      </View>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>{'Comment'}:</Text>
                        <View style={{flex: 2}}>
                          <Text
                            numberOfLines={
                              expandCard.showFullComment ? undefined : 2
                            }
                            style={[
                              styles.value,
                              {
                                fontSize: 13,
                                textAlign: 'left',
                                color: '#666666',
                              },
                            ]}>
                            {jobCardFeedback.COMMENTS}
                          </Text>
                          {jobCardFeedback.COMMENTS?.length > 80 && (
                            <TouchableOpacity
                              onPress={() => {
                                setExpandCard(prev => ({
                                  ...prev,
                                  showFullComment: !prev.showFullComment,
                                }));
                              }}
                              style={{alignSelf: 'flex-end'}}>
                              <Text
                                style={{
                                  color: colors.primary2,
                                  fontSize: 13,
                                  fontFamily: fontFamily,
                                  fontWeight: '500',
                                }}>
                                {expandCard.showFullComment
                                  ? 'Read less'
                                  : 'Read more'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <RateCustomer
                      jobDetails={item}
                      onSuccess={() => {
                        getJobFeedback();
                      }}
                    />
                  </View>
                ))}
              {photos.length > 0 && (
                <View
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#CBCBCB',
                    borderRadius: 8,
                    backgroundColor: '#FDFDFD',
                    gap: 8,
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '700',
                      letterSpacing: 0.6,
                      color: colors.primaryText,
                    }}>
                    Job Completed remark/photos
                  </Text>
                  <View>
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 14,
                        fontWeight: '700',
                        letterSpacing: 0.6,
                        color: colors.subHeading,
                      }}>
                      Product's Photos
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{flexDirection: 'row'}}>
                      {photos.map((item, index) => (
                        <View
                          key={index}
                          style={{marginRight: 9, marginTop: 2}}>
                          <Image
                            source={
                              item
                                ? {
                                    uri:
                                      IMAGE_URL +
                                      'JobPhotos/' +
                                      item.PHOTOS_URL,
                                  }
                                : _defaultImage
                            }
                            style={{width: 80, height: 80, borderRadius: 8}}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                  {photos[0]?.REMARK && (
                    <View style={{marginTop: 5}}>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 14,
                          fontWeight: '600',
                          letterSpacing: 0.6,
                          color: colors.subHeading,
                        }}>
                        Remark
                      </Text>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 14,
                          fontWeight: '500',
                          letterSpacing: 0.6,
                          color: colors.text,
                        }}>
                        {photos[0]?.REMARK}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {/* Customer Details */}
              {item.STATUS != 'CO' && (
                <AnimatedCard
                  title="Customer details"
                  isExpanded={expandCard.customer}
                  onToggle={() => toggleSection('customer')}
                  icon={<Icon name="user" type="Feather" size={20} />}>
                  <View>
                    {/* Phone Section */}
                    <View style={styles.phoneSection}>
                      <View style={styles.phoneIcon}>
                        <Icon name="call-outline" type="Ionicons" size={18} />
                      </View>
                      <View style={styles.contactRow}>
                        <Text style={styles.nameText}>
                          {item.CUSTOMER_NAME}
                        </Text>
                        <Text style={styles.separator}>|</Text>
                        <Text
                          onPress={() => {
                            const phoneNumber = item.CUSTOMER_MOBILE_NUMBER;
                            Linking.openURL(`tel:${phoneNumber}`);
                          }}
                          style={[styles.phoneText, {color: colors.primary2}]}>
                          {item.CUSTOMER_MOBILE_NUMBER}
                        </Text>
                      </View>
                    </View>

                    {item.STATUS != 'CO' && (
                      <Button
                        label="Send a message"
                        onPress={() => {
                          navigation.navigate('ChatScreen', {
                            jobItem: item,
                          });
                        }}
                        style={{marginVertical: 10}}
                        primary={false}
                      />
                    )}
                    {/* Address Section */}
                    <View style={styles.phoneSection}>
                      <View style={styles.phoneIcon}>
                        <Icon name="home" type="SimpleLineIcons" size={18} />
                      </View>
                      <View style={styles.contactRow}>
                        <Text style={[styles.nameText, {flex: 1}]}>
                          {item.SERVICE_ADDRESS}
                        </Text>
                        {details.TRACK_STATUS != 'ST' &&
                          !expandCard.showMap && (
                            <TouchableOpacity
                              style={styles.locationIconButton}
                              activeOpacity={0.7}
                              onPress={() => {
                                setExpandCard({...expandCard, showMap: true});
                              }}>
                              <Icon
                                name="location-pin"
                                type="SimpleLineIcons"
                                size={18}
                                color={colors.primary2}
                              />
                            </TouchableOpacity>
                          )}
                      </View>
                    </View>

                    {expandCard.showMap && (
                      <View>
                        <MapView
                          ref={mapRef}
                          provider={PROVIDER_GOOGLE}
                          style={{
                            marginTop: 12,
                            height: 280,
                            width: '100%',
                            borderRadius: Size.radius,
                          }}
                          initialRegion={region}
                          onMapReady={() => {
                            mapRef.current?.fitToCoordinates(
                              [
                                {
                                  latitude: region.latitude,
                                  longitude: region.longitude,
                                },
                                {
                                  latitude: Number(item.LOCATION_LATITUDE),
                                  longitude: Number(item.LOCATION_LONG),
                                },
                              ],
                              {
                                edgePadding: {
                                  top: 50,
                                  right: 50,
                                  bottom: 50,
                                  left: 50,
                                },
                                animated: true,
                              },
                            );
                          }}>
                          <Marker
                            coordinate={{
                              latitude: region.latitude,
                              longitude: region.longitude,
                            }}>
                            <View>
                              <Image
                                source={_technicianMap}
                                style={{
                                  width: 40,
                                  height: 40,
                                  // backgroundColor:'red'
                                }}
                              />
                            </View>
                          </Marker>

                          <Marker
                            coordinate={{
                              latitude: Number(item.LOCATION_LATITUDE),
                              longitude: Number(item.LOCATION_LONG),
                            }}></Marker>

                          <Polyline
                            coordinates={routeCoordinates}
                            strokeColor={colors.primary}
                            strokeWidth={3}
                          />
                          {/* <MapViewRoute
                          origin={{
                            latitude: region.latitude,
                            longitude: region.longitude,
                          }}
                          destination={{
                            latitude: Number(item.LOCATION_LATITUDE),
                            longitude: Number(item.LOCATION_LONG),
                          }}
                          apiKey={GOOGLE_MAP_API_KEY}
                          strokeWidth={2}
                          strokeColor={colors.primary}
                        /> */}
                        </MapView>

                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            backgroundColor: 'white',
                            padding: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#b094f550',
                            elevation: 3,
                            shadowColor: '#b094f550',
                            shadowOffset: {width: 0, height: 2},
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 6,
                            alignItems: 'center',
                          }}
                          activeOpacity={0.7}
                          onPress={() => {
                            setExpandCard({...expandCard, showMap: false});
                          }}>
                          <Icon
                            name="location-pin"
                            type="SimpleLineIcons"
                            size={18}
                            color="#092B9C"
                            style={{marginRight: 1}}
                          />
                          <Text style={styles.mapButtonText}>Exit map</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </AnimatedCard>
              )}

              {/* Payment summary */}
              {item.CUSTOMER_TYPE == 'I' && (
                <AnimatedCard
                  title="Payment details"
                  isExpanded={expandCard.payment}
                  onToggle={() => toggleSection('payment')}
                  icon={
                    <Icon
                      name="currency-rupee"
                      type="MaterialIcons"
                      size={20}
                    />
                  }>
                  <View style={{gap: 10, marginTop: 15}}>
                    <View style={styles.row}>
                      <Text style={[styles.label]}>Base price</Text>
                      <Text style={[styles.value]}>
                        {`₹ ${parseFloat(
                          item?.SERVICE_BASE_PRICE || '0',
                        ).toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                        })}`}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.label]}>Tax({item.TAX_RATE}%)</Text>
                      <Text style={[styles.value]}>{`₹ ${parseFloat(
                        item?.TAX_AMOUNT || '0',
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.label]}>Express charges</Text>
                      <Text style={[styles.value]}>{`₹ ${parseFloat(
                        item?.EXPRESS_DELIVERY_CHARGES || '0',
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.label]}>Discount</Text>
                      <Text style={[styles.value]}>{`₹ ${parseFloat(
                        item?.COUPON_AMOUNT || '0',
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.label]}>Total</Text>
                      <Text style={[styles.value]}>
                        {`₹ ${parseFloat(
                          item?.FINAL_ITEM_AMOUNT || '0',
                        ).toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                        })}`}
                      </Text>
                    </View>
                  </View>
                </AnimatedCard>
              )}
            </View>
          </ScrollView>
          {item.TECHNICIAN_STATUS != 'CO' && (
            <View style={{gap: 12, marginTop: 15, marginBottom: 5}}>
              {details.TRACK_STATUS === 'SJ' && details.IS_JOB_COMPLETE == 1 ? (
                <Button
                  label={
                    item.CUSTOMER_TYPE == 'B'
                      ? 'Send Happy Code'
                      : details.IS_INVOICE_GENERATED == 1
                      ? 'View invoice'
                      : 'Generate invoice'
                  }
                  onPress={() => {
                    if (item.CUSTOMER_TYPE == 'B') {
                      setDetails({...details, IS_INVOICE_GENERATED: 1});
                      navigation.navigate('B2bCustomerInvoice', {
                        item,
                        partList: partList,
                        IS_INVOICE_GENERATED: details.IS_INVOICE_GENERATED,
                      });
                    } else if (details.IS_INVOICE_GENERATED == 1) {
                      navigation.navigate('ViewInvoice', {
                        item,
                        partList: partList,
                      });
                    } else {
                      setDetails({...details, IS_INVOICE_GENERATED: 1});
                      navigation.navigate('GenerateInvoice', {
                        item,
                        partList: partList,
                      });
                    }
                  }}
                  loading={false}
                />
              ) : (
                <>
                  <Button
                    label={
                      details.TRACK_STATUS === 'SJ' ||
                      details.TRACK_STATUS === 'PJ'
                        ? 'Job complete'
                        : 'Start job'
                    }
                    onPress={() => {
                      if (rescheduleRequestData?.STATUS == 'P') {
                        Toast(
                          'Job rescheduled, please wait for approval/rejection',
                        );
                      } else if (details.TRACK_STATUS == 'PJ') {
                        Toast('Job paused, please resume to action on job');
                      } else {
                        const pendingPart = partList.find(
                          item => item.STATUS == 'P',
                        );
                        if (pendingPart) {
                          Toast(
                            'Job is pending for part request action, please wait...',
                          );
                        } else if (
                          details.TRACK_STATUS === 'SJ' ||
                          details.TRACK_STATUS === 'PJ'
                        ) {
                          openJobClose();
                        } else {
                          startJob();
                        }
                      }
                    }}
                    loading={loader.startJob}
                  />
                  {rescheduleRequestData?.STATUS !== 'P' && (
                    <Button
                      label={
                        details.TRACK_STATUS == 'PJ'
                          ? 'Resume job'
                          : details.TRACK_STATUS == 'SJ'
                          ? 'Pause job'
                          : 'Request to schedule'
                      }
                      onPress={
                        details.TRACK_STATUS == 'PJ'
                          ? resumeJob
                          : details.TRACK_STATUS == 'SJ'
                          ? pauseJob
                          : () => {
                              setExpandCard({...expandCard, reschedule: true});
                            }
                      }
                      loading={loader.pauseJob || loader.resumeJob}
                      primary={false}
                    />
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
      />
      <JobClose
        item={details}
        visible={jobCloseModal}
        onClose={() => setJobCloseModal(false)}
        onSubmit={completeJob}
      />
      <RescheduleRequest
        visible={expandCard.reschedule}
        jobItem={item}
        onClose={handleRescheduleClose}
        onSubmit={handleRescheduleSubmit}
      />
      {expandCard.imageView && (
        <ImageView
          images={[{uri: `${BASE_URL}static/CartItemPhoto/${item.PHOTO_FILE}`}]}
          imageIndex={0}
          visible={expandCard.imageView}
          presentationStyle="overFullScreen"
          onRequestClose={handleImageViewClose}
        />
      )}
    </>
  );
};

export default JobFlow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Size.containerPadding,
    gap: 12,
  },
  card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
  },
  headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
  },
  estimateTimeLabel: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  estimateTimeValue: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  jobDetailContainer: {marginVertical: Size.base},
  jobDetailLabel: {
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'left',
    color: '#666666',
    letterSpacing: 0.2,
  },
  jobDetailValue: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
    letterSpacing: 0.2,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
    color: '#333333',
    letterSpacing: 0.2,
  },
  value: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'right',
    color: '#000000',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f6f8fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#092B9C',
  },
  mapButtonText: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#092B9C',
    letterSpacing: 0.2,
  },
  detailsTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 700,
    color: '#092B9C',
    letterSpacing: 0.6,
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: '#fff',
    paddingTop: 5,
    borderRadius: 8,
  },
  phoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: fontFamily,
    flexShrink: 1,
  },
  separator: {
    fontSize: 14,
    color: '#666666',
    fontFamily: fontFamily,
  },
  phoneButton: {
    padding: 5,
  },
  phoneText: {
    fontSize: 14,
    fontFamily: fontFamily,
    fontWeight: '600',
  },
  locationIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
