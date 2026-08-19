import '@testing-library/jest-dom';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import API from '../services/api';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/api', () => ({
  post: jest.fn(),
}));

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form elements correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Create an Account/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Full Name/i)
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Email Address/i)
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Password/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Sign Up/i,
      })
    ).toBeInTheDocument();
  });

  it('allows the user to enter registration details', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(nameInput, {
      target: { value: 'Maira Tahir' },
    });

    fireEvent.change(emailInput, {
      target: { value: 'maira@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });

    expect(nameInput).toHaveValue('Maira Tahir');
    expect(emailInput).toHaveValue('maira@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('successfully registers and saves user credentials to localStorage', async () => {
    API.post.mockResolvedValueOnce({
      data: {
        token: 'mock-signup-token',
        name: 'Maira Tahir',
      },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Maira Tahir' },
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'maira@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'securepassword123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Sign Up/i })
    );

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/users/signup', {
        name: 'Maira Tahir',
        email: 'maira@example.com',
        password: 'securepassword123',
      });
    });

    expect(localStorage.getItem('token')).toBe(
      'mock-signup-token'
    );

    expect(localStorage.getItem('userName')).toBe(
      'Maira Tahir'
    );

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays error message on registration failure', async () => {
    API.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Email already exists',
        },
      },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Maira Tahir' },
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'existing@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Sign Up/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Email already exists/i)
      ).toBeInTheDocument();
    });
  });
});