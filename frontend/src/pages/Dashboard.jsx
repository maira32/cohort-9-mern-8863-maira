import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import DOMPurify from 'dompurify';

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await API.get('/notes');
        setNotes(data);
        setLoading(false);
      } 
      catch (err) {
        setError('Failed to load notes. Please try logging in again.');
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
          navigate('/login');
        }
      }
    };
    fetchNotes();
  }, [navigate]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notes/${id}`);
      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Notely Dashboard</h1>
        <p>Hi! {userName}</p>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition duration-200"
        >
          Log Out
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Your Notes</h2>
          <Link 
            to="/notes/new" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition duration-200"
          >
            + Create New Note
          </Link>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-gray-500">Loading your notes...</p>}

        {!loading && notes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-4">You don't have any notes yet.</p>
            <Link to="/notes/new" className="text-blue-600 hover:underline font-medium">
              Create your very first note!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{note.title}</h3>
                  <div  className="text-gray-600 text-sm mb-4 line-clamp-3 prose prose-sm" 
                     dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }} 
                  />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <Link 
                    to={`/notes/edit/${note._id}`} 
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(note._id)}
                    className="text-sm text-red-500 hover:underline font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}