// ===== إعداد Supabase =====
const SUPABASE_URL = 'https://mvuilygqgmzkggsxbhwe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dWlseWdxZ216a2dnc3hiaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjMxNTksImV4cCI6MjEwMzQ5OTE1OX0.c6yoXdtrt0fdrcvFL0XqXIqgSDgpvTPYYUCsOucq_rs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== حفظ الإعلان في Supabase =====
async function saveAdToSupabase(section, adData, imageFile) {
    try {
        let imageUrl = 'https://via.placeholder.com/400x200?text=صورة+الإعلان';

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${section}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('ad-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = await supabase.storage
                .from('ad-images')
                .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
        }

        const { error: insertError } = await supabase
            .from('ads')
            .insert([
                {
                    section: section,
                    title: adData.title,
                    description: adData.desc,
                    price: adData.price,
                    image_url: imageUrl
                }
            ]);

        if (insertError) throw insertError;

        return { success: true };
    } catch (error) {
        console.error('خطأ في الحفظ:', error);
        return { success: false, error: error.message };
    }
}

// ===== تحميل الإعلانات من Supabase =====
async function loadAdsFromSupabase() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const sectionMap = {
        'cars': 'سيارات',
        'clothes': 'ملابس',
        'products': 'منتجات',
        'realestate': 'عقارات',
        'food': 'مواد غذائية',
        'construction': 'مواد بناء'
    };

    const sectionKey = sectionMap[currentPage];
    if (!sectionKey) return;

    try {
        const { data: ads, error } = await supabase
            .from('ads')
            .select('*')
            .eq('section', sectionKey)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.querySelector('.ads-container');
        if (!container) return;

        const staticAds = container.querySelectorAll('.ad-item.static');
        container.innerHTML = '';
        staticAds.forEach(ad => container.appendChild(ad));

        ads.forEach(ad => {
            const div = document.createElement('div');
            div.className = 'ad-item';
            div.innerHTML = `
                <img src="${ad.image_url}" alt="${ad.title}">
                <div class="ad-content">
                    <h3>${ad.title}</h3>
                    <p class="desc">${ad.description || ''}</p>
                    <span class="price">${ad.price} ريال</span>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('خطأ في التحميل:', error);
    }
}

// ===== معالجة نموذج الإضافة =====
function handleAddAd(section) {
    const form = document.getElementById('addAdForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('adTitle').value;
        const desc = document.getElementById('adDesc').value;
        const price = document.getElementById('adPrice').value;
        const imageFile = document.getElementById('adImage').files[0];

        const adData = {
            title: title,
            desc: desc,
            price: price
        };

        const result = await saveAdToSupabase(section, adData, imageFile);

        if (result.success) {
            alert('✅ تم إضافة الإعلان بنجاح!');
            window.location.reload();
        } else {
            alert('❌ حدث خطأ: ' + result.error);
        }
    });
}

// ===== البحث =====
document.addEventListener('DOMContentLoaded', function() {
    loadAdsFromSupabase();

    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim().toLowerCase();
                const ads = document.querySelectorAll('.ad-item');
                ads.forEach(ad => {
                    const text = ad.textContent.toLowerCase();
                    ad.style.display = text.includes(query) ? 'block' : 'none';
                });
            }
        });
    }
});
