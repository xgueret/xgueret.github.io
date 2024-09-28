+++
title= "Activer l'autocompletion Ansible avec Argcomplete"
date= "2024-09-28"
author= "Xavier GUERET"
tags= [
    "ansible", 
    "bash", 
    "auto-completion", 
    "argcomplete"]
categories= [
    "ansible",
    ]
+++

## Activer l'auto-complétion Ansible avec Argcomplete

L'auto-complétion dans le terminal est un outil précieux pour améliorer l'efficacité lors de l'utilisation d'Ansible. En configurant `argcomplete`, vous pouvez profiter de l'auto-complétion dans Bash pour les commandes Ansible. Suivons ensemble les étapes pour mettre en place l'auto-complétion dans notre terminal Bash.

### Étapes pour activer `argcomplete` pour Ansible

1. **Installer `argcomplete`** :

   Si `argcomplete` n'est pas encore installé, utilisez `pip` pour l'installer :

   ```shell
   pip install argcomplete
   ```

2. **Activer l'auto-complétion globale** : Une fois `argcomplete` installé, activez l'auto-complétion globale avec la commande suivante :

   ```shell
   activate-global-python-argcomplete
   ```

   Cette commande modifie votre fichier `~/.bashrc` pour enregistrer automatiquement l'auto-complétion.

3. **Appliquer les changements** : Rechargez votre fichier `~/.bashrc` pour appliquer les modifications :

   ```shell
   source ~/.bashrc
   ```

4. **Tester l'auto-complétion pour Ansible** : Essayez l'auto-complétion avec Ansible en tapant une commande Ansible suivie de la touche `Tab` :

   ```shell
   ansible-playbook <Tab>
   ```

## Configuration supplémentaire

Si vous souhaitez enregistrer manuellement l'auto-complétion pour chaque commande Ansible, ajoutez les lignes suivantes dans votre fichier `~/.bashrc` :

```shell
eval "$(register-python-argcomplete ansible)"
eval "$(register-python-argcomplete ansible-playbook)"
eval "$(register-python-argcomplete ansible-config)"
eval "$(register-python-argcomplete ansible-doc)"
eval "$(register-python-argcomplete ansible-galaxy)"
eval "$(register-python-argcomplete ansible-inventory)"
eval "$(register-python-argcomplete ansible-pull)"
eval "$(register-python-argcomplete ansible-vault)"
```

Rechargez ensuite `~/.bashrc` :

```shell
source ~/.bashrc
```

## Conclusion

En configurant `argcomplete`, vous activez l'auto-complétion pour Ansible dans Bash, ce qui simplifie grandement l'utilisation de cet outil puissant. :tada:
