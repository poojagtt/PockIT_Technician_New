import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Icon, TextInput} from '../../components';
import {fontFamily, Size, useTheme} from '../../modules';
import {apiCall} from '../../modules/services';
import {useSelector} from '../../context';
import SuccessModal from '../../components/SuccessModal';
import { SVG } from '../../assets';

interface SkillsProps extends MenuRoutes<'Skills'> {}

const Skills: React.FC<SkillsProps> = ({navigation}) => {
  const colors = useTheme();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<any>([]);
  const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<any>(null);
  const [ModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingSkillId, setPendingSkillId] = useState('');

  const filterOptions = [
    {label: 'All', value: 'All'},
    {label: 'Approved', value: 'Approved'},
    {label: 'Rejected', value: 'Rejected'},
    {label: 'Pending', value: 'Pending Approval'},
  ];

  const getStatusLabel = (status: any) => {
    switch (status) {
      case 'A':
        return 'Approved';
      case 'R':
        return 'Rejected';
      case 'P':
        return 'Pending Approval';
      default:
        return 'Approved';
    }
  };

  const filteredSkills = skills.filter(
    (item: any) =>
      (selectedStatus === 'All' || item.status === selectedStatus) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/technicianSkillMapping/get', {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND IS_ACTIVE = 1 `,
        })
        .then(res => res.data);
      if (response.data && response.code == 200) {
        const res = await apiCall.post('api/technicianSkillRequest/get', {
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND STATUS != 'A' `,
        });
        setPendingSkillId(
          res.data.data.map(
            (item: any) => item.STATUS == 'P' && item.SKILL_IDS,
          ),
        );
        const data = [...res.data.data, ...response.data];
        if (data.length > 0) {
          const formattedData = data.map(
            (skill: {
              ID: {toString: () => any};
              SKILL_NAME: any;
              STATUS: any;
            }) => ({
              ...skill,
              id: skill.ID.toString(),
              name: skill.SKILL_NAME,
              status: getStatusLabel(skill.STATUS),
            }),
          );
          setSkills(formattedData);
        }
      } else {
        console.warn('No skills found.');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSkillId.ID) return;
    setLoading(true);
    try {
      const response = await apiCall
        .put('api/technicianSkillMapping/update', {
          ...selectedSkillId,
          SKILL_ID: selectedSkillId.SKILL_ID,
          TECHNICIAN_ID: user?.ID,
          IS_ACTIVE: 0,
        })
        .then(res => res.data);
      if (response.code === 200) {
        setSkills((prevSkills: any) =>
          prevSkills.filter((skill: any) => skill.id !== selectedSkillId.id),
        );
        setIsModalVisible(false);
        setSelectedSkillId(null);
        setSuccessMessage(
          `Skill ${selectedSkillId?.name} has been successfully deleted.`,
        );
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate('Skills');
        }, 2000);
      } else {
        console.warn('Failed to delete skill:', response.message);
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.white}]}>
      <View
        style={{
          backgroundColor: colors.white,
          paddingHorizontal: Size.containerPadding,
          paddingTop: Size.containerPadding,
        }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                navigation.goBack();
              }
            }}>
            <Icon
              type="MaterialIcons"
              name="keyboard-backspace"
              size={27}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.heading}>
            {isEditing ? 'Edit Skills' : 'Skills'}
          </Text>
          {user?.CAN_EDIT_SKILL == 1 && !isEditing && (
            <View style={styles.headerIcons}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('AddSkills', {
                    IDs: pendingSkillId,
                    onSuccess: () => {
                      navigation.goBack();
                      fetchSkills();
                    },
                  })
                }>
                <Icon
                  type="MaterialIcons"
                  name="add"
                  size={26}
                  color={'#092B9C'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsEditing(true)}>
                <Icon
                  type="Feather"
                  name="edit-2"
                  size={22}
                  color={'#092B9C'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Search & Filter */}
      <View style={{backgroundColor: colors.background}}>
        {isEditing && (
          <Text
            style={[
              styles.subHeading,
              {
                marginHorizontal: Size.containerPadding,
                marginTop: Size.containerPadding,
              },
            ]}>
            Select Skills to be edited
          </Text>
        )}

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
          
              <SVG.sort
                              fill={colors.primary}
                              stroke={colors.primary}
                              width={24}
                              height={24}
                            />
          </TouchableOpacity>
        </View>
      </View>
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

      {/* Skills List */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#092B9C"
          style={{marginTop: 20}}
        />
      ) : filteredSkills.length === 0 ? (
        <Text style={styles.noSkillsText}>No skills found.</Text>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          data={filteredSkills}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.approvedText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'Approved'
                            ? colors.primary
                            : item.status === 'Rejected'
                            ? '#f04646'
                            : item.status === 'Pending Approval'
                            ? colors.background
                            : colors.primary2,
                        color:
                          item.status === 'Pending Approval' ? colors.primary : '#fff',
                      },
                    ]}>
                    {item.status}
                  </Text>
                  {isEditing && item.STATUS !== 'P' && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{marginLeft: 8}}
                      onPress={() => {
                        setSelectedSkillId(item);
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
              </View>
              {item.REJECTED_REMARK && (
                <Text
                  style={[
                    styles.approvedText,
                    {color: '#666'},
                  ]}>{`Remark: ${item.REJECTED_REMARK}`}</Text>
              )}
            </View>
          )}
        />
      )}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure you want to delete Skills{' '}
              <Text style={styles.modalHighlight}>{selectedSkillId?.name}</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDelete}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SuccessModal visible={ModalVisible} message={successMessage} />
    </SafeAreaView>
  );
};

export default Skills;

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: Size.sm,
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
    borderColor: '#092B9C',
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
    padding: 8,
    borderLeftWidth: 1,
    borderColor: '#092B9C',
    borderRadius: 0,
  },
  card: {
    backgroundColor: '#fff',
    padding: 10,

    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
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
  },
  approvedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
    padding: 5,
    borderRadius: 5,
    flexShrink: 1,
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0E0E0E',
    fontFamily: fontFamily,
    // marginBottom: 5,
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
    fontFamily: fontFamily,
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
    fontFamily: fontFamily,
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
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  noSkillsText: {
    fontSize: 16,
    fontFamily: fontFamily,
    textAlign: 'center',
    marginTop: 50,
    color: '#092B9C',
    fontWeight: '500',
  },
});
