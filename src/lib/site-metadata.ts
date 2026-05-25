export const APP_NAME = "Quản lý cầu lông";

export const APP_DESCRIPTION =
  "Hệ thống quản lý chi phí và quỹ chung cho câu lạc bộ cầu lông";

export function clubTitleTemplate(clubName: string) {
  return `%s · CLB ${clubName}`;
}

export function clubDefaultTitle(clubName: string) {
  return `CLB ${clubName}`;
}
