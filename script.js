//map scroll
document.querySelector('#map summary').addEventListener('click', () => {
    setTimeout(() => {
        document.querySelector('#map').scrollIntoView({ behavior: 'smooth' });
    }, 50);
});
//----------------------------------