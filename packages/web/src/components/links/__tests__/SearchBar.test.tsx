import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search links, tags, authors...')).toBeInTheDocument();
  });

  it('displays the initial value', () => {
    render(<SearchBar value="initial query" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('initial query')).toBeInTheDocument();
  });

  it('calls onChange with debounced input', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search links, tags, authors...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('clears debounce on new input', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search links, tags, authors...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'hello' } });
      vi.advanceTimersByTime(200);
      fireEvent.change(input, { target: { value: 'hello world' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('hello world');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('shows clear button when value is present', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="search term" onChange={onChange} />);
    expect(screen.getByTitle('Clear')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByTitle('Clear')).not.toBeInTheDocument();
  });

  it('clears input and calls onChange when clear button is clicked', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="search term" onChange={onChange} />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Clear'));
    });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('displays result count when provided', () => {
    render(<SearchBar value="test" onChange={vi.fn()} resultCount={10} />);
    expect(screen.getByText(/10 results for/)).toBeInTheDocument();
  });

  it('displays singular result count', () => {
    render(<SearchBar value="test" onChange={vi.fn()} resultCount={1} />);
    expect(screen.getByText(/1 result for/)).toBeInTheDocument();
  });

  it('does not display result count when undefined', () => {
    render(<SearchBar value="test" onChange={vi.fn()} />);
    expect(screen.queryByText(/result for/)).not.toBeInTheDocument();
  });

  it('does not display result count when zero', () => {
    render(<SearchBar value="test" onChange={vi.fn()} resultCount={0} />);
    expect(screen.queryByText(/result for/)).not.toBeInTheDocument();
  });

  it('syncs external value changes', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="original" onChange={onChange} />);
    expect(screen.getByDisplayValue('original')).toBeInTheDocument();

    rerender(<SearchBar value="updated" onChange={onChange} />);
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });

  it('focuses input when "/" is pressed outside input', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search links, tags, authors...');

    fireEvent.keyDown(window, { key: '/' });
    expect(input).toHaveFocus();
  });

  it('does not focus input when "/" is pressed inside input', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search links, tags, authors...');
    fireEvent.focus(input);

    fireEvent.keyDown(window, { key: '/' });
    expect(input).toHaveFocus();
  });
});
