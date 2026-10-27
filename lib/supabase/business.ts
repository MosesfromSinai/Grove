// Business data boundary. getMyDeals and setPin follow the data switch in ./index; the writes
// stay mock-backed until #73 replaces them with authenticated Supabase writes. Components never
// mutate fixture arrays directly.
export { getMyDeals, setPin } from "./index";
export { createDeal, endDeal, cancelDeal, getMyBusiness, getBusinessLocationOptions, saveBusiness } from "../../mocks";
