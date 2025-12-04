import type { FC } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { useTracks } from '../../tracks/useTracks'
import { TrackCard } from './TrackCard'

export const TracksSection: FC = () => {
  const { t } = useI18n()
  const { filteredTracks, activeFilter, setFilter, loading } = useTracks()

  const filterItems = [
    { key: 'all', label: t('filter.all') },
    { key: 'systems', label: t('filter.systems') },
    { key: 'scripting', label: t('filter.scripting') },
    { key: 'backend', label: t('filter.backend') },
    { key: 'frontend', label: t('filter.frontend') },
    { key: 'lowlevel', label: t('filter.lowlevel') },
  ]

  return (
    <section id="tracks" className="section">
      <div className="section-header">
        <h2>{t('tracks.title')}</h2>
        <p>{t('tracks.subtitle')}</p>
      </div>

      <div className="toolbar">
        <div className="filter-group">
          {filterItems.map((f) => (
            <button
              key={f.key}
              className={
                'chip ' + (activeFilter === f.key ? 'chip-active' : '')
              }
              data-filter={f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid">
        {loading && <p>Loading...</p>}
        {!loading &&
          filteredTracks.map((track) => (
            <TrackCard key={String(track.id ?? track.title)} track={track} />
          ))}
      </div>
    </section>
  )
}
