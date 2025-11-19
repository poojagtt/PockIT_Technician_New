import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import {Checkbox} from 'react-native-paper';
import React, {useEffect, useState} from 'react';
import {Button, Icon, TextInput} from '../../components';
import {apiCall, fontFamily, Size, useTheme} from '../../modules';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_noData, _noProfile} from '../../assets';
import SuccessModal from '../../components/SuccessModal';
import {JobRoutes} from '../../routes/Job';
import moment from 'moment';
import {resetAndNavigate} from '../../utils';
import Toast from '../../components/Toast';
import CheckBox from '@react-native-community/checkbox';

interface partsInventory extends JobRoutes<'PartsInventory'> {}
const PartsInventory: React.FC<partsInventory> = ({navigation, route}) => {
  const {item, jobItem} = route.params;
  const [searchValue, setSearchValue] = useState('');
  const [Inventories, setInventories] = useState<InventoryItem[]>([]);
  const [FilteredInventories, setFilteredInventories] = useState<
    InventoryItem[]
  >([]);
  const {selectedPart} = useSelector(state => state.part);
  const dispatch = useDispatch();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const colors = useTheme();
  const {user} = useSelector(state => state.app);
  const [addLoading, setAddLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>({});
  useEffect(() => {
    getInventories();
    jobItem.IS_PARENT == 0 && getCustomerInfo();
  }, []);
  useEffect(() => {
    if (searchValue === '') {
      setFilteredInventories(Inventories);
    } else {
      const filteredData = Inventories.filter(inventory =>
        inventory.INVENTORY_NAME.toLowerCase().includes(
          searchValue.toLowerCase(),
        ),
      );
      setFilteredInventories(filteredData);
    }
  }, [searchValue, Inventories]);
  const getInventories = () => {
    setListLoading(true);
    try {
      apiCall
        .post(`api/inventory/getItemsForTechnician`, {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND INVENTROY_SUB_CAT_ID = ${item.ID} AND (INVENTORY_TYPE = 'B' OR INVENTORY_TYPE = 'S') AND STATUS = 1`,
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
        if (res.status === 200 && res.data.code === 200) {
          setAddLoading(false);
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
  // const getInventories = () => {
  //   setListLoading(true);
  //   try {
  //     apiCall
  //       .post(`api/inventory/get`, {
  //         filter: `AND INVENTRY_SUB_CATEGORY_ID = ${item.ID} AND (INVENTORY_TYPE = 'B' || INVENTORY_TYPE = 'S') AND STATUS = 1 `,
  //       })
  //       .then(res => {
  //         if (res.data.code === 200) {
  //           setInventories(res.data.data);
  //           setListLoading(false);
  //         }
  //       })
  //       .catch(err => {
  //         setListLoading(false);
  //         console.log('category err.....', err);
  //       });
  //   } catch (error) {
  //     setListLoading(false);
  //     console.log(error);
  //   }
  // };

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
          setLoading(true);
          console.log('error inventory add response', res);
        }
        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
      console.log('inventory add response', error);
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
            paddingHorizontal: 16,
          }}>
          <View>
            <TextInput
              leftChild={
                <Icon
                  name="search"
                  type="EvilIcons"
                  size={25}
                  color={colors.primary2}
                />
              }
              style={{marginVertical: 12}}
              placeholder="Search all parts..."
              value={searchValue}
              onChangeText={value => setSearchValue(value)}
            />
          </View>

          <Text style={[styles._title, {marginBottom: 6}]}>
            {selectedPart.length > 0
              ? selectedPart.length + ' Part selected'
              : item.NAME}
          </Text>

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
              marginTop: 10,
              height: 10,
              backgroundColor: colors.BG_Technician,
              marginHorizontal: -18,
              marginBottom: 8,
            }}></View>
        )} */}

        <View style={{flex: 1}}>
          {listLoading ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : FilteredInventories.length > 0 ? (
            <FlatList
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => getInventories()}
                />
              }
              style={{marginTop: 16}}
              data={FilteredInventories}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    backgroundColor: '#CBCBCB',
                    width: '100%',
                    height: 2,
                    opacity: 0.5,
                    marginVertical: 4,
                  }}
                />
              )}
              renderItem={({item, index}) => (
                <View style={styles._partCard}>
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
                        {`${item.INVENTORY_NAME} ${
                          item.VARIANT_NAME ? '(' + item.VARIANT_NAME + ')' : ''
                        }`}
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

        <View
          style={{
            backgroundColor: colors.white,
            marginHorizontal: -18,
            padding: 12,
          }}>
          <Button
            style={{backgroundColor: colors.primary2}}
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
                    <TouchableOpacity
                      onPress={() => toggleSelection(item)}
                      key={item.ID}
                      style={{
                        padding: 12,
                        backgroundColor: isSelected ? '#e6f4ff' : '#fff', 
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
  },
  _title: {
    fontSize: 14,
    color: '#707070',
    fontWeight: '600',
    fontFamily: fontFamily,
    right: 10,
    paddingLeft: 10,
  },
  _job_id: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  _PartTitle: {
    fontSize: 14,
    padding: 6,

    color: '#333333',
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  _duration: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  _location: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: fontFamily,
    marginBottom: Size.sm,
  },
  alphabetList: {
    width: '10%',
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
  },
  _partCard: {
    // marginTop: Size.sm,
    // paddingHorizontal: Size.sm,
    paddingVertical: 5,
    borderColor: '#a083e850',
    // borderRadius: 8,
    // borderWidth:0,
    //backgroundColor:'red'
  },
});

export default PartsInventory;
