export const PERMISSIONS = {
  ADD_RESOURCES: "add_resources",
  ADD_MODULES: "add_modules", 
  ADD_STUDENTS: "add_students",
  ADD_ADMINS: "add_admins",
  ADD_MENTORS: "add_mentors",
} as const;

export const PERMISSION_LABELS = {
  [PERMISSIONS.ADD_RESOURCES]: "Add Resources",
  [PERMISSIONS.ADD_MODULES]: "Add Modules",
  [PERMISSIONS.ADD_STUDENTS]: "Add Students", 
  [PERMISSIONS.ADD_ADMINS]: "Add Admins",
  [PERMISSIONS.ADD_MENTORS]: "Add Mentors",
} as const;

export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.ADD_RESOURCES]: "Allow adding and managing educational resources",
  [PERMISSIONS.ADD_MODULES]: "Allow creating and managing learning modules",
  [PERMISSIONS.ADD_STUDENTS]: "Allow adding and managing students",
  [PERMISSIONS.ADD_ADMINS]: "Allow adding and managing school administrators",
  [PERMISSIONS.ADD_MENTORS]: "Allow adding and managing mentors",
} as const;
