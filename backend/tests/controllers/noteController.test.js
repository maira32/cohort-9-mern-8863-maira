import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import sinon from 'sinon';

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} from '../../controllers/noteController.js';

import Note from '../../models/Note.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  req.user = { id: '60d0fe4f5311236168a109ca' };
  next();
});

app.get('/api/notes', getNotes);
app.post('/api/notes', createNote);
app.put('/api/notes/:id', updateNote);
app.delete('/api/notes/:id', deleteNote);

describe('Note Controller Unit Tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/notes', () => {
    it('should get notes for logged in user', async () => {
      const notes = [{ title: 'Test Note', content: 'Test content' }];
      sinon.stub(Note, 'find').resolves(notes);

      const response = await request(app).get('/api/notes');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0].title).to.equal('Test Note');
      
      sinon.assert.calledWith(Note.find, { user: '60d0fe4f5311236168a109ca' });
    });

    it('should return 500 if notes cannot be fetched', async () => {
      sinon.stub(Note, 'find').rejects(new Error('Database error'));
      const response = await request(app).get('/api/notes');
      expect(response.status).to.equal(500);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a note successfully', async () => {
      const note = {
        _id: '123',
        title: 'New Note',
        content: 'This is a new note',
        user: '60d0fe4f5311236168a109ca'
      };
      sinon.stub(Note, 'create').resolves(note);

      const response = await request(app)
        .post('/api/notes')
        .send({ title: 'New Note', content: 'This is a new note' });

      expect(response.status).to.equal(201);
      expect(response.body.title).to.equal('New Note');
      
      sinon.assert.calledWith(Note.create, {
        title: 'New Note',
        content: 'This is a new note',
        user: '60d0fe4f5311236168a109ca'
      });
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app).post('/api/notes').send({ content: 'I forgot the title' });
      expect(response.status).to.equal(400);
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app).post('/api/notes').send({ title: 'Test Note' });
      expect(response.status).to.equal(400);
    });

    it('should return 400 for invalid note parameters', async () => {
      const error = new Error('Invalid note');
      error.name = 'ValidationError';
      sinon.stub(Note, 'create').rejects(error);
      const response = await request(app).post('/api/notes').send({ title: 'Test Note', content: 'Test content' });
      expect(response.status).to.equal(400);
    });

    it('should return 500 if note creation fails', async () => {
      sinon.stub(Note, 'create').rejects(new Error('Database error'));
      const response = await request(app).post('/api/notes').send({ title: 'Test Note', content: 'Test content' });
      expect(response.status).to.equal(500);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note successfully', async () => {
      const updatedNote = {
        _id: '123',
        title: 'Updated Note',
        content: 'Updated content',
        user: '60d0fe4f5311236168a109ca'
      };
      sinon.stub(Note, 'findOneAndUpdate').resolves(updatedNote);

      const response = await request(app)
        .put('/api/notes/123')
        .send({ title: 'Updated Note', content: 'Updated content' });

      expect(response.status).to.equal(200);
      
      sinon.assert.calledWith(
        Note.findOneAndUpdate,
        { _id: '123', user: '60d0fe4f5311236168a109ca' },
        { 
          $set: { 
            title: 'Updated Note', 
            content: 'Updated content' 
          } 
        },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if note is not found', async () => {
      sinon.stub(Note, 'findOneAndUpdate').resolves(null);
      const response = await request(app).put('/api/notes/123').send({ title: 'Updated Note', content: 'Updated content' });
      expect(response.status).to.equal(404);
    });

    it('should return 400 for an invalid note id', async () => {
      const error = new Error('Invalid ID');
      error.name = 'CastError';
      sinon.stub(Note, 'findOneAndUpdate').rejects(error);
      const response = await request(app).put('/api/notes/invalid-id').send({ title: 'Updated Note', content: 'Updated content' });
      expect(response.status).to.equal(400);
    });

    it('should return 500 if update fails', async () => {
      sinon.stub(Note, 'findOneAndUpdate').rejects(new Error('Database error'));
      const response = await request(app).put('/api/notes/123').send({ title: 'Updated Note', content: 'Updated content' });
      expect(response.status).to.equal(500);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note successfully', async () => {
      const note = {
        _id: '123',
        title: 'Test Note',
        content: 'Test content',
        user: { toString: () => '60d0fe4f5311236168a109ca' },
        deleteOne: sinon.stub().resolves()
      };
      sinon.stub(Note, 'findById').resolves(note);

      const response = await request(app).delete('/api/notes/123');

      expect(response.status).to.equal(200);
      
      sinon.assert.calledOnce(note.deleteOne);
    });

    it('should return 404 if note does not exist', async () => {
      sinon.stub(Note, 'findById').resolves(null);
      const response = await request(app).delete('/api/notes/123');
      expect(response.status).to.equal(404);
    });

    it('should return 404 if user is not the owner of the note', async () => {
      const note = { _id: '123', user: { toString: () => 'different-user-id' } };
      sinon.stub(Note, 'findById').resolves(note);
      const response = await request(app).delete('/api/notes/123');
      expect(response.status).to.equal(404);
    });

    it('should return 400 for an invalid note id', async () => {
      const error = new Error('Invalid ID');
      error.name = 'CastError';
      sinon.stub(Note, 'findById').rejects(error);
      const response = await request(app).delete('/api/notes/invalid-id');
      expect(response.status).to.equal(400);
    });

    it('should return 500 if delete fails', async () => {
      sinon.stub(Note, 'findById').rejects(new Error('Database error'));
      const response = await request(app).delete('/api/notes/123');
      expect(response.status).to.equal(500);
    });
  });
});