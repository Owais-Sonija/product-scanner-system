export interface Location {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Product {
  id: string
  barcode: string
  product_name: string
  manufacturer?: string
  source_url?: string
  country?: string
  notes?: string
  location_id?: string
  locations?: Location
  field_01: boolean
  field_02: boolean
  field_03: boolean
  field_04: boolean
  field_05: boolean
  field_06: boolean
  field_07: boolean
  field_08: boolean
  field_09: boolean
  field_10: boolean
  field_11: boolean
  field_12: boolean
  field_13: boolean
  field_14: boolean
  field_15: boolean
  field_16: boolean
  field_17: boolean
  field_18: boolean
  field_19: boolean
  field_20: boolean
  field_21: boolean
  field_22: boolean
  field_23: boolean
  field_24: boolean
  field_25: boolean
  field_26: boolean
  field_27: boolean
  field_28: boolean
  created_at: string
  updated_at: string
}

export interface ConfirmationLog {
  id: string
  product_id: string
  location_id: string
  staff_id: string
  confirmation_1_at?: string
  confirmation_2_at?: string
  created_at: string
  products?: { product_name: string, barcode: string }
  locations?: { name: string, code: string }
  profiles?: { full_name: string }
}

export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'staff'
  location_id?: string
}

export const BOOLEAN_FIELDS = [
  { key: 'field_01', label: 'Field 01' },
  { key: 'field_02', label: 'Field 02' },
  { key: 'field_03', label: 'Field 03' },
  { key: 'field_04', label: 'Field 04' },
  { key: 'field_05', label: 'Field 05' },
  { key: 'field_06', label: 'Field 06' },
  { key: 'field_07', label: 'Field 07' },
  { key: 'field_08', label: 'Field 08' },
  { key: 'field_09', label: 'Field 09' },
  { key: 'field_10', label: 'Field 10' },
  { key: 'field_11', label: 'Field 11' },
  { key: 'field_12', label: 'Field 12' },
  { key: 'field_13', label: 'Field 13' },
  { key: 'field_14', label: 'Field 14' },
  { key: 'field_15', label: 'Field 15' },
  { key: 'field_16', label: 'Field 16' },
  { key: 'field_17', label: 'Field 17' },
  { key: 'field_18', label: 'Field 18' },
  { key: 'field_19', label: 'Field 19' },
  { key: 'field_20', label: 'Field 20' },
  { key: 'field_21', label: 'Field 21' },
  { key: 'field_22', label: 'Field 22' },
  { key: 'field_23', label: 'Field 23' },
  { key: 'field_24', label: 'Field 24' },
  { key: 'field_25', label: 'Field 25' },
  { key: 'field_26', label: 'Field 26' },
  { key: 'field_27', label: 'Field 27' },
  { key: 'field_28', label: 'Field 28' },
]
