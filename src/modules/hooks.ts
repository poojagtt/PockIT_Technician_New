import {createMMKV} from 'react-native-mmkv';
export const useStorage = createMMKV({
  id: 'local-storage',
  encryptionKey: 'hunter2',
  mode: 'single-process',
});

export const token = createMMKV({
  id: 'token-storage',
  encryptionKey: 'token_storage',
  mode: 'single-process',
});

class TokenStorageClass {
  getToken: () => string = () => {
    try {
      const tokenValue = token.getString(`token_value`);
      if (tokenValue) {
        return tokenValue;
      } else {
        return '';
      }
    } catch (error) {
      return '';
    }
  };
  setToken: (value: string) => boolean = value => {
    try {
      if (value) {
        token.set(`token_value`, value);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };
  clearToken: () => void = () => {
    token.clearAll();
  };
}
export const tokenStorage = new TokenStorageClass();
