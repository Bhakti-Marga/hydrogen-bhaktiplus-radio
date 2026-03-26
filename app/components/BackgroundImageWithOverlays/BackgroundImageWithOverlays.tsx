interface BackgroundImageWithOverlaysProps {
  imageUrl: string;
  altText?: string;
}

export function BackgroundImageWithOverlays({
  imageUrl,
  altText = "",
}: BackgroundImageWithOverlaysProps) {
  return (
    <>
      <div className="absolute inset-0 w-full h-full animate-[crossFade_700ms_ease-out_forwards]">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="hero__overlay absolute inset-0 animate-[crossFade_700ms_ease-out_forwards]" />
      <div className="hero__overlay-vertical absolute inset-0 animate-[crossFade_700ms_ease-out_forwards]" />
    </>
  );
}
