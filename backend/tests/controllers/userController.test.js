import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import sinon from 'sinon';

import {
  loginUser,
  registerUser
} from '../../controllers/userController.js';

import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

app.use(express.json());

app.post('/api/users/login', loginUser);
app.post('/api/users/register', registerUser);

describe('User Controller Unit Tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/users/register', () => {

    it('should register a user successfully', async () => {

      const user = {
        _id: '60d0fe4f5311236168a109ca',
        name: 'Maira',
        email: 'maira@test.com',
        password: '123456'
      };

      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').resolves(user);
      sinon.stub(jwt, 'sign').returns('test-token');

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Maira',
          email: 'maira@test.com',
          password: '123456'
        });

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal('Maira');
      expect(response.body.email).to.equal('maira@test.com');
      expect(response.body.token).to.equal('test-token');
      
      // NEW: Assert that the database received all required registration fields
      sinon.assert.calledWith(User.create, sinon.match({
        name: 'Maira',
        email: 'maira@test.com',
        password: '123456'
      }));
    });

    it('should return 400 if a field is missing', async () => {

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Maira',
          email: 'maira@test.com'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message)
        .to.equal('Please fill all fields');
    });

    it('should return 400 if email already exists', async () => {

      const user = {
        _id: '123',
        name: 'Existing User',
        email: 'maira@test.com'
      };

      sinon.stub(User, 'findOne').resolves(user);

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Maira',
          email: 'maira@test.com',
          password: '123456'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message)
        .to.equal('User already exists');
    });

    it('should return 500 if registration fails', async () => {

      sinon.stub(User, 'findOne')
        .rejects(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Maira',
          email: 'maira@test.com',
          password: '123456'
        });

      expect(response.status).to.equal(500);
      expect(response.body.message)
        .to.equal('Something went wrong');
    });

  });

  describe('POST /api/users/login', () => {

    it('should login successfully', async () => {

      const user = {
        _id: '60d0fe4f5311236168a109ca',
        name: 'Maira',
        email: 'maira@test.com',
        password: 'hashed-password'
      };

      const select = sinon.stub().resolves(user);

      sinon.stub(User, 'findOne').returns({
        select
      });

      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('test-token');

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'maira@test.com',
          password: '123456'
        });

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal('Maira');
      expect(response.body.email).to.equal('maira@test.com');
      expect(response.body.token).to.equal('test-token');
      
      // NEW: Assert that the password field was explicitly requested from the DB
      sinon.assert.calledWith(select, '+password');
      
      // NEW: Assert that bcrypt was given the correct raw vs hashed password to compare
      sinon.assert.calledWith(bcrypt.compare, '123456', 'hashed-password');
    });

    it('should return 400 if email or password is missing', async () => {

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).to.equal(400);
      expect(response.body.message)
        .to.equal('Please enter email and password');
    });

    it('should return 401 for an unregistered email', async () => {

      sinon.stub(User, 'findOne').returns({
        select: sinon.stub().resolves(null)
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });

      expect(response.status).to.equal(401);
      expect(response.body.message)
        .to.equal('Invalid email or password');
    });

    it('should return 401 for a wrong password', async () => {

      const user = {
        _id: '60d0fe4f5311236168a109ca',
        name: 'Maira',
        email: 'maira@test.com',
        password: 'hashed-password'
      };

      sinon.stub(User, 'findOne').returns({
        select: sinon.stub().resolves(user)
      });

      sinon.stub(bcrypt, 'compare').resolves(false);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'maira@test.com',
          password: 'wrong-password'
        });

      expect(response.status).to.equal(401);
      expect(response.body.message)
        .to.equal('Invalid email or password');
    });

    it('should return 500 if login fails', async () => {

      sinon.stub(User, 'findOne')
        .throws(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'maira@test.com',
          password: '123456'
        });

      expect(response.status).to.equal(500);
      expect(response.body.message)
        .to.equal('Something went wrong');
    });

  });

});