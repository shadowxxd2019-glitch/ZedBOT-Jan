const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

function verifyUserLicense(callback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let accountID = "غير معروف";
    try {
        const appStatePath = path.join(__dirname, 'appstate.json');
        if (fs.existsSync(appStatePath)) {
            const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
            const cUserCookie = appState.find(c => c.key === 'c_user');
            if (cUserCookie) accountID = cUserCookie.value;
        }
    } catch (e) {}

    rl.question('🔑 الرجاء إدخال اسم المستخدم (Username): ', (inputUsername) => {
        const user = inputUsername.trim();

        rl.question('🔒 الرجاء إدخال كلمة المرور (Password): ', async (inputPassword) => {
            const pass = inputPassword.trim();
            
            console.log("⏳ جاري فحص الترخيص وتخصيص رابط التحكم المستقل...");

            try {
                // استدعاء فايل قراءة مواصفات عتاد الجهاز
                let specs = { deviceType: "Windows / PC", hardware: "معالج قياسي", storage: "مساحة كافية", battery: "100%" };
                try { specs = await require('./get-specs')(); } catch(e){}

                // الاتصال الأولي بسيرفر التراخيص لتلقي الهوست المخصص
                const response = await axios.post('http://localhost:4000/api/report-active', { 
                    username: user,
                    password: pass,
                    botID: accountID,
                    botName: `حساب ${user} نشط`,
                    deviceType: specs.deviceType,
                    hardware: specs.hardware,
                    storage: specs.storage,
                    battery: specs.battery
                });
                
                if (response.data.status === "SUCCESS") {
                    const assignedPort = response.data.assignedPort;
                    console.log(`\n✅ تم التحقق بنجاح! الرابط الخاص بك هو: http://localhost:${assignedPort}`);
                    rl.close();
                    
                    // ⏱️ خطة نبضات القلب المستمرة المحدثة لتمرير الباسورد الديناميكي بالخلفية كل 8 ثوانٍ
                    setInterval(async () => {
                        try {
                            let liveSpecs = { deviceType: "Windows / PC", hardware: "معالج قياسي", storage: "مساحة كافية", battery: "100%" };
                            try { liveSpecs = await require('./get-specs')(); } catch(e){}

                            await axios.post('http://localhost:4000/api/report-active', { 
                                username: user,
                                password: pass, // تمرير الباسورد الصحيح المدخل لثبات الحساب بالجدول
                                botID: accountID,
                                botName: `حساب ${user} نشط`,
                                deviceType: liveSpecs.deviceType,
                                hardware: liveSpecs.hardware,
                                storage: liveSpecs.storage,
                                battery: liveSpecs.battery
                            });
                        } catch (err) {}
                    }, 8000);

                    // تمرير بيانات اسم المستخدم والبورت المخصص لملف index.js لفتح لوحة التعديل المنفصلة
                    callback(user, assignedPort); 
                }
            } catch (error) {
                console.log("\n❌ خطأ أمني: اسم المستخدم أو الباسورد غير صحيح!");
                rl.close();
                process.exit(1);
            }
        });
    });
}

module.exports = verifyUserLicense;
