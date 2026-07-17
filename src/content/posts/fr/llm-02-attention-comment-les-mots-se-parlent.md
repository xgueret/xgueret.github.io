---
title: "L'attention : comment les mots « se parlent »"
date: "2026-07-16"
author: "Xavier GUERET"
description: "Deuxième volet de la série « Du token au chatbot ». Le mécanisme d'attention, expliqué sans aucun bagage mathématique : produit scalaire, softmax et le trio Query/Key/Value, avec de vraies manips Python pour voir un modèle relier « it » à « cat »."
tags:
  - "LLM"
  - "Python"
  - "attention"
  - "Transformers"
  - "Hugging Face"
  - "ia"
  - "tutoriel"
categories:
  - "Du token au chatbot"
  - "Tutoriels"
  - "Intelligence Artificielle"
image: "/images/posts/llm-02-attention-comment-les-mots-se-parlent.png"
draft: false
toc: true
series: "Du token au chatbot"
seriesOrder: 2
---
*Épisode 2 de la série **« Du token au chatbot »** — un parcours pratique qui va de la mécanique interne d'un LLM jusqu'à construire son propre chatbot.*

> À l'épisode précédent, tu as découvert qu'un LLM ne fait qu'**une chose** : prédire le prochain token, en boucle. Mais on a laissé une boîte fermée — le « cerveau du modèle ». On s'est arrêté sur une frustration précise : le vecteur de ` France` « connaissait » le sens général de France, mais **ne savait pas encore** qu'on parlait de sa capitale, parce qu'aucun token ne s'était encore « parlé ». Aujourd'hui, on ouvre cette boîte. Tu vas découvrir le mécanisme qui a fait toute la révolution de l'IA depuis 2017 : **l'attention**.

> 📌 **Pour qui** : tu sors de l'épisode précédent (tokens, embeddings, logits, softmax, boucle autorégressive). Aucune connaissance en machine learning n'est supposée. **Et surtout : aucun bagage mathématique n'est supposé non plus.** Ce document a été spécialement conçu pour que les maths ne soient jamais un obstacle : on commence par une **boîte à outils** qui construit, à partir de zéro et avec des petits nombres, les trois seules opérations dont on aura besoin. On ne rencontrera jamais une formule sans l'avoir d'abord apprivoisée à la main.

> 💻 **Prérequis matériel** : les manips de base tournent en **CPU** sur n'importe quel ordinateur récent — on manipule de tout petits exemples pour *comprendre*, un GPU n'apporterait rien. Une **Partie D bonus** (facultative) visualise l'attention d'un vrai modèle ; elle profite d'un **GPU NVIDIA compatible CUDA** si tu en as un, mais le modèle utilisé (DistilBERT) est assez léger pour tourner **aussi en CPU**. On reste sur **`uv`** et le projet `llm-formation` créé à l'épisode précédent.

> ⏱️ **Durée** : prévois 3 à 4 h en comptant la boîte à outils maths (à faire sans se presser). L'attention est *la* notion clé de toute la suite. Découpage conseillé : Partie 0 + A + B en session 1 ; C + D en session 2.

---

## 🎯 Objectifs d'apprentissage

À la fin de ce module, tu seras capable de :

1. **Manipuler sans blocage** les trois outils maths de l'attention : produit scalaire, multiplication de tableaux de nombres, softmax.
2. **Expliquer le problème** que l'attention résout (pourquoi les embeddings de l'épisode précédent ne suffisaient pas).
3. **Définir** les trois rôles *Query*, *Key*, *Value* avec une analogie simple, sans jargon.
4. **Calculer à la main** un score d'attention entre deux mots et dire ce qu'il signifie.
5. **Décrire** ce qu'ajoutent le *multi-head*, les couches empilées, et situer l'attention dans un Transformer.

> 🧠 Garde ces 5 objectifs en tête. À la fin, tu reviendras les cocher un par un.

---

## 🧭 Prérequis et préparation

**Côté savoir** : les acquis de l'épisode précédent (surtout : un token devient un *embedding*, une liste de nombres = une position sur la « carte du sens »). **Rien d'autre** : les maths nécessaires sont enseignées ici même, en Partie 0.

**Côté outils** : on réutilise le projet `llm-formation` du premier épisode. Place-toi dedans :

```bash
cd llm-formation        # le projet uv créé à l'épisode précédent
```

Pour les manips de base (Parties 0 à C), on a juste besoin de NumPy (souvent déjà là depuis le premier épisode) :

```bash
uv add numpy            # si déjà ajouté avant, uv ne fait rien : c'est normal
```

> 💡 **Rappel des commandes `uv`** : `uv add <paquet>` pour une dépendance, `uv run <script>.py` pour lancer un script dans l'environnement du projet.

> ⚠️ Une section de dépannage t'attend en bas (« 🔧 Si ça coince »).

---
---

## PARTIE 0 — Boîte à outils maths (à lire en premier)

> 🧰 **Pourquoi cette partie existe** : l'attention repose entièrement sur **trois opérations**, et ce sont elles — pas l'idée de l'attention — qui rebutent au premier abord. On va donc les construire une par une, avec des **petits nombres entiers** qu'on calcule à la main, **avant** de voir la moindre ligne compliquée. Une fois ces trois outils en poche, l'attention devient facile. Ne saute pas cette partie : c'est l'investissement qui rend tout le reste simple.

Les trois outils :
1. **Le produit scalaire** — mesurer si deux listes de nombres « vont dans le même sens ».
2. **La multiplication de tableaux** (et la notation `@`, `.T`) — faire plein de produits scalaires d'un coup.
3. **Le softmax** — transformer des scores quelconques en pourcentages qui font 100 %.

### 0.1 — Outil n°1 : le produit scalaire

#### L'idée en une phrase

> 📌 **Le produit scalaire prend deux listes de nombres de même longueur, les multiplie terme à terme, et additionne le tout.** Le résultat est **un seul nombre**. Ce nombre est grand quand les deux listes « se ressemblent », petit (ou négatif) quand elles s'opposent.

#### Le calcul, à la main, avec des petits nombres

Prenons deux listes de 3 nombres : A = [2, 1, 0] et B = [3, 1, 4].

On aligne, on multiplie chaque paire, on additionne :

```text
   A =  [ 2 ,  1 ,  0 ]
   B =  [ 3 ,  1 ,  4 ]
         │    │    │
         ▼    ▼    ▼
       2×3  1×1  0×4        (on multiplie chaque paire)
        6  + 1  + 0  = 7    (on additionne tout)

   Produit scalaire de A et B = 7
```

C'est tout. Aucune subtilité : multiplier les paires, additionner.

#### Pourquoi ça mesure la « ressemblance »

Regarde ces trois cas (calcule-les toi-même pour t'entraîner) :

- [1, 0] et [1, 0] → 1×1 + 0×0 = **1** (identiques → grand)
- [1, 0] et [0, 1] → 1×0 + 0×1 = **0** (rien en commun → nul)
- [1, 0] et [-1, 0] → 1×(-1) + 0×0 = **-1** (opposés → négatif)

> 💡 **L'intuition à garder** : deux listes qui « pointent dans la même direction » donnent un grand produit scalaire ; deux listes « sans rapport » donnent zéro ; deux listes « opposées » donnent un nombre négatif. C'est exactement la mesure de ressemblance qu'on utilisait à l'épisode précédent (« sens proche = vecteurs proches »), en version brute.

#### 🔬 Micro-manip 0-A — le produit scalaire en Python (deux façons)

Crée `j2_p0_produit_scalaire.py` :

```python
# j2_p0_produit_scalaire.py — le produit scalaire, à la main puis avec NumPy
import numpy as np

A = [2, 1, 0]
B = [3, 1, 4]

# --- Façon 1 : "à la main", avec une boucle (pour bien VOIR ce qui se passe) ---
total = 0
for i in range(len(A)):
    produit = A[i] * B[i]
    print(f"  {A[i]} × {B[i]} = {produit}")
    total = total + produit
print("Produit scalaire (à la main) :", total)

# --- Façon 2 : avec NumPy, en une seule opération (le raccourci) ---
a = np.array(A)
b = np.array(B)
print("Produit scalaire (NumPy)     :", a @ b)   # le symbole @ fait exactement la Façon 1
```

Lance : `uv run j2_p0_produit_scalaire.py`

> ✅ **Checkpoint** : les deux façons donnent **7**. Tu viens de voir que le symbole `@` en Python n'est **rien d'autre** que « multiplier les paires et additionner » — la boucle que tu as écrite au-dessus. Retiens ça : **`@` = produit scalaire automatisé.**

#### 📚 Ressource externe (produit scalaire, expliqué en images)

- **3Blue1Brown — « Produit scalaire et dualité »** (chapitre 9 de la série *Essence de l'algèbre linéaire*), sur `youtube.com` (chaîne 3Blue1Brown, sous-titres FR disponibles) ou `3blue1brown.com/lessons/dot-products`. La meilleure explication visuelle : elle montre *géométriquement* pourquoi le produit scalaire mesure une ressemblance de direction. Regarde-la si l'intuition ne te semble pas encore évidente.
- Alternative écrite plus scolaire : **Khan Academy**, recherche « produit scalaire » (fr.khanacademy.org). Beaucoup d'exercices corrigés.

**Mini-résumé 0.1** : produit scalaire = multiplier terme à terme + additionner → **un nombre** qui mesure la ressemblance. En Python : `a @ b`.

### 0.2 — Outil n°2 : multiplier des tableaux (et la notation `@`, `.T`)

#### Le pourquoi

En pratique, on ne fait pas *un* produit scalaire, mais **beaucoup d'un coup** : « le mot X comparé à tous les autres mots ». Un **tableau de nombres** (une *matrice*) permet d'empiler plusieurs listes, et la **multiplication de tableaux** calcule tous les produits scalaires en une seule opération.

#### Un tableau = des lignes empilées

Une matrice, c'est juste des listes rangées en lignes. Par exemple, 3 mots ayant chacun 2 nombres :

```text
        colonne 0   colonne 1
ligne 0 [   1    ,     0    ]   ← mot 0
ligne 1 [   0    ,     1    ]   ← mot 1
ligne 2 [   2    ,     3    ]   ← mot 2
```

On dit que ce tableau a une **forme** « 3 lignes × 2 colonnes », noté **3×2**.

#### La règle de la multiplication `@`, en une image

Quand on écrit `M @ N`, **chaque case du résultat est le produit scalaire d'une ligne de M avec une colonne de N**. Prenons un exemple minuscule, entièrement à la main :

```text
   M (2×2)          N (2×2)
   [1  2]           [5  6]
   [3  4]           [7  8]

   Résultat R = M @ N , case par case :

   R[0,0] = (ligne 0 de M) · (colonne 0 de N) = [1,2]·[5,7] = 1×5 + 2×7 = 19
   R[0,1] = (ligne 0 de M) · (colonne 1 de N) = [1,2]·[6,8] = 1×6 + 2×8 = 22
   R[1,0] = (ligne 1 de M) · (colonne 0 de N) = [3,4]·[5,7] = 3×5 + 4×7 = 43
   R[1,1] = (ligne 1 de M) · (colonne 1 de N) = [3,4]·[6,8] = 3×6 + 4×8 = 50

   R = [19  22]
       [43  50]
```

> 📌 **La seule chose à retenir** : `@` entre deux tableaux = **plein de produits scalaires** (ligne de gauche × colonne de droite), rangés dans une grille. Tu sais déjà faire un produit scalaire (0.1) ; `@` ne fait que les répéter.

#### Le `.T` : « coucher » le tableau (transposition)

Parfois, pour que les produits scalaires tombent juste, il faut **échanger lignes et colonnes** d'un tableau. C'est la **transposition**, notée `.T`. Visuellement, on bascule le tableau sur le côté :

```text
   K (3×2)                K.T (2×3)   ← lignes et colonnes échangées
   [1  0]                 [1  0  2]
   [0  1]        .T  →     [0  1  3]
   [2  3]
```

La ligne `[1, 0]` de K devient la colonne `[1, 0]` de K.T, etc. On l'utilisera pour une raison simple : quand on veut comparer **toutes les lignes d'un tableau avec toutes les lignes d'un autre**, on écrit `A @ B.T`. Le `.T` remet le second tableau « dans le bon sens » pour que chaque comparaison soit un produit scalaire ligne-contre-ligne.

> 💡 Tu n'as pas besoin de maîtriser la théorie de la transposition. Retiens l'usage : **`A @ B.T` = comparer chaque ligne de A à chaque ligne de B** (tous les produits scalaires croisés). C'est précisément ce que fait l'attention.

#### 🔬 Micro-manip 0-B — vérifie la multiplication à la main

Crée `j2_p0_multiplication.py` :

```python
# j2_p0_multiplication.py — vérifier @ et .T sur de petits tableaux
import numpy as np

M = np.array([[1, 2],
              [3, 4]])
N = np.array([[5, 6],
              [7, 8]])

print("M @ N =")
print(M @ N)          # doit afficher [[19 22] [43 50]] — les nombres calculés à la main

K = np.array([[1, 0],
              [0, 1],
              [2, 3]])
print("\nK (forme", K.shape, ") :")
print(K)
print("\nK.T (forme", K.T.shape, ") — lignes et colonnes échangées :")
print(K.T)

# "Comparer chaque ligne de K à chaque ligne de K" = K @ K.T
print("\nK @ K.T (tous les produits scalaires croisés) :")
print(K @ K.T)
```

Lance : `uv run j2_p0_multiplication.py`

> ✅ **Checkpoint** : `M @ N` donne bien `[[19 22] [43 50]]` (tes calculs à la main !), et tu vois `K.T` échanger lignes et colonnes. Regarde `K @ K.T` : c'est une grille 3×3 où la case (i, j) dit à quel point le mot i ressemble au mot j. **Cette grille de ressemblances est exactement ce que l'attention calcule** — tu y es presque.

#### 📚 Ressource externe (multiplication de matrices, pas à pas)

- **Khan Academy — « Multiplier les matrices »** (fr.khanacademy.org, section Précalcul › Matrices). Vidéos courtes de Sal Khan qui refont le calcul case par case, exactement comme ci-dessus, avec des exercices auto-corrigés. Idéal si la règle « ligne × colonne » ne te semble pas encore automatique.
- Version image + code : **Built In, « Dot Product of a Matrix: Explained »** (builtin.com) montre le lien produit scalaire → multiplication de matrices avec des captures NumPy.

**Mini-résumé 0.2** : un tableau = des lignes empilées (forme « lignes × colonnes »). `@` = plein de produits scalaires (ligne × colonne). `.T` = échanger lignes/colonnes. **`A @ B.T` = toutes les ressemblances croisées.**

### 0.3 — Outil n°3 : le softmax

#### Le pourquoi

On obtient souvent des **scores bruts** (des nombres quelconques, parfois négatifs) et on veut les transformer en **pourcentages** : positifs, et dont la somme fait 100 %. Ça permet de les lire comme des « parts » (des poids). C'est le rôle du **softmax** — tu l'as déjà croisé à l'épisode précédent pour passer des logits aux probabilités.

#### La recette, en 3 gestes

Pour une liste de scores :

1. **Exponentielle** de chaque score. (L'exponentielle, notée `exp`, transforme tout nombre en un nombre **positif** ; elle écrase les négatifs vers 0 et fait grimper vite les positifs — ce qui **accentue les écarts**.)
2. **Additionne** tous ces résultats → un total.
3. **Divise** chaque exponentielle par ce total → chaque score devient une **part** du total. La somme fait forcément 100 %.

#### Le calcul, à la main, avec des petits nombres

Prenons trois scores : [2, 1, 0].

```text
   Étape 1 — exponentielle de chaque score (valeurs arrondies) :
      exp(2) ≈ 7.39
      exp(1) ≈ 2.72
      exp(0) = 1.00

   Étape 2 — total :
      7.39 + 2.72 + 1.00 = 11.11

   Étape 3 — chacun divisé par le total :
      7.39 / 11.11 ≈ 0.665   → 66.5 %
      2.72 / 11.11 ≈ 0.245   → 24.5 %
      1.00 / 11.11 ≈ 0.090   →  9.0 %

   Somme : 66.5 + 24.5 + 9.0 = 100 %   ✅
```

> 📌 **Ce qu'il faut retenir** : le softmax transforme n'importe quels scores en **pourcentages qui totalisent 100 %**, **sans changer leur ordre** (le plus grand score reste le plus grand pourcentage). Il **accentue** les écarts : ici, un score 2 vs 1 (écart de 1) devient 66 % vs 24 % (écart bien plus marqué). C'est ce qui fait « ressortir » le gagnant.

#### 🔬 Micro-manip 0-C — le softmax en Python (à la main puis raccourci)

Crée `j2_p0_softmax.py` :

```python
# j2_p0_softmax.py — le softmax, décomposé puis en version courte
import numpy as np

scores = np.array([2.0, 1.0, 0.0])

# --- Version décomposée (les 3 gestes, visibles) ---
etape1 = np.exp(scores)          # exponentielle de chaque score
print("Étape 1 (exp)   :", np.round(etape1, 2))
etape2 = etape1.sum()            # total
print("Étape 2 (total) :", round(etape2, 2))
etape3 = etape1 / etape2         # chacun divisé par le total
print("Étape 3 (parts) :", np.round(etape3, 3))
print("Somme des parts :", round(etape3.sum(), 3), "(=1, soit 100 %)")

# --- Version courte, réutilisable (une fonction softmax) ---
def softmax(x):
    e = np.exp(x - x.max())      # le "- x.max()" évite juste des nombres trop grands
    return e / e.sum()           # (ça ne change pas le résultat, ça le stabilise)

print("\nAvec la fonction softmax :", np.round(softmax(scores), 3))
```

Lance : `uv run j2_p0_softmax.py`

> ✅ **Checkpoint** : tu obtiens environ `[0.665, 0.245, 0.090]`, somme = 1 — exactement tes calculs à la main. La petite fonction `softmax(x)` te resservira dans toutes les manips suivantes. (Le `- x.max()` est un détail technique de stabilité : il évite des exponentielles gigantesques, sans changer le résultat.)

#### 📚 Ressource externe (softmax, simplement)

- **Vidéo « Softmax function explained »** sur `youtube.com` (nombreuses versions courtes de 5-8 min ; cherche « softmax explained simply »). Visualisent les 3 gestes exp → somme → division.
- Écrit : la page **« Softmax activation function »** sur `machinelearningmastery.com` explique le rôle du softmax avec des exemples numériques accessibles.

**Mini-résumé 0.3** : softmax = exp de chaque score, puis chacun divisé par le total → **pourcentages sommant à 100 %**, ordre préservé, écarts accentués.

---

> 🧰 **Fin de la boîte à outils.** Tu possèdes maintenant les **trois** seuls outils dont l'attention a besoin : produit scalaire (ressemblance), multiplication `@`/`.T` (plein de ressemblances d'un coup), softmax (scores → parts). **Tout ce qui suit ne fait que les combiner.** Si l'un des trois est encore flou, refais sa micro-manip et regarde sa ressource avant de continuer — le reste en dépend directement.

---
---

## 🗺️ Vue d'ensemble : la seule idée de l'épisode

Si tu ne retiens qu'une phrase sur l'attention elle-même :

> 📌 **Point clé** : **l'attention permet à chaque mot de regarder les autres mots de la phrase et d'en récupérer l'information utile**, pour enrichir son propre sens selon le contexte. C'est l'opération qui transforme une simple liste de mots indépendants en une phrase où chaque mot « comprend » son entourage.

Resituons-la dans le pipeline de l'épisode précédent, avec la boîte qu'on ouvre aujourd'hui mise en évidence :

```text
   "The capital of France is"
              │
              ▼
   [ TOKENISATION ]        épisode 1 — texte découpé en tokens, puis en numéros
              │
              ▼
   [ EMBEDDINGS ]          épisode 1 — chaque token = une position sur la carte du sens
              │            (MAIS : les mots ne se sont pas encore "parlé")
              ▼
   ╔════════════════════╗
   ║  LE CERVEAU :      ║   ◄────  CET ÉPISODE, C'EST ICI
   ║  couches           ║         des couches empilées, dont le cœur est
   ║  Transformer       ║         le MÉCANISME D'ATTENTION : les mots échangent
   ║  (ATTENTION)       ║         de l'information et s'enrichissent mutuellement
   ╚════════════════════╝
              │
              ▼
   [ LOGITS -> SOFTMAX ]   épisode 1 — une note par mot possible -> probabilités
              │
              ▼
   [ ON CHOISIT UN MOT ]   épisode 1 -> "Paris", puis on recommence (autorégression)
```

> 📌 **Comment lire la suite** : quatre parties.
> - **Partie A** — *pourquoi* l'attention est nécessaire (le problème à résoudre).
> - **Partie B** — *comment* l'attention marche, en combinant tes 3 outils. **C'est le cœur.**
> - **Partie C** — ce qui transforme cette brique en vrai Transformer (multi-head, couches).
> - **Partie D** — bonus : **visualiser l'attention** d'un vrai modèle (sur ton GPU si tu en as un).

#### 🧵 Notre fil rouge (suite de l'épisode précédent) : « Paris »

À l'épisode précédent, le vecteur de ` France` ne « savait » pas qu'on parlait de capitale. La question du jour, résolue en Partie B :

> *Comment le mot ` is`, au moment de prédire la suite, va-t-il « regarder » ` capital` et ` France` pour comprendre qu'on attend un nom de capitale — et donc faire monter « Paris » ?*

---
---

## PARTIE A — Pourquoi les embeddings ne suffisent pas

Avant d'apprendre *comment* marche l'attention, il faut ressentir *pourquoi* on en a besoin. Cette partie est courte mais conditionne tout le reste. (Elle ne contient pas de maths : respire.)

### A.1 — Le problème du sens figé

> ❓ **Question d'ouverture** : le mot « avocat » a-t-il un seul sens ? Si un modèle attribue **un seul** vecteur fixe à « avocat », que se passe-t-il dans « je mange un avocat » vs « mon avocat plaide demain » ?

#### Le constat

À l'épisode précédent, chaque token reçoit un embedding — une position sur la carte du sens. Mais cette position est **figée** : « avocat » a le même vecteur de départ quel que soit le contexte. Or dans « je mange un **avocat** » c'est un fruit, et dans « mon **avocat** plaide demain » c'est un juriste. Un sens figé ne peut pas distinguer les deux. Il manque un mécanisme qui **ajuste** le sens de chaque mot **en fonction de son entourage**.

#### L'analogie : entrer dans une réunion

Tu arrives dans une réunion. Au départ tu as une identité générale (« moi »). Mais le sens de ta présence dépend de **qui d'autre est là** : entouré de juristes, tu es « le client » ; entouré de cuisiniers, tu es « celui qui a apporté le dessert ». Tu n'as pas changé de personne — ton rôle s'est **précisé au contact des autres**. L'attention fait ça pour les mots.

> 📌 **Point clé** : l'embedding de l'épisode précédent donne un sens **général et figé**. L'attention produit un sens **contextualisé** : « avocat » entouré de « plaide » et « tribunal » glisse vers le sens juridique.

### A.2 — Le problème des relations à distance

> ❓ **Question d'ouverture** : dans « La clé que j'ai posée sur la table de la cuisine hier soir est **introuvable** », qu'est-ce qui est introuvable ? Combien de mots séparent la réponse de « introuvable » ?

#### Le constat

Pour comprendre « introuvable », il faut le relier à « clé » — situé **loin** en arrière, par-dessus une dizaine de mots. Le sens dépend de **relations entre mots éloignés**. Un mécanisme qui ne regarderait que le mot précédent raterait ce lien.

> 💡 **Pourquoi c'est un vrai défi historique** : les anciens modèles (avant 2017, les *RNN*) lisaient mot à mot et avaient du mal à « se souvenir » d'un mot vu longtemps avant. L'attention règle ça : elle laisse **chaque mot regarder directement tous les autres**, proches ou lointains. C'est l'idée de l'article fondateur de 2017, « Attention Is All You Need ».

**Mini-résumé de la Partie A**
- Les embeddings donnent un sens **figé** : ils ne distinguent pas « avocat »-fruit de « avocat »-juriste.
- Le sens réel dépend du **contexte** et de **relations parfois lointaines**.
- Il faut un mécanisme qui laisse chaque mot **regarder les autres** : **l'attention**.

---
---

## PARTIE B — Comment marche l'attention (LE CŒUR)

C'est ici que tout se joue. **Bonne nouvelle** : tu as déjà appris toute la mécanique en Partie 0. L'attention = produit scalaire (pour mesurer qui ressemble à qui) + softmax (pour en faire des parts) + une moyenne pondérée. On va juste assembler ces briques.

### B.1 — L'idée centrale : chercher, faire correspondre, récupérer

> ❓ **Question d'ouverture** : comment trouves-tu une vidéo sur YouTube ? Tu tapes ce que tu **cherches**, le site compare à des **étiquettes**, et te renvoie le **contenu** qui correspond. Garde cette image.

L'attention reproduit ce schéma de recherche, pour chaque mot. Trois rôles — le trio **Query, Key, Value** (Requête, Clé, Valeur) :

- **Query (Requête)** — ce qu'un mot **cherche**. ` is` se demande : « de quoi parle-t-on ? quel genre de mot devrait suivre ? »
- **Key (Clé)** — l'**étiquette** que chaque mot présente : « voici de quoi je parle ». ` France` présente une étiquette « pays / lieu ».
- **Value (Valeur)** — l'**information réelle** transmise si le mot est sélectionné : le contenu de ` France`.

#### L'analogie complète : la recherche YouTube (pour chaque mot)

1. ` is` formule sa **Query** (« je cherche le sujet »).
2. On la compare aux **Keys** de tous les mots (les étiquettes de `The`, ` capital`, ` of`, ` France`…) — **par un produit scalaire** (ton outil n°1 !).
3. Les mots dont la Key **correspond** le mieux reçoivent un **score** élevé.
4. On passe ces scores au **softmax** (ton outil n°3 !) → des **parts** (poids d'attention).
5. ` is` récupère un mélange des **Values**, **pondéré par ces parts** : beaucoup de ` capital` et ` France`, peu du reste.

> 📌 **Point clé** : Query/Key/Value ne sont pas mystérieux. Ce sont **trois versions** du même embedding, obtenues en le multipliant par trois tableaux de nombres **appris** (les fameuses « matrices » Q, K, V). Dans nos manips, on simplifiera en prenant Q = K = V = l'embedding, pour se concentrer sur la mécanique.

### B.2 — Le score d'attention, calculé à la main

> ❓ **Rappel express** : comment mesurer si une Query « correspond » à une Key, alors que ce sont deux listes de nombres ? (Tu connais la réponse depuis la Partie 0.)

#### 🧮 Rappel maths (Partie 0)

On va enchaîner tes trois outils. Garde-les sous les yeux :
- **Produit scalaire** (0.1) : multiplier terme à terme + additionner → un nombre de ressemblance. En code : `a @ b`.
- **Softmax** (0.3) : scores → pourcentages sommant à 100 %. En code : la fonction `softmax(x)`.
- La **mise à l'échelle** ci-dessous (division par un petit nombre) est un simple ajustement de stabilité, sans importance conceptuelle.

#### Les 4 étapes de l'attention pour un mot

Pour un mot qui interroge (sa Query) face à tous les mots (leurs Keys) :

1. **Scores bruts** : produit scalaire de la Query avec **chaque** Key → un nombre par mot.
2. **Mise à l'échelle** : on divise par la racine de la taille des vecteurs (détail de stabilité ; retiens « on normalise »).
3. **Softmax** : scores → **poids d'attention** (parts sommant à 100 %). « 70 % d'attention sur ` France`, 20 % sur ` capital`, 10 % au reste ».
4. **Mélange** : moyenne des **Values** pondérée par ces poids → le nouveau vecteur, enrichi du contexte.

#### 🔬 Manip 1 — un pas d'attention, entièrement à la main

On prend 3 mots et des vecteurs minuscules (2 nombres) pour tout suivre. **On calcule d'abord sans aucun raccourci**, avec des boucles visibles. Crée `j2_manip1_attention_main.py` :

```python
# j2_manip1_attention_main.py — UN pas d'attention, décomposé au maximum
import numpy as np

# 3 mots, chacun = mini-vecteur de 2 nombres (embeddings fictifs).
# mot0 = "capital", mot1 = "France", mot2 = "is"
emb = {
    "capital": np.array([1.0, 0.0]),
    "France":  np.array([0.9, 0.1]),
    "is":      np.array([0.0, 1.0]),
}
mots = ["capital", "France", "is"]

# Simplification pédagogique : Query = Key = Value = l'embedding.
# --- Le mot "is" interroge tous les mots ---
query = emb["is"]

# ÉTAPE 1 — scores bruts : produit scalaire de la Query "is" avec CHAQUE Key.
# On le fait à la main, mot par mot, pour bien voir (outil n°1 de la Partie 0).
print("ÉTAPE 1 — scores bruts (ressemblance de 'is' avec chaque mot) :")
scores = []
for m in mots:
    key = emb[m]
    score = query @ key            # produit scalaire = ressemblance
    scores.append(score)
    print(f"   is · {m:8} = {score:.2f}")
scores = np.array(scores)

# ÉTAPE 2 — mise à l'échelle (division par racine de la dimension = 2 nombres).
scores = scores / np.sqrt(2)
print("\nÉTAPE 2 — scores mis à l'échelle :", np.round(scores, 3))

# ÉTAPE 3 — softmax : transformer en parts (outil n°3 de la Partie 0).
def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()
poids = softmax(scores)
print("ÉTAPE 3 — poids d'attention de 'is' :", np.round(poids, 3),
      " (somme =", round(poids.sum(), 3), ")")

# ÉTAPE 4 — mélange : moyenne des Values pondérée par les poids.
# On le fait à la main : chaque Value multipliée par son poids, puis on additionne.
nouveau = np.zeros(2)
for poids_m, m in zip(poids, mots):
    nouveau = nouveau + poids_m * emb[m]
print("\nÉTAPE 4 —")
print("   ancien vecteur de 'is'  :", emb["is"])
print("   nouveau vecteur de 'is' :", np.round(nouveau, 3))
```

Lance : `uv run j2_manip1_attention_main.py`

> ✅ **Checkpoint** : observe les **poids d'attention** de « is », puis compare son **ancien** et son **nouveau** vecteur : le nouveau a bougé **vers** les mots auxquels « is » a prêté attention. Tu viens d'exécuter, étape par étape et sans aucune magie, l'opération qui contextualise un mot. **C'est le cœur de toute l'IA moderne — et ce ne sont que tes 3 outils de la Partie 0 enchaînés.**

#### ✍️ À toi de jouer

1. Change l'embedding de « is » en `[0.95, 0.05]` (proche de « capital »/« France »). Ses poids vont-ils se concentrer davantage sur ces deux mots ? Prédis, puis vérifie.
2. Si le poids d'attention de « is » sur « France » vaut 0.7, que signifie ce 0.7 concrètement ?
3. Repère dans le code **où** interviennent tes trois outils de la Partie 0 (produit scalaire, mise à l'échelle, softmax). Nomme la ligne de chacun.

<details>
<summary>👉 Voir les réponses</summary>

1. **Plus concentrés** : rapprocher la Query de « is » des Keys de « capital » et « France » augmente leur produit scalaire (étape 1), donc après softmax (étape 3) ces deux mots captent une part plus grande. *Plus une Key ressemble à la Query, plus son poids monte.*
2. Cela signifie que, pour construire son nouveau sens, « is » récupère **70 % de l'information (Value) de « France »**. « France » domine ce que « is » « écoute » à cet instant.
3. **Produit scalaire** : `score = query @ key` (dans la boucle de l'étape 1). **Mise à l'échelle** : `scores / np.sqrt(2)` (étape 2). **Softmax** : l'appel `softmax(scores)` (étape 3). L'étape 4 est une simple moyenne pondérée (multiplier chaque Value par son poids, additionner).

</details>

**Mini-résumé de B.1–B.2**
- L'attention = **chercher (Query), faire correspondre (Key), récupérer (Value)**.
- La correspondance = **produit scalaire** (outil 1) ; on la convertit en **poids** par **softmax** (outil 3).
- Le nouveau vecteur d'un mot = **moyenne des Values pondérée** par ces poids → sens **contextualisé**.

### B.3 — L'auto-attention : tous les mots, en même temps

> ❓ **Question d'ouverture** : dans la manip 1, seul « is » interrogeait. Mais chaque mot doit s'enrichir. Comment faire pour **tous** les mots à la fois ?

#### Le pourquoi : « self-attention »

Dans un Transformer, **chaque** mot interroge tous les mots : la phrase se regarde **elle-même**, d'où **auto-attention** (*self-attention*). Avantage : ça se calcule **en parallèle** pour toute la phrase d'un coup — exactement ce que permet la multiplication de tableaux (ton outil n°2), et ce pour quoi un GPU excelle (Partie D).

#### 🧮 Rappel maths (Partie 0)

Un seul outil nouveau à mobiliser ici : **`A @ B.T` = toutes les ressemblances croisées** (0.2). Ici on écrit `X @ X.T` : chaque ligne du résultat = un mot comparé à tous les autres. Le softmax sera ensuite appliqué **ligne par ligne**.

#### 🔬 Manip 2 — l'attention pour toute la phrase, d'un coup

On généralise la manip 1 avec la multiplication de tableaux. Crée `j2_manip2_self_attention.py` :

```python
# j2_manip2_self_attention.py — self-attention sur toute la phrase, via @ et .T
import numpy as np

# 4 mots fictifs, vecteurs de dimension 3.  "capital", "France", "is", "and"
X = np.array([
    [1.0, 0.0, 0.2],   # capital
    [0.9, 0.1, 0.1],   # France
    [0.2, 0.8, 0.0],   # is
    [0.1, 0.1, 1.0],   # and  (hors-sujet)
])
d = X.shape[1]         # 3 (nombre de colonnes = taille des vecteurs)

# ÉTAPE 1+2 — TOUS les scores d'un coup avec @ et .T (rappel outil n°2 : A @ B.T).
# Chaque LIGNE = un mot qui interroge ; chaque COLONNE = un mot interrogé. Grille 4×4.
scores = (X @ X.T) / np.sqrt(d)
print("Grille des scores (avant softmax) :")
print(np.round(scores, 2))

# ÉTAPE 3 — softmax LIGNE PAR LIGNE (chaque mot répartit 100 % de son attention).
def softmax_lignes(M):
    e = np.exp(M - M.max(axis=1, keepdims=True))   # axis=1 = on travaille ligne par ligne
    return e / e.sum(axis=1, keepdims=True)
poids = softmax_lignes(scores)
print("\nMatrice des poids d'attention (lignes = qui regarde, colonnes = qui est regardé) :")
print(np.round(poids, 2))

# ÉTAPE 4 — nouveaux vecteurs = poids @ Values (ici Values = X).
sortie = poids @ X
print("\nVecteurs contextualisés :")
print(np.round(sortie, 3))
```

Lance : `uv run j2_manip2_self_attention.py`

> ✅ **Checkpoint** : tu obtiens une **matrice 4×4** de poids. Chaque **ligne** somme à 1 (un mot répartit toute son attention). Regarde la ligne de « France » : sur quels mots se concentre-t-elle ? Elle prête surtout attention aux mots qui lui ressemblent et ignore « and » (hors-sujet). **Cette matrice, c'est exactement ce que tu visualiseras sur un vrai modèle en Partie D.**

> 💡 **Le mot-clé pour la suite** : cette matrice de poids s'appelle la **carte d'attention**. Sur un vrai modèle, elle révèle quels mots « regardent » quels autres — un pronom qui regarde le nom qu'il remplace, un verbe qui regarde son sujet. C'est l'objet de la Partie D.

#### 🧵 « Paris » — la résolution de notre fil rouge

On peut enfin répondre à la question ouverte depuis le premier épisode. Quand le modèle traite « The capital of France is » pour prédire la suite :

1. ` is` (la position qui va générer le mot suivant) émet une **Query** qui « cherche le sujet ».
2. Cette Query a un **grand produit scalaire** avec les **Keys** de ` capital` et ` France`.
3. Après **softmax**, ` is` récupère une grande part de leurs **Values** : son vecteur encode « capitale + France ».
4. Ce vecteur enrichi, en fin de pipeline, produit des **logits** (vus à l'épisode précédent) où **« Paris » domine**.

**Voilà.** Le chaînon manquant de l'épisode précédent est comblé : c'est l'attention — produit scalaire + softmax + moyenne pondérée — qui a fait « savoir » à la phrase qu'on parlait de la capitale de la France.

#### ✍️ À toi de jouer

1. Pourquoi parle-t-on d'auto-attention (*self*-attention) plutôt que d'attention tout court ?
2. Dans la matrice 4×4, que signifierait une ligne « plate » (tous les poids ≈ 0.25) pour un mot ?
3. Pourquoi la ligne `scores = (X @ X.T) / np.sqrt(d)` remplace-t-elle, à elle seule, toute la boucle de la manip 1 ?

<details>
<summary>👉 Voir les réponses</summary>

1. Parce que la séquence **se regarde elle-même** : Query, Key et Value proviennent des **mêmes** mots de la phrase. Chaque mot interroge ses voisins (et lui-même) issus de la même séquence — d'où « auto »/« self ».
2. Une ligne plate = ce mot **répartit son attention uniformément** sur tous les autres, sans en privilégier aucun : il ne trouve aucune correspondance forte, il « écoute tout le monde pareil ». Son vecteur contextualisé devient une moyenne quasi neutre.
3. Parce que `X @ X.T` calcule **d'un coup tous les produits scalaires croisés** (chaque mot contre chaque mot), là où la manip 1 ne faisait qu'une seule ligne (« is » contre les autres) via une boucle. C'est exactement l'intérêt de l'outil n°2 : remplacer plein de boucles par une multiplication de tableaux.

</details>

**Mini-résumé de B.3**
- **Auto-attention** = tous les mots interrogent tous les mots, en **parallèle** via `X @ X.T`.
- La **matrice des poids** (carte d'attention) dit qui regarde qui ; chaque ligne somme à 100 %.
- C'est ce mécanisme qui contextualise ` is` vers « capitale + France » → fait monter « Paris ».

---
---

## PARTIE C — De la brique au Transformer

> Tu maîtrises maintenant **une** opération d'attention. Un vrai Transformer en empile beaucoup, avec quelques ajouts. Cette partie donne la vue d'ensemble — utile mais moins fondamentale. Tu peux la garder pour une 2ᵉ session. (Peu de maths ici.)

### C.1 — Le multi-head : plusieurs attentions en parallèle

> ❓ **Question d'ouverture** : un mot n'a-t-il qu'**une** chose à regarder ? Dans « Le chat **noir** dort », « noir » se rapporte à « chat » (grammaire) mais compte aussi pour le sens visuel. Peut-on regarder **plusieurs types de relations** à la fois ?

#### L'idée

Plutôt qu'une seule attention, le Transformer en fait tourner **plusieurs en parallèle** : les **têtes** (*heads*). Chaque tête se spécialise : une suit les **relations grammaticales** (sujet-verbe), une autre les **liens de sens**, une autre les **références** (un pronom et son nom). C'est l'**attention multi-têtes** (*multi-head attention*).

#### L'analogie : plusieurs lecteurs spécialisés

Tu fais relire un contrat par plusieurs experts en même temps : un juriste regarde les clauses, un comptable les chiffres, un commercial les engagements. Chacun « fait attention » à un aspect, puis on **combine** leurs lectures. Les têtes d'attention, c'est ça.

> 📌 **Point clé** : le multi-head ne change pas le principe de la Partie B — c'est **la même opération, répétée en parallèle** avec des tableaux Query/Key/Value différents par tête. On concatène ensuite les résultats. Un modèle a typiquement 12 à 96 têtes par couche.

### C.2 — Empiler les couches : le raffinement progressif

> ❓ **Question d'ouverture** : une seule passe d'attention suffit-elle pour une phrase complexe ?

#### L'idée

Un bloc Transformer = une attention multi-têtes **suivie** d'un petit réseau de neurones (qui « digère » l'information de chaque mot). On **empile** ces blocs : 12, 32, 80 couches selon le modèle (les « 4 chiffres » de l'épisode précédent). La sortie d'une couche = l'entrée de la suivante.

Effet : un **raffinement progressif**. Les **premières** couches captent des relations locales/grammaticales ; les **intermédiaires** assemblent des groupes de sens ; les **dernières** manipulent des concepts abstraits, prêts à produire les logits.

#### L'analogie : la chaîne de relecture

Chaque couche est un relecteur qui reçoit le travail du précédent et l'affine : orthographe, puis grammaire, puis style, puis sens global. Après 32 relecteurs, la représentation de chaque mot est très raffinée.

> 💡 **Ce qu'on laisse de côté volontairement** : d'autres pièces existent (*connexions résiduelles* qui évitent de perdre l'information d'origine, *normalisation* qui stabilise, *réseau feed-forward* après l'attention). Retiens : **attention multi-têtes + petit réseau, empilés N fois**. « The Illustrated Transformer » (ressources) détaille tout en schémas.

**Mini-résumé de la Partie C**
- **Multi-head** : plusieurs attentions en parallèle, chacune spécialisée, puis fusionnées.
- **Couches empilées** : raffinement progressif du sens (local → abstrait).
- Un bloc = **attention multi-têtes + petit réseau** ; un Transformer = N blocs empilés.

---
---

## PARTIE D — Bonus : visualise l'attention sur un vrai modèle (GPU facultatif)

> Jusqu'ici, attention sur des vecteurs fictifs en CPU. Maintenant, le moment satisfaisant : on charge un **vrai modèle** et on **regarde sa carte d'attention** sur une vraie phrase. La matrice 4×4 de la manip 2 va prendre vie sur de vrais mots. **Si tu as un GPU NVIDIA compatible CUDA**, le calcul y tournera automatiquement ; **sinon, pas de souci** : le modèle choisi (DistilBERT) est petit et tourne très bien en CPU.

### D.1 — Installer de quoi extraire et visualiser l'attention

On réutilise `transformers` + `torch` (installés à l'épisode précédent). On ajoute `matplotlib` pour dessiner :

```bash
uv add transformers matplotlib
```

> 💡 `torch` et `numpy` sont déjà dans le projet depuis l'épisode précédent. Si tu as un GPU et un doute sur sa détection, relance ta vérif de l'épisode précédent (`uv run manip5_gpu_check.py`) : tu dois lire `CUDA disponible : True`. Sans GPU, ignore cette vérif — le code bascule seul en CPU.

### D.2 — Extraire les poids d'attention d'un vrai modèle

On utilise **DistilBERT** (léger, rapide, conçu pour comprendre des phrases — cartes d'attention nettes). On lui demande de **renvoyer ses poids** avec `output_attentions=True`. Crée `j2_manip3_extract_attention.py` :

```python
# j2_manip3_extract_attention.py — récupérer les poids d'attention d'un vrai modèle
from transformers import AutoModel, AutoTokenizer
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
nom = "distilbert-base-uncased"

tok = AutoTokenizer.from_pretrained(nom)
# output_attentions=True : on demande au modèle de nous RENDRE ses cartes d'attention
model = AutoModel.from_pretrained(nom, output_attentions=True).to(device)
model.eval()

phrase = "The cat sat on the mat because it was tired"
entree = tok(phrase, return_tensors="pt").to(device)

with torch.no_grad():
    sortie = model(**entree)

# sortie.attentions = un tuple : un élément par COUCHE.
# Chaque élément a la forme [1, nb_tetes, nb_tokens, nb_tokens] -> nos grilles carrées !
attentions = sortie.attentions
print("Nombre de couches   :", len(attentions))
print("Forme d'une couche  :", tuple(attentions[0].shape))
print("  -> [batch, tetes, tokens, tokens] : une carte d'attention par tete")

tokens = tok.convert_ids_to_tokens(entree["input_ids"][0])
print("Tokens analysés     :", tokens)
```

Lance : `uv run j2_manip3_extract_attention.py` (1ʳᵉ fois : téléchargement ~250 Mo).

> ✅ **Checkpoint** : tu vois le **nombre de couches** (6 pour DistilBERT) et la **forme** `[1, 12, N, N]` — 12 têtes, chacune produisant une grille N×N **exactement comme ta manip 2**, mais sur de vrais tokens.

### D.3 — Dessiner la carte d'attention

On visualise une tête d'une couche en **carte de chaleur** (*heatmap*) : plus une case est claire, plus le mot de la ligne « regarde » celui de la colonne. Crée `j2_manip4_visualiser_attention.py` :

```python
# j2_manip4_visualiser_attention.py — dessiner la carte d'attention
from transformers import AutoModel, AutoTokenizer
import torch
import matplotlib.pyplot as plt

device = "cuda" if torch.cuda.is_available() else "cpu"
nom = "distilbert-base-uncased"
tok = AutoTokenizer.from_pretrained(nom)
model = AutoModel.from_pretrained(nom, output_attentions=True).to(device)
model.eval()

phrase = "The cat sat on the mat because it was tired"
entree = tok(phrase, return_tensors="pt").to(device)
with torch.no_grad():
    att = model(**entree).attentions

tokens = tok.convert_ids_to_tokens(entree["input_ids"][0])

# On choisit une couche et une tête (essaie d'autres valeurs !)
couche, tete = 4, 3
# .cpu() : on ramène les données du GPU vers le CPU pour que matplotlib les dessine
carte = att[couche][0, tete].cpu().numpy()

fig, ax = plt.subplots(figsize=(8, 7))
im = ax.imshow(carte, cmap="viridis")
ax.set_xticks(range(len(tokens))); ax.set_xticklabels(tokens, rotation=90)
ax.set_yticks(range(len(tokens))); ax.set_yticklabels(tokens)
ax.set_xlabel("Mot REGARDÉ (Key)"); ax.set_ylabel("Mot qui REGARDE (Query)")
ax.set_title(f"Carte d'attention — couche {couche}, tête {tete}")
fig.colorbar(im)
plt.tight_layout()
plt.savefig("carte_attention.png", dpi=120)
print("Image enregistrée : carte_attention.png")
```

Lance : `uv run j2_manip4_visualiser_attention.py`, puis ouvre `carte_attention.png`.

> ✅ **Checkpoint — le moment fascinant** : observe la ligne du mot **« it »**. Sur quelle(s) colonne(s) son attention se concentre-t-elle ? Sur de nombreuses têtes, « it » regarde fortement **« cat »** — le modèle a appris que le pronom renvoie au chat ! Tu **vois** une relation de sens que personne n'a programmée : elle a émergé de l'entraînement. Change `couche` et `tete` (0-5 et 0-11) : chaque tête révèle un motif différent, comme annoncé en Partie C.1.

> 💡 **Si tu as un GPU**, observe-le dans un second terminal : `watch -n 1 nvidia-smi`. DistilBERT est petit, l'empreinte VRAM est modeste — mais le réflexe `device` + `.to(device)` est le **même** que pour les gros modèles de l'épisode précédent. Sans GPU, tout tourne en CPU sans rien changer au code.

#### ✍️ À toi de jouer

1. Change la phrase en « The trophy didn't fit in the suitcase because it was too big » et regarde où « it » porte son attention (exemple classique d'ambiguïté, le *schéma de Winograd*).
2. Pourquoi a-t-on besoin de `.cpu()` avant de donner les données à matplotlib ?
3. Relie ce que tu vois à la manip 2 : en quoi `carte_attention.png` est-elle la version « vrai modèle » de ta grille 4×4 ?

<details>
<summary>👉 Voir les réponses</summary>

1. Selon la couche/tête, « it » devrait porter une attention notable sur « trophy » (le trophée est trop grand). Résoudre à quoi « it » se réfère demande du sens, pas juste de la grammaire — et l'attention en capte une partie.
2. Les calculs ont pu avoir lieu **sur le GPU** (via `.to(device)`), donc les données vivent alors dans la mémoire de la carte. matplotlib tourne côté **CPU** et ne lit que la mémoire principale : `.cpu()` rapatrie le tableau vers le CPU pour le dessiner (sans GPU, `.cpu()` est simplement neutre).
3. C'est **exactement** la même chose à plus grande échelle : une grille carrée token × token où chaque ligne (un mot qui regarde) somme à 1 et indique son attention sur chaque autre mot. Ta manip 2 en produisait une 4×4 sur des vecteurs fictifs ; ici c'est une N×N sur de vrais tokens, produite par un modèle entraîné.

</details>

**Mini-résumé de la Partie D**
- Un vrai modèle renvoie ses poids avec `output_attentions=True` : un tuple `[couches][batch, têtes, tokens, tokens]`.
- Chaque tête = une **grille token × token** — la version réelle de ta manip 2.
- En heatmap, elle révèle des relations apprises (« it » → « cat ») que **personne n'a programmées**.

---
---

## ⚠️ Pièges fréquents (récapitulatif transversal)

| Piège | Pourquoi c'est dangereux | Le bon réflexe |
|-------|--------------------------|----------------|
| Voir `@` comme une opération mystérieuse | Bloque toute la lecture du code | `@` = **produits scalaires** (Partie 0.2), rien de plus |
| Oublier ce que fait `.T` | Erreurs de forme, code incompris | `.T` = **échanger lignes/colonnes** ; `A @ B.T` = ressemblances croisées |
| Croire que Query/Key/Value sont 3 objets très différents | Rend l'attention plus mystérieuse qu'elle n'est | **3 versions** du même embedding (× 3 tableaux appris) |
| Penser que l'attention « comprend » le sens | Anthropomorphisme → fausses attentes | C'est **produit scalaire + softmax + moyenne**, point |
| Confondre attention et fenêtre de contexte | Deux notions distinctes | Attention = **comment** les mots se regardent ; contexte = **combien** de tokens (épisode précédent) |
| Oublier que chaque ligne de la carte somme à 1 | Mauvaise lecture des heatmaps | Une ligne = un mot répartissant **100 %** de son attention |
| Lancer les manips sans `uv run` | `ModuleNotFoundError` ou mauvais environnement | Toujours `uv run <script>.py` depuis `llm-formation/` |

---

## 🔁 Récap final synthétique

```text
        L'ATTENTION : CHAQUE MOT REGARDE LES AUTRES POUR SE CONTEXTUALISER
                                    │
     ┌──────────────┬──────────────┴──────────────┬──────────────┐
     ▼              ▼                              ▼              ▼
  PARTIE 0       PARTIE A                       PARTIE B       PARTIE C
 3 outils maths  le problème                    le CŒUR        le Transformer
     │              │                              │              │
 produit scal.   sens FIGÉ                      Q / K / V      multi-head
 @  et  .T       (« avocat » = ?)               score = Q·K    (têtes en //)
 softmax         relations lointaines           softmax→poids  couches
     │              │                           moyenne pond. V  empilées
     └──> les 3 SEULS outils ──> assemblés = 1 pas d'attention ──> empilés N fois

   Résultat : le vecteur figé de « is » devient « capitale + France » → « Paris » monte.
```

> 💻 **Partie D (bonus)** : un vrai modèle (DistilBERT) expose ses cartes d'attention — sur ton GPU si tu en as un, sinon en CPU. Tu y vois « it » regarder « cat » : une relation apprise, jamais programmée. Même mécanique que tes manips NumPy, à l'échelle réelle.

> 🧠 **Auto-évaluation (fais-la vraiment)** : sans relire, peux-tu (a) refaire un produit scalaire et un softmax à la main sur 3 nombres, (b) expliquer Query/Key/Value avec l'analogie de la recherche, et (c) décrire les 4 étapes qui transforment un embedding figé en vecteur contextualisé ? Si un point coince, retourne à la partie concernée **avant** le quiz.

---

## ✅ Quiz de validation

1. Calcule à la main le produit scalaire de [1, 2, 1] et [2, 0, 3], puis dis ce qu'un grand résultat signifierait.
2. Applique le softmax (au moins l'ordre de grandeur) aux scores [3, 1, 1] : quel mot « gagne », et la somme fait-elle 100 % ?
3. Explique **Query, Key, Value** avec l'analogie de la recherche, en une phrase chacun.
4. Décris les **4 étapes** qui mènent d'une Query au nouveau vecteur contextualisé d'un mot, en nommant l'outil de la Partie 0 utilisé à chaque étape.
5. Sur une carte d'attention, que signifie une ligne de « it » très concentrée sur la colonne « cat » ?

<details>
<summary>👉 Voir le corrigé</summary>

1. 1×2 + 2×0 + 1×3 = 2 + 0 + 3 = **5**. Un grand résultat signifierait que les deux listes « pointent dans la même direction » — donc, dans le contexte de l'attention, que deux mots se **ressemblent** fortement (une Key qui répond bien à une Query).
2. Scores [3, 1, 1] → le **premier gagne** largement (score le plus haut → part la plus grande après softmax). Ordre de grandeur : environ 79 % / 10,5 % / 10,5 %, et la somme fait **100 %** (le softmax garantit toujours ça).
3. **Query** = ce qu'un mot **cherche** (la requête tapée). **Key** = l'**étiquette** que chaque mot présente pour dire de quoi il parle (les mots-clés d'une vidéo). **Value** = l'**information réelle** transmise si le mot est retenu (le contenu de la vidéo).
4. (1) **Scores bruts** : produit scalaire Query·chaque Key (*outil 1, produit scalaire*). (2) **Mise à l'échelle** : division par racine de la dimension (stabilité). (3) **Softmax** : scores → poids sommant à 1 (*outil 3, softmax*). (4) **Mélange** : moyenne des Values pondérée par les poids. (Sur toute la phrase d'un coup, l'étape 1 utilise *l'outil 2*, `X @ X.T`.)
5. Le pronom « it » **porte l'essentiel de son attention sur « cat »** : le modèle a appris (sans programmation explicite) que « it » se réfère probablement à « cat ». La case claire = un **poids d'attention élevé** de la Query « it » vers la Key « cat ».

</details>

> 🧠 **Bilan objectifs** : reprends les 5 objectifs du début. Pour chacun, peux-tu dire « oui, je sais faire » ? Si un seul te résiste (y compris un outil maths), tu sais quelle section relire.

---

## 🔧 Si ça coince (dépannage)

**« Les maths me perdent encore. »**
Ne force pas sur l'attention : reviens à la **Partie 0** et refais les trois micro-manips (`j2_p0_*.py`) en changeant les nombres, jusqu'à ce que produit scalaire / `@` / softmax te semblent évidents. Regarde les vidéos 3Blue1Brown (produit scalaire) et Khan Academy (matrices) citées dans chaque sous-section. Le reste de l'épisode ne fait que combiner ces trois outils : une fois solides, l'attention « tombe » toute seule.

**« `uv run` : ModuleNotFoundError (numpy / transformers / matplotlib). »**
La dépendance n'est pas dans le projet, ou tu lances sans `uv run`. Vérifie que tu es dans `llm-formation/`, refais `uv add <paquet>`, et lance **toujours** avec `uv run <script>.py`.

**« `torch.cuda.is_available()` renvoie False. »**
Tu as probablement le `torch` CPU — **et ce n'est pas grave** : toute la Partie D tourne très bien en CPU avec DistilBERT. Si tu **veux** exploiter un GPU NVIDIA, réinstalle la version GPU (voir l'épisode précédent, Partie D) : `uv add torch --index pytorch-cuda=https://download.pytorch.org/whl/cu124`, puis revérifie avec `uv run manip5_gpu_check.py`.

**« Le téléchargement de DistilBERT échoue / coupe. »**
C'est `transformers` qui télécharge depuis Hugging Face (~250 Mo). Relance le script : il reprend et met en cache.

**« `carte_attention.png` ne s'ouvre pas / fenêtre vide. »**
Le script **enregistre** un fichier (il ne l'affiche pas). Ouvre `carte_attention.png` depuis ton explorateur, dans `llm-formation/`. Pour un affichage direct, remplace `plt.savefig(...)` par `plt.show()`.

**« Erreur sur les indices de couche/tête. »**
DistilBERT a **6 couches (0-5)** et **12 têtes (0-11)**. Reste dans ces bornes.

> 💡 **Réflexe général** : copie le message d'erreur exact dans un moteur de recherche. Et reviens m'en parler si besoin.

> 📌 **Mémo des commandes `uv` du jour** :
> - `cd llm-formation` — se placer dans le projet
> - `uv add numpy matplotlib transformers` — dépendances du jour
> - `uv run <script>.py` — lancer un script
> - (option GPU, si tu en as un) `uv add torch --index pytorch-cuda=https://download.pytorch.org/whl/cu124`

---

## 🚀 Pour aller plus loin

#### 🧮 Renforcer les bases maths (si la Partie 0 t'a demandé de l'effort)

| Ressource | Type | Ce qu'elle couvre | Effort |
|-----------|------|-------------------|--------|
| **3Blue1Brown — « Essence de l'algèbre linéaire »** (YouTube, chaîne 3Blue1Brown, sous-titres FR) | Série vidéo | Vecteurs, produit scalaire, matrices : **tout en visuel**, l'idéal pour ancrer la Partie 0 | ~2-3 h (série) |
| **Khan Academy — Matrices** (fr.khanacademy.org) | Cours + exercices | Multiplication de matrices, transposition, pas à pas avec auto-correction | À la carte |
| **« Softmax function explained »** (YouTube, plusieurs versions courtes) | Vidéo | Les 3 gestes du softmax en images | ~8 min |

#### 🔄 Autre approche de l'attention (même sujet, autre angle)

| Ressource | Type | En quoi l'angle diffère | Effort |
|-----------|------|-------------------------|--------|
| **3Blue1Brown — « Attention in transformers, visually explained »** (YouTube) | Vidéo | Construit Query/Key/Value par l'**animation** : complément visuel idéal de tes manips | ~25 min |
| **« The Illustrated Transformer » — Jay Alammar** (jalammar.github.io) | Article | Le schéma de référence : reprend **toutes** les pièces (résiduel, normalisation…) | Lecture |
| **BertViz** (github.com/jessevig/bertviz) | Outil/code | Visualisation d'attention **interactive**, plus riche que ta heatmap statique | À manipuler |

#### 🔬 Approfondissement (creuser le sujet lui-même)

| Ressource | Type | Niveau / prérequis | Effort |
|-----------|------|--------------------|--------|
| **Andrej Karpathy — « Let's build GPT: from scratch »** (YouTube + nanoGPT) | Vidéo + code | Intermédiaire ; code la self-attention **complète** en PyTorch. Prérequis : Parties 0-B | Pratique intensive |
| **« The Annotated Transformer » (Harvard NLP)** (nlp.seas.harvard.edu) | Article + code | Avancé ; l'article de 2017 **annoté ligne par ligne** | Lecture exigeante |
| **« Attention Is All You Need »** (arxiv.org/abs/1706.03762) | Article de recherche | Avancé ; l'article fondateur. **Maintenant** tu as le bagage | Lecture exigeante |

#### 📈 Suggestion de séquence d'apprentissage

1. **La Partie 0 d'abord**, sans la bâcler : refais les micro-manips jusqu'à l'aisance. C'est le vrai déblocage.
2. Si un outil résiste, regarde sa vidéo dédiée (3Blue1Brown pour le produit scalaire, Khan Academy pour les matrices) **avant** d'attaquer l'attention.
3. Fais les manips 1-2 (attention) : tu verras que ce ne sont que tes 3 outils enchaînés.
4. Fais la Partie D et observe « it » → « cat ». Puis installe **BertViz** pour explorer plus loin.
5. Quand tu te sens prêt à coder l'attention complète, suis **Karpathy « Let's build GPT »**, puis lis **« Attention Is All You Need »**.

---

> **➡️ Prochain épisode — Le hasard maîtrisé** : tu sais maintenant *comment* le modèle calcule ses logits (épisode 1) en faisant circuler le sens par l'attention (cet épisode). Reste une question laissée de côté : **comment choisit-on vraiment le mot** dans la liste de probabilités ? On a vu `argmax` (toujours le plus probable, déterministe). Au prochain épisode : **temperature, top-p, top-k** — les réglages qui contrôlent la créativité et le hasard d'un modèle. Reviens avec tes manips faites et tes questions.
