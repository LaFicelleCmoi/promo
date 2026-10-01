import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_DISCORD, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Confidentialité et cookies — Promo Tracker",
  description: "Données collectées, finalités, durées de conservation, cookies et droits RGPD sur Promo Tracker.",
};

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-slate-300">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Confidentialité et cookies"
      current="/confidentialite"
      intro={
        <p>
          Promo Tracker collecte le strict minimum pour faire fonctionner ton compte, ta wishlist et tes notifications.
          Aucune publicité, aucune mesure d&apos;audience, aucune revente de données.
        </p>
      }
      sections={[
        {
          id: "responsable",
          title: "Responsable du traitement",
          content: (
            <p>
              Le responsable du traitement est l&apos;éditeur du site (voir les{" "}
              <Link href="/mentions-legales">mentions légales</Link>), joignable sur Discord :{" "}
              <strong>{CONTACT_DISCORD}</strong>.
            </p>
          ),
        },
        {
          id: "donnees",
          title: "Données collectées et finalités",
          content: (
            <>
              <p>
                Consulter les promos ne nécessite <strong>aucun compte</strong> et ne collecte aucune donnée
                personnelle. Si tu crées un compte :
              </p>
              <Table
                head={["Données", "Pourquoi", "Base légale"]}
                rows={[
                  [
                    "Adresse email, pseudo, mot de passe (chiffré, jamais lisible)",
                    "Créer ton compte et te connecter",
                    "Exécution du service (CGU)",
                  ],
                  [
                    "Profil : photo d'avatar (facultative), titre, bio, bannière, couleur et préférences d'affichage, plateformes favorites",
                    "Personnaliser ton profil et l'affichage du site",
                    "Exécution du service",
                  ],
                  [
                    "Wishlist : jeux suivis, plateforme, prix cible, préférence de notification",
                    "Afficher tes jeux et te prévenir des promos",
                    "Exécution du service",
                  ],
                  [
                    "Abonnement aux notifications (adresse technique fournie par ton navigateur, par appareil)",
                    "T'envoyer les notifications que tu as activées",
                    "Consentement (autorisation du navigateur)",
                  ],
                  [
                    "Promos que tu proposes (titre, lien, prix, image)",
                    "Les publier pour la communauté",
                    "Exécution du service",
                  ],
                  [
                    "Données techniques (adresse IP, journaux de connexion)",
                    "Sécurité et bon fonctionnement",
                    "Intérêt légitime",
                  ],
                ]}
              />
              <p>Aucune donnée n&apos;est utilisée à des fins publicitaires ni pour du profilage.</p>
            </>
          ),
        },
        {
          id: "conservation",
          title: "Durées de conservation",
          content: (
            <ul>
              <li>
                <strong>Compte, wishlist et notifications</strong> : tant que le compte existe. Tout est effacé
                immédiatement quand tu supprimes ton compte, photo d'avatar comprise. Une ancienne photo est supprimée
                dès que tu en envoies une nouvelle.
              </li>
              <li>
                <strong>Promos proposées</strong> : jusqu&apos;à leur expiration ou leur suppression ; à la suppression
                du compte, elles deviennent anonymes.
              </li>
              <li>
                <strong>Abonnements aux notifications</strong> : supprimés automatiquement dès que l&apos;appareil ne
                les accepte plus (navigateur désinstallé, permission retirée).
              </li>
              <li>
                <strong>Journaux techniques</strong> : durée limitée fixée par les hébergeurs, pour la sécurité.
              </li>
            </ul>
          ),
        },
        {
          id: "destinataires",
          title: "Destinataires et sous-traitants",
          content: (
            <>
              <p>Tes données ne sont ni vendues ni cédées. Elles sont traitées uniquement par :</p>
              <ul>
                <li>
                  <strong>Supabase</strong> : base de données, authentification et stockage des photos d&apos;avatar,
                  serveurs dans l&apos;Union européenne (Irlande).
                </li>
                <li>
                  <strong>Vercel</strong> : hébergement du site (États-Unis), encadré par le cadre de protection des
                  données UE–États-Unis (Data Privacy Framework) et des clauses contractuelles types.
                </li>
                <li>
                  <strong>Services de notification des navigateurs</strong> (Google, Mozilla, Apple, Microsoft) :
                  acheminent les notifications. Le contenu leur est transmis <strong>chiffré</strong>.
                </li>
              </ul>
              <p>
                Les images des jeux sont chargées directement depuis les serveurs des boutiques (Steam, PlayStation,
                Xbox, Nintendo, Epic, GOG…), qui reçoivent donc ton adresse IP comme pour toute image en ligne.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies et stockage local",
          content: (
            <>
              <p>
                Promo Tracker n&apos;utilise <strong>aucun cookie publicitaire ni de mesure d&apos;audience</strong>.
                Aucun bandeau de consentement n&apos;est donc nécessaire : seuls des éléments indispensables au service
                que tu demandes sont utilisés.
              </p>
              <Table
                head={["Nom", "Type", "Rôle", "Durée"]}
                rows={[
                  [
                    <code key="c">sb-…-auth-token</code>,
                    "Cookie",
                    "Garder ta session ouverte une fois connecté (uniquement si tu te connectes)",
                    "Session, renouvelée tant que tu restes connecté",
                  ],
                  [
                    <code key="l">promo-tracker:recent</code>,
                    "Stockage local du navigateur",
                    "Rangée « Vus récemment » : les dernières fiches consultées, jamais envoyées au serveur",
                    "Jusqu'à ce que tu cliques sur « Effacer » ou vides ton navigateur",
                  ],
                  [
                    "Service worker (sw.js)",
                    "Script du navigateur",
                    "Recevoir les notifications, uniquement si tu les as activées",
                    "Jusqu'à la désactivation des notifications",
                  ],
                ]}
              />
            </>
          ),
        },
        {
          id: "droits",
          title: "Tes droits",
          content: (
            <>
              <p>
                Conformément au RGPD et à la loi Informatique et Libertés, tu disposes d&apos;un droit d&apos;accès, de
                rectification, d&apos;effacement, de portabilité, de limitation et d&apos;opposition. Tu peux retirer
                ton consentement aux notifications à tout moment.
              </p>
              <ul>
                <li>
                  <strong>Directement sur le site</strong>, depuis <Link href="/compte">Mon compte</Link> : télécharger
                  toutes tes données (portabilité) ou supprimer ton compte (effacement immédiat).
                </li>
                <li>
                  <strong>Notifications</strong> : désactivables dans <Link href="/wishlist">Ma wishlist</Link> ou dans
                  les réglages de ton navigateur.
                </li>
                <li>
                  <strong>Pour toute autre demande</strong> : Discord <strong>{CONTACT_DISCORD}</strong>. Réponse sous
                  un mois maximum.
                </li>
              </ul>
              <p>
                Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
                  cnil.fr/fr/plaintes
                </a>
                ).
              </p>
            </>
          ),
        },
        {
          id: "securite",
          title: "Sécurité",
          content: (
            <p>
              Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe ne sont jamais stockés en clair.
              L&apos;accès aux données est restreint par des règles de sécurité au niveau de la base : chaque
              utilisateur ne peut lire et modifier que sa propre wishlist.
            </p>
          ),
        },
        {
          id: "mineurs",
          title: "Mineurs",
          content: (
            <p>
              La création d&apos;un compte est réservée aux personnes de 15 ans et plus. En dessous, l&apos;accord
              d&apos;un titulaire de l&apos;autorité parentale est nécessaire (article 45 de la loi Informatique et
              Libertés). La consultation des promos reste libre et sans compte.
            </p>
          ),
        },
      ]}
    />
  );
}
