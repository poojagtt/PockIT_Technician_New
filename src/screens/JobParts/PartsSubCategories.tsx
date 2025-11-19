import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Button, Icon, TextInput} from '../../components';
import {apiCall, BASE_URL, fontFamily, Size, useTheme} from '../../modules';
import moment from 'moment';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_noData, _noProfile} from '../../assets';
import SuccessModal from '../../components/SuccessModal';
import {JobRoutes} from '../../routes/Job';
import {resetAndNavigate} from '../../utils';
import Toast from '../../components/Toast';
import CheckBox from '@react-native-community/checkbox';
interface Category {
  NAME: string;
  ICON: any;
}

interface PartsSubCategories extends JobRoutes<'PartsSubCategories'> {}
const PartsSubCategories: React.FC<PartsSubCategories> = ({
  navigation,
  route,
}) => {
  const {item, jobItem} = route.params;
  const [searchValue, setSearchValue] = useState('');
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [Inventories, setInventories] = useState<InventoryItem[]>([]);
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const {selectedPart} = useSelector(state => state.part);
  const dispatch = useDispatch();
  const [showSuccess, setShowSuccess] = useState(false);
  const flatListRef = useRef<FlatList<Category>>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>({});

  useEffect(() => {
    getPartsSubCategory();
    jobItem.IS_PARENT == 0 && getCustomerInfo();
  }, []);
  const getInventories = (searchValue: string) => {
    setListLoading(true);
    try {
      apiCall
        .post(`api/inventory/getItemsForTechnician`, {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND INVENTORY_NAME LIKE '%${searchValue}%' AND (INVENTORY_TYPE = 'B' OR INVENTORY_TYPE = 'S') AND STATUS = 1 `,
          TECHNICIAN_ID: user?.ID,
        })
        .then(res => {
          if (res.data.code === 200) {
            setInventories(res.data.data);
            setListLoading(false);
          }
        })
        .catch(err => {
          setListLoading(false);
          console.log('category err.....', err);
        });
    } catch (error) {
      setListLoading(false);
      console.log(error);
    }
  };

  const getCustomerInfo = async () => {
    try {
      const res = await apiCall.post('api/customer/get', {
        filter: ` AND ID = ${jobItem.CUSTOMER_ID} `,
      });
      if (res.status == 200) {
        // console.log('res...', res.data);
        setCustomerData(res.data.data[0]);
      }
    } catch (error) {
      console.log('err....---', error);
    }
  };

  const getPartsSubCategory = () => {
    setListLoading(true);
    try {
      apiCall
        .post(`api/inventorySubCategory/getSubCategoryForTechnician`, {
          filter: `AND IS_ACTIVE = 1 AND INVENTRY_CATEGORY_ID = ${item.ID}`,
          TECHNICIAN_ID: user?.ID,
        })
        .then(res => {
          if (res.data.code === 200) {
            const sortedCategories = res.data.data.sort(
              (a: Category, b: Category) => a.NAME.localeCompare(b.NAME),
            );
            setListLoading(false);
            setSubCategories(sortedCategories);
          }
        })
        .catch(err => {
          setListLoading(false);
        });
    } catch (error) {
      setListLoading(false);
    }
  };
  const scrollToLetter = (letter: string) => {
    const index = subCategories.findIndex(item =>
      item.NAME.toUpperCase().startsWith(letter),
    );
    if (index !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({index, animated: true});
      } catch (error) {
        flatListRef.current.scrollToOffset({offset: 0, animated: true});
      }
    } else {
      console.log('Letter not found in categories');
    }
  };
  useEffect(() => {
    if (subCategories.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({index: 0, animated: true});
    }
  }, [subCategories]);
  const [showEmailModal, setEmailModal] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const getEmails = () => {
    setLoading(true);
    const totalAmount = selectedPart.reduce(
      (acc: number, item: InventoryItem) =>
        acc + (Number(item.SELLING_PRICE) || 0),
      0,
    );
    try {
      apiCall
        .post(`api/customerEmailMapping/get`, {
          filter: ` AND PRICE_RANGE<= ${totalAmount} AND CUSTOMER_ID= ${
            jobItem.IS_PARENT == 0
              ? customerData.PARENT_ID
              : jobItem.CUSTOMER_ID
          } AND IS_ACTIVE=1`,
        })
        .then(res => {
          if (res.data.code === 200) {
            setLoading(false);
            setEmailModal(true);
            setEmails(res.data.data);
          }
        })
        .catch(err => {
          setLoading(false);
          console.log('category err.....', err);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const toggleSelection = (item: any) => {
    setSelectedEmails(prev => {
      const exists = prev.find((e: any) => e.ID === item.ID);
      if (exists) {
        return prev.filter((e: any) => e.ID !== item.ID);
      } else {
        return [...prev, item];
      }
    });
  };

  const isSelected = (item: InventoryItem) => {
    return selectedPart.some(
      (selectedPart: any) => selectedPart.ID === item.ID,
    );
  };
  const addInventory = () => {
    try {
      setLoading(true);
      const INVENTORY_DATA = selectedPart.map((item: InventoryItem) => {
        return {
          JOB_CARD_ID: jobItem.ID,
          INVENTORY_ID: item.IS_MANUAL ? 0 : item.INVENTORY_ID,
          INVENTORY_NAME: item.INVENTORY_NAME,
          TECHNICIAN_ID: user?.ID || 0,
          CUSTOMER_ID: jobItem.CUSTOMER_ID,
          QUANTITY: 1,
          RATE: item.SELLING_PRICE,
          TAX_RATE: 0,
          REQUESTED_DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
          STATUS: 'P',
          REMARK: '',
          CLIENT_ID: 1,
          TOTAL_AMOUNT: 0,
          WAREHOUSE_ID: 1,
          BATCH_NO: item.BATCH_NO,
          SERIAL_NO: item.SERIAL_NO,
          ACTUAL_UNIT_ID: item.UNIT_ID,
          ACTUAL_UNIT_NAME: item.UNIT_NAME,
          INVENTORY_TRACKING_TYPE: item.INVENTORY_TRACKING_TYPE,
          IS_VARIANT: item.IS_VARIENT,
          PARENT_ID: item.PARENT_ID,
          QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
        };
      });
      const body = {
        JOB_CARD_ID: jobItem.ID,
        JOB_CARD_NO: jobItem.JOB_CARD_NO,
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        CUSTOMER_ID: jobItem.CUSTOMER_ID,
        REQUESTED_DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
        PAYMENT_STATUS: 'P',
        STATUS: 'P',
        REMARK: '',
        CLIENT_ID: 1,
        INVENTORY_DATA,
        CUSTOMER_TYPE: jobItem.CUSTOMER_TYPE,
      };
      apiCall.post(`api/inventoryRequest/addInventory`, body).then(res => {
        if (res.status === 200 && res.data.code === 200) {
          dispatch(Reducers.clearSelectedItems());
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            // @ts-ignore
            resetAndNavigate(navigation, 'Job', 'JobFlow', {
              item: jobItem,
            });
          }, 3000);
        } else {
          console.log('error inventory add response', res);
        }
        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
      console.log('inventory add response', error);
    }
  };
  const handleAddEmail = () => {
    setAddLoading(true);
    if (selectedEmails.length === 0) {
      Toast('Please select at least one email');
      return;
    }
    try {
      const emailString = selectedEmails
        .map((item: any) => item.EMAIL_ID)
        .join(',');

      const INVENTORY_DATA = selectedPart.map((item: InventoryItem) => {
        return {
          JOB_CARD_ID: jobItem.ID,
          INVENTORY_ID: item.IS_MANUAL ? 0 : item.INVENTORY_ID,
          INVENTORY_NAME: item.INVENTORY_NAME,
          TECHNICIAN_ID: user?.ID || 0,
          CUSTOMER_ID: jobItem.CUSTOMER_ID,
          QUANTITY: 1,
          RATE: item.SELLING_PRICE,
          TAX_RATE: 0,
          REQUESTED_DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
          STATUS: 'P',
          REMARK: '',
          CLIENT_ID: 1,
          TOTAL_AMOUNT: 0,
          WAREHOUSE_ID: 1,
          BATCH_NO: item.BATCH_NO,
          SERIAL_NO: item.SERIAL_NO,
          ACTUAL_UNIT_ID: item.UNIT_ID,
          ACTUAL_UNIT_NAME: item.UNIT_NAME,
          INVENTORY_TRACKING_TYPE: item.INVENTORY_TRACKING_TYPE,
          IS_VARIANT: item.IS_VARIENT,
          PARENT_ID: item.PARENT_ID,
          QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
          CUSTOMER_TYPE: jobItem.CUSTOMER_TYPE,
        };
      });
      const body = {
        CUSTOMER_NAME: jobItem.CUSTOMER_NAME,
        EMAIL_LIST: emailString,
        JOB_CARD_ID: jobItem.ID,
        JOB_CARD_NO: jobItem.JOB_CARD_NO,
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        CUSTOMER_ID: jobItem.CUSTOMER_ID,
        REQUESTED_DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
        PAYMENT_STATUS: 'P',
        STATUS: 'P',
        REMARK: '',
        CLIENT_ID: 1,
        INVENTORY_DATA,
      };
      apiCall.post(`api/inventoryRequest/addInventory`, body).then(res => {
        setAddLoading(false);
        if (res.status === 200 && res.data.code === 200) {
          dispatch(Reducers.clearSelectedItems());
          setEmailModal(false);
          setShowSuccess(true);

          setTimeout(() => {
            setShowSuccess(false);
            // @ts-ignore
            resetAndNavigate(navigation, 'Job', 'JobFlow', {
              item: jobItem,
            });
          }, 3000);
          // setTimeout(() => {
          //   setShowSuccess(false);

          //   navigation.navigate('JobFlow', {
          //     item: {
          //       ...jobItem,
          //       TRACK_STATUS: jobItem.TRACK_STATUS,
          //     },
          //     isFromJobList: true,
          //   });
          // }, 3000);
        } else {
          console.log('error inventory add response', res);
        }
        setLoading(false);
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <SafeAreaView style={styles._container}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: Platform.OS == 'ios' ? Size.containerPadding : 0,
        }}>
        {/* header */}
        <View style={{paddingTop: 16, gap: 8}}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <View style={styles._row}>
            <Text style={styles._headerText}>{'Parts'}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.BG_Technician,
            marginHorizontal: -18,
          }}>
          <TextInput
            leftChild={
              <Icon
                name="search"
                type="EvilIcons"
                size={30}
                color={colors.primary2}></Icon>
            }
            style={{margin: 12, height: 42}}
            placeholder="Search all parts..."
            value={searchValue}
            onChangeText={value => {
              setSearchValue(value);
              getInventories(value);
            }}
          />
          <View style={{padding: 12, marginTop: -15}}>
            {selectedPart.length > 0 && (
              <Text style={[styles._title, {marginBottom: 6}]}>
                {selectedPart.length > 0
                  ? selectedPart.length + ' Part selected'
                  : ''}
              </Text>
            )}

            {selectedPart.length > 0 && (
              <FlatList
                style={{
                  maxHeight:
                    selectedPart.length === 1
                      ? 50
                      : selectedPart.length === 2
                      ? 120
                      : 120,
                }}
                data={selectedPart}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                renderItem={({item, index}) => (
                  <View style={styles._PartSelected}>
                    <View style={[styles._row]}>
                      <View
                        style={{
                          flex: 0.6,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <CheckBox
                          value={isSelected(item)}
                          onValueChange={() =>
                            dispatch(Reducers.toggleSelectedItem(item))
                          }
                          tintColors={{true: '#1F5CC7', false: '#1F5CC7'}}
                          style={{
                            marginHorizontal: 10,

                            padding: 0,
                          }}
                        />

                        <Text
                          numberOfLines={2}
                          style={[
                            styles._PartTitle,
                            {
                              marginLeft: -1,
                              fontSize: 14,
                              color: '#333333',
                              fontWeight: '600',
                              fontFamily: fontFamily,
                            },
                          ]}>
                          {item.INVENTORY_NAME}
                        </Text>
                      </View>

                      {/* </View> */}
                      <Text
                        style={[
                          styles._title,
                          {flex: 0.4, textAlign: 'right'},
                        ]}>{`₹ ${parseFloat(
                        String(item?.SELLING_PRICE || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          {/* {selectedPart.length > 0 && (
          <View
            style={{
              marginTop: 12,
              height: 12,
              backgroundColor: '#cccccc',
              marginHorizontal: -18,
              marginBottom: 8,
            }}
          />
        )} */}
        </View>
        {searchValue == '' && (
          <View style={[styles._row, {flex: 1}]}>
            <View style={{width: '90%'}}>
              <Text style={styles._title}>Part Sub Categories</Text>
              {listLoading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  refreshControl={
                    <RefreshControl
                      refreshing={false}
                      onRefresh={() => getPartsSubCategory()}
                    />
                  }
                  ref={flatListRef}
                  data={subCategories}
                  removeClippedSubviews={false}
                  keyExtractor={(item, index) => index.toString()}
                  getItemLayout={(data, index) => ({
                    length: 80,
                    offset: 80 * index,
                    index,
                  })}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item, index}) => (
                    <TouchableOpacity
                      style={styles._card}
                      onPress={() => {
                        navigation.navigate('PartsInventory', {
                          item: item,
                          jobItem,
                        });
                      }}>
                      <View style={styles._row}>
                        <View
                          style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Image
                            source={
                              item?.ICON
                                ? {
                                    uri: `${BASE_URL}static/InventorySubCategoryIcons/${item.ICON}`,
                                  }
                                : _noProfile
                            }
                            style={{height: 45, width: 45, borderRadius: 25}}
                          />
                          <Text style={styles._partName}>{item.NAME}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Image
                      style={{
                        marginTop: 50,
                        alignSelf: 'center',
                        height: 180,
                        width: 180,
                      }}
                      source={_noData}
                    />
                  }
                />
              )}
            </View>
            {/* Alphabet Index on the right */}
            <ScrollView
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}>
              <View style={styles.alphabetList}>
                {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
                  <TouchableOpacity
                    key={letter}
                    style={styles.alphabetItem}
                    onPress={() => scrollToLetter(letter)}>
                    <Text style={styles.alphabetText}>{letter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {searchValue != '' && (
          <View style={{flex: 1}}>
            {Inventories.length > 0 && !listLoading ? (
              <FlatList
                data={Inventories}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                renderItem={({item, index}) => (
                  <View style={styles._partCard}>
                    <View style={[styles._row]}>
                      ;
                      <View
                        style={{
                          flex: 0.6,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <CheckBox
                          value={isSelected(item)}
                          onValueChange={() =>
                            dispatch(Reducers.toggleSelectedItem(item))
                          }
                          tintColors={{true: '#1F5CC7', false: '#1F5CC7'}}
                          style={{
                            marginRight: 10,

                            padding: 0,
                          }}
                        />

                        <Text
                          numberOfLines={2}
                          style={[
                            styles._PartTitle,
                            {
                              marginLeft: -1,
                              fontSize: 14,
                              color: '#333333',
                              fontWeight: '600',
                              fontFamily: fontFamily,
                            },
                          ]}>
                          {item.INVENTORY_NAME}
                        </Text>
                      </View>
                      {/* </View> */}
                      <Text
                        style={[
                          styles._title,
                          {flex: 0.4, textAlign: 'right'},
                        ]}>{`₹ ${parseFloat(
                        String(item?.SELLING_PRICE || '0'),
                      ).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}`}</Text>
                    </View>
                    {item.INVENTORY_TRACKING_TYPE == 'S' && (
                      <View style={styles._row}>
                        <Text
                          style={{
                            fontSize: 14,
                            paddingHorizontal: 12,
                            color: '#333333',
                            fontWeight: '500',
                            fontFamily: fontFamily,
                          }}>
                          {item.INVENTORY_TRACKING_TYPE == 'S'
                            ? 'Sr No.: ' + item.SERIAL_NO
                            : item.BATCH_NO
                            ? 'Batch No: ' + item.BATCH_NO
                            : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              />
            ) : (
              <Image
                style={{
                  marginTop: 12,
                  alignSelf: 'center',
                  height: 180,
                  width: 180,
                }}
                source={_noData}
              />
            )}
          </View>
        )}

        <View
          style={{
            backgroundColor: colors.white,
            marginHorizontal: -18,
            padding: 12,
          }}>
          <Button
            disabled={selectedPart.length > 0 ? false : true}
            loading={loading}
            label={
              jobItem.CUSTOMER_TYPE == 'I' ? 'Send for approval' : 'Add Emails'
            }
            onPress={() => {
              if (jobItem.CUSTOMER_TYPE == 'I') {
                addInventory();
              } else {
                if (selectedPart.length > 0) {
                  getEmails();
                  // setEmailModal(true);
                } else {
                  Toast('Please select parts to send email');
                }
              }
            }}
          />
        </View>
      </View>

      <SuccessModal
        visible={showSuccess}
        message={
          jobItem.CUSTOMER_TYPE == 'I'
            ? 'Part approval request sent successfully!'
            : 'Part approval request sent successfully!'
        }
      />

      {/* Email modal */}

      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEmailModal(false)}
              style={{
                position: 'absolute',
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.white,
                padding: 6,
                borderRadius: 100,
                top: -50,
              }}>
              <Icon name="close" type="Ionicons" size={28} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Email(s)</Text>

            <ScrollView style={{maxHeight: 400}}>
              {emails.length === 0 ? (
                <View style={{padding: 20, alignItems: 'center'}}>
                  <Text style={{color: '#666', fontSize: 16}}>
                    No emails found.
                  </Text>
                </View>
              ) : (
                emails.map((item: any, index) => {
                  const isSelected = selectedEmails.some(
                    (e: any) => e.ID === item.ID,
                  );

                  return (
                    // Inside your FlatList or map:
                    <TouchableOpacity
                      onPress={() => toggleSelection(item)}
                      key={item.ID}
                      style={{
                        padding: 12,
                        backgroundColor: isSelected ? '#e6f4ff' : '#fff', // or use your theme color
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#ccc',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}>
                      <Text style={{color: '#333', fontSize: 16}}>
                        {item.EMAIL_ID}
                      </Text>

                      {isSelected && (
                        <Icon
                          name="check"
                          type="Entypo"
                          color="#007AFF"
                          size={20}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                primary={false}
                style={{flex: 1}}
                onPress={() => {
                  setEmailModal(false);
                }}
              />
              <Button
                loading={addLoading}
                label="Add"
                style={{flex: 1}}
                onPress={handleAddEmail}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFF',
    paddingHorizontal: Size.containerPadding,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
    fontFamily: fontFamily,
  },
  _headerText: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '700',
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
  _PartSelected: {
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBCBCB',
    marginBottom: 5,
    height: 50,
  },
  _row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
    fontSize: 24,
    color: '#666',
    fontFamily: fontFamily,
  },
  _title: {
    fontSize: 14,
    color: '#707070',
    fontWeight: '600',
    fontFamily: fontFamily,
    marginRight: 10,
    paddingLeft: 10,
    marginTop: 10,
  },
  _PartTitle: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  _partName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '700',
    fontFamily: fontFamily,
    marginLeft: 12,
  },
  _jobDate: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
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
  alphabetList: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -12,
  },
  alphabetItem: {
    paddingVertical: 2,
  },
  alphabetText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007aff',
    fontFamily: fontFamily,
  },
  _partCard: {
    marginTop: Size.sm,
    paddingHorizontal: Size.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#a083e850',
    borderRadius: 8,
  },
});

export default PartsSubCategories;
