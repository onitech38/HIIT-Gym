//map scroll
// map scroll
document.querySelector('#map summary').addEventListener('click', () => {
    setTimeout(() => {
        document.querySelector('#map').scrollIntoView({ behavior: 'smooth' });
    }, 50);
});

// fecha ao clicar fora
document.addEventListener('click', (e) => {
    const map = document.querySelector('#map');
    if (map.open && !map.contains(e.target)) {
        map.removeAttribute('open');
    }
});
//----------------------------------





