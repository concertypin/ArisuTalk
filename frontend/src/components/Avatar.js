export function renderAvatar(character, size = "md") {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
  }[size];

  if (character?.avatar && character.avatar.startsWith("data:image")) {
    return `<img src="${character.avatar}" alt="${character.name}" class="${sizeClasses} rounded-full object-cover">`;
  }
  const initial = character?.name?.[0] || `<i data-lucide="bot"></i>`;
  return `
        <div class="${sizeClasses} bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium">
            ${initial}
        </div>
    `;
}
