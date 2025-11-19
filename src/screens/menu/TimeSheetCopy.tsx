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
import {useSelector} from '../../context';
import RescheduleRequest from '../job/RescheduleRequest';
import {RadioButton} from 'react-native-paper';

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

// Extract WeekDayHeader component
const WeekDayHeader = React.memo(() => {
  const colors = useTheme();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={[styles.weekDays, {borderBottomColor: colors.secondary}]}>
      {weekDays.map(day => (
        <Text key={day} style={[styles.weekDay, {color: colors.text}]}>
          {day}
        </Text>
      ))}
    </View>
  );
});

// Extract CalendarHeader component
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
          style={[styles.arrowContainer, {backgroundColor: colors.background}]}
          onPress={handlePrevMonth}>
          <Text style={[styles.arrow, {color: colors.text}]}>←</Text>
        </TouchableOpacity>

        <Text style={[styles.monthYear, {color: colors.text}]}>
          {months[selectedMonth]} {selectedYear}
        </Text>

        <TouchableOpacity
          style={[styles.arrowContainer, {backgroundColor: colors.background}]}
          onPress={handleNextMonth}>
          <Text style={[styles.arrow, {color: colors.text}]}>→</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

// Extract SelectedDateInfo component
const SelectedDateInfo = React.memo(
  ({selectedDate, onEdit}: {selectedDate: DayItem; onEdit: () => void}) => {
    const colors = useTheme();

    return (
      <View
        style={[
          styles.selectedDateContainer,
          {backgroundColor: colors.background},
        ]}>
        <View style={styles.selectedDateHeader}>
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
        </View>

        <View style={styles.timeInfoContainer}>
          {selectedDate.IS_AVAILABLE && (
            <View style={styles.timeInfoRow}>
              <Icon
                type="MaterialIcons"
                name="access-time"
                size={20}
                color={colors.description}
              />
              <View style={styles.timeTextContainer}>
                <Text style={[styles.timeLabel, {color: colors.description}]}>
                  Working Hours
                </Text>
                <Text style={[styles.timeValue, {color: colors.heading}]}>
                  {selectedDate.DAY_START_TIME || '--:--'} -{' '}
                  {selectedDate.DAY_END_TIME || '--:--'}
                </Text>
              </View>
            </View>
          )}

          {selectedDate.IS_AVAILABLE && (
            <View style={styles.timeInfoRow}>
              <Icon
                type="MaterialIcons"
                name="free-breakfast"
                size={20}
                color={colors.description}
              />
              <View style={styles.timeTextContainer}>
                <Text style={[styles.timeLabel, {color: colors.description}]}>
                  Break Time
                </Text>
                <Text style={[styles.timeValue, {color: colors.heading}]}>
                  {selectedDate.BREAK_START_TIME || '--:--'} -{' '}
                  {selectedDate.BREAK_END_TIME || '--:--'}
                </Text>
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

// Optimize Calendar component
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

    const getDaysInMonth = useMemo(() => {
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

        // if (currentDate < today) {
        //   // Past dates - use dayData if exists, otherwise null
        //   if (dayData?.ID) {
        //     scheduleData = {
        //       BREAK_END_TIME: dayData.BREAK_END_TIME,
        //       BREAK_START_TIME: dayData.BREAK_START_TIME,
        //       DAY_START_TIME: dayData.DAY_START_TIME,
        //       DAY_END_TIME: dayData.DAY_END_TIME,
        //       IS_AVAILABLE: dayData.IS_SERIVCE_AVAILABLE === 1,
        //       isDataAvailable: true,
        //       ID: dayData.ID.toString(),
        //     };
        //   }
        // } else {
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
          // Use globalSettings based on weekday
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
        // }

        daysArray.push({
          day: i,
          month: selectedMonth,
          year: selectedYear,
          empty: false,
          isToday: currentDate.getTime() === today.getTime(),
          ...scheduleData,
        });
        if (currentDate.getTime() === today.getTime()) {
          onDateSelect({
            day: i,
            month: selectedMonth,
            year: selectedYear,
            empty: false,
            isToday: currentDate.getTime() === today.getTime(),
            ...scheduleData,
          });
        }
      }

      return daysArray;
    }, [selectedMonth, selectedYear, employeeData, globalSettings]);

    const renderDay = useCallback(
      ({item}: RenderDayProps) => {
        return (
          <TouchableOpacity
            style={[
              styles.dayCell,
              item.empty && styles.emptyCell,
              item.isToday && {
                backgroundColor: item.IS_AVAILABLE
                  ? colors.primary2
                  : colors.error,
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
                item.isToday && {color: colors.background},
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
      <View
        style={[
          styles.calendarContainer,
          {backgroundColor: colors.background},
        ]}>
        <CalendarHeader
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={onMonthYearChange}
          months={months}
        />
        <WeekDayHeader />
        <FlatList
          removeClippedSubviews={false}
          data={getDaysInMonth}
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

// Add new JobConfirmationModal component after TimeModal
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

// Update RescheduleJobModal component
const RescheduleJobModal = React.memo(
  ({
    visible,
    onClose,
    onSubmit,
    job,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (date: any, time: any, reason: string) => void;
    job: JobList;
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
    // console.log('date', date, 'time', time, 'value', value);
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
                  <Text>{formattedDate}</Text>
                  <Icon name="calendar" type="AntDesign" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowPicker(prev => ({...prev, time: true}));
                  }}
                  activeOpacity={0.8}
                  style={styles._dateTimeContainer}>
                  <Text>{formattedTime}</Text>
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
        {showPicker.date && (
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
        )}
      </Modal>
    );
  },
);

// Update TimeModal component props
const TimeModal = React.memo(
  ({
    visible,
    onClose,
    isEdit,
    dayItem,
    onSave,
    setIsSubmitting,
  }: {
    visible: boolean;
    onClose: () => void;
    isEdit: boolean;
    dayItem: DayItem;
    onSave: (updatedData: DayItem) => void;
    setIsSubmitting: (value: boolean) => void;
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
            setJobConfirmation({
              visible: true,
              jobs: response.data.data,
            });
            return;
          }
        } catch (error) {
          console.error('Error checking jobs:', error);
        }
      }
      setFormData(prev => ({...prev, IS_AVAILABLE: value}));
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

    const handleTimeChange = (field: keyof typeof formData) => {
      setShowTimePicker({show: true, field});
    };

    const onTimeSelected = (event: any, selectedTime?: Date) => {
      setShowTimePicker({show: false, field: null});
      if (event.type === 'set' && selectedTime && showTimePicker.field) {
        const timeString = selectedTime.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        setFormData(prev => ({
          ...prev,
          [showTimePicker.field]: timeString,
        }));
      }
    };

    const handleSave = () => {
      onSave({
        ...dayItem,
        ...formData,
      });
      //reset form data
      setFormData({
        IS_AVAILABLE: false,
        DAY_START_TIME: '',
        DAY_END_TIME: '',
        BREAK_START_TIME: '',
        BREAK_END_TIME: '',
      });
      onClose(); // Close modal after save
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
              {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
            ]}>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: colors.background},
              ]}>
              <ScrollView>
                {isEdit ? (
                  <Text style={[styles.modalTitle, {color: colors.text}]}>
                    Edit Schedule for {dayItem.day}
                  </Text>
                ) : (
                  <Text style={[styles.modalTitle, {color: colors.text}]}>
                    Schedule for {dayItem.day}
                  </Text>
                )}

                <View style={styles.formGroup}>
                  <View style={styles.switchContainer}>
                    <Text style={{color: colors.text}}>Available</Text>
                    <Switch
                      value={formData.IS_AVAILABLE}
                      onValueChange={handleAvailabilityChange}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => handleTimeChange('DAY_START_TIME')}>
                    <Text style={{color: colors.text}}>Start Time</Text>
                    <Text style={{color: colors.text}}>
                      {formData.DAY_START_TIME || 'Set Time'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => handleTimeChange('DAY_END_TIME')}>
                    <Text style={{color: colors.text}}>End Time</Text>
                    <Text style={{color: colors.text}}>
                      {formData.DAY_END_TIME || 'Set Time'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => handleTimeChange('BREAK_START_TIME')}>
                    <Text style={{color: colors.text}}>Break Start</Text>
                    <Text style={{color: colors.text}}>
                      {formData.BREAK_START_TIME || 'Set Time'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => handleTimeChange('BREAK_END_TIME')}>
                    <Text style={{color: colors.text}}>Break End</Text>
                    <Text style={{color: colors.text}}>
                      {formData.BREAK_END_TIME || 'Set Time'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showTimePicker.show && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onTimeSelected}
                  />
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {backgroundColor: colors.background},
                    ]}
                    onPress={onClose}>
                    <Text style={{color: colors.text}}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, {backgroundColor: colors.primary}]}
                    onPress={handleSave}>
                    <Text style={{color: colors.white}}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
          />
        )}
      </>
    );
  },
);

// Add loading state to TimeSheet component
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
  //sometime times come in format of HH:mm:ss and sometime in format of HH:mm we need to convert it to HH:mm:ss
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
        setEditModalVisible({isEdit: false, visible: false, dayItem: null});
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
        setEditModalVisible({isEdit: false, visible: false, dayItem: null});
      }
    } catch (err) {
      console.error('Create schedule error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    Promise.all([getGlobalSettings(), getEmployeeData()]).finally(() =>
      setLoading(false),
    );
  }, [getGlobalSettings, getEmployeeData]);

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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {isSubmitting && <LoadingOverlay />}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Icon
            type="MaterialIcons"
            name="keyboard-backspace"
            size={27}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={[styles.heading, {color: colors.text}]}>
            Technical Activity Calendar
          </Text>
        </View>
      </View>
      <ScrollView
        style={{flex: 1}}
        // contentContainerStyle={{ marginBottom: 20 }}
      >
        {/* <View style={styles.contentContainer}> */}
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
        {/* </View> */}
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
            <Icon type="AntDesign" name="plus" size={20} color={colors.white} />
            <Text
              style={{color: colors.white, fontSize: 16, fontWeight: '600'}}>
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
              }}>
              No Activity Found
            </Text>
            <Text
              style={{
                marginTop: 5,
                fontSize: 14,
                color: colors.description,
                textAlign: 'center',
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
                editModalVisible.isEdit
                  ? handleUpdateSchedule(value)
                  : handleCreateSchedule(value);
              }}
              setIsSubmitting={setIsSubmitting}
            />
          )}
        <View style={{height: 15}} />
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    marginBottom: Size.sm,
    justifyContent: 'space-between',
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
    borderRadius: 15,
    marginHorizontal: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
  },
  weekDays: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    width: CELL_SIZE,
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
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
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
  selectedDateContainer: {
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  timeInfoContainer: {
    gap: 15,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeTextContainer: {
    marginLeft: 15,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
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
    fontFamily: 'SF Pro Text',
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