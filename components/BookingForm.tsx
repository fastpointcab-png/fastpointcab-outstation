import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookingDetails, VehicleType, TripType, FareBreakdown } from '../types';
import { MapPin, User, Phone, Car, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle, Map as MapIcon, AlertTriangle, Repeat, Navigation, Package } from 'lucide-react';
import { sendBookingEmail } from '../services/emailService';
import { appendBookingToSheet } from '../services/googleSheets';

declare const google: any;

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const PRICING: Record<VehicleType, number> = {
  [VehicleType.MINI]: 15,
  [VehicleType.SEDAN]: 16,
  [VehicleType.SUV]: 20,
  [VehicleType.SUV_PLUS]: 20,
  [VehicleType.INNOVA]: 23,
  [VehicleType.LUXURY]: 0,
  [VehicleType.TEMPO_TRAVELLER]: 0,
  [VehicleType.TOURIST_BUS]: 0,
  [VehicleType.CUSTOM]: 0,
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
  
  const perKmRate = PRICING[vehicle] || 0;

  let hillCharge = 0;
  if (isHillStation) {
    hillCharge = 300; // Flat 300 hill charge
  }
  result.breakdown.hillCharge = hillCharge;

  if (tripType === TripType.LOCAL) {
    const pkg = LOCAL_PACKAGES.find(p => p.id === localPackage);
    if (!pkg) return result;
    
    // Parse hours from id (e.g. '4hr40km' -> 4)
    const matches = pkg.id.match(/^(\d+)hr/);
    const hours = matches ? parseInt(matches[1]) : 0;
    
    let total = 0;
    if (vehicle === VehicleType.MINI) {
      total = hours * 300;
    } else if (vehicle === VehicleType.SEDAN) {
      total = hours * 350;
    } else {
      // SUV, Innova and others - Call on Quote
      return result;
    }

    result.total = total;
    result.breakdown.baseFare = total;
    result.displayTotal = `₹${total}`;
    
    // For local, we don't want extra charges or driver beta shown separately as they are included
    result.breakdown.driverBeta = 0;
    result.breakdown.extraCharges = 0;
    result.breakdown.distanceFare = 0;
    return result;
  }

  if (tripType === TripType.ONE_WAY) {
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
      const shortRates: Record<string, number> = {
        [VehicleType.MINI]: 23,
        [VehicleType.SEDAN]: 25,
        [VehicleType.SUV]: 40,
        [VehicleType.SUV_PLUS]: 45,
        [VehicleType.INNOVA]: 50,
      };
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
    const minDistance = days * 250;
    const effectiveDistance = Math.max(distance * 2, minDistance);
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
    label: 'MINI / ANY SEDAN', 
    image: '/images/car_etios.svg', 
    capacity: 4,
    description: 'AFFORDABLE'
  },
  { 
    type: VehicleType.SEDAN, 
    label: 'Sedan', 
    image: '/images/sedan.webp', 
    capacity: 4,
    description: 'PRIME SEDAN'
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
    description: 'PREMIUM INNOVA'
  },
  { 
    type: VehicleType.TEMPO_TRAVELLER, 
    label: 'Traveller', 
    image: '/images/tempo travaller.webp',
    capacity: 12,
    description: 'Group travel(12-18 seats)'
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

  // Handle body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
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
      <div className="flex flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top,1rem)+80px)] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
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
            className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest p-2"
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

      {false && (
  <button
    onClick={() => onSelect(query)}
    className="w-full flex items-start gap-4 p-4 bg-[#FF6467]/5 hover:bg-[#FF6467]/10 rounded-2xl transition-colors text-left border-b border-slate-100 dark:border-slate-800"
  >
    <div className="bg-[#FF6467]/10 p-2.5 rounded-xl text-[#FF6467]">
      <MapPin size={18} />
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
        {query}
      </p>
      <p className="text-[11px] text-slate-500 font-medium">
        Use typed location
      </p>
    </div>
  </button>
)} 
  
 {predictions.map((p) => (
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
))}
      </div>
    </div>
  );
};

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  useEffect(() => { stepRef.current = step; }, [step]);

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

  const [formData, setFormData] = useState<BookingDetails>({
    phone: '',
    pickup: '',
    drop: '',
    date: '',
    time: '',
    numberOfDays: '1',
    waitingHours: '0',
    vehicleType: VehicleType.MINI,
    tripType: TripType.ONE_WAY,
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
    if (pickupAutocomplete.current && dropAutocomplete.current) return;

    try {
  const COIMBATORE_BOUNDS = new google.maps.LatLngBounds(
    new google.maps.LatLng(10.60, 76.65),
    new google.maps.LatLng(11.35, 77.10)
  );

  const options = {
    bounds: COIMBATORE_BOUNDS,
    strictBounds: false,
    componentRestrictions: { country: "in" },

    // 🔥 IMPORTANT: add this
    locationBias: COIMBATORE_BOUNDS,

    fields: ["formatted_address", "geometry"],
  };

    if (pickupRef.current && !pickupAutocomplete.current) {
  pickupAutocomplete.current = new google.maps.places.Autocomplete(pickupRef.current, options);
  pickupAutocomplete.current.addListener('place_changed', () => {
    const place = pickupAutocomplete.current.getPlace();
    if (place.formatted_address) {
      setFormData(prev => ({ ...prev, pickup: place.formatted_address }));
      // ✅ remove pickupRef.current.value = ...
    }
  });
}

if (dropRef.current && !dropAutocomplete.current) {
  dropAutocomplete.current = new google.maps.places.Autocomplete(dropRef.current, options);
  dropAutocomplete.current.addListener('place_changed', () => {
    const place = dropAutocomplete.current.getPlace();
    if (place.formatted_address) {
      setFormData(prev => ({ ...prev, drop: place.formatted_address }));
      // ✅ remove dropRef.current.value = ...
    }
  });
}
    } catch (e) {
      console.error("Autocomplete Initialization Error:", e);
    }
  }, [googleLoaded]);

  // Initialize Map (Only when visible)
  useEffect(() => {
    if (!googleLoaded || !mapRef.current) {
      // Reset instances if container is gone
      mapInstance.current = null;
      directionsRenderer.current = null;
      return;
    }
    if (mapInstance.current) return;

    try {
      mapInstance.current = new google.maps.Map(mapRef.current, {
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
  }, [googleLoaded, !!(formData.pickup && (formData.tripType === TripType.LOCAL || formData.drop))]);

  const pickupMarker = useRef<any>(null);

  const updateMapRoute = useCallback((origin: string, destination: string) => {
    if (!googleLoaded || !origin || !directionsRenderer.current) return;

    // Clear previous marker if any
    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
      pickupMarker.current = null;
    }

    if (formData.tripType === TripType.LOCAL || !destination) {
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
    if (step === 1 && mapInstance.current) {
      // Small timeout to ensure DOM is updated and map container has dimensions
      const timer = setTimeout(() => {
        if ((window as any).google?.maps) {
          google.maps.event.trigger(mapInstance.current, 'resize');
          if (formData.pickup && (formData.tripType === TripType.LOCAL || formData.drop)) {
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
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, formData.pickup, formData.drop, formData.tripType, updateMapRoute]);

  useEffect(() => {
    if (formData.pickup && (formData.tripType === TripType.LOCAL || formData.drop)) {
      updateMapRoute(formData.pickup, formData.drop);
    }
  }, [formData.pickup, formData.drop, formData.tripType, updateMapRoute]);

  const calculateFare = useCallback(async (origin: string, destination: string, vehicle: VehicleType, tripType: TripType) => {
    const isHill = (await checkIsHillStation(origin)) || (await checkIsHillStation(destination));
    
    if (tripType === TripType.LOCAL) {
      const pkg = LOCAL_PACKAGES.find(p => p.id === formData.localPackage) || LOCAL_PACKAGES[0];
      const fareInfo = calculateFareDetails(0, vehicle, TripType.LOCAL, formData.localPackage, 1, 0, isHill);
      
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
      if (formData.tripType === TripType.LOCAL) {
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
    const phone = formData.phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    const isLocal = formData.tripType === TripType.LOCAL;
    if (!p || (!d && !isLocal)) {
      alert(isLocal ? "Please enter pickup location." : "Please enter pickup and destination.");
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid 10-digit Indian phone number.");
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
  const tripDetails = formData.tripType === TripType.LOCAL 
    ? `*Package:* ${LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label}`
    : `*Drop:* ${formData.drop}${formData.tripType === TripType.ROUND_TRIP ? `%0A*Days:* ${formData.numberOfDays}` : ''}`;
  
  const dateTimeStr = (formData.date || formData.time) 
    ? `*Date/Time:* ${formData.date || 'Not specified'} at ${formData.time || 'Not specified'}`
    : '*Date/Time:* Not specified';

  const hillStr = formData.isHillStation ? '%0A*Hill Station Charge:* Applied (₹300)' : '';

  const message = `*NEW BOOKING CONFIRMATION*%0A*Trip Type:* ${formData.tripType}%0A*Phone:* ${formData.phone}%0A*Pickup:* ${formData.pickup}%0A${tripDetails}%0A${dateTimeStr}${hillStr}%0A*Vehicle:* ${formData.vehicleType}%0A*Fare:* ${formData.estimatedFare}`;
  window.open(`https://wa.me/919488834020?text=${message}`, '_blank');
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
        <MessageCircle size={45} /> WhatsApp support
      </button>

{/* Book Another Ride Button */}
<button 
  type="button"   // important to prevent accidental form submission
  onClick={() => {
    setSubmitted(false);      // go back to the form
    setStep(1);               // start from step 1
    setFormData({             // reset all fields
      phone: '',
      pickup: '',
      drop: '',
      date: '',
      time: '',
      numberOfDays: '1',
      waitingHours: '0',
      vehicleType: VehicleType.MINI,
      tripType: TripType.ONE_WAY,
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
    <div className="bg-white dark:bg-slate-900 p-5 pb-10 sm:pb-5 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm mx-auto transition-all duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {step === 1 ? 'Local & Outstation' : step === 2 ? 'Select Vehicle' : 'Trip Summary'}
        </h3>
        <div className="flex gap-2">
          <div className={`h-1 w-6 rounded-full transition-all ${step === 1 ? 'bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1 w-6 rounded-full transition-all ${step === 2 ? 'bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1 w-6 rounded-full transition-all ${step === 3 ? 'bg-[#FF6467]' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Step 1 */}
        <div className={`${step === 1 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          {/* Trip Type Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
            {[
              { id: TripType.ONE_WAY, icon: () => null, label: 'One Way drop' },
              { id: TripType.ROUND_TRIP, icon: Repeat, label: 'Round Trip' },
              { id: TripType.LOCAL, icon: () => null, label: 'Rental' }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tripType: type.id, estimatedFare: '', distance: '' }))}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                  ${formData.tripType === type.id 
                    ? 'bg-[#FF6467] text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                `}
              >
                <type.icon size={14} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Map - Only Visible in Step 1 when both locations are entered */}
          {formData.pickup && (formData.tripType === TripType.LOCAL || formData.drop) && (
            <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner animate-in fade-in zoom-in duration-500">
              <div ref={mapRef} className="w-full h-full" />
              {mapError && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle size={20} className="text-[#FF6467] mb-1" />
                  <p className="text-[9px] text-white font-bold uppercase">{mapError}</p>
                </div>
              )}
            </div>
          )}

          
          <div className="grid grid-cols-1 gap-3">
            <InputWrapper icon={MapPin} label="Pickup Location">
              <div className="relative w-full">
                <input
                  ref={pickupRef}
                  type="text"
                  readOnly={window.innerWidth < 640}
                  onFocus={() => {
                    if (window.innerWidth < 640) setMobileSearchType('pickup');
                  }}
                  required
                  placeholder="Enter Pickup Location"
                  defaultValue={formData.pickup}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#FF6467] rounded-xl text-xs font-bold outline-none dark:text-white"
                />

                {formData.pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      if (pickupRef.current) pickupRef.current.value = '';
                      setFormData(prev => ({ ...prev, pickup: '' }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF6467]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </InputWrapper>

           
            <div className={formData.tripType !== TripType.LOCAL ? 'block' : 'hidden'}>
              <InputWrapper icon={MapPin} label="Destination">
                <div className="relative w-full">
                  <input
                    ref={dropRef}
                    type="text"
                    readOnly={window.innerWidth < 640}
                    onFocus={() => {
                      if (window.innerWidth < 640) setMobileSearchType('drop');
                    }}
                    required={formData.tripType !== TripType.LOCAL}
                    placeholder="Enter Destination"
                    defaultValue={formData.drop}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#FF6467] rounded-xl text-xs font-bold outline-none dark:text-white"
                  />

                  {formData.drop && (
                    <button
                      type="button"
                      onClick={() => {
                        if (dropRef.current) dropRef.current.value = '';
                        setFormData(prev => ({ ...prev, drop: '' }));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF6467]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </InputWrapper>
            </div>

            <div className={formData.tripType === TripType.LOCAL ? 'block' : 'hidden'}>
              <InputWrapper icon={() => null} label="Local Package">
                <select
                  name="localPackage"
                  value={formData.localPackage}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 focus:border-[#FF6467] rounded-xl text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Select Package</option>
                  {LOCAL_PACKAGES.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                  ))}
                </select>
              </InputWrapper>
             
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
  
  {/* Date */}
  <div className="col-span-1">
    <InputWrapper icon={Calendar} label="Date">
      <input
        type="date"
        name="date"
        min={indiaToday}
        value={formData.date}
        onChange={handleChange}
        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white"
      />
    </InputWrapper>
  </div>

  {/* Time */}
  <div className="col-span-1">
    <InputWrapper icon={Clock} label="Time">
      <input
        type="time"
        name="time"
        value={formData.time}
        onChange={handleChange}
        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white"
      />
    </InputWrapper>
  </div>

  {/* No. of Days / Waiting Charge row */}
  {formData.tripType === TripType.ROUND_TRIP && (
    <div className="col-span-2 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <InputWrapper icon={Clock} label="Duration">
            <select
              name="numberOfDays"
              value={formData.numberOfDays}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white appearance-none"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                <option key={n} value={n}>
                  {n === 1 ? 'Same Day Return' : `${n} Days`}
                </option>
              ))}
            </select>
          </InputWrapper>
        </div>
        
        {formData.numberOfDays === '1' && formData.tripType !== TripType.ROUND_TRIP && (
          <div className="flex-1">
            <InputWrapper icon={Clock} label="Waiting Hours">
              <select
                name="waitingHours"
                value={formData.waitingHours}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none dark:text-white appearance-none"
              >
                {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? 'Hr' : 'Hrs'}
                  </option>
                ))}
              </select>
            </InputWrapper>
          </div>
        )}
      </div>
    </div>
  )}
</div>

<div className="grid grid-cols-1 gap-3">
  <InputWrapper icon={Phone} label="Phone Number">
    <input
      type="tel"
      name="phone"
      required
      placeholder="10-digit number"
      value={formData.phone}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, phone: cleaned.slice(0, 10) }));
      }}
      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-[#FF6467] rounded-xl text-xs font-black outline-none dark:text-white
                 ring-2 ring-[#FF6467] ring-opacity-40 transition-all duration-200"
      maxLength={10}
    />
            </InputWrapper>
          </div>

      <button 
            type="button" 
            onClick={handleNextStep} 
            className="w-full bg-[#FF6467] hover:bg-[#e55a5d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#FF6467]/20 uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>

        {/* Step 2 */}
        <div className={`${step === 2 ? 'space-y-3.5' : 'hidden'} animate-fade-in`}>
          <div className="flex justify-between items-center px-1">
            <button 
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-[#FF6467] hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 -ml-1 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Choose Vehicle (Scroll Down)</span>
          </div>

          <div className="relative group">
            <div className="space-y-1.5 max-h-[240px] sm:max-h-[280px] overflow-y-auto pr-1 app-scroll">
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
                    w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all text-left
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
                      className="w-24 h-24 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Car size={32} className="text-slate-400" />
                    </div>
                  )}

  {/* Vehicle Info */}
  <div className="flex-1 flex flex-col justify-between">
    {/* Top row: Label */}
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
        {v.label}
      </span>
    </div>

    {/* Bottom row: Capacity & Description */}
    <div className="flex items-center gap-3 mt-1">
      <span className="text-xs text-slate-400 flex items-center gap-1">
        <User size={10} /> {v.capacity}
      </span>
      <span className="text-xs text-slate-400 font-medium truncate">
        • {v.description}
      </span>
    </div>
  </div>
</button>
              );
            })}
            </div>
            {/* Bottom fade to indicate more content */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none opacity-60 rounded-b-2xl" />
          </div>



        <div className="flex gap-3">
          
            <button
              type="button"
              onClick={() => setStep(1)}
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
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
>
  Confirm Selection
</button>
          </div>
        </div>

        {/* Step 3: Summary */}
        <div className={`${step === 3 ? 'space-y-4' : 'hidden'} animate-fade-in`}>
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
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trip Summary</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6467]/10 rounded-xl flex items-center justify-center text-[#FF6467]">
                <Navigation size={20} />
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Trip Type</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{formData.tripType}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 flex flex-col items-center gap-1.5 py-1">
                  <div className="w-2 h-2 rounded-full border-2 border-[#FF6467]" />
                  <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-[#FF6467]" />
                </div>
                <div className="flex-1 space-y-4 pt-0.5">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Pickup</span>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">{formData.pickup}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Destination</span>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">
                      {formData.tripType === TripType.LOCAL 
                        ? LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label 
                        : formData.drop}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Departure</span>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.date}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.time}</p>
                </div>
                {formData.tripType === TripType.ROUND_TRIP && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-[7px] font-black text-slate-400 uppercase">Duration</span>
                    <p className="text-[9px] font-black text-[#FF6467] uppercase">
                     {formData.numberOfDays === '1' 
  ? 'Same Day Return' 
  : `${formData.numberOfDays} Days`}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Vehicle</span>
                <div className="flex items-center gap-1.5">
                  <Car size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase truncate">{formData.vehicleType}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone size={12} className="text-[#FF6467]" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{formData.phone}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <div>
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Estimated Distance</span>
                <span className="text-xs font-black text-[#FF6467]">{formData.distance}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Total Fare</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{formData.estimatedFare}</span>
              </div>
            </div>

            {formData.fareBreakdown && formData.estimatedFare !== 'Call for Quote' && (
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-2 border border-slate-200/50 dark:border-slate-800/50">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Fare Breakdown</span>
                
                {formData.tripType === TripType.LOCAL ? (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">
                      {LOCAL_PACKAGES.find(p => p.id === formData.localPackage)?.label.replace(/\s/g, '').replace('Hr', 'Hr').replace('Km', 'kms').replace('//', '/')}:
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.baseFare}</span>
                  </div>
                ) : (
                  <>
                    {formData.fareBreakdown.distanceFare > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Trip Fare</span>
                          <span className="text-[8px] text-slate-400 lowercase">
                            ({formData.fareBreakdown.billableDistance || 0} km X ₹ {formData.fareBreakdown.ratePerKm || 0})
                          </span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.distanceFare}</span>
                      </div>
                    )}

                    {formData.fareBreakdown.driverBeta > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Driver Allowance</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.driverBeta}</span>
                      </div>
                    )}

                    {(formData.fareBreakdown.waitingCharge || 0) > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Waiting Charges</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.waitingCharge}</span>
                      </div>
                    )}

                    {formData.fareBreakdown.extraDaysFare > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Extra Days Fare</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.extraDaysFare}</span>
                      </div>
                    )}

                    {(formData.fareBreakdown.hillCharge || 0) > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Hill Charges</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.hillCharge}</span>
                      </div>
                    )}

                    {formData.fareBreakdown.baseFare > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">Base Fare</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{formData.fareBreakdown.baseFare}</span>
                      </div>
                    )}

                    {formData.tripType === TripType.ROUND_TRIP && ((formData.rawDistance || 0) * 2) < (parseInt(formData.numberOfDays || '1') * 250) && (
                      <div className="pt-1">
                        <p className="text-[8px] text-[#FF6467] font-bold ">
                          * Per day minimum 250 kms applicable
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-1">
                  <p className="text-[8px] font-bold text-slate-400 ">Excluded: Toll, Inter-State taxes & Parking (if applicable)</p>
                </div>
              </div>
            )}
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

