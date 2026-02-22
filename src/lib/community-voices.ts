export interface CommunityVoice {
  id: string
  lat: number
  lng: number
  neighborhood: string
  source: 'survey' | 'social' | 'forum' | 'meeting'
  quote: string
  topic: 'safety' | 'infrastructure' | 'transit' | 'food' | 'housing' | 'parks'
  sentiment: 'positive' | 'neutral' | 'negative'
  date: string
  author: string
}

export const communityVoices: Array<CommunityVoice> = [
  {
    id: 'cv-1',
    lat: 38.6123,
    lng: -90.2314,
    neighborhood: 'Tower Grove South',
    source: 'survey',
    quote:
      'We need more lighting on Morganford after dark. It feels unsafe walking from the bus stop.',
    topic: 'safety',
    sentiment: 'negative',
    date: '2024-01-15',
    author: 'Resident, 5 years',
  },
  {
    id: 'cv-2',
    lat: 38.6345,
    lng: -90.2567,
    neighborhood: 'Central West End',
    source: 'social',
    quote: 'Love the new bike lanes on Euclid! Makes commuting so much safer.',
    topic: 'infrastructure',
    sentiment: 'positive',
    date: '2024-02-03',
    author: '@STLCyclist',
  },
  {
    id: 'cv-3',
    lat: 38.5987,
    lng: -90.2156,
    neighborhood: 'Gravois Park',
    source: 'forum',
    quote:
      'The vacant building on the corner has been an issue for 3 years now. Please address it.',
    topic: 'housing',
    sentiment: 'negative',
    date: '2024-01-28',
    author: 'Concerned Neighbor',
  },
  {
    id: 'cv-4',
    lat: 38.6456,
    lng: -90.2834,
    neighborhood: 'The Ville',
    source: 'meeting',
    quote:
      'The community garden project has brought neighbors together. A real success story!',
    topic: 'parks',
    sentiment: 'positive',
    date: '2024-01-20',
    author: 'Block Captain',
  },
  {
    id: 'cv-5',
    lat: 38.6234,
    lng: -90.1987,
    neighborhood: 'Soulard',
    source: 'social',
    quote:
      "Farmer's market is great but parking is impossible on weekends. Need better transit options.",
    topic: 'transit',
    sentiment: 'neutral',
    date: '2024-02-10',
    author: '@SoulardShopper',
  },
  {
    id: 'cv-6',
    lat: 38.5876,
    lng: -90.2345,
    neighborhood: 'Dutchtown',
    source: 'survey',
    quote:
      'Finally got a grocery store within walking distance. Huge improvement for our block!',
    topic: 'food',
    sentiment: 'positive',
    date: '2024-01-08',
    author: 'Resident, 12 years',
  },
  {
    id: 'cv-7',
    lat: 38.6543,
    lng: -90.2123,
    neighborhood: 'Old North St. Louis',
    source: 'forum',
    quote:
      'Street repairs have been promised for months. Still waiting on the city to deliver.',
    topic: 'infrastructure',
    sentiment: 'negative',
    date: '2024-02-05',
    author: 'Frustrated Homeowner',
  },
  {
    id: 'cv-8',
    lat: 38.6098,
    lng: -90.2678,
    neighborhood: 'Shaw',
    source: 'meeting',
    quote:
      'The new playground equipment at Tower Grove Park is amazing. Kids love it!',
    topic: 'parks',
    sentiment: 'positive',
    date: '2024-01-25',
    author: 'Parent of 3',
  },
  {
    id: 'cv-9',
    lat: 38.5789,
    lng: -90.2456,
    neighborhood: 'Carondelet',
    source: 'social',
    quote:
      'Bus route cuts have made it impossible to get to work on time. Please restore service.',
    topic: 'transit',
    sentiment: 'negative',
    date: '2024-02-08',
    author: '@SouthSideRider',
  },
  {
    id: 'cv-10',
    lat: 38.6423,
    lng: -90.2234,
    neighborhood: 'Grand Center',
    source: 'survey',
    quote:
      'The arts district brings so much energy. Great to see investment in our community.',
    topic: 'infrastructure',
    sentiment: 'positive',
    date: '2024-01-18',
    author: 'Local Artist',
  },
  {
    id: 'cv-11',
    lat: 38.5654,
    lng: -90.2567,
    neighborhood: 'Holly Hills',
    source: 'forum',
    quote:
      'Would love to see more community events. We have great parks that are underutilized.',
    topic: 'parks',
    sentiment: 'neutral',
    date: '2024-02-01',
    author: 'Active Resident',
  },
  {
    id: 'cv-12',
    lat: 38.6897,
    lng: -90.2123,
    neighborhood: 'Baden',
    source: 'meeting',
    quote:
      'The new affordable housing development is exactly what this neighborhood needed.',
    topic: 'housing',
    sentiment: 'positive',
    date: '2024-01-30',
    author: 'Community Organizer',
  },
]

export function getVoicesByNeighborhood(
  neighborhoodName: string,
): Array<CommunityVoice> {
  return communityVoices.filter(
    (v) =>
      v.neighborhood.toLowerCase().includes(neighborhoodName.toLowerCase()) ||
      neighborhoodName.toLowerCase().includes(v.neighborhood.toLowerCase()),
  )
}

export function getVoicesByTopic(
  topic: CommunityVoice['topic'],
): Array<CommunityVoice> {
  return communityVoices.filter((v) => v.topic === topic)
}

export function getVoicesBySentiment(
  sentiment: CommunityVoice['sentiment'],
): Array<CommunityVoice> {
  return communityVoices.filter((v) => v.sentiment === sentiment)
}
