---
title: "Analyser ses Emails avec l'IA : Guide Pratique Claude Code + Gmail"
date: "2025-01-18"
author: "Xavier GUERET"
description: "Tutoriel complet pour créer votre assistant d'analyse d'emails intelligent avec Claude Code. Configuration en 30 minutes, lecture seule, sans risque."
tags:
  - "tutoriel"
  - "claude-code"
  - "gmail-api"
  - "ia"
  - "automatisation"
  - "productivité"
categories:
  - "Tutoriels"
  - "Intelligence Artificielle"
image: "/images/posts/email-with-ia-clauded-code-gmail.png"
draft: false
toc: true
---

## Que permet de faire cet assistant IA d'emails ?

Imaginez pouvoir demander à votre ordinateur :

> *"Trouve tous les emails non lus de cette semaine qui parlent de factures"*
> *"Résume-moi les emails importants d'hier"*
> *"Liste les emails suspects reçus ce mois"*

C'est exactement ce que vous allez construire dans ce tutoriel ! Nous allons créer un assistant personnel qui peut analyser vos emails Gmail en utilisant Claude Code, le tout **en lecture seule** pour une sécurité maximale.

### Pourquoi créer un assistant d'analyse d'emails ?

- **Simple** : Configuration en 30 minutes
- **Sécurisé** : Accès lecture seule uniquement
- **Gratuit** : Utilise l'API Gmail gratuite
- **Puissant** : Intelligence artificielle pour analyser vos emails
- **Révocable** : Vous pouvez couper l'accès en 1 clic

### Ce dont vous avez besoin

- Un compte Gmail
- Un ordinateur Linux (Ubuntu, Debian, Fedora, etc.)
- 30 minutes de votre temps
- Aucune compétence en programmation requise !

## Comment est architecturée cette solution ?

```
     Vos Emails Gmail
           ↓
    [Gmail API - Lecture Seule]
           ↓
      [Serveur MCP]
           ↓
      [Claude Code]
           ↓
    Analyses Intelligentes !
```

**L'idée** : Claude peut "lire" vos emails (mais pas les modifier) et vous aider à les analyser avec l'intelligence artificielle.

**Important** : On commence avec **zéro risque** - Claude ne peut QUE lire. Pas de suppression, pas d'envoi, pas de modification.

## Partie 1 : Préparer Google Cloud (15 minutes)

### Etape 1.1 : Créer Votre Projet

C'est comme créer un "dossier" pour votre projet dans Google Cloud.

1. **Aller sur** : [console.cloud.google.com](https://console.cloud.google.com/)
2. **Se connecter** avec votre compte Gmail
3. **Cliquer** sur le menu déroulant des projets (en haut)
4. **Cliquer** sur "Nouveau projet"

**Remplir** :

- Nom : `Mon Assistant Email` (ou ce que vous voulez)
- Cliquer "Créer"

Attendre 20 secondes... et voilà, votre projet est créé !

### Etape 1.2 : Activer l'API Gmail

Maintenant on "allume" l'API Gmail pour pouvoir lire vos emails.

1. **Dans le menu** → Cliquer "APIs et Services" → "Bibliothèque"
2. **Rechercher** : `Gmail API`
3. **Cliquer** dessus
4. **Cliquer** sur le gros bouton bleu "ACTIVER"

Terminé ! Vous verrez "API activée"

### Etape 1.3 : Configurer les Permissions (Important !)

Ici on dit à Google : "Je veux seulement LIRE mes emails, rien d'autre".

**Navigation** : Menu → APIs et Services → Ecran de consentement OAuth

**Choisir** :

- Type : **Externe**
- Cliquer "Créer"

**Page 1 - Les infos de base** :

Remplir simplement :

- Nom de l'application : `Mon Assistant Email`
- E-mail assistance : votre.email@gmail.com
- E-mail développeur : votre.email@gmail.com

Le reste ? Laissez vide !

Cliquer "Enregistrer et continuer"

**Page 2 - Les permissions (LA partie importante !)** :

1. Cliquer "Ajouter ou supprimer des champs d'application"
2. Une fenêtre s'ouvre
3. **Rechercher** : `gmail.readonly`
4. **Cocher UNIQUEMENT** cette case :
   ```
   https://www.googleapis.com/auth/gmail.readonly
   ```

**SUPER IMPORTANT** : Ne cochez QUE celle-là ! C'est votre garantie que Claude ne peut que LIRE.

5. Cliquer "Mettre à jour"
6. Cliquer "Enregistrer et continuer"

**Page 3 - Vous ajouter comme testeur** :

1. Cliquer "+ Ajouter des utilisateurs"
2. Entrer votre email Gmail
3. Cliquer "Ajouter"
4. Cliquer "Enregistrer et continuer"

**Page 4 - Résumé** :

Vérifier que tout est bon, puis "Retour au tableau de bord"

### Etape 1.4 : Télécharger Votre "Clé"

Maintenant on récupère un fichier qui permet à votre ordinateur de se connecter.

1. **Menu** → APIs et Services → **Identifiants**
2. Cliquer le gros bouton "+ CRÉER DES IDENTIFIANTS"
3. Choisir "ID client OAuth 2.0"

**Configurer** :

- Type : **Application de bureau**
- Nom : `Assistant Email Local`
- Cliquer "Créer"

**Une fenêtre apparaît** :

- Cliquer "TÉLÉCHARGER JSON"
- Le fichier se télécharge (nommé quelque chose comme `client_secret_xxx.json`)
- Cliquer "OK"

**Bravo !** Partie Google Cloud terminée. Le plus dur est fait !

---

## Partie 2 : Installation sur Votre Ordinateur (10 minutes)

### Etape 2.1 : Vérifier les Prérequis

Ouvrez un terminal et tapez :

```bash
# Vérifier Node.js (devrait afficher v18 ou plus)
node --version

# Vérifier pnpm
pnpm --version

# Vérifier Claude Code
claude --version
```

**Pas installé ?** Pas de panique :

```bash
# Installer Node.js via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts

# Installer pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Installer Claude Code
npm install -g @anthropic-ai/claude-code
```

### Etape 2.2 : Créer les Dossiers

On crée une "maison" pour notre projet :

```bash
# Créer les dossiers
mkdir -p ~/mon-assistant-email
mkdir -p ~/.config/gmail-assistant/creds

# Sécuriser (personne d'autre ne peut voir)
chmod 700 ~/.config/gmail-assistant
```

### Etape 2.3 : Ranger le Fichier Téléchargé

Vous vous souvenez du fichier `client_secret_xxx.json` ? On le range :

```bash
# Le déplacer (ajustez le chemin si besoin)
mv ~/Téléchargements/client_secret_*.json \
   ~/.config/gmail-assistant/creds/credentials.json

# Le protéger (lecture seule pour vous)
chmod 600 ~/.config/gmail-assistant/creds/credentials.json

# Vérifier
ls -la ~/.config/gmail-assistant/creds/
# Vous devriez voir : -rw------- credentials.json
```

### Etape 2.4 : Créer le Code du Serveur

On va créer un petit programme qui fait le pont entre Claude et Gmail.

```bash
cd ~/mon-assistant-email

# Créer le fichier de configuration
cat > package.json << 'EOF'
{
  "name": "assistant-email",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "googleapis": "^140.0.0",
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
EOF

# Installer les dépendances
pnpm install
```

**Créer le serveur** (copier-coller tout ce bloc) :

```bash
cat > server.js << 'EOFSRV'
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// LECTURE SEULE - C'est notre garantie sécurité !
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = join(homedir(), '.config/gmail-assistant/creds/token.json');
const CREDENTIALS_PATH = join(homedir(), '.config/gmail-assistant/creds/credentials.json');

class AssistantEmail {
  constructor() {
    this.server = new Server(
      { name: 'assistant-email', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupTools();
    this.gmail = null;
  }

  async authorize() {
    const credentials = JSON.parse(await readFile(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {
      const token = await readFile(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      return await this.getNewToken(oAuth2Client);
    }
    return oAuth2Client;
  }

  async getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.error('\n Première connexion - Autorisation nécessaire\n');
    console.error('1. Ouvrez cette URL dans votre navigateur :');
    console.error(`   ${authUrl}\n`);
    console.error('2. Connectez-vous et autorisez');
    console.error('3. Copiez le code que vous recevez\n');
    console.error('Entrez le code ici : ');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    return new Promise((resolve, reject) => {
      rl.question('', async (code) => {
        rl.close();
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          await writeFile(TOKEN_PATH, JSON.stringify(tokens));
          console.error('\n Parfait ! Vous êtes connecté.\n');
          resolve(oAuth2Client);
        } catch (err) {
          console.error('\n Oups, erreur :', err.message);
          reject(err);
        }
      });
    });
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'lister_emails',
          description: 'Liste vos emails Gmail',
          inputSchema: {
            type: 'object',
            properties: {
              nombre: { type: 'number', description: 'Nombre d\'emails (max 100)', default: 10 },
              recherche: { type: 'string', description: 'Recherche Gmail (ex: "is:unread")' },
            },
          },
        },
        {
          name: 'chercher_emails',
          description: 'Recherche des emails spécifiques',
          inputSchema: {
            type: 'object',
            properties: {
              recherche: { type: 'string', description: 'Votre recherche' },
              nombre: { type: 'number', default: 10 },
            },
            required: ['recherche'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      if (!this.gmail) {
        const auth = await this.authorize();
        this.gmail = google.gmail({ version: 'v1', auth });
      }

      const args = request.params.arguments;
      const maxResults = Math.min(args.nombre || args.maxResults || 10, 100);
      const query = args.recherche || args.query || '';

      const res = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = res.data.messages || [];
      const details = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = detail.data.payload.headers;
          return {
            id: msg.id,
            de: headers.find((h) => h.name === 'From')?.value,
            sujet: headers.find((h) => h.name === 'Subject')?.value,
            date: headers.find((h) => h.name === 'Date')?.value,
          };
        })
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(details, null, 2) }],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Assistant Email prêt (lecture seule)\n');
  }
}

const assistant = new AssistantEmail();
assistant.run().catch(console.error);
EOFSRV

# Rendre exécutable
chmod +x server.js
```

---

## Partie 3 : Connecter à Claude (5 minutes)

### Etape 3.1 : Une Seule Commande !

C'est la partie la plus simple. Une seule ligne de commande :

```bash
claude mcp add gmail /usr/bin/node ~/mon-assistant-email/server.js
```

**Vérifier que ça a marché** :

```bash
claude mcp list

# Vous devriez voir :
# gmail: /usr/bin/node /home/[vous]/mon-assistant-email/server.js
```

### Etape 3.2 : Première Connexion

**Lancer Claude** :

```bash
claude
```

**Ce qui va se passer** :

1. Un message s'affiche avec une longue URL
2. Vous copiez cette URL
3. Vous l'ouvrez dans votre navigateur
4. Vous vous connectez à Gmail
5. Google vous dit : "Attention, application non vérifiée"
   - Cliquez "Paramètres avancés"
   - Cliquez "Accéder à [votre app] (non sécurisé)"
6. Google montre : "Afficher vos e-mails" (c'est bien LECTURE SEULE)
7. Cliquez "Autoriser"
8. Google vous donne un code
9. Vous le copiez
10. Vous le collez dans le terminal Claude
11. Appuyez sur Entrée

**Message de succès** :

```
Parfait ! Vous êtes connecté.
Assistant Email prêt (lecture seule)
```

---

## Partie 4 : Utiliser Votre Assistant (La Partie Fun !)

### Premier Test : Liste Simple

Dans Claude, tapez simplement :

```
Liste mes 5 derniers emails
```

**Résultat** : Claude vous montre vos 5 derniers emails avec expéditeur et sujet !

### Exemples Pratiques

#### Retrouver un Email

```
Trouve l'email de Marie de la semaine dernière
```

#### Résumé Quotidien

```
Résume-moi les emails importants d'aujourd'hui
```

#### Recherche Avancée

```
Cherche tous les emails non lus qui contiennent "facture"
```

#### Organisation

```
Liste les emails de cette semaine, groupés par expéditeur
```

#### Détection Simple

```
Y a-t-il des emails suspects reçus aujourd'hui ?
```

### Prompts Plus Avancés

Une fois à l'aise, essayez :

```
Analyse mes 20 derniers emails et dis-moi :
1. Lesquels nécessitent une réponse urgente
2. Lesquels sont des newsletters
3. Lesquels contiennent des pièces jointes

Fais un petit résumé pour chaque catégorie.
```

Ou encore :

```
Parmi mes emails de cette semaine :
- Trouve ceux qui parlent de réunions
- Extrais les dates et heures mentionnées
- Fais-moi un planning

Format : liste claire et simple
```

---

## Sécurité : Ce Que Vous Devez Savoir

### Ce Que Claude PEUT Faire

- Lire vos emails
- Chercher dans votre boîte
- Analyser le contenu
- Vous faire des résumés

### Ce Que Claude NE PEUT PAS Faire

- Envoyer des emails
- Supprimer des emails
- Modifier des emails
- Transférer des emails
- Créer des brouillons

**Pourquoi ?** Parce qu'on a configuré `gmail.readonly` - lecture seule !

### Révoquer l'Accès (Si Besoin)

Vous voulez couper l'accès ? **2 clics** :

1. Aller sur : [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Trouver "Mon Assistant Email"
3. Cliquer "Supprimer l'accès"

**Effet immédiat** - Claude ne peut plus lire vos emails.

### Voir Ce Qui Se Passe

Google vous montre tout :

- **Quand** Claude accède à vos emails
- **Combien** de fois
- **Quel type** d'accès (toujours "lecture")

Allez voir sur : [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Dashboard

---

## Cas d'Usage Pratiques

### 1. Productivité Quotidienne

**Le matin** :

```
Résume les emails importants reçus cette nuit
```

**Fin de journée** :

```
Quels emails attendent encore une réponse ?
```

### 2. Organisation

```
Trouve tous les emails de mon boss ce mois-ci et
résume les points d'action demandés
```

### 3. Recherche Historique

```
En 2024, combien d'emails j'ai reçus de [entreprise] ?
Quel était le sujet principal ?
```

### 4. Nettoyage

```
Liste toutes les newsletters que je reçois régulièrement.
Montre-moi celles que je n'ouvre jamais.
```

### 5. Analyse Simple

```
Parmi mes 50 derniers emails, lesquels ont l'air bizarres ou suspects ?
Explique pourquoi pour chacun.
```

---

## Dépannage

### Problème : Claude ne voit pas Gmail

**Solution** :

```bash
# Vérifier la config
claude mcp list

# Si vide, refaire :
claude mcp add gmail /usr/bin/node ~/mon-assistant-email/server.js
```

### Problème : "Token expiré"

**Solution** :

```bash
# Supprimer le token
rm ~/.config/gmail-assistant/creds/token.json

# Relancer Claude
claude
# Le processus d'autorisation recommence
```

### Problème : "Permission denied"

**Solution** :

```bash
# Vérifier les permissions
chmod 600 ~/.config/gmail-assistant/creds/credentials.json
chmod +x ~/mon-assistant-email/server.js
```

---

## Conseils et Astuces

### Rendre Claude Plus Efficace

**Soyez précis** :

- "Trouve mes emails" (trop vague)
- "Trouve les emails de cette semaine avec 'projet' dans le sujet" (bien mieux)

**Demandez des formats** :

```
Liste mes emails en format tableau avec :
- Date
- Expéditeur
- Sujet court
```

**Itérez** :

```
Première demande : "Liste mes emails d'aujourd'hui"
Affinage : "Maintenant, montre seulement ceux du client X"
```

### Créer des Routines

**Routine du matin** :

```
Fais-moi mon briefing email du jour :
1. Nombre total de nouveaux emails
2. Top 3 des plus importants
3. Ceux qui nécessitent une réponse rapide
4. Newsletters à lire plus tard

Format : concis et actionnable
```

**Routine du vendredi** :

```
Résumé de la semaine :
- Quels sujets sont revenus souvent ?
- Qui m'a le plus écrit ?
- Y a-t-il des emails sans réponse ?
```

---

## Le rôle du vibecoding dans ce projet

Ce tutoriel est lui-même un exemple concret de vibecoding — cette approche qui consiste à construire du logiciel en conversant avec une IA en langage naturel. L'intégralité du serveur MCP, la configuration OAuth, les exemples de prompts et même la structure de cet article ont été conçus en collaboration avec Claude Code. Plutôt que d'écrire chaque ligne de code à la main, j'ai décrit ce que je voulais obtenir, itéré sur les retours, et affiné le résultat par conversation. Le vibecoding ne remplace pas la compréhension technique — il faut toujours savoir ce qu'on construit et pourquoi — mais il accélère considérablement la mise en œuvre quand on a une vision claire du résultat attendu.

## Checklist Finale

Vous avez réussi si :

- [ ] Projet créé sur Google Cloud
- [ ] Gmail API activée
- [ ] OAuth configuré (lecture seule uniquement)
- [ ] Credentials téléchargés et sécurisés
- [ ] Serveur MCP installé
- [ ] Claude connecté (`claude mcp list` fonctionne)
- [ ] Premier test réussi (liste d'emails)
- [ ] Vous savez révoquer l'accès si besoin

---

## Félicitations !

Vous avez créé votre propre assistant d'analyse d'emails avec l'IA !

**Vous savez maintenant** :

- Configurer l'API Gmail en lecture seule
- Connecter Claude Code à vos emails
- Analyser vos emails avec l'intelligence artificielle
- Contrôler l'accès et la sécurité

**Prochaines étapes** :

1. Expérimentez avec différents prompts
2. Créez vos propres routines
3. Partagez vos découvertes

**Besoin d'aide ?**

- Documentation Claude : [docs.claude.com](https://docs.claude.com)
- Gmail API : [developers.google.com/gmail](https://developers.google.com/gmail)
- Communauté : Reddit r/ClaudeAI

---

**Auteur** : Xavier GUERET & claude
**Date** : 18 janvier 2025
**Licence** : MIT

**Tags** : #tutoriel #claude-code #gmail #ia #automatisation #débutant

---

*Ce tutoriel vous montre comment accéder à vos propres données Gmail de manière sécurisée. Respectez toujours la vie privée des autres et les conditions d'utilisation des services.*
