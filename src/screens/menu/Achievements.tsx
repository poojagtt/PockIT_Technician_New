import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions
} from 'react-native';
import { MenuRoutes } from '../../routes/Menu';
import { Icon } from '../../components';
import { fontFamily, Size, useTheme } from '../../modules';


interface AchievementsProps extends MenuRoutes<'Achievements'> { }

const Achievements: React.FC<AchievementsProps> = ({ navigation }) => {
    // const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    //   const [selectedStatus, setSelectedStatus] = useState('All');
    //   const [isModalVisible, setIsModalVisible] = useState(false);
    //   const [search, setSearch] = useState('');
    //   const [isEditing, setIsEditing] = useState(false);
    //   const Achievements = [
    //     {
    //       id: '1',
    //       name: 'Name',
    //       organization: 'Issuing Organisation Name',
    //       date: 'Issued Month Date',
    //       credential: 'Credential ID',
    //       status: 'Approved',
    //     },
    //     {
    //       id: '2',
    //       name: 'Name',
    //       organization: 'Issuing ',
    //       date: 'Issued Month Date',
    //       credential: 'Credential ID',
    //       status: 'Awaiting Approval',
    //     },
    //     {
    //       id: '3',
    //       name: 'Name',
    //       organization: 'Issuing Organisation ',
    //       date: 'Issued Month Date',
    //       credential: 'Credential ID',
    //       status: 'Rejected',
    //     },
    
    //   ];
    
    //   const filterOptions = [
    //     { label: 'All', value: 'All' },
    //     { label: 'Approved', value: 'Approved' },
    //     { label: 'Rejected', value: 'Rejected' },
    //     { label: 'Pending', value: 'Awaiting Approval' },
    //   ];
    
    //   const getStatusColor = (status: string) => {
    //     switch (status.toLowerCase()) {
    //       case 'approved':
    //         return '#008512';
    //       case 'rejected':
    //         return '#F05A2B';
    //       case 'awaiting approval':
    //         return '#F2F2F2';
    //       default:
    //         return '#ccc';
    //     }
    //   };
    
    //   const filteredCertifications = Achievements.filter(item =>
    //     selectedStatus === 'All' || item.status === selectedStatus
    //   );

  return (
    <View style={styles.container} >
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => {
              // if (isEditing) {
              //   setIsEditing(false);
              // } else {
              //   navigation.goBack();
              // }
              navigation.goBack();
            }}>
              <Icon type="MaterialIcons" name="keyboard-backspace" size={27} color={'#999999'} />
            </TouchableOpacity>
          </View>
    
          <View style={styles.header}>
            <Text style={styles.heading}>
              {/* {isEditing ? 'Edit Achievements' : 'Achievements'} */}
              Achievements
            </Text>
            {/* {!isEditing && (
              <View style={styles.headerIcons}>
                <TouchableOpacity onPress={() => navigation.navigate('CertificationsForm')}>
                  <Icon type="MaterialIcons" name="add" size={24} color={'#000'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Icon type="Feather" name="edit-2" size={22} color={'#000'} />
                </TouchableOpacity>
              </View>
            )} */}
          </View>
    
    
    
          {/* Search & Filter */}
          {/* {isEditing && (
            <Text style={styles.subHeading}>Select Achievements to be edited</Text>
          )}
          <View style={styles.searchContainer}>
            <Icon type="MaterialIcons" name="search" size={20} color={'#999'} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setIsDropdownVisible(true)}
            >
              <Icon type="Feather" name="filter" size={22} color={'#000'} />
            </TouchableOpacity>
          </View>
    
          <Modal
            visible={isDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsDropdownVisible(false)}
            >
              <View style={styles.dropdownContainer}>
                {filterOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownItem,
                      selectedStatus === item.value && styles.selectedItem,
                    ]}
                    onPress={() => {
                      setSelectedStatus(item.value);
                      setIsDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal> */}
    
          {/* Certifications List */}
          {/* <FlatList
            data={filteredCertifications}
            removeClippedSubviews={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                disabled={!isEditing}
                style={styles.card}
                onPress={() => {
                  navigation.navigate('AchievementsForm', {
                    achievement: item,
                  });
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.profilePlaceholder} /> */}
    
                  {/* Wrap text in a flex container */}
                  {/* <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                    <View style={{  marginTop: 5, gap: 5 }}>
                      <Text style={styles.cardText} numberOfLines={1} ellipsizeMode="tail">
                        {item.organization}
                      </Text>
                      <Text style={styles.cardText} numberOfLines={1}>{item.date}</Text>
                      <Text style={styles.cardText}>{item.credential}</Text>
                    </View>
                  </View> */}
    
                  {/* Adjust the Status Badge */}
                  {/* <View style={styles.approvedBadge}>
                    <Text
                      style={[
                        styles.approvedText,
                        {
                          backgroundColor: getStatusColor(item.status),
                          color: item.status.toLowerCase() === 'awaiting approval' ? '#666' : '#fff',
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.status}
                    </Text>
                    <View style={{ alignItems: 'center' }}>
                      {isEditing && (
                        <TouchableOpacity style={{ marginLeft: 3 }} onPress={() => setIsModalVisible(true)}>
                          <Icon type="Feather" name="trash-2" size={22} color={'#6D6D6D'} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          /> */}
    
          {/* <Modal
            visible={isModalVisible}
            transparent
            animationType="fade"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  Are you sure you want to delete Achievements <Text style={styles.modalHighlight}>ABC</Text>?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.confirmButton}>
                    <Text style={styles.confirmText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal> */}
        </View>
  );
};

export default Achievements;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 15
    },
    headerContainer: {
      marginBottom: Size.sm,
    },
    header: {
      flexDirection: 'row',
      marginBottom: Size.sm,
      justifyContent: 'space-between'
    },
    heading: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: fontFamily,
      color: '#1C1C28',
      justifyContent: 'center'
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
      marginTop: 10
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
      borderColor: '#ccc',
      borderRadius: 8,
    },
    card: {
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 8,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      marginBottom: 10,
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
      marginRight: 10
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      alignItems: 'center'
    },
    approvedBadge: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 80,
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
  
    },
    cardText: {
      fontSize: 14,
      color: '#555',
      marginTop: 4,
  
    },
    subHeading: {
      fontSize: 16,
      color: '#555',
      marginBottom: 5,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      width: 300,
      alignItems: 'center'
    },
    modalText: {
      fontSize: 16,
      color: '#333',
      marginBottom: 20,
      fontFamily: 'SF Pro Text',
      fontWeight: '600',
      lineHeight: 20
    },
    modalHighlight: {
      fontWeight: 'bold',
      color: '#007BFF'
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    confirmButton: {
      backgroundColor: '#585858',
      paddingVertical: 8,
      paddingHorizontal: 35,
      borderRadius: 5,
    },
    confirmText: {
      color: '#fff',
      fontFamily: 'SF Pro Text',
      fontWeight: '500',
      lineHeight: 20
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
      lineHeight: 20
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
      marginTop: -300
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    dropdownText: {
      fontSize: 16,
      color: '#000',
    },
    selectedItem: {
      backgroundColor: '#ccc',
    },
});
