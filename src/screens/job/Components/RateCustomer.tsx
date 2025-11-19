import {View, Text, StyleSheet} from 'react-native';
import React, {useState} from 'react';
import StarRating from 'react-native-star-rating-widget';
import {Button, TextInput} from '../../../components';
import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {useSelector} from '../../../context';
import moment from 'moment';
import Toast from '../../../components/Toast';

interface Props {
  jobDetails: JobData;
  onSuccess: () => void;
}

const RateUs = ({jobDetails, onSuccess}: Props) => {
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const [rating, setRating] = useState({
    customer: 0,
    remark: '',
  });
  const [loader, setLoader] = useState(false);

  const addFeedback = async () => {
    try {
      setLoader(true);
      const body = {
        ORDER_ID: jobDetails.ORDER_ID,
        JOB_CARD_ID: jobDetails.ID,
        TECHNICIAN_ID: user?.ID,
        CUSTOMER_ID: jobDetails.CUSTOMER_ID,
        RATING: rating.customer,
        COMMENTS: rating.remark,
        FEEDBACK_DATE_TIME: moment().format('YYYY-MM-DD HH:mm:ss'),
        CLIENT_ID: 1,
      };
      const res = await apiCall.post(
        'api/techniciancustomerfeedback/create',
        body,
      );
      if (res.status == 200 && res.data.code == 200) {
        onSuccess();
      }
    } catch (error) {
      console.warn('err..', error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={[styles._card, {gap: 14}]}>
      <Text style={[styles._detailsTitleTxt, {color: colors.primaryText}]}>
        {'Rate Customer'}
      </Text>

      {/* service rating */}
      <View style={{gap: 10}}>
        <Text style={[styles._label]}>{'Please rate your experience'}</Text>
        <StarRating
          rating={rating.customer}
          onChange={(e: any) => {
            setRating({...rating, customer: e});
          }}
          starSize={35}
          enableHalfStar={false}
        />
      </View>
      <TextInput
        multiline
        placeholder={'Comment'}
        value={rating.remark}
        onChangeText={txt => {
          setRating({...rating, remark: txt});
        }}
        maxLength={512}
      />
      <Button
        label="Submit"
        onPress={() => {
          if (rating.customer < 1) {
            Toast('Rating is required');
            return;
          } else {
            addFeedback();
          }
        }}
        loading={loader}
      />
    </View>
  );
};

export default RateUs;

const styles = StyleSheet.create({
  _card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
  },
  _detailsTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 700,
    color: '#092B9C',
    letterSpacing: 0.6,
  },
  _label: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
    color: '#333333',
  },
});
