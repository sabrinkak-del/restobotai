let currentUser = null;

const restaurants = [
    // תל אביב
    { id: 1, name: "הבית התאילנדי", cuisine: "תאילנדי", city: "תל אביב", rating: 4.8, available: true },
    { id: 3, name: "פופינה", cuisine: "צרפתי", city: "תל אביב", rating: 4.7, available: true },
    { id: 4, name: "טאיזו", cuisine: "אסייתי", city: "תל אביב", rating: 4.9, available: true },
    { id: 5, name: "משייה", cuisine: "ישראלי", city: "תל אביב", rating: 4.8, available: true },
    { id: 11, name: "המבורגר הדב", cuisine: "אמריקאי", city: "תל אביב", rating: 4.5, available: true },
    // ירושלים
    { id: 2, name: "מחניודה", cuisine: "ישראלי מודרני", city: "ירושלים", rating: 4.9, available: false },
    { id: 8, name: "המוציא", cuisine: "מרוקאי", city: "ירושלים", rating: 4.7, available: true },
    { id: 12, name: "אקליפטוס", cuisine: "תנכ\"י", city: "ירושלים", rating: 4.5, available: true },
    { id: 13, name: "קפה קדוש", cuisine: "חלבי", city: "ירושלים", rating: 4.6, available: true },
    { id: 14, name: "מונא", cuisine: "אירופאי", city: "ירושלים", rating: 4.8, available: true },
    // אשדוד
    { id: 15, name: "פסקדו", cuisine: "דגים", city: "אשדוד", rating: 4.9, available: true },
    { id: 16, name: "אידי", cuisine: "דגים וים", city: "אשדוד", rating: 4.7, available: true },
    { id: 17, name: "נמסטה", cuisine: "הודי", city: "אשדוד", rating: 4.4, available: true },
    { id: 18, name: "בני הדייג", cuisine: "ים תיכוני", city: "אשדוד", rating: 4.3, available: true },
    { id: 19, name: "וילה מארה", cuisine: "איטלקי", city: "אשדוד", rating: 4.5, available: true },
    // חיפה
    { id: 9, name: "סושי בר", cuisine: "יפני", city: "חיפה", rating: 4.4, available: true },
    { id: 20, name: "סינטה בר", cuisine: "בשרי", city: "חיפה", rating: 4.7, available: true },
    { id: 21, name: "מינאטו", cuisine: "יפני", city: "חיפה", rating: 4.6, available: true },
    { id: 22, name: "לחם ארז", cuisine: "חלבי", city: "חיפה", rating: 4.2, available: true },
    { id: 23, name: "מעיין הבירה", cuisine: "מזרח אירופאי", city: "חיפה", rating: 4.5, available: true },
    // באר שבע
    { id: 10, name: "פסטה בסטה", cuisine: "איטלקי", city: "באר שבע", rating: 4.2, available: true },
    { id: 24, name: "קמפאי", cuisine: "אסייתי", city: "באר שבע", rating: 4.6, available: true },
    { id: 25, name: "כרמים", cuisine: "שף ישראלי", city: "באר שבע", rating: 4.7, available: true },
    { id: 26, name: "ספרינג רול", cuisine: "אסייתי", city: "באר שבע", rating: 4.3, available: true },
    { id: 27, name: "האותנטיקה", cuisine: "בשרים", city: "באר שבע", rating: 4.5, available: true }
];

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    checkPersistedUser();
    // Start greeting immediately
    setTimeout(() => {
        showRestaurantSuggestions("שלום! אני סוכן הבוקינג של RestoBot ✨ איפה תרצו לאכול היום? הנה כמה המלצות בשבילכם:");
    }, 0);
    createSparkles();
});

function createSparkles() {
    setInterval(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle-element';
        sparkle.style.left = Math.random() * 100 + 'vw';
        sparkle.style.top = Math.random() * 100 + 'vh';
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2000);
    }, 400);
}

function checkPersistedUser() {
    const savedUser = localStorage.getItem('restobot_user');
    if (savedUser) {
        let user = JSON.parse(savedUser);
        // Always sync with latest data from "database"
        const users = JSON.parse(localStorage.getItem('restobot_db_users') || '[]');
        const dbUser = users.find(u => u.email === user.email);
        if (dbUser) {
            currentUser = dbUser;
            localStorage.setItem('restobot_user', JSON.stringify(currentUser));
        } else {
            currentUser = user;
        }
        updateUIForLogin();
    }
}

let reservationFlow = {
    step: 'start',
    data: {
        restaurant: null,
        date: null,
        people: null
    }
};

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    const loadingId = 'loading-' + Date.now();
    addLoading(loadingId);

    setTimeout(() => {
        const reply = getLocalResponse(text);
        removeLoading(loadingId);
        if (reply) addMessage(reply, 'bot');
    }, 800);
}

function getLocalResponse(message) {
    const text = message.toLowerCase();

    // Global reset/back
    if (text.includes("התחל") || text.includes("מחדש") || text.includes("בטל")) {
        reservationFlow.step = 'start';
        return "בטח, בואו נתחיל מהתחלה. באיזו מסעדה תרצו להזמין שולחן?";
    }

    switch (reservationFlow.step) {
        case 'start':
            let matched = restaurants.filter(r =>
                text.includes(r.name.toLowerCase()) ||
                text.includes(r.city.toLowerCase()) ||
                text.includes(r.cuisine.toLowerCase())
            );

            if (matched.length === 1) {
                if (!currentUser) {
                    showAuth();
                    return `בשמחה! כדי להזמין מקום ב-${matched[0].name}, אתם צריכים להתחבר או להירשם קודם. פתחתי לכם את חלון ההתחברות למעלה.`;
                }
                reservationFlow.data.restaurant = matched[0].name;
                reservationFlow.step = 'date';
                showCalendarInput();
                return `מעולה, בחרת ב${matched[0].name}. לאיזה תאריך תרצו להזמין? (פתחתי לכם לוח שנה לבחירה נוחה)`;
            }

            if (matched.length > 1) {
                const names = matched.slice(0, 3).map(r => r.name).join(", ");
                return `מצאתי כמה אופציות בחיפוש שלך: ${names}. במי מהן תרצו להזמין שולחן?`;
            }

            showRestaurantSuggestions("אני לא בטוח שהבנתי. אולי אחת מהמסעדות האלו תתאים?");
            return null;

        case 'date':
            reservationFlow.data.date = message;
            reservationFlow.step = 'people';
            showPeoplePicker();
            return `נפלא! ובאיזה הרכב תגיעו? (כמה אנשים)`;

        case 'people':
            const num = text.match(/\d+/);
            if (num) {
                reservationFlow.data.people = num[0];
                reservationFlow.step = 'confirm';
                showConfirmationButtons();
                return `אז סיכמנו: הזמנה ב${reservationFlow.data.restaurant} לתאריך ${reservationFlow.data.date} עבור ${reservationFlow.data.people} אנשים. לאשר את ההזמנה?`;
            }
            return "אשמח לדעת לכמה אנשים ההזמנה. כמה תהיו?";

        case 'confirm':
            if (text.includes("כן") || text.includes("אשר") || text.includes("בטח")) {
                if (!currentUser) {
                    return "כמעט סיימנו! רק תתחברו או תרשמו למעלה כדי שאוכל לשמור לכם את ההזמנה במערכת.";
                }

                // Save to user bookings
                const booking = {
                    restaurant: reservationFlow.data.restaurant,
                    date: reservationFlow.data.date,
                    people: reservationFlow.data.people,
                    id: Date.now()
                };

                if (!currentUser.bookings) currentUser.bookings = [];
                currentUser.bookings.push(booking);

                // Update specific user in the "database" list
                let users = JSON.parse(localStorage.getItem('restobot_db_users') || '[]');
                const userIndex = users.findIndex(u => u.email === currentUser.email);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                } else {
                    // Safety: if user wasn't in DB for some reason, add them now
                    users.push(currentUser);
                }
                localStorage.setItem('restobot_db_users', JSON.stringify(users));
                localStorage.setItem('restobot_user', JSON.stringify(currentUser));

                // Trigger Email Confirmation
                sendBookingEmail(booking);

                reservationFlow.step = 'start';
                return `ההזמנה אושרה בהצלחה! 🎉 שולחן ל-${booking.people} ב${booking.restaurant} מחכה לכם ב${booking.date}. אישור נשלח למייל שלכם.`;
            }
            reservationFlow.step = 'start';
            return "ההזמנה בוטלה. אם תרצו להתחיל מחדש, אני כאן.";

        default:
            return "אני לא בטוח איפה אנחנו... בואו נתחיל מחדש. איפה תרצו לאכול?";
    }
}

// UI Helpers for reservation flow
function showConfirmationButtons() {
    const chatMessages = document.getElementById('chat-messages');
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'animate-fade-in';
    confirmDiv.style.display = 'flex';
    confirmDiv.style.gap = '12px';
    confirmDiv.style.marginTop = '10px';
    confirmDiv.style.marginBottom = '20px';

    const options = [
        { text: 'כן, אשר הזמנה', value: 'כן', class: 'btn-primary' },
        { text: 'לא, בטל', value: 'לא', class: 'glass' }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.className = opt.class + ' glow-on-hover';
        btn.style.padding = '12px 24px';
        btn.style.borderRadius = '15px';
        if (opt.value === 'לא') {
            btn.style.background = 'white';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid #e2e8f0';
        }

        btn.onclick = () => {
            addMessage(opt.text, 'user');
            const reply = getLocalResponse(opt.value);
            if (reply) {
                setTimeout(() => addMessage(reply, 'bot'), 600);
            }
            confirmDiv.remove();
        };
        confirmDiv.appendChild(btn);
    });

    chatMessages.appendChild(confirmDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showRestaurantSuggestions(text) {
    if (text) addMessage(text, 'bot');

    const chatMessages = document.getElementById('chat-messages');
    const container = document.createElement('div');
    container.className = 'animate-fade-in suggestion-container';
    container.style.marginTop = '10px';
    container.style.marginBottom = '25px';

    const cities = ["אשדוד", "תל אביב", "ירושלים", "חיפה", "באר שבע"];
    const tabsRow = document.createElement('div');
    tabsRow.style.display = 'flex';
    tabsRow.style.gap = '8px';
    tabsRow.style.flexWrap = 'wrap';
    tabsRow.style.marginBottom = '12px';

    cities.forEach(city => {
        const tab = document.createElement('button');
        tab.textContent = city;
        tab.className = 'glass glow-on-hover';
        tab.style.padding = '8px 20px';
        tab.style.borderRadius = '20px';
        tab.style.border = '1px solid var(--primary)';
        tab.style.color = 'var(--primary)';
        tab.style.background = 'white';
        tab.style.fontWeight = 'bold';

        tab.onclick = () => {
            const existingList = container.querySelector('.suggestion-list');
            if (existingList) existingList.remove();

            const list = document.createElement('div');
            list.className = 'suggestion-list animate-slide-up';
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '8px';

            const filtered = restaurants.filter(r => r.city === city).slice(0, 5);
            filtered.forEach(r => {
                const btn = document.createElement('button');
                btn.innerHTML = `<i class="fas fa-utensils"></i> ${r.name} <small style="display:block; opacity: 0.7; font-weight: normal;">${r.cuisine}</small>`;
                btn.className = 'glass glow-on-hover';
                btn.style.textAlign = 'right';
                btn.style.padding = '12px 20px';
                btn.style.borderRadius = '15px';
                btn.style.border = '1px solid #eee';
                btn.style.background = 'rgba(255,255,255,0.8)';

                btn.onclick = () => {
                    addMessage(r.name, 'user');
                    const reply = getLocalResponse(r.name);
                    if (reply) {
                        addLoading('loading-suggest');
                        setTimeout(() => {
                            removeLoading('loading-suggest');
                            addMessage(reply, 'bot');
                        }, 600);
                    }
                    container.remove();
                };
                list.appendChild(btn);
            });
            container.appendChild(list);
        };
        tabsRow.appendChild(tab);
    });

    container.appendChild(tabsRow);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showCalendarInput() {
    const chatInputArea = document.querySelector('.chat-input-area');
    const existingDate = document.getElementById('temp-date-picker');
    if (existingDate) existingDate.remove();

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'temp-date-picker';
    dateInput.style.marginTop = '10px';
    dateInput.onchange = (e) => {
        if (e.target.value) {
            addMessage(e.target.value, 'user');
            const reply = getLocalResponse(e.target.value);
            setTimeout(() => addMessage(reply, 'bot'), 500);
            e.target.remove();
        }
    };
    chatInputArea.appendChild(dateInput);
}

function showPeoplePicker() {
    const chatMessages = document.getElementById('chat-messages');
    const pickerDiv = document.createElement('div');
    pickerDiv.className = 'animate-fade-in';
    pickerDiv.style.display = 'flex';
    pickerDiv.style.gap = '8px';
    pickerDiv.style.flexWrap = 'wrap';
    pickerDiv.style.marginTop = '5px';

    [2, 3, 4, 5, 6, 8, 10].forEach(n => {
        const btn = document.createElement('button');
        btn.textContent = n;
        btn.className = 'glass';
        btn.style.padding = '8px 16px';
        btn.style.borderRadius = '10px';
        btn.onclick = () => {
            addMessage(n.toString(), 'user');
            const reply = getLocalResponse(n.toString());
            setTimeout(() => addMessage(reply, 'bot'), 500);
            pickerDiv.remove();
        };
        pickerDiv.appendChild(btn);
    });

    chatMessages.appendChild(pickerDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, type) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type} animate-fade-in`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoading(id) {
    const chatMessages = document.getElementById('chat-messages');
    const loadDiv = document.createElement('div');
    loadDiv.id = id;
    loadDiv.className = 'message bot animate-fade-in';
    loadDiv.innerHTML = '<span class="loading-dots">חושב</span>';
    chatMessages.appendChild(loadDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoading(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// Handle Enter key for chat
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) return alert('אנא מלאו את כל הפרטים');

    // Get existing users or create new list
    let users = JSON.parse(localStorage.getItem('restobot_db_users') || '[]');

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return alert('אימייל זה כבר רשום במערכת. נסה להתחבר.');
    }

    const newUser = { name, email, password, bookings: [] };
    users.push(newUser);

    // Save to "database"
    localStorage.setItem('restobot_db_users', JSON.stringify(users));

    // Auto-login after signup
    currentUser = newUser;
    localStorage.setItem('restobot_user', JSON.stringify(currentUser));

    updateUIForLogin();
    hideAuth();
    addMessage(`נעים להכיר ${name}! נרשמת בהצלחה. איך אני יכול לעזור לך היום?`, 'bot');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) return alert('אנא הזינו אימייל וסיסמה');

    // Search in the "database"
    const users = JSON.parse(localStorage.getItem('restobot_db_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Ensure bookings array exists
        if (!user.bookings) user.bookings = [];
        currentUser = user;
        localStorage.setItem('restobot_user', JSON.stringify(currentUser));
        updateUIForLogin();
        hideAuth();
        addMessage(`ברוך שובך, ${user.name}! שמחים לראות אותך שוב.`, 'bot');
    } else {
        alert('אימייל או סיסמה לא נכונים. אנא נסה שוב או הירשם.');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('restobot_user');
    document.getElementById('logged-in-area').style.display = 'none';
    document.getElementById('login-btn').style.display = 'block';
    addMessage('התנתקת בהצלחה. נשמח לראות אותך שוב!', 'bot');
}

function updateUIForLogin() {
    document.getElementById('login-btn').style.display = 'none';
    const area = document.getElementById('logged-in-area');
    area.style.display = 'flex';
    document.getElementById('user-greeting').textContent = `שלום, ${currentUser.name}`;
}

function loadBookings() {
    const list = document.getElementById('bookings-list');
    if (!currentUser || !currentUser.bookings || currentUser.bookings.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">אין הזמנות פעילות.</p>';
        return;
    }

    list.innerHTML = currentUser.bookings.map(b => `
        <div class="glass" style="padding: 15px; margin-bottom: 15px; border-radius: 20px; border-right: 5px solid var(--primary); background: white; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px; font-size: 1.1rem;">${b.restaurant}</div>
                <div style="font-size: 0.9rem; color: var(--text-muted);">
                    <i class="far fa-calendar-alt"></i> ${b.date} | 
                    <i class="far fa-user"></i> ${b.people} אנשים
                </div>
            </div>
            <button onclick="cancelBooking(${b.id})" class="glass" style="padding: 8px 15px; border-radius: 12px; color: #ef4444; border: 1px solid #fee2e2; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                <i class="fas fa-times"></i> בטל
            </button>
        </div>
    `).join('');
}

function cancelBooking(id) {
    if (!confirm('האם אתם בטוחים שברצונכם לבטל את ההזמנה? הביטול יועבר ישירות למסעדה.')) return;

    const bookingIndex = currentUser.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) return;

    const b = currentUser.bookings[bookingIndex];
    currentUser.bookings.splice(bookingIndex, 1);

    // Sync database
    let users = JSON.parse(localStorage.getItem('restobot_db_users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('restobot_db_users', JSON.stringify(users));
    }
    localStorage.setItem('restobot_user', JSON.stringify(currentUser));

    loadBookings();
    addMessage(`ביטול: ההזמנה ל-${b.restaurant} בתאריך ${b.date} בוטלה בהצלחה והודעה נשלחה למסעדה.`, 'bot');
}

async function sendBookingEmail(booking) {
    if (!currentUser || !currentUser.email) return;

    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:8080' : '';
    console.log(`[Email] Requesting for: ${currentUser.email} to ${API_BASE || 'current origin'}`);
    try {
        const response = await fetch(`${API_BASE}/api/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                name: currentUser.name,
                restaurant: booking.restaurant,
                date: booking.date,
                people: booking.people
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log('Confirmation email sent successfully');
        } else {
            console.error('Failed to send email:', result.error);
        }
    } catch (err) {
        console.error('Email service error:', err);
    }
}
