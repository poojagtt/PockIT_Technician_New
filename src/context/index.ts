import {store, useDispatch, useSelector} from './reducers/store';
import {setSplash, getUserInfo, setUser} from './reducers/app';
import {toggleSelectedItem, clearSelectedItems} from './reducers/part';
class AllReducer {
  setUser = setUser
  setSplash = setSplash;
  getUserInfo = getUserInfo;
  toggleSelectedItem = toggleSelectedItem;
  clearSelectedItems = clearSelectedItems;
}

const Reducers = new AllReducer();
export {store, useDispatch, useSelector, Reducers};
