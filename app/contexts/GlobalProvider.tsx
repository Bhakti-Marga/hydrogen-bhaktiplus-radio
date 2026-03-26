import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import type {
  Action,
  Dispatch,
  GlobalContext,
  GlobalState,
  ModalProps,
} from "~/lib/types";
import { getPreferences, savePreferences, type UserPreferences } from "~/lib/utils/preferences";

const Context = createContext({ state: {}, actions: {} } as GlobalContext);

const globalState: GlobalState = {
  modal: { children: null, props: {} },
  settings: getPreferences(),
  emitter: null,
  hasInteracted: false,
};

const reducer = (state: GlobalState, action: Action) => {
  switch (action.type) {
    case "OPEN_MODAL":
      return {
        ...state,
        modal: {
          children: action.payload.children,
          props: { ...action.payload.props },
        },
      };
    case "CLOSE_MODAL":
      return {
        ...state,
        modal: { children: null, props: {} },
      };
    case "UPDATE_PREFERENCES":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "SET_HAS_INTERACTED":
      return {
        ...state,
        hasInteracted: action.payload,
      };
    default:
      throw new Error(`Invalid Context action of type: ${action.type}`);
  }
};

const actions = (dispatch: Dispatch) => ({
  openModal: (children: ReactNode, props?: ModalProps) => {
    dispatch({ type: "OPEN_MODAL", payload: { children, props } });
  },
  closeModal: () => {
    dispatch({ type: "CLOSE_MODAL" });
  },
  updatePreferences: (preferences: Partial<UserPreferences>) => {
    savePreferences(preferences); // Persist to storage
    dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });
  },
  setHasInteracted: (hasInteracted: boolean) => {
    dispatch({ type: "SET_HAS_INTERACTED", payload: hasInteracted });
  },
});

export function GlobalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...globalState,
  });

  // Memoize actions separately to prevent new object creation on every render
  const actionsValue = useMemo(() => {
    return actions(dispatch);
  }, [dispatch]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return { state, actions: actionsValue };
  }, [state, actionsValue]);

  // Global click/tap handler to track user interaction
  // Note: This resets on every page load to match browser autoplay policy behavior
  // Using capture phase to catch events BEFORE stopPropagation in child components
  useEffect(() => {
    // Set up one-time click/tap listener in capture phase
    const handleInteraction = () => {
      actionsValue.setHasInteracted(true);
    };

    document.addEventListener('click', handleInteraction, { once: true, capture: true });
    document.addEventListener('touchstart', handleInteraction, { once: true, capture: true });

    return () => {
      document.removeEventListener('click', handleInteraction, { capture: true });
      document.removeEventListener('touchstart', handleInteraction, { capture: true });
    };
  }, [actionsValue]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useGlobalContext = () => useContext(Context);
