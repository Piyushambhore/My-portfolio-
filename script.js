document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Loader Sequence
    const loader = document.querySelector('.loader');
    const line = document.querySelector('.loader-line');
    
    // Animate line
    setTimeout(() => { line.style.width = "100%"; }, 200);

    // Hide loader & Reveal Content
    setTimeout(() => {
        loader.classList.add('hide');
        document.body.classList.add('loaded'); // This triggers all the CSS transitions
    }, 1200);

    // 2. Premium Parallax Effect
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        const midX = window.innerWidth / 2;
        const midY = window.innerHeight / 2;

        const offsetX = (x - midX) / 250; 
        const offsetY = (y - midY) / 250;

        const text = document.querySelector('.bg-text h1');
        const img = document.querySelector('.hero-image-wrapper');

        if(text && img) {
            text.style.transform = `translate(${offsetX * -25}px, ${offsetY * -25}px)`;
            img.style.transform = `translate(${offsetX * 10}px, ${offsetY * 10}px)`;
        }
    });

    // 3. DOCK INTERACTION (NEW)
    // This makes the white circle move when you click an icon
    const dockItems = document.querySelectorAll('.dock-item');

    dockItems.forEach(item => {
        item.addEventListener('click', function() {
            // Ignore the "Social" arrow or Avatar if you don't want them to be active
            if (this.classList.contains('group-trigger') || this.classList.contains('avatar-item')) return;

            // Remove 'active' class from all items
            dockItems.forEach(i => i.classList.remove('active'));

            // Add 'active' class to the clicked item
            this.classList.add('active');
        });
    });
});