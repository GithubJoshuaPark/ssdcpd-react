import type { FC } from "react";
import { useI18n } from "../../i18n/useI18n";
import type { Track } from "../../types_interfaces/track";
import { RichEditor } from "../common/RichEditor";

interface TrackCardProps {
  track: Track;
}

export const TrackCard: FC<TrackCardProps> = ({ track }) => {
  const { t, lang } = useI18n();

  // vanilla js: currentLang === "ko" && track.short_ko ? track.short_ko : track.short;
  const description =
    lang === "ko" && typeof track.short_ko === "string" && track.short_ko
      ? (track.short_ko as string)
      : (track.short as string | undefined) ?? "";

  const hasRepoLink =
    typeof track.url === "string" &&
    track.url !== "" &&
    track.url !== "#" &&
    track.url !== null &&
    track.url !== undefined;

  // footer 텍스트 i18n 처리
  const footerText = hasRepoLink
    ? t("track.footerPublic") // 공개 리포지토리
    : t("track.footerComing"); // 준비 중

  return (
    <article className="card" data-category={track.category}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{track.title}</h3>
          <p className="card-subtitle">{track.level}</p>
        </div>
        <span
          className={
            "badge " +
            (track.status === "Active" ? "badge-primary" : "badge-outline")
          }
        >
          {track.status}
        </span>
      </div>

      {/* Body */}
      <div className="card-body">
        <RichEditor value={description} readOnly={true} />
      </div>

      {/* Tags */}
      {Array.isArray(track.tags) && track.tags.length > 0 && (
        <div className="card-tags">
          {track.tags.map(tag => (
            <span key={String(tag)} className="tag">
              {String(tag)}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <span>{footerText}</span>

        {hasRepoLink && (
          <a
            className="card-link"
            href={track.url as string}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t("track.viewRepo")}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M7.5 4a1 1 0 0 0 0 2h5.09L4.3 14.29a1 1 0 1 0 1.4 1.42L14 7.41V12.5a1 1 0 1 0 2 0v-7A1.5 1.5 0 0 0 14.5 4h-7z"
              />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
};
