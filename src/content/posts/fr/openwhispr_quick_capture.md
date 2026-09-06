---
title: "Capturer une idée à la voix sous Linux avec OpenWhispr, sans quitter mon IDE"
date: "2026-09-05"
author: "Xavier GUERET"
description: "Sur Ubuntu 24.04 en session Wayland : OpenWhispr en 100% local (Whisper pour la transcription, Mistral Nemo pour le nettoyage), un script bash, ydotool et un raccourci GNOME. F10 ouvre une popup, je dicte mon idée, Entrée la range dans un post-it — mon IDE ne perd jamais le focus."
tags:
  - "OpenWhispr"
  - "Whisper"
  - "Mistral"
  - "linux"
  - "Wayland"
  - "bash"
  - "productivité"
categories:
  - "Tutoriels"
  - "Projets Personnels"
image: "/images/posts/openwhispr_quick_capture.png"
draft: false
toc: true
---

Je suis en train de coder, et quelque chose me traverse l'esprit. Un bug que je viens de me rappeler sur un tout autre projet. Une idée d'outil que j'écrirai peut-être un jour. Un article à relire plus tard, un truc à ne pas oublier avant vendredi. Le point commun : ça n'a rien à voir avec ce que je fais à cet instant précis, et c'est exactement ce qui rend la chose fragile. Si je ne la note pas maintenant, elle est perdue.

Mais ouvrir un éditeur, chercher le bon fichier, revenir à mon IDE : c'est trop cher payé pour une phrase, donc je ne le fais pas — et ça s'évapore. Ce qu'il me fallait, c'est un geste unique : une touche, je parle, Entrée, et je suis déjà de retour dans mon code.

C'est exactement le geste que je me suis fabriqué sur mon poste **Linux**, par-dessus **OpenWhispr**, avec une soixantaine de lignes de bash et un raccourci GNOME. Tout ce qui suit est donc ancré dans cet environnement — Ubuntu 24.04, GNOME, session Wayland — et je signale à chaque étape ce qui change ailleurs, parce que la plupart des briques se transposent sans difficulté. Avant de montrer le montage, un mot sur OpenWhispr, qui en est la pièce centrale.

## OpenWhispr : la dictée vocale, en local

[OpenWhispr](https://openwhispr.com/) est une application open source (licence MIT) de dictée vocale, qui se présente comme l'alternative libre à des outils comme WisprFlow. Le dépôt officiel est sur [GitHub](https://github.com/OpenWhispr/openwhispr). C'est une application de bureau multiplateforme (macOS, Windows, Linux — AppImage, `.deb`, `.rpm`) construite sur **Electron**.

Son principe d'usage est simple : une touche globale déclenche l'enregistrement, on parle, on rappuie, et le texte transcrit est tapé **là où se trouve le curseur**, dans n'importe quelle application. Pas de fenêtre dédiée dans laquelle il faudrait copier-coller : la dictée s'insère dans l'outil qu'on utilise déjà.

Le point qui m'a décidé : tout peut tourner **entièrement en local**, et pas seulement la transcription. OpenWhispr embarque deux moteurs. [whisper.cpp](https://github.com/ggml-org/whisper.cpp), l'implémentation C++ du modèle Whisper d'OpenAI, se charge de la reconnaissance vocale — le modèle Parakeet de NVIDIA est une alternative. Puis [llama.cpp](https://github.com/ggml-org/llama.cpp) fait tourner un second modèle, un LLM cette fois, pour la passe de nettoyage : c'est lui qui ponctue le texte brut, supprime les hésitations et remet la phrase d'aplomb.

C'est cette seconde étape qu'on oublie souvent quand on parle de dictée locale, et elle accepte n'importe quel modèle au format GGUF. Chez moi elle tourne sur **Mistral Nemo 12B Instruct**, quantifié en Q4_K_M (environ 7 Go), avec l'accélération GPU via Vulkan. Toute la configuration tient en trois lignes :

```bash
CLEANUP_PROVIDER=local
LOCAL_CLEANUP_MODEL=mistral-nemo-12b-instruct-q4_k_m
LLAMA_VULKAN_ENABLED=true
```

C'est ce qui fait que le texte arrive déjà propre dans la popup, notable sans retouche. Un mode cloud « bring your own key » existe pour ceux qui préfèrent, mais avec les deux étapes en local, rien ne sort de la machine — et je n'en ai pas l'usage.

Chez moi, OpenWhispr est configuré sur **F8** : F8 démarre l'enregistrement, F8 l'arrête, le texte apparaît au curseur. Cette configuration de base fonctionne partout — terminal, navigateur, IDE — et c'est le prérequis de tout ce qui suit.

## Mon besoin : capturer sans changer de contexte

La dictée seule ne suffit pas. Si j'appuie sur F8 pendant que je code, le texte dicté part... dans mon code. Il me faut un champ de saisie qui apparaisse par-dessus mon IDE, capte la dictée, et range le résultat au bon endroit avant de disparaître.

Le geste cible :

1. **F10** — une petite popup apparaît et l'enregistrement OpenWhispr démarre tout seul ;
2. je dicte : « le flag verbose ne s'applique pas aux sous-commandes du CLI » ;
3. **F8** (ou F10 à nouveau) — la dictée s'arrête, le texte apparaît dans le champ ;
4. **Entrée** — la popup disparaît, un post-it apparaît sur le bureau, une notification confirme.

Mon IDE n'a jamais perdu le focus, et F8 reste ma touche de dictée normale partout ailleurs.

La destination mérite un mot, parce que c'est elle qui a le plus bougé depuis ma première version. J'ai d'abord écrit dans un simple `~/inbox.md` en fin de fichier. Ça marchait, mais le tri restait à ma charge : il fallait relire, classer, décider. Aujourd'hui la capture crée un **post-it xpad** sur le bureau, et un second outil s'occupe du classement — j'y reviens à la fin. Le fichier texte n'a pas disparu pour autant, il sert de filet quand xpad n'est pas disponible.

## Brique 1 : simuler F8 sous Wayland avec ydotool

Tout le montage repose sur une hypothèse : un script peut « appuyer » sur F8 à ma place, et OpenWhispr le verra. Sous X11, `xdotool` faisait ça depuis toujours. Sous Wayland, c'est impossible par conception : les applications sont isolées les unes des autres, un client ne peut ni espionner ni piloter les autres. Pour injecter une touche, il faut passer sous Wayland, au niveau du noyau : c'est le rôle de **ydotool**, qui écrit dans `/dev/uinput`.

Autant valider cette brique en premier, isolément :

```bash
sudo apt install ydotool
ydotool key f8    # doit démarrer OpenWhispr, exactement comme un appui physique
ydotool key f8    # relancé : l'enregistrement s'arrête
```

Si les deux appels déclenchent bien la dictée, la brique est validée. Deux remarques d'expérience :

- La notice `ydotoold backend unavailable` n'est **pas une erreur** : sans démon, ydotool écrit directement dans `/dev/uinput`, ce qui suffit largement ici. Pas besoin de lancer `ydotoold`.
- La doc en ligne montre souvent la syntaxe par keycode (`key 66:1 66:0`). Sur le build 0.1.8 d'Ubuntu 24.04, c'est la forme par **nom** (`key f8`) qui a déclenché OpenWhispr chez moi. Testez toujours la vraie touche plutôt que de faire confiance à une syntaxe.

Si `ydotool key f8` ne fait rien sans erreur, vérifiez l'accès à uinput : `ls -l /dev/uinput` et `id`, puis au besoin `sudo usermod -aG input "$USER"` et reconnectez-vous.

## Brique 2 : le script de capture

Le cœur du besoin est « zéro friction » : une seule commande doit ouvrir le champ de saisie, y placer le curseur et déclencher la dictée. Elle doit aussi gérer le double appui réflexe sur F10 — pas question d'ouvrir une deuxième popup, ce deuxième appui doit simplement arrêter la dictée.

Voici `~/.local/bin/idee` dans sa version actuelle :

```bash
#!/usr/bin/env bash
# idee - Capture rapide d'une idée ou d'une tâche vers un post-it xpad
set -euo pipefail

F8="f8"
OUT=/tmp/idee.$UID.txt
FALLBACK="${IDEE_FALLBACK:-$HOME/inbox.md}"   # repli si xpad est indisponible
SEP=$'\x1f'                                   # séparateur invisible : jamais dicté, contrairement à "|"

# La 1re valeur de chaque liste est celle par défaut : Entrée sans rien toucher
# reste le chemin rapide.
TYPES="Idée|TODO|Référence|Standby|Note"
DOMAINES="(à déduire)|DevOps & Linux|IA & Claude|Candidature & Emploi|Apprentissage|Site web|Projets perso|Business & Réseau"

# Popup déjà ouverte → 2e appui sur F10 : on arrête juste la dictée
if pgrep -f 'zenity --forms --title=Idée' >/dev/null; then
    ydotool key $F8
    exit 0
fi

# Popup GTK native (Wayland et X11), lancée en arrière-plan.
# Le champ Texte est le premier : c'est lui qui a le focus, donc celui où
# OpenWhispr tape. La sortie va dans $OUT ; on la lira après le "wait".
zenity --forms --title="Idée" \
       --text="Parle… F8 ou F10 pour arrêter, Entrée pour noter" \
       --add-entry="Texte" \
       --add-combo="Type"    --combo-values="$TYPES" \
       --add-combo="Domaine" --combo-values="$DOMAINES" \
       --separator="$SEP" \
       --width=640 2>/dev/null > "$OUT" &

sleep 0.4                                 # laisse la popup prendre le focus (ajuste 0.2–0.8)
ydotool key $F8                           # démarre l'enregistrement OpenWhispr
wait || true                              # Échap → zenity sort en 1, on continue quand même

res=$(cat "$OUT"); rm -f "$OUT"
IFS="$SEP" read -r txt type dom <<< "$res"
[ -z "${txt:-}" ] && exit 0               # Échap ou texte vide → on sort sans bruit

type="${type:-Idée}"                      # combo laissée intacte → valeur par défaut
dom="${dom:-}"
[ "$dom" = "(à déduire)" ] && dom=""      # non précisé : le tri l'inférera

# Le post-it : l'idée en première ligne (c'est ce qu'on lit, et ce dont
# on tire le titre), les métadonnées en pied de note.
footer="[$type]"
[ -n "$dom" ] && footer="$footer $dom"
pad=$(mktemp --tmpdir "idee-XXXXXX.txt")
printf -- '%s\n\n%s — %s\n' "$txt" "$footer" "$(date '+%F %H:%M')" > "$pad"

if [ -n "${IDEE_DRYRUN:-}" ]; then        # test sans polluer le bureau
    printf -- '--- post-it qui serait créé ---\n'; cat "$pad"; rm -f "$pad"; exit 0
fi

if xpad --new-from-file="$pad" 2>/dev/null; then
    sleep 0.3                             # laisse xpad lire le fichier avant de l'effacer
    rm -f "$pad"
    notify-send "📌 $footer" "$txt"
else
    printf -- '- %s %s %s\n' "$(date '+%F %H:%M')" "$footer" "$txt" >> "$FALLBACK"
    rm -f "$pad"
    notify-send "⚠️ xpad indisponible" "Idée sauvée dans $FALLBACK"
fi
```

### La séquence qui permet de dicter *dans* la popup

Trois lignes portent toute la mécanique, et elles n'ont pas bougé depuis la première version :

- **`zenity … &` puis `wait`** : la popup part en arrière-plan pour que le script puisse envoyer F8 *pendant* qu'elle est ouverte ; `wait` reprend la main quand elle se ferme.
- **`sleep 0.4`** : le seul réglage de timing. Trop court, F8 part avant que le champ ait le focus et le texte dicté atterrit dans l'IDE. Entre 0.2 et 0.8 selon la machine.
- **`pgrep`** : il détecte une popup déjà ouverte via son titre, et transforme un deuxième F10 en « stop dictée » au lieu d'une deuxième fenêtre. Si vous changez le titre zenity, changez le `pgrep` avec — les deux chaînes doivent rester identiques.

### Ce que la version formulaire a apporté

Le passage de `zenity --entry` à `zenity --forms` ajoute deux listes déroulantes, **Type** et **Domaine**, à côté du champ de texte. C'est ce qui a remplacé la convention de tag que j'utilisais avant, et ça vaut quelques précautions :

- **L'ordre des champs n'est pas cosmétique.** `--add-entry="Texte"` est déclaré en premier, donc c'est lui qui a le focus à l'ouverture — donc c'est là qu'OpenWhispr écrit. Mettre une liste déroulante en premier suffirait à envoyer la dictée dans le vide.
- **Le séparateur est un caractère invisible.** `zenity --forms` concatène les champs avec `|` par défaut ; un `|` dicté ou tapé dans le texte casserait alors le découpage. `SEP=$'\x1f'` (le *Unit Separator* d'ASCII) règle le problème une fois pour toutes : il ne peut pas sortir d'une dictée.
- **Les valeurs par défaut préservent le chemin rapide.** La première entrée de chaque liste est présélectionnée, donc appuyer sur Entrée sans rien toucher donne toujours une capture valide. `(à déduire)` pour le domaine signifie explicitement « je ne me prononce pas » — le script le vide et laisse le tri trancher plus tard.
- **`wait || true` n'est pas cosmétique non plus.** Avec `set -e`, un Échap fait sortir zenity en code 1, ce qui tuerait le script avant qu'il ait pu nettoyer son fichier temporaire.

Le post-it lui-même suit une convention simple : l'idée seule en première ligne, une ligne vide, puis `[Type] Domaine — date` en pied. La première ligne est ce qu'on lit sur le bureau d'un coup d'œil, et c'est aussi ce qui servira de titre au moment du classement.

Enfin, la capture ne perd rien si xpad n'est pas là : le `else` retombe sur `~/inbox.md` en ajout de fin de fichier, avec une notification qui le dit clairement. C'est le `>>` d'origine, devenu filet de sécurité plutôt que destination.

### Tester sans polluer le bureau

C'est à ça que sert `IDEE_DRYRUN` : le script affiche le post-it qu'il aurait créé et s'arrête là.

```bash
chmod +x ~/.local/bin/idee
IDEE_DRYRUN=1 idee    # popup + dictée → parlez → F8 → Entrée
```

`zenity` et `notify-send` sont présents par défaut sur Ubuntu Desktop ; `xpad` s'installe avec `sudo apt install xpad`.

## Brique 3 : le raccourci global F10

Le raccourci est ce qui rend le geste non invasif : le système lance le script par-dessus ce que je fais, sans changement de fenêtre. F8 reste la propriété d'OpenWhispr, F10 est la mienne — deux touches, deux rôles, aucune collision.

Par l'interface : **Paramètres → Clavier → Raccourcis personnalisés → +**, nom `Idée`, commande `/home/VOTRE_LOGIN/.local/bin/idee`, touche **F10**. Le chemin doit être **absolu** : le lanceur de GNOME n'a pas le `PATH` de votre shell, et un raccourci avec une commande relative échoue sans le moindre message d'erreur.

En ligne de commande, pour reproduire la config sur une autre machine :

```bash
KB=/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings
SCHEMA=org.gnome.settings-daemon.plugins.media-keys

# Attention : la 2e commande REMPLACE la liste des raccourcis perso.
# Lisez-la d'abord et ajoutez custom9 dedans si elle n'est pas vide.
gsettings get $SCHEMA custom-keybindings

gsettings set $SCHEMA custom-keybindings "['$KB/custom9/']"
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ name    'Idée'
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ command "$HOME/.local/bin/idee"
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ binding 'F10'
```

Le piège de cette variante : les clés `name`/`command`/`binding` seules ne suffisent pas, il faut que le chemin `custom9/` figure dans la **liste** `custom-keybindings` — sinon GNOME ne les lit jamais. C'est l'équivalent d'un service systemd écrit mais jamais activé.

Sous KDE, sway ou i3, seul le déclaratif du raccourci change ; le script reste identique (sous X11, remplacez `ydotool key $F8` par `xdotool key F8`).

## Classer sans y penser : du post-it à la base de connaissances

Dernier problème : d'où vient l'idée, et où doit-elle finir ? Sous Wayland, impossible de lire le nom de la fenêtre active pour deviner le projet courant — c'est la même isolation qui bloquait `xdotool`. Ma première réponse était une convention à une syllabe : un `#nomprojet` glissé dans la phrase, puis un `grep '#cli' ~/inbox.md` au retour sur le projet.

Ça fonctionnait, mais deux défauts ont fini par peser. Le tag devait être dicté ou tapé, donc oublié une fois sur trois. Et le tri restait entièrement manuel : relire le fichier, décider, déplacer. Un inbox qu'on ne vide pas finit par être un fichier qu'on n'ouvre plus.

Les deux listes déroulantes règlent le premier point. **Type** reprend les cinq natures de ce qui me traverse l'esprit en codant — Idée, TODO, Référence, Standby, Note : le bug à corriger n'est pas l'idée d'outil, qui n'est pas l'article à relire. **Domaine** (DevOps & Linux, IA & Claude, Site web, Projets perso…) dit de quel pan de mon activité ça relève. Les deux sont sélectionnés à la souris en une seconde, ou ignorés — leurs valeurs par défaut font qu'une capture reste valide sans y toucher. La métadonnée est saisie à la source, au moment où le contexte est encore frais, au lieu d'être reconstituée au tri.

Le second point est réglé par la destination. Le post-it xpad n'est pas l'archive, c'est le **tampon** : il traîne sur le bureau, bien visible, et cette visibilité est exactement la pression saine qui pousse à le traiter. L'archive, elle, est une base Notion, alimentée par une routine d'ingestion qui lit les post-it, les catégorise et crée une page par note — puis supprime le post-it, mais **seulement une fois la page confirmée créée**. C'est la règle qui rend l'automatisation acceptable : en cas d'échec côté Notion, le post-it reste où il est. On ne perd jamais une capture.

Le principe emprunté à GTD n'a pas changé, il s'est juste déplacé d'un cran : capturer doit être instantané et sans décision, classer demande de la réflexion et se fait quand on a le temps. La différence, c'est que le classement n'est plus une corvée de relecture mais une commande que je lance quand le bureau se couvre de post-it.

## Ce que ça change au quotidien

Le coût d'une capture est tombé sous le seuil où mon cerveau négocie : F10, une phrase, Entrée. Trois secondes, aucun changement de contexte, et l'idée est datée, typée et rangée sans que j'aie eu à décider où. Depuis que le geste existe, les idées « pour plus tard » atterrissent effectivement quelque part — et les sessions de code ne sont plus interrompues par la peur d'oublier.

L'ensemble tient dans un script bash, un raccourci clavier et deux outils que la distribution fournit déjà, au-dessus d'un logiciel open source qui transcrit et nettoie en local. Si vous utilisez déjà OpenWhispr — ou n'importe quelle dictée à touche globale — le montage se reproduit en un quart d'heure, et la destination reste la vôtre : un fichier texte suffit pour commencer, c'est d'ailleurs par là que le mien a commencé.
