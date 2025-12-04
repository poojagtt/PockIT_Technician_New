import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {Icon} from '../../components';
import {useSelector, useDispatch} from '../../context/reducers/store';
import {
  apiCall,
  IMAGE_URL,
  Size,
  useTheme,
  useStorage,
  fontFamily,
  Permissions,
  tokenStorage,
} from '../../modules';
import moment from 'moment';
import SliderIndicator from '../../components/SliderIndicator';
import {useFocusEffect} from '@react-navigation/native';
import {convertTo12HourFormat, formatName} from '../../Functions';
import {_noProfile} from '../../assets';
import {getTechStatus} from '../../context/reducers/app';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeParams} from '../../routes/Home';
import {TabRoutes} from '../../routes';
import {RootState} from '../../context/reducers/store';
import messaging from '@react-native-firebase/messaging';
import {requestNotifications} from 'react-native-permissions';
import {SafeAreaView} from 'react-native-safe-area-context';

interface JOB_WISE_EARNINGS {
  JOB_COMPLETED_DATETIME: string;
  TECHNICIAN_COST: string;
}

type DashboardScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeParams, 'Dashboard'>,
  BottomTabScreenProps<TabRoutes>
>;

const Dashboard: React.FC<DashboardScreenProps> = ({navigation}) => {
  const {user, techStatus} = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();
  const colors = useTheme();
  const [assignJobs, setAssignJobs] = useState<{
    loading: boolean;
    jobs: JobData[];
  }>({
    loading: false,
    jobs: [],
  });

  const [territoryPendingJobCount, setTerritoryPendingJobCount] = useState(0);
  const [initiatedJobs, setInitiatedJobs] = useState<JobData[]>([]);
  const [earnings, setEarnings] = useState<{
    total: number;
    today: number;
  }>({
    total: 0,
    today: 0,
  });

  const handleStatusChange = (isOnline: boolean) => {
    // dispatch(updateTechStatus(isOnline));
  };

  const displayName = formatName(user?.NAME);
  useFocusEffect(
    useCallback(() => {
      getTerritoryAssignedJobs();
      void dispatch(getTechStatus());
      void getInitiatedJobs();
      void getTodayAssignedJobs();
    }, [dispatch]),
  );
  console.log("initiated job", initiatedJobs);
  console.log("assigned job", assignJobs.jobs);
  useEffect(() => {
    console.log(
      'channels',
      useStorage.getString('SUBSCRIBED_CHANNELS') || '[]',
    );
    checkApplicationPermission();
    const token = tokenStorage.getToken();
    void getEarnings();
  }, []);

  useEffect(() => {
    subscribeToChatChannel();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getEarnings();
      getTodayAssignedJobs();
      getInitiatedJobs();
      getPendingJobs();
    });
  }, []);

  const subscribeToChatChannel = async () => {
    const subscribedChannelsStr =
      useStorage.getString('SUBSCRIBED_CHANNELS') || '[]';

    let channelNamesToExclude: string[] = [];

    try {
      const parsedChannels = JSON.parse(subscribedChannelsStr);
      channelNamesToExclude = parsedChannels.map((ch: any) => ch.CHANNEL_NAME);
      console.log('Already subscribed channels:', channelNamesToExclude);
    } catch (err) {
      console.log('Error parsing SUBSCRIBED_CHANNELS:', err);
    }

    try {
      const res = await apiCall.post(`api/channelSubscribedUsers/get`, {
        filter: {
          $and: [
            {
              USER_ID: user?.ID,
            },

            {
              STATUS: true,
            },

            {
              TYPE: 'T',
            },

            {
              CHANNEL_NAME: {
                $nin: channelNamesToExclude,
              },
            },
          ],
        },
      });

      if (res.status === 200) {
        const newChannels = res.data.data;
        console.log('New channels to subscribe:', newChannels);

        for (const channel of newChannels) {
          const topicName = channel.CHANNEL_NAME;
          try {
            await messaging().subscribeToTopic(topicName);
            console.log(`Subscribed to topic: ${topicName}`);
          } catch (subscribeErr) {
            console.log(
              `Failed to subscribe to topic ${topicName}:`,
              subscribeErr,
            );
          }
        }

        const updatedChannels = [
          ...JSON.parse(subscribedChannelsStr),
          ...newChannels,
        ];
        useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(updatedChannels));
      }
    } catch (error) {
      console.log('API call or subscription error:', error);
    }
  };

  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const isUnreadNotifications = useStorage.getBoolean('UNREAD_NOTIFICATIONS');
    setHasUnread(isUnreadNotifications ? true : false);
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      setHasUnread(true);
    });
    return unsubscribe;
  }, []);

  const checkLocationPermission = async () => {
    try {
      const hasPermission = await Permissions.checkLocation();
      console.log('Location permission status:', hasPermission);
      if (!hasPermission) {
        await Permissions.requestLocation();
      }
    } catch (error) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to use this feature.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };
  const checkNotificationPermission = async () => {
    try {
      const {status} = await requestNotifications(['alert', 'sound', 'badge']);
      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications to receive important updates about your jobs.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      Alert.alert(
        'Error',
        'Failed to check notification permissions. Please try again.',
      );
    }
  };

  useEffect(() => {
    console.log('Checking permissions...');
    checkLocationPermission();
    checkNotificationPermission();
  }, []);

  const getInitiatedJobs = () => {
    try {
      setAssignJobs({...assignJobs, loading: true});
      apiCall
        .post(`api/jobCard/getJobsForTechnician`, {
          TECHNICIAN_ID: user?.ID,
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND TRACK_STATUS NOT IN ('EJ','-') AND STATUS NOT IN ('CN')`,
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            // console.log('345678p[////', res.data);
            setInitiatedJobs(res.data.data);
          }
        })
        .catch(err => {
          console.log('jobs err.....', err);
          setAssignJobs({...assignJobs, loading: false});
        });
    } catch (error) {
      console.log(error);
    }
  };
  async function checkApplicationPermission() {
    const authorizationStatus = await messaging().requestPermission();
    if (
      authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      // 👇 Required for iOS to receive remote notifications
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      const fcmToken = await messaging().getToken();
    } else {
      // console.log('User has notification permissions disabled');
    }
  }
  const getPendingJobs = () => {
    try {
      apiCall
        .post('api/jobCard/get', {filter: ' AND TECHNICIAN_ID = ' + user?.ID})
        .then(res => {
          if (res.data.code === 200) {
          } else {
            Alert.alert('Failed to get jobs');
          }
        })
        .catch(err => {
          console.log('Error fetching jobs:', err);
        });
    } catch (error) {
      console.error('Error in API call:', error);
    }
  };
  const getTodayAssignedJobs = () => {
    try {
      setAssignJobs({...assignJobs, loading: true});
      apiCall
        .post(`api/jobCard/getJobsForTechnician`, {
          TECHNICIAN_ID: user?.ID,
          filter: ` AND TECHNICIAN_ID = ${
            user?.ID
          } AND DATE(SCHEDULED_DATE_TIME) = '${moment().format(
            'YYYY-MM-DD',
          )}' AND TECHNICIAN_STATUS = 'AS' AND TRACK_STATUS IN ('-') `,
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            useStorage.set('IS_ON_JOB', res.data.IS_ON_JOB);
            setAssignJobs({
              ...assignJobs,
              jobs: res.data.data,
              loading: false,
            });
          }
        })
        .catch(err => {
          console.log('jobs err.....', err);
          setAssignJobs({...assignJobs, loading: false});
        });
    } catch (error) {
      console.log(error);
    }
  };

  const getEarnings = () => {
    const body = {TECHNICIAN_ID: user?.ID};
    try {
      apiCall
        .post('api/reports/getTechnicianEarnings', body)
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            const today = res.data.JOB_WISE_EARNINGS.filter(
              (job: JOB_WISE_EARNINGS) =>
                moment(
                  job.JOB_COMPLETED_DATETIME,
                  'YYYY-MM-DD HH:mm:ss',
                ).isSame(moment(), 'day'),
            ).reduce(
              (total: number, job: JOB_WISE_EARNINGS) =>
                total + (parseFloat(job.TECHNICIAN_COST) || 0),
              0,
            );
            setEarnings({
              total: res.data.TOTAL_EARNINGS,
              today: today,
            });
          }
        })
        .catch(err => {
          console.log('category err.....', err);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const getTerritoryAssignedJobs = () => {
    try {
      apiCall
        .post(`api/jobCard/getJobsForTechnician`, {
          TECHNICIAN_ID: user?.ID,
          filter: ` AND DATE(EXPECTED_DATE_TIME) >= '${moment().format(
            'YYYY-MM-DD',
          )}' AND TECHNICIAN_STATUS = 'P' AND IS_REMOTE_JOB = 0`,
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            setTerritoryPendingJobCount(res.data.data.length);
          }
        })
        .catch(err => {
          console.log('jobs err.....', err);
        });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* header */}
      <View
        style={{
          paddingHorizontal: Platform.OS == 'ios' ? Size.containerPadding : 0,
        }}>
        <View style={styles.header}>
          <View style={[styles.headerLeft, {}]}>
            <View style={styles.profileContainer}>
              <Image
                source={
                  user?.PROFILE_PHOTO
                    ? {
                        uri: `${IMAGE_URL}TechnicianProfile/${user?.PROFILE_PHOTO}`,
                      }
                    : _noProfile
                }
                style={styles.profileImage}
              />
              {techStatus && <View style={styles.onlineIndicator} />}
            </View>
            <View>
              <Text style={styles.greeting}>{`Hi ${displayName},`}</Text>
              <Text style={styles.subGreeting}>
                Let's get started with today's jobs.
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
            <View style={{}}>
              <Icon
                name="pending-actions"
                type="MaterialIcons"
                size={22}
                onPress={() => navigation.navigate('PendingJobList')}
              />
              {territoryPendingJobCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -8,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: '600',
                      fontFamily: fontFamily,
                    }}>
                    {territoryPendingJobCount > 5
                      ? '5+'
                      : territoryPendingJobCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={{marginLeft: 8}}>
              <Icon
                name="bell-outline"
                type="MaterialCommunityIcons"
                size={24}
                onPress={() => {
                  setHasUnread(false);
                  useStorage.set('UNREAD_NOTIFICATIONS', false);
                  navigation.navigate('Notification');
                }}
              />
              {hasUnread && (
                <View
                  style={{
                    height: 10,
                    width: 10,
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    borderRadius: 5,
                  }}></View>
              )}
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          paddingHorizontal: Platform.OS == 'ios' ? Size.containerPadding : 0,
        }}>
        {!techStatus && (
          <SliderIndicator
            onStatusChange={handleStatusChange}
            navigation={navigation}
            from="D"
          />
        )}
      </View>

      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: Platform.OS == 'ios' ? Size.containerPadding : 0,
        }}
        contentContainerStyle={{
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              dispatch(getTechStatus());
              getInitiatedJobs();
              getTodayAssignedJobs();
              getEarnings();
            }}
            colors={[colors.primary]}
          />
        }>
        {assignJobs.loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="small"
            style={{alignSelf: 'center', marginTop: Size.field}}
          />
        ) : initiatedJobs.length === 0 && assignJobs.jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon
              type="MaterialCommunityIcons"
              name="calendar-blank"
              size={50}
              color={colors.primary2}
            />
            <Text style={[styles.emptyTitle, {color: colors.heading}]}>
              No Jobs Found
            </Text>
            <Text style={[styles.emptyText, {color: colors.description}]}>
              You don't have any jobs scheduled for today. Check back later for
              new assignments.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {initiatedJobs.length + assignJobs.jobs.length} Jobs assigned
              today
            </Text>
            {initiatedJobs.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.jobCard}
                onPress={() => {
                   console.log('line no 549', item);
                  if (techStatus) {
                    navigation.navigate('Job', {
                      screen:
                        item.TRACK_STATUS === 'ST' ? 'JobDetails' : 'JobFlow',
                      params: {item, isFromJobList: false},
                    } as any);
                  }
                }}>
                <View style={styles.jobCardContent}>
                  <View style={styles.jobIconContainer}>
                    <Image
                      source={{uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE}}
                      style={{
                        height: 45,
                        width: 45,
                      }}
                    />
                  </View>
                  <View style={styles.jobDetails}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTime}>
                        {moment(item.SCHEDULED_DATE_TIME).format('MMM Do YY,') +
                          ' ' +
                          convertTo12HourFormat(item.START_TIME)}
                      </Text>
                      <View
                        style={[
                          styles.initiatedTag,
                          {
                            backgroundColor:
                              item.TRACK_STATUS == 'PJ'
                                ? colors.secondary
                                : item.TECHNICIAN_STATUS == 'ON'
                                ? colors.primary2
                                : '#4096FF',
                          },
                        ]}>
                        <Text style={styles.initiatedText}>
                          {item.TRACK_STATUS == 'PJ'
                            ? 'Paused'
                            : item.TECHNICIAN_STATUS == 'ON'
                            ? 'Ongoing'
                            : 'Initiated'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.jobTitle}>{item.SERVICE_NAME}</Text>
                    <Text style={styles.jobLocation}>
                      {item.SERVICE_ADDRESS}
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    type="Feather"
                    size={20}
                    color="#999999"
                    style={{alignSelf: 'center'}}
                  />
                </View>
              </TouchableOpacity>
            ))}

            {assignJobs.jobs.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.jobCard}
                onPress={() => {
                  console.log('line no 617', item);
                  if (techStatus) {
                    navigation.navigate('Job', {
                      screen: 'JobDetails',
                      params: {item, isFromJobList: false},
                    } as any);
                  }
                }}>
                <View style={styles.jobCardContent}>
                  <View style={styles.jobIconContainer}>
                    <Image
                      source={{uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE}}
                      style={{
                        height: 45,
                        width: 45,
                      }}
                    />
                  </View>
                  <View style={styles.jobDetails}>
                    <Text style={styles.jobTime}>
                      {moment(item.SCHEDULED_DATE_TIME).format('MMM Do YY,') +
                        ' ' +
                        convertTo12HourFormat(item.START_TIME)}
                    </Text>
                    <Text style={styles.jobTitle}>{item.SERVICE_NAME}</Text>
                    <Text style={styles.jobLocation}>
                      {item.SERVICE_ADDRESS}
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    type="Feather"
                    size={20}
                    color="#999999"
                    style={{alignSelf: 'center'}}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Earnings Section */}
        {user?.CAN_VIEW_SERVICE_PRICES_SUMMARY == 1 && (
          <View style={{marginTop: 14}}>
            <Text style={styles.sectionTitle}>Your earnings</Text>
            <View style={styles.earningsContainer}>
              <View style={styles.earningCard}>
                <Text style={styles.earningLabel}>Total</Text>
                <Text style={styles.earningAmount}>₹ {earnings.total}</Text>
              </View>

              <View style={styles.earningCard}>
                <Text style={styles.earningLabel}>Today</Text>
                <Text style={styles.earningAmount}>₹ {earnings.today}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: Platform.OS == 'android' ? Size.containerPadding : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Size.lg,
    paddingTop: 8,
  },
  headerLeft: {
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    position: 'relative',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FF6B3D',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    position: 'absolute',
    right: 0,
    top: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  greeting: {
    fontFamily: fontFamily,
    fontSize: 17,
    fontWeight: '600',
    color: '#0E0E0E',
  },
  subGreeting: {
    fontFamily: fontFamily,
    fontSize: 14,
    color: '#0E0E0E',
    marginTop: Platform.OS == 'android' ? -4 : 4,
    fontWeight: '400',
  },
  sectionTitle: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#0E0E0E',
    marginBottom: 7,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    margin: 2,
  },
  jobCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  jobIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
  },
  jobDetails: {
    flex: 1,
  },
  jobHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  jobTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    fontFamily: fontFamily,
    flex: 1,
  },
  initiatedTag: {
    backgroundColor: '#4096FF',
    paddingHorizontal: Size.padding,
    paddingVertical: 2,
    borderRadius: 7,
    marginRight: -18,
  },
  initiatedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily,
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0E0E0E',
    marginBottom: 4,
    fontFamily: fontFamily,
  },
  jobLocation: {
    fontSize: 13,
    fontWeight: '400',
    color: '#636363',
    marginBottom: 4,
    fontFamily: fontFamily,
    lineHeight: 18,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  earningCard: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#98B7EF',
    gap: 4,
  },
  earningLabel: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: '#0E0E0E',
  },
  earningAmount: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '500',
    color: '#0E0E0E',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Size.lg,
    marginTop: Size.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Size.lg,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Size.sm,
    textAlign: 'center',
    fontFamily: fontFamily,
    lineHeight: 20,
  },
});

export default Dashboard;
