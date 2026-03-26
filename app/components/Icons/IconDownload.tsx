interface IconDownloadProps {
  className?: string;
}

export function IconDownload({ className }: IconDownloadProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 14 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 10.331H10V15.035C10 15.5185 9.56 15.9582 9.08 15.9582H5.31C4.83 15.9582 4.39 15.5185 4.39 15.035V10.331H2.9C2.07 10.331 1.63 9.32 2.24 8.748L6.54 4.44C6.89 4.045 7.5 4.045 7.85 4.44L12.14 8.748C12.71 9.32 12.32 10.331 11.5 10.331ZM0.67 0.967C0.67 0.44 1.06 0 1.59 0H12.8C13.32 0 13.72 0.44 13.72 0.967C13.72 1.45 13.32 1.89 12.8 1.89H1.59C1.06 1.89 0.67 1.45 0.67 0.967Z"
        fill="currentColor"
      />
    </svg>
  );
}

