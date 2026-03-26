import { UITag } from "~/lib/types";

interface TagProps {
  tag: UITag;
  as?: "button" | "div";
  onClick?: () => void;
  minWidth?: string;
  maxWidth?: string;
}

export const Tag: React.FC<TagProps> = ({
  tag,
  onClick,
  as = "div",
  minWidth = "60px",
  maxWidth = "200px",
}) => {
  const commonClasses = `tag px-8 py-4 rounded-sm ${tag.bgColor} ${tag.textColor} inline-flex items-center justify-center`;
  const style = { minWidth, maxWidth };

  return as === "button" ? (
    <button
      className={commonClasses}
      onClick={onClick}
      style={style}
      title={tag.label}
    >
      <span className="body-b3 truncate">{tag.label}</span>
    </button>
  ) : (
    <div className={commonClasses} style={style} title={tag.label}>
      <span className="body-b3 truncate">{tag.label}</span>
    </div>
  );
};
