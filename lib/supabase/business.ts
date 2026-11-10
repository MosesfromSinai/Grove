// Compatibility exports; all business reads/writes now follow the shared switch.
// Components import from @/lib/supabase. No real operation falls back to a mock.
export { getMyDeals, setPin, createDeal, endDeal, cancelDeal, getMyBusiness, getBusinessLocationOptions, saveBusiness, updateTruckLocation } from "./index";
