/**
 * AuthKit Express — Demo Seed
 * ===========================
 * Populates the database with realistic demo data to showcase all features:
 * - Multiple users across all roles
 * - Company settings with branding
 * - A rich audit log showing real system activity
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Demo credentials after seeding:
 *   admin@authkit.dev       / demo1234  (admin)
 *   supervisor@authkit.dev  / demo1234  (supervisor)
 *   operator@authkit.dev    / demo1234  (operator)
 *   accountant@authkit.dev  / demo1234  (accountant)
 */

require('dotenv').config();
const { sequelize, User, AuditLog, CompanySettings } = require('../src/models');

// ─── Helpers ────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

// ─── Data ────────────────────────────────────────────────────────────────────

const USERS = [
  {
    username: 'admin',
    email: 'admin@authkit.dev',
    password: 'demo1234',
    first_name: 'Alex',
    last_name: 'Morgan',
    role: 'admin',
    area: 'Management',
    active: true,
  },
  {
    username: 'supervisor',
    email: 'supervisor@authkit.dev',
    password: 'demo1234',
    first_name: 'Jordan',
    last_name: 'Rivera',
    role: 'supervisor',
    area: 'Operations',
    active: true,
  },
  {
    username: 'operator',
    email: 'operator@authkit.dev',
    password: 'demo1234',
    first_name: 'Sam',
    last_name: 'Chen',
    role: 'operario',
    area: 'Production',
    active: true,
  },
  {
    username: 'accountant',
    email: 'accountant@authkit.dev',
    password: 'demo1234',
    first_name: 'Taylor',
    last_name: 'Brooks',
    role: 'contador',
    area: 'Finance',
    active: true,
  },
  {
    username: 'supervisor2',
    email: 'supervisor2@authkit.dev',
    password: 'demo1234',
    first_name: 'Casey',
    last_name: 'Nguyen',
    role: 'supervisor',
    area: 'Logistics',
    active: true,
  },
  {
    username: 'operator2',
    email: 'operator2@authkit.dev',
    password: 'demo1234',
    first_name: 'Riley',
    last_name: 'Patel',
    role: 'operario',
    area: 'Maintenance',
    active: false, // inactive user to demo the active flag
  },
];

const COMPANY_SETTINGS = {
  company_name: 'AuthKit Demo Co.',
  primary_color: '#6366F1',
  secondary_color: '#4F46E5',
  accent_color: '#10B981',
  dark_mode: false,
  sectors: ['Engineering', 'Operations', 'Finance', 'Logistics', 'HR'],
};

// Generates a realistic audit log that tells a story:
// users were created, updated, logged in/out, settings changed, etc.
const buildAuditLogs = (users) => {
  const admin      = users.find(u => u.username === 'admin');
  const supervisor = users.find(u => u.username === 'supervisor');
  const operator   = users.find(u => u.username === 'operator');
  const accountant = users.find(u => u.username === 'accountant');

  return [
    // ── System bootstrap (5 days ago) ──────────────────────────────────────
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'CompanySettings',
      entity_id: 1,
      details: { method: 'POST', path: '/api/settings', status: 201, note: 'Initial company setup' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(5),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'User',
      entity_id: supervisor.id,
      details: { method: 'POST', path: '/api/users', status: 201, created_role: 'supervisor' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(5),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'User',
      entity_id: operator.id,
      details: { method: 'POST', path: '/api/users', status: 201, created_role: 'operario' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(5),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'User',
      entity_id: accountant.id,
      details: { method: 'POST', path: '/api/users', status: 201, created_role: 'contador' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(5),
    },

    // ── Day 4: first logins and activity ───────────────────────────────────
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: daysAgo(4),
    },
    {
      user_id: operator.id,
      username: operator.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.55',
      createdAt: daysAgo(4),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'UPDATE',
      entity: 'CompanySettings',
      entity_id: 1,
      details: { method: 'PUT', path: '/api/settings', status: 200, changed_fields: ['primary_color', 'company_name'] },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(4),
    },

    // ── Day 3: user management ─────────────────────────────────────────────
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'User',
      entity_id: 5,
      details: { method: 'POST', path: '/api/users', status: 201, created_role: 'supervisor' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(3),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'CREATE',
      entity: 'User',
      entity_id: 6,
      details: { method: 'POST', path: '/api/users', status: 201, created_role: 'operario' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(3),
    },
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: daysAgo(3),
    },
    {
      user_id: accountant.id,
      username: accountant.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.88',
      createdAt: daysAgo(3),
    },
    {
      user_id: accountant.id,
      username: accountant.username,
      action: 'LOGOUT',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/logout', status: 200 },
      ip_address: '10.0.0.88',
      createdAt: daysAgo(3),
    },

    // ── Day 2: user deactivation and role update ───────────────────────────
    {
      user_id: admin.id,
      username: admin.username,
      action: 'UPDATE',
      entity: 'User',
      entity_id: 6,
      details: { method: 'PUT', path: '/api/users/6', status: 200, changed_fields: ['active'], new_value: false },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(2),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'UPDATE',
      entity: 'User',
      entity_id: supervisor.id,
      details: { method: 'PUT', path: `/api/users/${supervisor.id}`, status: 200, changed_fields: ['area'], new_value: 'Operations' },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(2),
    },
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: daysAgo(2),
    },
    {
      user_id: operator.id,
      username: operator.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.55',
      createdAt: daysAgo(2),
    },

    // ── Day 1: normal workday activity ─────────────────────────────────────
    {
      user_id: admin.id,
      username: admin.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(1),
    },
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: daysAgo(1),
    },
    {
      user_id: accountant.id,
      username: accountant.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.88',
      createdAt: daysAgo(1),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'UPDATE',
      entity: 'CompanySettings',
      entity_id: 1,
      details: { method: 'PUT', path: '/api/settings', status: 200, changed_fields: ['sectors'] },
      ip_address: '192.168.1.1',
      createdAt: daysAgo(1),
    },
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGOUT',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/logout', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: hoursAgo(18),
    },

    // ── Today: recent activity ─────────────────────────────────────────────
    {
      user_id: admin.id,
      username: admin.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '192.168.1.1',
      createdAt: hoursAgo(3),
    },
    {
      user_id: supervisor.id,
      username: supervisor.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.42',
      createdAt: hoursAgo(2),
    },
    {
      user_id: operator.id,
      username: operator.username,
      action: 'LOGIN',
      entity: 'Auth',
      entity_id: null,
      details: { method: 'POST', path: '/api/auth/login', status: 200 },
      ip_address: '10.0.0.55',
      createdAt: hoursAgo(1),
    },
    {
      user_id: admin.id,
      username: admin.username,
      action: 'UPDATE',
      entity: 'User',
      entity_id: operator.id,
      details: { method: 'PUT', path: `/api/users/${operator.id}`, status: 200, changed_fields: ['area'], new_value: 'Production' },
      ip_address: '192.168.1.1',
      createdAt: hoursAgo(1),
    },
  ];
};

// ─── Main ────────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced\n');

    // ── Company settings ──────────────────────────────────────────────────
    const settingsExist = await CompanySettings.findOne();
    if (!settingsExist) {
      await CompanySettings.create(COMPANY_SETTINGS);
      console.log('✅ Company settings created');
    } else {
      await settingsExist.update(COMPANY_SETTINGS);
      console.log('✅ Company settings updated');
    }

    // ── Users ─────────────────────────────────────────────────────────────
    console.log('\n👤 Creating users...');
    const createdUsers = [];
    for (const userData of USERS) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });
      if (!created) {
        // Update password and active flag on re-seed so demo always works
        await user.update({ password: userData.password, active: userData.active });
      }
      createdUsers.push(user);
      const status = created ? 'created' : 'updated';
      const activeFlag = userData.active ? '' : ' [inactive]';
      console.log(`  ${status === 'created' ? '✅' : '♻️ '} ${userData.role.padEnd(12)} ${userData.email}${activeFlag}`);
    }

    // ── Audit logs ────────────────────────────────────────────────────────
    console.log('\n📋 Seeding audit logs...');
    const existingCount = await AuditLog.count();
    if (existingCount === 0) {
      const logs = buildAuditLogs(createdUsers);
      await AuditLog.bulkCreate(logs);
      console.log(`  ✅ ${logs.length} audit log entries created`);
    } else {
      console.log(`  ℹ️  Audit logs already exist (${existingCount} entries) — skipping`);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('🌱 Seed complete! Demo credentials:\n');
    console.log('  Role          Email                        Password');
    console.log('  ──────────    ───────────────────────────  ────────');
    console.log('  admin         admin@authkit.dev            demo1234');
    console.log('  supervisor    supervisor@authkit.dev       demo1234');
    console.log('  operator      operator@authkit.dev         demo1234');
    console.log('  accountant    accountant@authkit.dev       demo1234');
    console.log('\n  Note: operator2@authkit.dev is inactive (demo of active flag)');
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seed();
