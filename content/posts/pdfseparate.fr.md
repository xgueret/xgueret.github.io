+++
title= "Utiliser pdfseparate pour diviser un fichier PDF"
date= "2024-09-20"
author= "Xavier GUERET"
tags= [
    "linux", 
    "tips"]
categories= [
    "linux",
    ]

+++

# Utiliser pdfseparate pour diviser un fichier PDF

Ce matin, j'ai scanné plusieurs feuilles d'un dossier, qui se sont finalement retrouvées dans un seul fichier PDF. J'avais prévu d'envoyer ce dossier par mail, mais mon destinataire souhaitait recevoir les feuilles de manière unitaire. C'est là que `pdfseparate` m'a été d'une grande utilité.

## Comment utiliser pdfseparate ?

Pour commencer, assurez-vous d'avoir installé `pdfseparate`. Sur la plupart des distributions Linux, vous pouvez l'installer via votre gestionnaire de paquets. Par exemple, sous Ubuntu, utilisez la commande suivante :

```shell
sudo apt install poppler-utils
```

Une fois l'installation effectuée, il vous suffit d'exécuter la commande suivante pour séparer les pages de votre fichier PDF :

```shell
pdfseparate input.pdf output-%d.pdf
```

Dans cette commande :

- `input.pdf` est le nom de votre fichier PDF source.
- `output-%d.pdf` désigne le modèle de nom pour les fichiers générés, où `%d` sera remplacé par le numéro de la page.

## Conclusion

Grâce à `pdfseparate`, j'ai pu rapidement extraire chaque page de mon document scanné et les envoyer individuellement par email. Cet outil s'est révélé être un allié précieux pour la gestion de fichiers PDF. Si vous vous retrouvez un jour dans la même situation, n'hésitez pas à l'utiliser !