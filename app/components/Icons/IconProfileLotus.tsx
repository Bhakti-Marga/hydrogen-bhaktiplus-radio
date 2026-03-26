interface IconProfileLotusGradient {
  start: string;
  middle: string;
  end: string;
}

interface IconProfileLotusProps {
  className?: string;
  lotusColor?: string;
  bgColor?: string;
  bgGradient?: IconProfileLotusGradient;
}

export function IconProfileLotus({
  className = "",
  lotusColor = "#16254C",
  bgColor,
  bgGradient = { start: "#D6BF90", middle: "#FFEFCD", end: "#D6BF90" },
}: IconProfileLotusProps) {
  const gradient = bgGradient;

  return (
    <svg
      width="36"
      height="40"
      viewBox="0 0 36 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="36"
        height="40"
        rx="18"
        fill={bgColor || "url(#paint0_linear_profile)"}
      />
      <path
        d="M22.8785 17.5487C22.8785 20.4914 21.1682 23.0065 19.8604 24.5155C21.5706 24.3898 24.1612 23.8868 25.8714 22.1765C27.8332 20.2147 28.1853 17.096 28.2356 15.4612C28.2356 15.2348 28.0596 15.0588 27.8584 15.0839C26.626 15.1091 24.5384 15.3354 22.7527 16.2912C22.8282 16.6936 22.8785 17.1212 22.8785 17.5487Z"
        fill={lotusColor}
      />
      <path
        d="M17.6968 11.1354C16.565 12.3175 14.6284 14.7823 14.6284 17.5489C14.6284 20.3155 16.5902 22.7803 17.6968 23.9875C17.8477 24.1384 18.0992 24.1384 18.2502 23.9875C19.3819 22.8054 21.3186 20.3155 21.3186 17.5489C21.3186 14.7823 19.3568 12.3175 18.2502 11.1102C18.0992 10.9593 17.8477 10.9593 17.6968 11.1354Z"
        fill={lotusColor}
      />
      <path
        d="M16.0881 24.5158C14.8054 23.0319 13.07 20.4917 13.07 17.549C13.07 17.0963 13.1203 16.6687 13.1958 16.2663C11.41 15.3106 9.32251 15.1094 8.09011 15.0591C7.86375 15.0591 7.68769 15.2351 7.71285 15.4363C7.76315 17.0712 8.11526 20.1899 10.077 22.1516C11.7873 23.8871 14.3527 24.3901 16.0881 24.5158Z"
        fill={lotusColor}
      />
      <path
        d="M27.0286 22.9468C27.0035 22.9719 26.9783 22.9971 26.9532 23.0222C24.4381 25.5625 20.5145 25.8643 18.7791 25.8643C18.3515 25.8643 17.597 25.8643 17.1695 25.8643C15.4592 25.8643 11.5356 25.5625 8.99539 23.0222C8.97024 22.9971 8.97024 22.9719 8.94509 22.9719C7.08392 23.6259 6.05273 24.4055 6.05273 25.0595C6.05273 26.4428 10.7057 28.4548 17.9994 28.4548C25.2932 28.4548 29.9461 26.4428 29.9461 25.0595C29.9461 24.4055 28.8898 23.6007 27.0286 22.9468Z"
        fill={lotusColor}
      />
      {!bgColor && gradient && (
        <defs>
          <linearGradient
            id="paint0_linear_profile"
            x1="26.8916"
            y1="-51.6667"
            x2="75.7712"
            y2="-18.3511"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.240899" stopColor={gradient.start} />
            <stop offset="0.547661" stopColor={gradient.middle} />
            <stop offset="0.745093" stopColor={gradient.end} />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
