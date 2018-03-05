
const path = require('path');

// Determine the absolute path. 
function workspace(relativePath, keepsRelativeToCWD) {
    if (Array.isArray(relativePath)) {
        return relativePath.map(p => workspace(p, keepsRelativeToCWD));
    }
    else {
        let root = path.join(__dirname, '..');
        if (keepsRelativeToCWD) {
            let rel = path.relative(root, process.cwd());
            return path.join(rel, relativePath);
        }
        else {
            return path.join(root, relativePath);
        }
    }
}

// Utility to link resource to html.
function styleLink(url) {
    if (Array.isArray(url)) {
        return url.map(p => styleLink(p)).join('');
    }
    else {
        return '\n<link rel="stylesheet" href="'+url+'"/>';
    }

    return '\n<link rel="stylesheet" href="'+url+'"/>';
}
function scriptLink(url) {
    if (Array.isArray(url)) {
        return url.map(p => scriptLink(p)).join('');
    }
    else {
        return '\n<script type="text/javascript" src="'+url+'"></script>';
    }
}
function scriptContent(content) {
    return '\n<script type="text/javascript">\n'+content+'\n</script>';
}
function iconLink(url) {
    const apple = 'apple-touch-icon';
    const favicon = 'favicon';
    const suffix = '.png';
    const ico = '.ico';

    let file = url.lastIndexOf('/') >= 0 ? url.substring(url.lastIndexOf('/') + 1) : file;
    if (file.startsWith(apple) && file.endsWith('.png')) {
        let size = file.substring(apple.length, file.lastIndexOf('.png'));
        if (size.startsWith('-')) {
            size = size.substring(1);
        }
        return '\n<link rel="apple-touch-icon"'
            + (size.length > 0 ? (' size="'+size+'"') : '')
            + ' href="'+url+'" />';
    }
    else if (file.startsWith(favicon) && file.endsWith('.png')) {
        let size = file.substring(favicon.length, file.lastIndexOf('.png'));
        if (size.startsWith('-')) {
            size = size.substring(1);
        }
        return '\n<link rel="icon" type="image/png"'
            + (size.length > 0 ? (' size="'+size+'"') : '')
            + ' href="'+url+'" />';
    }
    else if (file == 'favicon.ico') {
        return '\n<link rel="shortcut icon" type="image/x-icon" href="'+url+'" />';
    }
    else if (file == 'safari-pinned-tab.svg') {
        return '\n<link rel="mask-icon" href="'+url+'" color="#FFC843" />'
    }
    return '';
}

exports.workspace = workspace;
exports.styleLink = styleLink;
exports.scriptLink = scriptLink;
exports.scriptContent = scriptContent;
exports.iconLink = iconLink;
