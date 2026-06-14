const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const express = require('express');
const axios = require('axios'); 

// استدعاء فايل الربط المخصوص للتحقق من الترخيص
const verifyUserLicense = require('./check-license');

// استدعاء كافة ملفات المهمات المنفصلة للمجموعات
const startNicknameLoop = require('./task-nicknames');
const startMessageLoop = require('./task-messages');
const startGroupTitleLoop = require('./task-grouptitle');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

const apiNeroPath = path.join(__dirname, 'API-Nero', 'index.js');
const login = require(apiNeroPath); 

// إطلاق خطوة الفحص والربط الإجبارية
verifyUserLicense((username, assignedPort) => {
    runMainBotSystem(username, assignedPort);
});

function runMainBotSystem(username, assignedPort) {
    const app = express();
    app.use(express.urlencoded({ extended: true }));

    const userConfigFile = path.join(__dirname, `config_${username}.json`);

    // إنشاء ملف إعدادات افتراضي نقي إذا كان المستخدم يفتح البرنامج لأول مرة
    if (!fs.existsSync(userConfigFile)) {
        const defaultSettings = {
            groups: [],
            groupTitle1: "👑 مجتمع زيد السري", 
            groupTitle2: "💥 منظمة زيد العالمية",
            name1: "🔥 جيش زيد الأول", 
            name2: "⚡ جيش زيد الثاني",
            messages: ["🤖 بوت زيد المطور يعمل بنجاح!"]
        };
        fs.writeFileSync(userConfigFile, JSON.stringify(defaultSettings, null, 2), 'utf8');
    }

    // 🎯 تحديث ملف config.json الرئيسي مرة واحدة فقط عند الإقلاع لكسر قفل الذاكرة
    try { 
        fs.writeFileSync('config.json', fs.readFileSync(userConfigFile)); 
    } catch(e){}

    // 🌐 لوحة التحكم المتطورة الشاملة الكاملة
    app.get('/', (req, res) => {
        const config = JSON.parse(fs.readFileSync(userConfigFile, 'utf8'));
        const displayedMessages = config.messages ? config.messages.join('\n') : '';
        
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>لوحة تحكم مخصصة لـ ${username} 🚀</title>
                <style>
                    body { font-family: Tahoma, sans-serif; background: #121212; color: #fff; text-align: center; padding: 20px; }
                    .card { background: #1e1e1e; padding: 20px; border-radius: 10px; display: inline-block; text-align: right; width: 480px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); margin-bottom: 20px; }
                    input, textarea { width: 95%; padding: 10px; margin: 8px 0; border-radius: 5px; border: 1px solid #333; background: #2a2a2a; color: #fff; font-family: monospace; }
                    button { background: #00ea91; color: #000; border: none; padding: 12px; width: 100%; font-weight: bold; border-radius: 5px; cursor: pointer; font-size: 16px; }
                    button:hover { background: #00c479; }
                    h3 { border-bottom: 1px solid #333; padding-bottom: 5px; color: #00ea91; margin-top: 15px; }
                    .user-badge { background: #00ea91; color: #000; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>🤖 لوحة التعديل المستقلة للمستخدم: <span class="user-badge">${username}</span></h1>
                <p style="color: #888;">أنت تعمل على الرابط الخاص بك والمنفذ الآمن: ${assignedPort}</p>
                <div class="card">
                    <form action="/update" method="POST">
                        <h3>🎯 قائمة مجموعاتك المستهدفة (اكتب كل ID في سطر)</h3>
                        <textarea name="groups" rows="3" style="color: #00ea91; font-weight: bold;">${config.groups ? config.groups.join('\n') : ''}</textarea>

                        <h3>⚙️ إعدادات تدوير أسماء المجموعات (كل 5 ثوانٍ)</h3>
                        <label>الاسم الأول للمجموعة:</label>
                        <input type="text" name="groupTitle1" value="${config.groupTitle1 || ''}">
                        <label>الاسم الثاني للمجموعة:</label>
                        <input type="text" name="groupTitle2" value="${config.groupTitle2 || ''}">

                        <h3>⚙️ إعدادات تدوير كنيات الأعضاء</h3>
                        <label>الكنية الأولى للأعضاء:</label>
                        <input type="text" name="name1" value="${config.name1 || ''}">
                        <label>الكنية الثانية للأعضاء:</label>
                        <input type="text" name="name2" value="${config.name2 || ''}">
                        
                        <h3>✉️ صندوق رسالتك الكبيرة المكررة</h3>
                        <textarea name="messages" rows="4">${displayedMessages}</textarea>
                        
                        <button type="submit">💾 حفظ تعديلاتي الخاصة وتحديث البوت</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    });

    // 💾 حفظ التعديلات وتحديث ملف config المشترك فوراً لمرة واحدة
    app.post('/update', (req, res) => {
        const config = JSON.parse(fs.readFileSync(userConfigFile, 'utf8'));
        config.groups = req.body.groups.split('\n').map(g => g.trim()).filter(g => g.length > 0);
        config.groupTitle1 = req.body.groupTitle1;
        config.groupTitle2 = req.body.groupTitle2;
        config.name1 = req.body.name1;
        config.name2 = req.body.name2;
        config.messages = req.body.messages.trim() ? [req.body.messages.trim()] : [];

        // 1. حفظ في ملف اليوزر الخاص لحمايته
        fs.writeFileSync(userConfigFile, JSON.stringify(config, null, 2), 'utf8');
        // 2. 🎯 تحديث ملف التشغيل الصافي فوراً لتبنيه من المهمات بدون تأخير
        try { fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8'); } catch(e){}
        
        res.send(`<h2>✅ تم حفظ تعديلات الحساب ${username} بنجاح!</h2><script>setTimeout(() => { window.location.href = "/"; }, 2000);</script>`);
    });

    app.listen(assignedPort, () => {
        console.log(`🔗 لوحة تحكم التعديل لـ [${username}] جاهزة: http://localhost:${assignedPort}`);
        const { exec } = require('child_process');
        exec(`start chrome --new-window http://localhost:${assignedPort}`, (err) => {
            if (err) exec(`start http://localhost:${assignedPort}`);
        });
    });

    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    login({ appState: appState }, async (err, api) => {
        if (err) return;
        api.setOptions({ logLevel: "silent", selfListen: false, listenEvents: false });
        
        // ⏱️ خطة نبضات القلب فائقة الثبات بدون أي إعاقة للملفات النصية
        setInterval(async () => {
            try {
                const configJson = JSON.parse(fs.readFileSync(userConfigFile, 'utf8'));
                let accountID = "غير معروف";
                const cUserCookie = appState.find(c => c.key === 'c_user');
                if (cUserCookie) accountID = cUserCookie.value;

                await axios.post('http://localhost:4000/api/report-active', { 
                    username: username,
                    password: "2846500", 
                    botID: accountID,
                    botName: `حساب ${username} نشط`
                });
            } catch (err) {}
        }, 8000);

        try {
            await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            // انطلاق مهمات تكرار المجموعات الصافية بحرية كاملة
            startNicknameLoop(api); 
            startMessageLoop(api); 
            startGroupTitleLoop(api);
        } catch (pErr) {
            startNicknameLoop(api); 
            startMessageLoop(api); 
            startGroupTitleLoop(api);
        }
    });
}
