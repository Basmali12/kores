/* /user/script.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDe0AF8qH4mqYjY1oYlkdDduBs0L2pCBXI",
    authDomain: "kors-27aeb.firebaseapp.com",
    projectId: "kors-27aeb",
    storageBucket: "kors-27aeb.firebasestorage.app",
    messagingSenderId: "678840333092",
    appId: "1:678840333092:web:8d53ee70328f6beaaef9b1",
    measurementId: "G-DL1EQDKQHY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const welcomeScreen = document.getElementById('welcome-screen');
const appScreen = document.getElementById('app-screen');
const continueBtn = document.getElementById('continue-btn');
const videosGrid = document.getElementById('videos-grid');

const videoModal = document.getElementById('video-modal');
const playerVideo = document.getElementById('player-video');
const videoModalTitle = document.getElementById('video-modal-title');
const closeVideoBtn = document.getElementById('close-video-btn');

const loginScreen = document.getElementById('login-screen');
const googleLoginBtn = document.getElementById('google-login-btn');

const warningModal = document.getElementById('warning-modal');
const proBadge = document.getElementById('pro-badge');
const agreeWarningBtn = document.getElementById('agree-warning-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const subscriptionModal = document.getElementById('subscription-modal');
const closeSubBtn = document.getElementById('close-sub-btn');
const subWhatsappBtn = document.getElementById('sub-whatsapp-btn');

const userEmailDisplay = document.getElementById('user-email-display');
const userDateDisplay = document.getElementById('user-date-display');
const userIdDisplay = document.getElementById('user-id-display');
const copyIdBtn = document.getElementById('copy-id-btn');
const logoutBtn = document.getElementById('logout-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');

let currentUserData = null;

async function checkAdminSubscription(user) {
    try {
        const usersRef = collection(db, "users");
        let isSubbed = false;
        
        if (user.email) {
            const qEmail = query(usersRef, where("userId", "==", user.email));
            const snapEmail = await getDocs(qEmail);
            snapEmail.forEach(docSnap => { if(docSnap.data().status === 'active') isSubbed = true; });
        }
        if (user.uid && !isSubbed) {
            const qUid = query(usersRef, where("userId", "==", user.uid));
            const snapUid = await getDocs(qUid);
            snapUid.forEach(docSnap => { if(docSnap.data().status === 'active') isSubbed = true; });
        }
        return isSubbed;
    } catch (e) {
        console.error(e);
        return false;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        const isAdminSubbed = await checkAdminSubscription(user);
        
        if (userSnap.exists()) {
            currentUserData = userSnap.data();
            currentUserData.subscribed = isAdminSubbed;
            updateSettingsUI();
            if (currentUserData.subscribed) {
                proBadge.classList.remove('hidden');
            } else {
                proBadge.classList.add('hidden');
            }
        }
    }
});

let isLightMode = false;
themeToggleBtn.addEventListener('click', () => {
    isLightMode = !isLightMode;
    if (isLightMode) {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerText = '🌙 الوضع الليلي';
    } else {
        document.body.classList.remove('light-theme');
        themeToggleBtn.innerText = '☀️ الوضع النهاري';
    }
});

continueBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    warningModal.classList.remove('hidden');
});

agreeWarningBtn.addEventListener('click', () => {
    warningModal.classList.add('hidden');
    if (currentUserData) {
        finishLogin();
    } else {
        loginScreen.classList.remove('hidden-app');
        loginScreen.classList.add('active');
    }
});

googleLoginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const errorMsg = document.getElementById('login-error-msg');
        if (errorMsg) errorMsg.style.display = 'none';

        if (!auth.currentUser) {
            await signInWithPopup(auth, provider);
        }
        const user = auth.currentUser;
        if(user) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            const isAdminSubbed = await checkAdminSubscription(user);
            
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    subscribed: isAdminSubbed,
                    createdAt: serverTimestamp()
                });
                currentUserData = { uid: user.uid, email: user.email, subscribed: isAdminSubbed, createdAt: new Date() };
            } else {
                currentUserData = userSnap.data();
                currentUserData.subscribed = isAdminSubbed;
            }
            if (currentUserData.subscribed) {
                proBadge.classList.remove('hidden');
            } else {
                proBadge.classList.add('hidden');
            }
            finishLogin();
        }
    } catch (error) {
        console.error("Login failed", error);
        const errorMsg = document.getElementById('login-error-msg');
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "فشل تسجيل الدخول. إذا كنت داخل نافذة مصغرة، يرجى فتح الرابط في نافذة جديدة (Open in new tab).";
        }
    }
});

function finishLogin() {
    loginScreen.classList.add('hidden-app');
    loginScreen.classList.remove('active');
    appScreen.classList.remove('hidden-app');
    appScreen.classList.add('active');
    document.body.style.overflow = 'auto'; // allow scrolling now
    loadVideos();
    updateSettingsUI();
}

function updateSettingsUI() {
    if (!currentUserData) {
        userEmailDisplay.innerText = "غير مسجل";
        userDateDisplay.innerText = "-";
        userIdDisplay.value = "غير مسجل";
        logoutBtn.innerText = "العودة لتسجيل الدخول";
    } else {
        userEmailDisplay.innerText = currentUserData.email || "-";
        
        let dateString = "-";
        if (currentUserData.createdAt) {
            const d = currentUserData.createdAt.toDate ? currentUserData.createdAt.toDate() : new Date(currentUserData.createdAt);
            dateString = d.toLocaleDateString('ar-IQ');
        }
        userDateDisplay.innerText = dateString;
        
        userIdDisplay.value = currentUserData.uid || "-";
        logoutBtn.innerText = "تسجيل الخروج";
    }
}

async function loadVideos() {
    videosGrid.innerHTML = '<p style="text-align:center;">جاري تحميل الكورسات...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "videos"));
        
        const videosList = [];
        querySnapshot.forEach((docSnap) => {
            videosList.push(docSnap.data());
        });
        
        // ترتيب الفيديوهات حسب الوقت على جانب العميل لتجنب مشكلة اختفاء الملفات التي ليس لها وقت
        videosList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        videosGrid.innerHTML = '';
        
        videosList.forEach((data) => {
            let displayImg = data.thumbnail;
            let displayVid = data.video;

            // Auto-fix BunnyCDN Storage URLs to Pull Zone URLs for displaying/playing
            if (displayImg && displayImg.includes('storage.bunnycdn.com/kors/')) {
                displayImg = displayImg.replace('storage.bunnycdn.com/kors/', 'kores.b-cdn.net/');
            }
            if (displayVid && displayVid.includes('storage.bunnycdn.com/kors/')) {
                displayVid = displayVid.replace('storage.bunnycdn.com/kors/', 'kores.b-cdn.net/');
            }
            
            // Auto-fix blob urls (which are invalid across sessions)
            if (displayImg && displayImg.startsWith('blob:')) {
                displayImg = 'https://via.placeholder.com/300x200?text=الصورة+غير+صالحة';
            }

            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <h3>${data.name}</h3>
                <img src="${displayImg}" onerror="this.src='https://via.placeholder.com/300x200?text=خطأ'" alt="${data.name}" />
            `;
            
            card.addEventListener('click', () => {
                if (data.type === 'paid') {
                    if (!currentUserData || !currentUserData.subscribed) {
                        subscriptionModal.classList.remove('hidden');
                    } else {
                        openVideo(displayVid, data.name);
                    }
                } else {
                    openVideo(displayVid, data.name);
                }
            });
            
            videosGrid.appendChild(card);
        });
        
        if(videosList.length === 0) {
            videosGrid.innerHTML = '<p style="text-align:center;">لا توجد فيديوهات حالياً.</p>';
        }
    } catch(error) {
        console.error(error);
        videosGrid.innerHTML = '<p style="text-align:center; color: red;">حدث خطأ أثناء تحميل الفيديوهات.</p>';
    }
}

const playerIframe = document.getElementById('player-iframe');

function openVideo(videoUrl, videoName) {
    videoModalTitle.innerText = videoName;
    
    if (videoUrl && videoUrl.includes('iframe.mediadelivery.net')) {
        playerVideo.classList.add('hidden');
        playerVideo.src = '';
        playerIframe.classList.remove('hidden');
        playerIframe.src = videoUrl + '?autoplay=true';
    } else {
        playerIframe.classList.add('hidden');
        playerIframe.src = '';
        playerVideo.classList.remove('hidden');
        playerVideo.src = videoUrl;
    }
    
    videoModal.classList.remove('hidden');
}

closeVideoBtn.addEventListener('click', () => {
    playerVideo.pause();
    playerVideo.src = '';
    playerIframe.src = '';
    videoModal.classList.add('hidden');
});

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

subscriptionModal.addEventListener('click', (e) => {
    if (e.target === subscriptionModal) {
        subscriptionModal.classList.add('hidden');
    }
});

closeSubBtn.addEventListener('click', () => {
    subscriptionModal.classList.add('hidden');
});

copyIdBtn.addEventListener('click', () => {
    if (userIdDisplay.value && userIdDisplay.value !== 'غير مسجل') {
        navigator.clipboard.writeText(userIdDisplay.value);
        copyIdBtn.innerText = 'تم النسخ!';
        setTimeout(() => copyIdBtn.innerText = 'نسخ', 2000);
    }
});

whatsappBtn.addEventListener('click', () => {
    window.open('https://wa.me/9647729373260', '_blank');
});

subWhatsappBtn.addEventListener('click', () => {
    window.open('https://wa.me/9647729373260', '_blank');
});

logoutBtn.addEventListener('click', async () => {
    if (currentUserData) {
        await signOut(auth);
    }
    window.location.reload();
});

// -------------------------------------------------------------
// حماية المحتوى ومنع تسريب الفيديوهات

// 1. منع النقر بزر الماوس الأيمن (تعطيل حفظ الفيديو أو نسخ النص)
document.addEventListener('contextmenu', event => event.preventDefault());

// 2. منع اختصارات لوحة المفاتيح الشائعة لأدوات المطور وتصوير الشاشة
document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) || 
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))) {
        e.preventDefault();
        return false;
    }
    
    // محاولة منع Print Screen (ملاحظة: لا تعمل على جميع المتصفحات/الأنظمة بشكل كامل)
    if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('يحظر نسخ وتصوير محتويات هذا الكورس - النظام يراقبك');
        e.preventDefault();
    }
});

// 3. إيقاف الفيديو عند فقدان التركيز (تغيير النافذة أو بدء تسجيل باستخدام برامج خارجية قد يسبب فقدان التركيز)
window.addEventListener('blur', () => {
    if(playerVideo && !playerVideo.paused) {
        playerVideo.pause();
    }
});
