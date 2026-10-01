import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_DISCORD, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Promo Tracker",
  description: "Conditions générales d'utilisation du comparateur de promos Promo Tracker.",
};

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      current="/cgu"
      intro={
        <p>
          Les présentes conditions encadrent l&apos;utilisation de Promo Tracker. Créer un compte implique de les
          accepter.
        </p>
      }
      sections={[
        {
          id: "objet",
          title: "Objet du service",
          content: (
            <>
              <p>
                Promo Tracker est un service <strong>gratuit</strong> qui recense les promotions de jeux vidéo
                disponibles sur différentes boutiques en ligne, conserve l&apos;historique de leurs prix et permet de
                suivre des jeux (wishlist) avec des notifications.
              </p>
              <p>
                <strong>Aucune transaction n&apos;a lieu sur ce site.</strong> Promo Tracker ne vend aucun produit,
                n&apos;encaisse aucun paiement et ne demande jamais de coordonnées bancaires. Tout achat se fait sur la
                boutique officielle concernée, selon ses propres conditions de vente.
              </p>
            </>
          ),
        },
        {
          id: "acces",
          title: "Accès et compte",
          content: (
            <ul>
              <li>La consultation des promos est libre et ne nécessite pas de compte.</li>
              <li>
                Le compte (wishlist, notifications, proposition de promos) est gratuit et réservé aux personnes de 15
                ans et plus, ou avec l&apos;accord d&apos;un parent.
              </li>
              <li>
                Tu es responsable de la confidentialité de ton mot de passe et des actions faites depuis ton compte.
              </li>
              <li>
                Tu peux supprimer ton compte à tout moment depuis <Link href="/compte">Mon compte</Link>.
              </li>
            </ul>
          ),
        },
        {
          id: "prix",
          title: "Prix et informations affichées",
          content: (
            <>
              <p>
                Les prix sont relevés automatiquement une fois par jour, ou proposés par les utilisateurs. Ils sont
                fournis <strong>à titre indicatif</strong> : une promotion peut avoir changé, être réservée à certains
                pays ou s&apos;être terminée entre deux relevés. Vérifie toujours le prix sur la boutique avant
                d&apos;acheter.
              </p>
              <p>
                Les prix en dollars (USD) sont accompagnés d&apos;une conversion approximative en euros, calculée avec
                le taux de référence de la Banque centrale européenne du jour.
              </p>
            </>
          ),
        },
        {
          id: "contributions",
          title: "Promos proposées par les utilisateurs",
          content: (
            <>
              <p>En proposant une promo, tu t&apos;engages à publier une information :</p>
              <ul>
                <li>exacte et vérifiable sur la boutique au moment de la publication ;</li>
                <li>
                  menant à une boutique légitime, sans lien trompeur, malveillant, d&apos;hameçonnage ou de revente de
                  clés illicites ;
                </li>
                <li>sans contenu illégal, injurieux ou portant atteinte aux droits de tiers.</li>
              </ul>
              <p>
                L&apos;éditeur peut supprimer sans préavis toute promo erronée ou contraire à ces règles, et suspendre
                le compte concerné en cas d&apos;abus. Tu peux signaler un contenu sur Discord (
                <strong>{CONTACT_DISCORD}</strong>).
              </p>
            </>
          ),
        },
        {
          id: "notifications",
          title: "Notifications",
          content: (
            <p>
              Les notifications sont facultatives et s&apos;activent appareil par appareil. Elles sont envoyées au
              mieux, une fois par jour après le relevé des prix ; leur réception n&apos;est pas garantie (appareil
              éteint, navigateur fermé depuis longtemps, restrictions du système). Tu peux les désactiver à tout moment.
            </p>
          ),
        },
        {
          id: "responsabilite",
          title: "Responsabilité",
          content: (
            <>
              <p>
                Le service est fourni « en l&apos;état », sans garantie de disponibilité permanente ni
                d&apos;exhaustivité des promos. L&apos;éditeur ne saurait être tenu responsable :
              </p>
              <ul>
                <li>d&apos;une différence entre un prix affiché et le prix réel pratiqué par une boutique ;</li>
                <li>
                  des ventes, livraisons, remboursements ou litiges avec les boutiques, qui restent seules vendeuses ;
                </li>
                <li>du contenu des sites externes vers lesquels renvoient les liens.</li>
              </ul>
            </>
          ),
        },
        {
          id: "propriete",
          title: "Propriété intellectuelle",
          content: (
            <p>
              Les marques, logos et visuels des jeux et des boutiques appartiennent à leurs propriétaires respectifs et
              sont affichés uniquement pour identifier les offres. Voir les{" "}
              <Link href="/mentions-legales">mentions légales</Link>.
            </p>
          ),
        },
        {
          id: "donnees",
          title: "Données personnelles",
          content: (
            <p>
              Le traitement de tes données est décrit dans la{" "}
              <Link href="/confidentialite">politique de confidentialité</Link>.
            </p>
          ),
        },
        {
          id: "modifications",
          title: "Modification des conditions",
          content: (
            <p>
              Ces conditions peuvent évoluer avec le service. La date de dernière mise à jour figure en haut de la page
              ; en cas de changement important, il sera signalé sur le site.
            </p>
          ),
        },
        {
          id: "droit",
          title: "Droit applicable",
          content: (
            <p>
              Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera
              recherchée en priorité (contact : Discord <strong>{CONTACT_DISCORD}</strong>) avant toute action devant
              les tribunaux compétents.
            </p>
          ),
        },
      ]}
    />
  );
}
