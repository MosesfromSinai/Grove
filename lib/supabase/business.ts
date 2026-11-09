// Business data boundary. getMyDeals, setPin, and updateTruckLocation follow the data switch in
// ./index; getMyBusiness and the writes stay mock-backed until #73 replaces them with
// authenticated Supabase calls. Components never mutate fixture arrays directly.
export { getMyDeals, setPin, updateTruckLocation } from "./index";
export { createDeal, endDeal, cancelDeal, getMyBusiness, getBusinessLocationOptions, saveBusiness } from "../../mocks";
