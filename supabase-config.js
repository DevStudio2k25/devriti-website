// Supabase Configuration for Devriti Features
const SUPABASE_URL = 'https://luozpkidddegpowqytey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3pwa2lkZGRlZ3Bvd3F5dGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODUxNjQsImV4cCI6MjA3MzU2MTE2NH0.POfWhooXtr2Gg4MOBh8Sy3uCtLmZptul9Y3M1kvKP_o';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if online
let isOnline = navigator.onLine;
let currentCategory = '';
let currentFeatureId = null;

// Listen for online/offline events
window.addEventListener('online', () => {
    isOnline = true;
    document.querySelector('.offline-message')?.remove();
    loadFeaturesFromSupabase();
});

window.addEventListener('offline', () => {
    isOnline = false;
    showOfflineMessage();
});

function showOfflineMessage() {
    const existing = document.querySelector('.offline-message');
    if (existing) return;
    
    const message = document.createElement('div');
    message.className = 'offline-message';
    message.innerHTML = '<i class="fa-solid fa-wifi"></i> You are offline. Features will load when connection is restored.';
    document.querySelector('.content-area').prepend(message);
}

// Fetch all features by category
async function fetchFeaturesByCategory(category) {
    try {
        const { data, error } = await supabase
            .from('devriti_features')
            .select('*')
            .eq('category', category)
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        // Cache data in localStorage
        localStorage.setItem(`devriti_${category}`, JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Error fetching features:', error);
        
        // Try to load from cache if offline
        const cached = localStorage.getItem(`devriti_${category}`);
        if (cached) {
            console.log(`Loading ${category} from cache`);
            return JSON.parse(cached);
        }
        return [];
    }
}

// Fetch all features
async function fetchAllFeatures() {
    const { data, error } = await supabase
        .from('devriti_features')
        .select('*')
        .order('category', { ascending: true });
    
    if (error) {
        console.error('Error fetching features:', error);
        return [];
    }
    return data;
}

// Add new feature to database
async function addNewFeature(category, featureName, iconClass, description) {
    try {
        const { data, error } = await supabase
            .from('devriti_features')
            .insert([
                {
                    category: category,
                    feature_name: featureName,
                    icon_class: iconClass,
                    description: description,
                    sub_features: { features: [] },
                    is_highlight: false
                }
            ])
            .select();
        
        if (error) throw error;
        
        showSuccessMessage('✅ Feature added successfully!');
        return data[0];
    } catch (error) {
        console.error('Error adding feature:', error);
        showErrorMessage('❌ Failed to add feature. Please try again.');
        return null;
    }
}

// Update feature with new sub-feature
async function addSubFeatureToCard(featureId, newSubFeature) {
    try {
        // First fetch the current feature
        const { data: currentFeature, error: fetchError } = await supabase
            .from('devriti_features')
            .select('sub_features')
            .eq('id', featureId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Update sub_features
        const subFeatures = currentFeature.sub_features || { features: [] };
        if (!subFeatures.features) {
            subFeatures.features = [];
        }
        subFeatures.features.push(newSubFeature);
        
        // Update in database
        const { error: updateError } = await supabase
            .from('devriti_features')
            .update({ sub_features: subFeatures })
            .eq('id', featureId);
        
        if (updateError) throw updateError;
        
        showSuccessMessage('✅ Feature item added successfully!');
        return true;
    } catch (error) {
        console.error('Error updating feature:', error);
        showErrorMessage('❌ Failed to add feature item. Please try again.');
        return false;
    }
}

// Show success message
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message success';
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message error';
    toast.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Delete/Mark feature as not required
async function markFeatureNotRequired(featureId) {
    try {
        const { error } = await supabase
            .from('devriti_features')
            .update({ is_highlight: true })
            .eq('id', featureId);
        
        if (error) throw error;
        
        showSuccessMessage('✅ Marked as Not Required!');
        return true;
    } catch (error) {
        console.error('Error marking feature:', error);
        showErrorMessage('❌ Failed to mark feature.');
        return false;
    }
}

// Edit feature name
async function editFeatureName(featureId, newName) {
    try {
        const { error } = await supabase
            .from('devriti_features')
            .update({ feature_name: newName })
            .eq('id', featureId);
        
        if (error) throw error;
        
        showSuccessMessage('✅ Feature updated!');
        return true;
    } catch (error) {
        console.error('Error updating feature:', error);
        showErrorMessage('❌ Failed to update feature.');
        return false;
    }
}

// Delete sub-feature from card
async function deleteSubFeature(featureId, featureIndex) {
    try {
        const { data: currentFeature, error: fetchError } = await supabase
            .from('devriti_features')
            .select('sub_features')
            .eq('id', featureId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const subFeatures = currentFeature.sub_features || { features: [] };
        if (subFeatures.features && subFeatures.features[featureIndex]) {
            subFeatures.features.splice(featureIndex, 1);
        }
        
        const { error: updateError } = await supabase
            .from('devriti_features')
            .update({ sub_features: subFeatures })
            .eq('id', featureId);
        
        if (updateError) throw updateError;
        
        showSuccessMessage('✅ Feature item removed!');
        return true;
    } catch (error) {
        console.error('Error deleting sub-feature:', error);
        showErrorMessage('❌ Failed to remove feature item.');
        return false;
    }
}

// Edit sub-feature
async function editSubFeature(featureId, featureIndex, newText) {
    try {
        const { data: currentFeature, error: fetchError } = await supabase
            .from('devriti_features')
            .select('sub_features')
            .eq('id', featureId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const subFeatures = currentFeature.sub_features || { features: [] };
        if (subFeatures.features && subFeatures.features[featureIndex]) {
            subFeatures.features[featureIndex] = newText;
        }
        
        const { error: updateError } = await supabase
            .from('devriti_features')
            .update({ sub_features: subFeatures })
            .eq('id', featureId);
        
        if (updateError) throw updateError;
        
        showSuccessMessage('✅ Feature item updated!');
        return true;
    } catch (error) {
        console.error('Error editing sub-feature:', error);
        showErrorMessage('❌ Failed to update feature item.');
        return false;
    }
}

// Toggle edit mode for a card
function toggleEditMode(featureId) {
    const card = document.querySelector(`[data-feature-id="${featureId}"]`);
    if (card) {
        card.classList.toggle('edit-mode');
        const btn = card.querySelector('.edit-mode-btn');
        if (btn) {
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (card.classList.contains('edit-mode')) {
                icon.className = 'fa-solid fa-check';
                text.textContent = 'Done';
            } else {
                icon.className = 'fa-solid fa-pen-to-square';
                text.textContent = 'Edit Mode';
            }
        }
    }
}

// Generate feature card HTML from database data
function generateFeatureCard(feature) {
    const highlightClass = feature.is_highlight ? 'highlight not-required' : '';
    const notRequiredTag = feature.is_highlight ? '<span class="not-required-tag">Not Required</span>' : '';
    let featuresHTML = '';
    
    if (feature.sub_features) {
        const subFeatures = feature.sub_features;
        
        if (subFeatures.features && subFeatures.features.length > 0) {
            featuresHTML = '<ul>' + subFeatures.features.map((f, index) => `
                <li>
                    <span class="feature-text">${f}</span>
                    <div class="feature-item-actions">
                        <button class="mini-edit-btn" onclick="window.DevritiSupabase.editSubFeatureItem(${feature.id}, ${index}, '${f.replace(/'/g, "\\'")}')" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="mini-delete-btn" onclick="window.DevritiSupabase.deleteSubFeatureItem(${feature.id}, ${index})" title="Remove">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                </li>
            `).join('') + '</ul>';
        }
        
        if (subFeatures.sections && subFeatures.sections.length > 0) {
            featuresHTML = subFeatures.sections.map((section, sectionIndex) => `
                <div class="sub-section">
                    <h3>${section.name}</h3>
                    <ul>${section.features.map((f, fIndex) => `
                        <li>
                            <span class="feature-text">${f}</span>
                            <div class="feature-item-actions">
                                <button class="mini-edit-btn" onclick="window.DevritiSupabase.editSectionFeature(${feature.id}, ${sectionIndex}, ${fIndex}, '${f.replace(/'/g, "\\'")}')" title="Edit">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="mini-delete-btn" onclick="window.DevritiSupabase.deleteSectionFeature(${feature.id}, ${sectionIndex}, ${fIndex})" title="Remove">
                                    <i class="fa-solid fa-times"></i>
                                </button>
                            </div>
                        </li>
                    `).join('')}</ul>
                </div>
            `).join('');
        }
    }
    
    return `
        <div class="feature-card ${highlightClass}" data-feature-id="${feature.id}">
            <button class="edit-mode-btn" onclick="window.DevritiSupabase.toggleEditMode(${feature.id})">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>Edit Mode</span>
            </button>
            <div class="card-actions">
                <button class="edit-btn" onclick="window.DevritiSupabase.showEditDialog(${feature.id}, '${feature.feature_name.replace(/'/g, "\\'")}')" title="Edit Card Name">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="window.DevritiSupabase.markAsNotRequired(${feature.id})" title="Mark as Not Required">
                    <i class="fa-solid fa-ban"></i>
                </button>
            </div>
            ${notRequiredTag}
            <h2>${feature.feature_name}</h2>
            ${featuresHTML}
            <button class="add-sub-feature-btn" onclick="window.DevritiSupabase.showAddSubFeatureDialog(${feature.id}, '${feature.feature_name.replace(/'/g, "\\'")}')" >
                <i class="fa-solid fa-plus"></i> Add Feature
            </button>
        </div>
    `;
}

// Load features dynamically from Supabase
async function loadFeaturesFromSupabase() {
    const coreFeatures = await fetchFeaturesByCategory('core');
    const aiFeatures = await fetchFeaturesByCategory('ai');
    const futureFeatures = await fetchFeaturesByCategory('future');
    
    // Populate Core Features
    const coreGrid = document.querySelector('#core .features-grid');
    if (coreGrid) {
        coreGrid.innerHTML = coreFeatures.map(generateFeatureCard).join('') + 
            `<div class="feature-card add-new-card" onclick="window.DevritiSupabase.showAddNewCardDialog('core')">
                <h2>+ Add New Feature</h2>
                <p>Click to add a new feature card</p>
            </div>`;
    }
    
    // Populate AI Features
    const aiGrid = document.querySelector('#ai .features-grid');
    if (aiGrid) {
        aiGrid.innerHTML = aiFeatures.map(generateFeatureCard).join('') +
            `<div class="feature-card add-new-card" onclick="window.DevritiSupabase.showAddNewCardDialog('ai')">
                <h2>+ Add New Feature</h2>
                <p>Click to add a new feature card</p>
            </div>`;
    }
    
    // Populate Future Features
    const futureGrid = document.querySelector('#future .features-grid');
    if (futureGrid) {
        futureGrid.innerHTML = futureFeatures.map(generateFeatureCard).join('') +
            `<div class="feature-card add-new-card" onclick="window.DevritiSupabase.showAddNewCardDialog('future')">
                <h2>+ Add New Feature</h2>
                <p>Click to add a new feature card</p>
            </div>`;
    }
    
    console.log('✅ Features loaded from Supabase!');
    console.log(`Core: ${coreFeatures.length}, AI: ${aiFeatures.length}, Future: ${futureFeatures.length}`);
}

// Show modal to add sub-feature
function showAddSubFeatureDialog(featureId, featureName) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet to add features.');
        return;
    }
    
    currentFeatureId = featureId;
    const modal = document.getElementById('addSubFeatureModal');
    const cardName = document.getElementById('subFeatureCardName');
    cardName.textContent = `Adding to: ${featureName}`;
    modal.style.display = 'block';
}

// Show modal to add new feature card
function showAddNewCardDialog(category) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet to add features.');
        return;
    }
    
    currentCategory = category;
    const modal = document.getElementById('addFeatureModal');
    modal.style.display = 'block';
}

// Close modals
function closeModals() {
    document.getElementById('addFeatureModal').style.display = 'none';
    document.getElementById('addSubFeatureModal').style.display = 'none';
}

// Handle add feature form submit
function handleAddFeatureSubmit(e) {
    e.preventDefault();
    
    const featureName = document.getElementById('featureName').value.trim();
    
    showLoading();
    
    addNewFeature(currentCategory, featureName, '', '').then(data => {
        hideLoading();
        if (data) {
            closeModals();
            document.getElementById('addFeatureForm').reset();
            loadFeaturesFromSupabase();
        }
    });
}

// Handle add sub-feature form submit
function handleAddSubFeatureSubmit(e) {
    e.preventDefault();
    
    const subFeatureText = document.getElementById('subFeatureText').value.trim();
    
    showLoading();
    
    addSubFeatureToCard(currentFeatureId, subFeatureText).then(success => {
        hideLoading();
        if (success) {
            closeModals();
            document.getElementById('addSubFeatureForm').reset();
            loadFeaturesFromSupabase();
        }
    });
}

// Show loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay')?.remove();
}

// Show edit dialog
function showEditDialog(featureId, currentName) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet to edit features.');
        return;
    }
    
    const newName = prompt('Edit Feature Name:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
        showLoading();
        editFeatureName(featureId, newName.trim()).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Mark as not required
function markAsNotRequired(featureId) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet.');
        return;
    }
    
    if (confirm('Mark this feature as "Not Required"?')) {
        showLoading();
        markFeatureNotRequired(featureId).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Edit sub-feature item
function editSubFeatureItem(featureId, index, currentText) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet.');
        return;
    }
    
    const newText = prompt('Edit Feature Item:', currentText);
    if (newText && newText.trim() && newText !== currentText) {
        showLoading();
        editSubFeature(featureId, index, newText.trim()).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Delete sub-feature item
function deleteSubFeatureItem(featureId, index) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet.');
        return;
    }
    
    if (confirm('Remove this feature item?')) {
        showLoading();
        deleteSubFeature(featureId, index).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Edit section feature
function editSectionFeature(featureId, sectionIndex, featureIndex, currentText) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet.');
        return;
    }
    
    const newText = prompt('Edit Feature Item:', currentText);
    if (newText && newText.trim() && newText !== currentText) {
        showLoading();
        editSectionFeatureItem(featureId, sectionIndex, featureIndex, newText.trim()).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Delete section feature
function deleteSectionFeature(featureId, sectionIndex, featureIndex) {
    if (!isOnline) {
        alert('⚠️ You are offline. Please connect to internet.');
        return;
    }
    
    if (confirm('Remove this feature item?')) {
        showLoading();
        deleteSectionFeatureItem(featureId, sectionIndex, featureIndex).then(success => {
            hideLoading();
            if (success) {
                loadFeaturesFromSupabase();
            }
        });
    }
}

// Edit section feature item in database
async function editSectionFeatureItem(featureId, sectionIndex, featureIndex, newText) {
    try {
        const { data: currentFeature, error: fetchError } = await supabase
            .from('devriti_features')
            .select('sub_features')
            .eq('id', featureId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const subFeatures = currentFeature.sub_features || { sections: [] };
        if (subFeatures.sections && subFeatures.sections[sectionIndex] && subFeatures.sections[sectionIndex].features[featureIndex]) {
            subFeatures.sections[sectionIndex].features[featureIndex] = newText;
        }
        
        const { error: updateError } = await supabase
            .from('devriti_features')
            .update({ sub_features: subFeatures })
            .eq('id', featureId);
        
        if (updateError) throw updateError;
        
        showSuccessMessage('✅ Feature item updated!');
        return true;
    } catch (error) {
        console.error('Error editing section feature:', error);
        showErrorMessage('❌ Failed to update feature item.');
        return false;
    }
}

// Delete section feature item from database
async function deleteSectionFeatureItem(featureId, sectionIndex, featureIndex) {
    try {
        const { data: currentFeature, error: fetchError } = await supabase
            .from('devriti_features')
            .select('sub_features')
            .eq('id', featureId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const subFeatures = currentFeature.sub_features || { sections: [] };
        if (subFeatures.sections && subFeatures.sections[sectionIndex] && subFeatures.sections[sectionIndex].features[featureIndex]) {
            subFeatures.sections[sectionIndex].features.splice(featureIndex, 1);
        }
        
        const { error: updateError } = await supabase
            .from('devriti_features')
            .update({ sub_features: subFeatures })
            .eq('id', featureId);
        
        if (updateError) throw updateError;
        
        showSuccessMessage('✅ Feature item removed!');
        return true;
    } catch (error) {
        console.error('Error deleting section feature:', error);
        showErrorMessage('❌ Failed to remove feature item.');
        return false;
    }
}

// Export functions for use
window.DevritiSupabase = {
    fetchFeaturesByCategory,
    fetchAllFeatures,
    loadFeaturesFromSupabase,
    addNewFeature,
    addSubFeatureToCard,
    showAddSubFeatureDialog,
    showAddNewCardDialog,
    closeModals,
    handleAddFeatureSubmit,
    handleAddSubFeatureSubmit,
    showEditDialog,
    markAsNotRequired,
    editSubFeatureItem,
    deleteSubFeatureItem,
    toggleEditMode,
    editSectionFeature,
    deleteSectionFeature
};
