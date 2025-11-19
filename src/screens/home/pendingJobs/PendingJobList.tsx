import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {HomeRoutes} from '../../../routes/Home';
import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {Button, Icon} from '../../../components';
import Modal from '../../../components/Modal';
import SuccessModal from '../../../components/SuccessModal';
import {useSelector} from '../../../context';
import moment from 'moment';
import Toast from '../../../components/Toast';
import {RootState} from '../../../context/reducers/store';

interface PendingJobListProps extends HomeRoutes<'PendingJobList'> {}
const PendingJobList: React.FC<PendingJobListProps> = ({navigation}) => {
  const colors = useTheme();
  const {user, techStatus} = useSelector((state: RootState) => state.app);
  const [unavailableDates, setUnavailableDates] = useState<any>({
    data1: [],
    data2: [],
  });

  const [openModal, setOpenModal] = useState({
    accept: false,
  });
  const [loader, setLoader] = useState({
    accept: false,
  });
  const [pendingJobs, setPendingJobs] = useState<{
    loading: boolean;
    jobs: JobData[];
  }>({
    loading: false,
    jobs: [],
  });
  const [showSuccess, setShowSuccess] = useState(false);
  // @ts-ignore
  const [selectedItem, setSelectedItem] = useState<JobData>({});

  useEffect(() => {
    getHolidays();
    getPendingJobs();
  }, []);

  const getPendingJobs = () => {
    try {
      setPendingJobs({...pendingJobs, loading: true});
      apiCall
        .post(`api/jobCard/getJobsForTechnician`, {
          TECHNICIAN_ID: user?.ID,
          filter: ` AND DATE(EXPECTED_DATE_TIME) >= '${moment().format(
            'YYYY-MM-DD',
          )}' AND TECHNICIAN_STATUS = 'P' AND IS_REMOTE_JOB = 0`,
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            console.log('oending', res.data.data);
            setPendingJobs({
              ...pendingJobs,
              jobs: res.data.data,
              loading: false,
            });
          }
        })
        .catch(err => {
          setPendingJobs({...pendingJobs, loading: false});
        });
    } catch (error) {
      console.log(error);
    }
  };
  // const getHolidays = () => {
  //   try {
  //     apiCall
  //       .post(`api/technician/getUnAvailablityOfTechnician`, {
  //         TECHNICIAN_ID: user?.ID,
  //       })
  //       .then(res => {
  //         if (res.status === 200) {
  //           const data1 = res.data.DATA1.map((item: any) => ({
  //             WEEK_DAY: item.WEEK_DAY,
  //             IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
  //           }));
  //           const data2 = res.data.DATA2.map((item: any) =>
  //             moment(item.DATE_OF_MONTH).format('YYYY-MM-DD')
  //           );
  //           setUnavailableDates({
  //             data1: data1,
  //             data2:res.data.DATA2,
  //           });
  //         }
  //       })
  //       .catch(err => {
  //         console.log('jobs err.....', err);
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const getHolidays = () => {
    try {
      apiCall
        .post(`api/technician/getUnAvailablityOfTechnician`, {
          TECHNICIAN_ID: user?.ID,
        })
        .then(res => {
          if (res.status === 200) {
            const data1 = res.data.DATA1.map((item: any) => ({
              WEEK_DAY: item.WEEK_DAY,
              IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
            }));
            const selfHolidayDates = res.data.DATA2.map((item: any) => ({
              DATE_OF_MONTH: moment(item.DATE_OF_MONTH).format('YYYY-MM-DD'),
              IS_SERIVCE_AVAILABLE: item.IS_SERIVCE_AVAILABLE,
            }));
            const autoWeekOffs: any[] = [];
            const daysToCheck = 30;
            for (let i = 0; i < daysToCheck; i++) {
              const date = moment().add(i, 'days');
              const weekDay = date.format('dd');
              const isWeekOff = data1.some(
                (entry: any) =>
                  entry.IS_SERIVCE_AVAILABLE === 0 &&
                  entry.WEEK_DAY === weekDay,
              );
              if (isWeekOff) {
                autoWeekOffs.push({
                  DATE_OF_MONTH: date.format('YYYY-MM-DD'),
                  IS_SERIVCE_AVAILABLE: false,
                });
              }
            }
            const mergedData2 = [
              ...selfHolidayDates,
              ...autoWeekOffs.filter(
                auto =>
                  !selfHolidayDates.some(
                    (self: any) => self.DATE_OF_MONTH === auto.DATE_OF_MONTH,
                  ),
              ),
            ];
            setUnavailableDates({
              data1,
              data2: mergedData2,
            });
          }
        })
        .catch(err => {
          console.log('getHolidays err.....', err);
        });
    } catch (error) {
      console.log('getHolidays catch err', error);
    }
  };
  const isUnavailable = (
    jobDate: any,
  ): {isBlockedDate: boolean; isDayBlocked: boolean} => {
    const formattedJobDate = moment(jobDate).format('YYYY-MM-DD');
    const dayOfWeek = moment(jobDate).format('dd');
    const isBlockedDate = unavailableDates.data2.some(
      (entry: any) =>
        moment(entry.DATE_OF_MONTH).format('YYYY-MM-DD') === formattedJobDate &&
        entry.IS_SERIVCE_AVAILABLE == false,
    );
    const isDayBlocked = unavailableDates.data1.some(
      (entry: any) =>
        entry.IS_SERIVCE_AVAILABLE == 0 && entry.WEEK_DAY === dayOfWeek,
    );
    return {isBlockedDate, isDayBlocked};
  };

  const handleAcceptJob = (item: JobData) => {
    setLoader({...loader, accept: true});
    try {
      const body = {
        TECHNICIAN_ID: user?.ID,
        STATUS: 'AS',
        USER_ID: user?.ID,
        JOB_CARD_NO: item.JOB_CARD_NO,
        NAME: user?.NAME,
        JOB_DATA: [{...item, TECHNICIAN_NAME: user?.NAME}],
      };
      console.log('payload...',JSON.stringify(body))
      apiCall.post('api/technician/updateJobStatus', body).then(async res => {
        console.log('1234567890----', res.data);
        if (res.status == 200 && res.data.code == 200) {
          setLoader({...loader, accept: false});
          setOpenModal({...openModal, accept: false});
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            navigation.goBack();
          }, 3000);
        } else if (res.status == 200 && res.data.code == 300) {
          setLoader({...loader, accept: false});
          Toast(res.data.message);
          setOpenModal({...openModal, accept: false});
        }
      });
    } catch (error) {
      console.log('error...', error);
    }
  };
  console.log('pendingJobs.jobs', pendingJobs.jobs);
  return (
    <SafeAreaView
      style={[styles._container, {backgroundColor: colors.background}]}>
      <View style={{flex: 1}}>
        {/* header */}
        <View
          style={{
            backgroundColor: '#FDFDFD',
            // backgroundColor: 'red',
            padding: Size.containerPadding,
          }}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={25}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <View
            style={{
              marginTop: Size.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={[
                styles._headerText,
                {flex: 1, color: colors.primaryText},
              ]}>
              Pending jobs
            </Text>
          </View>
        </View>
        {pendingJobs.loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            style={{padding: Size.containerPadding}}
            data={pendingJobs.jobs}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  getPendingJobs();
                  getHolidays();
                }}
                colors={[colors.primary]}
              />
            }
            renderItem={({item, index}) => {
              return (
                <View style={[styles._card, {gap: 8}]}>
                  <Text style={[styles._title, {color: colors.primary}]}>
                    {item.JOB_CARD_NO}
                  </Text>
                  <View style={styles._row}>
                    <Text style={styles._title}>Expected on</Text>
                    <Text style={styles._time}>
                      {moment(item.EXPECTED_DATE_TIME).format(
                        'DD/MM/YYYY, hh:mm A',
                      )}
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={styles._jobTitle}>{item.SERVICE_NAME}</Text>
                    <Text style={styles._duration}>
                      {item.ESTIMATED_TIME_IN_MIN} mins
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={styles._jobTitle}>{'Amount'}</Text>
                    <Text style={styles._duration}>
                      ₹ {Number(item.FINAL_ITEM_AMOUNT).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles._location}>{item.SERVICE_ADDRESS}</Text>
                  {user?.CAN_ACCEPT_JOB == 1 &&
                    (() => {
                      const {isBlockedDate, isDayBlocked} = isUnavailable(
                        item.EXPECTED_DATE_TIME,
                      );
                      if (isBlockedDate && isDayBlocked) {
                        return (
                          <Text
                            style={{
                              color: 'red',
                              fontWeight: '600',
                              fontFamily: fontFamily,
                            }}>
                            You are on holiday
                          </Text>
                        );
                      } else if (isBlockedDate && !isDayBlocked) {
                        return (
                          <Text
                            style={{
                              color: 'red',
                              fontWeight: '600',
                              fontFamily: fontFamily,
                            }}>
                            You are on holiday
                          </Text>
                        );
                      } else {
                        return (
                          <Button
                            label="Accept"
                            onPress={() => {
                              setSelectedItem(item);
                              setOpenModal({...openModal, accept: true});
                            }}
                            disable={!techStatus}
                          />
                        );
                      }
                    })()}
                </View>
              );
            }}
            ListEmptyComponent={
              <View>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: '500',
                    marginTop: Size.field * 2,
                    color: colors.black,
                  }}>
                  No Pending jobs!
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '500',
                    color: colors.description,
                    fontFamily: fontFamily,
                  }}>
                  You don't have any pending jobs right now
                </Text>
                <Button
                  primary={false}
                  style={{marginTop: Size['3xl'], marginHorizontal: 100}}
                  label="Back to Home"
                  onPress={() => navigation.goBack()}
                />
              </View>
            }
          />
        )}
      </View>
      {openModal.accept && (
        <Modal
          show={openModal.accept}
          onClose={() => {
            setOpenModal({...openModal, accept: false});
          }}>
          <View style={{paddingVertical: Size.base, gap: 8}}>
            <View style={styles._row}>
              <Text style={styles._title}>New job request</Text>
              <Text style={styles._time}>
                {moment(selectedItem.JOB_CREATED_DATE).format('HH:mm a')}
              </Text>
            </View>
            <View style={styles._row}>
              <Text style={styles._jobTitle}>{selectedItem.SERVICE_NAME}</Text>
              <Text style={styles._duration}>
                {selectedItem.ESTIMATED_TIME_IN_MIN} mins
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <Icon name="user" type="Feather" size={20} />
              <Text style={[styles._estimateTimeValue]}>
                {`${selectedItem.CUSTOMER_NAME} | ${selectedItem.CUSTOMER_MOBILE_NUMBER}`}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
              }}>
              <Icon
                name="home"
                type="SimpleLineIcons"
                size={18}
                style={{marginTop: 8}}
              />
              <Text style={[styles._estimateTimeValue, {flex: 1}]}>
                {`${selectedItem.SERVICE_ADDRESS}`}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <Icon name="currency-rupee" type="MaterialIcons" size={19} />
              <View style={styles._row}>
                <Text style={[styles._estimateTimeLabel]}>
                  {'Payment mode: '}
                </Text>
                {selectedItem.CUSTOMER_TYPE == 'I' && (
                  <Text style={[styles._estimateTimeValue]}>
                    {selectedItem.PAYMENT_MODE}
                  </Text>
                )}
                {selectedItem.CUSTOMER_TYPE == 'B' && (
                  <Text style={[styles._estimateTimeValue]}>{'NA'}</Text>
                )}
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <View style={styles._row}>
                <Text style={[styles._estimateTimeLabel]}>{'Amount: '}</Text>
                <Text style={[styles._estimateTimeValue]}>
                  {'₹' +
                    (selectedItem.FINAL_ITEM_AMOUNT
                      ? parseFloat(
                          selectedItem.FINAL_ITEM_AMOUNT,
                        ).toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                        })
                      : '0')}
                </Text>
              </View>
            </View>
            <View style={{height: Size.sm}} />
            <Button
              label="Accept"
              onPress={() => handleAcceptJob(selectedItem)}
              loading={loader.accept}
            />
          </View>
        </Modal>
      )}

      <SuccessModal
        visible={showSuccess}
        message="Job request accepted successfully!"
      />
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
    marginTop: Size.sm,
    padding: Size.lg,
    borderWidth: 1,
    borderColor: '#b094f550',
    borderRadius: 8,
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  _title: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _time: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _jobTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _duration: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _location: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
    marginBottom: Size.sm,
  },
  _estimateTimeLabel: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
    color: '#333333',
    letterSpacing: 0.2,
  },
  _estimateTimeValue: {
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 600,
    color: '#000000',
    letterSpacing: 0.2,
  },
});

export default PendingJobList;
