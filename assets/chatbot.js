// Chatbot - Assistant pour xgueret.github.io
// Base de connaissances adaptée aux services de Xavier GUERET

const knowledge = {
    'devops': {
        title: 'DevOps',
        content: 'Je suis passionné par le DevOps et l\'automatisation. Je travaille avec des outils comme Kubernetes, Docker, Ansible, Terraform, et Python pour créer des infrastructures robustes et automatisées.'
    },
    'kubernetes': {
        title: 'Kubernetes',
        content: 'Kubernetes (K8s) est une plateforme open-source d\'orchestration de conteneurs. J\'ai de l\'expérience dans le déploiement et la gestion d\'applications conteneurisées sur Kubernetes.'
    },
    'k8s': {
        title: 'Kubernetes',
        content: 'Kubernetes (K8s) est une plateforme open-source d\'orchestration de conteneurs. J\'ai de l\'expérience dans le déploiement et la gestion d\'applications conteneurisées sur Kubernetes.'
    },
    'docker': {
        title: 'Docker',
        content: 'Docker est une plateforme de conteneurisation qui permet d\'empaqueter des applications et leurs dépendances dans des conteneurs. Je l\'utilise régulièrement pour le développement et le déploiement d\'applications.'
    },
    'ansible': {
        title: 'Ansible',
        content: 'Ansible est un outil d\'automatisation open-source pour la gestion de configuration, le déploiement d\'applications et l\'orchestration. Je l\'utilise pour automatiser les tâches répétitives et gérer les infrastructures.'
    },
    'terraform': {
        title: 'Terraform',
        content: 'Terraform est un outil d\'Infrastructure as Code (IaC) qui permet de définir et de provisionner des infrastructures cloud de manière déclarative. Je l\'utilise pour gérer des infrastructures sur différents cloud providers.'
    },
    'python': {
        title: 'Python',
        content: 'Python est un langage de programmation polyvalent que j\'utilise pour l\'automatisation, le scripting, et le développement d\'outils DevOps.'
    },
    'proxmox': {
        title: 'Proxmox',
        content: 'Proxmox VE est une plateforme de virtualisation open-source. J\'ai de l\'expérience dans la gestion de machines virtuelles et de conteneurs avec Proxmox.'
    },
    'bash': {
        title: 'Bash',
        content: 'Bash est un shell Unix et un langage de script que j\'utilise quotidiennement pour l\'automatisation de tâches et l\'administration système.'
    },
    'about': {
        title: 'À propos de moi',
        content: 'Je suis Xavier GUERET, ingénieur DevOps passionné par l\'automatisation et l\'amélioration continue. Mon objectif : automatiser tout ce qui bouge et garder l\'esprit zen ! <a href="/about/" style="color: #667eea; font-weight: 600;">En savoir plus</a>'
    },
    'qui': {
        title: 'À propos de moi',
        content: 'Je suis Xavier GUERET, ingénieur DevOps passionné par l\'automatisation et l\'amélioration continue. Mon objectif : automatiser tout ce qui bouge et garder l\'esprit zen ! <a href="/about/" style="color: #667eea; font-weight: 600;">En savoir plus</a>'
    },
    'projets': {
        title: 'Mes projets',
        content: 'Je travaille sur divers projets liés au DevOps, à l\'automatisation et à l\'infrastructure as code. Découvrez mes projets sur <a href="/projects/" style="color: #667eea; font-weight: 600;">la page projets</a> ou sur mon <a href="https://github.com/xgueret/" target="_blank" style="color: #667eea; font-weight: 600;">GitHub</a>.'
    },
    'blog': {
        title: 'Blog',
        content: 'Je partage mes expériences et mes connaissances sur mon blog. Vous y trouverez des articles sur le DevOps, Kubernetes, l\'automatisation et bien plus. <a href="/posts/" style="color: #667eea; font-weight: 600;">Lire le blog</a>'
    },
    'contact': {
        title: 'Me contacter',
        content: 'Vous pouvez me contacter via <a href="/contact/" style="color: #667eea; font-weight: 600;">le formulaire de contact</a> ou me retrouver sur <a href="https://github.com/xgueret/" target="_blank" style="color: #667eea; font-weight: 600;">GitHub</a>, <a href="https://gitlab.com/971xavier.gueret/" target="_blank" style="color: #667eea; font-weight: 600;">GitLab</a>, <a href="https://www.linkedin.com/in/xavier-gueret-47bb3019b/" target="_blank" style="color: #667eea; font-weight: 600;">LinkedIn</a> ou <a href="https://x.com/hixmaster" target="_blank" style="color: #667eea; font-weight: 600;">X (Twitter)</a>.'
    },
    'cv': {
        title: 'CV / Resume',
        content: 'Consultez mon parcours professionnel et mes compétences sur <a href="/cv/" style="color: #667eea; font-weight: 600;">ma page CV</a>.'
    },
    'automatisation': {
        title: 'Automatisation',
        content: 'L\'automatisation est au cœur de ma démarche DevOps. J\'utilise des outils comme Ansible, Terraform, Python et Bash pour automatiser les tâches répétitives et améliorer l\'efficacité des processus.'
    },
    'infrastructure': {
        title: 'Infrastructure as Code',
        content: 'L\'Infrastructure as Code (IaC) permet de gérer et provisionner des infrastructures via du code. J\'utilise principalement Terraform et Ansible pour cette approche.'
    }
};

// Variables globales
let chatButton, chatContainer, closeBtn, chatMessages, chatInput, sendBtn;

// Initialisation du chatbot
function initChatbot() {
    // Récupération des éléments
    chatButton = document.getElementById('chatButton');
    chatContainer = document.getElementById('chatContainer');
    closeBtn = document.getElementById('closeBtn');
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendBtn');

    // Événements d'ouverture/fermeture
    if (chatButton) {
        chatButton.addEventListener('click', toggleChat);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChat);
    }

    // Événements d'envoi
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });
    }

    // Réponses rapides
    const quickReplies = document.querySelectorAll('.quick-reply-btn');
    quickReplies.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            chatInput.value = question;
            handleSend();
        });
    });
}

// Ouvrir/Fermer le chat
function toggleChat() {
    if (chatContainer && chatButton) {
        chatContainer.classList.toggle('active');
        chatButton.classList.toggle('active');
        if (chatContainer.classList.contains('active') && chatInput) {
            chatInput.focus();
        }
    }
}

// Fonction pour ajouter un message
function addMessage(content, isUser = false) {
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll vers le bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fonction pour trouver une réponse
function findAnswer(question) {
    const normalizedQuestion = question.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .trim();

    // Recherche exacte
    for (const [key, value] of Object.entries(knowledge)) {
        const normalizedKey = key.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (normalizedQuestion.includes(normalizedKey)) {
            return `<strong>${value.title}</strong><br>${value.content}`;
        }
    }

    // Si aucune correspondance exacte, chercher des mots-clés
    const keywords = {
        'conteneur': 'docker',
        'virtualisation': 'proxmox',
        'orchestration': 'kubernetes',
        'iac': 'terraform',
        'script': 'bash',
        'automation': 'automatisation',
        'qui es-tu': 'about',
        'qui est': 'about',
        'presentation': 'about',
        'projet': 'projets',
        'articles': 'blog',
        'posts': 'blog',
        'ecrire': 'contact',
        'contacter': 'contact',
        'email': 'contact',
        'linkedin': 'contact',
        'github': 'contact',
        'gitlab': 'contact',
        'twitter': 'contact',
        'social': 'contact',
        'parcours': 'cv',
        'competence': 'cv',
        'experience': 'cv',
        'resume': 'cv'
    };

    for (const [keyword, knowledgeKey] of Object.entries(keywords)) {
        if (normalizedQuestion.includes(keyword)) {
            const value = knowledge[knowledgeKey];
            return `<strong>${value.title}</strong><br>${value.content}`;
        }
    }

    return null;
}

// Fonction pour gérer l'envoi
function handleSend() {
    if (!chatInput) return;

    const question = chatInput.value.trim();

    if (question === '') return;

    // Afficher la question de l'utilisateur
    addMessage(question, true);
    chatInput.value = '';

    // Simuler un délai de réflexion
    setTimeout(() => {
        const answer = findAnswer(question);

        if (answer) {
            addMessage(answer);
        } else {
            addMessage('Désolé, je n\'ai pas trouvé d\'information sur ce sujet. Voici quelques exemples de questions :<br><br>💻 <strong>Technologies :</strong> DevOps, Kubernetes, Docker, Ansible, Terraform, Python, Bash, Proxmox...<br><br>👤 <strong>À propos :</strong> Qui êtes-vous ? Vos projets ? Votre blog ? Votre CV ?<br><br>📞 <strong>Contact :</strong> Comment vous contacter ?<br><br>N\'hésitez pas à <a href="/contact/" style="color: #667eea; font-weight: 600;">me contacter directement</a> pour plus d\'informations !');
        }
    }, 500);
}

// Initialiser le chatbot au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
