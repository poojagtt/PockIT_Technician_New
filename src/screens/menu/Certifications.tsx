import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Button, Icon, TextInput} from '../../components';
import {apiCall, fontFamily, Size, BASE_URL, useTheme} from '../../modules';
import {useSelector} from '../../context';
import {useFocusEffect} from '@react-navigation/native';
import SuccessModal from '../../components/SuccessModal';
import {_noData} from '../../assets';

interface CertificationsProps extends MenuRoutes<'Certifications'> {}

const Certifications: React.FC<CertificationsProps> = ({navigation}) => {
  const colors = useTheme();
  const [selectedCertification, setSelectedCertification] = useState<any>(null);
  const [certifications, setCertifications] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const {user} = useSelector(state => state.app);
  const ID = user?.ID;
  const [loading, setLoading] = useState(false);
  const [ModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const filterOptions = [
    {label: 'All', value: 'All'},
    {label: 'Approved', value: 'Approved'},
    {label: 'Rejected', value: 'Rejected'},
    {label: 'Pending', value: 'Pending Approval'},
  ];

  const getStatusColor = (status?: string) => {
    if (!status) return '#ccc';
    switch (status.toLowerCase()) {
      case 'approved':
        return colors.primary;
      case 'rejected':
        return '#F36631';
      case 'Pending approval':
        return '#F5F9FF';
      default:
        return '#F5F9FF';
    }
  };

  const filteredCertifications = certifications.filter(
    (item: any) =>
      (selectedStatus === 'All' || item.status === selectedStatus) &&
      (item.NAME.toLowerCase().includes(search.toLowerCase()) ||
        item.ISSUED_BY_ORGANIZATION_NAME.toLowerCase().includes(
          search.toLowerCase(),
        )),
  );
  useFocusEffect(
    useCallback(() => {
      fetchCertification();
    }, []),
  );

  const fetchCertification = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('/api/techniciancertificaterequest/get', {
          filter: ` AND TECHNICIAN_ID = ${ID} AND IS_DELETE = 0 `,
        })
        .then(res => res.data);
      if (response.data && response.data.length > 0) {
        const formattedData = response.data.map((cert: any) => ({
          ...cert,
          status:
            cert.STATUS === 'A'
              ? 'Approved'
              : cert.STATUS === 'R'
              ? 'Rejected'
              : cert.STATUS === 'P'
              ? 'Pending Approval'
              : 'Unknown',
        }));
        setCertifications(formattedData);
      } else {
        console.warn('No data received or empty array');
        setCertifications([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error fetching user data');
    }
    setLoading(false);
  };

  const deleteCertification = async () => {
    if (!selectedCertification) return;
    setIsDeleteLoading(true);
    try {
      const response = await apiCall.post(
        '/api/techniciancertificaterequest/deleteCertificate',
        {
          ID: selectedCertification.ID,
          CERTIFICATE_PHOTO: selectedCertification.CERTIFICATE_PHOTO,
        },
      );
      if (response.data.message) {
        setIsDeleteLoading(false);
        setSuccessMessage(
          `Certification ${selectedCertification.NAME} has been successfully deleted.`,
        );
        setModalVisible(true);
        setCertifications(prevCertifications =>
          prevCertifications.filter(
            (cert: any) => cert.ID !== selectedCertification.ID,
          ),
        );
        setTimeout(() => {
          setModalVisible(false);
          fetchCertification();
        }, 2000);
      } else {
        setIsDeleteLoading(false);
        Alert.alert('Error', 'Failed to delete certification');
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
      Alert.alert('Error', 'Something went wrong while deleting certification');
    } finally {
      setIsDeleteLoading(false);
      setIsModalVisible(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={{flex: 1, backgroundColor: colors.background}}>
        <View
          style={{
            backgroundColor: colors.white,
            paddingHorizontal: Size.containerPadding,
            paddingTop: Size.containerPadding,
          }}>
          <Icon
            type="MaterialIcons"
            name="keyboard-backspace"
            size={27}
            // color={'#999999'}
            style={{marginBottom: Size.sm}}
            onPress={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                navigation.goBack();
              }
            }}
          />

          <View style={styles.header}>
            <Text style={styles.heading}>
              {isEditing ? 'Edit Certifications' : 'Certifications'}
            </Text>
            {!isEditing && (
              <View style={styles.headerIcons}>
                <Icon
                  type="MaterialIcons"
                  name="add"
                  size={28}
                  color={'#092B9C'}
                  onPress={() =>
                    // @ts-ignore
                    navigation.navigate('CertificationsForm', {
                      refreshCertifications: fetchCertification,
                    })
                  }
                />
                {filteredCertifications.length > 0 && (
                  <Icon
                    type="MaterialIcons"
                    name="edit"
                    size={23}
                    color={'#092B9C'}
                    onPress={() => setIsEditing(true)}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Search & Filter */}
        {isEditing && (
          <Text style={styles.subHeading}>
            Select certification to be edited
          </Text>
        )}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#092B9C" />
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: Size.containerPadding,
                // margin: Size.containerPadding,
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
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity
                onPress={() => setIsDropdownVisible(true)}
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

            {/* Certifications List */}
            {filteredCertifications.length > 0 ? (
              <FlatList
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                style={{flex: 1}}
                contentContainerStyle={{flexGrow: 1}}
                data={filteredCertifications}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}: {item: any}) => (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.card}
                    onPress={() => {
                      if (isEditing) {
                        // @ts-ignore
                        navigation.navigate('CertificationsForm', {
                          certification: item,
                        });
                      } else {
                        setSelectedItem(item);
                        setDetailsModal(true);
                      }
                    }}>
                    <View style={styles.cardHeader}>
                      <View style={styles.profilePlaceholder}>
                        <Image
                          source={{
                            uri: `${BASE_URL}static/CertificatePhotos/${item.CERTIFICATE_PHOTO}`,
                          }}
                          style={styles.profileImage}
                          resizeMode="cover"
                        />
                      </View>

                      <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text
                          style={styles.cardTitle}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.NAME}
                        </Text>
                        <View style={{marginTop: 5, gap: 5}}>
                          <Text
                            style={styles.cardText}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {item.ISSUED_BY_ORGANIZATION_NAME}
                          </Text>
                          <Text style={styles.cardText} numberOfLines={1}>
                            {item.ISSUED_DATE}
                          </Text>
                          <Text style={styles.cardText} numberOfLines={1}>
                            {item.CREDENTIAL_ID}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.approvedBadge}>
                        <Text
                          style={[
                            styles.approvedText,
                            {
                              backgroundColor: getStatusColor(item?.status),
                              color:
                                item?.status == 'Pending Approval'
                                  ? colors.primary
                                  : '#ffffff',
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.status}
                        </Text>
                      </View>

                      {isEditing && (
                        <TouchableOpacity
                          style={{position: 'absolute', bottom: 0, right: 0}}
                          onPress={() => {
                            setSelectedCertification(item);
                            setIsModalVisible(true);
                          }}>
                          <Icon
                            type="MaterialCommunityIcons"
                            name="delete-outline"
                            size={22}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {item.status == 'Rejected' && (
                      <View
                        style={{
                          // flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                        }}>
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          style={{
                            fontFamily: fontFamily,
                            fontSize: 14,
                            color: colors.error,
                            marginTop: 4,
                          }}>
                          Rejection Remark:
                        </Text>
                        <Text
                          ellipsizeMode="tail"
                          style={{
                            fontSize: 14,
                            color: '#555',
                            fontFamily: fontFamily,
                          }}
                          numberOfLines={1}>
                          {item.REJECT_REMARK}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No certifications found</Text>
              </View>
            )}
          </>
        )}

        <Modal
          visible={isDropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDropdownVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownVisible(false)}>
            <View style={styles.dropdownContainer}>
              {filterOptions.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.dropdownItem,
                    selectedStatus === item.value && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setSelectedStatus(item.value);
                    setIsDropdownVisible(false);
                  }}>
                  <Text style={styles.dropdownText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Are you sure you want to delete certification{' '}
                <Text style={styles.modalHighlight}>
                  {selectedCertification?.NAME}
                </Text>
                ?
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  label="Confirm"
                  onPress={deleteCertification}
                  style={{flex: 1}}
                  loading={isDeleteLoading}
                  disable={isDeleteLoading}
                />
                <Button
                  label="Cancel"
                  onPress={() => setIsModalVisible(false)}
                  style={{flex: 1}}
                  primary={false}
                />
              </View>
            </View>
          </View>
        </Modal>

        {detailsModal && (
          <Modal
            visible={detailsModal}
            transparent
            animationType="fade"
            onDismiss={() => {
              setDetailsModal(false);
            }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <View
                style={{
                  width: '85%',
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  elevation: 5,
                }}>
                {/* Header with Status Badge and Close Icon */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                  {/* Approval Status Badge on the left */}
                  <View
                    style={{
                      backgroundColor: getStatusColor(selectedItem?.status),
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}>
                    <Text
                      style={{
                        color:
                          selectedItem?.status === 'Pending Approval'
                            ? colors.primary
                            : '#ffffff',
                        fontSize: 14,
                        fontFamily: fontFamily,
                      }}>
                      {selectedItem.status}
                    </Text>
                  </View>

                  {/* Close button on the right */}
                  <TouchableOpacity
                    onPress={() => setDetailsModal(false)}
                    style={{alignSelf: 'flex-end'}}>
                    <Icon
                      name="close"
                      type="AntDesign"
                      size={24}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>

                {/* Content section (Details) */}
                <View style={{flexDirection: 'row', marginBottom: 12}}>
                  <View style={{marginRight: 12}}>
                    <Image
                      source={{
                        uri: `${BASE_URL}static/CertificatePhotos/${selectedItem.CERTIFICATE_PHOTO}`,
                      }}
                      style={{width: 50, height: 50, borderRadius: 25}}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={{flex: 1}}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: fontFamily,
                      }}>
                      {selectedItem.NAME}
                    </Text>
                    <View style={{marginTop: 5}}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#555',
                          fontFamily: fontFamily,
                        }}>
                        {selectedItem.ISSUED_BY_ORGANIZATION_NAME}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#555',
                          fontFamily: fontFamily,
                        }}>
                        {selectedItem.ISSUED_DATE}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#555',
                          fontFamily: fontFamily,
                        }}>
                        {selectedItem.CREDENTIAL_ID}
                      </Text>
                    </View>
                  </View>
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={{position: 'absolute', bottom: 0, right: 0}}
                    onPress={() => {
                      setSelectedCertification(selectedItem);
                      setIsModalVisible(true);
                    }}>
                    <Icon
                      type="MaterialCommunityIcons"
                      name="delete-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}

                {selectedItem.status === 'Rejected' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      marginTop: 8,
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: 'red',
                        fontFamily: fontFamily,
                      }}>
                      Rejection Remark:
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#555',
                        fontFamily: fontFamily,
                      }}>
                      {selectedItem.REJECT_REMARK}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}

        <SuccessModal visible={ModalVisible} message={successMessage} />
      </View>
    </SafeAreaView>
  );
};

export default Certifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: Size.sm,
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily,
    color: '#1C1C28',
    justifyContent: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Size.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    marginTop: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    // padding: 8,
    borderLeftWidth: 1,
    borderColor: '#ccc',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 5,
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: '#b094f550',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    alignItems: 'center',
    fontFamily: fontFamily,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingLeft: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  approvedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#008512',
    padding: 5,
    borderRadius: 5,
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: fontFamily,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    fontFamily: fontFamily,
  },
  subHeading: {
    marginHorizontal: 12,
    marginTop: 12,
    fontSize: 16,
    fontWeight: 600,
    color: '#0E0E0E',
    fontFamily: fontFamily,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    fontFamily: fontFamily,
    fontWeight: '600',
    lineHeight: 20,
  },
  modalHighlight: {
    fontWeight: 'bold',
    color: '#007BFF',
    fontFamily: fontFamily,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#092B9C',
    paddingVertical: 8,
    paddingHorizontal: 35,
    borderRadius: 5,
  },
  confirmText: {
    color: '#fff',
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    lineHeight: 20,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 35,
    borderRadius: 5,
  },
  cancelText: {
    color: '#333',
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    width: 150,
    elevation: 5,
    marginRight: 15,
    marginTop: -300,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    fontFamily: fontFamily,
  },
  selectedItem: {
    backgroundColor: '#ccc',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  noDataText: {
    fontFamily: fontFamily,
    fontSize: 16,
    color: '#092B9C',
    fontWeight: '500',
  },
});
