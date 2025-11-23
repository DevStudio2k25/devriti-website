document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Optional: Add staggered animation delay to cards for a nicer entrance
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Load features from Supabase with add/edit functionality
    window.DevritiSupabase.loadFeaturesFromSupabase();

    // Setup modal event listeners
    document.getElementById('addFeatureForm').addEventListener('submit', window.DevritiSupabase.handleAddFeatureSubmit);
    document.getElementById('addSubFeatureForm').addEventListener('submit', window.DevritiSupabase.handleAddSubFeatureSubmit);

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            window.DevritiSupabase.closeModals();
        }
    };
});
