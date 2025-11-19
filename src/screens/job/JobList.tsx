import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {apiCall, fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {Icon, TextInput} from '../../components';
import {JobRoutes} from '../../routes/Job';
import {_noData, SVG} from '../../assets';
import {useSelector} from '../../context';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import FilterMenuDate from './Components/FilterMenuDate';
import {convertTo12HourFormat} from '../../Functions';
import SortFilter from './Components/SortFilter';
import FilterMenu from './Components/FilterMenu';
import {RootState} from '../../context/reducers/store';
import Toast from '../../components/Toast';
import messaging from '@react-native-firebase/messaging';


interface JobListProps extends JobRoutes<'JobList'> {}
interface JobState {
  JobListAssigned: JobData[];
  JobListPast: JobData[];
  loading: boolean;
  showFilerMenu: boolean;
  showSortMenu: boolean;
  selectedFilter: string;
  selectedData: {label: string; id: string};
}
const JobList: React.FC<JobListProps> = ({navigation}) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const colors = useTheme();
  const {user, techStatus} = useSelector((state: RootState) => state.app);

  const [jobs, setJobs] = useState<JobState>({
    JobListAssigned: [],
    JobListPast: [],
    loading: false,
    showFilerMenu: false,
    showSortMenu: false,
    selectedFilter: 'All',
    selectedData: {label: 'All', id: 'all'},
  });
  const [searchKey, setSearchKey] = useState('');
  useFocusEffect(
    useCallback(() => {
      if (activeIndex == 1) {
        getJobListAssigned('');
       
      } else {
        getJobListPast('');
      }
      return () => {};
    }, [activeIndex, jobs.selectedFilter, jobs.selectedData.id]),
  );

  useEffect(() => {
    setJobs({...jobs, selectedFilter: 'All'});
  },[activeIndex]);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if(activeIndex == 1){
        getJobListAssigned('');
      }else{
        getJobListPast('');
      }
    });
  }, []);
  const JobCard = ({item}: {item: JobData}) => {
    return (
      <TouchableOpacity
        key={item.ID}
        activeOpacity={0.8}
        style={styles._card}
        onPress={() => {
          if (techStatus) {
            item.STATUS == 'AS' && item.TECHNICIAN_STATUS == 'ON'
              ? navigation.navigate('Job', {
                  screen: 'JobFlow',
                  params: {item, isFromJobList: true},
                })
              : navigation.navigate('Job', {
                  screen: 'JobDetails',
                  params: {item, isFromJobList: true},
                });
          } else {
            Toast('To begin your tasks, ensure you are online.');
          }
        }}>
        <View style={styles.jobCardContent}>
          <View style={styles.jobIconContainer}>
            <Image
              source={{uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE}}
              style={{
                height: 45,
                width: 45,
                // marginTop: Size.containerPadding,
              }}
            />
          </View>
          <View style={styles.jobDetails}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTime}>
                {moment(item.SCHEDULED_DATE_TIME).format('MMM Do YY,') +' '+ convertTo12HourFormat(item.START_TIME)}
              </Text>
              {item.STATUS == 'AS' &&
                item.TECHNICIAN_STATUS == 'ON' &&
                (item.TECHNICIAN_STATUS == 'ON' ||
                  item.TRACK_STATUS == 'PJ') && (
                  <View
                    style={[
                      styles.initiatedTag,
                      {
                        backgroundColor:
                          item.TRACK_STATUS == 'PJ'
                            ? colors.secondary
                            : colors.primary2,
                      },
                    ]}>
                    <Text style={styles.initiatedText}>
                      {item.TRACK_STATUS == 'PJ' ? 'Paused' : 'Ongoing'}
                    </Text>
                  </View>
                )}
            </View>
            <Text style={styles.jobTitle}>{item.SERVICE_NAME}</Text>
            <Text style={styles.jobLocation}>{item.SERVICE_ADDRESS}</Text>
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
    );
  };
  const getJobListAssigned = (searchKey: string) => {
    setJobs({...jobs, loading: true});
    const today = moment().format('YYYY-MM-DD');
    const lastWeek = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const lastMonth = moment().subtract(1, 'month').format('MM');
    const lastMonthYear = moment().subtract(1, 'month').format('YYYY');

    let filterCondition = ` AND TECHNICIAN_ID = ${user?.ID} AND STATUS = "AS" `;
    if (searchKey != '') {
      filterCondition += ` AND (JOB_CARD_NO LIKE '%${searchKey}%' OR SERVICE_NAME LIKE '%${searchKey}%')`;
    }
    switch (jobs.selectedFilter) {
      case 'Today':
        filterCondition += ` AND DATE(SCHEDULED_DATE_TIME) = '${today}'`;
        break;
      case 'Last Week':
        filterCondition += ` AND DATE(SCHEDULED_DATE_TIME) >= '${lastWeek}' AND DATE(SCHEDULED_DATE_TIME) <= '${yesterday}'`;
        break;
      case 'Last Month':
        filterCondition += ` AND MONTH(SCHEDULED_DATE_TIME) = '${lastMonth}' AND YEAR(SCHEDULED_DATE_TIME) = '${lastMonthYear}'`;
        break;
      case 'All':
      default:
        break;
    }
    try {
      apiCall
        .post('api/jobCard/get', {filter: filterCondition})
        .then(res => {
          if (res.data.code === 200) {
            setJobs({...jobs, JobListAssigned: res.data.data, loading: false});
          } else {
            Alert.alert('Failed to get jobs');
          }
        })
        .catch(err => {
          console.log('Error fetching jobs:', err);
          setJobs({...jobs, loading: false});
        });
    } catch (error) {
      console.error('Error in API call:', error);
      setJobs({...jobs, loading: false});
    }
  };
  const getJobListPast = (searchKey: string) => {
    setJobs({...jobs, loading: true});
    const today = moment().format('YYYY-MM-DD');
    const lastWeek = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const lastMonth = moment().subtract(1, 'month').format('MM');
    const lastMonthYear = moment().subtract(1, 'month').format('YYYY');
    let filterCondition = ` AND TECHNICIAN_ID= ${user?.ID} `;
    if (searchKey != '') {
      filterCondition += `AND (JOB_CARD_NO LIKE '%${searchKey}%' OR SERVICE_NAME LIKE '%${searchKey}%')`;
    }
    switch (jobs.selectedFilter) {
      case 'Today':
        filterCondition += ` AND (DATE(JOB_COMPLETED_DATETIME) = '${today}' OR DATE(CANCEL_DATE) = '${today}')`;
        break;
      case 'Last Week':
        filterCondition += ` AND (DATE(JOB_COMPLETED_DATETIME) >= '${lastWeek}' AND DATE(JOB_COMPLETED_DATETIME) <= '${yesterday}' OR DATE(CANCEL_DATE) >= '${lastWeek}' AND DATE(CANCEL_DATE) <= '${yesterday}')`;
        break;
      case 'Last Month':
        filterCondition += ` AND (MONTH(JOB_COMPLETED_DATETIME) = '${lastMonth}' AND YEAR(JOB_COMPLETED_DATETIME) = '${lastMonthYear}' OR MONTH(CANCEL_DATE) = '${lastMonth}' AND YEAR(CANCEL_DATE) = '${lastMonthYear}')`;
        break;
      case 'All':
      default:
        break;
    }
    switch (jobs.selectedData.id) {
      case 'overdue':
        filterCondition += ` AND DATE(JOB_COMPLETED_DATETIME) > DATE(EXPECTED_DATE_TIME) `;
        break;
      case 'completed':
        filterCondition += ` AND STATUS = "CO"`;
        break;
      case 'cancelled':
        filterCondition += ` AND ORDER_STATUS = "CA"`;
        break;
      case 'all':
        filterCondition += ` AND (STATUS = "CO" OR ORDER_STATUS = "CA")`;
      default:
        break;
    }
    try {
      apiCall
        .post('api/jobCard/get', {filter: filterCondition})
        .then(res => {
          if (res.data.code === 200) {
            setJobs({...jobs, JobListPast: res.data.data, loading: false});
          } else {
            Alert.alert('Failed to get jobs');
          }
        })
        .catch(err => {
          console.log('Error fetching jobs:', err);
          setJobs({...jobs, loading: false});
        });
    } catch (error) {
      console.error('Error in API call:', error);
      setJobs({...jobs, loading: false});
    }
  };
  const toggleMenu = () => {
    setJobs({...jobs, showFilerMenu: !jobs.showFilerMenu});
  };
  const handleMenuPress = async (menuItem: string) => {
    setJobs({
      ...jobs,
      selectedFilter: menuItem,
      showFilerMenu: false,
      showSortMenu: false,
    });
  };
  const categorizeJobs = (jobList: any) => {
    const now = moment();
    const today = moment(new Date()).startOf('day');
    const ongoingJobs = jobList.filter(
      (job: any) =>
        moment(job.SCHEDULED_DATE_TIME).isBefore(now) &&
        job.STATUS == 'AS' &&
        job.TECHNICIAN_STATUS == 'ON',
    );
    const todayJobs = jobList.filter(
      (job: any) =>
        moment(job.SCHEDULED_DATE_TIME).isSame(today, 'day') &&
        job.STATUS == 'AS' &&
        job.TECHNICIAN_STATUS != 'ON',
    );
    const upcomingJobs = jobList.filter(
      (job: any) =>
        moment(job.SCHEDULED_DATE_TIME).isAfter(today) &&
        job.STATUS == 'AS' &&
        job.TECHNICIAN_STATUS != 'ON',
    );
    const Previous = jobList.filter((job: any) => {
      return (
        moment(job.SCHEDULED_DATE_TIME).isBefore(today) &&
        job.STATUS === 'AS' &&
        job.TECHNICIAN_STATUS != 'ON'
      );
    });
    const Pending = jobList.filter((job: any) => {
      return (
        job.STATUS === 'AS' &&
        job.TECHNICIAN_STATUS == 'AS' &&
        job.TRACK_STATUS == '-'
      );
    });
    return {ongoingJobs, todayJobs, upcomingJobs, Previous, Pending};
  };
  const {ongoingJobs, todayJobs, upcomingJobs, Previous, Pending} =
    categorizeJobs(jobs.JobListAssigned);
  const shouldShowOngoing =
    (jobs.selectedFilter === 'All' || jobs.selectedFilter === 'Ongoing') &&
    ongoingJobs.length > 0;
  const shouldShowToday =
    (jobs.selectedFilter === 'All' || jobs.selectedFilter === 'Today') &&
    todayJobs.length > 0;
  const shouldShowUpcoming =
    (jobs.selectedFilter === 'All' || jobs.selectedFilter === 'Upcoming') &&
    upcomingJobs.length > 0;
  const shouldShowPrevious =
    (jobs.selectedFilter === 'All' || jobs.selectedFilter === 'Previous') &&
    Previous.length > 0;
  const shouldShowPending =
    jobs.selectedFilter === 'Pending' && Pending.length > 0;


  return (
    <SafeAreaView
      style={[styles._container, {backgroundColor: colors.background}]}>
      <View
        style={{
          backgroundColor: '#FDFDFD',
          paddingHorizontal: Size.containerPadding,
          padding: Size.containerPadding,
        }}>
        {/* <Icon
          name="keyboard-backspace"
          type="MaterialCommunityIcons"
          size={25}
          onPress={() => {
            navigation.goBack();
          }}
        /> */}
        <View
          style={{
            marginTop: Size.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={[styles._headerText, {flex: 1, color: colors.primaryText}]}>
            Jobs
          </Text>
        </View>
      </View>
      <View style={{flex: 1}}>
        <TabSwitcher
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          setSearchKey={setSearchKey}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: Size.containerPadding,
            gap: 8,
          }}>
          <View style={{flex: 1}}>
            <TextInput
              leftChild={
                <Icon
                  name="search1"
                  type="AntDesign"
                  size={21}
                  color={colors.primary2}
                />
              }
              placeholder="Search..."
              value={searchKey}
              onChangeText={value => {
                setSearchKey(value);
                if (activeIndex == 1) {
                  getJobListAssigned(value);
                } else {
                  getJobListPast(value);
                }
              }}
              style={{
                height: 45,
              }}
            />
          </View>
          {activeIndex == 2 && (
            <TouchableOpacity
              onPress={() => setJobs({...jobs, showSortMenu: true})}
              activeOpacity={0.8}
              style={{
                height: 45,
                width: 45,
                backgroundColor: '#FDFDFD',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#CBCBCB',
              }}>
              <SVG.sort
                fill={colors.primary}
                stroke={colors.primary}
                width={24}
                height={24}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => toggleMenu()}
            activeOpacity={0.8}
            style={{
              height: 45,
              width: 45,
              backgroundColor: '#FDFDFD',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#CBCBCB',
            }}>
            <Icon
              name="filter"
              type="AntDesign"
              size={24}
              color={colors.primary2}
            />
          </TouchableOpacity>

          {jobs.showFilerMenu && activeIndex == 1 && (
            <FilterMenuDate
              isVisible={jobs.showFilerMenu}
              onMenuPress={handleMenuPress}
              selectedMenu={jobs.selectedFilter}
            />
          )}
          {jobs.showFilerMenu && activeIndex == 2 && (
            <FilterMenu
              isVisible={jobs.showFilerMenu}
              onMenuPress={(value: any) => {
                setJobs({
                  ...jobs,
                  selectedData: value,
                  showFilerMenu: false,
                });
              }}
              selectedMenu={jobs.selectedData}
            />
          )}
          {jobs.showSortMenu && activeIndex == 2 && (
            <SortFilter
              isVisible={jobs.showSortMenu}
              onMenuPress={handleMenuPress}
              selectedMenu={jobs.selectedFilter}
            />
          )}
        </View>

        {/* ASSIGNED */}
        {activeIndex == 1 && (
          <View
            style={{
              flex: 1,
              marginHorizontal: Size.containerPadding,
              marginTop: Size.containerPadding,
            }}>
            {jobs.loading ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 50,
                }}>
                <ActivityIndicator color={colors.primary2} size={'small'} />
              </View>
            ) :jobs.selectedFilter=='Ongoing' && ongoingJobs.length < 1 ||
            jobs.selectedFilter=='Today' && todayJobs.length < 1 ||
            jobs.selectedFilter=='Upcoming' &&  upcomingJobs.length < 1 ||
            jobs.selectedFilter=='Previous' &&  Previous.length < 1 ||
            jobs.selectedFilter=='Pending' &&  Pending.length < 1 ||
            jobs.selectedFilter=='All' &&  jobs.JobListAssigned.length < 1 
              ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 50,
                 
                }}>
                <Image source={_noData} style={{height: 150, width: 150}} />
              </View>
            ) : (
              <FlatList
                data={[
                  {
                    title: 'Ongoing',
                    data: ongoingJobs,
                    show: shouldShowOngoing,
                  },
                  {
                    title: 'Today',
                    data: todayJobs,
                    show: shouldShowToday,
                  },
                  {
                    title: 'Upcoming',
                    data: upcomingJobs,
                    show: shouldShowUpcoming,
                  },
                  {
                    title: 'Previous',
                    data: Previous,
                    show: shouldShowPrevious,
                  },
                  {
                    title: 'Pending',
                    data: Pending,
                    show: shouldShowPending,
                  },
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => {
                      getJobListAssigned('');
                    }}
                    colors={[colors.primary]}
                  />
                }
                renderItem={({item}) => {
                  if (!item.show) return null;
                  return (
                    <View>
                      {item.title !== 'Ongoing' && (
                        <Text style={[styles._CategoryTitle]}>
                          {item.title}
                        </Text>
                      )}
                      {item.data.map((jobItem: any, index: number) => (
                        <JobCard key={index} item={jobItem} />
                      ))}
                    </View>
                  );
                }}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
               
              />
            )}
          </View>
        )}

        {/* PAST */}
        {activeIndex == 2 && (
          <View
            style={{
              flex: 1,
              marginHorizontal: Size.containerPadding,
              marginTop: Size.containerPadding,
            }}>
            {jobs.loading ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 50,
                }}>
                <ActivityIndicator color={colors.primary} size={'small'} />
              </View>
            ) : jobs.JobListPast.length == 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 50,
                }}>
                <Image source={_noData} style={{height: 150, width: 150}} />
              </View>
            ) : (
              <FlatList
                data={jobs.JobListPast}
                contentContainerStyle={{gap: Size.sm}}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}: {item: JobData; index: number}) => {
                  return (
                    <TouchableOpacity
                      key={item.ID}
                      activeOpacity={0.8}
                      style={styles._card}
                      onPress={() => {
                        navigation.navigate('Job', {
                          screen: 'JobFlow',
                          params: {item, isFromJobList: true},
                        });
                      }}>
                      <View style={styles.jobCardContent}>
                        <View style={styles.jobIconContainer}>
                          <Image
                            source={{
                              uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE,
                            }}
                            style={{
                              height: 45,
                              width: 45,
                              // marginTop: Size.containerPadding,
                            }}
                          />
                        </View>
                        <View style={styles.jobDetails}>
                          <View style={styles.jobHeader}>
                            <Text style={styles.jobTime}>
                              {moment(item.SCHEDULED_DATE_TIME).format('MMM Do YY,') +' '+convertTo12HourFormat(item.START_TIME)}
                            </Text>
                            <View
                              style={[
                                styles.initiatedTag,
                                {
                                  backgroundColor:item.STATUS=='CN'?'#f64646ff':  '#d5e4f8',
                                  
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.initiatedText,
                                  {color:item.STATUS === 'CN'?'#ffffff': '#1F5CC7'},
                                ]}>
                                {`${item.STATUS === 'CN' ? 'Cancelled' : 'Completed'}`}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.jobTitle}>
                            {item.SERVICE_NAME}
                          </Text>
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
                  );
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => {
                      getJobListPast('');
                    }}
                  />
                }
              />
            )}
          </View>
        )}
      </View>
      {/* </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  _container: {
    flex: 1,
  },
  _headerText: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: Size.lg,
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
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  _title: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _CategoryTitle: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  _job_id: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  _jobDate: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  _status: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    fontFamily: fontFamily,
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
    paddingVertical: 1,
    borderRadius: 7,
    marginRight: -28,
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
});

export default JobList;

interface TabSwitcherProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  setSearchKey: (key: string) => void;
}
const TabSwitcher: React.FC<TabSwitcherProps> = React.memo(
  ({activeIndex, setActiveIndex, setSearchKey}) => {
    const colors = useTheme();
    return (
      <View
        style={{
          borderWidth: 1,
          borderRadius: Size.base,
          borderColor: '#CBCBCB',
          height: 40,
          flexDirection: 'row',
          margin: Size.containerPadding,
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: activeIndex === 1 ? colors.primary2 : colors.white,
            width: '50%',
            height: '100%',
            borderTopLeftRadius: Size.base,
            borderBottomLeftRadius: Size.base,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setActiveIndex(1);
            setSearchKey('');
          }}>
          <Text
            style={{
              fontFamily: fontFamily,
              fontWeight: '500',
              fontSize: 15,
              color: activeIndex === 1 ? colors.white : colors.primaryText,
            }}>
            Assigned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: activeIndex === 2 ? colors.primary2 : colors.white,
            width: '50%',
            height: '100%',
            borderTopRightRadius: Size.base,
            borderBottomRightRadius: Size.base,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
          onPress={() => {
            setActiveIndex(2);
            setSearchKey('');
          }}>
          <Text
            style={{
              fontFamily: fontFamily,
              fontWeight: '500',
              fontSize: 15,
              color: activeIndex === 2 ? colors.white : colors.primaryText,
            }}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);
