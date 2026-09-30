-- Development-only fictional seed data. Do not use operational identities.
INSERT INTO roles (id, code, name, created_at, updated_at) VALUES
  ('role-admin', 'ADMIN', 'Administrator', 1789380000000, 1789380000000),
  ('role-supervisor', 'SUPERVISOR', 'Supervisor', 1789380000000, 1789380000000),
  ('role-entry', 'DATA_ENTRY', 'Data Entry', 1789380000000, 1789380000000);
INSERT INTO airports (id, code, name, active, created_at, updated_at) VALUES
  ('airport-demo', 'DEMO', 'Demonstration Airport', 1, 1789380000000, 1789380000000);
INSERT INTO units (id, airport_id, name, created_at, updated_at) VALUES
  ('unit-operations', 'airport-demo', 'Operations', 1789380000000, 1789380000000),
  ('unit-security', 'airport-demo', 'Security', 1789380000000, 1789380000000);
INSERT INTO users (id, email, display_name, role_id, airport_id, active, created_at, updated_at) VALUES
  ('local_seedy', 'seedy@sites.test', 'Demo Administrator', 'role-admin', 'airport-demo', 1, 1789380000000, 1789380000000),
  ('demo-supervisor', 'supervisor@example.local', 'Demo Supervisor', 'role-supervisor', 'airport-demo', 1, 1789380000000, 1789380000000),
  ('demo-entry', 'entry@example.local', 'Demo Data Entry', 'role-entry', 'airport-demo', 1, 1789380000000, 1789380000000);
INSERT INTO report_types (id, code, name, active, created_at, updated_at) VALUES
  ('type-snap', 'SNAP_CHECKING', 'Snap Checking', 1, 1789380000000, 1789380000000),
  ('type-ammo', 'AMMUNITION_RECOVERY', 'Ammunition Recovery', 1, 1789380000000, 1789380000000),
  ('type-medical', 'MEDICAL_CASE', 'Medical Case', 1, 1789380000000, 1789380000000),
  ('type-maintenance', 'MAINTENANCE', 'Maintenance', 1, 1789380000000, 1789380000000),
  ('type-other', 'OTHER', 'Other / General Activity', 1, 1789380000000, 1789380000000);

-- Dynamic form fields per report type, ordered for display.
INSERT INTO form_fields (id, report_type_id, field_key, label, type, required, options, sort_order, created_at, updated_at) VALUES
  ('field-snap-1', 'type-snap', 'duty_shift', 'Duty / shift', 'text', 1, NULL, 1, 1789380000000, 1789380000000),
  ('field-snap-2', 'type-snap', 'time', 'Time', 'text', 1, NULL, 2, 1789380000000, 1789380000000),
  ('field-snap-3', 'type-snap', 'locations', 'Locations', 'text', 1, NULL, 3, 1789380000000, 1789380000000),
  ('field-snap-4', 'type-snap', 'vehicles_checked', 'Vehicles checked', 'text', 1, NULL, 4, 1789380000000, 1789380000000),
  ('field-snap-5', 'type-snap', 'result', 'Result', 'text', 1, NULL, 5, 1789380000000, 1789380000000),

  ('field-ammo-1', 'type-ammo', 'passenger_name', 'Passenger name', 'text', 1, NULL, 1, 1789380000000, 1789380000000),
  ('field-ammo-2', 'type-ammo', 'flight_number', 'Flight number', 'text', 1, NULL, 2, 1789380000000, 1789380000000),
  ('field-ammo-3', 'type-ammo', 'location', 'Location', 'text', 1, NULL, 3, 1789380000000, 1789380000000),
  ('field-ammo-4', 'type-ammo', 'recovery', 'Recovery', 'text', 1, NULL, 4, 1789380000000, 1789380000000),
  ('field-ammo-5', 'type-ammo', 'disposal', 'Disposal', 'text', 1, NULL, 5, 1789380000000, 1789380000000),

  ('field-medical-1', 'type-medical', 'patient_name', 'Patient name', 'text', 1, NULL, 1, 1789380000000, 1789380000000),
  ('field-medical-2', 'type-medical', 'flight_number', 'Flight number', 'text', 1, NULL, 2, 1789380000000, 1789380000000),
  ('field-medical-3', 'type-medical', 'arrival_time', 'Arrival time', 'text', 1, NULL, 3, 1789380000000, 1789380000000),
  ('field-medical-4', 'type-medical', 'medical_condition', 'Medical condition', 'text', 1, NULL, 4, 1789380000000, 1789380000000),
  ('field-medical-5', 'type-medical', 'movement_handover', 'Movement / handover', 'text', 1, NULL, 5, 1789380000000, 1789380000000),

  ('field-maint-1', 'type-maintenance', 'activity', 'Activity', 'text', 1, NULL, 1, 1789380000000, 1789380000000),
  ('field-maint-2', 'type-maintenance', 'location', 'Location', 'text', 1, NULL, 2, 1789380000000, 1789380000000),
  ('field-maint-3', 'type-maintenance', 'equipment', 'Equipment', 'text', 1, NULL, 3, 1789380000000, 1789380000000),
  ('field-maint-4', 'type-maintenance', 'time', 'Time', 'text', 1, NULL, 4, 1789380000000, 1789380000000),
  ('field-maint-5', 'type-maintenance', 'outcome', 'Outcome', 'text', 1, NULL, 5, 1789380000000, 1789380000000),

  ('field-other-1', 'type-other', 'custom_subject', 'Subject', 'text', 1, NULL, 1, 1789380000000, 1789380000000);

-- One active, version-1 template per report type. {{field_key}} tokens are
-- filled from structured_data; {{details}} is an auto-built bullet list.
INSERT INTO report_templates (id, report_type_id, version, subject_pattern, template_body, required_fields, validation_rules, status, created_at, updated_at) VALUES
  ('template-snap', 'type-snap', 1, 'Snap Checking of Landside Areas',
   'ASF {{airport}}' || char(10) || char(10) || 'Assalam-O-Alaikum Sir,' || char(10) || char(10) || 'Sub: {{subject}}' || char(10) || char(10) || 'Dated: {{date}}' || char(10) || char(10) || '◼️ Details:' || char(10) || '{{details}}' || char(10) || char(10) || 'FIP',
   '["duty_shift","time","locations","vehicles_checked","result"]', NULL, 'active', 1789380000000, 1789380000000),
  ('template-ammo', 'type-ammo', 1, 'Recovery of Ammunition by ASF',
   'ASF {{airport}}' || char(10) || char(10) || 'Assalam-O-Alaikum Sir,' || char(10) || char(10) || 'Sub: {{subject}}' || char(10) || char(10) || 'Dated: {{date}}' || char(10) || char(10) || '◼️ Details:' || char(10) || '{{details}}' || char(10) || char(10) || 'FIP',
   '["passenger_name","flight_number","location","recovery","disposal"]', NULL, 'active', 1789380000000, 1789380000000),
  ('template-medical', 'type-medical', 1, 'Arrival of Patient on Stretcher',
   'ASF {{airport}}' || char(10) || char(10) || 'Assalam-O-Alaikum Sir,' || char(10) || char(10) || 'Sub: {{subject}}' || char(10) || char(10) || 'Dated: {{date}}' || char(10) || char(10) || '◼️ Details:' || char(10) || '{{details}}' || char(10) || char(10) || 'FIP',
   '["patient_name","flight_number","arrival_time","medical_condition","movement_handover"]', NULL, 'active', 1789380000000, 1789380000000),
  ('template-maintenance', 'type-maintenance', 1, 'Maintenance and Cleanliness Activities',
   'ASF {{airport}}' || char(10) || char(10) || 'Assalam-O-Alaikum Sir,' || char(10) || char(10) || 'Sub: {{subject}}' || char(10) || char(10) || 'Dated: {{date}}' || char(10) || char(10) || '◼️ Details:' || char(10) || '{{details}}' || char(10) || char(10) || 'FIP',
   '["activity","location","equipment","time","outcome"]', NULL, 'active', 1789380000000, 1789380000000),
  -- subject_pattern is a fallback only: the generator always prefers the
  -- custom_subject field's value for this type (lib/ai/report-service.ts).
  ('template-other', 'type-other', 1, 'General Activity',
   'ASF {{airport}}' || char(10) || char(10) || 'Assalam-O-Alaikum Sir,' || char(10) || char(10) || 'Sub: {{subject}}' || char(10) || char(10) || 'Dated: {{date}}' || char(10) || char(10) || '◼️ Details:' || char(10) || '{{details}}' || char(10) || char(10) || 'FIP',
   '["custom_subject"]', NULL, 'active', 1789380000000, 1789380000000);
