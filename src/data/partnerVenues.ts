import type { PartnerVenue } from '../types/outings';

/**
 * Demo partner places for «Συνάντηση πριν» (Φ27). Each gives Nakamas groups a
 * small discount with the group code. Names are invented for the demo.
 */
export const partnerVenues: PartnerVenue[] = [
  { id: 'pv_gazi', name: 'Κάβα Γκάζι', area: 'Gazi, Athens', address: 'Persefonis 22', lat: 37.9779, lng: 23.7131, discountPct: 10, kind: 'wine_bar' },
  { id: 'pv_thisio', name: 'Καφέ Αποστόλου', area: 'Thisio, Athens', address: 'Apostolou Pavlou 13', lat: 37.9748, lng: 23.7196, discountPct: 10, kind: 'cafe' },
  { id: 'pv_psyrri', name: 'Μπαρ Ψυρρή', area: 'Psyrri, Athens', address: 'Aisopou 8', lat: 37.9783, lng: 23.7239, discountPct: 15, kind: 'bar' },
  { id: 'pv_koukaki', name: 'Αυλή Κουκάκι', area: 'Koukaki, Athens', address: 'Drakou 6', lat: 37.9655, lng: 23.7243, discountPct: 10, kind: 'cafe' },
  { id: 'pv_makrygianni', name: 'Μακρυγιάννη 21', area: 'Makrygianni, Athens', address: 'Makrygianni 21', lat: 37.9693, lng: 23.7289, discountPct: 10, kind: 'wine_bar' },
  { id: 'pv_faliro', name: 'Ακτή Φαλήρου', area: 'Faliro, Athens', address: 'Poseidonos 18', lat: 37.9342, lng: 23.6905, discountPct: 10, kind: 'bar' },
  { id: 'pv_kallithea', name: 'Καφέ Κήπος', area: 'Kallithea, Athens', address: 'Syngrou 364', lat: 37.9418, lng: 23.6985, discountPct: 10, kind: 'cafe' },
  { id: 'pv_kaisariani', name: 'Πρόποδες Υμηττού', area: 'Kaisariani, Athens', address: 'Ethnikis Antistaseos 88', lat: 37.9663, lng: 23.7681, discountPct: 10, kind: 'cafe' },
  { id: 'pv_exarchia', name: 'Κουρνιαχτός', area: 'Exarchia, Athens', address: 'Themistokleous 40', lat: 37.9866, lng: 23.7334, discountPct: 15, kind: 'bar' },
];
