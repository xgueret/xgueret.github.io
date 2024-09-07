+++
title= "Install and Configure Continue in VSCode with Ollama"
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
## [Vscode](https://code.visualstudio.com/) using the [Continue](https://www.continue.dev/) extension and configuring [Ollama](https://ollama.com/)

Here's a step-by-step guide to installing and configuring the Continue extension in Visual Studio Code (VSCode) with Ollama.

### Step 1: Prerequisites

Before you begin, make sure you have:

- **Visual Studio Code** installed. You can download it here: [VSCode](https://code.visualstudio.com/Download).
- **Ollama** installed. Visit [Ollama](https://ollama.com/) to install this AI model manager.

### Step 2: Install Continue in VSCode

:eyes: [Installing Continue in VS Code](https://docs.continue.dev/install/vscode)

- Open **VSCode**.

- In the left panel, click on the **Extensions** icon.

- Search for **Continue** in the extensions search bar.

  ![install_continue_vscode](/images/install_continue_vscode.png)

- Click **Install** for the **Continue** extension.


### Step 3: Configure Ollama

Ollama is needed to manage AI models like LLaMA 3 and StarCoder. Ensure that Ollama is properly installed and configured.

1. Install Ollama by following the instructions provided on their site: [Ollama Installation](https://ollama.com/).

2. Once installed, verify that Ollama is working correctly by opening a terminal and running the command:

   ```shell
   ollama list
   ```

### Step 4: Modify the `config.json` File

To configure the models used by Continue (chat, autocompletion, embeddings), you need to modify the `config.json` configuration file.

1. Open Visual Studio Code.
2. Press `Ctrl + Shift + P` to open the **Command Palette**.
3. Type **Continue: Open config.json** and select this option.

This will open the `config.json` file where you can define the models you want to use.

Here's an example configuration for using **LLaMA 3** for chat, **StarCoder 2** for autocompletion, and **nomic-embed-text** for embeddings:

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

If you prefer to use **DeepSeek Coder v2** for autocompletion, modify the `autocomplete` section as follows:

```json
"autocomplete": {
  "model": "deepseek-coder-v2:16b",
  "provider": "ollama",
  "parameters": {
    "temperature": 0.2
  }
}
```

### Step 5: Download and Install Models via Ollama

Next, you need to download the necessary models via Ollama.

1. Download the **LLaMA 3 70B** model:

```shell
ollama pull llama3-70b
```

Download the **StarCoder 2** or **DeepSeek Coder v2** model, depending on your choice for autocompletion:

- For **StarCoder 2**:

  ```shell
  ollama pull starcoder-2-7b
  ```

- For **DeepSeek Coder v2**:

  ```
  ollama pull deepseek-coder-v2:16b
  ```

- For embeddings, make sure you have the **nomic-embed-text** model downloaded <u>(this should be automatically configured by Continue)</u>.

  ```shell
  ollama pull nomic-embed-text
  ```

### Step 6: Start Continue in VSCode

Once you have installed and configured all the models, you are ready to use Continue in VSCode.

1. Open a project in VSCode.
2. Use the Continue: Start command in the command palette (Ctrl + Shift + P).
3. You can now use Continue with the models you have configured for interactive chats, autocompletion, and embeddings.

### Step 7: Test the Models

Start by testing if the models are working correctly.

- For chat, try starting a session and check that **LLaMA 3** is being used.
- For autocompletion, type some code and see if **StarCoder 2** or **DeepSeek Coder v2** offers relevant completions.
- For embeddings, use features that require embedding vectors and check that **nomic-embed-text** is being used correctly.

:eyes: **​In action:**

{{< rawhtml >}} 
<video width="400" height="250" controls>
  <source src="/videos/autocomple_sample.webm" type="video/webm">
  Your browser does not support the video tag.
</video>
{{< /rawhtml >}} 

{{< rawhtml >}} 
<video width="400" height="250" controls>
  <source src="/videos/chat_sample.webm" type="video/webm">
  Your browser does not support the video tag.
</video>
{{< /rawhtml >}} 