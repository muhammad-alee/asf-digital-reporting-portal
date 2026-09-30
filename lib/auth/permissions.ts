export const ROLES = ["DATA_ENTRY", "SUPERVISOR", "REPORT_OFFICER", "COMMANDER", "ADMIN", "AUDITOR"] as const;
export type Role = (typeof ROLES)[number];
export type Permission = "report:create" | "report:submit" | "report:review" | "report:approve" | "report:admin" | "report:audit";
const grants: Record<Role, Permission[]> = {
  DATA_ENTRY:["report:create", "report:submit"], SUPERVISOR:["report:create", "report:submit", "report:review", "report:approve"],
  REPORT_OFFICER:["report:create", "report:submit", "report:review"], COMMANDER:["report:review", "report:approve"],
  ADMIN:["report:create", "report:submit", "report:review", "report:approve", "report:admin", "report:audit"], AUDITOR:["report:audit"],
};
export function hasPermission(role: Role, permission: Permission) { return grants[role].includes(permission); }
