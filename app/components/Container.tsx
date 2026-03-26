import { ReactNode } from "react";

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className = "", id }: ContainerProps) {
  const contentClasses = [
    className,
    "w-full",
    "px-12 tablet:px-24 desktop:px-60 wide:px-60",
    "max-w-[1536px]",
  ].filter(Boolean).join(" ");

  return (
    <div className="flex justify-center w-full" id={id}>
      <div className={contentClasses}>{children}</div>
    </div>
  );
}
