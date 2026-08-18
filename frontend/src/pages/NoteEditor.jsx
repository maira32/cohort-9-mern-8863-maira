import {useState, useEffect }from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import API from '../services/api';

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };
  
export default function NoteEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      const fetchNote = async () => {
        try {
          const { data } = await API.get('/notes');
          const currentNote = data.find((note) => note._id === id);
          if (currentNote) {
            setTitle(currentNote.title);
            setContent(currentNote.content);
          } else {
            setError('Note not found');
          }
        } catch (err) {
          setError('Failed to load note details');
        }
      };
      fetchNote();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!plainText) {
    setError('Please provide content for your note');
    return;
    }
    try {
      if (isEditing) {
        await API.put(`/notes/${id}`, { title, content });
      } else {
        await API.post('/notes', { title, content });
      }
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Note' : 'Create New Note'}
          </h2>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-600">Title</label>
            <input 
              id="title"
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label id="content-label" className="block mb-2 text-sm font-medium text-gray-600">Content</label>
            <div className="bg-white rounded-md">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={modules}
                placeholder="Write your note content here..."
                className="h-64 mb-12"
              >
              <div aria-labelledby="content-label" />
           </ReactQuill>
            </div>
          </div>
            
          <div className="flex justify-end gap-4">
            <Link 
              to="/dashboard"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition duration-200"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
            >
              {isEditing ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}