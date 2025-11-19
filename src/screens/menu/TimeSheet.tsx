import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  ScrollView,
  Switch,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Button, Icon} from '../../components';
import {apiCall, fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import {useDispatch, useSelector} from '../../context';
import {RadioButton} from 'react-native-paper';
import {updateTechStatus} from '../../context/reducers/app';
import {RootState} from '../../context/reducers/store';
import Toast from '../../components/Toast';
import { Platform, Modal as RNModal } from 'react-native';

interface TimeSheetProps extends MenuRoutes<'TimeSheet'> {}
interface DayItem {
  ID: string | null;
  day: number | string;
  empty: boolean;
  isToday: boolean;
  BREAK_END_TIME: string | null;
  BREAK_START_TIME: string | null;
  DAY_START_TIME: string | null;
  DAY_END_TIME: string | null;
  IS_AVAILABLE: boolean;
  month: number;
  year: number;
  isDataAvailable: boolean;
}
interface globalSettings {
  ARCHIVE_FLAG: string;
  BREAK_END_TIME: string;
  BREAK_START_TIME: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  DAY_END_TIME: string;
  DAY_START_TIME: string;
  ID: number;
  IS_SERIVCE_AVAILABLE: number;
  READ_ONLY: string;
  TECHNICIAN_ID: number;
  WEEK_DAY: 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';
}
interface employeeData {
  BREAK_END_TIME: string | null;
  BREAK_START_TIME: string | null;
  DATE_OF_MONTH: string;
  DAY_END_TIME: string | null;
  DAY_START_TIME: string | null;
  ID: number | null;
  IS_SERIVCE_AVAILABLE: number | null;
  TECHNICIAN_ID: number;
  WEEK_DAY:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
}
interface JobList {
  ID: string;
  ORDER_ID: string;
  CUSTOMER_ID: string;
  SERVICE_NAME: string;
  SCHEDULED_DATE_TIME: string;
  START_TIME: string;
  JOB_CARD_NO: string;
}
interface RenderDayProps {
  item: DayItem;
}
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = (SCREEN_WIDTH - 48 - 48) / 7;

const WeekDayHeader = React.memo(() => {
  const colors = useTheme();
  const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.weekDays]}>
      {weekdayLetters.map((day, index) => (
        <Text
          key={`${day}-${index}`}
          style={[styles.weekDay, {color: colors.primaryText2}]}>
          {day}
        </Text>
      ))}
    </View>
  );
});

const CalendarHeader = React.memo(
  ({
    selectedMonth,
    selectedYear,
    onMonthYearChange,
    months,
  }: {
    selectedMonth: number;
    selectedYear: number;
    onMonthYearChange: (month: number, year: number) => void;
    months: readonly string[];
  }) => {
    const colors = useTheme();

    const handlePrevMonth = React.useCallback(() => {
      const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      onMonthYearChange(newMonth, newYear);
    }, [selectedMonth, selectedYear, onMonthYearChange]);

    const handleNextMonth = React.useCallback(() => {
      const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      onMonthYearChange(newMonth, newYear);
    }, [selectedMonth, selectedYear, onMonthYearChange]);

    return (
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={[styles.arrowContainer, {backgroundColor: colors.background}]}
          onPress={handlePrevMonth}>
          <Icon type="MaterialIcons" name="chevron-left" size={24} />
        </TouchableOpacity>

        <Text style={[styles.monthYear, {color: colors.primaryText}]}>
          {months[selectedMonth]} {selectedYear}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={[styles.arrowContainer, {backgroundColor: colors.background}]}
          onPress={handleNextMonth}>
          <Icon type="MaterialIcons" name="chevron-right" size={24} />
        </TouchableOpacity>
      </View>
    );
  },
);

const SelectedDateInfo = React.memo(
  ({
    selectedDate,
    onEdit,
    onTimeChange,
  }: {
    selectedDate: DayItem;
    onEdit: () => void;
    onTimeChange?: (field: any) => void;
  }) => {
    const colors = useTheme();

    return (
      <View style={[styles.selectedDateContainer]}>
        {/* <View style={styles.selectedDateHeader}>
          <Text
            onPress={() => {
            }}
            style={[styles.selectedDateTitle, {color: colors.heading}]}>
            {new Date(
              selectedDate.year,
              selectedDate.month,
              Number(selectedDate.day),
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {new Date(
            selectedDate.year,
            selectedDate.month,
            Number(selectedDate.day),
          ).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.editButton, {backgroundColor: colors.primary}]}
              onPress={onEdit}>
              <Icon
                type="MaterialIcons"
                name="edit"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          )}
        </View> */}

        <View style={styles.timeInfoContainer}>
          {selectedDate.IS_AVAILABLE && (
            <View>
              <Text style={[styles.timeHeading, {color: colors.primaryText}]}>
                Work Time
              </Text>
              <View style={styles.timeContainer}>
                <View style={styles.timeInfoRow}>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {'Start'}
                  </Text>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {selectedDate.DAY_START_TIME || '--:--'}
                  </Text>
                </View>
                
                <View style={styles.timeInfoRow}>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {'End'}
                  </Text>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {selectedDate.DAY_END_TIME || '--:--'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {selectedDate.IS_AVAILABLE && (
            <View>
              <Text style={[styles.timeHeading, {color: colors.primaryText}]}>
                Break Time
              </Text>
              <View style={styles.timeContainer}>
                <View style={styles.timeInfoRow}>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {'Start'}
                  </Text>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {selectedDate.BREAK_START_TIME || '--:--'}
                  </Text>
                </View>
                <View style={styles.timeInfoRow}>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {'End'}
                  </Text>
                  <Text style={[styles.timeLabel, {color: colors.primaryText}]}>
                    {selectedDate.BREAK_END_TIME || '--:--'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.availabilityContainer}>
            <View
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: selectedDate.IS_AVAILABLE
                    ? '#008512'
                    : colors.error,
                },
              ]}>
              <Text style={[styles.availabilityText, {color: colors.white}]}>
                {selectedDate.IS_AVAILABLE ? 'Available' : 'Not Available'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const Calendar = React.memo<{
  selectedMonth: number;
  selectedYear: number;
  onMonthYearChange: (month: number, year: number) => void;
  employeeData: employeeData[];
  globalSettings: globalSettings[];
  selectedDate: DayItem | null;
  onDateSelect: (dayItem: DayItem) => void;
}>(
  ({
    selectedMonth,
    selectedYear,
    onMonthYearChange,
    employeeData,
    globalSettings,
    selectedDate,
    onDateSelect,
  }) => {
    const colors = useTheme();
    const [daysArray, setDaysArray] = useState<DayItem[]>([]);

    const months = useMemo(
      () =>
        [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ] as const,
      [],
    );

    const getDaysInMonth = useCallback(() => {
      const daysArray: DayItem[] = [];
      const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekDayMap: Record<string, string> = {
        Sun: 'Su',
        Mon: 'Mo',
        Tue: 'Tu',
        Wed: 'We',
        Thu: 'Th',
        Fri: 'Fr',
        Sat: 'Sa',
      };

      for (let i = 0; i < firstDay; i++) {
        daysArray.push({
          day: '',
          empty: true,
          isToday: false,
          BREAK_END_TIME: null,
          BREAK_START_TIME: null,
          DAY_START_TIME: null,
          DAY_END_TIME: null,
          IS_AVAILABLE: false,
          month: selectedMonth,
          year: selectedYear,
          isDataAvailable: false,
          ID: null,
        });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedYear, selectedMonth, i);
        currentDate.setHours(0, 0, 0, 0);
        const dateString = `${selectedYear}-${(selectedMonth + 1)
          .toString()
          .padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const dayData = employeeData.find(
          data => data.DATE_OF_MONTH === dateString,
        );
        let scheduleData: {
          BREAK_END_TIME: string | null;
          BREAK_START_TIME: string | null;
          DAY_START_TIME: string | null;
          DAY_END_TIME: string | null;
          IS_AVAILABLE: boolean;
          isDataAvailable: boolean;
          ID: string | null;
        } = {
          BREAK_END_TIME: null,
          BREAK_START_TIME: null,
          DAY_START_TIME: null,
          DAY_END_TIME: null,
          IS_AVAILABLE: false,
          isDataAvailable: false,
          ID: null,
        };

        if (dayData?.ID) {
          scheduleData = {
            BREAK_END_TIME: dayData.BREAK_END_TIME,
            BREAK_START_TIME: dayData.BREAK_START_TIME,
            DAY_START_TIME: dayData.DAY_START_TIME,
            DAY_END_TIME: dayData.DAY_END_TIME,
            IS_AVAILABLE: dayData.IS_SERIVCE_AVAILABLE ? true : false,
            isDataAvailable: true,
            ID: dayData.ID.toString(),
          };
        } else {
          const weekDay =
            weekDayMap[
              currentDate.toLocaleDateString('en-US', {weekday: 'short'})
            ];
          const globalSetting = globalSettings.find(
            setting => setting.WEEK_DAY === weekDay,
          );

          if (globalSetting) {
            scheduleData = {
              BREAK_END_TIME: globalSetting.BREAK_END_TIME,
              BREAK_START_TIME: globalSetting.BREAK_START_TIME,
              DAY_START_TIME: globalSetting.DAY_START_TIME,
              DAY_END_TIME: globalSetting.DAY_END_TIME,
              IS_AVAILABLE: globalSetting.IS_SERIVCE_AVAILABLE === 1,
              isDataAvailable: true,
              ID: null,
            };
          }
        }

        const dayItem = {
          day: i,
          month: selectedMonth,
          year: selectedYear,
          empty: false,
          isToday: currentDate.getTime() === today.getTime(),
          ...scheduleData,
        };

        daysArray.push(dayItem);
      }

      return daysArray;
    }, [selectedMonth, selectedYear, employeeData, globalSettings]);

    useEffect(() => {
      const newDaysArray = getDaysInMonth();
      setDaysArray(newDaysArray);

      // Find today's date in the array
      const todayItem = newDaysArray.find(day => day.isToday);
      if (todayItem && !selectedDate) {
        onDateSelect(todayItem);
      }
    }, [getDaysInMonth, selectedDate, onDateSelect]);

    const renderDay = useCallback(
      ({item}: RenderDayProps) => {
        return (
          <TouchableOpacity
            style={[
              styles.dayCell,
              item.empty && styles.emptyCell,
              item.IS_AVAILABLE && {
                backgroundColor: '#FDFDFD',
                borderWidth: 1,
                borderColor: '#CBCBCB',
              },
              !item.IS_AVAILABLE &&
                !item.empty && {
                  backgroundColor:
                    selectedDate?.day === item.day &&
                    selectedDate?.month === item.month &&
                    selectedDate?.year === item.year
                      ? 'transparent'
                      : colors.secondary,
                },
              selectedDate?.day === item.day &&
                selectedDate?.month === item.month &&
                selectedDate?.year === item.year && {
                  borderWidth: 2,
                  borderColor: item.IS_AVAILABLE
                    ? colors.primary2
                    : colors.error,
                },
            ]}
            onPress={() => !item.empty && onDateSelect(item)}
            disabled={item.empty}>
            <Text
              style={[
                styles.dayText,
                item.IS_AVAILABLE && {color: colors.primaryText2},
                !item.IS_AVAILABLE && {
                  color:
                    selectedDate?.day === item.day &&
                    selectedDate?.month === item.month &&
                    selectedDate?.year === item.year
                      ? colors.primaryText2
                      : colors.white,
                },
                selectedDate?.day === item.day &&
                  selectedDate?.month === item.month &&
                  selectedDate?.year === item.year &&
                  styles.selectedText,
              ]}>
              {item.day}
            </Text>
          </TouchableOpacity>
        );
      },
      [colors, onDateSelect, selectedDate],
    );

    return (
      <View style={[styles.calendarContainer]}>
        <CalendarHeader
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={onMonthYearChange}
          months={months}
        />
        <View
          style={{
            height: 1,
            backgroundColor: '#CBCBCB',
            marginBottom: 8,
            marginTop: 12,
          }}
        />
        <WeekDayHeader />
        <FlatList
          removeClippedSubviews={false}
          data={daysArray}
          renderItem={renderDay}
          numColumns={7}
          keyExtractor={(_, index) => index.toString()}
          scrollEnabled={false}
          style={styles.calendar}
        />
      </View>
    );
  },
);

const JobConfirmationModal = React.memo(
  ({
    visible,
    onClose,
    onConfirm,
    jobs,
  }: {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    jobs: JobList[];
  }) => {
    const colors = useTheme();

    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
          <View style={styles.jobModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon
                type="MaterialIcons"
                name="keyboard-backspace"
                size={27}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.jobModalTitle, {color: colors.text}]}>
              Scheduled Jobs
            </Text>
          </View>

          <View
            style={[
              styles.warningContainer,
              {backgroundColor: colors.error + '20'},
            ]}>
            <Icon
              type="MaterialIcons"
              name="warning"
              size={24}
              color={colors.error}
            />
            <Text style={[styles.warningText, {color: colors.error}]}>
              Please reschedule these jobs to another day before making this day
              unavailable.
            </Text>
          </View>

          <FlatList
            data={jobs}
            contentContainerStyle={styles.jobsList}
            renderItem={({item, index}) => (
              <View key={index} style={[styles.jobItemFullScreen]}>
                <Text style={[styles.jobTitleFullScreen, {color: colors.text}]}>
                  {item.SERVICE_NAME}
                </Text>

                <View style={styles.jobDetails}>
                  <View style={styles.jobDetailRow}>
                    <Icon type="MaterialIcons" name="event" size={19} />
                    <Text
                      style={[
                        styles.jobDetailText,
                        {color: colors.description},
                      ]}>
                      {moment(item.SCHEDULED_DATE_TIME).format('DD MMM YYYY')}
                    </Text>
                  </View>

                  <View style={styles.jobDetailRow}>
                    <Icon type="MaterialIcons" name="access-time" size={18} />
                    <Text
                      style={[
                        styles.jobDetailText,
                        {color: colors.description},
                      ]}>
                      {item.START_TIME}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />

          <View style={[styles.bottomActions]}>
            <Button
              style={{flex: 1}}
              label="Cancel"
              primary={false}
              onPress={onClose}
            />
            <Button
              style={{flex: 1}}
              label="Confirm"
              primary
              onPress={onConfirm}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

const RescheduleJobModal = React.memo(
  ({
    visible,
    onClose,
    onSubmit,
    job,
    selectedDate,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (date: any, time: any, reason: string) => void;
    job: JobList;
    selectedDate: any;
  }) => {
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

    const handleSubmit = useCallback(() => {
      onSubmit(date, time, value);
    }, [date, time, onSubmit, value]);
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}>
        <View
          style={[
            styles.modalOverlay,
            {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
          ]}>
          <View
            style={[styles.modalContent, {backgroundColor: colors.background}]}>
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
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(prev => ({...prev, date: true}));
                  }}
                  activeOpacity={0.8}
                  style={styles._dateTimeContainer}>
                  <Text style={{fontFamily: fontFamily}}>{formattedDate}</Text>
                  <Icon name="calendar" type="AntDesign" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(prev => ({...prev, time: true}));
                  }}
                  activeOpacity={0.8}
                  style={styles._dateTimeContainer}>
                  <Text style={{fontFamily: fontFamily}}>{formattedTime}</Text>
                  <Icon name="clockcircleo" type="AntDesign" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{maxHeight: '60%'}}>
                <RadioButton.Group
                  onValueChange={newValue => setValue(newValue)}
                  value={value}>
                  {reasons.map((reason: RescheduleReasons) => (
                    <RadioButton.Item
                      style={styles._card}
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
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>

              <Button
                loading={loading}
                style={{marginTop: Size.lg}}
                label="Send"
                onPress={handleSubmit}
              />
            </View>
          </View>
        </View>
        {/* {showPicker.date && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
        {showPicker.time && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )} */}

        {showPicker.date && (
  Platform.OS === 'ios' ? (
    <RNModal
      transparent
      animationType="slide"
      visible={showPicker.date}
      onRequestClose={() => setShowPicker(prev => ({ ...prev, date: false }))}
    >
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 30,
          alignItems: 'center',
        }}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            onChange={handleDateChange}
            style={{ backgroundColor: '#fff' }}
          />
         <View>
           <Button
            label="Done"
            onPress={() => setShowPicker(prev => ({ ...prev, date: false }))}
           style={{width: '90%', margin: 16, backgroundColor: colors.primary}}
          />
         </View>
        </View>
      </View>
    </RNModal>
  ) : (
    <DateTimePicker
      value={date}
      mode="date"
      display="default"
      minimumDate={new Date()}
      onChange={handleDateChange}
    />
  )
)}
{showPicker.time && (
  Platform.OS === 'ios' ? (
    <RNModal
      transparent
      animationType="slide"
      visible={showPicker.time}
      onRequestClose={() => setShowPicker(prev => ({ ...prev, time: false }))}
    >
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 30,
          alignItems: 'center',
        }}>
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
            style={{ backgroundColor: '#fff' }}
          />
         <View>
           <Button
            label="Done"
            onPress={() => setShowPicker(prev => ({ ...prev, time: false }))}
           style={{width: '90%', margin: 16, backgroundColor: colors.primary}}
          />
         </View>
        </View>
      </View>
    </RNModal>
  ) : (
    <DateTimePicker
      value={time}
      mode="time"
      is24Hour={false}
      display="default"
      onChange={handleTimeChange}
    />
  )
)}
      </Modal>
    );
  },
);

const TimeModal = React.memo(
  ({
    visible,
    onClose,
    isEdit,
    dayItem,
    onSave,
    setIsSubmitting,
    selectedMonth,
    selectedYear,
    handleMonthChange,
    employeeData,
    globalSettings,
    selectedDate,
    handleDateSelect,
  }: {
    visible: boolean;
    onClose: () => void;
    isEdit: boolean;
    dayItem: DayItem;
    onSave: (updatedData: DayItem) => void;
    setIsSubmitting: (value: boolean) => void;
    selectedMonth: number;
    selectedYear: number;
    handleMonthChange: (month: number, year: number) => void;
    employeeData: any[];
    globalSettings: any[];
    selectedDate: DayItem | null;
    handleDateSelect: (dayItem: DayItem) => void;
  }) => {
    const colors = useTheme();
    const {user} = useSelector(state => state.app);
    const [formData, setFormData] = useState({
      IS_AVAILABLE: dayItem.IS_AVAILABLE,
      DAY_START_TIME: dayItem.DAY_START_TIME || '',
      DAY_END_TIME: dayItem.DAY_END_TIME || '',
      BREAK_START_TIME: dayItem.BREAK_START_TIME || '',
      BREAK_END_TIME: dayItem.BREAK_END_TIME || '',
    });

    const [showTimePicker, setShowTimePicker] = useState<{
      show: boolean;
      field: keyof typeof formData | null;
    }>({
      show: false,
      field: null,
    });

    const [jobConfirmation, setJobConfirmation] = useState<{
      visible: boolean;
      jobs: JobList[];
    }>({
      visible: false,
      jobs: [],
    });

    const [rescheduleModal, setRescheduleModal] = useState<{
      visible: boolean;
      selectedJob: JobList | null;
    }>({
      visible: false,
      selectedJob: null,
    });

    const handleAvailabilityChange = async (value: boolean) => {
      // Update the UI immediately
      setFormData(prev => ({...prev, IS_AVAILABLE: value}));

      if (!value) {
        // Check for jobs when switching to unavailable
        try {
          const date = `${dayItem.year}-${(dayItem.month + 1)
            .toString()
            .padStart(2, '0')}-${dayItem.day.toString().padStart(2, '0')}`;

          const response = await apiCall.post('api/jobCard/get', {
            filter: ` AND TECHNICIAN_ID = ${user?.ID} AND STATUS = "AS" AND DATE(SCHEDULED_DATE_TIME) = '${date}' `,
          });

          if (response.data.data && response.data.data.length > 0) {
            // If jobs exist, revert the switch and show confirmation
            setFormData(prev => ({...prev, IS_AVAILABLE: !value}));
            setJobConfirmation({
              visible: true,
              jobs: response.data.data,
            });
            return;
          }
        } catch (error) {
          // If API call fails, revert the switch
          setFormData(prev => ({...prev, IS_AVAILABLE: !value}));
          console.error('Error checking jobs:', error);
        }
      }
    };

    const handleJobModalClose = () => {
      setJobConfirmation({visible: false, jobs: []});
      onClose();
    };

    const handleRescheduleSubmit = async (
      newDate: string,
      newTime: string,
      reason: string,
    ) => {
      try {
        setRescheduleModal({visible: false, selectedJob: null});
        setJobConfirmation({visible: false, jobs: []});
        onClose();
        setIsSubmitting(true);
        const rescheduleData = jobConfirmation.jobs.map(job => ({
          REQUESTED_DATE:
            moment(newDate).format('YYYY-MM-DD') +
            ' ' +
            moment(newTime).format('HH:mm'),
          ORDER_ID: job.ORDER_ID,
          TECHNICIAN_ID: user?.ID,
          JOB_CARD_ID: job.ID,
          JOB_CARD_NO: job.JOB_CARD_NO,
          REASON: reason,
          STATUS: 'P',
          CLIENT_ID: 1,
          CUSTOMER_ID: job.CUSTOMER_ID,
          REMARK: '',
          IS_RESCHEDULED: 1,
          OLD_SCHEDULED_DATE_TIME: `${moment(job.SCHEDULED_DATE_TIME).format(
            'YYYY-MM-DD',
          )} ${job.START_TIME}`,
        }));
        const response = await apiCall.post(
          'api/jobRescheduleTransactions/bulkRescheduleByTechnician',
          rescheduleData,
        );
        if (response.status === 200) {
          const updatedData = {
            ...dayItem,
            IS_AVAILABLE: false,
          };
          await onSave(updatedData);
        }
      } catch (error) {
        console.error('Error rescheduling jobs:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // const handleTimeChange = (field: keyof typeof formData) => {
    //   setShowTimePicker({show: true, field});
    // };
const [tempTime, setTempTime] = useState<Date>(new Date()); // Add this state

    const handleTimeChange = (field: keyof typeof formData) => {
  setShowTimePicker({show: true, field});
  setTempTime(formData[field] ? new Date(`1970-01-01T${formData[field]}`) : new Date());
};

const onTimeSelected = (event: any, selectedTime?: Date) => {
  if (Platform.OS === 'ios') {
    // Only update tempTime, don't close or set formData yet
    if (event.type === 'set' && selectedTime) {
      setTempTime(selectedTime);
    }
  } else {
    // For Android, set formData and close immediately
    if (event.type === 'set' && selectedTime && showTimePicker.field) {
      const minutes = selectedTime.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 10) * 10;
      selectedTime.setMinutes(roundedMinutes);
      selectedTime.setSeconds(0);
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setFormData(prev => ({
        ...prev,
        [showTimePicker.field as keyof typeof formData]: timeString,
      }));
    }
    setShowTimePicker({ show: false, field: null });
  }
};

    const handleSave = () => {
      onSave({
        ...dayItem,
        ...formData,
      });
      setFormData({
        IS_AVAILABLE: false,
        DAY_START_TIME: '',
        DAY_END_TIME: '',
        BREAK_START_TIME: '',
        BREAK_END_TIME: '',
      });
      onClose();
    };

    return (
      <>
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={onClose}>
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                height: '100%',
                width: '100%',
                padding: 0,
              },
            ]}>
            <SafeAreaView
              style={{
                backgroundColor: colors.background,
                height: '100%',
                borderRadius: 0,
              }}>
              <View
                style={{
                  backgroundColor: '#FDFDFD',
                  paddingHorizontal: Size.containerPadding,
                  paddingTop: Size.containerPadding,
                  paddingBottom: 10,
                }}>
                <Icon
                  name="keyboard-backspace"
                  type="MaterialCommunityIcons"
                  size={25}
                  onPress={onClose}
                />
                <View
                  style={{
                    marginTop: Size.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={[styles.heading, {color: colors.primaryText}]}>
                    Set Availability
                  </Text>
                </View>
              </View>
              <ScrollView>
                <View style={styles.switchContainer}>
                  <Text
                    style={{
                      color: colors.primaryText,
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                    Available
                  </Text>
                  <Switch
                    value={formData.IS_AVAILABLE}
                    onValueChange={handleAvailabilityChange}
                    trackColor={{
                      true: colors.primary2,
                      false: colors.secondary,
                    }}
                    thumbColor={colors.white}
                    style={{
                      transform: [{scaleX: 1.1}, {scaleY: 1.2}],
                    }}
                  />
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{flex: 1}}>
                  <View style={{height: 15}} />
                  <Calendar
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthYearChange={handleMonthChange}
                    employeeData={employeeData}
                    globalSettings={globalSettings}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                  />
                  <View style={{height: 15}} />
                  {/* working days and holidays */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                      marginHorizontal: Size.containerPadding * 2,
                      gap: Size.containerPadding,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <View
                        style={{
                          height: 10,
                          width: 10,
                          borderRadius: 3,
                          backgroundColor: colors.white,
                          borderColor: colors.black,
                          borderWidth: 1,
                        }}
                      />
                      <Text
                        style={[
                          styles.workingHoursText,
                          {color: colors.primaryText},
                        ]}>
                        Working days
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <View
                        style={{
                          height: 10,
                          width: 10,
                          borderRadius: 3,
                          backgroundColor: colors.secondary,
                        }}
                      />
                      <Text
                        style={[
                          styles.workingHoursText,
                          {color: colors.primaryText},
                        ]}>
                        Holidays
                      </Text>
                    </View>
                  </View>
                  {selectedDate && selectedDate.isDataAvailable ? (
                    // <SelectedDateInfo
                    //   selectedDate={selectedDate}
                    //   onEdit={() => {}}
                    //   onTimeChange={handleTimeChange}
                    //   mainScreen={false}
                    // />

                    <View style={[styles.selectedDateContainer]}>
                      {formData.IS_AVAILABLE && (
                        <View style={styles.timeInfoContainer}>
                          <View>
                            <Text
                              style={[
                                styles.timeHeading,
                                {color: colors.primaryText},
                              ]}>
                              Work Time
                            </Text>
                            <View style={styles.timeContainer}>
                              <View style={styles.timeInfoRow}>
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                  ]}>
                                  {'Start'}
                                </Text>
                                <Text
                                  onPress={() => {
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) &&
                                      handleTimeChange('DAY_START_TIME');
                                  }}
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) && {
                                      borderColor: colors.primary2,
                                      borderWidth: 1,
                                      paddingHorizontal: 10,
                                      borderRadius: 12,
                                    },
                                  ]}>
                                  {formData.DAY_START_TIME || 'Set Time'}
                                </Text>
                              </View>
                              <View style={[styles.timeInfoRow,{marginTop:6}]}>
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                  ]}>
                                  {'End'}
                                </Text>
                                <Text
                                  onPress={() => {
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) &&
                                      handleTimeChange('DAY_END_TIME');
                                  }}
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) && {
                                      borderColor: colors.primary2,
                                      borderWidth: 1,
                                      paddingHorizontal: 10,
                                      borderRadius: 12,
                                    },
                                  ]}>
                                  {formData.DAY_END_TIME || 'Set Time'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.timeHeading,
                                {color: colors.primaryText},
                              ]}>
                              Break Time
                            </Text>
                            <View style={styles.timeContainer}>
                              <View style={styles.timeInfoRow}>
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                  ]}>
                                  {'Start'}
                                </Text>
                                <Text
                                  onPress={() => {
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) &&
                                      handleTimeChange('BREAK_START_TIME');
                                  }}
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) && {
                                      borderColor: colors.primary2,
                                      borderWidth: 1,
                                      paddingHorizontal: 10,
                                      borderRadius: 12,
                                    },
                                  ]}>
                                  {formData.BREAK_START_TIME || 'Set Time'}
                                </Text>
                              </View>
                              <View style={[styles.timeInfoRow,{marginTop:6}]}>
                                <Text
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                  ]}>
                                  {'End'}
                                </Text>
                                <Text
                                  onPress={() => {
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) &&
                                      handleTimeChange('BREAK_END_TIME');
                                  }}
                                  style={[
                                    styles.timeLabel,
                                    {color: colors.primaryText},
                                    new Date(
                                      selectedDate.year,
                                      selectedDate.month,
                                      Number(selectedDate.day),
                                    ).setHours(0, 0, 0, 0) >=
                                      new Date().setHours(0, 0, 0, 0) && {
                                      borderColor: colors.primary2,
                                      borderWidth: 1,
                                      paddingHorizontal: 10,
                                      borderRadius: 12,
                                    },
                                  ]}>
                                  {formData.BREAK_END_TIME || 'Set Time'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.availabilityContainer}>
                            <View
                              style={[
                                styles.availabilityBadge,
                                {
                                  backgroundColor: selectedDate.IS_AVAILABLE
                                    ? '#008512'
                                    : colors.error,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.availabilityText,
                                  {color: colors.white},
                                ]}>
                                {selectedDate.IS_AVAILABLE
                                  ? 'Available'
                                  : 'Not Available'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : selectedDate &&
                    (selectedDate.year > new Date().getFullYear() ||
                      (selectedDate.year === new Date().getFullYear() &&
                        selectedDate.month > new Date().getMonth()) ||
                      (selectedDate.year === new Date().getFullYear() &&
                        selectedDate.month === new Date().getMonth() &&
                        Number(selectedDate.day) >= new Date().getDate())) ? (
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        {
                          backgroundColor: colors.primary,
                          marginHorizontal: 15,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 8,
                        },
                      ]}>
                      <Icon
                        type="AntDesign"
                        name="plus"
                        size={20}
                        color={colors.white}
                      />
                      <Text
                        style={{
                          color: colors.white,
                          fontSize: 16,
                          fontWeight: '600',
                          fontFamily: fontFamily,
                        }}>
                        Add Schedule
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        marginHorizontal: 15,
                        padding: 20,
                        backgroundColor: colors.background,
                        borderRadius: 15,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                      }}>
                      <Icon
                        type="MaterialCommunityIcons"
                        name="calendar-blank"
                        size={50}
                        color={colors.description}
                      />
                      <Text
                        style={{
                          marginTop: 10,
                          fontSize: 16,
                          fontWeight: '600',
                          color: colors.heading,
                          textAlign: 'center',
                          fontFamily: fontFamily,
                        }}>
                        No Activity Found
                      </Text>
                      <Text
                        style={{
                          marginTop: 5,
                          fontSize: 14,
                          color: colors.description,
                          textAlign: 'center',
                          fontFamily: fontFamily,
                        }}>
                        There is no schedule available for this date
                      </Text>
                    </View>
                  )}
                  <View style={{height: 15}} />
                </ScrollView>

                {/* {showTimePicker.show && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={onTimeSelected}
                  />
                )} */}
{showTimePicker.show && (
  Platform.OS === 'ios' ? (
    <RNModal
      transparent
      animationType="slide"
      visible={showTimePicker.show}
      onRequestClose={() => setShowTimePicker({ show: false, field: null })}
    >
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 30,
          alignItems: 'center',
        }}>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onTimeSelected}
            style={{backgroundColor: '#fff'}}
          />
          <Button
            label="Done"
            onPress={() => {
              if (showTimePicker.field) {
                const minutes = tempTime.getMinutes();
                const roundedMinutes = Math.ceil(minutes / 10) * 10;
                tempTime.setMinutes(roundedMinutes);
                tempTime.setSeconds(0);
                const timeString = tempTime.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                setFormData(prev => ({
                  ...prev,
                  [showTimePicker.field as keyof typeof formData]: timeString,
                }));
              }
              setShowTimePicker({ show: false, field: null });
            }}
            style={{width: '90%', margin: 16, backgroundColor: colors.primary}}
          />
        </View>
      </View>
    </RNModal>
  ) : (
    <DateTimePicker
      value={
        formData[showTimePicker.field || 'DAY_START_TIME']
          ? new Date(`1970-01-01T${formData[showTimePicker.field || 'DAY_START_TIME']}`)
          : new Date()
      }
      mode="time"
      is24Hour={false}
      display="default"
      onChange={onTimeSelected}
    />
  )
)}
              </ScrollView>
              <View style={styles.modalActions}>
                <Button
                  label="Save"
                  disable={
                    selectedDate &&
                    new Date(
                      selectedDate.year,
                      selectedDate.month,
                      Number(selectedDate.day),
                    ).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
                      ? false
                      : true
                  }
                  onPress={() => {
                    if (
                      formData.DAY_START_TIME == '' ||
                      formData.DAY_END_TIME == ''
                    ) {
                      Toast('Please add work time');
                    } else if (
                      formData.BREAK_START_TIME == '' ||
                      formData.BREAK_END_TIME == ''
                    ) {
                      Toast('Please add break time');
                    } else {
                      handleSave();
                    }
                  }}
                  style={{backgroundColor: colors.primary}}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        <JobConfirmationModal
          visible={jobConfirmation.visible}
          jobs={jobConfirmation.jobs}
          onClose={handleJobModalClose}
          onConfirm={() => {
            if (jobConfirmation.jobs.length > 0) {
              setRescheduleModal({
                visible: true,
                selectedJob: jobConfirmation.jobs[0],
              });
            }
          }}
        />

        {rescheduleModal.selectedJob && (
          <RescheduleJobModal
            visible={rescheduleModal.visible}
            onClose={() =>
              setRescheduleModal({visible: false, selectedJob: null})
            }
            onSubmit={handleRescheduleSubmit}
            job={rescheduleModal.selectedJob}
            selectedDate={selectedDate}
          />
        )}
      </>
    );
  },
);

const TimeSheet: React.FC<TimeSheetProps> = React.memo(({navigation}) => {
  const colors = useTheme();
  const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<globalSettings[]>([]);
  const [employeeData, setEmployeeData] = useState<employeeData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedDate, setSelectedDate] = useState<DayItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState<{
    visible: boolean;
    isEdit: boolean;
    dayItem: DayItem | null;
  }>({
    visible: false,
    isEdit: false,
    dayItem: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update LoadingOverlay component
  const LoadingOverlay = () => (
    <View
      style={[
        styles.loadingOverlay,
        {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        },
      ]}>
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors.background,
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
            gap: 10,
          },
        ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.text}]}>
          Processing...
        </Text>
      </View>
    </View>
  );

  const handleMonthChange = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    getEmployeeData(month, year);
  }, []);

  const handleDateSelect = useCallback(
    (dayItem: DayItem) => {
      setSelectedDate(dayItem);
    },
    [selectedMonth, selectedYear],
  );

  const getEmployeeData = useCallback(
    async (month: number = selectedMonth, year: number = selectedYear) => {
      try {
        const response = await apiCall.post(
          'api/technicianActivityCalender/getCalenderData',
          {
            MONTH: (month + 1).toString().padStart(2, '0'),
            TECHNICIAN_ID: user?.ID,
            YEAR: year.toString(),
          },
        );
        setEmployeeData(response.data.data);
      } catch (err) {
        console.error(
          'api/technicianActivityCalender/getCalenderData',
          {
            MONTH: (month + 1).toString().padStart(2, '0'),
            TECHNICIAN_ID: user?.ID,
            YEAR: year.toString(),
          },
          err,
        );
      }
    },
    [selectedMonth, selectedYear, user?.ID],
  );

  const getGlobalSettings = useCallback(async () => {
    try {
      const response = await apiCall.post('api/technician/getData', {
        filter: ` AND IS_ACTIVE = 1 AND ID = ${user?.ID}`,
      });
      setGlobalSettings(response.data.data2);
    } catch (err) {
      console.error(
        'api/technician/getData',
        {filter: ` AND IS_ACTIVE = 1 AND ID = ${user?.ID}`},
        err,
      );
    }
  }, [user?.ID]);
  const convertTime = (time: string | null) => {
    if (!time) return null;
    return time.split(':').length === 2 ? time + ':00' : time;
  };
  const handleUpdateSchedule = async (createData: DayItem) => {
    setIsSubmitting(true);
    try {
      const payload = {
        BREAK_END_TIME: convertTime(createData.BREAK_END_TIME),
        BREAK_START_TIME: convertTime(createData.BREAK_START_TIME),
        CLIENT_ID: 1,
        DAY_END_TIME: convertTime(createData.DAY_END_TIME),
        DAY_START_TIME: convertTime(createData.DAY_START_TIME),
        ID: createData.ID,
        IS_SERIVCE_AVAILABLE: createData.IS_AVAILABLE ? 1 : 0,
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        DATE_OF_MONTH: `${createData.year}-${(createData.month + 1)
          .toString()
          .padStart(2, '0')}-${createData.day.toString().padStart(2, '0')}`,
      };

      const response = await apiCall.put(
        'api/technicianActivityCalender/update',
        payload,
      );
      if (response.data.code === 200) {
        await getEmployeeData();
        await getGlobalSettings(); // Refresh global settings
        setEditModalVisible({isEdit: false, visible: false, dayItem: null});
        // Update selected date with new data
        const updatedData = response.data.data;
        setSelectedDate({
          ...createData,
          ...updatedData,
          isDataAvailable: true,
        });
      }
    } catch (err) {
      console.error('Update schedule error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSchedule = async (createData: DayItem) => {
    setIsSubmitting(true);
    try {
      const payload = {
        BREAK_END_TIME: convertTime(createData.BREAK_END_TIME),
        BREAK_START_TIME: convertTime(createData.BREAK_START_TIME),
        CLIENT_ID: 1,
        DAY_END_TIME: convertTime(createData.DAY_END_TIME),
        DAY_START_TIME: convertTime(createData.DAY_START_TIME),
        ID: '',
        IS_SERIVCE_AVAILABLE: createData.IS_AVAILABLE ? 1 : 0,
        TECHNICIAN_ID: user?.ID,
        DATE_OF_MONTH: `${createData.year}-${(createData.month + 1)
          .toString()
          .padStart(2, '0')}-${createData.day.toString().padStart(2, '0')}`,
      };

      const response = await apiCall.post(
        'api/technicianActivityCalender/create',
        payload,
      );
      if (response.data.code === 200) {
        await getEmployeeData();
        await getGlobalSettings(); // Refresh global settings
        setEditModalVisible({isEdit: false, visible: false, dayItem: null});
        // Update selected date with new data
        const updatedData = response.data.data;
        setSelectedDate({
          ...createData,
          ...updatedData,
          isDataAvailable: true,
        });
      }
    } catch (err) {
      console.error('Create schedule error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const dispatch = useDispatch();

  useEffect(() => {
    Promise.all([getGlobalSettings(), getEmployeeData()]).finally(() =>
      setLoading(false),
    );
  }, [getGlobalSettings, getEmployeeData]);
  const {techStatus} = useSelector((state: RootState) => state.app);

  if (loading) {
    return null; // Or a loading spinner
  }
  const getGlobalSettingForDate: (date: DayItem) => DayItem = date => {
    // Get weekday name for the given date
    const dateValue = new Date(date.year, date.month, Number(date.day));
    const weekDayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const weekDay = weekDayNames[dateValue.getDay()];

    // Find matching global setting for the weekday
    const weekDaySetting = globalSettings?.find(
      setting => setting.WEEK_DAY === weekDay.substring(0, 2),
    );
    // Return default DayItem if no setting found
    if (!weekDaySetting) {
      return {
        day: date.day,
        empty: false,
        isToday: false,
        BREAK_END_TIME: null,
        BREAK_START_TIME: null,
        DAY_START_TIME: null,
        DAY_END_TIME: null,
        IS_AVAILABLE: false,
        month: date.month,
        ID: null,
        year: date.year,
        isDataAvailable: false,
      };
    }
    // Return DayItem with global settings
    return {
      day: date.day,
      empty: false,
      isToday: false,
      BREAK_END_TIME: weekDaySetting.BREAK_END_TIME,
      BREAK_START_TIME: weekDaySetting.BREAK_START_TIME,
      DAY_START_TIME: weekDaySetting.DAY_START_TIME,
      DAY_END_TIME: weekDaySetting.DAY_END_TIME,
      IS_AVAILABLE: weekDaySetting.IS_SERIVCE_AVAILABLE === 1,
      month: date.month,
      year: date.year,
      ID: null,
      isDataAvailable: false,
    };
  };
  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={{flex: 1}}>
        {isSubmitting && <LoadingOverlay />}
        <View
          style={{
            backgroundColor: '#FDFDFD',
            paddingHorizontal: Size.containerPadding,
            paddingTop: Size.containerPadding,
            paddingBottom: 10,
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
            <Text style={[styles.heading, {color: colors.primaryText}]}>
              Availability
            </Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
          <View style={{height: 15}} />
          <Calendar
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthYearChange={handleMonthChange}
            employeeData={employeeData}
            globalSettings={globalSettings}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          <View style={{height: 15}} />
          {/* working days and holidays */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              marginHorizontal: Size.containerPadding * 2,
              gap: Size.containerPadding,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: 3,
                  backgroundColor: colors.white,
                  borderColor: colors.black,
                  borderWidth: 1,
                }}
              />
              <Text
                style={[styles.workingHoursText, {color: colors.primaryText}]}>
                Working days
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: 3,
                  backgroundColor: colors.secondary,
                }}
              />
              <Text
                style={[styles.workingHoursText, {color: colors.primaryText}]}>
                Holidays
              </Text>
            </View>
          </View>
          {selectedDate && selectedDate.isDataAvailable ? (
            <SelectedDateInfo
              selectedDate={selectedDate}
              onEdit={() => {
                setEditModalVisible({
                  visible: true,
                  isEdit: selectedDate.ID ? true : false,
                  dayItem: selectedDate,
                });
              }}
            />
          ) : selectedDate &&
            (selectedDate.year > new Date().getFullYear() ||
              (selectedDate.year === new Date().getFullYear() &&
                selectedDate.month > new Date().getMonth()) ||
              (selectedDate.year === new Date().getFullYear() &&
                selectedDate.month === new Date().getMonth() &&
                Number(selectedDate.day) >= new Date().getDate())) ? (
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.primary,
                  marginHorizontal: 15,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                },
              ]}
              onPress={() =>
                setEditModalVisible({
                  visible: true,
                  isEdit: false,
                  dayItem: selectedDate,
                })
              }>
              <Icon
                type="AntDesign"
                name="plus"
                size={20}
                color={colors.white}
              />
              <Text
                style={{
                  color: colors.white,
                  fontSize: 16,
                  fontWeight: '600',
                  fontFamily: fontFamily,
                }}>
                Add Schedule
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                marginHorizontal: 15,
                padding: 20,
                backgroundColor: colors.background,
                borderRadius: 15,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}>
              <Icon
                type="MaterialCommunityIcons"
                name="calendar-blank"
                size={50}
                color={colors.description}
              />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.heading,
                  textAlign: 'center',
                  fontFamily: fontFamily,
                }}>
                No Activity Found
              </Text>
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 14,
                  color: colors.description,
                  textAlign: 'center',
                  fontFamily: fontFamily,
                }}>
                There is no schedule available for this date
              </Text>
            </View>
          )}
          {selectedDate &&
            editModalVisible.visible &&
            editModalVisible.dayItem && (
              <TimeModal
                isEdit={editModalVisible.isEdit}
                visible={editModalVisible.visible}
                dayItem={editModalVisible.dayItem}
                onClose={() =>
                  setEditModalVisible({
                    isEdit: false,
                    visible: false,
                    dayItem: null,
                  })
                }
                onSave={value => {
                  if (
                    techStatus &&
                    selectedDate.isToday &&
                    !value.IS_AVAILABLE
                  ) {
                    dispatch(updateTechStatus(false));
                  }

                  editModalVisible.isEdit
                    ? handleUpdateSchedule(value)
                    : handleCreateSchedule(value);
                }}
                setIsSubmitting={setIsSubmitting}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                handleMonthChange={handleMonthChange}
                employeeData={employeeData}
                globalSettings={globalSettings}
                selectedDate={selectedDate}
                handleDateSelect={handleDateSelect}
              />
            )}
          <View style={{height: 15}} />
        </ScrollView>
        {selectedDate &&
          new Date(
            selectedDate.year,
            selectedDate.month,
            Number(selectedDate.day),
          ).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (
            <View style={styles.setAvailabilityButton}>
              <Button
                label="Set availability"
                onPress={() => {
                  setEditModalVisible({
                    visible: true,
                    isEdit: selectedDate.ID ? true : false,
                    dayItem: selectedDate,
                  });
                }}
                primary={false}
              />
            </View>
          )}
      </View>
    </SafeAreaView>
  );
});

export default TimeSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily,
  },
  contentContainer: {
    flex: 1,
  },
  calendarContainer: {
    borderRadius: 24,
    marginHorizontal: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderColor: '#CBCBCB',
    backgroundColor: '#FDFDFD',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  arrow: {
    fontSize: 20,
  },
  weekDays: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    width: CELL_SIZE,
    fontFamily: fontFamily,
  },
  calendar: {
    marginTop: 10,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  todayCell: {},
  todayText: {
    fontWeight: '600',
  },
  selectedText: {
    fontWeight: '600',
  },
  selectedDateContainer: {},
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  setAvailabilityButton: {
    padding: Size.containerPadding,
    backgroundColor: '#FDFDFD',
  },
  workingHoursText: {
    fontSize: 14,
    fontFamily: fontFamily,
    fontWeight: '500',
  },
  timeInfoContainer: {
    gap: 15,
    marginHorizontal: Size.containerPadding,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    borderWidth: 1,
    borderColor: '#CBCBCB',
    backgroundColor: '#FDFDFD',
    borderRadius: 8,
    padding: 13,
    gap: 4,
  },
  timeTextContainer: {
    marginLeft: 15,
  },
  timeHeading: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  availabilityContainer: {
    alignItems: 'flex-start',
    marginTop: 10,
  },
  availabilityBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 25,
  },
  formGroup: {
    gap: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: Size.containerPadding,
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalActions: {
    margin: 20,
    backgroundColor: '#FDFDFD',
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  addButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
  },
  jobModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  jobModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: fontFamily,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: fontFamily,
  },
  jobsList: {
    padding: 16,
  },
  jobItemFullScreen: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b094f550',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitleFullScreen: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    fontFamily: fontFamily,
    marginBottom: 8,
  },
  jobDetails: {
    gap: 6,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 13,
    fontFamily: fontFamily,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  dateTimeRow: {
    marginVertical: Size.lg,
    flexDirection: 'row',
    gap: Size.base,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Size.base,
    borderWidth: 1,
    borderRadius: 8,
  },
  reasonCard: {
    marginTop: 5,
    padding: Size.base,
    borderWidth: 1,
    borderColor: '#b094f550',
    borderRadius: 8,
    marginBottom: Size.base,
  },
  reasonLabel: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 1,
    borderColor: '#b094f550',
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
    borderColor: '#092B9C',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
});
