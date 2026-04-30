import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LinkCard from '../LinkCard';
import type { LinkItem } from '../../../lib/api';

const createMockLink = (overrides: Partial<LinkItem> = {}): LinkItem => ({
  id: 'link-1',
  url: 'https://github.com/test/repo',
  domain: 'github.com',
  source_id: 'github',
  source_name: 'GitHub',
  author_id: 12345,
  author_username: 'testuser',
  channel_id: 67890,
  channel_name: 'dev-links',
  discord_message_id: 111,
  posted_at: new Date(Date.now() - 3600000).toISOString(),
  llm_status: 'done',
  title: 'Test Repository',
  description: 'A test repository for unit tests',
  tags: [
    { id: 'tag-1', name: 'typescript' },
    { id: 'tag-2', name: 'testing' },
    { id: 'tag-3', name: 'example' },
  ],
  source_detected: 'github',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('LinkCard', () => {
  it('renders source badge with correct label', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders title from link.title', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('Test Repository')).toBeInTheDocument();
  });

  it('falls back to url when title is null', () => {
    const link = createMockLink({ title: null });
    render(<LinkCard link={link} />);
    expect(screen.getByText('https://github.com/test/repo')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('A test repository for unit tests')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    const link = createMockLink({ description: null });
    const { container } = render(<LinkCard link={link} />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders tags when present', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('does not render tags section when tags is empty', () => {
    const link = createMockLink({ tags: [] });
    const { container } = render(<LinkCard link={link} />);
    const tagsSection = container.querySelector('.flex-wrap');
    expect(tagsSection).not.toBeInTheDocument();
  });

  it('shows "+N" expand button when more than 4 tags', () => {
    const link = createMockLink({
      tags: [
        { id: '1', name: 'tag1' },
        { id: '2', name: 'tag2' },
        { id: '3', name: 'tag3' },
        { id: '4', name: 'tag4' },
        { id: '5', name: 'tag5' },
        { id: '6', name: 'tag6' },
      ],
    });
    render(<LinkCard link={link} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('expands tags when "+N" button is clicked', () => {
    const link = createMockLink({
      tags: [
        { id: '1', name: 'tag1' },
        { id: '2', name: 'tag2' },
        { id: '3', name: 'tag3' },
        { id: '4', name: 'tag4' },
        { id: '5', name: 'tag5' },
      ],
    });
    render(<LinkCard link={link} />);
    fireEvent.click(screen.getByText('+1'));
    expect(screen.getByText('tag5')).toBeInTheDocument();
  });

  it('calls onTagFilter when tag is clicked', () => {
    const onTagFilter = vi.fn();
    const link = createMockLink();
    render(<LinkCard link={link} onTagFilter={onTagFilter} />);
    fireEvent.click(screen.getByText('typescript'));
    expect(onTagFilter).toHaveBeenCalledWith('tag-1');
  });

  it('highlights active tag filter', () => {
    const link = createMockLink();
    render(<LinkCard link={link} activeTagFilter="tag-1" />);
    const activeTag = screen.getByText('typescript');
    expect(activeTag).toHaveClass('text-violet-400');
    expect(activeTag).toHaveClass('border-violet-500');
  });

  it('renders author name and initial', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders channel name after author', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    expect(screen.getByText('#dev-links')).toBeInTheDocument();
  });

  it('shows "User N" when author_id is set but username is null', () => {
    const link = createMockLink({ author_username: null });
    render(<LinkCard link={link} />);
    expect(screen.getByText('User 12345')).toBeInTheDocument();
  });

  it('does not show author section when both author fields are null', () => {
    const link = createMockLink({ author_id: null, author_username: null, channel_name: null });
    const { container } = render(<LinkCard link={link} />);
    const authorSection = container.querySelector('.border-t');
    expect(authorSection).not.toBeInTheDocument();
  });

  it('renders link with correct href and target', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    const linkEl = screen.getByRole('link', { name: 'Test Repository' });
    expect(linkEl).toHaveAttribute('href', 'https://github.com/test/repo');
    expect(linkEl).toHaveAttribute('target', '_blank');
    expect(linkEl).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders relative date', () => {
    const link = createMockLink();
    render(<LinkCard link={link} />);
    const dateEl = screen.getByText(/h ago/);
    expect(dateEl).toBeInTheDocument();
  });

  it('renders source badge with correct color style', () => {
    const link = createMockLink({ source_id: 'youtube' });
    render(<LinkCard link={link} />);
    const badge = screen.getByText('YouTube');
    expect(badge).toHaveStyle('color: rgb(255, 0, 0)');
  });
});
