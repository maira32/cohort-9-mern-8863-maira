import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import API from '../services/api';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/api', () => ({
  post: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form elements correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Log In/i })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Email Address/i)
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Password/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Log In/i })
    ).toBeInTheDocument();
  });

  it('allows the user to enter email and password', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('successfully logs in and saves tokens to localStorage', async () => {
    API.post.mockResolvedValueOnce({
      data: {
        token: 'mock-jwt-token',
        name: 'Maira',
      },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Log In/i })
    );

    try {
      await waitFor(() => {
        expect(API.post).toHaveBeenCalledWith('/users/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    } catch (error) {
      throw new Error(`Failed waiting for API login post: ${error.message}`);
    }

    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(localStorage.getItem('userName')).toBe('Maira');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays error message on failed login', async () => {
    API.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'wrong@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Log In/i })
    );

    try {
      await waitFor(() => {
        expect(
          screen.getByText(/Invalid credentials/i)
        ).toBeInTheDocument();
      });
    } catch (error) {
      throw new Error(`Failed waiting for invalid credentials message: ${error.message}`);
    }
  });
});