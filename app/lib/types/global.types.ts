import { Product } from "@shopify/hydrogen/storefront-api-types";
import type { UserPreferences } from "~/lib/utils/preferences";

export type Action = { type: string; payload?: any };

export type Dispatch = ({ type, payload }: Action) => void;

export type Modal = {
  children: React.ReactNode | null;
  props?: ModalProps;
};

export type Settings = UserPreferences;

export type ModalProps = {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  bgColor?: string;
  onClose?: () => void;
} & Record<string, any>;

export interface GlobalState {
  modal: Modal;
  settings: Settings;
  emitter: any;
  hasInteracted: boolean;
}

export interface ShopifySubscriptionProducts {
  live: Product | null;
  premium: Product | null;
  supporter: Product | null;
}

export interface GlobalActions {
  openModal: (children: React.ReactNode, props?: ModalProps) => void;
  closeModal: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setHasInteracted: (hasInteracted: boolean) => void;
}

export interface GlobalContext {
  state: GlobalState;
  actions: GlobalActions;
}
