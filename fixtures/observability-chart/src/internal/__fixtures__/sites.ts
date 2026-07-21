import type { Site } from 'skynet-sdk';

/** A representative low-latitude site (Cerro Tololo, Chile). */
export const CTIO: Site = {
  id: 1,
  uid: '00000000-0000-0000-0000-000000000001',
  name: 'Cerro Tololo Interamerican Observatory',
  slug: 'ctio',
  iauCode: 'CTIO',
  location: 'Chile',
  countryCode: 'CL',
  latitudeDeg: -30.169,
  longitudeDeg: -70.806,
  elevationM: 2200,
};

/** A representative mid-latitude site (Morehead Planetarium PROMPT host). */
export const PARI: Site = {
  id: 2,
  uid: '00000000-0000-0000-0000-000000000002',
  name: 'PARI',
  slug: 'pari',
  iauCode: null,
  location: 'North Carolina, USA',
  countryCode: 'US',
  latitudeDeg: 35.20,
  longitudeDeg: -82.87,
  elevationM: 985,
};
