// Mock-backed business data boundary. Replace this adapter with authenticated
// Supabase writes in #73; components never mutate fixture arrays directly.
export { createDeal, getMyDeals, endDeal, cancelDeal, getMyBusiness, getBusinessLocationOptions, saveBusiness, setPin } from "../../mocks";
