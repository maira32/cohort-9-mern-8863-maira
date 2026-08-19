import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import API from '../services/api';

jest.mock('../services/api', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the Dashboard header and loads notes from API', async () => {
    API.get.mockResolvedValueOnce({
      data: [
        {
          _id: '1',
          title: 'First Test Note',
          content: '<p>Hello world content</p>',
        },
      ],
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Notely Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading your notes/i)).toBeInTheDocument();

    try {
      await waitFor(() => {
        expect(screen.getByText(/First Test Note/i)).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for notes to render: ${error.message}`);
    }

    expect(API.get).toHaveBeenCalledWith('/notes');
  });

  it('displays message when there are no notes', async () => {
    API.get.mockResolvedValueOnce({
      data: [],
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    try {
      await waitFor(() => {
        expect(
          screen.getByText(/You don't have any notes yet/i)
        ).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for empty state message: ${error.message}`);
    }
  });

  it('displays error message when notes cannot be loaded', async () => {
    API.get.mockRejectedValueOnce(new Error('Failed to fetch notes'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    try {
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load notes/i)
        ).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for error message to appear: ${error.message}`);
    }
  });

  it('deletes a note successfully', async () => {
    API.get.mockResolvedValueOnce({
      data: [
        {
          _id: '1',
          title: 'Note To Delete',
          content: '<p>Test content</p>',
        },
      ],
    });

    API.delete.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    try {
      await waitFor(() => {
        expect(screen.getByText(/Note To Delete/i)).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for note to render before deletion: ${error.message}`);
    }

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    try {
      await waitFor(() => {
        expect(API.delete).toHaveBeenCalledWith('/notes/1');
      });
    } catch (error) {
      throw new Error(`Failed waiting for API delete call: ${error.message}`);
    }

    try {
      await waitFor(() => {
        expect(
          screen.queryByText(/Note To Delete/i)
        ).not.toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for note to be removed from DOM: ${error.message}`);
    }
  });

  it('logs out and removes user information from localStorage', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('userName', 'Maira');

    API.get.mockResolvedValueOnce({
      data: [],
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userName')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to login when API returns 401', async () => {
    // FIX: Seeding credentials before the request to prove they get deleted
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('userName', 'Maira');

    API.get.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    try {
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load notes/i)
        ).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for error state on 401: ${error.message}`);
    }

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userName')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});