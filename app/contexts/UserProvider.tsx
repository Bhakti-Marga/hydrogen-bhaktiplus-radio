import { Customer } from "@shopify/hydrogen/storefront-api-types";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useReducer } from "react";

import type {
  Action,
  Dispatch,
  SubscriptionTier,
  User,
  UserContext,
  UserState,
} from "~/lib/types";

const Context = createContext({ state: {}, actions: {} } as UserContext);

const reducer = (state: UserState, action: Action) => {
  switch (action.type) {
    case "SET_LOGGED_IN":
      return {
        ...state,
        isLoggedIn: true,
      };
    case "SET_LOGGED_OUT":
      return {
        ...state,
        isLoggedIn: false,
      };
    case "SET_SUBSCRIPTION_TIER":
      return {
        ...state,
        subscriptionTier: action.payload || "unsubscribed",
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };
    default: {
      throw new Error(`Invalid Context action of type: ${action.type}`);
    }
  }
};

const actions = (dispatch: Dispatch) => ({
  setLoggedIn: () => {
    dispatch({ type: "SET_LOGGED_IN" });
  },
  setLoggedOut: () => {
    dispatch({ type: "SET_LOGGED_OUT" });
  },
  setSubscriptionTier: (subscriptionTier: SubscriptionTier) => {
    dispatch({ type: "SET_SUBSCRIPTION_TIER", payload: subscriptionTier });
  },
  setUser: (user: User) => {
    dispatch({ type: "SET_USER", payload: user });
  },
});

export function UserProvider({
  children,
  user,
  subscriptionTier,
}: {
  children: ReactNode;
  user: User;
  subscriptionTier: SubscriptionTier;
}) {
  // Initialize state from props (server-side data with debug override already applied)
  const initialState: UserState = {
    isLoggedIn: !!user,
    user: user || null,
    subscriptionTier: subscriptionTier || "unsubscribed",
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(() => ({ state, actions: actions(dispatch) }), [state]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useUserContext = () => useContext(Context);
