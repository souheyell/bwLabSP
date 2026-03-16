export function bindControls(sliders, onChange) {
    const params = {};
    
    // Read state initially
    sliders.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        
        let type = el.type;
        if(type === 'checkbox') {
            params[id] = el.checked;
        } else if(el.tagName.toLowerCase() === 'select') {
            params[id] = el.value;
        } else {
            params[id] = parseFloat(el.value);
        }
        
        // Listeners
        el.addEventListener('input', (e) => {
            if(type === 'checkbox') {
                params[id] = e.target.checked;
            } else if(el.tagName.toLowerCase() === 'select') {
                params[id] = e.target.value;
            } else {
                params[id] = parseFloat(e.target.value);
            }
            // Update display label
            const valDisplay = document.getElementById(id + "-val");
            if(valDisplay) valDisplay.textContent = params[id];
            
            onChange(params);
        });
    });
    
    return params;
}
