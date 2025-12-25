// 카테고리: 필터에서 사용하는 값들만 Union 타입으로 정의
export type TrackCategory =
  | "systems"
  | "scripting"
  | "backend"
  | "lowlevel"
  | "c/c++"
  | "frontend";

// 상태: 현재는 "Active" 하나지만 추후 확장 대비
export type TrackStatus = "Active" | "Planned" | "Deprecated";

export interface Track {
  // Firebase key
  id?: string;

  // 기본 정보
  title: string;
  level?: string;
  category: TrackCategory;
  status?: TrackStatus;

  // 설명 (영/한)
  short?: string;
  short_ko?: string;

  // 리포지토리 URL (github, repo, url 중 실제 사용하는 값 기준)
  url?: string;

  // 태그 목록
  tags?: string[];

  // 타임스탬프
  createdAt?: string | number;
  updatedAt?: string | number;

  // 추가 필드 확장용
  [key: string]: unknown;
}
