import type { FC } from 'react'
import { useI18n } from '../../i18n/useI18n'

export const TimelineSection: FC = () => {
  const { t } = useI18n()

  return (
    <section id="timeline" className="section section-alt">
      <div className="section-header">
        <h2>{t('timeline.title')}</h2>
        <p>{t('timeline.subtitle')}</p>
      </div>

      <div className="timeline">
        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3>{t('timeline.item1.title')}</h3>
            <p>{t('timeline.item1.desc')}</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3>{t('timeline.item2.title')}</h3>
            <p>{t('timeline.item2.desc')}</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3>{t('timeline.item3.title')}</h3>
            <p>{t('timeline.item3.desc')}</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3>{t('timeline.item4.title')}</h3>
            <p>{t('timeline.item4.desc')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
