import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType, TripType, FareBreakdown } from '../types';
import { MapPin, User, Phone, Smartphone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle, Repeat, Navigation, Package, X } from 'lucide-react';
import { sendBookingEmail } from '../services/emailService';
import { appendBookingToSheet } from '../services/googleSheets';
import { motion } from 'framer-motion';

declare const google: any;

const TripTypeRental = (TripType as any).RENTAL || 'Rental' as TripType;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const ONE_WAY_PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 30,
  [VehicleType.SUV_PLUS]: 32,
  [VehicleType.INNOVA]: 35,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const ROUND_TRIP_PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 15,
  [VehicleType.SEDAN]: 16,
  [VehicleType.SUV]: 20,
  [VehicleType.SUV_PLUS]: 22,
  [VehicleType.INNOVA]: 25,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const LOCAL_PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
};

const ONE_WAY_SHORT_RATES: Record<string, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
};

const LOCAL_SHORT_RATES: Record<string, number> = {
  [VehicleType.MINI]: 23,
  [VehicleType.SEDAN]: 25,
  [VehicleType.SUV]: 40,
  [VehicleType.SUV_PLUS]: 45,
  [VehicleType.INNOVA]: 50,
};

const HILL_STATIONS = [
  'ooty', 'udhaga', 'kodai', 'munnar', 'yercaud', 'coorg', 'kodagu', 
  'wayanad', 'valparai', 'yelagiri', 'kolli', 'velliangiri', 'topslip',
  'vagamon', 'thekkady', 'idukki', 'pykara', 'masinagudi', 'coonoor', 
  'palamathi', 'javadi', 'megamalai', 'nilgiri', 'dindigul', 'madikeri',
  'kodagiri', 'kotagiri', 'kothagiri', 'gudalur', 'mudumalai', 'bandipur',
  'chikmagalur', 'sakleshpur', 'agumbe', 'kudremukh', 'sringeri', 'horanadu',
  'vythiri', 'lakkidi', 'peermade', 'kumily', 'ponmudi', 'muthanga',
  'meppadi', 'thusharagiri', 'vattavada', 'marayoor', 'nelliyampathy',
  'parambikulam', 'athirapally', 'theni', 'bodinayakkanur', 'cumbum', 
  'shringeri', 'kalpetta', 'bathery', 'mananthavady'
];

// Major Hill Station Zones (Lat, Lng, Radius in KM)
const HILL_STATION_ZONES = [
  { name: 'Ooty/Nilgiris', lat: 11.4102, lng: 76.6950, radius: 40 },
  { name: 'Kodaikanal', lat: 10.2381, lng: 77.4891, radius: 30 },
  { name: 'Munnar', lat: 10.0889, lng: 77.0595, radius: 35 },
  { name: 'Yercaud', lat: 11.7753, lng: 78.2093, radius: 15 },
  { name: 'Coorg/Madikeri', lat: 12.4244, lng: 75.7382, radius: 40 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320, radius: 40 },
  { name: 'Valparai', lat: 10.3271, lng: 76.9554, radius: 25 },
  { name: 'Yelagiri', lat: 12.5785, lng: 78.6385, radius: 15 },
  { name: 'Kolli Hills', lat: 11.2721, lng: 78.3396, radius: 20 },
  { name: 'Thekkady', lat: 9.6031, lng: 77.1615, radius: 25 },
  { name: 'Chikmagalur', lat: 13.3161, lng: 75.7720, radius: 30 },
];

const HILL_EXCLUSION_KEYWORDS = [
  // Base towns near Nilgiris (MOST IMPORTANT)
  'mettupalayam',
  'karamadai',
  'coimbatore',
  'sirumugai',
  'annur',
  'periyanaickenpalayam',
  'sathyamangalam',

  // Entry/low altitude routes
  'gobichettipalayam',
  'tiruppur',
  'pollachi',
  'udumalaipettai',
  'dharapuram',

  // Kerala plains (avoid false hill triggers)
  'palakkad',
  'thrissur',
  'ernakulam',
  'cochin',
  'alappuzha',

  // Border buffer towns
  'bhavani',
  'salem city',
  'erode city'
];

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const checkIsHillStation = async (address: string): Promise<boolean> => {
  if (!address) return false;

  const lower = address.toLowerCase();

  // ❌ 1. EXCLUSION CHECK FIRST (VERY IMPORTANT)
  if (HILL_EXCLUSION_KEYWORDS.some(word => lower.includes(word))) {
    return false;
  }

  // ✅ 2. FAST KEYWORD CHECK
  if (HILL_STATIONS.some(hs => lower.includes(hs))) {
    return true;
  }

  // 3. GEOCODING CHECK (ACCURATE)
  try {
    if (!(window as any).google?.maps?.Geocoder) return false;

    const geocoder = new (window as any).google.maps.Geocoder();

    const result = await new Promise<any[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results: any, status: string) => {
        if (status === 'OK' && results) resolve(results);
        else reject(status);
      });
    });

    if (result && result[0]) {
      const loc = result[0].geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();

      return HILL_STATION_ZONES.some(zone => {
        const dist = calculateHaversineDistance(lat, lng, zone.lat, zone.lng);
        return dist <= zone.radius;
      });
    }
  } catch (e) {
    console.error('Hill station detection geocode failed:', e);
  }

  return false;
};

const NO_FARE_VEHICLES = [
  VehicleType.LUXURY,
  VehicleType.TEMPO_TRAVELLER,
  VehicleType.TOURIST_BUS,
  VehicleType.CUSTOM
];

interface FareDetails {
  total: number;
  breakdown: {
    distanceFare: number;
    driverBeta: number;
    extraDaysFare: number;
    waitingCharge: number;
    hillCharge: number;
    baseFare: number;
    ratePerKm?: number;
    billableDistance?: number;
    extraCharges?: number;
  };
  displayTotal: string;
}

const calculateFareDetails = (distance: number, vehicle: VehicleType, tripType: TripType = TripType.ONE_WAY, localPackage?: string, days: number = 1, waitingHours: number = 0, isHillStation: boolean = false): FareDetails => {
  const result: FareDetails = {
    total: 0,
    breakdown: { distanceFare: 0, driverBeta: 0, extraDaysFare: 0, waitingCharge: 0, hillCharge: 0, baseFare: 0, ratePerKm: 0, billableDistance: 0, extraCharges: 0 },
    displayTotal: 'Call for Quote'
  };

  if (NO_FARE_VEHICLES.includes(vehicle)) return result;
  
  let pricingList = ONE_WAY_PRICING;
  if (tripType === TripType.ROUND_TRIP) {
    pricingList = ROUND_TRIP_PRICING;
  } else if (tripType === TripType.LOCAL) {
    pricingList = LOCAL_PRICING;
  }
  const perKmRate = pricingList[vehicle] || 0;

  let hillCharge = 0;
  result.breakdown.hillCharge = hillCharge;

  if (tripType === TripTypeRental) {
    const pkg = LOCAL_PACKAGES.find(p => p.id === localPackage);
    if (!pkg) return result;
    
    // Parse hours from id (e.g. '4hr40km' -> 4)
    const matches = pkg.id.match(/^(\d+)hr/);
    const hours = matches ? parseInt(matches[1]) : 0;
    
    let total = 0;
    if (vehicle === VehicleType.MINI) {
      total = hours * 350;
    } else if (vehicle === VehicleType.SEDAN) {
      total = hours * 375;
    } else {
      // SUV, Innova and others - Call on Quote
      return result;
    }

    result.total = total;
    result.breakdown.baseFare = total;
    result.displayTotal = `₹${total}`;
    
    // For rental, we don't want extra charges or driver beta shown separately as they are included
    result.breakdown.driverBeta = 0;
    result.breakdown.extraCharges = 0;
    result.breakdown.distanceFare = 0;
    return result;
  }

  if (tripType === TripType.ONE_WAY || tripType === TripType.LOCAL) {
    if (distance >= 130) {
      const billableDistance = Math.max(distance, 130);
      const distanceFare = Math.round(billableDistance * perKmRate);
      result.breakdown.distanceFare = distanceFare;
      result.breakdown.billableDistance = billableDistance;
      result.breakdown.ratePerKm = perKmRate;
      
      let driverBeta = 0;
      if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN) driverBeta = 400;
      else if (vehicle === VehicleType.SUV || vehicle === VehicleType.SUV_PLUS || vehicle === VehicleType.INNOVA) driverBeta = 500;
      
      result.breakdown.driverBeta = driverBeta;
      result.total = distanceFare + driverBeta + hillCharge;
    } else {
      const shortRates = tripType === TripType.LOCAL ? LOCAL_SHORT_RATES : ONE_WAY_SHORT_RATES;
      const rate = shortRates[vehicle] || perKmRate;
      let baseFare = 0;
      
      if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN) {
        if (distance <= 39) baseFare = 80;
        else if (distance <= 65) baseFare = 139;
        else baseFare = 300;
      } else if (vehicle === VehicleType.SUV || vehicle === VehicleType.SUV_PLUS) {
        if (distance <= 5) baseFare = 150;
        else if (distance <= 7) baseFare = 200;
        else if (distance <= 65) baseFare = 203;
        else baseFare = 350;
      } else if (vehicle === VehicleType.INNOVA) {
        if (distance > 5 && distance <= 65) baseFare = 203;
        else if (distance > 65) baseFare = 399;
        else return result;
      } else {
        baseFare = 80;
      }
      
      const distanceFare = Math.round(distance * rate);
      result.breakdown.distanceFare = distanceFare;
      result.breakdown.baseFare = baseFare;
      result.breakdown.billableDistance = distance;
      result.breakdown.ratePerKm = rate;
      result.total = distanceFare + baseFare + hillCharge;
    }
  } else if (tripType === TripType.ROUND_TRIP) {
    const effectiveDistance = distance * 2;
    const distanceFare = Math.round(effectiveDistance * perKmRate);
    result.breakdown.distanceFare = distanceFare;
    result.breakdown.billableDistance = effectiveDistance;
    result.breakdown.ratePerKm = perKmRate;
    
    result.breakdown.extraDaysFare = 0;

    let driverBetaPerDay = 0;
    if (vehicle === VehicleType.MINI || vehicle === VehicleType.SEDAN) driverBetaPerDay = 400;
    else if (vehicle === VehicleType.SUV || vehicle === VehicleType.SUV_PLUS || vehicle === VehicleType.INNOVA) driverBetaPerDay = 500;
    
    result.breakdown.driverBeta = days * driverBetaPerDay;

    // Waiting charge (Only for One Way if days=1, user requested to remove for round trip)
    result.breakdown.waitingCharge = 0;
    
    result.total = distanceFare + result.breakdown.extraDaysFare + result.breakdown.driverBeta + result.breakdown.waitingCharge + hillCharge;
  }

  result.breakdown.extraCharges = (result.breakdown.baseFare || 0) + (result.breakdown.extraDaysFare || 0) + (result.breakdown.waitingCharge || 0) + (result.breakdown.hillCharge || 0);

  if (result.total > 0) {
    result.displayTotal = `₹${result.total}`;
  }

  return result;
};

const getFare = (distance: number, vehicle: VehicleType, tripType: TripType = TripType.ONE_WAY, localPackage?: string, days: number = 1): string => {
  return calculateFareDetails(distance, vehicle, tripType, localPackage, days).displayTotal;
};

const LOCAL_PACKAGES = [
  { id: '1hr10km', label: '1 Hr / 10 Km' },
  { id: '2hr20km', label: '2 Hrs / 20 Km' },
  { id: '3hr30km', label: '3 Hrs / 30 Km' },
  { id: '4hr40km', label: '4 Hrs / 40 Km' },
  { id: '5hr50km', label: '5 Hrs / 50 Km' },
  { id: '6hr60km', label: '6 Hrs / 60 Km' },
  { id: '7hr70km', label: '7 Hrs / 70 Km' },
  { id: '8hr80km', label: '8 Hrs / 80 Km' },
  { id: '9hr90km', label: '9 Hrs / 90 Km' },
  { id: '10hr100km', label: '10 Hrs / 100 Km' },
  { id: '11hr110km', label: '11 Hrs / 110 Km' },
  { id: '12hr120km', label: '12 Hrs / 120 Km' },
];

const VEHICLE_CONFIG = [
  { 
    type: VehicleType.MINI, 
    label: 'MINI', 
    image: '/images/car_etios.svg', 
    capacity: 4,
    description: 'ANY SEDAN'
  },
  { 
    type: VehicleType.SEDAN, 
    label: 'Sedan', 
    image: '/images/sedan.webp', 
    capacity: 4,
    description: 'SEDAN'
  },
  { 
    type: VehicleType.SUV, 
    label: 'SUV', 
    image: '/images/car_suv.svg', 
    capacity: 6,
    description: '6-7 MEMBERS'
  },
  { 
    type: VehicleType.INNOVA, 
    label: 'Innova', 
    image: '/images/car_innova.svg', 
    capacity: 7,
    description: 'INNOVA'
  },
  { 
    type: VehicleType.TEMPO_TRAVELLER, 
    label: 'Traveller', 
    image: '/images/tempo travaller.webp',
    capacity: 12,
    description: '(12-18 seats)'
  },
  { 
    type: VehicleType.TOURIST_BUS, 
    label: 'Tourist Bus', 
    image: '/images/bus.webp',
    capacity: 40,
    description: '(20-55 seats)'
  },
  { 
    type: VehicleType.CUSTOM, 
    label: 'Custom', 
    image: '', 
    capacity: 'Any',
    description: 'Any types of vehicle available'
  },
];

const InputWrapper = memo(({ children, icon: Icon, label }: { children: React.ReactNode; icon: any; label?: string }) => (
  <div className="relative group w-full">
    {label && <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6467] transition-colors duration-300 pointer-events-none z-10">
        <Icon size={16} />
      </div>
      {children}
    </div>
  </div>
));

const POPULAR_LOCATIONS = [
  "Coimbatore International Airport (CJB)",
  "Coimbatore Junction Railway Station (CBE)",
  "Gandhipuram Bus Stand, Coimbatore",
  "Ukkadam Bus Stand, Coimbatore",
  "Singanallur Bus Stand, Coimbatore",
  "RS Puram, Coimbatore",
  "Peelamedu, Coimbatore",
  "Saravanampatti, Coimbatore",
  "Vadavalli, Coimbatore",
  "Thudiyalur, Coimbatore",
  "Kuniamuthur, Coimbatore",
  "Koundampalayam, Coimbatore",
  "Hope College, Coimbatore",
  "L&T Bypass Road, Coimbatore",
  "Laxmi Mills Junction, Coimbatore",
  "PSG Tech, Peelamedu, Coimbatore",
  "Brookefields Mall, Coimbatore",
  "Prozone Mall, Sathy Road, Coimbatore",
  "Fun Republic Mall, Avinashi Road, Coimbatore",
  "Eachanari Vinayagar Temple, Coimbatore"
];

const LocationSearchOverlay = ({ type, onSelect, onClose, googleLoaded, initialValue }: { 
  type: 'pickup' | 'drop', 
  onSelect: (address: string) => void, 
  onClose: () => void,
  googleLoaded: boolean,
  initialValue: string
}) => {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const service = useRef<any>(null);

  useEffect(() => {
    if (googleLoaded && (window as any).google?.maps?.places) {
      service.current = new (window as any).google.maps.places.AutocompleteService();
    }
  }, [googleLoaded]);

  // Handle body scroll lock and hiding other layout components on mobile
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mobile-search-active');
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('mobile-search-active');
    };
  }, []);

  useEffect(() => {
    if (query.length > 0 && service.current) {
      const COIMBATORE_CENTER = new (window as any).google.maps.LatLng(11.0168, 76.9558);
      service.current.getPlacePredictions({ 
        input: query, 
        componentRestrictions: { country: 'in' },
        location: COIMBATORE_CENTER,
        radius: 50000 
      }, (results: any) => {
        if (results) setPredictions(results);
      });
    } else {
      setPredictions([]);
    }
  }, [query]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] flex flex-col animate-in slide-in-from-bottom-5 duration-300 h-screen">
      <style>{`
        .mobile-search-active nav {
          display: none !important;
        }
        .mobile-search-active footer {
          display: none !important;
        }
        .mobile-search-active [aria-label="Call for Booking"] {
          display: none !important;
        }
        .mobile-search-active .fixed.bottom-0 {
          display: none !important;
        }
        .mobile-search-active [aria-label="Chat Support"] {
          display: none !important;
        }
      `}</style>
      <div className="flex flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top,1rem)+16px)] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 text-[#FF6467] hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -ml-2 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Back</span>
          </button>
          <h2 className="text-[12px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
            {type === 'pickup' ? 'Select Pickup Point' : 'Select Destination'}
          </h2>
          <button 
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-250 dark:border-slate-700 shadow-sm"
          >
            Cancel
          </button>
        </div>
        
        <div className="relative">
          <input 
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={type === 'pickup' ? "Enter pickup location..." : "Enter destination..."}
            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-[#FF6467]/20 rounded-2xl px-12 py-4 text-[13px] font-bold outline-none dark:text-white transition-all shadow-inner"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6467]" size={18} />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 pb-[500px] overscroll-contain">
        {predictions.length > 0 ? (
          predictions.map((p) => (
            <button 
              key={p.place_id}
              onClick={() => onSelect(p.description)}
              className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left group border-b border-slate-50 dark:border-slate-800 last:border-none"
            >
              <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-400 group-hover:bg-[#FF6467]/10 group-hover:text-[#FF6467] transition-all">
                <MapPin size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight line-clamp-1 mb-0.5">
                  {p.structured_formatting.main_text}
                </p>

                <p className="text-[11px] text-slate-500 font-medium tracking-tight line-clamp-2 opacity-80 whitespace-normal">
                  {p.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="space-y-1 pt-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">
              {query ? 'Matching Locations' : 'Popular Locations in Coimbatore'}
            </h3>
            {(query ? POPULAR_LOCATIONS.filter(l => l.toLowerCase().includes(query.toLowerCase())) : POPULAR_LOCATIONS).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => onSelect(loc)}
                className="w-full flex items-center gap-3.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left border-b border-slate-100 dark:border-slate-800/40 last:border-none"
              >
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl text-emerald-500">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {loc}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                    Coimbatore, Tamil Nadu
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  useEffect(() => { stepRef.current = step; }, [step]);

  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
  const pickupRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstance = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const pickupAutocomplete = useRef<any>(null);
  const dropAutocomplete = useRef<any>(null);

  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [loadingFare, setLoadingFare] = useState(false);
  const [indiaToday, setIndiaToday] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);

  const getTomorrowDate = () => {
    if (!indiaToday) return '';
    const parts = indiaToday.split('-');
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dt.setDate(dt.getDate() + 1);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const tomorrowStr = getTomorrowDate();

  const [formData, setFormData] = useState<BookingDetails>({
    phone: '',
    pickup: '',
    drop: '',
    date: '',
    time: '',
    numberOfDays: '1',
    waitingHours: '0',
    vehicleType: VehicleType.MINI,
    tripType: TripType.LOCAL,
    localPackage: '',
    isHillStation: false,
    distance: '',
    rawDistance: 0,
    estimatedFare: '',
  });

  const [mobileSearchType, setMobileSearchType] = useState<null | 'pickup' | 'drop'>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionLeadId = useRef(`lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, leadId: sessionLeadId.current }));
  }, []);

  useEffect(() => {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    setIndiaToday(dateStr);
    setFormData(prev => ({ ...prev, date: dateStr }));

    if ((window as any).google?.maps) {
      setGoogleLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setGoogleLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 🔥 Google Autocomplete Light Theme Injection
useEffect(() => {
  const style = document.createElement("style");
style.innerHTML = `
  .pac-container {
    background-color: #ffffff !important;
    border-radius: 16px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
    padding: 6px 0 !important;
    z-index: 9999 !important;
    max-height: 400px !important; /* allow scrolling for long lists */
    overflow-y: auto !important;
  }

  .pac-item {
    padding: 12px 16px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #111827 !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    flex-direction: column !important;
    white-space: normal !important; /* allow full address wrap */
  }

  .pac-item .pac-item-query {
    font-weight: 900 !important;
    color: #FF6467 !important; /* custom highlight */
  }

  .pac-item .pac-item-subtitle {
    font-weight: 400 !important;
    font-size: 12px !important;
    color: #6b7280 !important;
  }

  .pac-item:hover {
    background-color: #f3f4f6 !important;
  }

  /* Subtle "Powered by Google" */
  .pac-logo:after {
    opacity: 0.6 !important;
  }

  /* Elegant thin scrollbar */
  .app-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .app-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .app-scroll::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  .dark .app-scroll::-webkit-scrollbar-thumb {
    background: #334155;
  }
  .app-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
  .dark .app-scroll { scrollbar-color: #334155 transparent; }
`;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
  };
}, []);


  // Initialize Autocomplete (Always active for inputs)
  useEffect(() => {
    if (!googleLoaded) return;

    try {
      const COIMBATORE_BOUNDS = new google.maps.LatLngBounds(
        new google.maps.LatLng(10.60, 76.65),
        new google.maps.LatLng(11.35, 77.10)
      );

      const options = {
        bounds: COIMBATORE_BOUNDS,
        strictBounds: false,
        componentRestrictions: { country: "in" },
        locationBias: COIMBATORE_BOUNDS,
        fields: ["formatted_address", "geometry"],
      };

      if (pickupRef.current && !(pickupRef.current as any).__autocompleteInitialized) {
        (pickupRef.current as any).__autocompleteInitialized = true;
        pickupAutocomplete.current = new google.maps.places.Autocomplete(pickupRef.current, options);
        pickupAutocomplete.current.addListener('place_changed', () => {
          const place = pickupAutocomplete.current.getPlace();
          if (place.formatted_address) {
            setFormData(prev => ({ ...prev, pickup: place.formatted_address }));
          }
        });
      }

      if (dropRef.current && !(dropRef.current as any).__autocompleteInitialized) {
        (dropRef.current as any).__autocompleteInitialized = true;
        dropAutocomplete.current = new google.maps.places.Autocomplete(dropRef.current, options);
        dropAutocomplete.current.addListener('place_changed', () => {
          const place = dropAutocomplete.current.getPlace();
          if (place.formatted_address) {
            setFormData(prev => ({ ...prev, drop: place.formatted_address }));
          }
        });
      }
    } catch (e) {
      console.error("Autocomplete Initialization Error:", e);
    }
  }, [googleLoaded, step, formData.tripType]);

  // Initialize Map (Only when visible)
  useEffect(() => {
    if (!googleLoaded || !mapNode) {
      // Reset instances if container is gone
      mapInstance.current = null;
      directionsRenderer.current = null;
      return;
    }
    if (mapInstance.current) return;

    try {
      mapInstance.current = new google.maps.Map(mapNode, {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: 12,
        disableDefaultUI: true,
        styles:[{ featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] }]
      });

      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current,
        polylineOptions: { strokeColor: "#FF6467", strokeWeight: 6, strokeOpacity: 0.95 },
        suppressMarkers: false
      });
    } catch (e) {
      console.error("Map Initialization Error:", e);
    }

    return () => {
      mapInstance.current = null;
      directionsRenderer.current = null;
    };
  }, [googleLoaded, mapNode]);

  const pickupMarker = useRef<any>(null);

  const updateMapRoute = useCallback((origin: string, destination: string) => {
    if (!googleLoaded || !origin || !directionsRenderer.current) return;

    // Clear previous marker if any
    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
      pickupMarker.current = null;
    }

    if (formData.tripType === TripTypeRental || !destination) {
      // For local or single point, just center and mark
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: origin }, (results: any, status: string) => {
        if (status === 'OK' && results[0] && mapInstance.current) {
          mapInstance.current.setCenter(results[0].geometry.location);
          mapInstance.current.setZoom(15);
          
          pickupMarker.current = new google.maps.Marker({
            position: results[0].geometry.location,
            map: mapInstance.current,
            title: 'Pickup Location',
            animation: google.maps.Animation.DROP
          });
          
          // Clear any existing route
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections({ routes: [] });
          }
        }
      });
      return;
    }

    // Normal routing
    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
      pickupMarker.current = null;
    }
    directionsService.current.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
          setMapError(null);
        } else {
          setMapError("Route update failed.");
        }
      }
    );
  }, [googleLoaded, formData.tripType]);

  useEffect(() => {
    if (!googleLoaded) return;

    // Clear any previous route error when input changes so the map remains clear and visible
    setMapError(null);

    const timer = setTimeout(() => {
      if (step === 1 && mapInstance.current) {
        // Handle map container size updates gracefully
        google.maps.event.trigger(mapInstance.current, 'resize');

        if (formData.pickup && (formData.tripType === TripTypeRental || formData.drop)) {
          updateMapRoute(formData.pickup, formData.drop);
        } else {
          mapInstance.current.setCenter({ lat: 11.0168, lng: 76.9558 });
          mapInstance.current.setZoom(12);
          if (directionsRenderer.current) {
            directionsRenderer.current.setDirections({ routes: [] });
          }
          if (pickupMarker.current) {
            pickupMarker.current.setMap(null);
            pickupMarker.current = null;
          }
        }
      }
    }, 800); // 800ms debounce to prevent constant routing updates while typing

    return () => clearTimeout(timer);
  }, [step, formData.pickup, formData.drop, formData.tripType, googleLoaded, updateMapRoute]);

  const calculateFare = useCallback(async (origin: string, destination: string, vehicle: VehicleType, tripType: TripType) => {
    const isHill = false;
    
    if (tripType === TripTypeRental) {
      if (!formData.localPackage) {
        setFormData(prev => ({
          ...prev,
          isHillStation: isHill,
          distance: '',
          rawDistance: 0,
          estimatedFare: '',
          fareBreakdown: undefined
        }));
        return;
      }
      const pkg = LOCAL_PACKAGES.find(p => p.id === formData.localPackage);
      if (!pkg) return;
      const fareInfo = calculateFareDetails(0, vehicle, TripTypeRental, formData.localPackage, 1, 0, isHill);
      
      // Format distance as "1Hr/10kms"
      const pkgDisplay = pkg.label.replace(/\s/g, '').replace('/', '/').replace('Km', 'kms');
      
      setFormData(prev => ({
        ...prev,
        isHillStation: isHill,
        distance: pkgDisplay,
        rawDistance: 0,
        estimatedFare: fareInfo.displayTotal,
        fareBreakdown: { ...fareInfo.breakdown, total: fareInfo.total }
      }));
      return;
    }

    if (!origin || !destination || !(window as any).google?.maps) return;

    setLoadingFare(true);
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response: any, status: string) => {
        setLoadingFare(false);

        if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
          const distanceText = response.rows[0].elements[0].distance.text;
          const distanceValue = response.rows[0].elements[0].distance.value / 1000;
          const dayCount = parseInt(formData.numberOfDays || '1', 10) || 1;
          const waitHrs = parseInt(formData.waitingHours || '0', 10) || 0;
          const fareInfo = calculateFareDetails(distanceValue, vehicle, tripType, undefined, dayCount, waitHrs, isHill);

          setFormData(prev => ({
            ...prev,
            isHillStation: isHill,
            distance: tripType === TripType.ROUND_TRIP ? `${(distanceValue * 2).toFixed(1)} km` : distanceText,
            rawDistance: distanceValue,
            estimatedFare: fareInfo.displayTotal,
            fareBreakdown: { ...fareInfo.breakdown, total: fareInfo.total }
          }));
        }
      }
    );
  }, [formData.localPackage, formData.vehicleType, formData.numberOfDays, formData.waitingHours]); 

  useEffect(() => {
    const runCalculation = async () => {
      if (formData.tripType === TripTypeRental) {
        await calculateFare('', '', formData.vehicleType, formData.tripType);
      } else if (formData.pickup && formData.drop) {
        await calculateFare(formData.pickup, formData.drop, formData.vehicleType, formData.tripType);
      }
    };
    runCalculation();
  }, [formData.pickup, formData.drop, formData.vehicleType, formData.tripType, formData.localPackage, formData.numberOfDays, formData.waitingHours, formData.isHillStation, calculateFare]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = async () => {
    const p = pickupRef.current?.value || formData.pickup;
    const d = dropRef.current?.value || formData.drop;

    const isRental = formData.tripType === TripTypeRental;
    if (isRental && !formData.localPackage) {
      alert("Please select a local package.");
      return;
    }
    if (!p || (!d && !isRental)) {
      alert(isRental ? "Please enter pickup location." : "Please enter pickup and destination.");
      return;
    }

    const updatedData = { ...formData, pickup: p, drop: d };
    setFormData(updatedData);
    await calculateFare(p, d, formData.vehicleType, formData.tripType);
    
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Abandoned Lead Capture Logic
  const leadSentRef = useRef(false);
  const submittedRef = useRef(false);

  const handleAbandonment = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const currentSubmitted = submittedRef.current;
    const currentStep = stepRef.current;

    // Only send if we have basic info, not submitted, not currently submitting, and haven't sent yet
    if (
      !currentSubmitted && 
      !isSubmittingRef.current && 
      !leadSentRef.current && 
      currentFormData.phone && 
      currentFormData.phone.length === 10 && 
      (currentFormData.pickup || currentFormData.drop)
    ) {
      const bookingData = {
        ...currentFormData,
        isLead: true,
        estimatedFare: currentFormData.estimatedFare || (currentStep >= 2 ? 'Abandoned at Vehicle/Summary Select' : 'Abandoned Lead (Step 1)')
      };
      
      // ⚠️ Mark as sent synchronously BEFORE async calls to prevent duplicate triggers
      leadSentRef.current = true;
      
      console.log('Capturing abandoned lead...', bookingData.phone);
      
      // Send Email
      sendBookingEmail(bookingData);
      
      // Save to Google Sheets
      try {
        await appendBookingToSheet(bookingData);
      } catch (err) {
        console.error('Abandonment sheet sync error:', err);
      }
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAbandonment();
      }
    };

    // iOS Safari reliability: pagehide
    window.addEventListener('pagehide', handleAbandonment);
    window.addEventListener('beforeunload', handleAbandonment);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handleAbandonment);
      window.removeEventListener('beforeunload', handleAbandonment);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      handleAbandonment();
    };
  }, [handleAbandonment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = formData.phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    setLoading(true);
    isSubmittingRef.current = true;
    leadSentRef.current = true; // Prevent abandonment lead during/after this process

    try {
      // Send Email
      const success = await sendBookingEmail(formData);
      
      // Save to Google Sheets
      try {
        await appendBookingToSheet(formData);
      } catch (err) {
        console.error('Sheet sync error:', err);
      }
      
      if (success) {
        submittedRef.current = true;
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        isSubmittingRef.current = false;
        leadSentRef.current = false; // Allow retry or abandonment capture on failure
        alert("Booking failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      isSubmittingRef.current = false;
      leadSentRef.current = false;
      alert("Error sending booking. Check console.");
    } finally {
      setLoading(false);
    }
  };
  const handleWhatsAppConfirm = () => {
  const tripDetails = formData.tripType === TripTypeRental 
    ? `*Package:* ${LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label}`
    : `*Drop:* ${formData.drop}${formData.tripType === TripType.ROUND_TRIP ? `%0A*Days:* ${formData.numberOfDays}` : ''}`;
  
  const dateTimeStr = (formData.date || formData.time) 
    ? `*Date/Time:* ${formData.date || 'Not specified'} at ${formData.time || 'Not specified'}`
    : '*Date/Time:* Not specified';

  const hillStr = formData.isHillStation ? '%0A*Hill Station Charge:* Applied (₹300)' : '';

  const message = `*NEW BOOKING CONFIRMATION*%0A*Trip Type:* ${formData.tripType}%0A*Phone:* ${formData.phone}%0A*Pickup:* ${formData.pickup}%0A${tripDetails}%0A${dateTimeStr}${hillStr}%0A*Vehicle:* ${formData.vehicleType}%0A*Fare:* ${formData.estimatedFare}`;
  window.open(`https://wa.me/918870088020?text=${message}`, '_blank');
};

if (submitted) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-sm mx-auto">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Booking Sent!</h2>
      <p className="text-[11px] text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">driver will call you shortly.</p>

      {/* WhatsApp Confirm Button */}
      <button 
        onClick={handleWhatsAppConfirm} 
        className="w-full bg-[#25D366] text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg text-[10px] uppercase tracking-widest active:scale-95 transition-all mb-3"
      >
        <MessageCircle size={20} /> WhatsApp support
      </button>

{/* Book Another Ride Button */}
<button 
  type="button"   // important to prevent accidental form submission
  onClick={() => {
    const verifiedPhone = formData.phone;
    setSubmitted(false);      // go back to the form
    setStep(1);               // start from step 1
    setFormData({             // reset all fields
      phone: verifiedPhone,
      pickup: '',
      drop: '',
      date: indiaToday,
      time: '',
      numberOfDays: '1',
      waitingHours: '0',
      vehicleType: VehicleType.MINI,
      tripType: TripType.LOCAL,
      localPackage: '8hr80km',
      distance: '',
      rawDistance: 0,
      estimatedFare: '',
    });

    // Re-initialize map/autocomplete after a short delay
    setTimeout(() => {
      if (pickupRef.current) pickupRef.current.value = '';
      if (dropRef.current) dropRef.current.value = '';
      
      // Clear directions if any
      if (directionsRenderer.current) {
        directionsRenderer.current.setDirections({ routes: [] });
      }

      // Reset map center and zoom
      if (mapInstance.current) {
        mapInstance.current.setCenter({ lat: 11.0168, lng: 76.9558 });
        mapInstance.current.setZoom(12);
      }

      // ✅ Reload page
      window.location.reload();
    }, 50);
  }} 
  className="w-full text-[10px] font-bold text-slate-900 dark:text-white uppercase border border-slate-300 dark:border-slate-700 rounded-2xl py-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
>
  Book Another Ride
</button>
    </div>
  );
}


  return (
    <div className="bg-white dark:bg-slate-900 p-4 pb-6 sm:p-5 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm mx-auto transition-all duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {step === 1 ? 'Enter Locations' : step === 2 ? 'Enter Mobile' : step === 3 ? 'Select Vehicle' : 'Trip Summary'}
        </h3>
        <div className="flex gap-1.5">
          <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${step === 4 ? 'w-8 bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-800'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Step 2: Phone Number Verification / App Access */}
        {step === 2 && (
          <div className="space-y-4 py-3 animate-fade-in flex flex-col items-stretch">
            <button 
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 self-start mb-2"
            >
              <ArrowLeft size={14} className="stroke-[3px]" />
              <span>Change Locations</span>
            </button>

            <div className="w-full bg-[#FF6467]/5 dark:bg-[#FF6467]/10 border-2 border-[#FF6467] focus-within:ring-4 focus-within:ring-[#FF6467]/20 rounded-xl p-2.5 px-3.5 flex items-center gap-3 transition-all shadow-md shadow-[#FF6467]/5 relative overflow-hidden text-left mt-2">
              <span className="text-xs font-black text-[#FF6467] select-none border-r border-[#FF6467]/20 pr-2">
                +91
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[8px] font-black text-[#FF6467] uppercase tracking-widest mb-0.5">Mobile Number</span>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setFormData(prev => ({ ...prev, phone: cleaned.slice(0, 10) }));
                  }}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-black outline-none text-slate-900 dark:text-white placeholder-[#FF6467]/40"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const phone = formData.phone.trim();
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!phoneRegex.test(phone)) {
                  alert("Please enter a valid 10-digit Indian mobile number.");
                  return;
                }
                setStep(3);
              }}
              className="w-full bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              Continue to Vehicle Selection <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step 1 */}
        <div className={`${step === 1 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          {/* Trip Type Category Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl gap-1 relative overflow-hidden border border-slate-200/10 dark:border-slate-700/20">
            {[
              { id: 'local', label: 'Local' },
              { id: 'outstation', label: 'Outstation' },
              { id: 'rental', label: 'Rental' }
            ].map((cat) => {
              const isActive = 
                (cat.id === 'local' && formData.tripType === TripType.LOCAL) ||
                (cat.id === 'outstation' && (formData.tripType === TripType.ONE_WAY || formData.tripType === TripType.ROUND_TRIP)) ||
                (cat.id === 'rental' && formData.tripType === TripTypeRental);
              
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    let newTripType = TripType.LOCAL;
                    if (cat.id === 'outstation') {
                      newTripType = TripType.ONE_WAY; // Default to One Way
                    } else if (cat.id === 'rental') {
                      newTripType = TripTypeRental;
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      tripType: newTripType, 
                      estimatedFare: '', 
                      distance: '',
                      localPackage: ''
                    }));
                  }}
                  className={`
                    relative flex-1 flex items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors duration-200 z-10
                    ${isActive 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryType"
                      className="absolute inset-0 bg-[#FF6467] rounded-xl shadow-md"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Booking Session Badge */}
          {formData.phone && (
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 px-3 flex items-center justify-between transition-all shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Active Session:
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  +91 {formData.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[8px] font-black text-[#FF6467] uppercase tracking-widest hover:underline"
              >
                Change
              </button>
            </div>
          )}

          {/* Outstation Type Sub-selector (One Way vs Round Trip Toggle Switch) */}
          {(formData.tripType === TripType.ONE_WAY || formData.tripType === TripType.ROUND_TRIP) && (
            <div className="relative flex bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80 gap-1 select-none">
              {[
                { id: TripType.ONE_WAY, label: 'One Way Drop' },
                { id: TripType.ROUND_TRIP, label: 'Round Trip' }
              ].map((subType) => {
                const isSelected = formData.tripType === subType.id;
                return (
                  <button
                    key={subType.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tripType: subType.id, estimatedFare: '', distance: '' }))}
                    className={`
                      relative flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 z-10
                      ${isSelected 
                        ? 'text-slate-800 dark:text-white font-black' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeOutstationSubtype"
                        className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/20 dark:border-slate-700/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{subType.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Map - Only Visible in Step 1 when both locations are entered */}
          {formData.pickup && (formData.tripType === TripTypeRental || formData.drop) && (
            <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner animate-in fade-in zoom-in duration-500">
              <div ref={setMapNode} className="w-full h-full" />
              {mapError && (
                <div className="absolute bottom-2 left-2 right-2 bg-rose-50/95 dark:bg-rose-950/95 border border-rose-200 dark:border-rose-900/50 p-1.5 px-2.5 rounded-xl flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-1 z-10">
                  <AlertTriangle size={12} className="text-[#FF6467] shrink-0" />
                  <span className="text-[9px] text-rose-800 dark:text-rose-200 font-bold uppercase tracking-wider">{mapError}</span>
                </div>
              )}
            </div>
          )}

          {/* Unified App-Style Route Selector Card */}
          <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-3 flex gap-3 shadow-sm">
            {/* Visual native-app line connector */}
            <div className="flex flex-col items-center justify-center py-1.5">
              {/* Pickup Dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 flex-shrink-0" />
              
              {formData.tripType !== TripTypeRental && (
                <>
                  {/* Connecting line */}
                  <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 my-1.5 min-h-[14px] border-l border-dashed border-slate-300 dark:border-slate-700" />
                  
                  {/* Drop Dot */}
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/10 flex-shrink-0" />
                </>
              )}
            </div>

            {/* Input fields */}
            <div className="flex-1 space-y-2">
              {/* Pickup input */}
              <div className="relative">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Pickup Location</span>
                <input
                  ref={pickupRef}
                  type="text"
                  readOnly={window.innerWidth < 640}
                  onClick={() => {
                    if (window.innerWidth < 640) setMobileSearchType('pickup');
                  }}
                  onFocus={() => {
                    if (window.innerWidth < 640) setMobileSearchType('pickup');
                  }}
                  required
                  placeholder="Enter Pickup Location"
                  value={formData.pickup}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickup: e.target.value }))}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white placeholder-slate-400 pr-8"
                />
                {formData.pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, pickup: '' }));
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#FF6467] rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                    title="Clear pickup"
                  >
                    <X size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>

              {formData.tripType !== TripTypeRental && (
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 relative">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Destination</span>
                  <input
                    ref={dropRef}
                    type="text"
                    readOnly={window.innerWidth < 640}
                    onClick={() => {
                      if (window.innerWidth < 640) setMobileSearchType('drop');
                    }}
                    onFocus={() => {
                      if (window.innerWidth < 640) setMobileSearchType('drop');
                    }}
                    required={formData.tripType !== TripTypeRental}
                    placeholder="Enter Destination"
                    value={formData.drop}
                    onChange={(e) => setFormData(prev => ({ ...prev, drop: e.target.value }))}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white placeholder-slate-400 pr-8"
                  />
                  {formData.drop && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, drop: '' }));
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#FF6467] rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                      title="Clear destination"
                    >
                      <X size={12} className="stroke-[3px]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Local Package Select */}
          {formData.tripType === TripTypeRental && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl p-2 px-3 flex items-center gap-3 shadow-sm">
              <Package size={14} className="text-[#FF6467]" />
              <div className="flex-1">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Local Package</span>
                <select
                  name="localPackage"
                  value={formData.localPackage}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Select Package</option>
                  {LOCAL_PACKAGES.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Compact Date & Time / Duration Grid */}
          <style>{`
            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
              background: transparent;
              display: none !important;
              -webkit-appearance: none;
            }
          `}</style>
          <div className={`grid gap-1.5 sm:gap-2.5 ${formData.tripType === TripType.ROUND_TRIP ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {/* Date Picker */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus-within:border-[#FF6467] focus-within:ring-2 focus-within:ring-[#FF6467]/10 rounded-xl p-1.5 px-2.5 sm:p-2 sm:px-3 flex items-center gap-1 sm:gap-2 transition-all shadow-sm min-w-0">
              <Calendar size={13} className="text-[#FF6467] flex-shrink-0 hidden xs:block" />
              <div className="flex-1 min-w-0">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Date</span>
                <input
                  type="date"
                  name="date"
                  min={indiaToday}
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                />
              </div>
            </div>

            {/* Time Picker */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus-within:border-[#FF6467] focus-within:ring-2 focus-within:ring-[#FF6467]/10 rounded-xl p-1.5 px-2.5 sm:p-2 sm:px-3 flex items-center gap-1 sm:gap-2 transition-all shadow-sm min-w-0">
              <Clock size={13} className="text-[#FF6467] flex-shrink-0 hidden xs:block" />
              <div className="flex-1 min-w-0">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Time</span>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white cursor-pointer min-w-0"
                />
              </div>
            </div>

            {/* Duration (Round Trip only) */}
            {formData.tripType === TripType.ROUND_TRIP && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus-within:border-[#FF6467] focus-within:ring-2 focus-within:ring-[#FF6467]/10 rounded-xl p-1.5 px-2.5 sm:p-2 sm:px-3 flex items-center gap-1 sm:gap-2 transition-all shadow-sm min-w-0">
                <Clock size={13} className="text-[#FF6467] flex-shrink-0 hidden xs:block" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">Duration</span>
                  <select
                    name="numberOfDays"
                    value={formData.numberOfDays}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] sm:text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer min-w-0"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                      <option key={n} value={n.toString()}>
                        {n === 1 ? 'Same Day' : `${n} Days`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <button 
            type="button" 
            id="btn-next-step"
            onClick={handleNextStep} 
            className="w-full bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>

        {/* Step 3 */}
        <div className={`${step === 3 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          <div className="flex justify-between items-center px-1">
            <button 
              type="button"
              onClick={() => {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-[#FF6467] hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 -ml-1 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Vehicle</span>
          </div>

          <div className="relative group">
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 app-scroll">
            {VEHICLE_CONFIG.map((v) => {
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => {
                    const distanceVal = formData.rawDistance || 0;
                    const isTripValid = formData.tripType === TripType.LOCAL || distanceVal > 0;
                    const dayCount = parseInt(formData.numberOfDays || '1', 10) || 1;
                    const waitHrs = parseInt(formData.waitingHours || '0', 10) || 0;
                    const fareInfo = calculateFareDetails(distanceVal, v.type, formData.tripType, formData.localPackage, dayCount, waitHrs, formData.isHillStation);
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      vehicleType: v.type,
                      estimatedFare: isTripValid ? fareInfo.displayTotal : '',
                      fareBreakdown: isTripValid ? { ...fareInfo.breakdown, total: fareInfo.total } : undefined
                    }));
                  }}
                  className={`
                    w-full flex items-center gap-0 p-6 rounded-2xl border-2 transition-all text-left
                    ${formData.vehicleType === v.type 
                      ? 'border-[#FF6467] bg-[#FF6467]/5 dark:bg-[#FF6467]/10' 
                      : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950'}
                  `}
                >
                  {/* Vehicle Image */}
                  {v.image ? (
                    <img
                      src={v.image}
                      alt={v.label}
                      className="w-30 h-14 object-contain rounded-lg shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-30 h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                      <Car size={24} className="text-slate-400" />
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block truncate">
                      {v.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 shrink-0">
                        <User size={10} /> {v.capacity} 
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold truncate">
                        • {v.description}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>



        <div className="flex gap-3">
          
            <button
              type="button"
              onClick={() => setStep(2)}
              className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
        <button
  type="button"
  disabled={loading}
  className="flex-1 bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all"
  onClick={() => {
    if (!formData.vehicleType) {
      alert("Please select a vehicle.");
      return;
    }
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
>
  Confirm Selection
</button>
          </div>
        </div>

        {/* Step 4: Summary */}
      <div className={`${step === 4 ? 'space-y-4' : 'hidden'} animate-fade-in`}>
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={() => {
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
    >
      <ArrowLeft size={18} />
      <span className="text-xs font-semibold">Back</span>
    </button>

    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
      Trip Summary
    </span>
  </div>

  <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">

    {/* Fare Header */}
    <div className="bg-gradient-to-r from-[#FF6467] to-[#ff7b7d] p-5 text-white">
      <p className="text-[11px] uppercase tracking-widest opacity-80">
        Estimated Fare
      </p>

      <div className="flex items-end justify-between mt-1">
        <h2 className="text-4xl font-black leading-none">
          {formData.estimatedFare}
        </h2>

        <div className="text-right">
          <p className="text-xs font-semibold">
            {formData.tripType}
          </p>
          <p className="text-xs opacity-80">
            {formData.vehicleType}
          </p>
        </div>
      </div>
    </div>

    <div className="p-4 space-y-4">

      {/* Route Card */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[#FF6467]" />
            <div className="w-[2px] flex-1 min-h-[42px] bg-slate-200 dark:bg-slate-700 my-1" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Pickup
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm break-words">
                {formData.pickup}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Drop
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm break-words">
                {formData.tripType === TripTypeRental
                  ? LOCAL_PACKAGES.find(
                      p => p.id === formData.localPackage
                    )?.label
                  : formData.drop}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Date, Time, and Distance Info */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 text-center border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Date</span>
          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{formData.date || 'Today'}</p>
        </div>
        <div>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Time</span>
          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{formData.time || 'Not specified'}</p>
        </div>
        <div>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Distance</span>
          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{formData.distance || 'Calculating...'}</p>
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-2xl px-4 py-3">
        <span className="text-sm text-slate-500">
          Contact Number
        </span>

        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {formData.phone}
        </span>
      </div>

      

    </div>
  </div>


          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Booking...' : (
                <>
                  Confirm & Book Now <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      {mobileSearchType && (
        <LocationSearchOverlay 
          type={mobileSearchType}
          googleLoaded={googleLoaded}
          initialValue={mobileSearchType === 'pickup' ? formData.pickup : formData.drop}
          onClose={() => setMobileSearchType(null)}
          onSelect={async (address) => {
            if (mobileSearchType === 'pickup') {
              setFormData(prev => ({ ...prev, pickup: address }));
              if (pickupRef.current) pickupRef.current.value = address;
            } else {
              setFormData(prev => ({ ...prev, drop: address }));
              if (dropRef.current) dropRef.current.value = address;
            }
            setMobileSearchType(null);
          }}
        />
      )}
    </div>
  );
};

