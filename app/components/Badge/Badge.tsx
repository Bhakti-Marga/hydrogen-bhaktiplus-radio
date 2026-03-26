import { BadgeProps } from "./Badge.types";

export const Badge = ({
  text,
  backgroundColor = "gold",
  borderColor,
  textColor = "purple",
}: BadgeProps) => {
  if (!text) return null;

  let containerClasses, wrapperClasses, labelClasses;

  switch (backgroundColor) {
    case "gold":
      wrapperClasses = "gradient-gold";
      break;
    case "purple":
      wrapperClasses = "gradient-purple";
      break;
    default:
      break;
  }

  switch (borderColor) {
    case "gold":
      containerClasses = "border-gradient--gold";
      break;
    case "purple":
      containerClasses = "border-gradient--purple";
      break;
  }

  switch (textColor) {
    case "gold":
      labelClasses = "gradient-gold text-gradient";
      break;
    case "purple":
      labelClasses = "gradient-purple text-gradient";
      break;
    default:
      break;
  }

  return (
    <div className={`badge border-gradient ${containerClasses ?? ""}`}>
      <span
        className={`badge__wrapper block px-8 rounded-full ${
          wrapperClasses ?? ""
        }`}
      >
        <p
          className={`badge__wrapper__label font-avenir-next text-xxs font-500 uppercase leading-5 ${
            labelClasses ?? ""
          }`}
        >
          {text}
        </p>
      </span>
    </div>
  );
};
