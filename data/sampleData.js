// makan-backend/data/sampleData.js

const agents = [
  {
    name: 'Karim Mansouri',
    email: 'k.mansouri@makan.dz',
    phone: '+213 550 12 34 56',
    bio: 'Agent immobilier agréé spécialisé dans l’immobilier haut standing à Alger et Oran avec plus de 10 ans d’expérience sur le marché algérien.',
    license: 'AGI-DZ-16-4029'
  },
  {
    name: 'Yasmine Benali',
    email: 'y.benali@makan.dz',
    phone: '+213 661 78 90 12',
    bio: 'Conseillère en transactions et locations résidentielles de prestige à Alger (Hydra, El Biar, Sidi Yahia).',
    license: 'AGI-DZ-16-5812'
  },
  {
    name: 'Amine Touati',
    email: 'a.touati@makan.dz',
    phone: '+213 770 45 67 89',
    bio: 'Spécialiste de la location courte durée et des résidences touristiques à Oran et Constantine.',
    license: 'AGI-DZ-31-2914'
  }
];

const properties = [
  {
    title: 'Appartement Haut Standing à Hydra',
    description: 'Superbe appartement F4 entièrement rénové situé au cœur de Hydra. Proche de toutes commodités, finitions modernes, vue dégagée, résidence sécurisée avec ascenseur et bâche à eau.',
    price: 42000000, // 42,000,000 DZD
    rentOrSale: 'sale',
    type: 'apartment',
    status: 'available',
    address: '14 Boulevard du 11 Décembre 1960, Val d’Hydra',
    commune: 'Hydra',
    wilaya: 'Alger',
    city: 'Algiers',
    state: 'Algiers',
    zip: '16035',
    location: {
      type: 'Point',
      coordinates: [3.0418, 36.7441] // [longitude, latitude] - Hydra, Algiers
    },
    beds: 3,
    baths: 2,
    sqm: 135,
    sqft: 135,
    features: [
      'Chauffage Central',
      'Climatisation',
      'Cuisine Équipée',
      'Bâche à Eau',
      'Place de Parking',
      'Ascenseur',
      'Acte Notarié & Livret Foncier'
    ],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
  },
  {
    title: 'Villa Contemporaine avec Vue sur Mer à Canastel',
    description: 'Magnifique villa R+2 située dans le quartier résidentiel et prisé de Canastel. Jardin arboré avec piscine privative, garage pour 2 véhicules, suite parentale, système de sécurité et bâche à eau de 15 000 L.',
    price: 350000, // 350,000 DZD / Month
    rentOrSale: 'rent',
    type: 'villa',
    status: 'available',
    address: '28 Rue des Palmiers, Canastel',
    commune: 'Canastel',
    wilaya: 'Oran',
    city: 'Oran',
    state: 'Oran',
    zip: '31005',
    location: {
      type: 'Point',
      coordinates: [-0.5645, 35.7335] // [longitude, latitude] - Canastel, Oran
    },
    beds: 5,
    baths: 4,
    sqm: 380,
    sqft: 380,
    features: [
      'Piscine Privée',
      'Jardin Paysager',
      'Garage Double',
      'Chauffage Central',
      'Climatisation Gainable',
      'Bâche à Eau 15000L',
      'Caméras de Surveillance'
    ],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80']
  },
  {
    title: 'Bel Appartement Moderne à Akid Lotfi',
    description: 'Appartement spacieux et lumineux au 5ème étage d’une résidence calme à proximité du Boulevard Millénium. Cuisine moderne semi-équipée, salon spacieux et balcon sans vis-à-vis.',
    price: 21000000, // 21,000,000 DZD
    rentOrSale: 'sale',
    type: 'apartment',
    status: 'available',
    address: 'Résidence El Bahia, Boulevard Millénium, Akid Lotfi',
    commune: 'Akid Lotfi',
    wilaya: 'Oran',
    city: 'Oran',
    state: 'Oran',
    zip: '31000',
    location: {
      type: 'Point',
      coordinates: [-0.5892, 35.7088] // [longitude, latitude] - Akid Lotfi, Oran
    },
    beds: 2,
    baths: 1,
    sqm: 95,
    sqft: 95,
    features: [
      'Cuisine Équipée',
      'Chauffage Central',
      'Interphone',
      'Balcon',
      'Résidence Fermée',
      'Acte Notarié'
    ],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80']
  },
  {
    title: 'Studio Cosy Meublé - Location Courte Durée à Sidi Yahia',
    description: 'Studio standing idéal pour vos séjours d’affaires ou vacances à Alger. Entièrement équipé avec Wi-Fi fibre optique, kitchenette, smart TV, climatisation et service de conciergerie.',
    price: 12000, // 12,000 DZD / Night
    rentOrSale: 'daily_rental',
    type: 'apartment',
    status: 'available',
    address: 'Résidence Les Pins, Rue Sidi Yahia',
    commune: 'Sidi Yahia',
    wilaya: 'Alger',
    city: 'Algiers',
    state: 'Algiers',
    zip: '16035',
    location: {
      type: 'Point',
      coordinates: [3.0335, 36.7382] // [longitude, latitude] - Sidi Yahia, Algiers
    },
    beds: 1,
    baths: 1,
    sqm: 55,
    sqft: 55,
    features: [
      'Wi-Fi Fibre Optique',
      'Smart TV & Netflix',
      'Cuisine Équipée',
      'Climatisation Split',
      'Parking Sous-sol',
      'Self Check-in 24/7'
    ],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80']
  },
  {
    title: 'Appartement F3 Vue Panoramique - Nuitée à Akid Lotfi',
    description: 'Magnifique appartement F3 meublé pour location journalière à Oran. À 2 minutes des restaurants et commerces d’Akid Lotfi, tout confort avec literie hôtelière et vue dégagée.',
    price: 14000, // 14,000 DZD / Night
    rentOrSale: 'daily_rental',
    type: 'apartment',
    status: 'available',
    address: 'Boulevard Millénium, Akid Lotfi',
    commune: 'Akid Lotfi',
    wilaya: 'Oran',
    city: 'Oran',
    state: 'Oran',
    zip: '31000',
    location: {
      type: 'Point',
      coordinates: [-0.5875, 35.7095]
    },
    beds: 2,
    baths: 1,
    sqm: 85,
    sqft: 85,
    features: [
      'Wi-Fi Haut Débit',
      'Climatisation Réversible',
      'Balcon Aménagé',
      'Bâche à Eau',
      'Place de Stationnement'
    ],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80']
  }
];

module.exports = { agents, properties };