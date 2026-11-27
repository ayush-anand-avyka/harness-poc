const request = require('supertest');
const { app, server } = require('../index');

afterAll(() => server.close());

describe('Health endpoints', () => {
  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /health/ready returns ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  test('GET /health/live returns alive', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.alive).toBe(true);
  });
});

describe('API /items', () => {
  test('GET /api/items returns all items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('GET /api/items?category=alpha filters correctly', async () => {
    const res = await request(app).get('/api/items?category=alpha');
    expect(res.status).toBe(200);
    res.body.data.forEach(item => expect(item.category).toBe('alpha'));
  });

  test('GET /api/items/:id returns single item', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('GET /api/items/:id returns 404 for missing', async () => {
    const res = await request(app).get('/api/items/9999');
    expect(res.status).toBe(404);
  });

  test('POST /api/items creates item', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Test Item', category: 'gamma' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Item');
  });

  test('POST /api/items returns 400 when body incomplete', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Only name' });
    expect(res.status).toBe(400);
  });
});

describe('UI static routes', () => {
  test('GET / serves the POC dashboard HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Cloud-Native POC Dashboard');
  });
});

describe('API /info', () => {
  test('GET /api/info returns app metadata', async () => {
    const res = await request(app).get('/api/info');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('app');
    expect(res.body).toHaveProperty('version');
  });
});
