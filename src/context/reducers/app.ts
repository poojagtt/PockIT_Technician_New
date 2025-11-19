import {PayloadAction, createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {apiCall, useStorage} from '../../modules';
export interface AppState {
  splash: boolean;
  user: TechnicianInterface | null;
  techStatus: boolean;
}
const initialState: AppState = {
  splash: true,
  user: null,
  techStatus: false,
};
export const getUserInfo = createAsyncThunk<
  {
    user: TechnicianInterface | null;
  }
>(`app/getUserInfo`, async (_, { rejectWithValue }) => {
  let user: number | undefined = useStorage.getNumber('user');
  if (user == undefined) {
    return {
      user: null
    };
  } else {
    let userData: TechnicianInterface | null = null;
    userData = await apiCall
      .post(`api/technician/get`, {filter: ` AND ID = ${user} `})
      .then(res => {
        if (res.data.code == 200) {
          useStorage.set('userName', res.data.data[0].NAME);
          console.log('res.data.data[0].CAN_ACCEPT_JOB', res.data.data[0].CAN_ACCEPT_JOB);
          useStorage.set('acceptPermission', parseInt(res.data.data[0].CAN_ACCEPT_JOB));

          return res.data.data[0];
        } else {
          return null;
        }
      })
      .catch(error => {
        console.warn('Error In Redux for getting a Data', error);
        return null;
      });
    return {
      user: userData,
    };
  }
});

export const getTechStatus = createAsyncThunk<{techStatus: boolean}>(
  'app/getTechStatus',
  async (_, {rejectWithValue}) => {
    try {
      const res = await apiCall.post(`api/technicainDayLog/get`, {
        filter: {
          $and: [
            {TECHNICIAN_ID: useStorage.getNumber('user')},
            {
              $expr: {
                $eq: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$LOG_DATE_TIME',
                    },
                  },
                  new Date().toISOString().split('T')[0],
                ],
              },
            },
          ],
        },
      });
      if (res.status === 200 && res.data.code === 200) {
        if (res.data.data.length === 0) {
          useStorage.set('TECH_ENABLE_STATUS', true);
          return {techStatus: true};
        } else {
          const lastItem = res.data.data[res.data.data.length - 1];
          const status = lastItem.STATUS === 'EN';
          useStorage.set('TECH_ENABLE_STATUS', status);
          return {techStatus: status};
        }
      }
      return {techStatus: false};
    } catch (error) {
      console.log(error);
      return {techStatus: false};
    }
  },
);

export const updateTechStatus = createAsyncThunk<
  {techStatus: boolean},
  boolean
>('app/updateTechStatus', async (status, {rejectWithValue}) => {
  try {
    const userId = useStorage.getNumber('user');
    const body = {
      TECHNICIAN_ID: userId,
      STATUS: status ? 'EN' : 'DE',
      CLIENT_ID: 1,
    };
    const res = await apiCall.post(`api/technicainDayLog/addLog`, body);
    if (res.status === 200 && res.data.code === 200) {
      useStorage.set('TECH_ENABLE_STATUS', status);
      return {techStatus: status};
    }
    return {techStatus: !status}; // Revert if failed
  } catch (error) {
    console.log(error);
    return {techStatus: !status}; // Revert if failed
  }
});

export const AppSlice = createSlice({
  name: 'App',
  initialState,
  reducers: {
    setSplash: (state, {payload}: PayloadAction<boolean>) => {
      state.splash = payload;
    },
    setUser: (state, {payload}: PayloadAction<TechnicianInterface>) => {
      state.user = payload;
    },
    setTechStatus: (state, {payload}: PayloadAction<boolean>) => {
      state.techStatus = payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getUserInfo.pending, (state, {payload}) => {
        state.user = null;
        state.splash = true;
      })
      .addCase(getUserInfo.fulfilled, (state, {payload}) => {
        state.user = payload.user;
        state.splash = false;
      })
      .addCase(getTechStatus.fulfilled, (state, {payload}) => {
        state.techStatus = payload.techStatus;
      })
      .addCase(updateTechStatus.fulfilled, (state, {payload}) => {
        state.techStatus = payload.techStatus;
      });
  },
});

export const {setSplash, setUser, setTechStatus} = AppSlice.actions;
export default AppSlice.reducer;
