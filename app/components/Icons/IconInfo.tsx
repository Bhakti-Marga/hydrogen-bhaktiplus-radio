export function IconInfo({ className }: { className?: string }) {
  return (
    <svg
      className={`icon icon--info ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8 12.6C8.33137 12.6 8.6 12.3314 8.6 12V7.2C8.6 6.86863 8.33137 6.6 8 6.6C7.66863 6.6 7.4 6.86863 7.4 7.2V12C7.4 12.3314 7.66863 12.6 8 12.6ZM8 4C8.44183 4 8.8 4.35817 8.8 4.8C8.8 5.24183 8.44183 5.6 8 5.6C7.55817 5.6 7.2 5.24183 7.2 4.8C7.2 4.35817 7.55817 4 8 4Z"
        fill="currentColor"
      />
    </svg>
  );
}
