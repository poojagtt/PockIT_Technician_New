import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {GlobalStyle, Size, useTheme} from '../../modules/themes';
import Modal from '../../components/Modal';
import {Button, Icon} from '../../components';
import {RadioButton} from 'react-native-paper';
import {apiCall, fontFamily} from '../../modules';
import {useSelector} from '../../context';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from '../../components/Toast';

interface RescheduleRequestProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  jobItem: JobData;
}
const RescheduleRequest = ({
  visible,
  onClose,
  onSubmit,
  jobItem,
}: RescheduleRequestProps) => {
  const colors = useTheme();
  const {user} = useSelector(state => state.app);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [showPicker, setShowPicker] = useState({
    date: false,
    time: false,
  });
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const currentTime = new Date();
    const minutes = currentTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 10) * 10;
    currentTime.setMinutes(roundedMinutes);
    currentTime.setSeconds(0);
    setTime(currentTime);
    getReasons();
  }, []);

  const getReasons = useCallback(() => {
    try {
      apiCall
        .post('api/cancleOrderReason/get', {
          filter: ` AND IS_ACTIVE = 1 AND TYPE = 'OR' `,
        })
        .then(res => {
          if (res.data.code === 200) {
            setReasons(res.data.data);
          }
        })
        .catch(err => {
          console.log('reason err.....', err);
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const createRescheduleRequest = useCallback(async () => {
    try {
      if (value == '') {
        Toast('Please select a reason');
        return;
      }
      setLoading(true);
      const body = {
        REQUESTED_DATE:
          moment(date).format('YYYY-MM-DD') +
          ' ' +
          moment(time).format('HH:mm'),
        ORDER_ID: jobItem.ORDER_ID,
        TECHNICIAN_ID: user?.ID,
        JOB_CARD_ID: jobItem.ID,
        JOB_CARD_NO: jobItem.JOB_CARD_NO,
        CANCELLED_BY: null,
        CANCEL_DATE: null,
        REASON: value,
        STATUS: 'P',
        CLIENT_ID: 1,
        CUSTOMER_ID: jobItem.CUSTOMER_ID,
        REMARK: '',
        IS_RESCHEDULED: 1,
        OLD_SCHEDULED_DATE_TIME:
          moment(jobItem.SCHEDULED_DATE_TIME).format('YYYY-MM-DD') +
          ' ' +
          jobItem.START_TIME,
      };
      const res = await apiCall.post(
        'api/jobRescheduleTransactions/create',
        body,
      );
      if (res.status === 200) {
        await onSubmit(value);
        setValue('');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [date, time, value, jobItem, user?.ID, onSubmit]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      setShowPicker(prev => ({...prev, date: false}));
    }
  }, []);

  const handleTimeChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const minutes = selectedDate.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 10) * 10;
      selectedDate.setMinutes(roundedMinutes);
      selectedDate.setSeconds(0);
      setTime(selectedDate);
    }
    setShowPicker(prev => ({...prev, time: false}));
  }, []);

  const handleClose = useCallback(() => {
    setValue('');
    onClose();
  }, [onClose]);

  const formattedDate = useMemo(
    () => moment(date).format('DD MMM YYYY'),
    [date],
  );
  const formattedTime = useMemo(() => moment(time).format('hh:mm A'), [time]);

  return (
    <Modal
      show={visible}
      containerStyle={{margin: 0, maxHeight: '70%'}}
      style={{
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingHorizontal: Size.lg,
      }}
      onClose={handleClose}>
      <View>
        <Icon
          name="close"
          type="AntDesign"
          onPress={handleClose}
          color="#999999"
        />
        <Text style={styles._headerTxt}>Reason to reschedule?</Text>

        <View
          style={{
            marginVertical: Size.lg,
            flexDirection: 'row',
            gap: Size.base,
          }}>
          <View style={{marginBottom: Platform.OS == 'ios' ? 30 : 0, flex: 1}}>
            <TouchableOpacity
              onPress={() => {
                setShowPicker(prev => ({...prev, date: true}));
              }}
              activeOpacity={0.8}
              style={[
                styles._dateTimeContainer,
                {borderColor: colors.primary2},
              ]}>
              <Text style={{fontFamily: fontFamily}}>{formattedDate}</Text>
              <Icon name="calendar" type="AntDesign" />
            </TouchableOpacity>
            {showPicker.date && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'default' : 'default'}
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </View>
          <View style={{marginBottom: Platform.OS == 'ios' ? 30 : 0, flex: 1}}>
            <TouchableOpacity
              onPress={() => {
                setShowPicker(prev => ({...prev, time: true}));
              }}
              activeOpacity={0.8}
              style={[
                styles._dateTimeContainer,
                {borderColor: colors.primary2},
              ]}>
              <Text style={{fontFamily: fontFamily}}>{formattedTime}</Text>
              <Icon name="clockcircleo" type="AntDesign" />
            </TouchableOpacity>
            {showPicker.time && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{maxHeight: '60%'}}>
          <RadioButton.Group
            onValueChange={newValue => setValue(newValue)}
            value={value}>
            {reasons.map((reason: RescheduleReasons) => (
              <RadioButton.Item
                style={[
                  styles._card,
                  {
                    borderColor:
                      value == reason.REASON ? colors.primary2 : '#CBCBCB',
                  },
                ]}
                key={reason.ID}
                label={reason.REASON}
                value={reason.REASON}
                position="leading"
                labelStyle={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: 0.68,
                  textAlign: 'left',
                }}
                mode="android"
                color={colors.primary2}
              />
            ))}
          </RadioButton.Group>
        </ScrollView>

        <Button
          loading={loading}
          style={{marginTop: Size.lg}}
          label="Send Request"
          onPress={createRescheduleRequest}
        />
      </View>
    </Modal>
  );
};

export default RescheduleRequest;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
  },
  _card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: Size.base,
  },
  _headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
    marginTop: Size.lg,
  },
  _dateTimeContainer: {
    ...GlobalStyle.field,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Size.base,
  },
});
