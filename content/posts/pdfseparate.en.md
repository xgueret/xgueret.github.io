+++
title= "Using pdfseparate to Split a PDF File"
date= "2024-09-20"
author= "Xavier GUERET"
tags= [
    "linux", 
    "tips"]
categories= [
    "linux",
    ]

+++

# Using pdfseparate to Split a PDF File

This morning, I scanned several pages of a document, which ended up in a single PDF file. I planned to send this document via email, but my recipient wanted to receive each page individually. That’s where `pdfseparate` came in handy.

## What is pdfseparate?

`pdfseparate` is a command-line tool included in the Poppler package, designed to split a PDF file into multiple distinct PDF files, one for each page. This tool is particularly useful for users who need to manipulate PDF documents flexibly.

## How to Use pdfseparate

First, make sure you have `pdfseparate` installed. On most Linux distributions, you can install it through your package manager. For example, on Ubuntu, use the following command:

```shell
sudo apt install poppler-utils
```

Once installed, you can execute the following command to separate the pages of your PDF file:

```shell
pdfseparate input.pdf output-%d.pdf
```

In this command:

- `input.pdf` is the name of your source PDF file.
- `output-%d.pdf` specifies the naming pattern for the generated files, where `%d` will be replaced by the page number.

## Conclusion

Thanks to `pdfseparate`, I was able to quickly extract each page from my scanned document and send them individually via email. This tool proved to be an invaluable ally in managing PDF files. If you ever find yourself in a similar situation, don’t hesitate to use it!
