import { useTranslations } from "~/contexts/TranslationsProvider";
import { useLocale } from "~/hooks/useLocale";
import { Z_INDEX } from "~/lib/constants";

export function AvailableSoonBanner() {
  // Banner passes through two points:
  // - Left edge at 15% from top: (0, 15vh)
  // - Top edge at 25% from left: (25vw, 0)
  // Angle = atan(15vh / 25vw) ≈ -31deg for typical screens
  // Extended beyond edges so ribbon appears infinite

  const { strings } = useTranslations();
  const { language } = useLocale();
  const isSpanish = language === 'ES';
  const bannerText = strings.available_soon_banner_text;
  const spanishBannerText = '¡Disponible próximamente!';

  return (
    <>
      {/* Mobile version - Spanish */}
      {isSpanish && (
        <div
          className={`fixed ${Z_INDEX.modal} pointer-events-none block tablet:hidden`}
          style={{
            top: '16vh',
            left: '-15px',
          }}
        >
          <div
            className="bg-[#4338ca] text-white font-bold uppercase text-center py-[8px] shadow-lg"
            style={{
              width: 'calc(50vw + 322px)',
              fontSize: '12px',
              letterSpacing: '1px',
              transform: 'rotate(-31deg)',
              transformOrigin: 'left center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              height: '33px',
            }}
          />
          <div
            style={{
              fontSize: '17px',
              letterSpacing: '1px',
              transform: 'rotate(-31deg)',
              transformOrigin: 'left center',
              top: '-14px',
              position: 'absolute',
              left: '31px',
              fontStyle: 'normal',
              fontWeight: 700,
            }}
          >
            {spanishBannerText}
          </div>
        </div>
      )}

      {/* Mobile version - Non-Spanish */}
      {!isSpanish && (
        <div
          className={`fixed ${Z_INDEX.modal} pointer-events-none block tablet:hidden`}
          style={{
            top: '14vh',
            left: '-28px',
          }}
        >
          <div
            className="bg-[#4338ca] text-white font-bold uppercase text-center py-[8px] shadow-lg"
            style={{
              width: 'calc(50vw + 322px)',
              fontSize: '12px',
              letterSpacing: '1px',
              transform: 'rotate(-31deg)',
              transformOrigin: 'left center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              height: '33px',
            }}
          />
          <div
            style={{
              fontSize: '21px',
              letterSpacing: '1px',
              transform: 'rotate(-31deg)',
              transformOrigin: 'left center',
              top: '-29px',
              position: 'absolute',
              left: '49px',
              fontStyle: 'normal',
              fontWeight: 700,
            }}
          >
            {bannerText}
          </div>
        </div>
      )}

      {/* Desktop version */}
      <div
        className={`fixed ${Z_INDEX.modal} pointer-events-none hidden tablet:block`}
        style={{
          top: '24vh',
          left: '-36px',
        }}
      >
        <div
          className="bg-[#4338ca] text-white font-bold uppercase text-center py-[8px] shadow-lg"
          style={{
            width: 'calc(50vw + 322px)',
            fontSize: '12px',
            letterSpacing: '1px',
            transform: 'rotate(-31deg)',
            transformOrigin: 'left center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            height: '43px',
          }}
        />
        <div
          style={{
            fontSize: '28px',
            letterSpacing: '1px',
            transform: 'rotate(-31deg)',
            transformOrigin: 'left center',
            top: '-68px',
            position: 'absolute',
            left: '111px',
            fontStyle: 'normal',
            fontWeight: 700,
          }}
        >
          {bannerText}
        </div>
      </div>
    </>
  );
}

