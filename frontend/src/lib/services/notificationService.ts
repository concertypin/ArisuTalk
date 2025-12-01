import {
    isConfirmationModalVisible,
    confirmationModalData,
} from "../stores/ui";

export function showNotification(title: string, message: string) {
    confirmationModalData.set({
        title,
        message,
        onConfirm: null,
    });
    isConfirmationModalVisible.set(true);
}

export function showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
) {
    confirmationModalData.set({
        title,
        message,
        onConfirm,
    });
    isConfirmationModalVisible.set(true);
}
