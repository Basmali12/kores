/* /user/script.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

const welcomeScreen = document.getElementById('welcome-screen');
const appScreen = document.getElementById('app-screen');
const continueBtn = document.getElementById('continue-btn');
const videosGrid = document.getElementById('videos-grid');

const videoModal = document.getElementById('video-modal');
const playerVideo = document.getElementById('player-video');
const videoModalTitle = document.getElementById('video-modal-title');
const closeVideoBtn = document.getElementById('close-video-btn');

const warningModal = document.getElementById('warning-modal');
const agreeWarningBtn = document.getElementById('agree-warning-btn');

continueBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    warningModal.classList.remove('hidden');
});

agreeWarningBtn.addEventListener('click', () => {
    warningModal.classList.add('hidden');
    appScreen.classList.remove('hidden-app');
    appScreen.classList.add('active'); // active uses flex display
    document.body.style.overflow = 'auto'; // allow scrolling now
    loadVideos();
});

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
                <img src="${displayImg}" onerror="this.src='https://via.placeholder.com/300x200?text=خطأ'" alt="${data.name}" />
                <h3>${data.name}</h3>
            `;
            
            card.addEventListener('click', () => {
                openVideo(displayVid, data.name);
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
        document.body.classList.add('blurred-screen');
        setTimeout(() => document.body.classList.remove('blurred-screen'), 3000); // تعتيم الشاشة لـ 3 ثواني
        e.preventDefault();
    }
});

// 3. إيقاف الفيديو وتعتيم الشاشة عند فقدان التركيز (تغيير النافذة أو بدء تسجيل باستخدام برامج خارجية قد يسبب فقدان التركيز)
window.addEventListener('blur', () => {
    if(playerVideo && !playerVideo.paused) {
        playerVideo.pause();
    }
    // وضع طبقة سوداء على الشاشة
    document.body.classList.add('blurred-screen');
});

window.addEventListener('focus', () => {
    // إزالة الطبقة السوداء عند العودة
    document.body.classList.remove('blurred-screen');
});
