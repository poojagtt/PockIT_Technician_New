import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import {Button, Icon, TextInput} from '../../../components';
import {
  apiCall,
  fontFamily,
  GlobalStyle,
  IMAGE_URL,
  Permissions,
  Size,
  useTheme,
} from '../../../modules';
import {useSelector} from '../../../context';
import moment from 'moment';
import Modal from '../../../components/Modal';
import {_noData} from '../../../assets';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import {Modal as RNModal} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface NotificationItem {
  ARCHIVE_FLAG: string;
  ATTACHMENT: string;
  BACKOFFICE_ID: number | null;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  CUSTOMER_ID: number | null;
  DEPARTMENT_ID: number | null;
  DESCRIPTION: string;
  EMPLOYEE_ID: number | null;
  ID: number;
  IS_ACTIVE: number | null;
  JOB_CARD_NO: string | null;
  MEDIA_TYPE: string | null;
  MEMBER_ID: number;
  NOTIFICATION_TYPE: string;
  ORDER_ID: number | null;
  ORDER_NO: string | null;
  OWNER_ID: number;
  READ_ONLY: string;
  SEQ_NO: number | null;
  SERVICE_FULL_NAME: string | null;
  SERVICE_NAME: string | null;
  SHARING_TYPE: string | null;
  STATUS: string;
  TECHNICIAN_ID: number | null;
  TITLE: string;
  TOPIC_NAME: string | null;
  TYPE: string;
  VENDOR_ID: number | null;
}

const Notification: React.FC<{navigation: any}> = ({navigation}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loadingDownload, setLoadingDownload] = useState(false);

  const [fromDate, setFromDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState({
    showfromDate: false,
    showToDate: false,
  });
  const colors = useTheme();
  const [pageIndex, setPageIndex] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
console.log("here")
  const [toDate, setToDate] = useState(new Date());
  const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState<boolean>(true);
  const [openFilterModal, setFilterModal] = useState<boolean>(false);
  const [expandedNotifications, setExpandedNotifications] = useState<{
    [key: string]: boolean;
  }>({});
  const [activeTab, setActiveTab] = useState(0);

  const getNotification = async (
    searchValue: string,
    fromDate?: Date,
    toDate?: Date,
    isLoadMore: boolean = false,
  ) => {
    if (!isLoadMore) {
      setLoading(true);
    } else {
      if (!hasMore || isLoadingMore) return;
      setIsLoadingMore(true);
    }

    try {
      let filter = ` AND MEMBER_ID = ${user?.ID} AND TYPE="T"`;
      if (searchValue) {
        filter += ` AND (TITLE LIKE '%${searchValue}%' OR DESCRIPTION LIKE '%${searchValue}%')`;
      }
      if (activeTab == 1) {
        filter += ` AND (NOTIFICATION_TYPE = "J" OR NOTIFICATION_TYPE = "F" OR NOTIFICATION_TYPE = "JR" OR NOTIFICATION_TYPE ="N") `;
      }
      if (activeTab == 2) {
        filter += ` AND NOTIFICATION_TYPE = "T" AND TYPE = "T"`;
      }
      if (fromDate && toDate) {
        const fromDateStr = moment(fromDate).format('YYYY-MM-DD');
        const toDateStr = moment(toDate).format('YYYY-MM-DD');
        filter += ` AND (DATE(CREATED_MODIFIED_DATE) BETWEEN '${fromDateStr}' AND '${toDateStr}') `;
      }
      const response = await apiCall.post('api/notification/get', {
        filter,
        pageIndex: isLoadMore ? pageIndex : 1,
        pageSize: 10,
      });
      if (response.data?.data) {
        console.log("notifications",response.data.data)
        const newData = response.data.data;
        if (isLoadMore) {
          if (newData.length === 0) {
            setHasMore(false);
            return;
          }
          setNotifications(prev => [...prev, ...newData]);
        } else {
          setNotifications(newData);
          setHasMore(true);
        }
        setPageIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error getting Notification', error);
      setHasMore(false);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    setPageIndex(1);
    setHasMore(true);
    getNotification('');
  }, [activeTab]);

  const categorizeNotifications = () => {
    const today = moment().startOf('day');
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');

    const categorizedData: {
      Today: NotificationItem[];
      'This week': NotificationItem[];
      Older: NotificationItem[];
    } = {
      Today: [],
      'This week': [],
      Older: [],
    };

    notifications.forEach((item: NotificationItem) => {
      const notificationDate = moment(
        item.CREATED_MODIFIED_DATE,
        'YYYY-MM-DD HH:mm:ss',
      );

      if (notificationDate.isSame(today, 'day')) {
        categorizedData.Today.push(item);
      } else if (notificationDate.isBetween(weekStart, weekEnd, 'day', '[]')) {
        categorizedData['This week'].push(item);
      } else {
        categorizedData.Older.push(item);
      }
    });

    return categorizedData;
  };

  const categorizedNotifications = categorizeNotifications();

  const finalList = [];
  if (categorizedNotifications.Today.length > 0) {
    finalList.push({type: 'header', title: 'Today'});
    finalList.push(...categorizedNotifications.Today);
  }
  if (categorizedNotifications['This week'].length > 0) {
    finalList.push({type: 'header', title: 'This week'});
    finalList.push(...categorizedNotifications['This week']);
  }
  if (categorizedNotifications.Older.length > 0) {
    finalList.push({type: 'header', title: 'Older'});
    finalList.push(...categorizedNotifications.Older);
  }

  const requestStoragePermission = async (
    fileUrl: string,
    fileName: string,
  ) => {
    // No storage permission needed; proceed to download
    downloadFile(fileUrl, fileName);
  };

const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      setLoadingDownload(true);
      if (Platform.OS === 'android') {
        const mime = '*/*';
        await RNFetchBlob.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: 'Downloading attachment',
            mime,
            mediaScannable: true,
          },
        }).fetch('GET', fileUrl);
        Alert.alert('Download Complete', 'File saved in Downloads');
      } else {
        // iOS: save inside app sandbox (Documents). To expose to user you can share the file or save to Photos.
        const dest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        const options = {fromUrl: fileUrl, toFile: dest};
        const result = await RNFS.downloadFile(options).promise;
        if (result.statusCode === 200) {
          Alert.alert('Download Complete', `File saved to ${dest}`);
          // Optional: show share sheet so user can save/export the file
          // import Share from 'react-native-share' and uncomment below:
          // await Share.open({ url: 'file://' + dest, failOnCancel: false });
 
          // Optional: to save images to Photos, use react-native-cameraroll:
          // import CameraRoll from '@react-native-community/cameraroll';
          // await CameraRoll.save(dest, { type: 'photo' });
        } else {
          Alert.alert('Download Failed', 'File could not be downloaded.');
        }
      }
    } catch (err) {
      console.error('Download Error:', err);
      Alert.alert('Error', 'File download failed.');
    } finally {
      setLoadingDownload(false);
    }
  };

  const toggleReadMore = (id: string) => {
    setExpandedNotifications(prevState => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}

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
            style={[styles.headerText, {flex: 1, color: colors.primaryText}]}>
            Notification
          </Text>
        </View>
      </View>

      <View style={{backgroundColor: colors.white}}>
        <TextInput
          leftChild={<Icon size={30} name="search" type="EvilIcons" />}
          style={{marginHorizontal: 12, marginTop: 12}}
          placeholder="Search..."
          value={searchValue}
          onChangeText={value => {
            setSearchValue(value);
            getNotification(value);
          }}
          rightChild={
            <TouchableOpacity
              onPress={() => setFilterModal(!openFilterModal)}
              style={{
                elevation: 5,
                backgroundColor: 'white',
                margin: 0,
                borderRadius: 5,
                marginRight: -8,
              }}>
              <Icon
                style={{padding: 6}}
                size={30}
                name="filter"
                type="AntDesign"
              />
            </TouchableOpacity>
          }
        />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 0 && styles.activeTab]}
          onPress={() => {
            setPageIndex(1);
            setActiveTab(0);
          }}>
          <Text
            style={[
              styles.tabText,
              {color: activeTab == 0 ? colors.primary : colors.text},
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 1 && styles.activeTab]}
          onPress={() => {
            setPageIndex(1);
            setActiveTab(1);
          }}>
          <Text
            style={[
              styles.tabText,
              {color: activeTab == 1 ? colors.primary : colors.text},
            ]}>
            Jobs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 2 && styles.activeTab]}
          onPress={() => {
            setPageIndex(1);
            setActiveTab(2);
          }}>
          <Text
            style={[
              styles.tabText,
              {color: activeTab == 2 ? colors.primary : colors.text},
            ]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary2} />
        </View>
      ) : (
        <FlatList
          style={{paddingHorizontal: Size.containerPadding}}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => getNotification('')}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                source={_noData}
                style={{height: 150, width: 150, marginTop: 100}}
              />
            </View>
          }
          ListFooterComponent={() => {
            if (isLoadingMore) {
              return (
                <View style={{paddingVertical: 20, alignItems: 'center'}}>
                  <ActivityIndicator size="small" color={colors.primary2} />
                </View>
              );
            }
            return null;
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          data={finalList}
          keyExtractor={(item: any, index: number) =>
            item.type === 'header'
              ? `header-${item.title}-${index}`
              : `notification-${item.ID}-${index}`
          }
          renderItem={({item}: {item: any}) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionTitle}>{item.title}</Text>;
            }
            const fileExtension = item.ATTACHMENT
              ? item.ATTACHMENT.split('.').pop().toLowerCase()
              : '';
            return (
              <View style={styles.notificationItem}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.notificationTitle, {flexShrink: 1}]}>
                    {item.TITLE.replace(/\*/g, '')}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {moment(item.CREATED_MODIFIED_DATE).format('hh:mm A')}
                  </Text>
                </View>
                <View>
                  <View style={{flexDirection: 'row'}}>
                    <View style={{flex: 1}}>
                      <Text
                        style={styles.notificationDescription}
                        numberOfLines={
                          expandedNotifications[item.ID] ? undefined : 2
                        }>
                        {item.DESCRIPTION}
                      </Text>
                      {item.DESCRIPTION.length > 100 && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => toggleReadMore(item.ID)}>
                          <Text style={styles.readMoreText}>
                            {expandedNotifications[item.ID]
                              ? 'Read Less'
                              : 'Read More'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {item.ATTACHMENT && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.download}
                        onPress={() =>
                          requestStoragePermission(
                            `${IMAGE_URL}notificationAttachment/${item.ATTACHMENT}`,
                            item.ATTACHMENT,
                          )
                        }>
                        <Text style={styles.downloadtxt}>Download</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {(fileExtension === 'jpg' || fileExtension === 'png') &&
                    item.ATTACHMENT && (
                      <Image
                        source={{
                          uri: `${IMAGE_URL}notificationAttachment/${item.ATTACHMENT}`,
                        }}
                        style={{
                          width: '100%',
                          height: 100,
                          resizeMode: 'stretch',
                          marginTop: 10,
                        }}
                      />
                    )}
                </View>
              </View>
            );
          }}
          onEndReached={() => {
            if (!hasMore || isLoadingMore) return;
            const hasDateFilter =
              fromDate &&
              toDate &&
              fromDate.toDateString() !== new Date().toDateString() &&
              toDate.toDateString() !== new Date().toDateString();
            getNotification(
              searchValue,
              hasDateFilter ? fromDate : undefined,
              hasDateFilter ? toDate : undefined,
              true,
            );
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      <Modal
        title="Select Dates"
        onClose={() => setFilterModal(false)}
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
              onPress={() =>
                setShowDatePicker({...showDatePicker, showfromDate: true})
              }>
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
              onPress={() =>
                setShowDatePicker({...showDatePicker, showToDate: true})
              }>
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

          {/* <DatePicker
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
          /> */}

          {/* <DatePicker
            modal
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
            maximumDate={new Date()}
          /> */}
         {showDatePicker.showfromDate && (
  Platform.OS === 'ios' ? (
    <RNModal
      transparent
      animationType="fade"
      visible={showDatePicker.showfromDate}
      onRequestClose={() => setShowDatePicker({...showDatePicker, showfromDate: false})}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          width: '90%',
          alignItems: 'center'
        }}>
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) setFromDate(selectedDate);
            }}
          />
          <Button
            label="Done"
            style={{marginTop: 10, width: 100}}
            onPress={() => setShowDatePicker({...showDatePicker, showfromDate: false})}
          />
        </View>
      </View>
    </RNModal>
  ) : (
    <DateTimePicker
      value={fromDate || new Date()}
      mode="date"
      display="default"
      maximumDate={new Date()}
      onChange={(event, selectedDate) => {
        setShowDatePicker({...showDatePicker, showfromDate: false});
        if (event.type === 'set' && selectedDate) setFromDate(selectedDate);
      }}
    />
  )
)}

{showDatePicker.showToDate && (
  Platform.OS === 'ios' ? (
    <RNModal
      transparent
      animationType="fade"
      visible={showDatePicker.showToDate}
      onRequestClose={() => setShowDatePicker({...showDatePicker, showToDate: false})}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          width: '90%',
          alignItems: 'center'
        }}>
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            minimumDate={fromDate}
            display="spinner"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) setToDate(selectedDate);
            }}
          />
          <Button
            label="Done"
            style={{marginTop: 10, width: 100}}
            onPress={() => setShowDatePicker({...showDatePicker, showToDate: false})}
          />
        </View>
      </View>
    </RNModal>
  ) : (
    <DateTimePicker
      value={toDate || new Date()}
      mode="date"
      minimumDate={fromDate}
      display="default"
      maximumDate={new Date()}
      onChange={(event, selectedDate) => {
        setShowDatePicker({...showDatePicker, showToDate: false});
        if (event.type === 'set' && selectedDate) setToDate(selectedDate);
      }}
    />
  )
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
              setPageIndex(1);
              getNotification(searchValue, fromDate, toDate);
              setFilterModal(false);
            }}
          />
          <View style={{width: 10}} />
          <Button
            style={{flex: 1}}
            label="Clear"
            onPress={() => {
              setPageIndex(1);
              getNotification(searchValue);
              setFilterModal(false);
              setFromDate(new Date());
              setToDate(new Date());
            }}
          />
        </View>
      </Modal>
      {/* Full-Screen Loader for Language Update */}
      {loadingDownload && (
        <RNModal
          transparent={true}
          animationType="none"
          visible={loadingDownload}>
          <View style={styles._loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </RNModal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  readMoreText: {
    color: '#3170DE',
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    textAlign: 'right',
    fontFamily: fontFamily,
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    // padding: 14,
  },
  header: {
    gap: 8,
    paddingBottom: 10,
    padding: 14,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.68,
    fontFamily: fontFamily,
  },
  notificationItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: Size.lg,
    borderRadius: Size.radius,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#092B9C',
    marginBottom: 8,
    fontFamily: fontFamily,
    lineHeight: 19,
    paddingBottom: 5,
    borderColor: '#ECECEC',
    paddingTop: 20,
  },
  notificationTitle: {
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fontFamily,
    lineHeight: 15,
    marginLeft: 10,
    marginTop: 10,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 10,
    marginTop: 10,
    fontFamily: fontFamily,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontFamily: fontFamily,
  },
  viewButton: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  download: {
    backgroundColor: '#3170DE',
    padding: 8,
    borderRadius: 8,
    marginLeft: 15,
    width: 100,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    height: 35,
  },
  downloadtxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    padding: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'blue',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 500,
    fontFamily: fontFamily,
  },

  contentContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width * 3, // Assuming 3 tabs
  },
  tabContent: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabContentText: {
    fontSize: 18,
    color: 'white',
  },
});

export default Notification;

