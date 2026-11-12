export type AccountViewType =
  | "sign-in"
  | "create"
  | "reset-request"
  | "check-inbox"
  | "confirmation";

export interface AccountState {
  overlayOpen: boolean;
  activeView: AccountViewType;
  email: string;
}

export type AccountAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "setView"; payload: AccountViewType }
  | { type: "setEmail"; payload: string }
  | { type: "reset" };
