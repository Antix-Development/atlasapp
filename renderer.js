/*
AtlasApp - A basic texture packing application.
Copyright (c) Cliff Earl, Antix Development, 2022.
MIT License:
*/

'use-strict';

import * as rectPacker from './modules/rectpacker/rectpacker.js';
import * as electro from './modules/electro/electro.js';

const 
ATLASAPP_ID = 'atlasapp', // AtlasApp file identifier
ATLASAPP_FILE_FILTER = {name: 'AtlasApp Projects', extensions: ['aap']}, // Filetype filters
IMAGE_FILE_FILTER = {name: 'Images', extensions: ['png', 'webp']},

// Utility functions
clamp = (v, min, max) => (v < min ? min : v > max ? max : v),
getByID = (id) => (document.getElementById(id)),
emptyElement = (el) => el.innerHTML = '',
showElement = (el, state = true) => (state) ? el.classList.remove('hidden') : el.classList.add('hidden'),
highlightElement = (el, state = true) => (state) ? el.classList.add('highlight') : el.classList.remove('highlight'),
removeExtension = (fileName) => ((fileName.lastIndexOf('.') != -1) ? fileName.substr(0, fileName.lastIndexOf('.')) : fileName);

let 
project, // The project
projectModified, // True if the user edited the project

imageFolder = electro.currentDirectory(),
exportFolder = electro.currentDirectory(),

atlasWidth, // Dimensions of the atlas
atlasHeight,

contentDiv = getByID('content'),

navPane = getByID('nav'),
dragBar = getByID('drag'),
atlasPane = getByID('atlasContainer'),

resizing, // True if the user is resizing the editor panes
dragBarX = 200, // Position of the drag bar
dragWidth = 6,

// Resize nav and atlas containers
resize = (type) => {
  const 
  bounds = contentDiv.getBoundingClientRect(),
  // setWidth = (el, w) => el.style.width = `${w}px`,
  setDimensions = (el, w, h) => {
    el.style.width = `${w}px`;
    el.style.height = `${bounds.height - 36}px`;
  };

  dragBar.style.left = `${dragBarX}px`;
  setDimensions(dragBar, dragWidth);
  setDimensions(navPane, dragBarX);
  setDimensions(atlasPane, bounds.width - (dragBarX + dragWidth));

  atlasPane.style.left = `${dragBarX + 4}px`;
},
// Init resizing
mouseDown = (e) => {
  if (e.target === dragBar) {
    document.body.style.cursor = 'ew-resize';
    resizing = true;
  }
},
// Cancel resizing
mouseUp = (e) => {
  document.body.style.cursor = 'default';
  resizing = false;
},

 // Perform dragging
mouseMove = (e) => {
  if (resizing) {
    dragBarX = clamp(e.x - dragWidth, 204, window.innerWidth - 200);
    resize();
  };
};
// Add event handlers for editor pane resizing
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mouseup', mouseUp);
document.addEventListener('mousemove', mouseMove);
window.addEventListener('resize', resize);
resize(); // Perform initial resize

const 
// Pack images
packImages = () => {

  let images = project.images;

  // Apply padding
  for (let i = 0; i < images.length; i++) {
    let image = images[i];
    image.w = image.img.width + (project.padding * 2);
    image.h = image.img.height + (project.padding * 2);
  }

  // Pack and cache dimensions
  let {w, h} = rectPacker.packRects(images);
  atlasWidth = w;
  atlasHeight = h;

  // Reposition images in atlas display
  for (let i = 0; i < images.length; i++) {
    let image = images[i];
    // console.log(`name:${image.name} x:${image.x} y:${image.y} w:${image.w} h:${image.h}`);
    let img = image.img;
    img.style.left = `${image.x + project.padding}px`;
    img.style.top = `${image.y + project.padding}px`;
  }
},

// Create a new empty project
createEmptyProject = () => {
  project = {
    id: 'atlasapp',
    path: '',
    padding: false,
    images: [],
  };

  emptyElement(navPane);
  emptyElement(atlasPane);
},

// Close open project
closeProject = () => {
  if (project) {
    project = null;
    emptyElement(navPane);
    emptyElement(atlasPane);
    electro.setTitle('AtlasApp');
  }
},

// Begin a new project
newProject = () => {
  const fileName = electro.showSaveFileDialog({filter: ATLASAPP_FILE_FILTER});

  if (fileName) {
    setWindowTitle(fileName); // Set window title to include the project name
    createEmptyProject();
    project.path = fileName;

    writeProjectToDisk();

  } else {
    // User cancelled
  }
},

// Open an existing project
openProject = () => {
  const fileName = electro.showSingleFileDialog({title: 'Open Project', filter: ATLASAPP_FILE_FILTER});

  if (fileName) {
    const data = electro.loadTextFile(fileName);

    if (data.indexOf(ATLASAPP_ID) != -1) {
      const temp = JSON.parse(data);

      if (electro.exists(temp.imageFolder)) imageFolder = temp.imageFolder;
      if (electro.exists(temp.exportFolder)) exportFolder = temp.exportFolder;

      setWindowTitle(fileName);
      createEmptyProject();
      project.path = fileName;
      project.padding = temp.padding;

      if (temp.fileNames.length > 0) loadImages(temp.fileNames);

      projectModified = false;

    } else {
      electro.notify('Not an AtlasApp project', electro.TYPE_ERROR);
    }

  } else  {
    // User cancelled
  }
},

// Write project to persistent storage
writeProjectToDisk = () => {
  let temp = {
    id: ATLASAPP_ID,
    padding: project.padding,
    fileNames: [],
    imageFolder: imageFolder,
    exportFolder: exportFolder,
  };

  for (let i = 0; i < project.images.length; i++) {
    temp.fileNames[i] = project.images[i].path;
  }
  electro.saveTextFile(project.path, JSON.stringify(temp));

  projectModified = false;

  electro.notify('Project saved');
},

// Set AtlasApp's window title
setWindowTitle = (fileName) => electro.setTitle(`${electro.fileInfo(fileName).name} - AtlasApp`),

// Save the project under a different name
saveProjectAs = () => {
  if (project) {
    let fileName = electro.showSaveFileDialog({title: 'Save Project As', filter: ATLASAPP_FILE_FILTER});

    if (fileName) {
      setWindowTitle(fileName); // Set window title to include the project name
      project.path = fileName;

      writeProjectToDisk();

    } else {
      // User cancelled
    }
  }
},

// Save the current project
saveProject = () => {
  if (project) writeProjectToDisk();
},

// Get the sub-image with the given id
getImageByID = (id ) => {
  for (let i = 0; i < project.images.length; i++) {
    if (id === project.images[i].name) return project.images[i];
  }
  return null;
},

// Load the given array of images
loadImages = (fileNames, callback) => {
  let img = document.createElement('img'); // Create a new image

  // Following executed when the image has been loaded
  img.onload = () => {
    let li = document.createElement('li'),
    bounds = img.getBoundingClientRect(),

    // Create new sub-image object
    image = {
      name: electro.fileInfo(path).base, // Get filename with extension excluding path eg; (image.png)
      path: path, // Full path to file
      x: 0,
      y: 0,
      w: bounds.width,
      h: bounds.height,
      img: img,
      li: li
    }
    project.images.push(image);

    img.id = image.name;
    li.innerHTML = image.name;

    img.addEventListener('mouseenter', (e) => highlightElement(e.target));
    img.addEventListener('mouseleave',  (e) => highlightElement(e.target, false));
    img.addEventListener('click',  (e) => getImageByID(img.id).li.classList.toggle('selected'));

    li.addEventListener('click',  () => li.classList.toggle('selected'));

    atlasPane.appendChild(img); // Dump the visible inage in with the others

    if (fileNames.length === 0) { // All files loaded?
      // Add image names as list items in the navigation div, sorted into alphabetical order
      let images = project.images;
      images.sort((a, b) => a.name.localeCompare(b.name)); // Alpha sort
      for (let i = 0; i < images.length; i++) {
        navPane.appendChild(images[i].li);
      }

      packImages();

      projectModified = true;

      if (callback) callback();
      return;

    } else {
      loadImages(fileNames); // Load next file
    }
  };

  // Get files from the array and skip loading if it does not exist
  let path;
  do {
    path = fileNames.pop(); // Next file
  } while (!electro.exists(path));

  img.src = path; // Begin loading file
},

// Load new sub-images
addImages = () => {
  if (project) {
    let encounteredDuplicates = false,
   
    names = electro.showMultipleFileDialog({title: 'Select Images to Add', filter: IMAGE_FILE_FILTER, path: imageFolder});

    if (names) {
      imageFolder = electro.fileInfo(names[0]).dir;

      let images = project.images;
      for (let i = names.length - 1; i >= 0; i--) { // Remove duplicates (using their full path names eg; "c:\images\image.png")
        for (let j = 0; j < images.length; j++) {
          if (images[j].path === names[i]) {
            encounteredDuplicates = true;
            names.splice(i, 1);
            break;
          }
        }
      }
      if (encounteredDuplicates) electro.notify('Duplicate images were not imported.', electro.TYPE_WARNING);

      if (names.length > 0) loadImages(names); // Load images and packImages
    }

  } else {
    // User cancelled
  }
},

// Delete all selected sub-images
deleteImages = () => {
  if (project) {
    let items = navPane.getElementsByClassName('selected');

    if (items.length > 0) {
      for(let i = items.length - 1; i >= 0; i--) { // Iterate backwards becuase of "live" array bs
        const image = getImageByID(items[i].innerHTML);
        image.img.parentNode.removeChild(image.img);
        image.li.parentNode.removeChild(image.li);
        project.images.splice(project.images.indexOf(image), 1);
      }
    
      packImages();
      projectModified = true;
  
    } else {
      electro.notify('Nothing to delete', electro.TYPE_WARNING);
    }
  
  } else {
    // User cancelled
  }
},

// Toggle sub-image padding
togglePadding = () => {
  if (project) {
    (project.padding === 0) ? project.padding = 1 : project.padding = 0;
    electro.notify(`padding ${['disabled', 'enabled'][project.padding]}`);
    packImages();
  }
},

// Export texture-atlas and associated sub-image descriptors
exportProject = () => {
  if (project && project.images.length > 0) {
    let fileName = electro.showSaveFileDialog({title: 'Export Project', path: exportFolder});

    if (fileName) {
      exportFolder = electro.fileInfo(fileName).dir;

      let canvas = document.createElement('canvas'), // Create canvas to draw sub-images into
      ctx = canvas.getContext('2d');
      canvas.width = atlasWidth;
      canvas.height = atlasHeight;
    
      const padding = project.padding,
      images = project.images;
    
      let descriptors = '';
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        ctx.drawImage(image.img, image.x + padding, image.y + padding);
        descriptors += `${image.name}, ${image.x}, ${image.y}, ${image.w}, ${image.h}\n`;
      }
      const dataURL = canvas.toDataURL();
    
      fileName = removeExtension(fileName);
  
      electro.saveCanvas(`${fileName}.png`, dataURL);
      electro.saveTextFile(`${fileName}.txt`, descriptors);
  
      electro.notify('Project exported');

    } else {
      // User cancelled
    }
    
  } else {
    electro.notify('Nothing to export', electro.TYPE_WARNING);
  }
},

// Select all sub-images
selectAllImages = () => {
  if (project && project.images.length > 0) {
    for (let i = 0; i < project.images.length; i++) {
      project.images[i].li.classList.add('selected');
    }
  }
},

// Unselect all sub-images
selectNoImages = () => {
  if (project && project.images.length > 0) {
    for (let i = 0; i < project.images.length; i++) {
      project.images[i].li.classList.remove('selected');
    }
  }
},

// Menus
menus = [
  { // File Menu
    label: 'File',
    items: [
      { // New Project
        label: 'New Project',
        key: 'N',
        comboKeys: electro.TYPE_CTRL,
        click: newProject,
      },
      { // Open Project
        label: 'Open Project',
        key: 'O',
        comboKeys: electro.TYPE_CTRL,
        click: openProject,
      },
      { // Save Project
        label: 'Save Project',
        key: 'S',
        comboKeys: electro.TYPE_CTRL,
        click: saveProject,
      },
      { // Save Project As
        label: 'Save Project As',
        key: 'S',
        comboKeys: electro.TYPE_CTRL + electro.TYPE_ALT,
        click: saveProjectAs,
      },
      {},
      { // Close Project
        label: 'Close Project',
        key: 'W',
        comboKeys: electro.TYPE_CTRL,
        click: closeProject,
      },
      {},
      { // Export Project
        label: 'Export Project',
        key: 'E',
        comboKeys: electro.TYPE_CTRL,
        click: exportProject,
      },
      {},
      { // Quit
        label: 'Quit',
        key: 'F4',
        comboKeys: electro.TYPE_ALT,
        click: () => {electro.quitApplication();},
      },
    ]
  },
  { // Image Menu
    label: 'Images',
    items: [
      { // Add Images
        label: 'Add',
        key: 'A',
        comboKeys: electro.TYPE_CTRL,
        click: addImages,
      },
      { // Delete Selected
        label: 'Delete Selected',
        key: 'Delete',
        comboKeys: electro.TYPE_NONE,
        click: deleteImages,
      },
      {},
      { // Select All
        label: 'Select All',
        key: 'A',
        comboKeys: electro.TYPE_NONE,
        click: selectAllImages,
      },
      { // Select None
        label: 'Select None',
        key: 'N',
        comboKeys: electro.TYPE_NONE,
        click: selectNoImages,
      },
      {},
      { // Toggle Padding
        label: 'Toggle Padding',
        key: 'T',
        comboKeys: electro.TYPE_CTRL,
        click: togglePadding,
      },
    ]
  },

  { // Help Menu
    label: 'Help',
    items: [
      { // Abunt
        label: 'About',
        key: 'F1',
        comboKeys: electro.TYPE_NONE,
        click: () => {
          electro.dialog({
            title: 'About',
            body: 'AtlasApp version 1.0.<br>A basic texture packing application.<br>Copyright (c) 2022 Cliff Earl, Antix Development.<br><br><a target="_blank" href="https://github.com/Antix-Development/AtlasApp">Visit AtlasApp website</a><br><a target="_blank" href="https://www.buymeacoffee.com/antixdevelu">Buy Cliff a Coffee</a>',
            singleButton: true,
            yesText: 'Okay',
          });
        },
      },
    ]
  },

];

// Initialize Electro
electro.initialize({
  title: 'AtlasApp',
  icon: 'img/icon.svg',
  font: 'Segoe UI',
  menus: menus,
});

electro.enableConfig();
