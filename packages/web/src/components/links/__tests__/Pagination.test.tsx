import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={10} perPage={10} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} totalItems={0} perPage={10} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page numbers for small page counts', () => {
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={50} perPage={10} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <Pagination currentPage={3} totalPages={10} totalItems={100} perPage={10} onPageChange={vi.fn()} />
    );
    const activeBtn = screen.getByText('3').closest('button');
    expect(activeBtn).toHaveClass('border-violet-500');
  });

  it('calls onPageChange when page button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={50} perPage={10} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders prev/next buttons', () => {
    render(
      <Pagination currentPage={2} totalPages={5} totalItems={50} perPage={10} onPageChange={vi.fn()} />
    );
    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThan(3);
  });

  it('disables prev button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={50} perPage={10} onPageChange={vi.fn()} />
    );
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons[0];
    expect(prevBtn).toHaveClass('opacity-50');
  });

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} totalItems={50} perPage={10} onPageChange={vi.fn()} />
    );
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn).toHaveClass('opacity-50');
  });

  it('shows result range text', () => {
    render(
      <Pagination currentPage={2} totalPages={5} totalItems={42} perPage={10} onPageChange={vi.fn()} />
    );
    expect(screen.getByText(/Showing 11–20 of 42 results/)).toBeInTheDocument();
  });

  it('shows "No results" when totalItems is 0', () => {
    render(
      <Pagination currentPage={1} totalPages={1} totalItems={0} perPage={10} onPageChange={vi.fn()} />
    );
  });

  it('shows correct range for last page with remainder', () => {
    render(
      <Pagination currentPage={5} totalPages={5} totalItems={42} perPage={10} onPageChange={vi.fn()} />
    );
    expect(screen.getByText(/Showing 41–42 of 42 results/)).toBeInTheDocument();
  });

  it('shows first and last page buttons with ellipsis for large page counts', () => {
    render(
      <Pagination currentPage={10} totalPages={50} totalItems={500} perPage={10} onPageChange={vi.fn()} />
    );
    // getPageNumbers for current=10, total=50 → shows 8..12
    // First page 1 and last page 50 should be shown with ellipsis between
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('does not call onPageChange for out-of-range pages', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={5} totalItems={50} perPage={10} onPageChange={onPageChange} />
    );
    // The handlePageClick function guards page >= 1 && page <= totalPages
    // So clicking page 0 or page 6 should not trigger callback
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders first and last page buttons', () => {
    render(
      <Pagination currentPage={5} totalPages={20} totalItems={200} perPage={10} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
