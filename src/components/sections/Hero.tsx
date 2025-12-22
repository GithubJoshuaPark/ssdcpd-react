import type { FC } from "react";
import { useI18n } from "../../i18n/useI18n";

export const Hero: FC = () => {
  const { t } = useI18n();

  return (
    <section id="overview" className="hero">
      <div className="hero-content">
        <h1>{t("hero.title")}</h1>
        <p className="hero-subtitle">{t("hero.subtitle")}</p>

        <div className="hero-meta">
          <span className="badge badge-primary">{t("hero.badge1")}</span>
          <span className="badge badge-outline">{t("hero.badge2")}</span>
          <span className="badge badge-outline">{t("hero.badge3")}</span>
        </div>

        <button
          id="scrollToTracksBtn"
          className="primary-btn"
          onClick={() => {
            const el = document.getElementById("tracks");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {t("hero.cta")}
        </button>
      </div>
    </section>
  );
};
