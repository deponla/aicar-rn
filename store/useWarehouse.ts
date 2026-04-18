import { WarehouseAddress } from "@/types/warehouse";
import { create } from "zustand";

export enum WarehouseCategories {
  STORAGE = "STORAGE",
  PARKING = "PARKING",
  ROOM = "ROOM",
  GARAGE = "GARAGE",
  LAND = "LAND",
}

export const STORAGE_TYPES = [
  { label: "Depolama", value: WarehouseCategories.STORAGE },
  { label: "Otopark", value: WarehouseCategories.PARKING },
  { label: "Oda", value: WarehouseCategories.ROOM },
  { label: "Garaj", value: WarehouseCategories.GARAGE },
  { label: "Arazi", value: WarehouseCategories.LAND },
];

export enum Currency {
  TL = "TL",
  DOLLAR = "DOLLAR",
  EURO = "EURO",
}

export enum RentOrSale {
  RENT = "RENT",
  SALE = "SALE",
}

export enum WarehouseAreaTypes {
  INDOOR = "INDOOR",
  OUTDOOR = "OUTDOOR",
}

export enum AppropriateProductAttributes {
  NORMAL_PRODUCT = "NORMAL_PRODUCT",
  COLD_CHAIN_PRODUCT = "COLD_CHAIN_PRODUCT",
  HANGING_PRODUCT = "HANGING_PRODUCT",
  DANGEROUS_PRODUCT = "DANGEROUS_PRODUCT",
}

export enum SecurityFeatures {
  CAMERA = "CAMERA",
  DETECTOR_AND_ALARM = "DETECTOR_AND_ALARM",
  INSURANCE = "INSURANCE",
  ACCESS_TYPE = "ACCESS_TYPE",
}

export enum SecurityCameraTypes {
  LOADING_UNLOADING_AREA = "LOADING_UNLOADING_AREA",
  PRODUCT_ACCEPTANCE_AREA = "PRODUCT_ACCEPTANCE_AREA",
  STORAGE_AREA = "STORAGE_AREA",
  OPEN_AREA = "OPEN_AREA",
  PERIMETER = "PERIMETER",
  ENTRANCE_AND_SURROUNDINGS = "ENTRANCE_AND_SURROUNDINGS",
  PACKAGING_SECTION_AND_TABLE = "PACKAGING_SECTION_AND_TABLE",
}

export enum DetectorAndAlarmTypes {
  Heat = "HEAT",
  Flame = "FLAME",
  Flood = "FLOOD",
  GasLeak = "GAS_LEAK",
  Burglary = "BURGLARY",
  UnauthorizedAccess = "UNAUTHORIZED_ACCESS",
  Motion = "MOTION",
  Smoke = "SMOKE",
}

export enum AccessTypes {
  _24_7 = "24_7",
  BUSINESS_HOURS = "BUSINESS_HOURS",
  BY_APPOINTMENT = "BY_APPOINTMENT",
}

export enum VehicleAccesibility {
  TRUCK = "TRUCK",
  VAN = "VAN",
  FORKLIFT = "FORKLIFT",
  CAMION = "CAMION",
  KAMYONET = "KAMYONET",
}

export const VEHICLE_ACCESSIBILITY_OPTIONS = [
  { label: "Tır", value: VehicleAccesibility.TRUCK },
  { label: "Kamyonet", value: VehicleAccesibility.KAMYONET },
  { label: "Kamyon", value: VehicleAccesibility.CAMION },
  { label: "Panelvan", value: VehicleAccesibility.VAN },
  { label: "Forklift", value: VehicleAccesibility.FORKLIFT },
];

type Store = {
  name: string | null;
  description: string | null;
  storageType: WarehouseCategories[] | null;
  address: WarehouseAddress | null;
  price: number | null;
  currency: Currency;
  rentOrSale: RentOrSale;
  areaType: WarehouseAreaTypes[] | null;
  indoorAreaSize: number | null;
  outdoorAreaSize: number | null;
  appropriateProductAttributes: AppropriateProductAttributes[] | null;
  securityFeatures: SecurityFeatures[] | null;
  securityCameraTypes: SecurityCameraTypes[] | null;
  detectorAndAlarmTypes: DetectorAndAlarmTypes[] | null;
  accessTypes: AccessTypes[] | null;
  vehicleAccessibility: VehicleAccesibility[] | null;
  setVehicleAccessibility: (types: VehicleAccesibility | null) => void;
  setDetectorAndAlarmTypes: (
    types: DetectorAndAlarmTypes[] | DetectorAndAlarmTypes | null,
  ) => void;
  setAccessTypes: (types: AccessTypes[] | AccessTypes | null) => void;
  setSecurityCameraTypes: (
    types: SecurityCameraTypes[] | SecurityCameraTypes | null,
  ) => void;
  setRentOrSale: (rentOrSale: RentOrSale) => void;
  setCurrency: (currency: Currency) => void;
  setName: (name: string | null) => void;
  setDescription: (description: string | null) => void;
  setWarehouseAddress: (address: WarehouseAddress) => void;
  setStorageType: (type: WarehouseCategories) => void;
  setPrice: (price: number | null) => void;
  setAreaType: (type: WarehouseAreaTypes) => void;
  setIndoorAreaSize: (size: number | null) => void;
  setOutdoorAreaSize: (size: number | null) => void;
  setAppropriateProductAttributes: (
    attributes: AppropriateProductAttributes,
  ) => void;
  setSecurityFeatures: (features: SecurityFeatures) => void;
  reset: () => void;
};

export const useWarehouse = create<Store>()((set) => ({
  indoorAreaSize: null,
  outdoorAreaSize: null,
  address: null,
  storageType: null,
  name: null,
  description: null,
  price: null,
  rentOrSale: RentOrSale.RENT,
  currency: Currency.TL,
  areaType: null,
  appropriateProductAttributes: null,
  securityFeatures: null,
  securityCameraTypes: null,
  detectorAndAlarmTypes: null,
  accessTypes: null,
  vehicleAccessibility: null,
  setVehicleAccessibility: (types) =>
    set((state) => {
      const currentTypes = state.vehicleAccessibility || [];
      if (types === null) {
        return { vehicleAccessibility: null };
      }
      if (currentTypes.includes(types)) {
        return {
          vehicleAccessibility: currentTypes.filter((t) => t !== types),
        };
      } else {
        return {
          vehicleAccessibility: [...currentTypes, types],
        };
      }
    }),
  setDetectorAndAlarmTypes: (types) =>
    set(() => ({
      detectorAndAlarmTypes:
        types === null ? null : Array.isArray(types) ? types : [types],
    })),
  setAccessTypes: (types) =>
    set(() => ({
      accessTypes:
        types === null ? null : Array.isArray(types) ? types : [types],
    })),
  setSecurityCameraTypes: (types) =>
    set(() => ({
      securityCameraTypes:
        types === null ? null : Array.isArray(types) ? types : [types],
    })),
  setSecurityFeatures: (feature) =>
    set((state) => {
      const currentFeatures = state.securityFeatures || [];
      if (currentFeatures.includes(feature)) {
        return {
          securityFeatures: currentFeatures.filter((f) => f !== feature),
        };
      } else {
        return {
          securityFeatures: [...currentFeatures, feature],
        };
      }
    }),
  setAppropriateProductAttributes: (attribute) =>
    set((state) => {
      const currentAttributes = state.appropriateProductAttributes || [];
      if (currentAttributes.includes(attribute)) {
        return {
          appropriateProductAttributes: currentAttributes.filter(
            (a) => a !== attribute,
          ),
        };
      } else {
        return {
          appropriateProductAttributes: [...currentAttributes, attribute],
        };
      }
    }),
  setWarehouseAddress: (address) =>
    set(() => ({
      address,
    })),
  setStorageType: (type) =>
    set((state) => {
      const currentTypes = state.storageType || [];
      if (currentTypes.includes(type)) {
        return {
          storageType: currentTypes.filter((t) => t !== type),
        };
      } else {
        return {
          storageType: [...currentTypes, type],
        };
      }
    }),
  setName: (name) => set(() => ({ name })),
  setDescription: (description) => set(() => ({ description })),
  setPrice: (price) => set(() => ({ price })),
  setCurrency: (currency) => set(() => ({ currency })),
  setRentOrSale: (rentOrSale) => set(() => ({ rentOrSale })),
  setAreaType: (type) =>
    set((state) => {
      const currentTypes = state.areaType || [];
      if (currentTypes.includes(type)) {
        return {
          areaType: currentTypes.filter((t) => t !== type),
        };
      } else {
        return {
          areaType: [...currentTypes, type],
        };
      }
    }),
  setIndoorAreaSize: (size) => set(() => ({ indoorAreaSize: size })),
  setOutdoorAreaSize: (size) => set(() => ({ outdoorAreaSize: size })),
  reset: () =>
    set(() => ({
      indoorAreaSize: null,
      outdoorAreaSize: null,
      address: null,
      storageType: null,
      name: null,
      description: null,
      price: null,
      rentOrSale: RentOrSale.RENT,
      currency: Currency.TL,
      areaType: null,
      appropriateProductAttributes: null,
      securityFeatures: null,
      securityCameraTypes: null,
      detectorAndAlarmTypes: null,
      accessTypes: null,
      vehicleAccessibility: null,
    })),
}));
