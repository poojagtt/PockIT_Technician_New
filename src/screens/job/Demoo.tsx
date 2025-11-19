import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
    Alert,
    ToastAndroid,
    BackHandler,
    Linking,
  } from 'react-native';
  import React, {useEffect, useRef, useState} from 'react';
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
  import {_defaultImage, _noData, SVG} from '../../assets';
  import AnimatedCard from '../../components/AnimatedCard';
  import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
  import Button from '../../components/Button';
  import SuccessModal from '../../components/SuccessModal';
  import JobClose from './JobClose';
  import moment from 'moment';
  import RescheduleRequest from './RescheduleRequest';
  import Geolocation from 'react-native-geolocation-service';
  import {useSelector} from '../../context';
  import ImageView from 'react-native-image-viewing';
  import {resetAndNavigate} from '../../utils';
  import {useFocusEffect} from '@react-navigation/native';
  import RateCustomer from './Components/RateCustomer';
  import StarRating from 'react-native-star-rating-widget';
  import {convertTo12HourFormat} from '../../Functions';
  import {GOOGLE_MAP_API_KEY} from '../../modules/services';
  import {MapViewRoute} from 'react-native-maps-routes';
import Toast from '../../components/Toast';
  
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
    const mapRef: any = useRef();
    const [region, setRegion] = useState({
      latitude: 16.8524,
      longitude: 74.5815,
      latitudeDelta: 2.5,
      longitudeDelta: 2.5,
      loading: true,
    });
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
    useFocusEffect(
      React.useCallback(() => {
        getPartList();
        const backAction = () => {
          isFromJobList
            ? navigation.goBack()
            : // @ts-ignore
              resetAndNavigate(navigation, 'Home', 'Dashboard');
          return true;
        };
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction,
        );
        return () => backHandler.remove();
      }, [navigation]),
    );
    useEffect(() => {
      getCurrentLocation();
    }, []);
    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
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
      });
      return unsubscribe;
    }, [navigation]);
    const getCurrentLocation = async () => {
      try {
        const Permission = await Permissions.checkLocation();
        if (!Permission) {
          await Permissions.requestLocation();
        } else {
          Geolocation.getCurrentPosition(
            async location => {
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
            },
            error => {
              console.warn('Geolocation error:', error);
              setTimeout(getCurrentLocation, 2000);
            },
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
    };
    useEffect(() => {
      getPhotos();
      item.TECHNICIAN_STATUS == 'CO' && getJobFeedback();
      item.TRACK_STATUS == 'RD' && getRescheduleData();
    }, [item]);
    const toggleSection = (section: keyof typeof expandCard) => {
      setExpandCard(prev => ({
        ...prev,
        [section]: !prev[section],
        showMenu: false,
      }));
    };
    useEffect(() => {
      const initializeTimer = async () => {
        try {
          const timerDataStr = await useStorage.getString('JobTimer');
          const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;
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
            }
            setDetails(prev => ({
              ...prev,
              USED_TIME: elapsedTime.toString(),
            }));
          }
        } catch (error) {
          console.error('Error initializing timer:', error);
        }
      };
      initializeTimer();
    }, []);
    useEffect(() => {
      return () => {
        const cleanup = async () => {
          try {
            if (details.IS_JOB_COMPLETE === 1 || details.TRACK_STATUS === 'PJ') {
              const timerDataStr = await useStorage.getString('JobTimer');
              const timerData = timerDataStr ? JSON.parse(timerDataStr) : null;
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
              } else {
                await useStorage.delete('JobTimer');
              }
              setIsTimer(false);
            }
          } catch (error) {
            console.error('Error in cleanup:', error);
          }
        };
        cleanup();
      };
    }, []);
    const startJob = async () => {
      try {
        setLoader({...loader, startJob: true});
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
          setSuccessModal({visible: true, message: 'Job started'});
          const updatedDetails = {
            ...details,
            TRACK_STATUS: 'SJ',
            USED_TIME: '0',
            ORDER_STATUS_NAME: 'Start job',
          };
          setDetails(updatedDetails);
          setTimeout(() => {
            setSuccessModal({visible: false, message: ''});
          }, 1500);
        } else {
          Alert.alert('Failed to Start job');
        }
      } catch (error) {
        console.error('Error in Job Start:', error);
        Alert.alert('Error starting job');
      } finally {
        setLoader({...loader, startJob: false});
      }
    };
    const pauseJob = async () => {
      try {
        setLoader({...loader, pauseJob: true});
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
          const oldDuration = timerData?.oldDuration || 0;
          const startTime = timerData?.startTime || currentTime;
          const newDuration = oldDuration + (currentTime - startTime);
          const timer = {
            isTimer: false,
            startTime: currentTime,
            oldDuration: newDuration,
          };
          await useStorage.set('JobTimer', JSON.stringify(timer));
          setIsTimer(false);
          setSuccessModal({visible: true, message: 'Job paused'});
          setDetails(prev => ({
            ...prev,
            TRACK_STATUS: 'PJ',
            USED_TIME: newDuration.toString(),
          }));
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
        setLoader({...loader, pauseJob: false});
      }
    };
    const resumeJob = async () => {
      try {
        setLoader({...loader, resumeJob: true});
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
          const timer = {
            isTimer: true,
            startTime: currentTime,
            oldDuration: timerData?.oldDuration || 0,
          };
          await useStorage.set('JobTimer', JSON.stringify(timer));
          setIsTimer(true);
          setSuccessModal({visible: true, message: 'Job resumed'});
          const updatedDetails = {
            ...details,
            TRACK_STATUS: 'SJ',
          };
          setDetails(updatedDetails);
          setTimeout(() => {
            setSuccessModal({visible: false, message: ''});
          }, 1500);
        } else {
          Alert.alert('Failed to Resume job');
        }
      } catch (error) {
        console.error('Error in Job Resume:', error);
        Alert.alert('Error Resume job');
      } finally {
        setLoader({...loader, resumeJob: false});
      }
    };
    const completeJob = (remarks: any, photos: any) => {
      setIsTimer(false);
      setPhotos(photos);
      setJobCloseModal(false);
      setDetails({
        ...details,
        REMARK: remarks,
        IS_JOB_COMPLETE: 1,
      });
      setSuccessModal({visible: true, message: 'Job marked as complete'});
      setTimeout(() => {
        setSuccessModal({visible: false, message: ''});
        getPhotos();
      }, 1500);
    };
    const openJobClose = () => {
      setJobCloseModal(true);
    };
    const getPhotos = async () => {
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
        setLoader({...loader, getPhotos: false});
      }
    };
    const getPartList = () => {
      try {
        apiCall
          .post('api/inventoryRequestDetails/get', {
            filter: ` AND CUSTOMER_ID = ${item.CUSTOMER_ID} AND JOB_CARD_ID = ${item.ID} `,
          })
          .then(res => {
            if (res.data.code == 200) {
              setDetails(prev => ({
                ...prev,
                TRACK_STATUS: 'SJ',
              }));
              setPartList(res.data.data);
            }
          })
          .catch(err => {
            setPartList([]);
          });
      } catch (error) {
        console.warn('error..', error);
      }
    };
    const getJobFeedback = () => {
      try {
        apiCall
          .post(`api/techniciancustomerfeedback/get`, {
            filter: ` AND TECHNICIAN_ID = ${user?.ID} AND JOB_CARD_ID = ${item.ID}  `,
          })
          .then(res => {
            console.log('res', res.data);
            if (res.status == 200 && res.data.code == 200) {
              setJobCardFeedback(res.data.data[0]);
            }
          });
      } catch (error) {}
    };
    const getRescheduleData = () => {
      try {
        apiCall
          .post('api/jobRescheduleTransactions/get', {
            filter: ` AND TECHNICIAN_ID = ${user?.ID} AND JOB_CARD_ID = ${item.ID} `,
          })
          .then(res => {
            if (res.status == 200 && res.data.data.length > 0) {
              // console.log('reschedule res....', res.data.data[0]);
              setRescheduleRequestData(res.data.data[0]);
            }
          })
          .catch(() => {});
      } catch (error) {
        console.log('err..', error);
      }
    };
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
                <Icon
                  name="dots-vertical"
                  type="MaterialCommunityIcons"
                  color="#1C1B1F"
                  size={22}
                  onPress={() => {
                    setExpandCard({
                      ...expandCard,
                      showMenu: !expandCard.showMenu,
                    });
                  }}
                />
                <View
                  style={{position: 'absolute', right: 0, top: 0, zIndex: 100}}>
                  {expandCard.showMenu && (
                    <ThreeDotMenu
                      isVisible={expandCard.showMenu}
                      isSupport={true}
                      isGuide={true}
                      supportOnPress={() =>
                        navigation.navigate('TechnicianBackOfficeChat', {
                          jobItem: item,
                        })
                      }
                      guideOnPress={() => {
                        navigation.navigate('GuideHome', {item: item});
                      }}
                      isPart={
                        details.TRACK_STATUS == 'SJ' &&
                        details.IS_JOB_COMPLETE !== 1
                          ? true
                          : false
                      }
                      partOnPress={() => {
                        navigation.navigate('PartsCategories', {jobItem: item});
                      }}
                    />
                  )}
                </View>
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
                        <Text style={[styles.label, {color: '#0B0B0B'}]}>
                          {convertTo12HourFormat(item.START_TIME)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '500',
                            color: colors.primaryText,
                            fontFamily: fontFamily,
                          }}>
                          {item.JOB_CARD_NO}
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
                          <Text style={[styles.estimateTimeValue]}>
                            {item.PAYMENT_MODE == 'COD'
                              ? 'Cash on delivery'
                              : 'Online'}
                          </Text>
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
                            Part Name:
                          </Text>
                          <Text
                            style={[
                              styles.value,
                              {color: '#666666'},
                            ]}>{`Status`}</Text>
                        </View>
                      )}
                      {partList.map((item, index) => {
                        return (
                          <View
                            key={item.ID}
                            style={[styles.row, {marginBottom: -5}]}>
                            <Text style={[styles.label, {color: '#333333'}]}>
                              {item.INVENTORY_NAME}
                            </Text>
                            <Text
                              style={[
                                styles.label,
                                {fontSize: 13, textAlign: 'right'},
                              ]}>{`${
                              item.STATUS == 'P'
                                ? 'Send for approval'
                                : details.IS_JOB_COMPLETE == 0
                                ? 'Payment pending'
                                : item?.STATUS == 'AC' || item?.STATUS == 'AP'
                                ? 'Approved'
                                : 'Rejected'
                            }`}</Text>
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
                        fontFamily: 'SF Pro Text',
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
                          fontFamily: 'SF Pro Text',
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
                            fontFamily: 'SF Pro Text',
                            fontSize: 14,
                            fontWeight: '600',
                            letterSpacing: 0.6,
                            color: colors.subHeading,
                          }}>
                          Remark
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'SF Pro Text',
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
                        <Text style={styles.nameText}>{item.CUSTOMER_NAME}</Text>
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
                    {/* Address Section */}
                    <View style={styles.phoneSection}>
                      <View style={styles.phoneIcon}>
                        <Icon name="home" type="SimpleLineIcons" size={18} />
                      </View>
                      <View style={styles.contactRow}>
                        <Text style={[styles.nameText, {flex: 1}]}>
                          {item.SERVICE_ADDRESS}
                        </Text>
                        {details.TRACK_STATUS != 'ST' && !expandCard.showMap && (
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
  
                    {expandCard.showMap && !region.loading && (
                      <View>
                        <MapView
                          ref={mapRef}
                          provider={PROVIDER_GOOGLE}
                          style={{
                            height: 280,
                            width: '100%',
                            // borderRadius: Size.radius,
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
                            }}
                          />
                          <Marker
                            coordinate={{
                              latitude: Number(item.LOCATION_LATITUDE),
                              longitude: Number(item.LOCATION_LONG),
                            }}
                          />
                          <MapViewRoute
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
                          />
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
                          {`₹ ${item?.SERVICE_BASE_PRICE}`}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>Tax({item.TAX_RATE}%)</Text>
                        <Text style={[styles.value]}>{`₹ ${
                          item?.TAX_AMOUNT ?? 0
                        }`}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>Express</Text>
                        <Text style={[styles.value]}>{`₹ ${
                          item?.EXPRESS_DELIVERY_CHARGES ?? 0
                        }`}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>Discount</Text>
                        <Text style={[styles.value]}>{`₹ ${
                          item?.COUPON_AMOUNT ?? 0
                        }`}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={[styles.label]}>Total</Text>
                        <Text style={[styles.value]}>
                          {`₹ ${item.TOTAL_AMOUNT ?? 0}`}
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>
                )}
              </View>
            </ScrollView>
            {item.TECHNICIAN_STATUS != 'CO' && (
              <View style={{gap: 12, marginTop: 15, marginBottom: 5}}>
                {details.IS_JOB_COMPLETE == 1 ? (
                  <Button
                    label={'Generate invoice'}
                    onPress={() => {
                      navigation.navigate('GenerateInvoice', {item});
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
                           Toast('Job rescheduled, please wait for approval/rejection');
                         
                        } else if (details.TRACK_STATUS == 'PJ') {
                           Toast('Job paused, please resume to action on job');
                         
                          
                        } else {
                          const pendingPart = partList.find(
                            item => item.STATUS == 'P',
                          );
                          if (pendingPart) {
                            Toast('Job is pending for part request action, please wait...');
                           
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
          onSubmit={(remarks, photos) => {
            completeJob(remarks, photos);
          }}
        />
        <RescheduleRequest
          visible={expandCard.reschedule}
          jobItem={item}
          onClose={() => setExpandCard({...expandCard, reschedule: false})}
          onSubmit={() => {
            console.log('reason');
            getRescheduleData();
            setExpandCard({...expandCard, reschedule: false});
          }}
        />
        {expandCard.imageView && (
          <ImageView
            images={[{uri: `${BASE_URL}static/CartItemPhoto/${item.PHOTO_FILE}`}]}
            imageIndex={0}
            visible={expandCard.imageView}
            presentationStyle="overFullScreen"
            onRequestClose={() => {
              setExpandCard({...expandCard, imageView: false});
            }}
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
      fontFamily: 'SF Pro Text',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 30,
      textAlign: 'left',
      letterSpacing: 0.6,
    },
    estimateTimeLabel: {
      fontFamily: 'SF Pro Text',
      fontSize: 15,
      fontWeight: '400',
      textAlign: 'left',
      letterSpacing: 0.2,
    },
    estimateTimeValue: {
      fontFamily: 'SF Pro Text',
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    jobDetailContainer: {marginVertical: Size.base},
    jobDetailLabel: {
      fontFamily: 'SF Pro Text',
      fontSize: 12,
      fontWeight: 500,
      textAlign: 'left',
      color: '#666666',
      letterSpacing: 0.2,
    },
    jobDetailValue: {
      fontFamily: 'SF Pro Text',
      fontSize: 15,
      fontWeight: 600,
      color: '#333333',
      letterSpacing: 0.2,
    },
    label: {
      flex: 1,
      fontFamily: 'SF Pro Text',
      fontSize: 15,
      fontWeight: 500,
      textAlign: 'left',
      color: '#333333',
      letterSpacing: 0.2,
    },
    value: {
      flex: 1,
      fontFamily: 'SF Pro Text',
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
      fontFamily: 'SF Pro Text',
      fontSize: 14,
      fontWeight: '600',
      color: '#092B9C',
      letterSpacing: 0.2,
    },
    detailsTitleTxt: {
      fontFamily: 'SF Pro Text',
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
      fontFamily: 'SF Pro Text',
      flexShrink: 1,
    },
    separator: {
      fontSize: 14,
      color: '#666666',
      fontFamily: 'SF Pro Text',
    },
    phoneText: {
      fontSize: 14,
      fontFamily: 'SF Pro Text',
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