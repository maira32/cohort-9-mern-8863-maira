import '@testing-library/jest-dom';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NoteEditor from '../pages/NoteEditor';
import API from '../services/api';

const mockNavigate = jest.fn();
let mockId = undefined;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: mockId }),
}));

jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

jest.mock('react-quill-new', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid="mock-quill"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('NoteEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockId = undefined;
  });

  it('renders Create New Note mode correctly', () => {
    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Create New Note/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Save Note/i })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Title/i)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('mock-quill')
    ).toBeInTheDocument();
  });

  it('shows validation error if submitting empty content', () => {
    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'My Test Title' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Save Note/i })
    );

    expect(
      screen.getByText(/Please provide content for your note/i)
    ).toBeInTheDocument();

    expect(API.post).not.toHaveBeenCalled();
  });

  it('successfully submits a new note when fields are filled', async () => {
    API.post.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'New Awesome Note' },
    });

    fireEvent.change(screen.getByTestId('mock-quill'), {
      target: {
        value: '<p>This is test note content.</p>',
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Save Note/i })
    );

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/notes', {
        title: 'New Awesome Note',
        content: '<p>This is test note content.</p>',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays an error when creating a note fails', async () => {
    API.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to create note',
        },
      },
    });

    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test Note' },
    });

    fireEvent.change(screen.getByTestId('mock-quill'), {
      target: {
        value: '<p>Some content</p>',
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Save Note/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create note/i)
      ).toBeInTheDocument();
    });
  });

  it('loads an existing note in edit mode', async () => {
    mockId = '123';

    API.get.mockResolvedValueOnce({
      data: [
        {
          _id: '123',
          title: 'Existing Note',
          content: '<p>Existing content</p>',
        },
      ],
    });

    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Existing Note')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Edit Note/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Update Note/i })
    ).toBeInTheDocument();

    expect(API.get).toHaveBeenCalledWith('/notes');
  });

  it('updates an existing note successfully', async () => {
    mockId = '123';

    API.get.mockResolvedValueOnce({
      data: [
        {
          _id: '123',
          title: 'Old Title',
          content: '<p>Old content</p>',
        },
      ],
    });

    API.put.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Old Title')
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: {
        value: 'Updated Title',
      },
    });

    fireEvent.change(screen.getByTestId('mock-quill'), {
      target: {
        value: '<p>Updated content</p>',
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Update Note/i })
    );

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/notes/123', {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error when the note does not exist', async () => {
    mockId = '999';

    API.get.mockResolvedValueOnce({
      data: [],
    });

    render(
      <BrowserRouter>
        <NoteEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Note not found/i)
      ).toBeInTheDocument();
    });
  });
});