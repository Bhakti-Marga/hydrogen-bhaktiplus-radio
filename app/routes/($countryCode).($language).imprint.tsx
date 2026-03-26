import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { localeContext } from "~/lib/middleware";
import { getStoreForCountry } from "~/lib/store-routing/config";

export const meta: MetaFunction = () => {
  return [{ title: "Imprint - Bhakti+" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const { countryCode } = context.get(localeContext);
  const storeType = getStoreForCountry(countryCode);
  return { storeType };
}

// EU Imprint content (Bhakti Event GmbH - Germany)
function EUImprint() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Imprint</h1>

      <p className="mb-4">Legal website operator identification:</p>

      <p className="mb-4">
        <strong>Bhakti Event GmbH</strong><br />
        <strong>Represented by the general manager Fabian Leuzinger, Jan Philip Zehner, Wlodzimierz Schmidt</strong>
      </p>

      <p className="mb-4">
        <strong>Am Geisberg 1-8</strong><br />
        <strong>65321 Heidenrod Springen Germany</strong><br />
        <strong>Telephone: 06124/609 1125</strong><br />
        <strong>Telephone (fee-based):</strong><br />
        <strong>06124/609 1125 0,29 € (inkl. MwSt.)/pro Minute aus dem deutschen Festnetz; Mobilfunkhöchstpreis: 0,42 € (inkl. MwSt.)/pro Minute</strong><br />
        <strong>Telefax: 06124/72769-13</strong><br />
        <strong>E-Mail: <a href="mailto:info@bhaktimarga.org" className="text-blue-600 hover:underline">info@bhaktimarga.org</a></strong><br />
        <strong>VAT No.: DE251110702</strong><br />
        <strong>Listed in the commercial register of the local court Wiesbaden</strong><br />
        <strong>Commercial register number - Part B of the commercial register - 23765</strong>
      </p>

      <p className="mb-4">
        <strong>Responsible for the contents as per § 18 paragraph 2 of the MStV:</strong>
      </p>

      <p className="mb-8">
        Herr Jan-Philipp Zehner<br />
        Am Geisberg 1-8<br />
        65321 Heidenrod
      </p>

      <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
      <p className="mb-8">
        Bhakti Marga makes every effort to ensure that the information on its website is always correct and up to date, and changes or supplements of this information will be held as necessary on an ongoing basis and without prior notice. This website contains links to third party websites over which Bhakti Marga has no control. These links merely provide access to the use of third-party content in accordance with § 8 of the TMG. Nevertheless, Bhakti Marga cannot assume any liability for correctness, topicality and completeness. Despite careful control of the content, Bhakti Marga also accepts no liability for the content of external links. When first linking to another website, Bhakti Marga has checked the external content to see whether it could lead to any civil or criminal liability. As soon as it is established that a particular offer to which a link has been provided triggers civil or criminal liability, the reference to this offer will be removed immediately, insofar as this is technically possible and reasonable. The operators of the linked sites are solely responsible for their content.
      </p>

      <h2 className="text-2xl font-bold mb-4">Copyright</h2>
      <p className="mb-8">
        The design of the Internet pages as well as the content contributions including all their parts such as texts and images are protected by copyright. This applies in particular to texts, images, graphics, sound, video or animation files including their arrangement on the Internet pages. No changes may be made to these. Any reproduction or use outside the narrow limits of copyright law is not permitted without consent. Passing on the contents of the website to third parties in return for payment is not permitted.
      </p>

      <h2 className="text-2xl font-bold mb-4">Alternative dispute resolution</h2>
      <p className="mb-4">
        The European Commission provides a platform for out-of-court online dispute resolution (OS platform), available at{" "}
        <a
          href="https://ec.europa.eu/odr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://ec.europa.eu/odr
        </a>
        . We are not willing to participate in dispute resolution proceedings before consumer arbitration boards.
      </p>

      <p className="mt-8 text-sm text-gray-600">
        We are a member of the initiative „FairCommerce" since 27.10.2020.
      </p>
    </>
  );
}

// International Imprint content (Bhakti Marga America - US)
function InternationalImprint() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Contact Information</h1>

      <p className="mb-4"><strong>Legal website operator identification:</strong></p>

      <p className="mb-4">
        Legal name – Bhakti Marga America<br />
        Entity Type – Religious Corporation<br />
        Registered Office: 304 Demarest Parkway, Elmira, New York, 14905
      </p>

      <p className="mb-4">
        E-Mail: <a href="mailto:info@bhaktimarga.us" className="text-blue-600 hover:underline">info@bhaktimarga.us</a><br />
        Legal Representative: Hancock Estabrook, LLP<br />
        Telephone: +1 607 391 2860<br />
        Tax ID: 30-1325886<br />
        Country of residence: United States
      </p>

      <h2 className="text-2xl font-bold mb-4 mt-8">Disclaimer</h2>
      <p className="mb-4">
        Bhakti Marga America makes every effort to ensure that the information on its website is always correct and up to date, and changes or supplements of this information will be held as necessary on an ongoing basis and without prior notice. This website contains links to third party websites over which Bhakti Marga America has no control. These links merely provide access to the use of third-party content. Nevertheless, Bhakti Marga America cannot assume any liability for correctness, topicality and completeness. Despite careful control of the content, Bhakti Marga America also accepts no liability for the content of external links.
      </p>
      <p className="mb-8">
        When first linking to another website, Bhakti Marga America has checked the external content to see whether it could lead to any civil or criminal liability. As soon as it is established that a particular offer to which a link has been provided triggers civil or criminal liability, the reference to this offer will be removed immediately, insofar as this is technically possible and reasonable. The operators of the linked sites are solely responsible for their content.
      </p>

      <h2 className="text-2xl font-bold mb-4">Copyright</h2>
      <p className="mb-8">
        The design of the Internet pages as well as the content contributions including all their parts such as texts and images are protected by copyright. This applies in particular to texts, images, graphics, sound, video or animation files including their arrangement on the Internet pages. No changes may be made to these. Any reproduction or use outside the narrow limits of copyright law is not permitted without consent. Passing on the contents of the website to third parties in return for payment is not permitted.
      </p>

      <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
      <p className="mb-4">
        The American Bar Association provides a platform for out-of-court online dispute resolution (ODR), available at{" "}
        <a
          href="https://www.americanbar.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://www.americanbar.org/
        </a>
      </p>
      <p className="mb-4">
        We are not willing to participate in dispute resolution proceedings before consumer arbitration boards.
      </p>
    </>
  );
}

export default function Imprint() {
  const { storeType } = useLoaderData<typeof loader>();

  return (
    <div className="page rte bg-white text-brand-dark py-80 px-16">
      <div className="max-w-lg mx-auto">
        {storeType === 'eu' ? <EUImprint /> : <InternationalImprint />}
      </div>
    </div>
  );
}
