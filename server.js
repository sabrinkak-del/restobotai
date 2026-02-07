const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;

    const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

    if (existingUser) {
        return res.json({ success: false, message: 'האימייל כבר קיים' });
    }

    const { error } = await supabase
        .from('users')
        .insert([{ name, email, password }]);

    if (error) {
        return res.json({ success: false, message: 'שגיאה ביצירת חשבון' });
    }

    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { data: user } = await supabase
        .from('users')
        .select('name, email')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

    if (!user) {
        return res.json({ success: false, message: 'אימייל או סיסמה לא נכונים' });
    }

    res.json({ success: true, user: { name: user.name, email: user.email } });
});

app.get('/api/bookings', async (req, res) => {
    const { email } = req.query;

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_email', email);

    if (error) {
        return res.json({ bookings: [] });
    }

    res.json({ bookings: bookings || [] });
});

app.post('/api/send-confirmation', async (req, res) => {
    const { email, restaurant, date, people, name } = req.body;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    console.log(`\n--- NEW EMAIL REQUEST: ${new Date().toISOString()} ---`);
    console.log(`Target: ${email}`);
    console.log(`Details: ${restaurant} | ${date} | ${people} pax | Name: ${name}`);

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'restobot@resend.dev',
                to: email,
                subject: 'אישור הזמנה - RestoBot',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px; border: 1px solid #f97316; border-radius: 15px;">
                        <h2 style="color: #f97316;">נעים מאוד ${name}! ההזמנה שלך שוריינה בהצלחה 🎉</h2>
                        <p>אנחנו שמחים לעדכן שהזמנת המקום שלך בוצעה:</p>
                        <div style="background: #fff7ed; padding: 15px; border-radius: 10px; margin: 20px 0;">
                            <p><strong>🍴 מסעדה:</strong> ${restaurant}</p>
                            <p><strong>📅 תאריך:</strong> ${date}</p>
                            <p><strong>👥 מספר סועדים:</strong> ${people}</p>
                        </div>
                        <p>מצפים לראותכם!</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8rem; color: #64748b;">הודעה זו נשלחה אוטומטית על ידי RestoBot - הסוכן החכם שלכם.</p>
                    </div>
                `
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`SUCCESS! Resend ID: ${data.id}`);

            await supabase
                .from('bookings')
                .insert([{
                    user_email: email,
                    restaurant,
                    date,
                    people,
                    name
                }]);

            res.json({ success: true, id: data.id });
        } else {
            console.error('[Email] Resend API Error:', JSON.stringify(data, null, 2));
            res.status(500).json({ success: false, error: data });
        }
    } catch (error) {
        console.error('[Email] Unexpected System Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 RestoBot Server started on http://localhost:${PORT}`);
        console.log(`Ready to handle email confirmations.`);
    });
}

module.exports = app;
