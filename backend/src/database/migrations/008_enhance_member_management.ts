import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create invitation status enum
  await knex.raw(`
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');
  `);

  // Create team_invitations table for pending invitations
  await knex.schema.createTable('team_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.string('email').notNullable();
    table.specificType('role', 'team_member_role').notNullable().defaultTo('member');
    table.uuid('invited_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('status', 'invitation_status').notNullable().defaultTo('pending');
    table.string('token').notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('accepted_at');
    table.timestamp('declined_at');
    table.timestamp('cancelled_at');
    table.text('message'); // Optional invitation message
    table.timestamps(true, true);
    
    // Indexes
    table.index(['team_id']);
    table.index(['email']);
    table.index(['token']);
    table.index(['status']);
    table.index(['expires_at']);
    
    // Unique constraint - one pending invitation per email per team
    table.unique(['team_id', 'email', 'status']);
  });

  // Add activity tracking to team_members
  await knex.schema.alterTable('team_members', (table) => {
    table.timestamp('last_active_at');
    table.integer('total_prds_created').defaultTo(0);
    table.integer('total_prds_edited').defaultTo(0);
    table.integer('total_comments').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('deactivated_at');
    table.uuid('deactivated_by').references('id').inTable('users');
  });

  // Create member_activity_logs table for detailed activity tracking
  await knex.schema.createTable('member_activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable(); // 'joined', 'role_changed', 'prd_created', 'prd_edited', 'commented', etc.
    table.json('metadata'); // Additional data about the action
    table.uuid('target_resource_id'); // ID of the resource (PRD, comment, etc.)
    table.string('target_resource_type'); // 'prd', 'comment', 'team', etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['team_id']);
    table.index(['user_id']);
    table.index(['action']);
    table.index(['created_at']);
    table.index(['team_id', 'user_id']);
  });

  // Create role_change_history table
  await knex.schema.createTable('role_change_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('old_role', 'team_member_role');
    table.specificType('new_role', 'team_member_role').notNullable();
    table.uuid('changed_by').notNullable().references('id').inTable('users');
    table.text('reason'); // Optional reason for role change
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['team_id']);
    table.index(['user_id']);
    table.index(['changed_by']);
    table.index(['changed_at']);
  });

  // Add triggers for updated_at
  await knex.raw(`
    CREATE TRIGGER update_team_invitations_updated_at 
    BEFORE UPDATE ON team_invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create function to automatically log member activities
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_member_activity()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Log role changes
      IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
        INSERT INTO member_activity_logs (team_id, user_id, action, metadata)
        VALUES (NEW.team_id, NEW.user_id, 'role_changed', 
                json_build_object('old_role', OLD.role, 'new_role', NEW.role));
        
        INSERT INTO role_change_history (team_id, user_id, old_role, new_role, changed_by)
        VALUES (NEW.team_id, NEW.user_id, OLD.role, NEW.role, 
                COALESCE(current_setting('app.current_user_id', true)::uuid, NEW.user_id));
      END IF;
      
      -- Log member joining
      IF TG_OP = 'INSERT' THEN
        INSERT INTO member_activity_logs (team_id, user_id, action, metadata)
        VALUES (NEW.team_id, NEW.user_id, 'joined', 
                json_build_object('role', NEW.role, 'invited_by', NEW.invited_by));
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger for member activity logging
  await knex.raw(`
    CREATE TRIGGER team_member_activity_trigger
    AFTER INSERT OR UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_member_activity();
  `);

  // Create function to update last_active_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_member_last_active()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE team_members 
      SET last_active_at = NOW()
      WHERE team_id = NEW.team_id AND user_id = NEW.user_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to update last_active_at when member creates activity
  await knex.raw(`
    CREATE TRIGGER update_member_last_active_trigger
    AFTER INSERT ON member_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_member_last_active();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_member_last_active_trigger ON member_activity_logs');
  await knex.raw('DROP TRIGGER IF EXISTS team_member_activity_trigger ON team_members');
  await knex.raw('DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations');
  
  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS update_member_last_active()');
  await knex.raw('DROP FUNCTION IF EXISTS log_member_activity()');
  
  // Drop tables
  await knex.schema.dropTableIfExists('role_change_history');
  await knex.schema.dropTableIfExists('member_activity_logs');
  await knex.schema.dropTableIfExists('team_invitations');
  
  // Remove columns from team_members
  await knex.schema.alterTable('team_members', (table) => {
    table.dropColumn('last_active_at');
    table.dropColumn('total_prds_created');
    table.dropColumn('total_prds_edited');
    table.dropColumn('total_comments');
    table.dropColumn('is_active');
    table.dropColumn('deactivated_at');
    table.dropColumn('deactivated_by');
  });
  
  // Drop enums
  await knex.raw('DROP TYPE IF EXISTS invitation_status');
}