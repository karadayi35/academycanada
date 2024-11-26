document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const chatContainer = document.getElementById("chat-container");
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const emojiBar = document.getElementById("emoji-bar");
    const currentUsernameSpan = document.getElementById("current-username");
    const userAvatarImg = document.getElementById("user-avatar");
    const snowContainer = document.getElementById("snow");

    // Ses dosyası
    const messageSound = new Audio("sounds/message_received.mp3");

    let currentUser = null; // Kullanıcı bilgisi burada tutulacak

    // Kullanıcı Kaydı
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const email = document.getElementById("login-email").value.trim();

        if (!username || !email.includes("@gmail.com")) {
            alert("Please enter a valid username and Gmail address.");
            return;
        }

        // Kayıt API'sine istek gönder
        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Kayıt başarısız: ${errorData.error}`);
                return;
            }

            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem("chatUser", JSON.stringify(currentUser));
            startChat(currentUser);
        } catch (error) {
            console.error("Kayıt sırasında hata oluştu:", error);
        }
    });

    // Daha önce kayıtlı kullanıcı var mı?
    const savedUser = JSON.parse(localStorage.getItem("chatUser"));
    if (savedUser) {
        currentUser = savedUser;
        startChat(currentUser);
    }

    // Sohbeti başlatma
    function startChat(user) {
        loginForm.style.display = "none";
        chatContainer.style.display = "block";
        currentUsernameSpan.textContent = user.username;
        userAvatarImg.src = user.icon;

        chatMessages.scrollTop = chatMessages.scrollHeight;

        initializeBots(); // Botları başlat
        fetchTelegramMessages(); // Telegram mesajlarını çek
        processBotQueue(); // Bot kuyruğunu işleme başlat
    }

    // Kar tanesi oluşturma
    const maxSnowflakes = 50; // Maksimum kar tanesi sayısı
    function createSnowflake() {
        if (snowContainer.childElementCount >= maxSnowflakes) return;

        const snowflake = document.createElement("div");
        snowflake.classList.add("snowflake");
        snowflake.textContent = "❄";
        snowflake.style.left = Math.random() * window.innerWidth + "px";
        snowflake.style.animationDuration = Math.random() * 3 + 7 + "s";
        snowflake.style.fontSize = Math.random() * 10 + 10 + "px";
        snowflake.style.opacity = Math.random();

        snowContainer.appendChild(snowflake);

        setTimeout(() => {
            snowflake.remove();
        }, 10000);
    }
    setInterval(createSnowflake, 300);

    // Bot kuyruğunu başlat
    let botQueue = [];
    const bots = [
        { name: "Academybot", icon: "icon1.png", message: "Telegram group: Click" },
        { name: "StakeBot", icon: "icon2.png", message: "Best Casino Go: Click" },
    ];
    function initializeBots() {
        bots.forEach((bot) => botQueue.push(bot));

        setInterval(() => {
            bots.forEach((bot) => botQueue.push(bot));
        }, 60000);
    }

    // Bot kuyruğunu işleme
    function processBotQueue() {
        if (botQueue.length > 0) {
            const bot = botQueue.shift();
            addMessage(bot.name, bot.message, bot.icon);
        }
        setTimeout(processBotQueue, 5000);
    }

    // Mesaj gönderme
    sendButton.addEventListener("click", sendMessage);
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        const icon = currentUser.icon || "icon1.png";
        addMessage(currentUser.username, message, icon);

        saveMessage(currentUser.username, message, icon);
        messageInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(user, text, icon) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.innerHTML = `
            <div class="profile">
                <img src="${icon}" alt="Avatar" class="avatar">
                <span class="username">${user}:</span>
            </div>
            <div class="content">${text}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        messageSound.play();
    }

    function saveMessage(user, text, icon) {
        const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
        savedMessages.push({ user, text, icon });
        localStorage.setItem("chatMessages", JSON.stringify(savedMessages));
    }

    // Emoji tıklama olayını dinle
    emojiBar.addEventListener("click", (e) => {
        if (e.target.classList.contains("emoji")) {
            const emoji = e.target.textContent; // Tıklanan emojiyi al
            messageInput.value += emoji; // Mesaj giriş kutusuna ekle
            messageInput.focus(); // Giriş kutusuna odaklan
        }
    });

    // Enter tuşuyla mesaj gönderme
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    // Telegram mesajlarını çekme ve direkt ekrana yazdırma
    function fetchTelegramMessages() {
        fetch("/get_messages")
            .then((response) => response.json())
            .then((data) => {
                data.forEach((msg) => {
                    const icon = userIcons[msg.author] || (userIcons[msg.author] = icons[Math.floor(Math.random() * icons.length)]);
                    addMessage(msg.author, msg.content, icon); // Mesajı ekrana yazdır
                });
            })
            .catch((error) => console.error("Telegram mesajları alınırken hata oluştu:", error));
    }

    // Telegram mesajlarını her 5 saniyede bir çek
    setInterval(fetchTelegramMessages, 5000);
});
