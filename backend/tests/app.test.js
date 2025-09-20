const supertest = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
    it('Should get api response', async () => {
        const res = await supertest(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Team collab platform API is running' });
    })
})