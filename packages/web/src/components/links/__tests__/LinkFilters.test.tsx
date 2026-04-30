import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LinkFilters from '../LinkFilters';

const mockSources = [
  { id: 'github', name: 'GitHub' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'youtube', name: 'YouTube' },
];

const mockTags = [
  { id: 'tag-1', name: 'typescript' },
  { id: 'tag-2', name: 'react' },
  { id: 'tag-3', name: 'nodejs' },
];

const mockAuthors = [
  { id: '123', name: 'Alice' },
  { id: '456', name: 'Bob' },
];

const mockChannels = [
  { id: '789', name: 'general' },
  { id: '101', name: 'dev' },
];

describe('LinkFilters', () => {
  it('renders all filter sections', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={mockTags}
        authors={mockAuthors}
        channels={mockChannels}
      />
    );
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Date From')).toBeInTheDocument();
    expect(screen.getByText('Date To')).toBeInTheDocument();
  });

  it('renders source options from sources prop', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
      />
    );
    expect(screen.getByText('All Sources')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('renders tag options from tags prop', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={mockTags}
        authors={[]}
        channels={[]}
      />
    );
    expect(screen.getByText('All Tags')).toBeInTheDocument();
  });

  it('renders author options from authors prop', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={mockAuthors}
        channels={[]}
      />
    );
    expect(screen.getByText('All Authors')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders channel options from channels prop', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={mockChannels}
      />
    );
    expect(screen.getByText('All Channels')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
    expect(screen.getByText('#dev')).toBeInTheDocument();
  });

  it('calls onFilterChange when source is selected', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={[]}
        authors={[]}
        channels={[]}
      />
    );
    const selects = container.querySelectorAll('select');
    const sourceSelect = selects[0];
    fireEvent.change(sourceSelect, { target: { value: 'github' } });
    expect(onFilterChange).toHaveBeenCalledWith({ source_id: 'github' });
  });

  it('calls onFilterChange when tag is selected', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={mockTags}
        authors={[]}
        channels={[]}
      />
    );
    const selects = container.querySelectorAll('select');
    const tagSelect = selects[3];
    fireEvent.change(tagSelect, { target: { value: 'tag-1' } });
    expect(onFilterChange).toHaveBeenCalledWith({ tag_ids: 'tag-1' });
  });

  it('calls onFilterChange when author is selected', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={[]}
        authors={mockAuthors}
        channels={[]}
      />
    );
    const selects = container.querySelectorAll('select');
    const authorSelect = selects[1];
    fireEvent.change(authorSelect, { target: { value: '123' } });
    expect(onFilterChange).toHaveBeenCalledWith({ author_id: '123' });
  });

  it('calls onFilterChange when channel is selected', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={[]}
        authors={[]}
        channels={mockChannels}
      />
    );
    const selects = container.querySelectorAll('select');
    const channelSelect = selects[2];
    fireEvent.change(channelSelect, { target: { value: '789' } });
    expect(onFilterChange).toHaveBeenCalledWith({ channel_id: '789' });
  });

  it('shows clear button when filters are active', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
        initialFilters={{ source_id: 'github' }}
      />
    );
    expect(screen.getByTitle('Clear all filters')).toBeInTheDocument();
  });

  it('resets all filters when clear button is clicked', () => {
    const onFilterChange = vi.fn();
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={[]}
        authors={[]}
        channels={[]}
        initialFilters={{ source_id: 'github' }}
      />
    );
    fireEvent.click(screen.getByTitle('Clear all filters'));
    expect(onFilterChange).toHaveBeenCalled();
  });

  it('renders result count when provided', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
        resultCount={42}
      />
    );
    expect(screen.getByText('42 results')).toBeInTheDocument();
  });

  it('renders singular "result" when count is 1', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
        resultCount={1}
      />
    );
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('does not render result count when undefined', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
      />
    );
    expect(screen.queryByText(/result/)).not.toBeInTheDocument();
  });

  it('does not render tags section when tags array is empty', () => {
    render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
      />
    );
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('initializes with source from initialFilters', () => {
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={vi.fn()}
        tags={[]}
        authors={[]}
        channels={[]}
        initialFilters={{ source_id: 'youtube' }}
      />
    );
    const selects = container.querySelectorAll('select');
    const sourceSelect = selects[0];
    expect(sourceSelect).toHaveValue('youtube');
  });

  it('handles date inputs', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <LinkFilters
        sources={mockSources}
        onFilterChange={onFilterChange}
        tags={[]}
        authors={[]}
        channels={[]}
      />
    );
    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2025-01-01' } });
    expect(onFilterChange).toHaveBeenCalledWith({ date_from: '2025-01-01' });
  });
});
