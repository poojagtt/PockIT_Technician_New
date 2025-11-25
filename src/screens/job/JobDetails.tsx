import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  BackHandler,
  Linking,
  ToastAndroid,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  apiCall,
  BASE_URL,
  fontFamily,
  Permissions,
  Size,
  useStorage,
  useTheme,
} from '../../modules';
import { Button, Icon } from '../../components';
import ThreeDotMenu from './ThreeDotMenu';
import messaging from '@react-native-firebase/messaging';

import {
  _defaultImage,
  _homeMap,
  _noData,
  _technicianMap,
  SVG,
} from '../../assets';
import AnimatedCard from '../../components/AnimatedCard';
import SuccessModal from '../../components/SuccessModal';
import {
  JobStartBbService,
  JobStopBgService,
} from '../../utils/JobBackgroundLocation';
import { useSelector } from '../../context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { MapViewRoute } from 'react-native-maps-routes';
import { JobRoutes } from '../../routes/Job';
import ImageView from 'react-native-image-viewing';
import { resetAndNavigate } from '../../utils/resetAndNavigate';
import { useFocusEffect } from '@react-navigation/native';
import { convertTo12HourFormat } from '../../Functions';
import { GOOGLE_MAP_API_KEY } from '../../modules/services';
// @ts-ignore
import MathJax from 'react-native-mathjax';
import moment from 'moment';
import Toast from '../../components/Toast';
import LocationMocking from '../../components/LocationMocking';

interface JobDetailsProps extends JobRoutes<'JobDetails'> { }

const JobDetails: React.FC<JobDetailsProps> = ({ navigation, route }) => {
  const { item, isFromJobList } = route.params;
  const colors = useTheme();
  const { user } = useSelector(state => state.app);
  // @ts-ignore
  const mapRef: any = useRef();
  const [expandCard, setExpandCard] = useState({
    contactDetails: false,
    details: false,
    customer: false,
    payment: false,
    map: false,
    showMenu: false,
    showMap: false,
    imageView: false,
  });
  const [showSuccess, setShowSuccess] = useState({
    initiate: false,
    reached: false,
  });
  const [region, setRegion] = useState({
    latitude: 16.8524,
    longitude: 74.5815,
    latitudeDelta: 2.5,
    longitudeDelta: 2.5,
    loading: true,
  });
  const [currentAddress, setCurrentAddress] = useState('');
  const IS_ON_JOB = useStorage.getNumber('IS_ON_JOB');
  const [TRACK_STATUS, setTRACK_STATUS] = useState(item.TRACK_STATUS);
  const [loader, setLoader] = useState({
    initiate: false,
    reached: false,
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [isWithinRange, setIsWithinRange] = useState(false);
  // @ts-ignore
  const locationIntervalRef = useRef<NodeJS.Timeout>();
console.log('first-----',TRACK_STATUS)
  useFocusEffect(
    React.useCallback(() => {
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
    // Initial location check
    setTRACK_STATUS(item.TRACK_STATUS)
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setExpandCard({
        contactDetails: false,
        details: false,
        customer: false,
        payment: false,
        map: false,
        showMenu: false,
        showMap: false,
        imageView: false,
      });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (isMapReady && !currentAddress && !region.loading) {
      getAddressFromCoordinates(region.latitude, region.longitude);
    }
  }, [isMapReady, region.loading]);
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in meters

    return distance;
  };
  const getCurrentLocation = async () => {
    try {
      let Permission = await Permissions.checkLocation();

      if (!Permission) {
        Permission = await Permissions.requestLocation();
        // Check again after requesting
        if (!Permission) {
          console.warn('Location permission denied');
          return;
        }
      }
      Geolocation.getCurrentPosition(
        async location => {
          try {
            let { latitude, longitude } = location.coords;
            setRegion({
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: 2.5,
              longitudeDelta: 2.5,
              loading: false,
            });

            // Calculate distance to destination
            const distance = calculateDistance(
              latitude,
              longitude,
              Number(item.LOCATION_LATITUDE),
              Number(item.LOCATION_LONG),
            );

            setIsWithinRange(distance <= 150);
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
          timeout: 30000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.warn('Permission or general error:', error);
    }
  };
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ) => {
    if (!mapRef?.current) return;

    try {
      const data = await mapRef.current.addressForCoordinate({
        latitude,
        longitude,
      });

      const address = `${data.name ? data.name + ', ' : ''}${data.locality ? data.locality : ''
        }`;

      setCurrentAddress(address || 'Current Location');
    } catch (error) {
      console.warn('Error getting address:', error);
      setCurrentAddress('Current Location');
    }
  };
  const toggleSection = (section: keyof typeof expandCard) => {
    setExpandCard(prev => ({
      ...prev,
      [section]: !prev[section],
      showMenu: false,
    }));
  };
// 
  // console.log('item in job details', item);


  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const { data1, data2, data3, data4, data5 }: any = remoteMessage.data;

      const parsedData4 = JSON.parse(data4);
      const jobCardNo = parsedData4[0].JOB_CARD_NO;

      if (data3 == 'JC' && jobCardNo == item.JOB_CARD_NO) {
        console.log("\n\n item job card no", item.JOB_CARD_NO);
        JobStopBgService();
        setTRACK_STATUS('-')
        // @ts-ignore
        resetAndNavigate(navigation, 'Home', 'Dashboard');
        Toast("Job has been cancelled by admin");
      }
    });
  }, []);
  useEffect(() => {
    if (TRACK_STATUS === 'ST') {
      JobStartBbService(item, user);
    }
  }, [TRACK_STATUS]);
  const initiateJob = () => {
    setLoader({ ...loader, initiate: true });
    try {
      JobStartBbService(item, user);
      const body = {
        TECHNICIAN_ID: user?.ID,
        STATUS: 'ST',
        USER_ID: user?.ID,
        JOB_CARD_NO: item.JOB_CARD_NO,
        NAME: user?.NAME,
        JOB_DATA: [{ ...item, TECHNICIAN_NAME: user?.NAME }],
      };
      apiCall.post('api/technician/updateJobStatus', body).then(async res => {
        if (res.status == 200 && res.data.code == 200) {
          setLoader({ ...loader, initiate: false });
          setShowSuccess({ ...showSuccess, initiate: true });
          setTimeout(() => {
            setTRACK_STATUS('ST');
            setShowSuccess({ ...showSuccess, initiate: false });
          }, 4000);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  const [routeCoordinates, setRouteCoordinates] = useState<any>([]);

  useEffect(() => {
    fetchRouteCoordinates(region, item, GOOGLE_MAP_API_KEY)
      .then(setRouteCoordinates)
      .catch(console.warn);
  }, [region, item]);

  // const fetchRouteCoordinates = async (origin, destination, apiKey) => {
  //   const originStr = `${origin.latitude},${origin.longitude}`;
  //   const destStr = `${Number(destination.LOCATION_LATITUDE)},${Number(destination.LOCATION_LONG)}`;

  //   console.log("originStr", originStr);
  //   console.log("destStr", destStr);

  //   const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${apiKey}`;

  //   const response = await fetch(url);
  //   const json = await response.json();
  //   console.log("\n\n\njson", json);  // <-- Use the awaited json here

  //   if (json.routes.length) {
  //     const points = decodePolyline(json.routes[0].overview_polyline.points);
  //     return points;
  //   }

  //   throw new Error("No routes found");
  // };
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
      LOCATION_LATITUDE: origin.latitude, // Origin latitude (e.g., Pune)
      LOCATION_LONG: origin.longitude, // Origin longitude
      destination: {
        LOCATION_LATITUDE: destination.LOCATION_LATITUDE, // Destination latitude (e.g., Mumbai)
        LOCATION_LONG: destination.LOCATION_LONG, // Destination longitude
      },
    });
    // const json = await response.json();
    if (response.data.json.routes.length) {
      const points = decodePolyline(
        response.data.json.routes[0].overview_polyline.points,
      );
      return points;
    }

    throw new Error('No routes found');
  };

  // Decode polyline utility
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

  const handleReached = () => {
    setLoader({ ...loader, reached: true });
    try {
      JobStopBgService();
      const body = {
        TECHNICIAN_ID: user?.ID,
        STATUS: 'RD',
        USER_ID: user?.ID,
        JOB_CARD_NO: item.JOB_CARD_NO,
        NAME: user?.NAME,
        JOB_DATA: [{ ...item, TECHNICIAN_NAME: user?.NAME }],
      };
      apiCall.post('api/technician/updateJobStatus', body).then(async res => {
        if (res.status == 200 && res.data.code == 200) {
          setLoader({ ...loader, reached: false });
          setShowSuccess({ ...showSuccess, reached: true });
          setTimeout(() => {
            setTRACK_STATUS('RD');
            navigation.replace('JobFlow', {
              item: { ...item, TRACK_STATUS: 'RD' },
              isFromJobList: isFromJobList,
            });
            setShowSuccess({ ...showSuccess, reached: false });
          }, 4000);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: '#FDFDFD',
          paddingHorizontal: Size.containerPadding,
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
            style={[styles._headerTxt, { flex: 1, color: colors.primaryText }]}>
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
                    setExpandCard(prev => ({ ...prev, showMenu: false }))
                  }
                />
                <View
                  style={{ position: 'absolute', right: 0, top: 0, zIndex: 100 }}>
                  <ThreeDotMenu
                    isVisible={expandCard.showMenu}
                    isSupport={true}
                    supportOnPress={() => {
                      setExpandCard(prev => ({ ...prev, showMenu: false }));
                      navigation.navigate('TechnicianBackOfficeChat', {
                        jobItem: item,
                      });
                    }}
                    guideOnPress={() => {
                      setExpandCard(prev => ({ ...prev, showMenu: false }));
                      navigation.navigate('GuideHome', { item: item });
                    }}
                    isGuide={true}
                    isPart={false}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles._container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, marginBottom: 20 }}>
          <View
            style={{
              gap: 6,
              marginTop: Size.paddingY,
              marginBottom: Size.containerPadding,
            }}>
            {/* Details card */}
            <AnimatedCard
              title="Details"
              isExpanded={expandCard.details}
              onToggle={() => toggleSection('details')}
              mainChildren={
                <View style={{ gap: 8, marginBottom: Size.sm }}>
                  <View style={styles._row}>
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
                    <View style={styles._row}>
                      <Text
                        style={[
                          styles._estimateTimeLabel,
                          { color: colors.primaryText },
                        ]}>
                        {`${item.CUSTOMER_TYPE == 'B' ? 'SLA' : 'Estimated time'
                          }: `}
                      </Text>
                      <Text
                        style={[
                          styles._estimateTimeValue,
                          { color: colors.primaryText },
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
                    <View style={styles._row}>
                      <Text style={[styles._estimateTimeLabel]}>
                        {'Payment mode: '}
                      </Text>
                      {item.CUSTOMER_TYPE == 'I' && (
                        <Text style={[styles._estimateTimeValue]}>
                          {item.PAYMENT_MODE == 'COD'
                            ? 'Cash on delivery'
                            : 'Online'}
                        </Text>
                      )}
                      {item.CUSTOMER_TYPE == 'B' && (
                        <Text style={[styles._estimateTimeValue]}>
                          {item.PAYMENT_MODE == 'COD'
                            ? 'Cash on delivery'
                            : 'Online'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              }>
              <View>
                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>{'Brand: '}</Text>
                  <Text style={styles._jobDetailValue}>
                    {item.BRAND_NAME ? item.BRAND_NAME : '-'}
                  </Text>
                </View>
                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>{'Model: '}</Text>
                  <Text style={styles._jobDetailValue}>
                    {item.MODEL_NUMBER ? item.MODEL_NUMBER : '-'}
                  </Text>
                </View>
                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>{'Description: '}</Text>
                  {/* <Text style={styles._jobDetailValue}>
                    {item.DESCRIPTION ? item.DESCRIPTION : '-'}
                  </Text> */}
                  <MathJax
                    horizontal={false}
                    font-size={'huge'}
                    fontCache={true}
                    html={`<div style="font-size: 14; color:${'#333333'} ">${item.DESCRIPTION ? item.DESCRIPTION : '-'
                      }</div>`}
                  />
                </View>

                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>
                    {'Special Instructions: '}
                  </Text>
                  <Text style={styles._jobDetailValue}>
                    {item.SPECIAL_INSTRUCTIONS
                      ? item.SPECIAL_INSTRUCTIONS
                      : '-'}
                  </Text>
                </View>

                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>
                    {'Job Description: '}
                  </Text>
                  <Text style={styles._jobDetailValue}>
                    {item.TASK_DESCRIPTION ? item.TASK_DESCRIPTION : '-'}
                  </Text>
                </View>

                <View style={styles._jobDetailContainer}>
                  <Text style={styles._jobDetailLabel}>{'Photo/s: '}</Text>
                  {item.PHOTO_FILE ? (
                    <View style={{ marginTop: Size.sm }}>
                      <TouchableOpacity
                        onPress={() =>
                          setExpandCard({ ...expandCard, imageView: true })
                        }>
                        <Image
                          source={
                            item.PHOTO_FILE
                              ? {
                                uri: `${BASE_URL}static/CartItemPhoto/${item.PHOTO_FILE}`,
                              }
                              : _defaultImage
                          }
                          style={{ width: '100%', height: 120, borderRadius: 8 }}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles._jobDetailValue}>{'Not uploaded'}</Text>
                  )}
                </View>
              </View>
            </AnimatedCard>

            {/* Map view */}
            {TRACK_STATUS == 'ST' && (
              <AnimatedCard
                title="Map View"
                isExpanded={expandCard.map}
                onToggle={() => toggleSection('map')}
                containerStyle={{}}
                icon={
                  <Icon name="location-pin" type="SimpleLineIcons" size={18} />
                }>
                <View style={styles.mapContainer}>
                  <View style={styles.locationRow}>
                    <View style={styles.iconWrapper}>
                      <Icon
                        name="record-circle-outline"
                        type="MaterialCommunityIcons"
                        size={18}
                      />
                    </View>
                    <Text style={styles.locationText}>
                      {currentAddress || 'Loading current location...'}
                    </Text>
                  </View>

                  <View style={styles.dotContainer}>
                    <Icon
                      name="dot-single"
                      type="Entypo"
                      color="#666666"
                      size={20}
                    />
                    <Icon
                      name="dot-single"
                      type="Entypo"
                      color="#666666"
                      size={20}
                    />
                    <Icon
                      name="dot-single"
                      type="Entypo"
                      color="#666666"
                      size={20}
                    />
                  </View>

                  <View style={styles.locationRow}>
                    <View style={styles.iconWrapper}>
                      <Icon name="home" type="SimpleLineIcons" size={18} />
                    </View>
                    <Text style={styles.locationText}>
                      {item.SERVICE_ADDRESS}
                    </Text>
                  </View>

                  {/* Map View */}
                  {!region.loading && (
                    <View style={{ height: 250, width: '100%' }}>
                      <LocationMocking jobItem={item} />
                    </View>

                    // <MapView
                    //   key={`${region.latitude},${region.longitude}`}
                    //   ref={mapRef}
                    //   provider={PROVIDER_GOOGLE}
                    //   style={{
                    //     height: 280,
                    //     width: '100%',
                    //     // borderRadius: Size.radius,
                    //   }}
                    //   initialRegion={region}
                    //   onMapReady={() => {
                    //     setIsMapReady(true);
                    //     mapRef.current?.fitToCoordinates(
                    //       [
                    //         {
                    //           latitude: region.latitude,
                    //           longitude: region.longitude,
                    //         },
                    //         {
                    //           latitude: Number(item.LOCATION_LATITUDE),
                    //           longitude: Number(item.LOCATION_LONG),
                    //         },
                    //       ],
                    //       {
                    //         edgePadding: {
                    //           top: 50,
                    //           right: 50,
                    //           bottom: 50,
                    //           left: 50,
                    //         },
                    //         animated: true,
                    //       },
                    //     );
                    //   }}>
                    //   <Marker
                    //     coordinate={{
                    //       latitude: region.latitude,
                    //       longitude: region.longitude,
                    //     }}>
                    //     <View>
                    //       <Image
                    //         source={_technicianMap}
                    //         style={{
                    //           width: 40,
                    //           height: 40,
                    //         }}
                    //       />
                    //     </View>
                    //   </Marker>
                    //   <Marker
                    //     coordinate={{
                    //       latitude: Number(item.LOCATION_LATITUDE),
                    //       longitude: Number(item.LOCATION_LONG),
                    //     }}
                    //   />

                    //   <Polyline
                    //     coordinates={routeCoordinates}
                    //     strokeColor={colors.primary}
                    //     strokeWidth={3}
                    //   />

                    //   {/* <MapViewRoute
                    //     origin={{
                    //       latitude: region.latitude,
                    //       longitude: region.longitude,
                    //     }}
                    //     destination={{
                    //       latitude: Number(item.LOCATION_LATITUDE),
                    //       longitude: Number(item.LOCATION_LONG),
                    //     }}
                    //     apiKey={GOOGLE_MAP_API_KEY}
                    //     strokeWidth={2}
                    //     strokeColor={colors.primary}
                    //   />  */}
                    // </MapView>
                  )}
                </View>
              </AnimatedCard>
            )}

            {/* Customer details card */}
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
                      style={[styles.phoneText, { color: colors.primary2 }]}>
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
                    style={{ marginVertical: 10 }}
                    primary={false}
                  />
                )}
                {/* Address Section */}
                <View style={styles.phoneSection}>
                  <View style={styles.phoneIcon}>
                    <Icon name="home" type="SimpleLineIcons" size={18} />
                  </View>
                  <View style={styles.contactRow}>
                    <Text style={[styles.nameText, { flex: 1 }]}>
                      {item.SERVICE_ADDRESS}
                    </Text>
                    {TRACK_STATUS != 'ST' && !expandCard.showMap && (
                      <TouchableOpacity
                        style={styles.locationIconButton}
                        activeOpacity={0.7}
                        onPress={() => {
                          setExpandCard({ ...expandCard, showMap: true });
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

                {TRACK_STATUS != 'ST' &&
                  expandCard.showMap &&
                  !region.loading && (
                    <View>
                      <MapView
                        key={`${region.latitude},${region.longitude}`}
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={{
                          height: 280,
                          width: '100%',
                          // borderRadius: Size.radius,
                        }}
                        initialRegion={region}
                        onMapReady={() => {
                          setIsMapReady(true);
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
                              }}
                            />
                          </View>
                        </Marker>
                        <Marker
                          coordinate={{
                            latitude: Number(item.LOCATION_LATITUDE),
                            longitude: Number(item.LOCATION_LONG),
                          }}
                        />

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
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          gap: 6,
                          alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                        onPress={() => {
                          setExpandCard({ ...expandCard, showMap: false });
                        }}>
                        <Icon
                          name="location-pin"
                          type="SimpleLineIcons"
                          size={18}
                          color="#092B9C"
                          style={{ marginRight: 1 }}
                        />
                        <Text style={styles.mapButtonText}>Exit map</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            </AnimatedCard>

            {/* Payment card */}
            {item.CUSTOMER_TYPE == 'I' && (
              <AnimatedCard
                title="Payment details"
                isExpanded={expandCard.payment}
                onToggle={() => toggleSection('payment')}
                icon={
                  <Icon name="currency-rupee" type="MaterialIcons" size={20} />
                }>
                <View style={{ gap: 10, marginTop: 15 }}>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>Base price</Text>
                    <Text style={[styles._value]}>
                      {`₹ ${parseFloat(
                        item?.SERVICE_BASE_PRICE || '0',
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>Tax({item.TAX_RATE}%)</Text>
                    <Text style={[styles._value]}>{`₹ ${parseFloat(
                      item?.TAX_AMOUNT || '0',
                    ).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}`}</Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>Express charges</Text>
                    <Text style={[styles._value]}>{`₹ ${parseFloat(
                      item?.EXPRESS_DELIVERY_CHARGES || '0',
                    ).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}`}</Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>Discount</Text>
                    <Text style={[styles._value]}>{`₹ ${parseFloat(
                      item?.COUPON_AMOUNT || '0',
                    ).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}`}</Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>Total</Text>
                    <Text style={[styles._value]}>
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
        {TRACK_STATUS == 'ST' ? (
          <Button
            label="Arrived"
            onPress={() => {
              handleReached();

              // if (user?.IS_REMOTE_TECHNICIAN == true) {
              //   handleReached();
              // }
              // else {
              //   if (isWithinRange) {
              //     handleReached();
              //   } else {
              //     //   // Only show toast when button is clicked and not in range
              //     Toast(
              //       'You are not within 150 meters of the destination location',
              //     );
              //   }
              // }

            }}
            loading={loader.reached}
          />
        ) : (
          <Button
            label="Initiate"
            onPress={() => {
              initiateJob();
            }}
            loading={loader.initiate}
            style={{
              backgroundColor: IS_ON_JOB == 1 ? '#666666' : colors.primary,
            }}
            disable={IS_ON_JOB == 1 ? true : false}
          />
        )}
      </View>
      <SuccessModal
        visible={showSuccess.initiate || showSuccess.reached}
        message={
          showSuccess.initiate
            ? 'Job initiated successfully!'
            : 'Arrived at the location!'
        }
      />
      {expandCard.imageView && (
        <ImageView
          images={[{ uri: `${BASE_URL}static/CartItemPhoto/${item.PHOTO_FILE}` }]}
          imageIndex={0}
          visible={expandCard.imageView}
          presentationStyle="overFullScreen"
          onRequestClose={() => {
            setExpandCard({ ...expandCard, imageView: false });
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    paddingHorizontal: Size.containerPadding,
  },
  _headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
  },
  _estimateTimeLabel: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  _estimateTimeValue: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  _jobDetailContainer: { marginVertical: Size.base },
  _jobDetailLabel: {
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'left',
    color: '#666666',
    letterSpacing: 0.2,
  },
  _jobDetailValue: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
    letterSpacing: 0.2,
  },
  _label: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
    color: '#333333',
    letterSpacing: 0.2,
  },
  _value: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'right',
    color: '#000000',
    letterSpacing: 0.2,
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#d8e0f1',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    borderColor: '#092B9C',
    // width: '46%',
  },
  mapButtonText: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#092B9C',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  mapContainer: {
    marginTop: 5,
    paddingHorizontal: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 12,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 0.2,
    paddingRight: 8,
  },
  dotContainer: {
    marginLeft: 2,
    marginTop: -12,
    marginBottom: -12,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 8,
  },
  customerInfoText: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },
  messageButton: {
    marginVertical: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 8,
  },
  addressIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
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
