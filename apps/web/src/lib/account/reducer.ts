import type { AccountState, AccountAction } from "./types";

export const initialState: AccountState = {
  overlayOpen: false,
  activeView: "sign-in",
  email: "",
};

export function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case "open":
      return { ...state, overlayOpen: true };

    case "close":
      return { ...state, overlayOpen: false };

    case "setView":
      return { ...state, activeView: action.payload };

    case "setEmail":
      return { ...state, email: action.payload };

    case "reset":
      return { ...initialState };

    default:
      return state;
  }
}
