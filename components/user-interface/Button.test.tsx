import React from 'react';
import { render } from '../../test-utils';
import { screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import Button from './Button';

describe('Button', () => {
  it('renders the button with its children', () => {
    render(<Button>Click Me</Button>);
    
    // Use `screen.getByRole` to find the button element
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    
    // Assert that the button is in the document
    expect(buttonElement).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    
    // Check if the button has the class associated with the "destructive" variant
    expect(buttonElement).toHaveClass('bg-destructive');
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Cannot Click</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /cannot click/i });
    
    expect(buttonElement).toBeDisabled();
  });
});