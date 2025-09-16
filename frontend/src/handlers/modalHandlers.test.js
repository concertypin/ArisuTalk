import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleModalClick } from './modalHandlers.js';
import { renderConfirmationModal } from '../components/ConfirmationModal.js';

// Mock dependencies
vi.mock('../i18n.js', () => ({
    t: key => key,
}));

describe('handleModalClick for ConfirmationModal', () => {
    let app;
    let container;

    beforeEach(() => {
        // Create a mock app object
        app = {
            state: {
                modal: {
                    isOpen: true,
                    type: 'confirmation',
                    title: 'Test Title',
                    message: 'Test Message',
                    onConfirm: vi.fn(),
                }
            },
            hideModal: vi.fn(),
        };

        // Setup DOM
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
        vi.clearAllMocks();
    });

    // Helper to simulate a click
    const simulateClick = (element) => {
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(event);
        handleModalClick(event, app);
    };

    it('should call onConfirm and hideModal when confirm button is clicked', async () => {
        container.innerHTML = renderConfirmationModal(app);
        const confirmButton = document.getElementById('modal-confirm');

        simulateClick(confirmButton);

        // hideModal is called synchronously
        expect(app.hideModal).toHaveBeenCalledTimes(1);

        // onConfirm is called asynchronously via setTimeout
        await vi.runAllTimersAsync();
        expect(app.state.modal.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call hideModal when cancel button is clicked', () => {
        container.innerHTML = renderConfirmationModal(app);
        const cancelButton = document.getElementById('modal-cancel');

        simulateClick(cancelButton);

        expect(app.hideModal).toHaveBeenCalledTimes(1);
        expect(app.state.modal.onConfirm).not.toHaveBeenCalled();
    });

    it('should handle info modal (no onConfirm) correctly', () => {
        // Setup for an info-style modal (onConfirm is null)
        app.state.modal.onConfirm = null;
        container.innerHTML = renderConfirmationModal(app);

        // In this case, the primary button is the "cancel" button, but it's labeled "confirm"
        const okButton = document.getElementById('modal-cancel');

        simulateClick(okButton);

        expect(app.hideModal).toHaveBeenCalledTimes(1);
    });

    // Vitest needs to be told to use fake timers for this test file
    vi.useFakeTimers();
});
