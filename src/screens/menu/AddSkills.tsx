import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Button, Icon, TextInput} from '../../components';
import {fontFamily, Size, useTheme} from '../../modules';
import {apiCall} from '../../modules/services';
import {useSelector} from '../../context';
import SuccessModal from '../../components/SuccessModal';
import {_noData} from '../../assets';
import {Checkbox} from 'react-native-paper';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import CheckBox from '@react-native-community/checkbox';

interface AddSkillsProps extends MenuRoutes<'AddSkills'> {}
const AddSkills: React.FC<AddSkillsProps> = ({navigation, route}) => {
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const {user} = useSelector(state => state.app);
  const {IDs, onSuccess} = route.params;
  const colors = useTheme();
  const [skills, setSkills] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modal, setModal] = useState({
    add: false,
  });
  const [customSkill, setCustomSkill] = useState({
    skillName: '',
    skillDescription: '',
  });
  const [customSkillLoading, setCustomSkillLoading] = useState(false);

  const filteredSkills = skills.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const toggleSkill = (id: string) => {
    setSelectedSkills(prev =>
      prev.includes(id)
        ? prev.filter(skillId => skillId !== id)
        : [...prev, id],
    );
  };
  useEffect(() => {
    fetchSkills();
  }, []);
  const fetchSkills = async () => {
    setLoading(true);
    try {
      let fil = ` AND IS_ACTIVE=1`;
      IDs.length > 0 ? (fil += ` AND ID NOT IN (${IDs.toString()})`) : '';
      const response = await apiCall
        .post('api/skill/unmappedSkills', {
          ID: user?.ID,
          filter: fil,
        })
        .then(res => res.data);
      if (response && response.data && response.data.length > 0) {
        console.log("response.data",response.data)
        const formattedData = response.data.map(
          (skill: {ID: number; NAME: string}) => ({
            id: skill.ID.toString(),
            name: skill.NAME,
          }),
        );
        setSkills(formattedData);
      } else {
        console.warn('No skills found.');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkills = async () => {
    if (selectedSkills.length === 0) {
      console.warn('No skill selected.');
      return;
    }
    setLoading(true);
    try {
      const selectedSkillData = skills.filter(skill =>
        selectedSkills.includes(skill.id),
      );
      if (selectedSkillData.length === 0) {
        console.warn('Invalid skills selected.');
        setLoading(false);
        return;
      }
      const skillIds = selectedSkillData
        .map(skill => parseInt(skill.id, 10))
        .join(',');
      const skillNames = selectedSkillData.map(skill => skill.name).join(',');
      const payload = {
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        SKILL_IDS: skillIds,
        SKILL_NAME: skillNames,
        CLIENT_ID: user?.CLIENT_ID,
      };
      const response = await apiCall
        .post('api/technicianSkillRequest/create', payload)
        .then(res => res.data);
      if (response && response.code === 200) {
        setSuccessMessage(
          `Skills ${skillNames} have been sent for approval.\nWill notify once approved.`,
        );
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          onSuccess();
        }, 2000);
      } else {
        console.warn('Failed to add skills.');
      }
    } catch (error) {
      console.error('Error adding skills:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveCustomSkill = async () => {
    if (customSkill.skillName.length === 0) {
      Toast('Skill name is required.');
      return;
    }
    setCustomSkillLoading(true);
    try {
      const payload = {
        DESCRIPTION: customSkill.skillDescription,
        NAME: customSkill.skillName,
        IS_ACTIVE: true,
        CLIENT_ID: 1,
      };
      const response = await apiCall
        .post('api/skill/create', payload)
        .then(res => res.data);
      setCustomSkillLoading(false);
      if (response && response.code === 200) {
        Toast('Skill saved successfully.');
        setModal({...modal, add: false});
        setCustomSkill({skillName: '', skillDescription: ''});
        fetchSkills();
      }
    } catch (error) {
      console.error('Error saving custom skill:', error);
    } finally {
      setCustomSkillLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={{flex: 1}}>
        {/* Back Button */}
        <View
          style={{
            backgroundColor: colors.white,
            paddingHorizontal: Size.containerPadding,
            paddingTop: Size.containerPadding,
          }}>
          <View style={styles.headerContainer}>
            <Icon
              type="MaterialIcons"
              name="keyboard-backspace"
              size={27}
              onPress={() => navigation.goBack()}
            />
          </View>

          {/* Heading */}
          <View
            style={{
              flexDirection: 'row',
              marginBottom: Size.sm,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 3,
            }}>
            <Text style={styles.heading}>Add Skill</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{}}
              onPress={() => {
                setModal({...modal, add: true});
              }}>
              <Icon
                type="MaterialIcons"
                name="add"
                size={26}
                color={'#092B9C'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: Size.containerPadding,
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
        </View>

        {/* Skills List */}
        {loading ? (
          <View style={{flex: 1}}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{marginTop: 70}}
            />
          </View>
        ) : (
          <FlatList
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: Size.containerPadding,
            }}
            data={filteredSkills}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.skillItem}
                onPress={() => toggleSkill(item.id)}>
                <CheckBox
                  value={selectedSkills.includes(item.id)}
                  onValueChange={() => toggleSkill(item.id)}
                  tintColors={{true: colors.primary2, false: colors.primary2}}
                />
                <Text style={styles.skillText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 100,
                }}>
                <Image source={_noData} style={{height: 150, width: 170}} />
              </View>
            }
          />
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            disable={selectedSkills.length < 1}
            style={{marginBottom: Size.padding}}
            label="Add"
            onPress={addSkills}
          />
          <Button
            style={{marginBottom: Size.padding}}
            primary={false}
            label="Cancel"
            onPress={() => navigation.goBack()}
          />
        </View>

        <SuccessModal visible={isModalVisible} message={successMessage} />
      </View>
      {modal.add && (
        <Modal
          show={modal.add}
          onClose={() => setModal({...modal, add: false})}
          style={{justifyContent: 'flex-end'}}
          containerStyle={{
            borderRadius: 0,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            justifyContent: 'flex-end',
            margin: 0,
            padding: 0,
          }}>
          <KeyboardAvoidingView  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setModal({...modal, add: false})}
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
            <View style={{padding: Size.containerPadding, gap: 8}}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  color: colors.primaryText,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 10,
                }}>
                Add skill
              </Text>
              <TextInput
                placeholder="Skill Name"
                label="Skill Name"
                value={customSkill.skillName}
                onChangeText={text =>
                  setCustomSkill({...customSkill, skillName: text})
                }
                maxLength={256}
              />
              <TextInput
                placeholder="Skill Description"
                label="Description"
                value={customSkill.skillDescription}
                onChangeText={text =>
                  setCustomSkill({...customSkill, skillDescription: text})
                }
                multiline={true}
                maxLength={512}
              />
              <Button
                label="Save"
                onPress={saveCustomSkill}
                disable={customSkillLoading}
                style={{marginTop: 10}}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AddSkills;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: Size.sm,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginBottom: 15,
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
  skillItem: {
    // backgroundColor:'red',
    flexDirection: 'row',

    alignItems: 'center',
    paddingVertical: 8,
    // marginBottom: 10,
    borderRadius: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#4A4A4A',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: '#4A4A4A',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillText: {
    fontSize: 14,
    fontWeight: 400,
    color: '#0E0E0E',
    marginLeft: 10,
    flex: 1,
    fontFamily: fontFamily,
  },
  buttonContainer: {
    // marginTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  addButton: {
    backgroundColor: '#092B9C',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  cancelButtonText: {
    color: '#4A4A4A',
    fontSize: 16,
    fontWeight: '600',
  },
});
