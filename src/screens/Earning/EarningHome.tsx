import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {apiCall, fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import {Button, Icon, TextInput} from '../../components';
import moment from 'moment';
import {EarningRoutes} from '../../routes/Earning';
import {useSelector} from '../../context';
import {useFocusEffect} from '@react-navigation/native';
import {_noData} from '../../assets';
import Modal from '../../components/Modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Modal as RNModal } from 'react-native';

interface PendingJobListProps extends EarningRoutes<'EarningHome'> {}
const EarningHome: React.FC<PendingJobListProps> = ({navigation}) => {
  const colors = useTheme();
  const [selectedData, setSelectedData] = useState('all');
  const {user} = useSelector(state => state.app);
  const [jobData, setJobData] = useState<JOB_WISE_EARNINGS[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDateFilter, setIsDateFilter] = useState(false);
  const [openFilterModal, setFilterModal] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState({
    showfromDate: false,
    showToDate: false,
  });
  const [toDate, setToDate] = useState(new Date());

  const data = [
    {label: 'All', id: 'all'},
    {label: 'Today', id: 'today'},
    {label: 'Last Week', id: 'lastWeek'},
    {label: 'Last Month', id: 'lastMonth'},
    {label: 'Select Date', id: 'selectDate'},
  ];
  const [tempFromDate, setTempFromDate] = useState(fromDate);
const [tempToDate, setTempToDate] = useState(toDate);
console.log('From Date (min):', fromDate);

  const [searchValue, setSearchValue] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  useFocusEffect(
    useCallback(() => {
      getServices();
      return () => {
        // console.log('Screen is unfocused');
      };
    }, []),
  );
  const getServices = () => {
    setLoading(true);
    const body = {TECHNICIAN_ID: user?.ID};
    try {
      apiCall
        .post('api/reports/getTechnicianEarnings', body)
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            console.log("earnings",res.data)
            setLoading(false);
            setJobData(res.data.JOB_WISE_EARNINGS);
          }
        })
        .catch(err => {
          setLoading(false);
        });
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };
  const filterData = () => {
    const currentDate = moment();
    const dateFormat = 'YYYY-MM-DD HH:mm:ss';
    let filteredJobs = jobData;
    switch (selectedData) {
      case 'today':
        filteredJobs = jobData.filter(job =>
          moment(job.JOB_COMPLETED_DATETIME, dateFormat).isSame(
            currentDate,
            'day',
          ),
        );
        break;
      case 'lastWeek':
        filteredJobs = jobData.filter(job =>
          moment(job.JOB_COMPLETED_DATETIME, dateFormat).isBetween(
            currentDate.clone().subtract(1, 'week').startOf('week'),
            currentDate.clone().subtract(1, 'week').endOf('week'),
            null,
            '[]',
          ),
        );
        break;
      case 'lastMonth':
        filteredJobs = jobData.filter(job =>
          moment(job.JOB_COMPLETED_DATETIME, dateFormat).isBetween(
            currentDate.clone().subtract(1, 'month').startOf('month'),
            currentDate.clone().subtract(1, 'month').endOf('month'),
          ),
        );
        break;
      case 'selectDate':
        if (isDateFilter && fromDate && toDate) {
          const formattedFromDate = moment(fromDate).startOf('day');
          const formattedToDate = moment(toDate).endOf('day');
          filteredJobs = jobData.filter(job =>
            moment(job.JOB_COMPLETED_DATETIME).isBetween(
              formattedFromDate,
              formattedToDate,
              null,
              '[]',
            ),
          );
        }

        break;

      case 'all':
      default:
        break;
    }
    const totalEarnings = filteredJobs.reduce(
      (total, job) => total + (parseFloat(job.TECHNICIAN_COST) || 0),
      0,
    );
    return {filteredJobs, totalEarnings};
  };
  const {filteredJobs, totalEarnings} = filterData();

  return (
    <SafeAreaView
      style={[styles._container, {backgroundColor: colors.background}]}>

       
      <View style={{flex: 1}}>
        {/* header */}
        <View
          style={{
            backgroundColor: '#FDFDFD',
            paddingHorizontal: Size.containerPadding,
            padding: Size.containerPadding,
          }}>
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
              Earnings
            </Text>
          </View>
        </View>

        
        {user?.CAN_VIEW_SERVICE_PRICES_SUMMARY == 1 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              margin: Size.containerPadding,
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
                value={searchValue}
                onChangeText={value => {
                  setSearchValue(value);
                }}
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
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
          </View>
        )}

        {isDateFilter&& <View style={{marginHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:8,borderColor:colors.text,borderWidth:0.5,borderRadius:8}}>
          <Text>{`${fromDate.toDateString()} to ${toDate.toDateString()}`}</Text>
          <TouchableOpacity onPress={()=>{
            setIsModalVisible(false);
              setIsDateFilter(false);
              setFilterModal(false);
              setFromDate(new Date());
              setToDate(new Date());
          }}>
            <Icon name='close' type='AntDesign'></Icon>
          </TouchableOpacity>
        </View>}
        {user?.CAN_VIEW_SERVICE_PRICES_SUMMARY == 1 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Size.containerPadding,
              backgroundColor: '#FDFDFD',
              gap: 10,
            }}>
            <View
              style={{
                flex: 1,
                padding: Size.padding,
                paddingLeft: Size.containerPadding,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#98B7EF',
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 20,
                  fontWeight: '500',
                  color: colors.primary2,
                }}>
                ₹ {totalEarnings}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.primaryText,
                }}>
                Earnings
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: Size.padding,
                paddingLeft: Size.containerPadding,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#98B7EF',
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 20,
                  fontWeight: '500',
                  color: colors.primary2,
                }}>
                {filteredJobs.length}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.primaryText,
                }}>
                Services
              </Text>
            </View>
          </View>
        )}
        {user?.CAN_VIEW_SERVICE_PRICES_SUMMARY == 1 ? (
          <View
            style={{
              flex: 1,
              marginHorizontal: Size.containerPadding,
            }}>
            <Text
              style={{
                marginVertical: 10,
                fontFamily: fontFamily,
                fontSize: 16,
                color: colors.primaryText,
                fontWeight: '400',
              }}>
              Services
            </Text>
            <FlatList
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => getServices()}
                />
              }
              style={{marginBottom: Size.lg}}
              data={
                searchValue
                  ? filteredJobs.filter(
                      item =>
                        item.JOB_CARD_NO.toLowerCase().includes(
                          searchValue.toLowerCase(),
                        ) ||
                       item.TECHNICIAN_COST && item.TECHNICIAN_COST.toLowerCase().includes(
                          searchValue.toLowerCase(),
                        ),
                    )
                  : filteredJobs
              }
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              ListEmptyComponent={
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image source={_noData} style={{height: 150, width: 150}} />
                </View>
              }
              renderItem={({item, index}) => {
                return (
                  <View style={styles._card}>
                    <View style={styles._row}>
                      <Text
                        style={[
                          styles._job_id,
                          {color: colors.primaryText},
                        ]}>{`${item.JOB_CARD_NO}`}</Text>
                      <Text
                        style={[
                          styles._job_id,
                          {color: colors.primaryText},
                        ]}>{`₹ ${item.TECHNICIAN_COST ?? 0}`}</Text>
                    </View>
                    <View style={styles._row}>
                      <Text style={styles._jobDate}>
                        {moment(item.JOB_COMPLETED_DATETIME).format(
                          'ddd, MMM D | h:mm A',
                        )}
                      </Text>
                      <Text style={styles._jobDate}>Commission</Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginHorizontal: Size.containerPadding,
            }}>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 17,
                color: colors.primary,
                textAlign: 'center',
                fontWeight: 600,
              }}>
              You don't have permission to view this page.
            </Text>
          </View>
        )}
      </View>

      
      {isModalVisible && (
        <Modal
          show={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          style={{justifyContent: 'flex-end', borderRadius: 0}}
          containerStyle={{
            borderRadius: 10,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            margin: 0,
            backgroundColor: colors.white,
          }}>
          <View style={{}}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsModalVisible(false)}
              style={{
                position: 'absolute',
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.white,
                padding: 6,
                borderRadius: 100,
                top: -65,
              }}>
              <Icon name="close" type="Ionicons" size={28} />
            </TouchableOpacity>
            <View>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.primaryText,
                }}>
                Sort
              </Text>
              <View style={{padding: Size.sm}}>
                {data.map((item, index) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (item.id == 'selectDate') {
                          setIsModalVisible(false);
                          setFilterModal(true);
                          setSelectedData(item.id);
                        } else {
                          setSelectedData(item.id);
                          setIsModalVisible(false);
                        }
                      }}
                      key={index}
                      style={{
                        marginBottom: 5,
                        borderWidth: 1.5,
                        borderColor:
                          item.id == selectedData
                            ? colors.primary2
                            : colors.white,
                        padding: Size.padding,
                        paddingHorizontal: Size.containerPadding,
                        borderRadius: 8,
                        backgroundColor:
                          item.id == selectedData ? '#F5F9FF' : colors.white,
                      }}>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 16,
                          fontWeight: '500',
                          color:
                            item.id == selectedData
                              ? colors.primaryText
                              : colors.primaryText2,
                        }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        title="Select Dates"
        onClose={() => {
          // setIsModalVisible(false);
          setIsDateFilter(false);
          setFilterModal(false);
        }}
        visible={openFilterModal}
        show={openFilterModal}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
          }}>
          <View style={{flex: 1}}>
            <Text
              style={[GlobalStyle.fieldLabel, {color: colors.text}]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              From Date
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                GlobalStyle.field,
                {
                  borderColor: colors.primary,
                  marginTop: 3,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}
             onPress={() => {
  setTempFromDate(fromDate);
  setShowDatePicker({...showDatePicker, showfromDate: true});
}}>
              <Text
                style={{
                  textAlign: 'left',
                  flex: 1,
                  color: colors.text,
                  fontFamily: fontFamily,
                }}>
                {fromDate ? fromDate.toDateString() : 'Select From Date'}
              </Text>
              <Icon name="calendar" type="AntDesign" color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{width: 10}}></View>
          <View style={{flex: 1}}>
            <Text
              style={[GlobalStyle.fieldLabel, {color: colors.text}]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              To Date
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                GlobalStyle.field,
                {
                  borderColor: colors.primary,
                  marginTop: 3,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}
             onPress={() => {
              setTempFromDate(fromDate);
  setTempToDate(toDate);
  setShowDatePicker({...showDatePicker, showToDate: true});
}}>
              <Text
                style={{
                  textAlign: 'left',
                  flex: 1,
                  color: colors.text,
                  fontFamily: fontFamily,
                }}>
                {toDate ? toDate.toDateString() : 'Select To Date'}
              </Text>
              <Icon name="calendar" type="AntDesign" color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* {showDatePicker.showfromDate && (
            <DatePicker
              modal
              open={showDatePicker.showfromDate}
              date={fromDate || new Date()}
              mode="date"
              onConfirm={selectedDate => {
                setFromDate(selectedDate);
                setShowDatePicker({...showDatePicker, showfromDate: false});
              }}
              onCancel={() => {
                setShowDatePicker({...showDatePicker, showfromDate: false});
              }}
              maximumDate={new Date()}
            />
          )}
          {showDatePicker.showToDate && (
            <DatePicker
              modal
              minimumDate={fromDate}
              open={showDatePicker.showToDate}
              date={toDate || new Date()}
              mode="date"
              onConfirm={selectedDate => {
                setToDate(selectedDate);
                setShowDatePicker({...showDatePicker, showToDate: false});
              }}
              onCancel={() => {
                setShowDatePicker({...showDatePicker, showToDate: false});
              }}
            />
          )} */}
{Platform.OS === 'ios' && showDatePicker.showfromDate && (
  <RNModal
    transparent
    animationType="slide"
    visible={showDatePicker.showfromDate}
    onRequestClose={() =>
      setShowDatePicker({...showDatePicker, showfromDate: false})
    }>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <View style={{ backgroundColor: '#fff', paddingBottom: 20 ,alignItems:'center'}}>
        <DateTimePicker
          value={tempFromDate || new Date()}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (selectedDate) setTempFromDate(selectedDate);
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 ,marginHorizontal:16 }}>
          <View style={{flex:1}}>
            <Button
            label="Cancel"
            onPress={() => setShowDatePicker({...showDatePicker, showfromDate: false})}
          />
          </View>
         <View style={{width:16}}></View>
         <View style=
         {{flex:1}}>
           <Button
            label="Done"
            onPress={() => {
              setFromDate(tempFromDate);
              setShowDatePicker({...showDatePicker, showfromDate: false});
            }}
          />
         </View>
        </View>
      </View>
    </View>
  </RNModal>
)}
{Platform.OS === 'ios' && showDatePicker.showToDate && (
  <RNModal
    transparent
    animationType="slide"
    visible={showDatePicker.showToDate}
    onRequestClose={() =>
      setShowDatePicker({...showDatePicker, showToDate: false})
    }>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <View style={{ backgroundColor: '#fff', paddingBottom: 20,alignItems:'center' }}>
        <DateTimePicker
         maximumDate={new Date()}
          value={tempToDate || new Date()}
          mode="date"
          display="spinner"
         
          minimumDate={fromDate}
          onChange={(event, selectedDate) => {
            if (selectedDate) setTempToDate(selectedDate);
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 ,marginHorizontal:16}}>
         <View style={{flex:1}}>
           <Button
            label="Cancel"
            onPress={() => setShowDatePicker({...showDatePicker, showToDate: false})}
          />
         </View>
          <View style={{ width: 16 }} />
         <View style={{flex:1}}>
           <Button
            label="Done"
            onPress={() => {
              setToDate(tempToDate);
              setShowDatePicker({...showDatePicker, showToDate: false});
            }}
          />
         </View>
        </View>
      </View>
    </View>
  </RNModal>
)}

  {Platform.OS === 'android' && showDatePicker.showfromDate && (
  <DateTimePicker
    value={fromDate || new Date()}
    mode="date"
    display="default"
    maximumDate={new Date()}
    onChange={(event, selectedDate) => {
      setShowDatePicker({...showDatePicker, showfromDate: false});
      if (event.type === 'set' && selectedDate) {
        setFromDate(selectedDate);
      }
    }}
  />
)}
{Platform.OS === 'android' && showDatePicker.showToDate && (
  <DateTimePicker
    value={toDate || new Date()}
    mode="date"
    display="default"
    minimumDate={fromDate}
    onChange={(event, selectedDate) => {
      setShowDatePicker({...showDatePicker, showToDate: false});
      if (event.type === 'set' && selectedDate) {
        setToDate(selectedDate);
      }
    }}
  />
)}
         
        </View>

        <View
          style={{
            marginTop: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Button
            style={{flex: 1}}
            label="Apply"
            onPress={() => {
              setIsModalVisible(false);
              setIsDateFilter(true);
              setFilterModal(false);
            }}
          />
          <View style={{width: 10}} />
          <Button
            style={{flex: 1}}
            label="Clear"
            onPress={() => {
              setIsModalVisible(false);
              setIsDateFilter(false);
              setFilterModal(false);
              setFromDate(new Date());
              setToDate(new Date());
            }}
          />
        </View>
      </Modal>
     





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
    padding: Size.lg,
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
    borderWidth: 0.5,
    borderColor: '#e7e5e5',
    marginBottom: 12,
    gap: 5,
  },
  _row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  _job_id: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  _jobDate: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    fontFamily: fontFamily,
  },
});

export default EarningHome;



