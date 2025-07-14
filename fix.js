console.log('Fix script loaded');

window.onload = function() {
    console.log('Window loaded');
    
    function fixInputs() {
        const inputs = document.getElementsByTagName('input');
        const textareas = document.getElementsByTagName('textarea');
        
        console.log('Found', inputs.length, 'inputs and', textareas.length, 'textareas');
        
        function fixInput(input) {
            if (!input) return;
            const newInput = input.cloneNode(true);
            

            for (let attr of input.attributes) {
                if (attr.name !== 'style' && attr.name !== 'class') {
                    newInput.setAttribute(attr.name, attr.value);
                }
            }
            

            newInput.style.width = '100%';
            newInput.style.padding = '8px';
            newInput.style.margin = '4px 0';
            newInput.style.boxSizing = 'border-box';

            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('input', function() {
                console.log('Input changed:', this.id, '=', this.value);
            });
            
            console.log('Fixed input:', newInput.id || 'unnamed');
            return newInput;
        }
        
        // Fix all inputs
        for (let i = 0; i < inputs.length; i++) {
            fixInput(inputs[i]);
        }
        
        for (let i = 0; i < textareas.length; i++) {
            fixInput(textareas[i]);
        }
    }
    
    // Run the fix
    fixInputs();
    
    // Try again after a short delay in case of any race conditions
    setTimeout(fixInputs, 500);
    
    // Add a simple form submission handler
    const forms = document.getElementsByTagName('form');
    for (let i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Form submitted!');
        });
    }
};
