// Script to update all HTML files with mobile optimizations

const fs = require('fs');
const path = require('path');

// Public directory path
const publicDir = path.join(__dirname, '..');

// Get all HTML files
const htmlFiles = fs.readdirSync(publicDir)
    .filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to update`);

// Updates to apply to each file
const updates = [
    // Update viewport meta tag
    {
        find: /<meta name="viewport" content="width=device-width, initial-scale=1.0">/g,
        replace: '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
    },
    // Add mobile CSS link (after regular CSS)
    {
        find: /<link rel="stylesheet" href="css\/styles.css">/g,
        replace: '<link rel="stylesheet" href="css/styles.css">\n    <link rel="stylesheet" href="css/mobile.css">'
    },
    // Add mobile JS (before closing body tag)
    {
        find: /<\/body>/g,
        replace: '    <!-- Mobile optimizations -->\n    <script src="js/mobile-optimizations.js"></script>\n    <script src="js/mobile-nav.js"></script>\n</body>'
    },
    // Add touch-active style
    {
        find: /<\/style>/g,
        replace: '        /* Add active state for touch devices */\n        .touch-active {\n            opacity: 0.7;\n            transform: scale(0.98);\n        }\n    </style>'
    },
    // Wrap text in logout button for better mobile display
    {
        find: /<i class="fas fa-sign-out-alt"><\/i> Logout/g,
        replace: '<i class="fas fa-sign-out-alt"></i> <span class="btn-text">Logout</span>'
    }
];

// Additional updates for pages with forms
const formPageUpdates = [
    // Add form enhancements script
    {
        find: /<script src="js\/mobile-nav.js"><\/script>/g,
        replace: '<script src="js/mobile-nav.js"></script>\n    <script src="js/form-mobile-enhancements.js"></script>'
    }
];

// Identify form pages (these are known to have forms)
const formPages = ['add-chore.html', 'add-expense.html', 'create-join-home.html', 'manage-home.html', 'home-chat.html'];

// Process each HTML file
htmlFiles.forEach(fileName => {
    const filePath = path.join(publicDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply general updates
    updates.forEach(update => {
        if (update.find.test(content)) {
            content = content.replace(update.find, update.replace);
            updated = true;
        }
    });
    
    // Apply form-specific updates if this is a form page
    if (formPages.includes(fileName) || content.includes('<form')) {
        formPageUpdates.forEach(update => {
            if (update.find.test(content)) {
                content = content.replace(update.find, update.replace);
                updated = true;
            }
        });
        console.log(`Applied form enhancements to ${fileName}`);
    }
    
    // Save the file if updates were made
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${fileName}`);
    } else {
        console.log(`No updates needed for ${fileName}`);
    }
});

console.log('All HTML files have been updated with mobile optimizations'); 