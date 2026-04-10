/**
 * Tests for middleware: auth, roles, validate
 */

const jwt = require('jsonwebtoken');
const httpMocks = require('node-mocks-http');

// Suppress logger output
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockUser = {
  id: 1,
  username: 'testuser',
  role: 'admin',
  active: true,
};

jest.mock('../src/models', () => ({
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
  User: { findByPk: jest.fn() },
  AuditLog: { create: jest.fn() },
}));

jest.mock('../src/config/database', () => ({
  define: jest.fn(),
  sync: jest.fn().mockResolvedValue(true),
}));

// Mock express-validator so validationResult is writable in tests
const mockValidationResult = jest.fn();
jest.mock('express-validator', () => {
  const actual = jest.requireActual('express-validator');
  return {
    ...actual,
    validationResult: (...args) => mockValidationResult(...args),
  };
});

const { User } = require('../src/models');
const authenticate = require('../src/middleware/auth');
const authorize = require('../src/middleware/roles');
const validate = require('../src/middleware/validate');

// -----------------------------------------------

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token does not start with Bearer', async () => {
    req.headers.authorization = 'Basic abc123';
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when JWT is invalid', async () => {
    req.headers.authorization = 'Bearer invalid.token.here';
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with TOKEN_EXPIRED code when JWT is expired', async () => {
    const token = jwt.sign(
      { id: 1 },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: -1 }
    );
    req.headers.authorization = `Bearer ${token}`;
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 when user is inactive', async () => {
    const token = jwt.sign(
      { id: 1, username: 'test', role: 'admin' },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    User.findByPk.mockResolvedValue({ ...mockUser, active: false });
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('calls next() and sets req.user when token is valid', async () => {
    const token = jwt.sign(
      { id: 1, username: 'testuser', role: 'admin' },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    User.findByPk.mockResolvedValue(mockUser);
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(mockUser);
  });
});

describe('authorize middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  it('returns 401 when req.user is not set', () => {
    authorize('admin')(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when user role is not in allowed list', () => {
    req.user = { ...mockUser, role: 'operario' };
    authorize('admin', 'supervisor')(req, res, next);
    expect(res.statusCode).toBe(403);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('required');
    expect(data).toHaveProperty('current');
  });

  it('calls next() when user role is allowed', () => {
    req.user = { ...mockUser, role: 'supervisor' };
    authorize('admin', 'supervisor')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('validate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() when there are no validation errors', () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });
    validate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200); // untouched
  });

  it('returns 400 with details when there are validation errors', () => {
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'email', msg: 'Email inválido' }],
    });

    validate(req, res, next);
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('details');
    expect(data.details[0]).toMatchObject({ field: 'email', message: 'Email inválido' });
    expect(next).not.toHaveBeenCalled();
  });
});
