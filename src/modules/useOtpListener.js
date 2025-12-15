import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

 function useOtpListener(onOtp) {
  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.OtpReceiver);
    const sub = eventEmitter.addListener("ON_OTP_RECEIVED", otp => {
      onOtp(otp);
    });

    return () => sub.remove();
  }, []);
}
export default useOtpListener;
