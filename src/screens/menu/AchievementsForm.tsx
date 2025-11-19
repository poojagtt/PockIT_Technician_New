import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from 'react-native';
import { MenuRoutes } from '../../routes/Menu';
import { Icon,ImagePicker } from '../../components';
import { fontFamily, Size, useTheme } from '../../modules';


interface AchievementsFormProps extends MenuRoutes<'AchievementsForm'> { }

const AchievementsForm: React.FC<AchievementsFormProps> = ({ navigation,route }) => {
  const achievement = route?.params?.achievement || {};
  const colors = useTheme();
  const [isEditing, setIsEditing] = useState(!!achievement.name);
  const [name, setName] = useState(achievement.name || '');
  const [organization, setOrganization] = useState(achievement.organization || '');
  const [date, setDate] = useState(achievement.date || '');
  const [credentialId, setCredentialId] = useState(achievement.credential || '');

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon type="MaterialIcons" name="keyboard-backspace" size={27} color={'#999999'} />
      </TouchableOpacity>

      <Text style={styles.title}> {isEditing ? 'Edit Achievement Name' : 'Add Achievements'}</Text>

      <View style={styles.imageContainer}>
        <Image style={styles.image} source={{ uri: 'https://via.placeholder.com/150' }} />
        <ImagePicker

          style={{ alignSelf: 'flex-end' }} onCapture={function (data: { fileUrl: string; fileName: string; fileType: string; }): void {
            throw new Error('Function not implemented.');
          } }>
            <View style={styles.editIcon}>
              <Icon
                type="Octicons"
                name="pencil"
                size={19}
                style={{alignSelf: 'center'}}
                color={colors.primary}
              />
            </View>
          </ImagePicker>
      </View>

      <View>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
        
        <Text style={styles.label}>Issuing Organisation Name</Text>
        <TextInput style={styles.input} value={organization} onChangeText={setOrganization} placeholder="Issuing Organisation Name" />
        
        <Text style={styles.label}>Issued Month Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="Issued Month Date" />
        
        <Text style={styles.label}>Credential ID</Text>
        <TextInput style={styles.input} value={credentialId} onChangeText={setCredentialId} placeholder="Credential ID" />
      </View>


      <TouchableOpacity activeOpacity={0.5} style={styles.addButton}>
        <Text style={styles.addButtonText}>{isEditing ? 'Update' : 'Add'}</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.5} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>


  );
};

export default AchievementsForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    fontFamily: fontFamily,
  },
  imageContainer: {
    alignSelf: 'center',
    width: 200,
    height: 120,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontFamily: fontFamily,
  },
  addButton: {
    backgroundColor: '#585858',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#E9E9E9',
    fontSize: 16,
    fontFamily: fontFamily,
    lineHeight: 24,
    fontWeight: '500',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: fontFamily,
    lineHeight: 24,
    fontWeight: '500',
  },
  label: {
    fontSize: 10,
    fontFamily: fontFamily,
    lineHeight: 16,
    fontWeight: '400',
    marginLeft: 10,
    marginBottom: 5,
  },

});
