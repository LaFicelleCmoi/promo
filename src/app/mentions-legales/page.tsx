import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_DISCORD, InfoList, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales — Promo Tracker",
  description: "Éditeur, hébergement et informations légales du site Promo Tracker.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      current="/mentions-legales"
      intro={
        <p>
          Informations prévues par l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l&apos;économie numérique (LCEN).
        </p>
      }
      sections={[
        {
          id: "editeur",
          title: "Éditeur du site",
          content: (
            <>
              <InfoList
                items={[
                  ["Site", "Promo Tracker — promo-rouge.vercel.app"],
                  ["Éditeur", "Particulier, à titre non professionnel"],
                  ["Directeur de la publication", "L'éditeur du site"],
                  [
                    "Contact",
                    <>
                      Discord : <strong key="d">{CONTACT_DISCORD}</strong>
                    </>,
                  ],
                ]}
              />
              <p>
                Conformément à l&apos;article 6-III-2 de la LCEN, l&apos;éditeur, personne physique éditant le site à
                titre non professionnel, a choisi de préserver son anonymat. Ses éléments d&apos;identification ont été
                communiqués à l&apos;hébergeur, auprès duquel ils peuvent être obtenus par l&apos;autorité judiciaire.
              </p>
            </>
          ),
        },
        {
          id: "hebergement",
          title: "Hébergement",
          content: (
            <>
              <InfoList
                items={[
                  ["Hébergeur du site", "Vercel Inc."],
                  ["Adresse", "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"],
                  [
                    "Contact",
                    <a key="v" href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer">
                      vercel.com/contact
                    </a>,
                  ],
                ]}
              />
              <p>
                Les données des comptes (base de données et authentification) sont hébergées par{" "}
                <strong>Supabase Inc.</strong> (
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                  supabase.com
                </a>
                ) sur des serveurs situés dans l&apos;Union européenne (Irlande).
              </p>
            </>
          ),
        },
        {
          id: "service",
          title: "Nature du service",
          content: (
            <>
              <p>
                Promo Tracker est un <strong>comparateur gratuit de promotions de jeux vidéo</strong>.{" "}
                <strong>Aucune transaction n&apos;a lieu sur ce site</strong> : rien n&apos;y est vendu, aucun paiement
                ni coordonnée bancaire n&apos;y est demandé. Chaque offre renvoie vers la boutique officielle concernée,
                seule responsable de la vente.
              </p>
              <p>
                Les prix sont relevés automatiquement une fois par jour auprès des boutiques (Steam, PlayStation Store,
                Xbox Store, Nintendo eShop, Epic Games Store, GOG, CheapShark) ou proposés par les utilisateurs. Ils
                sont donnés <strong>à titre indicatif</strong> et peuvent avoir changé : seul le prix affiché par la
                boutique au moment de l&apos;achat fait foi.
              </p>
              <p>Le site ne perçoit aucune commission et ne contient pas de liens d&apos;affiliation.</p>
            </>
          ),
        },
        {
          id: "propriete",
          title: "Propriété intellectuelle",
          content: (
            <>
              <p>
                Les noms de jeux, marques, logos et visuels (jaquettes, bannières) appartiennent à leurs propriétaires
                respectifs : éditeurs, studios et boutiques. Ils sont affichés uniquement pour identifier les offres et
                sont chargés directement depuis les serveurs des boutiques officielles. Promo Tracker n&apos;est affilié
                à aucune de ces sociétés.
              </p>
              <p>
                La structure du site, ses textes et son code sont la propriété de l&apos;éditeur. Leur reproduction sans
                autorisation est interdite.
              </p>
              <p>
                Pour signaler un contenu qui porterait atteinte à vos droits, contactez l&apos;éditeur sur Discord (
                <strong>{CONTACT_DISCORD}</strong>) : il sera retiré dans les meilleurs délais.
              </p>
            </>
          ),
        },
        {
          id: "donnees",
          title: "Données personnelles et cookies",
          content: (
            <p>
              Le traitement des données personnelles et l&apos;usage des cookies sont décrits dans la{" "}
              <Link href="/confidentialite">politique de confidentialité</Link>. L&apos;utilisation du site est régie
              par les <Link href="/cgu">conditions générales d&apos;utilisation</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
