---
title: "Comment un LLM fabrique un mot"
date: "2026-07-12"
author: "Xavier GUERET"
description: "Un LLM ne fait qu'une seule chose : prédire le prochain mot, en boucle. Premier volet de la série « Du token au chatbot » — tokens, embeddings, logits et softmax, avec de vraies manips Python pour voir GPT-2 hésiter puis choisir « Paris »."
tags:
  - "LLM"
  - "Python"
  - "Hugging Face"
  - "ia"
  - "tokenisation"
  - "tutoriel"
categories:
  - "Du token au chatbot"
  - "Tutoriels"
  - "Intelligence Artificielle"
image: "/images/posts/llm-01-comment-un-llm-fabrique-un-mot.png"
draft: false
toc: true
series: "Du token au chatbot"
seriesOrder: 1
---
*Épisode 1 de la série **« Du token au chatbot »** — un parcours pratique qui va de la mécanique interne d'un LLM jusqu'à construire son propre chatbot.*

> Un LLM (*Large Language Model*, grand modèle de langage) semble magique : il écrit, code, traduit, raisonne. Dans cet article, tu vas découvrir qu'il ne fait, en réalité, qu'**une seule chose** — et la répéter. À la fin, tu auras vu de tes yeux, dans ton terminal, un vrai modèle « hésiter » entre plusieurs mots et en choisir un. Ce moment-là, c'est celui où la magie devient mécanique compréhensible. Tout le reste de la série (attention, prompts, API, chatbot) repose sur ce que tu apprends ici.

> 📌 **Pour qui** : tu es à l'aise en Python, mais tu débutes totalement sur les LLM. Aucune connaissance en machine learning n'est supposée. On avance **par très petits pas**, chaque notion est définie à sa première apparition, et tout tourne **en local et gratuitement** (les API arrivent plus loin dans la série).

> 💻 **Prérequis matériel** : les manips de base tournent en **CPU** sur n'importe quel ordinateur récent — GPT-2 est minuscule, un GPU n'apporterait rien. Une **Partie D bonus** (facultative) exploite un **GPU NVIDIA compatible CUDA** (idéalement 8 Go de VRAM ou plus) pour faire tourner un vrai modèle moderne via Hugging Face. Tu n'as donc rien à activer pour les bases ; le GPU n'entre en jeu qu'au bonus, et tout le cœur de l'article reste faisable sans lui.

> ⏱️ **Durée** : prévois 2 à 3 h, sans te presser. Mieux vaut faire chaque manip et comprendre, que tout lire vite. Tu peux couper après la Partie B (le cœur) et garder les Parties C et D pour une 2ᵉ session.

---

## 🎯 Objectifs d'apprentissage

À la fin de cet article, tu seras capable de :

1. **Énoncer en une phrase** l'unique opération que répète tout LLM.
2. **Expliquer** ce qu'est un token et pourquoi on ne compte pas en mots ni en lettres.
3. **Lire** la sortie réelle d'un modèle (les probabilités du prochain mot) et l'interpréter.
4. **Écrire toi-même** la petite boucle qui transforme « un mot » en « une phrase ».
5. **Distinguer** une réponse déterministe d'une réponse variée, et savoir d'où vient la différence.

> 🧠 Garde ces 5 objectifs en tête. À la toute fin, tu reviendras les cocher un par un.

---

## 🧭 Prérequis et préparation

**Ce qu'il te faut savoir** : lancer un script Python. C'est tout.

**L'outil qu'on utilise pour tout le parcours : `uv`.** `uv` est un gestionnaire de projets et de paquets Python moderne (ultra rapide). Il remplace `pip` + `venv` : il crée pour toi un environnement isolé, suit tes dépendances dans un fichier `pyproject.toml`, et exécute tes scripts dans le bon environnement. **Toutes les commandes de cette série passeront par `uv`** — c'est une bonne habitude qui prépare le vrai projet (le chatbot qui clôt la série).

#### Étape 0 — installer `uv` (une seule fois sur ta machine)

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme puis rouvre ton terminal, et vérifie :

```bash
uv --version
```

> ✅ **Checkpoint** : une ligne du type `uv 0.x.y` s'affiche. Si la commande n'est pas trouvée, va voir « 🔧 Si l'installation coince » en bas.

#### Étape 1 — créer le projet

On crée **un seul projet** qui servira tout au long du parcours. `uv` y gère un environnement Python isolé automatiquement.

```bash
uv init llm-formation        # crée le dossier du projet (avec pyproject.toml)
cd llm-formation             # on se place dedans : TOUTES les commandes suivantes s'y lancent
```

> 📌 **À retenir** : à partir d'ici, tu travailles **toujours depuis le dossier `llm-formation/`**. C'est `uv` qui gère l'environnement isolé — tu n'as **rien** à activer ni à configurer à la main.

#### Étape 2 — ajouter la 1ʳᵉ dépendance

On y va en deux temps pour éviter les ennuis. On commence par la plus légère ; on ajoutera les plus lourdes au moment où on en aura besoin (Partie B). Comme ça, si quelque chose coince, tu sauras exactement quelle étape est en cause.

```bash
uv add tiktoken              # ajoute la dépendance au projet (suivie dans pyproject.toml)
```

> 💡 **Comment on lancera les scripts** : avec `uv run`, qui exécute ton script **dans l'environnement du projet** (avec les bonnes dépendances), sans que tu aies à activer quoi que ce soit. Par exemple `uv run manip1.py`. On crée nos fichiers `manip1.py`, `manip2.py`… **dans le dossier `llm-formation/`** ; tu y reviendras dans l'épisode sur les réglages de génération.

> ⚠️ **Avant de râler sur une erreur** : une section complète de dépannage t'attend tout en bas (« 🔧 Si l'installation coince »). La 1ʳᵉ récupération de PyTorch (Partie B) est lourde (plusieurs centaines de Mo) et c'est normal. On en reparle le moment venu.

---

## 🗺️ Vue d'ensemble : la seule idée de la journée

Si tu ne devais retenir qu'une phrase aujourd'hui, ce serait celle-ci :

> 📌 **Point clé** : un LLM est une fonction qui **prédit le mot suivant**. Il regarde le texte jusqu'ici, devine la suite la plus plausible, l'ajoute, puis recommence avec le texte allongé. C'est tout. Le « raisonnement », le code, la traduction : tout **émerge** de cette boucle répétée des milliards de fois.

Voici le trajet complet d'un texte à l'intérieur du modèle. Ne cherche pas à tout comprendre maintenant — c'est la carte du voyage, on visitera chaque étape :

```text
   "The capital of France is"
              │
              ▼
   ┌──────────────────────┐   PARTIE A
   │   1. TOKENISATION     │   on découpe le texte en petits morceaux ("tokens")
   └──────────────────────┘   et on les transforme en nombres
              │
              ▼
   ┌──────────────────────┐
   │   2. CERVEAU DU       │   les morceaux sont transformés et "se parlent"
   │      MODÈLE           │   (on ouvrira cette boîte au prochain épisode —
   └──────────────────────┘    aujourd'hui on la traite comme une boîte noire)
              │
              ▼
   ┌──────────────────────┐   PARTIE B  ← LE CŒUR D'AUJOURD'HUI
   │   3. UN SCORE PAR     │   le modèle note CHAQUE mot possible du vocabulaire
   │      MOT POSSIBLE     │   ("Paris" 87%, "the" 4%, "très" 0,1%, ...)
   └──────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │   4. ON CHOISIT       │   on pioche un mot dans cette liste de scores
   │      UN MOT           │   → "Paris"
   └──────────────────────┘
              │
              └──────────►  on remet "Paris" à la fin du texte, et on RECOMMENCE
                            (c'est ça, "générer une phrase")
```

> 📌 **Comment lire cet article** : il est découpé en quatre parties.
> - **Partie A** — le texte devient des nombres (les *tokens*).
> - **Partie B** — le modèle note les mots et en choisit un. **C'est le cœur, le moment eurêka.**
> - **Partie C** — pour aller un cran plus loin (facultatif en 1ʳᵉ session).
> - **Partie D** — bonus : réveille ton **GPU** avec un vrai modèle moderne (facultatif, recommandé si tu as une carte NVIDIA).

#### 🧵 Notre fil rouge pour toute la journée : « Paris »

Pour ne jamais rester dans l'abstrait, on suit **un seul exemple** du début à la fin. Notre cobaye : la phrase

> **« The capital of France is »** *(en anglais — on verra pourquoi ça compte)*

À chaque étape, on regarde ce qui lui arrive concrètement. Objectif final : voir un vrai modèle compléter cette phrase par « Paris », et comprendre *exactement* comment il y arrive. Petit défi : garde en tête cette question — *à quel moment précis le modèle « décide »-t-il que c'est Paris ?* La réponse va te surprendre.

---
---

## PARTIE A — Le texte devient des nombres

Un ordinateur ne manipule que des nombres. Première mission, donc : transformer du texte en nombres. C'est plus subtil qu'il n'y paraît, et ça a des conséquences très concrètes (jusque sur ta facture quand tu utiliseras une API).

### A.1 — Le token : le vrai « morceau » que voit le modèle

> ❓ **Question d'ouverture** (réfléchis 10 secondes avant de lire la suite) : à ton avis, un LLM lit-il lettre par lettre ? mot par mot ? Et « bonjour » vs « Bonjour » : pareil ou différent pour lui ?

#### Le pourquoi : un compromis nécessaire

Le modèle doit découper n'importe quel texte en morceaux réutilisables. Deux idées simples viennent à l'esprit, et toutes deux échouent :

- **Découper en lettres** ? Les séquences deviennent énormes (un paragraphe = des milliers de lettres) et on perd la notion de mot.
- **Découper en mots entiers** ? Il faudrait un dictionnaire géant, et le modèle bloquerait sur tout mot rare, inventé ou mal orthographié.

La solution retenue est un **entre-deux** : le **token**. Un token est un fragment de texte — parfois un mot entier (« the »), parfois un bout de mot, parfois juste quelques caractères. En moyenne, un token ≈ 4 caractères en anglais.

#### L'analogie : les briques LEGO

Tu ne construis pas une maison avec de la poudre de plastique (les lettres : trop fin) ni avec des maisons déjà montées (les mots entiers : trop rigide). Tu construis avec des **briques de tailles variées**. Les briques les plus courantes (le petit 2×2) sont prêtes à l'emploi ; les formes rares, tu les assembles à partir de plusieurs briques. Pareil pour le texte : un mot fréquent = une brique, un mot rare = plusieurs briques.

#### Comment les briques sont fabriquées (en bref)

La méthode s'appelle **BPE** (*Byte-Pair Encoding*, « encodage par paires d'octets »). Tu n'as pas besoin d'en maîtriser les rouages aujourd'hui, juste l'idée :

1. on part des caractères seuls ;
2. on **fusionne** la paire de caractères/fragments la **plus fréquente** dans un immense corpus de textes ;
3. on répète des dizaines de milliers de fois, jusqu'à obtenir un « vocabulaire » de tokens (souvent ~100 000).

Conséquence : ce n'est **pas** de la grammaire, c'est de la **statistique**. Les fragments les plus courants dans les textes deviennent des tokens uniques.

#### 🔬 Manip 1 — vois les tokens de tes propres yeux

Crée `manip1.py` :

```python
# manip1.py — observer comment le texte est découpé en tokens
import tiktoken

# On charge le "découpeur" (tokenizer) utilisé par la famille GPT-3.5 / GPT-4
enc = tiktoken.get_encoding("cl100k_base")

mots = ["the", "transformer", "anticonstitutionnellement", "GPT", " espace_avant"]
for mot in mots:
    ids = enc.encode(mot)                       # texte  -> liste de numéros (token IDs)
    morceaux = [enc.decode([i]) for i in ids]   # on redécode chaque numéro tout seul
    print(f"{mot!r:30} -> {len(ids)} token(s) : {morceaux}")
```

Lance-le (depuis le dossier `llm-formation/`) : `uv run manip1.py`

> ✅ **Checkpoint** — tu devrais voir quelque chose comme :
> - `"the"` → **1 token**
> - `"transformer"` → 1 ou 2 tokens
> - `"anticonstitutionnellement"` → **4 ou 5 tokens** (mot rare, surtout en français → fragmenté)
> - `" espace_avant"` → regarde bien : l'**espace est collé** au premier morceau !
>
> Si tu vois ça, tu as compris l'essentiel : **les mots fréquents tiennent en un token, les mots rares se cassent en plusieurs, et les espaces font partie des tokens.**

#### Trois conséquences que tu rencontreras vraiment

> 📌 **Point clé** :
> 1. **On facture au token** (entrée + sortie), jamais au mot ni au caractère. Ta future facture d'API dépend du nombre de tokens.
> 2. La **fenêtre de contexte** (tout ce que le modèle peut « voir » d'un coup) se mesure en tokens (ex. « 200 000 tokens »).
> 3. Le **français coûte souvent plus cher** que l'anglais : moins présent dans les corpus d'entraînement, il se fragmente en davantage de tokens pour dire la même chose.

#### Le contre-exemple qui fait mal : compter les caractères

Beaucoup de débutants estiment un coût ou une taille en comptant les **caractères**. Mauvaise idée :

```python
# Ajoute ceci à la fin de manip1.py
texte = "anticonstitutionnellement " * 100
print("\nNombre de caractères :", len(texte))                 # paraît "petit"
print("Nombre de TOKENS      :", len(enc.encode(texte)))      # bien plus élevé
```

Le compte de caractères **sous-estime systématiquement** le coût pour du texte riche en mots rares ou en français. **Toujours raisonner en tokens.**

#### 🧵 « Paris » — étape 1 : notre phrase entre dans la machine

```python
# Ajoute ceci à la fin de manip1.py
phrase = "The capital of France is"
ids = enc.encode(phrase)
print("\nNotre fil rouge :")
print("  IDs    :", ids)
print("  Tokens :", [enc.decode([i]) for i in ids])
# Attendu : ['The', ' capital', ' of', ' France', ' is']  -> 5 tokens (espaces inclus)
```

Retiens bien : **c'est cette liste de numéros, et non la phrase, qui va entrer dans le modèle.** Le modèle ne verra jamais « France », il verra le numéro du token ` France`.

#### ✍️ À toi de jouer

1. Avec tes propres mots : pourquoi un token n'est-il ni une lettre, ni un mot ?
2. **Prédis avant de tester** : « chat » et « chats » donneront-ils le même token ? Vérifie avec `enc.encode`.
3. Encode `"Paris"` puis `" Paris"` (avec un espace devant). Mêmes numéros ou différents ? En quoi est-ce utile à savoir quand tu écriras un prompt ?

<details>
<summary>👉 Voir les réponses</summary>

1. Le token est un **compromis statistique**. La lettre donnerait des séquences interminables et ferait perdre le sens des mots ; le mot entier exigerait un dictionnaire géant et échouerait sur tout mot rare ou inconnu. Le token capture les fragments **les plus fréquents** des textes, avec une taille variable.
2. **Différents.** « chats » est souvent un token distinct, ou bien « chat » + « s ». Le modèle ne « sait » pas par une règle que c'est un pluriel : il l'a appris statistiquement. Toute variation (majuscule, pluriel, accent) peut changer le découpage.
3. **Numéros différents** : l'espace initial fait partie du token, donc `"Paris"` ≠ `" Paris"`. C'est utile car la façon dont tu colles ou espaces les mots dans un prompt **change littéralement** ce que le modèle reçoit. Un simple détail de mise en forme peut donc influencer la réponse.

</details>

**Mini-résumé de A.1**
- Le modèle voit des **tokens** (fragments d'environ 4 caractères), pas des lettres ni des mots.
- Mots fréquents = 1 token ; mots rares = plusieurs. Espaces et majuscules comptent.
- On compte, on facture et on mesure le contexte **en tokens** — jamais en caractères.

---

### A.2 — Du numéro au « sens » : l'embedding (en douceur)

> ❓ **Question d'ouverture** : le token ` France` est devenu un numéro, disons 6342. Le modèle peut-il « réfléchir » avec un numéro de série ? Que manque-t-il pour qu'un nombre porte du *sens* ?

#### Le pourquoi : un numéro ne veut rien dire

Le numéro 6342 est **arbitraire**. Il n'est pas « plus proche » de 6343 que de 12. Si le modèle calculait directement avec ces numéros, « France » et « Allemagne » n'auraient aucune raison d'être traités comme proches. Il faut donc remplacer chaque numéro par quelque chose de **riche et comparable**.

Cette chose, c'est l'**embedding** : une **liste de nombres** (par exemple 768 valeurs) attachée à chaque token. Cette liste, c'est la « carte d'identité numérique » du token.

#### L'analogie : une carte du sens

Imagine une immense carte géographique, mais des mots. Chaque mot y est un point. Sur cette carte, « roi » et « reine » sont voisins ; « roi » et « banane » sont aux antipodes ; « Paris », « Londres » et « Tokyo » forment un petit quartier « capitales ». Les **coordonnées** d'un mot sur cette carte = son embedding.

> 💡 **L'idée à retenir** : transformer un numéro en embedding, c'est **placer le mot sur la carte du sens**. Et le génie, c'est que ces coordonnées sont **apprises** : pendant son entraînement, le modèle a placé tout seul les mots de façon que les sens proches soient proches.

#### 🔬 Manip 2 — « le sens devient de la géométrie »

Cette manip a un seul but : te faire **sentir** que des mots proches en sens sont proches en distance. On utilise un petit modèle dédié (léger, gratuit).

```bash
uv add sentence-transformers numpy
```

> ⚠️ Cette installation est un peu plus lourde (elle embarque PyTorch). Première fois = quelques minutes, c'est normal. Si ça coince, va voir « 🔧 Si l'installation coince » en bas.

```python
# manip2.py — montrer que la proximité de sens = proximité géométrique
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")   # petit modèle, gratuit, tourne en local

mots = ["roi", "reine", "homme", "femme", "banane"]
vecs = model.encode(mots)   # chaque mot -> une liste de nombres (son embedding)

def proximite(a, b):
    # similarité cosinus : 1 = très proches, 0 = sans rapport
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

print("roi  vs reine  :", round(proximite(vecs[0], vecs[1]), 3))   # devrait être ÉLEVÉ
print("roi  vs banane :", round(proximite(vecs[0], vecs[4]), 3))   # devrait être BAS
```

> ✅ **Checkpoint** : `roi vs reine` doit donner un nombre nettement plus grand que `roi vs banane`. Si c'est le cas : tu viens de **mesurer du sens avec une distance**. Les mots ne sont plus des étiquettes, ce sont des positions, et la position encode le sens.

> ⚠️ **Piège fréquent — une nuance honnête** : ce petit modèle produit un embedding **par phrase entière**, déjà « contextualisé ». Dans un vrai LLM, l'embedding de départ est **par token** et **pas encore contextualisé** : à ce stade, les tokens ne se sont pas encore « parlé ». C'est justement le rôle du « cerveau du modèle » (prochain épisode) de faire circuler le contexte. **Ce qu'il faut retenir aujourd'hui** : l'intuition « sens = position sur une carte ». La mécanique exacte viendra plus tard.

#### 🧵 « Paris » — étape 2

Nos 5 tokens (`The`, ` capital`, ` of`, ` France`, ` is`) deviennent chacun une liste de nombres. À cet instant précis, le vecteur de ` France` « connaît » le sens général de France, mais **ne sait pas encore** qu'on s'intéresse à sa capitale. Aucun token ne s'est encore parlé. Retiens cette frustration : c'est exactement ce que le prochain épisode viendra résoudre.

#### ✍️ À toi de jouer

1. Pourquoi ne peut-on pas faire entrer le simple numéro d'un token (ex. 6342) dans les calculs du modèle ?
2. Ajoute `"Paris"` et `"Tokyo"` à la liste de `manip2.py`. Compare `proximite("roi","Paris")` et `proximite("Paris","Tokyo")`. Qu'observes-tu, et pourquoi ?

<details>
<summary>👉 Voir les réponses</summary>

1. Parce qu'un numéro de token est **arbitraire** : sa valeur ne reflète aucune ressemblance de sens. L'embedding le remplace par une **liste de nombres apprise** où la proximité reflète une similarité de sens ou d'usage — ce qui rend les calculs du modèle porteurs de sens.
2. « Paris » et « Tokyo » (deux capitales) devraient être **plus proches l'un de l'autre** que « roi » et « Paris ». Le modèle a observé que les noms de villes s'emploient dans des contextes similaires, donc il les a placés dans le même « quartier » de la carte.

</details>

**Mini-résumé de A.2**
- Un **embedding** remplace le numéro d'un token par une **liste de nombres** : sa position sur la « carte du sens ».
- Ces positions sont **apprises** ; proximité sur la carte ≈ proximité de sens.
- Au départ, les tokens ne se sont pas encore « parlé » : ça, c'est le travail du prochain épisode.

---
---

## PARTIE B — Le modèle note les mots et en choisit un (LE CŒUR)

C'est ici que tout se joue. Tu vas voir la **vraie sortie** d'un vrai modèle, et écrire toi-même la boucle qui fabrique une phrase. Si tu ne fais qu'une seule chose aujourd'hui, fais cette partie.

### B.1 — Installer le nécessaire (et comprendre ce qu'on installe)

On va charger un vrai (petit) LLM nommé **GPT-2**. Il est ancien et limité, mais c'est parfait pour apprendre la mécanique : il est petit, gratuit, et tourne **instantanément sur ton CPU**. Inutile de mobiliser un GPU ici — GPT-2 est trop petit pour que ça change quoi que ce soit. On réservera la carte pour la **Partie D bonus**.

```bash
uv add transformers torch
```

> ⚠️ **C'est l'installation la plus lourde du jour** (`torch` pèse plusieurs centaines de Mo). La première fois, ça peut prendre **plusieurs minutes** et sembler figé : c'est normal, laisse faire. En cas de souci → section « 🔧 Si l'installation coince ». Et si vraiment tu ne peux pas l'installer, ne décroche pas : la Partie B contient un **plan B sans PyTorch** plus bas.

> 💡 **CPU vs GPU, dit simplement** : le **CPU** fait peu de calculs à la fois mais très vite chacun ; le **GPU** en fait des milliers en parallèle. Les gros modèles adorent le GPU (beaucoup de multiplications de listes de nombres en même temps). GPT-2 est si petit que le CPU suffit largement. On verra la différence concrètement en Partie D, où ton GPU fera tourner un modèle bien plus gros. La commande `uv add torch` ci-dessus installe par défaut une version qui fonctionne en CPU — parfait pour les Parties B et C. La version **GPU (CUDA)** sera installée en Partie D, au moment où elle sert vraiment.

Deux mots sur ce qu'on installe :
- **`transformers`** (de Hugging Face) : une bibliothèque qui télécharge et fait tourner des modèles tout prêts.
- **`torch`** (PyTorch) : la « calculatrice » qui fait les opérations sur les listes de nombres. Tu n'as pas besoin de la maîtriser ; on n'en utilisera qu'une poignée de fonctions, et je t'explique chacune.

### B.2 — La vraie sortie d'un modèle : un score pour CHAQUE mot

> ❓ **Question d'ouverture** : à la toute fin, qu'est-ce que le modèle produit *exactement* ? Un mot ? Une phrase ? Réfléchis avant de lire.

#### Le pourquoi : le modèle ne choisit pas un mot, il note tous les mots

Voici l'idée la plus contre-intuitive de la journée, alors prenons-la lentement. Quand le modèle doit deviner la suite, il ne « sort » pas un mot. Il attribue **une note à chaque token possible de tout son vocabulaire** (des dizaines de milliers de tokens). Pour « The capital of France is », il donne une grosse note à « Paris », une petite à « the », une minuscule à « banana », etc.

Ces notes brutes ont un nom : les **logits**. Une note peut être négative, ou très grande. Ce ne sont **pas** encore des pourcentages.

#### L'analogie : le jury qui note tout le monde

Imagine un jury devant 50 000 candidats (le vocabulaire). Chaque candidat reçoit une **note brute** : ce sont les logits. Puis un organisateur convertit toutes ces notes en **pourcentages de chances** qui totalisent 100 %. Cette conversion porte un nom savant — le **softmax** — mais son rôle est simple : *transformer des notes brutes en pourcentages comparables*.

> 📌 **Les deux mots à retenir** :
> - **logits** = les notes brutes du modèle (une par mot possible), de −∞ à +∞.
> - **softmax** = la moulinette qui transforme ces notes en **probabilités** (toutes positives, total = 100 %). Important : le softmax **ne change pas le classement** — le mieux noté reste le plus probable.

#### 🔬 Manip 3 — LE moment eurêka : voir le modèle hésiter

C'est la manip la plus importante du parcours jusqu'ici. On va afficher les 10 mots auxquels GPT-2 pense le plus pour compléter notre phrase. **Je commente chaque ligne**, surtout celles avec des tenseurs (ne saute pas les commentaires) :

```python
# manip3.py — afficher les mots les plus probables selon un vrai modèle
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

# 1) On charge le découpeur et le modèle GPT-2 (téléchargés une fois, puis mis en cache)
tok = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
model.eval()   # mode "évaluation" : on utilise le modèle, on ne l'entraîne pas

# 2) Notre fil rouge, transformé en numéros de tokens
prompt = "The capital of France is"
ids = tok.encode(prompt, return_tensors="pt")
#   return_tensors="pt" : renvoie un "tenseur PyTorch" (un tableau de nombres
#   au format que le modèle attend), plutôt qu'une simple liste Python.

# 3) On passe les tokens dans le modèle
with torch.no_grad():           # "no_grad" = on ne calcule pas de quoi entraîner
    sortie = model(ids)         #            -> plus rapide, moins de mémoire
logits = sortie.logits
#   logits a 3 dimensions : [1, longueur_du_prompt, taille_du_vocabulaire]
#   - 1            : on a envoyé 1 seule phrase
#   - longueur     : un jeu de notes APRÈS chaque token du prompt
#   - vocabulaire  : une note pour CHAQUE mot possible (~50 000 pour GPT-2)

# 4) On ne veut prédire QUE le mot suivant -> on prend le dernier jeu de notes
notes_du_prochain_mot = logits[0, -1, :]
#   [0,  -1,  :] se lit : "phrase n°0 , DERNIÈRE position , toutes les notes"
#   -1 = le dernier élément (comme en Python classique). C'est la clé : la note
#   placée juste APRÈS le dernier mot du prompt, c'est la prédiction de la suite.

# 5) On transforme les notes brutes (logits) en pourcentages (softmax)
probas = torch.softmax(notes_du_prochain_mot, dim=-1)

# 6) On affiche les 10 mots les mieux notés
top = torch.topk(probas, 10)    # récupère les 10 plus hautes valeurs + leur position
print(f"Prompt : {prompt!r}\n")
print("Le modèle pense que le mot suivant est probablement :")
for proba, position in zip(top.values, top.indices):
    mot = tok.decode([position])              # on retraduit le numéro en texte
    print(f"   {mot!r:12}  {proba.item()*100:5.2f} %")
```

Lance-le : `uv run manip3.py` (la 1ʳᵉ fois, GPT-2 se télécharge — ~500 Mo, patiente).

> ✅ **Checkpoint — c'est ici que la magie tombe** : tu dois voir une liste où **« Paris » arrive en tête** (souvent 15-40 %), suivi de variantes (« the », « now », « a »…). **Tu regardes littéralement un modèle hésiter, puis pencher pour Paris.** Voilà ce qu'il y a sous le capot de ChatGPT, en plus petit. Prends une seconde pour savourer : tu viens d'ouvrir la boîte noire.

> 💡 **Si l'anglais te surprenait** : on a pris une phrase anglaise parce que GPT-2 a surtout été entraîné en anglais — il y est bien meilleur. Essaie la version française « La capitale de la France est » et compare : les prédictions seront probablement moins nettes. Ça illustre concrètement le biais linguistique vu en Partie A.

#### 🧪 Plan B — sans PyTorch (si l'installation a échoué)

Si tu n'as pas réussi à installer `torch`, ne reste pas bloqué. Tu peux **vivre la même idée** avec un simulateur en Python pur : on invente des notes brutes et on applique le softmax à la main pour voir la conversion notes → pourcentages.

```python
# manip3_planB.py — comprendre logits -> softmax SANS aucun modèle
import math

# Imaginons que le modèle attribue ces notes brutes (logits) à 4 mots :
mots   = ["Paris", "the", "France", "banana"]
logits = [ 8.0,     5.0,   4.0,      -2.0   ]   # "Paris" est le mieux noté

# Le softmax, étape par étape :
expos = [math.exp(x) for x in logits]   # on applique l'exponentielle à chaque note
total = sum(expos)                      # on additionne le tout
probas = [e / total for e in expos]     # chaque note devient une part du total (=100%)

for mot, p in zip(mots, probas):
    print(f"   {mot:8} {p*100:6.2f} %")
print("   (somme :", round(sum(probas)*100), "%)")
```

> ✅ **Checkpoint plan B** : lance-le avec `uv run manip3_planB.py`. « Paris » ressort largement en tête, et la somme fait 100 %. Tu as reproduit à la main ce que fait la fin de tout LLM. Change les logits et observe : monte la note de « France », et regarde son pourcentage grimper.

> 💡 `manip3_planB.py` n'utilise que le module `math` (livré avec Python), donc aucune dépendance à ajouter : `uv run` l'exécute tel quel dans l'environnement du projet.

#### Le contre-exemple : une phrase ouverte

Reprends `manip3.py` et remplace le prompt par quelque chose de **vague** :

```python
prompt = "I think that"
```

> ✅ **Observe** : la liste devient **plate** — aucun mot ne domine, beaucoup ont des pourcentages voisins. Compare avec « The capital of France is » où un mot écrasait les autres.
>
> 📌 **La leçon** : la forme de la liste **reflète l'incertitude du modèle**. Suite évidente → liste « pointue » (un gagnant net). Suite ouverte → liste « plate » (plein de candidats à égalité).

#### 🧵 « Paris » — étape 3 : la réponse à notre défi

Souviens-toi de la question du début : *à quel moment le modèle « décide »-t-il que c'est Paris ?* Réponse : **il ne décide jamais vraiment**. Il a simplement calculé que, statistiquement, « Paris » est le token le plus plausible pour continuer ce texte, et lui a donné la plus haute note. Pas de compréhension, pas de décision : un calcul de plausibilité. C'est déstabilisant, et c'est pourtant tout le secret.

#### ✍️ À toi de jouer

1. Quelle est la différence entre un **logit** et une **probabilité** ? Que fait le **softmax** entre les deux ?
2. Le modèle donne les logits `[2.0, 1.0, 0.1]` à trois mots. Sans calculatrice : lequel est le plus probable après softmax, et le softmax peut-il changer ce classement ?
3. Lance `manip3.py` avec le prompt `"The sun rises in the"`. Le mot attendu domine-t-il ? La liste est-elle plutôt pointue ou plate ? Pourquoi ?

<details>
<summary>👉 Voir les réponses</summary>

1. Un **logit** est une **note brute** (de −∞ à +∞) que le modèle attribue à un mot ; elle n'est pas directement interprétable. Une **probabilité** est cette note convertie en **pourcentage** (positif, et toutes ensemble = 100 %). Le **softmax** est l'opération qui fait cette conversion, **sans modifier le classement** des mots.
2. Le **premier** (logit 2.0) est le plus probable. Le softmax **préserve toujours l'ordre** : il ne fait que transformer des notes en pourcentages. Il creuse même l'écart (via l'exponentielle), donc 2.0 obtient une part nettement plus grande que 1.0 et 0.1.
3. « sun » devrait fortement orienter vers « sky » : la liste sera plutôt **pointue** (un gagnant net), car la suite de « The sun rises in the » est quasi déterminée. Une phrase très prévisible concentre la probabilité sur peu de mots.

</details>

**Mini-résumé de B.2**
- La vraie sortie d'un modèle = **une note (logit) pour chaque mot** de son vocabulaire.
- Le **softmax** convertit ces notes en **probabilités** (total 100 %) **sans changer le classement**.
- Liste **pointue** = suite évidente ; liste **plate** = suite ouverte/incertaine.

---

### B.3 — D'un mot à une phrase : la boucle (autorégression)

> ❓ **Question d'ouverture** : le modèle ne produit qu'**un** mot à la fois. Mais une réponse de ChatGPT fait des dizaines de mots. Comment passe-t-on d'un mot à une phrase entière ?

#### Le pourquoi : on recommence, encore et encore

Un passage dans le modèle ne prédit **qu'un** mot. Pour faire une phrase, on **répète** : on ajoute le mot choisi à la fin du texte, on renvoie le tout dans le modèle, on obtient le mot suivant, et ainsi de suite. Ce procédé porte un nom : la génération **autorégressive** (« auto » = à partir de sa **propre** sortie).

#### L'analogie : l'autocomplétion sous stéroïdes

C'est exactement la suggestion de mot de ton clavier de téléphone, mais en boucle automatique. Tu tapes un mot, le clavier propose le suivant ; ici, le modèle **accepte tout seul sa propre suggestion** et continue, encore et encore, sans s'arrêter.

#### 🔬 Manip 4 — écris toi-même `generate()` en 6 lignes

Les bibliothèques offrent une fonction `model.generate()` toute faite. Mais pour **comprendre**, on va la réécrire à la main. Réutilise `tok` et `model` de la manip 3 :

```python
# manip4.py — fabriquer une phrase en répétant la prédiction
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

tok = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
model.eval()

texte = tok.encode("The capital of France is", return_tensors="pt")

for _ in range(15):                      # on va produire 15 mots, un par un
    with torch.no_grad():
        logits = model(texte).logits     # notes pour chaque position
    notes_suivantes = logits[0, -1, :]   # on garde les notes du PROCHAIN mot
    prochain = torch.argmax(notes_suivantes)   # on prend le mot LE MIEUX noté
    prochain = prochain.view(1, 1)             # on remet au bon format (tableau)
    texte = torch.cat([texte, prochain], dim=1)  # on l'AJOUTE à la fin du texte

print(tok.decode(texte[0]))   # on retraduit toute la séquence en texte
```

Lance-le : `uv run manip4.py`. Tu viens de réécrire `generate()` !

> ✅ **Checkpoint** : tu obtiens une phrase qui commence par « The capital of France is Paris… » et continue. La fonction-clé est **`argmax`** : elle prend **toujours** le mot le mieux noté. C'est la stratégie dite **gloutonne** (*greedy*).

#### Le contre-exemple : pourquoi ChatGPT, lui, varie

`argmax` est **déterministe** : même phrase de départ → **exactement la même** sortie, à chaque exécution. Relance `manip4.py` plusieurs fois pour le vérifier : identique.

Mais ChatGPT te donne des réponses **différentes** à la même question. Pourquoi ? Parce qu'en pratique, on ne prend pas toujours le mieux noté : on **tire au sort** parmi les bons candidats, en respectant leurs pourcentages (parfois le n°1, parfois le n°2…). Remplacer `argmax` par un tirage pondéré, c'est exactement le sujet du **prochain épisode** (les réglages *temperature* et *top-p*).

> 💡 **Petite expérience révélatrice** : avec le prompt `"Once upon a time"`, fais générer 40 mots (`range(40)`) en gardant `argmax`. Tu verras souvent le texte **tourner en rond** ou se répéter. Ce défaut du « toujours le meilleur » est précisément ce que le tirage au sort du prochain épisode vient corriger.

#### 🧵 « Paris » — dénouement

Boucle bouclée. On a : découpé « The capital of France is » en tokens (A.1) → transformé chacun en position sur la carte du sens (A.2) → laissé (prochain épisode) le cerveau du modèle faire circuler l'information → obtenu une note par mot, converties en pourcentages par softmax (B.2) → choisi « Paris », puis recommencé pour le mot d'après (B.3). **Voilà l'intégralité de ce que fait un LLM.** Tout le reste de la série consiste à piloter intelligemment cette boucle.

#### ✍️ À toi de jouer

1. Explique « autorégressif » avec tes propres mots, à quelqu'un qui n'y connaît rien.
2. Pourquoi la stratégie gloutonne (`argmax`) donne-t-elle toujours la même sortie pour un prompt donné ?
3. D'après ce que tu as vu, d'où vient la **variété** des réponses de ChatGPT — du modèle qui serait « créatif », ou de la façon dont on choisit le mot ?

<details>
<summary>👉 Voir les réponses</summary>

1. **Autorégressif** = le modèle génère un mot à la fois, et chaque nouveau mot est calculé à partir de **tout le texte précédent, y compris les mots qu'il vient lui-même de produire**. Il se nourrit de sa propre sortie pour avancer, comme une autocomplétion qui s'enchaînerait toute seule.
2. Parce que `argmax` choisit **toujours** le mot de plus haute note, sans aucun hasard. Pour un même prompt et un même modèle, les notes calculées sont identiques à chaque fois, donc le mot retenu aussi : la sortie est strictement reproductible.
3. De **la façon dont on choisit le mot**. Le modèle produit toujours la même liste de notes ; la variété vient du fait qu'on **tire au sort** parmi les bons candidats au lieu de toujours prendre le n°1. Ce n'est pas une « créativité » du modèle, c'est un choix d'échantillonnage (prochain épisode).

</details>

**Mini-résumé de B.3**
- Générer une phrase = **répéter** la prédiction en ré-injectant chaque mot produit (**autorégression**).
- `argmax` (**glouton**) prend toujours le mieux noté → **déterministe**, mais tend à se répéter.
- La variété des vraies réponses vient du **tirage au sort** pondéré → prochain épisode.

---
---

## PARTIE C — Pour aller un cran plus loin (facultatif)

> Tu peux t'arrêter là pour aujourd'hui et garder cette partie pour une 2ᵉ session. Elle ajoute deux notions utiles mais non essentielles au cœur `token → proba → boucle`.

### C.1 — Pourquoi l'ordre des mots compte (la position)

> ❓ **Question d'ouverture** : « le chat mange la souris » et « la souris mange le chat » utilisent **les mêmes tokens**. Comment le modèle évite-t-il de les confondre ?

Les embeddings (A.2) disent **quel** mot, mais pas **à quelle place**. Or la place change tout le sens. Le modèle ajoute donc, dans chaque vecteur, une **information de position** (une étiquette « je suis le 1er mot », « je suis le 3e »…).

L'analogie : une recette dont on aurait jeté tous les mots dans un sac. Tu as les ingrédients, mais tu as perdu l'ordre des étapes. L'information de position remet l'ordre.

Les modèles récents (comme Llama) utilisent une méthode efficace appelée **RoPE** (*Rotary Position Embedding*). Le détail relève du prochain épisode ; aujourd'hui, retiens juste : **l'ordre des mots est bien encodé**, donc le modèle distingue le chat-mangeur de la souris-mangée.

**Mini-résumé** : sans information de position, l'ordre des mots serait perdu. On l'injecte donc dans chaque vecteur (méthode récente : RoPE).

### C.2 — Les chiffres qui « font la taille » d'un modèle

Quand tu liras « modèle 7B » ou « 70B », il s'agit du nombre de **paramètres** (les réglages internes appris) : 7 ou 70 **milliards**. Quatre chiffres suffisent à décrire largement un modèle :

| Chiffre | Ce que c'est | Ordre de grandeur typique |
|---------|--------------|---------------------------|
| **taille du vocabulaire** | nombre de tokens distincts | ~50 000 à ~130 000 |
| **dimension des vecteurs** | longueur de la liste de nombres par token | 768 à 4096+ |
| **nombre de couches** | étages empilés dans le « cerveau » | 12 à 80+ |
| **fenêtre de contexte** | nombre max de tokens vus d'un coup | 1 000 à 1 000 000+ |

> 📌 **Point clé sur la fenêtre de contexte** : quand une conversation **dépasse** cette limite, le modèle **perd l'accès au début** — les premiers tokens sortent de la fenêtre et sont « oubliés ». C'est pour ça qu'un très long échange peut voir le modèle perdre le fil de ce qui a été dit au tout début. Le GPT-2 de tes manips a une petite fenêtre (1024) et peu de paramètres : d'où ses réponses parfois bancales.

**Mini-résumé** : « 7B » = 7 milliards de paramètres. Quatre chiffres décrivent un modèle ; la **fenêtre de contexte** dépassée = début de conversation oublié.

---
---

## PARTIE D — Bonus : réveille ton GPU (facultatif, mais recommandé)

> Jusqu'ici tout tournait en CPU avec GPT-2, un modèle de **2019**. Si tu disposes d'un **GPU NVIDIA compatible CUDA**, tu peux passer à la vitesse supérieure. Dans cette partie, on va (1) installer la version GPU de PyTorch proprement avec `uv`, (2) charger un **vrai modèle moderne (2024)** dessus, et (3) **comparer** ses prédictions à celles de GPT-2. Objectif : *ressentir* l'écart entre un petit modèle ancien et un modèle récent, et voir ta carte se remplir. C'est le moment satisfaisant du jour.
>
> Pas de GPU NVIDIA ? Aucun souci : tu peux sauter cette partie sans rien perdre du cœur de l'article. Le principe « prédire le prochain token » reste exactement le même.

### D.1 — Installer PyTorch version GPU (CUDA) avec uv

Le `torch` installé en Partie B fonctionne en CPU. Pour utiliser ta carte NVIDIA, il faut la version **CUDA** (la technologie NVIDIA de calcul sur GPU). Avec `uv`, on pointe vers l'index de paquets GPU de PyTorch.

**Étape 1 — vérifier que ta carte est bien vue par le système.** Assure-toi qu'un **pilote NVIDIA récent** est installé, puis vérifie :

```bash
nvidia-smi
```

> ✅ **Checkpoint** : un tableau s'affiche avec le nom de ta carte NVIDIA et une ligne « CUDA Version: ... ». Si la commande n'existe pas, ton pilote n'est pas en place (voir dépannage).

**Étape 2 — remplacer torch par sa version CUDA dans le projet.** On indique à `uv` d'aller chercher `torch` sur l'index CUDA de PyTorch (ici CUDA 12.4 ; choisis une version compatible avec ton pilote) :

```bash
uv add torch --index pytorch-cuda=https://download.pytorch.org/whl/cu124
```

> ⚠️ Ce téléchargement est **plus lourd** que la version CPU (la build CUDA embarque les bibliothèques GPU). Compte un peu de patience la première fois. Si `uv` proteste sur l'index ou la version, la section dépannage couvre les variantes.

**Étape 3 — confirmer que PyTorch voit le GPU.** Crée `manip5_gpu_check.py` :

```python
# manip5_gpu_check.py — PyTorch voit-il ta carte NVIDIA ?
import torch

print("CUDA disponible :", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Carte détectée  :", torch.cuda.get_device_name(0))
    print("VRAM totale     :", round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1), "Go")
```

Lance : `uv run manip5_gpu_check.py`

> ✅ **Checkpoint décisif** : tu dois lire `CUDA disponible : True` et le nom de ta carte NVIDIA. Si c'est `True`, tu peux mettre n'importe quel modèle sur ta carte. Si c'est `False`, va voir le dépannage GPU — n'avance pas tant que ce n'est pas `True`.

### D.2 — Le réflexe `device` : faire tourner un modèle sur GPU

Mettre un modèle sur GPU tient en une idée : on définit un **`device`** (« cuda » si dispo, sinon « cpu ») et on y **envoie** le modèle et les données avec `.to(device)`. C'est le réflexe que tu réutiliseras tout le parcours.

```python
import torch
device = "cuda" if torch.cuda.is_available() else "cpu"   # choisit GPU si possible
# ... puis : model.to(device)   et   entrees.to(device)
```

> 💡 Pourquoi ce petit `if` ? Pour que **le même script** tourne partout : sur une machine avec carte NVIDIA il prend le GPU, sur une machine sans carte il bascule en CPU sans rien casser. C'est une bonne habitude de portabilité.

### D.3 — Charger un vrai modèle moderne (2024) sur ta carte

On va charger **Qwen2.5-1.5B-Instruct** : un modèle de ~1,5 milliard de paramètres (≈ 20× GPT-2), **récent**, **multilingue** (donc bon en français), qui tient confortablement dans 8 Go de VRAM. « Instruct » signifie qu'il a été entraîné à **suivre des instructions** (contrairement à GPT-2 qui ne fait que continuer du texte) — tu verras la différence.

Crée `manip6_modele_moderne.py` :

```python
# manip6_modele_moderne.py — un vrai modèle récent sur ton GPU
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
nom = "Qwen/Qwen2.5-1.5B-Instruct"

# AutoTokenizer / AutoModelForCausalLM : versions "génériques" qui chargent
# automatiquement le bon type de modèle d'après son nom (pratique : un seul code
# pour des modèles différents).
tok = AutoTokenizer.from_pretrained(nom)
model = AutoModelForCausalLM.from_pretrained(
    nom,
    torch_dtype=torch.float16,   # nombres sur 16 bits = 2× moins de VRAM, idéal sur 8 Go
).to(device)                     # ON ENVOIE LE MODÈLE SUR LE GPU

# Les modèles "Instruct" attendent un format de conversation (rôles user/assistant).
# apply_chat_template met notre question dans le format exact que le modèle attend.
messages = [{"role": "user", "content": "Explique en une phrase ce qu'est un token, pour un débutant."}]
entree = tok.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(device)

# On génère une réponse (ici on laisse generate() faire la boucle qu'on a écrite en manip4).
with torch.no_grad():
    sortie = model.generate(entree, max_new_tokens=80, do_sample=False)

# On n'affiche que les tokens AJOUTÉS par le modèle (on retire la question d'origine).
reponse = tok.decode(sortie[0][entree.shape[1]:], skip_special_tokens=True)
print(reponse)
```

Lance : `uv run manip6_modele_moderne.py` (1ʳᵉ fois : téléchargement ~3 Go, patiente).

> ✅ **Checkpoint** : tu obtiens une **vraie explication en français**, propre et pertinente. Compare mentalement avec GPT-2 (manip 3-4) qui, lui, partait souvent en répétitions ou en charabia. Même mécanique sous le capot — prédiction du prochain token — mais 20× plus de paramètres et un entraînement moderne : le résultat n'a rien à voir.

**Observe ta carte pendant que ça tourne.** Ouvre un second terminal et lance :

```bash
watch -n 1 nvidia-smi
```

> ✅ **Checkpoint visuel** : pendant le chargement puis la génération, la colonne « Memory-Usage » grimpe (le modèle occupe ~3-4 Go de VRAM), et l'utilisation GPU (« GPU-Util ») monte pendant la génération. **Tu vois littéralement ta carte travailler.**

### D.4 — La comparaison qui ancre tout : GPT-2 vs Qwen sur le MÊME exercice

Reprends l'exercice fondateur (les probabilités du prochain mot, manip 3) mais sur le modèle moderne, pour comparer la **netteté** des prédictions. On garde notre fil rouge.

```python
# manip7_comparaison.py — "the capital of France is" vu par un modèle moderne
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
nom = "Qwen/Qwen2.5-1.5B-Instruct"
tok = AutoTokenizer.from_pretrained(nom)
model = AutoModelForCausalLM.from_pretrained(nom, torch_dtype=torch.float16).to(device)
model.eval()

prompt = "The capital of France is"
ids = tok.encode(prompt, return_tensors="pt").to(device)   # données AUSSI sur le GPU

with torch.no_grad():
    logits = model(ids).logits

probas = torch.softmax(logits[0, -1, :], dim=-1)
top = torch.topk(probas, 10)
print(f"Prompt : {prompt!r}\nTop 10 selon Qwen2.5-1.5B :")
for proba, position in zip(top.values, top.indices):
    print(f"   {tok.decode([position])!r:12}  {proba.item()*100:5.2f} %")
```

Lance : `uv run manip7_comparaison.py`

> ✅ **Checkpoint comparatif** : « Paris » devrait dominer **encore plus nettement** que chez GPT-2 (probabilité plus haute, concurrents plus faibles). Un modèle plus capable est **plus sûr** de la bonne réponse sur un fait simple. Tu observes la même distribution de probabilités qu'en B.2 — mais plus tranchée. C'est ça, « un meilleur modèle ».

> 📌 **La leçon de la Partie D** : rien de magique n'a changé. Toujours des tokens, des embeddings, des logits, un softmax, une boucle. Ce qui change entre 2019 et 2024, c'est **l'échelle** (20× plus de paramètres), **l'entraînement** (suivi d'instructions), et le **matériel** qui rend tout ça fluide. La mécanique du jour reste exactement la même — elle passe juste à l'échelle.

#### ✍️ À toi de jouer

1. À quoi sert la ligne `device = "cuda" if torch.cuda.is_available() else "cpu"`, et pourquoi est-ce une bonne habitude ?
2. Pourquoi charge-t-on le modèle en `torch.float16` plutôt qu'en pleine précision, sur une carte de 8 Go ?
3. Pose une vraie question dans `manip6` (modifie le `content`), par exemple « Donne-moi 3 idées de recettes avec des œufs ». GPT-2 aurait-il pu répondre aussi proprement ? Pourquoi ?

<details>
<summary>👉 Voir les réponses</summary>

1. Elle choisit **automatiquement le GPU s'il est disponible, sinon le CPU**. Bonne habitude car le **même script** devient portable : il exploite ta carte NVIDIA ici, mais tournerait quand même sur une machine sans carte, sans modification.
2. Le `float16` code chaque nombre sur **16 bits au lieu de 32**, ce qui **divise par deux la VRAM** occupée par le modèle. Sur 8 Go, c'est ce qui permet de charger confortablement un modèle de 1,5 milliard de paramètres (et d'en viser de plus gros). La perte de précision est négligeable pour de l'inférence.
3. Non. GPT-2 (2019) n'a **pas été entraîné à suivre des instructions** : il ne fait que continuer du texte, donc il partirait probablement en digressions. Qwen2.5-Instruct a subi un entraînement spécifique (instruction tuning) qui lui apprend à **répondre** à une demande — d'où une réponse structurée et pertinente. Même mécanique de prédiction, entraînement différent.

</details>

**Mini-résumé de la Partie D**
- La version **GPU (CUDA)** de PyTorch s'installe avec `uv add torch --index ...` ; on vérifie avec `torch.cuda.is_available()`.
- Réflexe **`device` + `.to(device)`** pour envoyer modèle et données sur la carte (et rester portable).
- Un modèle **moderne** (Qwen2.5-1.5B) sur un GPU récent donne des réponses sans commune mesure avec GPT-2 — **même mécanique**, échelle et entraînement supérieurs.

---
---

## ⚠️ Pièges fréquents (récapitulatif transversal)

| Piège | Pourquoi c'est dangereux | Le bon réflexe |
|-------|--------------------------|----------------|
| Compter en **caractères** pour estimer coût/contexte | Sous-estime fortement (surtout français/mots rares) | Compter en **tokens** : `len(enc.encode(texte))` |
| Croire que `"mot"` = `" mot"` | L'espace fait partie du token → entrée différente | Soigner le **formatage** des prompts |
| Confondre **logit** et **probabilité** | On raisonne faux sur ce que « pense » le modèle | Logit = note brute ; après softmax = pourcentage |
| Croire que le modèle « comprend » comme un humain | Mauvais modèle mental → attentes irréalistes | Se redire : **prédiction du mot suivant**, point |
| Prendre la manip MiniLM pour le mécanisme exact d'un LLM | Confond embedding de phrase et embedding de token | Garder l'**intuition** (sens = position), nuance au prochain épisode |
| Croire que la variété de ChatGPT vient d'une « créativité » | Fausse compréhension du hasard | C'est le **tirage au sort** (prochain épisode), pas le modèle |
| Abandonner au 1er `uv add torch` qui rame | C'est lourd et lent : normal, pas une panne | Patienter ; sinon → section dépannage + plan B |

---

## 🔁 Récap final synthétique

```text
              UN LLM = PRÉDIRE LE MOT SUIVANT, EN BOUCLE
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   PARTIE A                 PARTIE B                PARTIE C
 texte -> nombres        notes -> choix          (facultatif)
        │                       │                       │
   ┌────┴────┐         ┌────────┴────────┐      ┌───────┴────────┐
 TOKENS   EMBEDDING   LOGITS  ->  PROBAS   AUTO-  POSITION   TAILLE
(briques  (sens =    (1 note   (softmax,  RÉGRES-(l'ordre   (4 chiffres,
 LEGO,     position   par mot)   total     SION   compte :   fenêtre de
 espaces   sur une              100%)     (boucle: RoPE)     contexte)
 comptent) carte)                          on ré-
                                           injecte)
```

> 💻 **Partie D (bonus GPU)** : la même mécanique, mise à l'échelle sur une carte NVIDIA. Réflexe `device = "cuda"` + `.to(device)`, modèle chargé en `float16`, et un modèle **moderne (Qwen2.5-1.5B)** qui écrase GPT-2 en qualité — sans rien changer au principe « prédire le prochain token ».

> 🧠 **Auto-évaluation (fais-la vraiment)** : sans relire, peux-tu (a) redessiner le trajet `texte → mot suivant` en nommant chaque étape, et (b) expliquer à quelqu'un pourquoi `argmax` donne toujours la même réponse alors que ChatGPT varie ? Si une étape coince, retourne à la section concernée **avant** le quiz.

---

## ✅ Quiz de validation

1. Énonce **en une phrase** l'unique opération que répète tout LLM.
2. Pourquoi un texte en français consomme-t-il souvent **plus de tokens** (donc coûte plus cher) que le même texte en anglais ?
3. Qu'est-ce qu'un **embedding**, et que veut dire « le sens devient de la géométrie » ?
4. Différence entre **logits** et **probabilités** — et que fait le **softmax** entre les deux ?
5. Pourquoi la génération est-elle dite **autorégressive**, et pourquoi `argmax` (glouton) produit-il toujours la même sortie pour un prompt donné ?

<details>
<summary>👉 Voir le corrigé</summary>

1. Un LLM **prédit le mot (token) suivant** à partir du texte précédent, puis répète l'opération en réinjectant ce mot. Toute capacité apparente (raisonnement, code, traduction) **émerge** de cette boucle.
2. Parce que les corpus d'entraînement, et donc les tokenizers, sont **dominés par l'anglais** : un mot anglais courant tient souvent en un token, tandis que le français (moins fréquent) se fragmente en plusieurs tokens. Plus de tokens = plus de coût (facturation au token) et plus de contexte consommé.
3. Un **embedding** est une **liste de nombres** associée à un token, qui sert de représentation de départ dans le modèle. « Le sens devient de la géométrie » signifie que ces listes sont **apprises** de sorte que des mots proches en sens/usage se retrouvent **proches** dans l'espace : on peut alors mesurer une ressemblance de sens par une distance.
4. Les **logits** sont les **notes brutes** (de −∞ à +∞) attribuées à chaque mot du vocabulaire. Les **probabilités** s'obtiennent en passant ces notes dans le **softmax**, qui les rend positives et de somme 100 %, **sans changer leur classement**. Le softmax fait le pont « note brute → pourcentage exploitable ».
5. **Autorégressive** : le modèle génère un mot à la fois en s'appuyant sur **sa propre sortie** (tout le texte déjà produit) pour calculer le suivant. **`argmax`** choisit systématiquement le mot le mieux noté, sans hasard ; pour un même prompt et un même modèle, les notes sont identiques à chaque fois, donc la sortie est strictement reproductible (déterministe).

</details>

> 🧠 **Bilan objectifs** : reprends les 5 objectifs du début. Pour chacun, peux-tu dire « oui, je sais faire » ? Si un seul te résiste, tu sais exactement quelle section relire — c'est ça, apprendre activement.

---

## 🔧 Si l'installation coince (dépannage)

Avec `uv`, la plupart des galères classiques de débutant (mauvais Python, environnement « géré », oubli d'activation) **disparaissent** : `uv` gère l'environnement isolé tout seul. Voici les cas qui restent.

**« `uv : command not found` (ou commande inconnue). »**
`uv` n'est pas installé, ou ton terminal ne l'a pas encore pris en compte. **Ferme et rouvre ton terminal** après l'installation (Étape 0). Si ça persiste, relance le script d'installation de l'Étape 0 et lis la dernière ligne : elle indique parfois un dossier à ajouter à ton `PATH`.

**« `uv add torch` semble figé / très long. »**
C'est **normal** : PyTorch pèse plusieurs centaines de Mo. `uv` est rapide pour résoudre les dépendances, mais le **téléchargement** dépend de ta connexion (compte quelques minutes). Tant qu'il n'y a pas de message d'erreur rouge, ça avance.

**« Je ne sais plus si je suis dans le bon dossier. »**
Toutes les commandes `uv add` / `uv run` doivent être lancées **depuis `llm-formation/`** (le dossier créé à l'Étape 1). Vérifie avec `pwd` (macOS/Linux) ou `cd` (Windows) : le chemin doit se terminer par `llm-formation`. Si besoin, `cd` jusqu'à ce dossier.

**« `ModuleNotFoundError: No module named 'torch'` (ou 'transformers'). »**
Avec `uv`, cela signale presque toujours l'une de ces deux causes : soit la dépendance n'a pas été ajoutée (relance `uv add torch`), soit tu lances le script **sans** `uv run` (un simple `python manip3.py` n'utilise pas l'environnement du projet). **Lance toujours avec `uv run manip3.py`** : `uv` garantit alors que les bonnes dépendances sont là.

**« Le téléchargement de GPT-2 échoue / coupe. »**
La 1ʳᵉ exécution télécharge le modèle (~500 Mo) depuis Hugging Face (ce n'est pas géré par `uv`, mais par `transformers`). Relance simplement `uv run manip3.py` : le téléchargement reprend et se met en cache. Vérifie ta connexion.

**« Trop lent / trop lourd pour ma machine. »**
GPT-2 tourne sur CPU sans souci, mais si vraiment ça bloque : utilise le **plan B sans PyTorch** (`uv run manip3_planB.py`) pour comprendre logits → softmax, et reviens aux manips PyTorch plus tard. Tu ne perds pas le concept.

**« Des warnings jaunes s'affichent. »**
Les *warnings* (avertissements) ne sont **pas** des erreurs. Si le script produit son résultat, ignore-les.

#### Cas spécifiques GPU / CUDA (Partie D)

**« `nvidia-smi` : commande introuvable. »**
Le pilote NVIDIA n'est pas (ou plus) en place. Installe-le côté système (sur Ubuntu : `sudo ubuntu-drivers autoinstall` puis redémarre) — c'est indépendant de Python et d'`uv`.

**« `torch.cuda.is_available()` renvoie `False` alors que `nvidia-smi` marche. »**
C'est le cas le plus courant : tu as installé le `torch` **CPU** (Partie B), pas la version CUDA. Refais l'Étape 2 de la Partie D (`uv add torch --index pytorch-cuda=...`) pour remplacer torch par sa build GPU, puis relance `manip5_gpu_check.py`.

**« `uv` refuse l'index ou la version CUDA. »**
La version de CUDA dans l'URL (`cu124`) doit être **compatible avec ton pilote**. La ligne « CUDA Version » de `nvidia-smi` indique la version maximale supportée : tant que `cu124` lui est inférieur ou égal, c'est bon. Si besoin, essaie une version plus basse (`cu121`) en changeant la fin de l'URL.

**« `CUDA out of memory` (mémoire GPU saturée). »**
Le modèle ne tient pas dans ta VRAM. Vérifie que tu charges bien en `torch_dtype=torch.float16` (et pas en pleine précision). Ferme les autres applis gourmandes en VRAM (navigateur lourd, jeux). En dernier recours, prends un modèle plus petit (ex. une variante 0.5B). 1,5B en float16 tient largement dans 8 Go.

**« Le téléchargement du modèle moderne (~3 Go) coupe. »**
Comme pour GPT-2, c'est `transformers` qui télécharge depuis Hugging Face, pas `uv`. Relance le script : il reprend et met en cache.

> 💡 **Réflexe général** : copie le message d'erreur exact dans un moteur de recherche — 99 % des erreurs de débutant sont déjà résolues quelque part.

> 📌 **Mémo des commandes `uv` du jour** :
> - `uv init llm-formation` — créer le projet (une fois)
> - `uv add <paquet>` — ajouter une dépendance (CPU par défaut)
> - `uv add torch --index pytorch-cuda=https://download.pytorch.org/whl/cu124` — torch version **GPU** (Partie D)
> - `uv run <script>.py` — lancer un script dans l'environnement du projet
> - `uv --version` — vérifier qu'`uv` est bien installé

---

## 🚀 Pour aller plus loin

#### 🔄 Autre approche (le même sujet, un autre angle)

| Ressource | Type | En quoi l'angle diffère | Effort |
|-----------|------|-------------------------|--------|
| **3Blue1Brown — « But what is a GPT? »** (YouTube, FR sous-titré) | Vidéo | Tout est expliqué par la **visualisation animée** plutôt que par le code : le complément parfait des manips d'aujourd'hui | À regarder (~25 min) |
| **Tiktokenizer** (tiktokenizer.vercel.app) | Outil web | Voir la tokenisation **en direct**, sans écrire de code : angle « manipulation immédiate » | À manipuler |
| **« The Illustrated Transformer » — Jay Alammar** (jalammar.github.io) | Article | Explique la mécanique par des **schémas pas à pas** plutôt que des formules | Lecture |

#### 🧩 Complémentaire (élargir le périmètre)

| Ressource | Type | Le lien concret avec aujourd'hui | Effort |
|-----------|------|----------------------------------|--------|
| **Hugging Face — NLP Course, chapitre « Tokenizers »** (huggingface.co/learn) | Cours gratuit | Approfondit BPE vu en Partie A ; base directe pour les API à venir | Lecture + pratique |
| **OpenAI Tokenizer** (platform.openai.com/tokenizer) | Outil web | Estimer tokens et coût **avant** d'appeler une API payante | À manipuler |
| **Doc `transformers` — « Generation »** (huggingface.co/docs) | Doc officielle | Prolonge la manip 4 : tous les réglages de `generate()` qu'on verra au prochain épisode | Lecture + pratique |
| **Hugging Face Hub — modèles « text-generation »** (huggingface.co/models) | Catalogue | Trouver d'autres modèles qui tiennent dans 8 Go pour rejouer la Partie D | À explorer |

#### 🔬 Approfondissement (creuser le sujet lui-même)

| Ressource | Type | Niveau / prérequis | Effort |
|-----------|------|--------------------|--------|
| **Andrej Karpathy — « Let's build the GPT Tokenizer »** (YouTube) | Vidéo | Intermédiaire ; coder BPE de zéro. Prérequis : Python + Partie A | Pratique guidée |
| **Andrej Karpathy — « Let's build GPT: from scratch »** (YouTube + dépôt nanoGPT) | Vidéo + code | Intermédiaire/avancé ; construit un GPT entier. Prérequis : bases PyTorch | Pratique intensive |
| **« Attention Is All You Need »** (arxiv.org/abs/1706.03762) | Article de recherche | Avancé ; l'article fondateur. À lire **après** le prochain épisode | Lecture exigeante |

---

> **➡️ Prochain épisode — L'attention** : on ouvre la seule boîte qu'on a laissée fermée aujourd'hui — le **« cerveau du modèle »**, c'est-à-dire les couches et le fameux mécanisme d'**attention**. Tu découvriras *comment* le vecteur de ` France` finit par « savoir » qu'on parle de sa capitale — et donc comment « Paris » remonte en tête des notes. Reviens avec tes manips faites et toutes tes questions.
