export {
  type StoreType,
  EU_STORE_COUNTRIES,
  getStoreForCountry,
  getCheckoutDomain,
} from './config';

export {
  type StoreContextClient,
  type StoreRoutingSource,
  STORE_ID_TO_TYPE,
  getClientStoreContext,
  determineStore,
  getRegionDisplayName,
  getRoutingSourceDescription,
} from './context';
