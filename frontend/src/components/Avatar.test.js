import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderAvatar } from './Avatar.js';
import { screen } from '@testing-library/dom';

// Custom matchers to avoid adding a dependency like jest-dom
expect.extend({
    toBeInTheDocument(received) {
        if (received === null) {
            return { pass: false, message: () => 'expected element to be in the document, but it was null' };
        }
        const pass = document.body.contains(received);
        return { pass, message: () => `expected element ${pass ? 'not ' : ''}to be in the document` };
    },
    toHaveClass(received, ...expected) {
        if (received === null) {
            return { pass: false, message: () => 'expected element to have class, but it was null' };
        }
        const pass = expected.every(cls => received.classList.contains(cls));
        return { pass, message: () => `expected element to have classes [${expected.join(', ')}], but it had [${[...received.classList].join(', ')}]` };
    },
    toHaveAttribute(received, attr, value) {
        if (received === null) {
            return { pass: false, message: () => 'expected element to have attribute, but it was null' };
        }
        const pass = received.getAttribute(attr) === value;
        return { pass, message: () => `expected element to have attribute ${attr}="${value}"` };
    },
    toHaveTextContent(received, text) {
        if (received === null) {
            return { pass: false, message: () => 'expected element to have text content, but it was null' };
        }
        const pass = received.textContent.trim() === text;
        return { pass, message: () => `expected element to have text content "${text}", but it was "${received.textContent.trim()}"` };
    }
});

describe('renderAvatar', () => {
    let container;

    beforeEach(() => {
        // Create a container for the rendered output
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Clean up the DOM
        document.body.removeChild(container);
        container = null;
    });

    const setup = (character, size) => {
        container.innerHTML = renderAvatar(character, size);
        return container.firstElementChild; // Use firstElementChild to skip whitespace text nodes
    };

    it('should render an image if character has a data URL avatar', () => {
        const character = { name: 'Arisu', avatar: 'data:image/png;base64,abc...' };
        const avatarElement = setup(character);

        expect(avatarElement.tagName).toBe('IMG');
        expect(avatarElement.src).toBe(character.avatar);
        expect(avatarElement.alt).toBe(character.name);
        expect(avatarElement).toHaveClass('w-12', 'h-12'); // default md size
    });

    it('should render initials if no avatar is provided', () => {
        const character = { name: 'Bocchi' };
        const avatarElement = setup(character);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(avatarElement).toHaveTextContent('B');
        expect(avatarElement).toHaveClass('bg-gradient-to-br');
    });

    it('should render a bot icon if no avatar or name is provided', () => {
        const character = {};
        const avatarElement = setup(character);
        const icon = avatarElement.querySelector('i');

        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('data-lucide', 'bot');
    });

    it('should handle null or undefined character', () => {
        const avatarElement = setup(null);
        const icon = avatarElement.querySelector('i');

        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('data-lucide', 'bot');
    });

    it('should apply small size classes', () => {
        const character = { name: 'Kita' };
        const avatarElement = setup(character, 'sm');
        expect(avatarElement).toHaveClass('w-10', 'h-10');
    });

    it('should apply large size classes', () => {
        const character = { name: 'Ryo' };
        const avatarElement = setup(character, 'lg');
        expect(avatarElement).toHaveClass('w-16', 'h-16');
    });
});
