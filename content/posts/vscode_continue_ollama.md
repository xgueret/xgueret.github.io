+++
title= "Installer et Configurer Continue dans VSCode avec Ollama"
date= "2024-09-07"
author= "Xavier GUERET"
tags= [
    "VSCode", 
    "Continue", 
    "Ollama", 
    "LLaMA 3", 
    "StarCoder 2", 
    "DeepSeek Coder v2", 
]
categories= [ "tutorial"]
+++
## [Vscode](https://code.visualstudio.com/) utilisation de l'extension [Continue](https://www.continue.dev/) et configurer [Ollama](https://ollama.com/)

Voici un tutoriel étape par étape pour installer et configurer l'extension Continue dans Visual Studio Code (VSCode) avec Ollama.

### Étape 1: Prérequis

Avant de commencer, assurez-vous d'avoir:

* **Visual Studio Code** installé. Vous pouvez le télécharger ici: [VSCode](https://code.visualstudio.com/Download).
* **Ollama** installé. Visitez [Ollama](https://ollama.com/) pour installer ce gestionnaire de modèles AI.

### Étape 2: Installer Continue dans VSCode

:eyes: [Installing Continue in VS Code](https://docs.continue.dev/install/vscode)

* Ouvrez **VSCode**.

* Dans le panneau de gauche, cliquez sur l'icône des **Extensions**.

* Recherchez **Continue** dans la barre de recherche des extensions.

  ![install_continue_vscode](/images/install_continue_vscode.png)

* Cliquez sur **Installer** pour l'extension **Continue**.


### Étape 3: Configuration d'Ollama

Ollama est nécessaire pour gérer les modèles d'IA comme LLaMA 3 et StarCoder. Assurez-vous que Ollama est bien installé et configuré.

1. Installez Ollama en suivant les instructions fournies sur leur site : [Ollama Installation](https://ollama.com/).

2. Une fois installé, vérifiez que Ollama fonctionne correctement en ouvrant un terminal et en exécutant la commande:

   ```shell
   ollama list
   ```

### Étape 4: Modifier le fichier `config.json`

Pour configurer les modèles utilisés par Continue (chat, autocomplétion, embeddings), vous devez modifier le fichier de configuration `config.json`.

1. Ouvrez Visual Studio Code.
2. Appuyez sur `Ctrl + Shift + P` pour ouvrir la **Palette de Commandes**.
3. Tapez **Continue: Open config.json** et sélectionnez cette option.

Cela ouvrira le fichier `config.json` où vous pouvez définir les modèles que vous souhaitez utiliser.

Voici un exemple de configuration pour utiliser **LLaMA 3** pour le chat, **StarCoder 2** pour l'autocomplétion, et **nomic-embed-text** pour les embeddings:

```json
{
  "models": {
    "chat": {
      "model": "llama3-70b",
      "provider": "ollama",
      "parameters": {
        "temperature": 0.7
      }
    },
    "autocomplete": {
      "model": "starcoder-2-7b",
      "provider": "ollama",
      "parameters": {
        "temperature": 0.2
      }
    },
    "embeddings": {
      "model": "nomic-embed-text",
      "provider": "openai",
      "parameters": {}
    }
  }
}
```

Si vous préférez utiliser **DeepSeek Coder v2** pour l'autocomplétion, modifiez la section `autocomplete` de la manière suivante:

```json
"autocomplete": {
  "model": "deepseek-coder-v2:16b",
  "provider": "ollama",
  "parameters": {
    "temperature": 0.2
  }
}
```

### Étape 5: Télécharger et Installer les Modèles via Ollama

Ensuite, vous devez télécharger les modèles nécessaires via Ollama.

1. Téléchargez le modèle **LLaMA 3 70B**:

```shell
ollama pull llama3-70b
```

Téléchargez le modèle **StarCoder 2** ou **DeepSeek Coder v2**, en fonction de votre choix pour l'autocomplétion:

- Pour **StarCoder 2**:

  ```shell
  ollama pull starcoder-2-7b
  ```

- Pour **DeepSeek Coder v2**:

  ```
  ollama pull deepseek-coder-v2:16b
  ```

- Pour les embeddings, assurez-vous d'avoir le modèle **nomic-embed-text** téléchargé <u>(cela devrait être configuré automatiquement par Continue)</u>.

  ```shell
  ollama pull nomic-embed-text
  ```
 
### Étape 6: Lancer Continue dans VSCode

Une fois que vous avez installé et configuré tous les modèles, vous êtes prêt à utiliser Continue dans VSCode.

1. Ouvrez un projet dans **VSCode**.
2. Utilisez la commande **Continue: Start** dans la palette de commandes (`Ctrl + Shift + P`).
3. Vous pouvez maintenant utiliser Continue avec les modèles que vous avez configurés pour des discussions interactives, de l'autocomplétion, et des embeddings.

<video width="600" controls>
  <source src="/videos/autocomple_sample.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

<video width="600" controls>
  <source src="/videos/chat_sample.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

### Étape 7: Tester les Modèles

Commencez par tester si les modèles fonctionnent correctement.

- Pour le chat, essayez de lancer une session et vérifiez que **LLaMA 3** est utilisé.
- Pour l'autocomplétion, tapez du code et voyez si **StarCoder 2** ou **DeepSeek Coder v2** propose des complétions pertinentes.
- Pour les embeddings, utilisez des fonctionnalités qui nécessitent des vecteurs d'embeddings et vérifiez que **nomic-embed-text** est bien utilisé.

