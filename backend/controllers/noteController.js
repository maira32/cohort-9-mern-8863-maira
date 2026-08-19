import Note from '../models/Note.js';
import logger from '../config/logger.js';

export const getNotes = async (req, res) => {
try {
const notes = await Note.find({ user: req.user.id });
res.status(200).json(notes);
}
catch {
logger.error(`Failed to fetch notes safely`);
res.status(500).json({ message: 'Server error' });
}
};

export const createNote = async (req, res) => {
try {
const { title, content } = req.body;
if (!title || !content) {
logger.warn('Note creation failed: Missing title or content');
return res.status(400).json({ message: 'Please provide both title and content' });
}
const note = await Note.create({
title,
content,
user: req.user.id, });
logger.info('Note created successfully');
res.status(201).json(note);
}
catch (error) {
if (error.name === 'ValidationError' || error.name === 'CastError') {
return res.status(400).json({ message: 'Invalid note parameters' });
}
logger.error('Failed to process note creation due to server exception');
res.status(500).json({ message: 'Server error' });
}
};

export const updateNote = async (req, res) => {
try {
const updatedNote = await Note.findOneAndUpdate(
{ 
    _id: String(req.params.id), 
    user: req.user.id 
},
{
$set: {
title: req.body.title,
content: req.body.content,
},},
{ new: true, runValidators: true }
);
if (!updatedNote) {
logger.warn('Note update failed: Not found or unauthorized');
return res.status(404).json({ message: 'Note not found or not authorized' });
}
res.status(200).json(updatedNote);
} catch (error) {
if (error.name === 'ValidationError' || error.name === 'CastError') {
logger.warn('Validation error during update');
return res.status(400).json({ message: error.message });}
logger.error('Failed to update note due to server exception');
res.status(500).json({ message: 'Server error' });
}
};

export const deleteNote = async (req, res) => {
try {
const note = await Note.findById(String(req.params.id));
if (!note) {
logger.warn('Note deletion failed: Note not found');
return res.status(404).json({ message: 'Note not found' });
}
if (note.user.toString() !== req.user.id) {
logger.warn('Unauthorized delete attempt detected');
return res.status(404).json({ message: 'Note not found' });
}
await note.deleteOne();
logger.info('Note deleted successfully');
    res.status(200).json({ id: req.params.id, message: 'Note removed' });
}
catch (error) {
if (error.name === 'ValidationError' || error.name === 'CastError') {
return res.status(400).json({ message: 'Invalid note parameters' });
}
logger.error('Failed to process note deletion due to server exception');
res.status(500).json({ message: 'Server error' });
}
};