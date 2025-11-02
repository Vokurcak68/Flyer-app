-- Find draft flyers named "Nový leták"
SELECT
  id,
  name,
  status,
  is_draft as "isDraft",
  supplier_id,
  created_at,
  updated_at,
  rejection_reason
FROM flyers
WHERE name = 'Nový leták'
  AND status = 'draft'
ORDER BY created_at DESC;

-- Fix the flyers to be editable by setting isDraft to true
UPDATE flyers
SET
  is_draft = true,
  rejection_reason = NULL
WHERE
  name = 'Nový leták'
  AND status = 'draft';

-- Verify the update
SELECT
  id,
  name,
  status,
  is_draft as "isDraft",
  supplier_id,
  created_at,
  updated_at,
  rejection_reason
FROM flyers
WHERE name = 'Nový leták'
  AND status = 'draft'
ORDER BY created_at DESC;
