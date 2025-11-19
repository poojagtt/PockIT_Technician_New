import {PayloadAction, createSlice} from '@reduxjs/toolkit';
export interface AppState {
  selectedPart: any;
}
const initialState: AppState = {
  selectedPart: [],
};
export const PartSlice = createSlice({
  name: 'Part',
  initialState,
  reducers: {
    toggleSelectedItem: (state, {payload}: PayloadAction<InventoryItem>) => {
      const exists = state.selectedPart.some(
        (item: InventoryItem) => item.ID === payload.ID,
      );
      if (exists) {
        state.selectedPart = state.selectedPart.filter(
          (item: InventoryItem) => item.ID !== payload.ID,
        );
      } else {
        state.selectedPart.push(payload);
      }
    },

    clearSelectedItems: state => {
      state.selectedPart = [];
    },
  },
});

export const {toggleSelectedItem, clearSelectedItems} = PartSlice.actions;
export default PartSlice.reducer;
