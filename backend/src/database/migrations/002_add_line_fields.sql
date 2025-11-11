-- Add LINE-related fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS line_picture_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP;

-- Create index on line_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_line_id_not_null ON users(line_id) WHERE line_id IS NOT NULL;

-- Create table for managing invitation tokens
CREATE TABLE IF NOT EXISTS user_invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(1000) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_line_id VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent multiple active tokens per user
  CONSTRAINT one_active_token_per_user UNIQUE (user_id, used_at) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for invite tokens
CREATE INDEX IF NOT EXISTS idx_invite_tokens_user_id ON user_invite_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON user_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires ON user_invite_tokens(expires_at);

-- Add comment for documentation
COMMENT ON TABLE user_invite_tokens IS 'Stores account linking invitation tokens for worker onboarding via LINE';
COMMENT ON COLUMN users.line_display_name IS 'Display name from LINE profile';
COMMENT ON COLUMN users.line_picture_url IS 'Profile picture URL from LINE';
COMMENT ON COLUMN users.linked_at IS 'Timestamp when LINE account was linked';
