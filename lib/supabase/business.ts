// Business data boundary. Reads and truck-location updates follow the shared data switch.
// Other business writes stay mock-backed until #73; a real business UUID cannot be saved
// by those mock-only onboarding/posting operations. Components never mutate fixture arrays.
export { getMyDeals, setPin, getMyBusiness, updateTruckLocation } from "./index";
export { createDeal, endDeal, cancelDeal, getBusinessLocationOptions, saveBusiness } from "../../mocks";
