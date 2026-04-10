/**
 * Tests for authentication routes: POST /api/auth/login, /refresh, /logout, GET /me
 */

const request = require('supertest');

// --- Mocks (must come before requiring app) ---

jest.mock('../src/config/database', () => ({
  define: jest.fn(),
  sync: jest.fn().mockResolvedValue(true),
  authenticate: jest.fn().mockResolvedValue(true),
}));

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  active: true,
  refresh_token: 'valid-refresh-token',
  validatePassword: jest.fn(),
  update: jest.fn().mockResolvedValue(true),
  toSafeJSON: jest.fn().mockReturnValue({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    active: true,
  }),
};

jest.mock('../src/models', () => ({
  sequelize: {
    sync: jest.fn().mockResolvedValue(true),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  AuditLog: {
    create: jest.fn().mockResolvedValue(true),
  },
}));

// Suppress Winston output during tests
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { User, AuditLog } = require('../src/models');
const jwt = require('jsonwebtoken');

// Load app after mocks
const app = require('../src/index');

// -----------------------------------------------

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'secret' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'username' })])
    );
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'password' })])
    );
  });

  it('returns 401 when user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('returns 401 when password is wrong', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, validatePassword: jest.fn().mockResolvedValue(false) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('returns 403 when account is inactive', async () => {
    User.findOne.mockResolvedValue({
      ...mockUser,
      active: false,
      validatePassword: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'demo1234' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/desactivada/);
  });

  it('returns 200 with tokens on successful login', async () => {
    User.findOne.mockResolvedValue({
      ...mockUser,
      validatePassword: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'demo1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN', entity: 'auth' })
    );
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'refreshToken' })])
    );
  });

  it('returns 401 when refreshToken is invalid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-valid-jwt' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when token does not match stored token', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret', { expiresIn: '7d' });
    User.findByPk.mockResolvedValue({ ...mockUser, refresh_token: 'different-token' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
  });

  it('returns 200 with new tokens on valid refresh', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret', { expiresIn: '7d' });
    User.findByPk.mockResolvedValue({ ...mockUser, refresh_token: token });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 with user data when authenticated', async () => {
    const token = jwt.sign(
      { id: 1, username: 'testuser', role: 'admin' },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '15m' }
    );
    User.findByPk.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('returns 200 and clears refresh token on valid logout', async () => {
    const token = jwt.sign(
      { id: 1, username: 'testuser', role: 'admin' },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '15m' }
    );
    User.findByPk.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockUser.update).toHaveBeenCalledWith({ refresh_token: null });
  });
});
