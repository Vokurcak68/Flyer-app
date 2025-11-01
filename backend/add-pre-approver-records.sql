-- Add approval records for pre-approvers for existing pending flyers

-- This script will:
-- 1. Find all flyers in pending_approval status
-- 2. Find all users with pre_approver role
-- 3. Create approval records for each pre-approver for each pending flyer

INSERT INTO approvals (id, flyer_id, approver_id, status, pre_approval_status, created_at)
SELECT
  gen_random_uuid() as id,
  f.id as flyer_id,
  u.id as approver_id,
  'pending'::"ApprovalStatus" as status,
  'pending'::"PreApprovalStatus" as pre_approval_status,
  NOW() as created_at
FROM
  flyers f
  CROSS JOIN users u
WHERE
  f.status = 'pending_approval'
  AND u.role = 'pre_approver'
  AND NOT EXISTS (
    -- Only insert if approval doesn't already exist
    SELECT 1 FROM approvals a
    WHERE a.flyer_id = f.id
    AND a.approver_id = u.id
  );

-- Show results
SELECT
  f.name as flyer_name,
  u.email as pre_approver_email,
  a.status,
  a.pre_approval_status,
  a.created_at
FROM
  approvals a
  JOIN flyers f ON a.flyer_id = f.id
  JOIN users u ON a.approver_id = u.id
WHERE
  u.role = 'pre_approver'
ORDER BY
  a.created_at DESC;
