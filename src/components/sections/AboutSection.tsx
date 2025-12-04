import type { FC } from 'react'
import { useI18n } from '../../i18n/useI18n'

export const AboutSection: FC = () => {
  const { t, lang } = useI18n()

  // card2.title 은 translations에 없으므로, 기존 literal 유지
  const card2Title = lang === 'ko' ? 'How to Use' : 'How to Use'

  return (
    <section id="about" className="section">
      <div className="section-header">
        <h2>{t('about.title')}</h2>
        <p>{t('about.subtitle')}</p>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <h3>{t('about.card1.title')}</h3>
          <p>{t('about.card1.desc')}</p>
        </div>

        <div className="about-card">
          <h3>{card2Title}</h3>
          <ul>
            <li>{t('about.card2.li1')}</li>
            <li>{t('about.card2.li2')}</li>
            <li>{t('about.card2.li3')}</li>
          </ul>
        </div>

        <div className="about-card">
          <h3>{t('about.card3.title')}</h3>
          <ul>
            <li>{t('about.card3.li1')}</li>
            <li>{t('about.card3.li2')}</li>
            <li>{t('about.card3.li3')}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
