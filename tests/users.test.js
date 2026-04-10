/**
 * Tests for user management routes: GET/POST /api/users, PUT/DELETE /api/users/:id
 */

const request = require('supertest');

// --- Mocks ---

jest.mock('../src/config/database', () => ({
  define: jest.fn(),
  sync: jest.fn().mockResolvedValue(true),
  authenticate: jest.fn().mockResolvedValue(true),
}));

const mockAdminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@authkit.dev',
  role: 'admin',
  active: true,
  update: jest.fn().mockResolvedValue(true),
  toSafeJSON: jest.fn().mockReturnValue({
    id: 1, username: 'admin', email: 'admin@authkit.dev', role: 'admin',
  }),
};

const mockRegularUser = {
  id: 2,
  username: 'operator',
  email: 'operator@authkit.dev',
  role: 'operario',
  active: true,
  update: jest.fn().mockResolvedValue(true),
  toSafeJSON: jest.fn().mockReturnValue({
    id: 2, username: 'operator', email: 'operator@authkit.dev', role: 'operario',
  }),
};

jest.mock('../src/models', () => ({
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
  AuditLog: {
    create: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { User } = require('../src/models');
const jwt = require('jsonwebtoken');

const app = require('../src/index');

// Helper to generate a token for a given user object
function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: '15m' }
  );
}

// -----------------------------------------------

describe('GET /api/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    User.findByPk.mockResolvedValue(mockRegularUser);
    const token = makeToken(mockRegularUser);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 with paginated users for admin', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    User.findAndCountAll.mockResolvedValue({ rows: [mockAdminUser], count: 1 });
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('returns 400 for invalid pagination params', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .get('/api/users?page=abc&limit=999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new@example.com' }); // missing username, password, first_name, last_name

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('returns 400 for invalid email', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'newuser',
        email: 'not-an-email',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })])
    );
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'short',
        first_name: 'John',
        last_name: 'Doe',
      });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'password' })])
    );
  });

  it('returns 409 when user already exists', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    User.findOne.mockResolvedValue(mockRegularUser); // duplicate
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'existing',
        email: 'existing@example.com',
        password: 'validpass123',
        first_name: 'John',
        last_name: 'Doe',
      });

    expect(res.status).toBe(409);
  });

  it('returns 201 when user is created successfully', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    User.findOne.mockResolvedValue(null); // no duplicate
    User.create.mockResolvedValue(mockRegularUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'validpass123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'operario',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('id');
  });
});

describe('PUT /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid id param', async () => {
    User.findByPk.mockResolvedValue(mockAdminUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .put('/api/users/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Updated' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when user does not exist', async () => {
    User.findByPk
      .mockResolvedValueOnce(mockAdminUser)  // authenticate middleware
      .mockResolvedValueOnce(null);           // controller lookup
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .put('/api/users/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('returns 200 on successful update', async () => {
    User.findByPk
      .mockResolvedValueOnce(mockAdminUser)
      .mockResolvedValueOnce(mockRegularUser);
    User.findOne.mockResolvedValue(null); // no conflict
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Updated' });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when user does not exist', async () => {
    User.findByPk
      .mockResolvedValueOnce(mockAdminUser)
      .mockResolvedValueOnce(null);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 200 and soft-deletes (deactivates) user', async () => {
    User.findByPk
      .mockResolvedValueOnce(mockAdminUser)
      .mockResolvedValueOnce(mockRegularUser);
    const token = makeToken(mockAdminUser);

    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockRegularUser.update).toHaveBeenCalledWith({ active: false });
    expect(res.body.message).toMatch(/desactivado/i);
  });
});
