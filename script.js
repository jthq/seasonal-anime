const SETTINGS = {
    spacing: 360,
    depthZ: 100,
    rotationY: 15,
    smoothness: 0.08,
    maxBlur: 1.5,
};

const icons = {
    live: `<svg class="icon-live" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>`,
    check: `<svg class="icon-check" viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    clock: `<svg class="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    tv: `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
};

const state = {
    target: 0,
    current: 0,
    lock: false,
    cardElements: [],
};

function escapeHtml(text) {
    if (text == null || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildCardTemplate(anime) {
    const score = anime.score ?? 'N/A';
    const starWidth = anime.score ? (anime.score / 10) * 100 : 0;
    const status =
        anime.status === 'Currently Airing'
            ? icons.live
            : anime.status === 'Not yet aired'
              ? icons.clock
              : icons.check;
    const imgUrl =
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        '';
    const title = escapeHtml(anime.title_english || anime.title);
    const synopsis = escapeHtml(
        anime.synopsis || 'No info available.'
    );

    return `
                <div class="card-wrapper">
                    <div class="anime-card" onclick="window.open('${anime.url}', '_blank')">
                        <div class="card-inner-mask">
                            <img src="${imgUrl}" class="card-bg" alt="">
                            <div class="gradient-overlay"></div>
                            <div class="fog-overlay"></div>
                            <div class="spotlight"></div>
                        </div>
                        <div class="card-content">
                            <h2 class="anime-title">${title}</h2>
                            <p class="anime-synopsis">${synopsis}</p>
                            <div class="tags-container">
                                <div class="tag">
                                    <div class="stars-container"><div class="stars-fill" style="width:${starWidth}%"></div></div>
                                    <span class="score-text">${score}</span>
                                </div>
                                <div class="tag">${icons.tv} ${anime.episodes ?? '?'} EPS</div>
                                <div class="tag status-box">${status}</div>
                            </div>
                            <a href="${anime.url}" target="_blank" class="btn-reserve" onclick="event.stopPropagation()">View Details</a>
                        </div>
                    </div>
                </div>`;
}

function animate() {
    state.current += (state.target - state.current) * SETTINGS.smoothness;

    state.cardElements.forEach((card, i) => {
        const distance = i - state.current;
        const absoluteDist = Math.abs(distance);

        const x = distance * SETTINGS.spacing;
        const z = absoluteDist * -SETTINGS.depthZ;
        const rotY = distance * -SETTINGS.rotationY;

        const scale = 1 + Math.max(0, (1 - absoluteDist) * 0.05);
        const blur = absoluteDist * SETTINGS.maxBlur;
        const opacity =
            absoluteDist > 4.5
                ? Math.max(0, 1 - (absoluteDist - 4.5))
                : 1;

        card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
        card.style.filter = `blur(${blur}px)`;
        card.style.opacity = opacity;
        card.style.zIndex = String(Math.round(100 - absoluteDist * 10));

        card.style.pointerEvents = absoluteDist < 0.5 ? 'auto' : 'none';

        const fog = card.querySelector('.fog-overlay');
        if (fog) fog.style.opacity = String(Math.min(0.4, absoluteDist * 0.08));
    });

    requestAnimationFrame(animate);
}

function initInteractions() {
    window.addEventListener(
        'wheel',
        (e) => {
            if (state.lock) return;
            const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
            const maxIndex = Math.max(0, state.cardElements.length - 1);
            state.target = Math.max(0, Math.min(state.target + dir, maxIndex));
            state.lock = true;
            setTimeout(() => {
                state.lock = false;
            }, 250);
        },
        { passive: true }
    );

    let start = 0;
    document.addEventListener(
        'touchstart',
        (e) => {
            start = e.touches[0].clientX;
        },
        { passive: true }
    );
    document.addEventListener(
        'touchend',
        (e) => {
            const diff = start - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                const dir = diff > 0 ? 1 : -1;
                const maxIndex = Math.max(0, state.cardElements.length - 1);
                state.target = Math.max(
                    0,
                    Math.min(state.target + dir, maxIndex)
                );
            }
        },
        { passive: true }
    );

    document.querySelectorAll('.anime-card').forEach((card) => {
        card.onmousemove = (ev) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', `${ev.clientX - rect.left}px`);
            card.style.setProperty('--y', `${ev.clientY - rect.top}px`);
        };
    });
}

function runCountdown() {
    const el = document.getElementById('season-timer');
    if (!el) return;
    const loop = () => {
        const now = new Date();
        const target = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3 + 3,
            1
        );
        const diff = target - now;
        const d = Math.floor(diff / 864e5);
        const h = Math.floor((diff % 864e5) / 36e5);
        const m = Math.floor((diff % 36e5) / 6e4);
        const s = Math.floor((diff % 6e4) / 1000);
        el.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };
    loop();
    setInterval(loop, 1000);
}

async function initApp() {
    const container = document.getElementById('scene-container');

    try {
        const response = await fetch(
            'https://api.jikan.moe/v4/seasons/now?limit=15'
        );
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.data?.length) {
            throw new Error('No anime in response');
        }

        document.getElementById('loading-msg')?.remove();

        result.data.forEach((anime) => {
            container.insertAdjacentHTML('beforeend', buildCardTemplate(anime));
        });

        state.cardElements = document.querySelectorAll('.card-wrapper');
        initInteractions();
    } catch (error) {
        console.error('Oh no, the internet broke!', error);
        container.innerHTML =
            '<p style="color:#f87171;padding:2rem;text-align:center;">API Busy. Please refresh.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    runCountdown();
    animate();
    initApp();
});
