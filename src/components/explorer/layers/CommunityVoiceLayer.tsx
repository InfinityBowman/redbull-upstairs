import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useExplorer } from '../ExplorerProvider'
import { communityVoices, type CommunityVoice } from '@/lib/community-voices'

export function CommunityVoiceLayer() {
  const { state } = useExplorer()

  const geojson = useMemo(() => {
    const features = communityVoices.map((voice) => ({
      type: 'Feature',
      properties: {
        id: voice.id,
        topic: voice.topic,
        sentiment: voice.sentiment,
        source: voice.source,
        quote: voice.quote,
        author: voice.author,
        date: voice.date,
      },
      geometry: {
        type: 'Point',
        coordinates: [voice.lng, voice.lat],
      },
    }))

    return {
      type: 'FeatureCollection',
      features,
    }
  }, [])

  const selectedId =
    state.selected?.type === 'communityVoice' ? state.selected.id : null

  return (
    <Source
      id="community-voices"
      type="geojson"
      data={geojson as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="voice-circles"
        type="circle"
        paint={{
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            14,
            10,
          ],
          'circle-color': [
            'match',
            ['get', 'sentiment'],
            'positive',
            '#22c55e',
            'negative',
            '#ef4444',
            '#6b7280',
          ],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />
      <Layer
        id="voice-label"
        type="symbol"
        layout={{
          'text-field': '💬',
          'text-size': 10,
          'text-anchor': 'center',
          'text-allow-overlap': true,
        }}
        paint={{
          'text-opacity': 1,
        }}
      />
    </Source>
  )
}

export function getVoiceById(id: string): CommunityVoice | undefined {
  return communityVoices.find((v) => v.id === id)
}
