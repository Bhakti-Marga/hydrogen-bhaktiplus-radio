import { ReactNode } from "react";
import { Container } from "~/components";

interface SubmenuWrapperProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  children: ReactNode;
  className?: string;
}

export function SubmenuWrapper({
  id,
  triggerId,
  isActive,
  children,
  className = "",
}: SubmenuWrapperProps) {
  return (
    <div
      id={id}
      role="region"
      className={`submenu animated-link-chevron-trigger text-white bg-brand ${className}`}
      aria-hidden={!isActive}
      aria-labelledby={triggerId}
    >
      <Container>
        <div className="submenu__container pt-40 pb-80 flex overflow-hidden">
          {children}
        </div>
      </Container>
    </div>
  );
}
